from fastapi import APIRouter, HTTPException, Query
from models import VerifyRequest, EmailRequest, SRPVerifyRequest
from utils.otp import generate_otp
from utils.email_utils import send_otp_email
from auth import create_access_token
from starlette import status
from db_config import db
from pymongo import ReturnDocument
import srp, base64, time, traceback

router = APIRouter(prefix="/auth", tags=["Auth"])
users_collection = db["users"]
pending = db["pending_otps"]
srp_sessions = db["srp_sessions"]

# --- Step 1: Register OTP ---
@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()
    if users_collection.find_one({"username": email}):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    otp = generate_otp()
    expiry = time.time() + 300

    pending.find_one_and_update(
        {"email": email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True, return_document=ReturnDocument.AFTER
    )
    send_otp_email(email, otp)
    return {"message": "OTP sent"}

# --- Step 2: Verify OTP and Register Verifier ---
@router.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    rec = pending.find_one({"email": email})

    if not rec:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No OTP request found")
    if rec["otp"] != data.otp:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    if time.time() > rec["expiry"]:
        pending.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="OTP expired")

    try:
        base64.b64decode(data.salt)
        bytes.fromhex(data.verifier)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid salt or verifier")

    if users_collection.find_one({"username": email}):
        pending.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="User already registered")

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
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        verifier = srp.Verifier(email, salt_bytes, verifier_bytes, hash_alg="SHA256")
        s, B = verifier.get_challenge()

        srp_sessions.update_one(
            {"email": email},
            {"$set": {
                "salt": user["salt"],
                "verifier": user["verifier"],
                "s": s.hex(),
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
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"SRP challenge error: {str(e)}")

# --- Step 4: SRP Verify ---
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
        print("=== SRP VERIFY DEBUG ===")
        salt_bytes = base64.b64decode(session["salt"])
        verifier_bytes = bytes.fromhex(session["verifier"])
        s = bytes.fromhex(session["s"])
        B = bytes.fromhex(session["B"])
        A = bytes.fromhex(data.clientEphemeralPublic)
        M1 = bytes.fromhex(data.clientSessionProof)

        print(f"Email: {email}")
        print(f"A: {A.hex()}")
        print(f"B: {B.hex()}")
        print(f"s: {s.hex()}")
        print(f"Salt: {salt_bytes.hex()}")
        print(f"Verifier: {verifier_bytes.hex()}")

        server = srp.Verifier(
            username=email,
            salt=salt_bytes,
            verifier=verifier_bytes,
            A=A,
            B=B,
            hash_alg="SHA256"
        )

        if not isinstance(M1, bytes):
            print("⚠️ M1 is not bytes. Type:", type(M1))
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="M1 must be bytes")

        HAMK = server.verify_session(M1)
        if HAMK is None:
            print("Client proof invalid.")
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Client proof invalid")

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

# --- v2 Endpoints (optional aliases) ---
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    return srp_verify(data)
