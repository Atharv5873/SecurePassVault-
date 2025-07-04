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
srp_sessions = db["srp_sessions"]

# --- Step 1: Request OTP ---
@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()
    if users_collection.find_one({"username": email}):
        raise HTTPException(400, "Email already registered")

    otp = generate_otp()
    expiry = time.time() + 300  # 5 minutes

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
    rec = pending.find_one({"email": email})

    if not rec:
        raise HTTPException(400, "No OTP request found")
    if rec["otp"] != data.otp:
        raise HTTPException(400, "Invalid OTP")
    if time.time() > rec["expiry"]:
        pending.delete_one({"email": email})
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

    pending.delete_one({"email": email})
    return {"message": "Registration successful"}


# --- Step 3: SRP Challenge ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(404, "User not found")

    try:
        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        # Get challenge tuple
        challenge = srp.Verifier(email, salt_bytes, verifier_bytes).get_challenge()
        if not challenge:
            raise HTTPException(500, "Failed to generate SRP challenge")

        _, B = challenge  # ✅ Fix: unpack the tuple correctly

        srp_sessions.update_one(
            {"email": email},
            {"$set": {
                "salt": user["salt"],
                "verifier": user["verifier"],
                "B": B.hex(),
                "timestamp": time.time()
            }},
            upsert=True
        )

        return {
            "salt": user["salt"],
            "B": B.hex(),
            "message": "Send A and M1 to /srp/verify"
        }

    except Exception as e:
        raise HTTPException(500, f"SRP challenge setup failed: {str(e)}")


# --- Step 4: SRP Verify ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = srp_sessions.find_one({"email": email})

    if not session:
        raise HTTPException(400, "No SRP challenge started or session expired")

    # Expire sessions after 5 minutes
    if time.time() - session["timestamp"] > 300:
        srp_sessions.delete_one({"email": email})
        raise HTTPException(400, "SRP session expired")

    try:
        salt_bytes = base64.b64decode(session["salt"])
        verifier_bytes = bytes.fromhex(session["verifier"])
        A = bytes.fromhex(data.clientEphemeralPublic)
        client_M = bytes.fromhex(data.clientSessionProof)
        B = bytes.fromhex(session["B"])

        server = srp.Verifier(email, salt_bytes, verifier_bytes, A, B)
        HAMK = server.verify_session(client_M)

        if not HAMK:
            raise HTTPException(401, "Client proof invalid")

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        srp_sessions.delete_one({"email": email})  # Clear session

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        raise HTTPException(500, f"SRP verification failed: {str(e)}")
