from fastapi import APIRouter, HTTPException, Query
from models import EmailRequest, VerifyRequest, SRPVerifyRequest
from utils.otp import generate_otp
from utils.email_utils import send_otp_email
from auth import create_access_token
from starlette import status
from db_config import db
from pymongo import ReturnDocument
from srptools import SRPContext, SRPServerSession, constants
from hashlib import sha256
import base64, time, os, traceback

router = APIRouter(prefix="/auth", tags=["Auth"])
users_collection = db["users"]
pending = db["pending_otps"]
srp_sessions = db["srp_sessions"]

# === Helper: Generate salt and verifier ===
def create_salt_and_verifier(email: str, password: str):
    salt = os.urandom(16)
    salt_b64 = base64.b64encode(salt).decode()

    ctx = SRPContext(
        username=email,
        password=password,
        salt=salt,
        hash_alg=sha256,
        ng_type=constants.NG_2048
    )
    verifier = ctx.compute_verifier()
    return salt_b64, verifier.hex()

# === Step 1: Send OTP ===
@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()

    if users_collection.find_one({"username": email}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    otp = generate_otp()
    expiry = time.time() + 300  # 5 mins

    pending.find_one_and_update(
        {"email": email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True, return_document=ReturnDocument.AFTER
    )

    send_otp_email(email, otp)
    return {"message": "OTP sent"}

# === Step 2: Verify OTP and register user ===
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

    if users_collection.find_one({"username": email}):
        pending.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already registered")

    try:
        salt_b64, verifier_hex = create_salt_and_verifier(email, data.password)
        users_collection.insert_one({
            "username": email,
            "salt": salt_b64,
            "verifier": verifier_hex
        })

        pending.delete_one({"email": email})
        return {"message": "Registration successful"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Registration failed")

# === Step 3: SRP Challenge ===
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})

    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    try:
        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        ctx = SRPContext(
            username=email,
            salt=salt_bytes,
            verifier=verifier_bytes,
            hash_alg=sha256,
            ng_type=constants.NG_2048
        )

        server_session = SRPServerSession(ctx)
        B = server_session.public

        srp_sessions.update_one(
            {"email": email},
            {"$set": {
                "salt": user["salt"],
                "verifier": user["verifier"],
                "B": B.hex(),
                "private": server_session.private.hex(),
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
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge error: {str(e)}")

# === Step 4: SRP Verify ===
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = srp_sessions.find_one({"email": email})

    if not session:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No SRP challenge started or session expired")

    if time.time() - session["timestamp"] > 300:
        srp_sessions.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="SRP session expired")

    try:
        salt_b64 = session['salt']
        verifier_hex = session['verifier']
        B_hex = session['B']
        priv_hex = session['private']
        A_hex = data.clientEphemeralPublic
        M1_hex = data.clientSessionProof

        salt_bytes = base64.b64decode(salt_b64)
        verifier_bytes = bytes.fromhex(verifier_hex)
        A = bytes.fromhex(A_hex)
        M1 = bytes.fromhex(M1_hex)
        B = bytes.fromhex(B_hex)
        priv = bytes.fromhex(priv_hex)

        ctx = SRPContext(
            username=email,
            salt=salt_bytes,
            verifier=verifier_bytes,
            hash_alg=sha256,
            ng_type=constants.NG_2048
        )

        server = SRPServerSession(ctx)
        server.public = B
        server.private = priv
        server.process(A)

        HAMK = server.verify(M1)
        if HAMK is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid client proof")

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"SRP verification failed: {str(e)}")

# === V2 Routes (Frontend-friendly) ===
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    return srp_verify(data)
