from fastapi import APIRouter, HTTPException, Depends, Query
from models import VerifyRequest, EmailRequest, SRPVerifyRequest
from utils.otp import generate_otp
from utils.email_utils import send_otp_email
from auth import create_access_token, get_current_user, create_user, authenticate_user
from starlette import status
from db_config import db
from bson import ObjectId
from pymongo import ReturnDocument
import srp, base64, time

router = APIRouter(prefix="/auth", tags=["Auth"])
users_collection = db["users"]
pending = db["pending_otps"]
srp_sessions = {}  # in-memory storage for demo

# --- Step 1: Request OTP ---
@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()
    if users_collection.find_one({"username": email}):
        raise HTTPException(400, "Email already registered")
    otp = generate_otp()
    expiry = time.time() + 300
    pending.find_one_and_update(
        {"email": email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True, return_document=ReturnDocument.AFTER
    )
    send_otp_email(email, otp)
    return {"message": "OTP sent"}

# --- Step 2: OTP + SRP verifier registration ---
@router.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    rec = db["pending_otps"].find_one({"email": email})

    if not rec:
        raise HTTPException(400, "No OTP request found")
    if rec["otp"] != data.otp:
        raise HTTPException(400, "Invalid OTP")
    if time.time() > rec["expiry"]:
        db["pending_otps"].delete_one({"email": email})
        raise HTTPException(400, "OTP expired")

    try:
        # Validate base64 and hex formats
        base64.b64decode(data.salt)
        bytes.fromhex(data.verifier)
    except Exception:
        raise HTTPException(400, "Invalid salt or verifier format")

    users_collection.insert_one({
        "username": email,
        "salt": data.salt,
        "verifier": data.verifier
    })
    db["pending_otps"].delete_one({"email": email})
    return {"message": "Registration successful"}


# --- Step 3: SRP Challenge ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(404, "User not found")

    try:
        salt = base64.b64decode(user["salt"])
        vkey = bytes.fromhex(user["verifier"])
    except Exception:
        raise HTTPException(500, "Stored salt or verifier is corrupted")

    # Store for session (for demo: in-memory, for prod: Redis or DB)
    srp_sessions[email] = {
        "salt": salt,
        "verifier": vkey
    }

    return {
        "salt": user["salt"],  # already base64
        "message": "Send client A and M1 to /srp/verify"
    }


# --- Step 4: SRP Verify ---  
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = srp_sessions.get(email)
    if not session:
        raise HTTPException(400, "No SRP challenge started")

    try:
        A = bytes.fromhex(data.clientEphemeralPublic)
        client_M = bytes.fromhex(data.clientSessionProof)
    except Exception:
        raise HTTPException(400, "Invalid hex in A or client proof")

    try:
        svr = srp.Verifier(email, session["salt"], session["verifier"], A)
        B = svr.get_challenge()
        HAMK = svr.verify_session(client_M)

        if not HAMK:
            raise HTTPException(401, "Client proof invalid")

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})
        del srp_sessions[email]

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        raise HTTPException(500, f"SRP error: {str(e)}")

# --- Step 3: SRP Challenge ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(404, "User not found")

    try:
        salt = base64.b64decode(user["salt"])
        verifier = bytes.fromhex(user["verifier"])
    except Exception:
        raise HTTPException(500, "Stored salt or verifier is corrupted")

    # For python-srp Verifier, no need to generate 'b' manually, handled internally
    try:
        # Create an SRP Verifier instance without client A yet
        # We'll store salt and verifier for later when client sends A
        session_doc = {
            "email": email,
            "salt": user["salt"],
            "verifier": user["verifier"],
            "timestamp": time.time()
        }
        db["srp_sessions"].update_one({"email": email}, {"$set": session_doc}, upsert=True)

        return {
  "salt": "<base64 salt>",
  "B": "<hex or base64 server ephemeral public>",
  "message": "Send A and M1 to /srp/verify"
}
    except Exception as e:
        raise HTTPException(500, f"SRP challenge setup failed: {str(e)}")


# --- Step 4: SRP Verify ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = db["srp_sessions"].find_one({"email": email})
    if not session:
        raise HTTPException(400, "No SRP challenge started or session expired")

    # Optionally: expire sessions older than 5 minutes
    if time.time() - session["timestamp"] > 300:
        db["srp_sessions"].delete_one({"email": email})
        raise HTTPException(400, "SRP session expired")

    try:
        salt_bytes = base64.b64decode(session["salt"])
        verifier_bytes = bytes.fromhex(session["verifier"])
        A = bytes.fromhex(data.clientEphemeralPublic)
        client_M = bytes.fromhex(data.clientSessionProof)
    except Exception:
        raise HTTPException(400, "Invalid hex or base64 encoding in request or session")

    try:
        svr = srp.Verifier(email, salt_bytes, verifier_bytes, A)
        B = svr.get_challenge()
        HAMK = svr.verify_session(client_M)

        if not HAMK:
            raise HTTPException(401, "Client proof invalid")

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        db["srp_sessions"].delete_one({"email": email})  # Clear session after use

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }
    except Exception as e:
        raise HTTPException(500, f"SRP verification failed: {str(e)}")
