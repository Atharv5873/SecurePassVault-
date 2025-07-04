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
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

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
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid salt or verifier")

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

# --- Step 3: SRP Challenge ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

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
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge error: {str(e)}")

# --- Step 4: SRP Verify ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = srp_sessions.find_one({"email": email})

    if not session:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No SRP challenge started or session expired")

    if time.time() - session["timestamp"] > 300:
        srp_sessions.delete_one({"email": email})
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "SRP session expired")

    try:
        print("=== SRP VERIFY DEBUG ===")
        print(f"Email: {email}")

        salt_b64 = session['salt']
        verifier_hex = session['verifier']
        s_hex = session['s']
        B_hex = session['B']
        client_A_hex = data.clientEphemeralPublic
        client_M1_hex = data.clientSessionProof

        print(f"Salt (base64): {salt_b64}")
        print(f"Verifier (hex): {verifier_hex}")
        print(f"Server challenge s (hex): {s_hex}")
        print(f"Server ephemeral B (hex): {B_hex}")
        print(f"Client ephemeral A (hex): {client_A_hex}")
        print(f"Client proof M1 (hex): {client_M1_hex}")

        salt_bytes = base64.b64decode(salt_b64)
        verifier_bytes = bytes.fromhex(verifier_hex)
        A = bytes.fromhex(client_A_hex)
        M1 = bytes.fromhex(client_M1_hex)

        print("Verifier bytes (hex):", verifier_bytes.hex())
print("Salt bytes (hex):", salt_bytes.hex())
print("A (client ephemeral):", A.hex())
print("B (server ephemeral):", B_hex)
print("s (SRP salt):", s_hex)


        server = srp.Verifier(
            username=email,
            salt=salt_bytes,
            verifier=verifier_bytes,
            A=A,
            B=bytes.fromhex(B_hex),
            s=bytes.fromhex(s_hex),
            hash_alg="SHA256"  # ✅ FIXED
        )

        if not isinstance(M1, bytes):
    print("⚠️ M1 is not bytes. Type:", type(M1))
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "M1 must be bytes")


        HAMK = server.verify_session(M1)
        if HAMK is None:
            print("Client proof invalid: server.verify_session returned None")
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Client proof invalid")

        print(f"Server session proof HAMK: {HAMK.hex()}")

        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        print("=== SRP VERIFY EXCEPTION ===")
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP verification failed: {str(e)}")

# --- v2 endpoints (optional) ---
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    return srp_verify(data)
