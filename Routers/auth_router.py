from fastapi import APIRouter, HTTPException, Query
from models import VerifyRequest, EmailRequest, SRPVerifyRequest
from utils.otp import generate_otp
from utils.email_utils import send_otp_email
from auth import create_access_token
from starlette import status
from db_config import db
from pymongo import ReturnDocument
import srp
import base64
import time
import traceback

router = APIRouter(prefix="/auth", tags=["Auth"])
users_collection = db["users"]
pending = db["pending_otps"]
srp_sessions = db["srp_sessions"]

# In-memory storage for active SRP sessions (use Redis in production)
active_sessions = {}

# --- Helper: Cleanup expired SRP sessions ---
def cleanup_old_sessions():
    current_time = time.time()
    to_remove = [
        email for email, (_, timestamp) in active_sessions.items()
        if current_time - timestamp > 300
    ]
    for email in to_remove:
        del active_sessions[email]

# --- Step 1: Request OTP ---
@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()

    if users_collection.find_one({"username": email}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    otp = generate_otp()
    expiry = time.time() + 300  # OTP valid for 5 mins

    pending.find_one_and_update(
        {"email": email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    send_otp_email(email, otp)
    return {"message": "OTP sent"}

# --- Step 2: Verify OTP and store SRP verifier ---
@router.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    rec = pending.find_one({"email": email})

    if not rec:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No OTP request found")
    if rec["otp"] != data.otp:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OTP")
    if time.time() > rec["expiry"]:
        pending.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP expired")

    try:
        base64.b64decode(data.salt)
        bytes.fromhex(data.verifier)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid salt or verifier format")

    if users_collection.find_one({"username": email}):
        pending.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already registered")

    users_collection.insert_one({
        "username": email,
        "salt": data.salt,
        "verifier": data.verifier
    })

    pending.delete_one({"email": email})
    return {"message": "Registration successful"}

# --- Step 3: SRP Challenge (Login Part 1) ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})

    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    try:
        cleanup_old_sessions()

        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        verifier = srp.Verifier(email, salt_bytes, verifier_bytes, None)
        s, B = verifier.get_challenge()

        if s is None or B is None:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate challenge")

        active_sessions[email] = ({
            'salt': salt_bytes,
            'verifier': verifier_bytes,
            'username': email,
            'verifier_obj': verifier
        }, time.time())

        return {
            "salt": base64.b64encode(salt_bytes).decode(),
            "B": B.hex(),
            "message": "Send A and M1 to /srp/verify"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge error: {str(e)}")

# --- Step 4: SRP Verify (Login Part 2) ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()

    if email not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SRP challenge started or session expired"
        )

    session_data, timestamp = active_sessions[email]

    if time.time() - timestamp > 300:
        del active_sessions[email]
        srp_sessions.delete_one({"email": email})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SRP session expired"
        )

    try:
        client_A_hex = data.clientEphemeralPublic
        client_M1_hex = data.clientSessionProof

        A_bytes = bytes.fromhex(client_A_hex)
        M1_bytes = bytes.fromhex(client_M1_hex)

        # Recreate verifier object with A included
        verifier = srp.Verifier(
            username=email,
            salt=session_data['salt'],
            verifier=session_data['verifier'],
            A=A_bytes
        )
        _, _ = verifier.get_challenge()  # Ignored, required to set up internal state

        HAMK = verifier.verify_session(M1_bytes)

        if HAMK is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        del active_sessions[email]
        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        traceback.print_exc()
        if email in active_sessions:
            del active_sessions[email]
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SRP verification failed: {str(e)}"
        )

# --- Aliases for v2 compatibility ---
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    return srp_verify(data)
