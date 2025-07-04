from fastapi import APIRouter, HTTPException, Query
from models import VerifyRequest, EmailRequest, SRPVerifyRequest
from utils.otp import generate_otp
from utils.email_utils import send_otp_email
from auth import create_access_token
from starlette import status
from db_config import db
from pymongo import ReturnDocument
import srp, base64, time
import srp, base64, time, traceback

router = APIRouter(prefix="/auth", tags=["Auth"])
users_collection = db["users"]
pending = db["pending_otps"]
srp_sessions = db["srp_sessions"]

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
        upsert=True, return_document=ReturnDocument.AFTER
    )
    send_otp_email(email, otp)
    return {"message": "OTP sent"}

# --- Step 2: Verify OTP and register SRP verifier ---
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

        # Get the server challenge tuple (b, B)
        challenge = srp.Verifier(email, salt_bytes, verifier_bytes).get_challenge()
        if not challenge:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate SRP challenge")

        _, B = challenge  # unpack tuple correctly

        # Store session in MongoDB for later verification
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
            "salt": user["salt"],  # base64
            "B": B.hex(),          # hex string
            "message": "Send A and M1 to /srp/verify"
        }

    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge setup failed: {str(e)}")

# --- Step 4: SRP Verify ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    session = srp_sessions.find_one({"email": email})

    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SRP challenge started or session expired"
        )

    # Expire session if older than 5 minutes
    if time.time() - session["timestamp"] > 300:
        srp_sessions.delete_one({"email": email})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SRP session expired"
        )

    try:
        # Debug logs
        print("=== SRP VERIFY DEBUG ===")
        print(f"Email: {email}")
        print(f"Salt (base64): {session['salt']}")
        print(f"Verifier (hex): {session['verifier']}")
        print(f"B (hex): {session['B']}")
        print(f"A (clientEphemeralPublic): {data.clientEphemeralPublic}")
        print(f"M1 (clientSessionProof): {data.clientSessionProof}")

        # Decode everything
        salt_bytes = base64.b64decode(session["salt"])
        verifier_bytes = bytes.fromhex(session["verifier"])
        A = bytes.fromhex(data.clientEphemeralPublic)
        M1 = bytes.fromhex(data.clientSessionProof)
        B = bytes.fromhex(session["B"])

        # ✅ Pass all arguments explicitly
        server = srp.Verifier(
            username=email,
            salt=salt_bytes,
            verifier=verifier_bytes,
            A=A,
            B=B,
            hash_alg="SHA256"  # ensure consistent hashing
        )

        # Verify session
        HAMK = server.verify_session(M1)
        if not HAMK:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Client proof invalid"
            )

        # Create JWT token
        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        # Clear session
        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        print("=== SRP VERIFY EXCEPTION ===")
        traceback.print_exc()  # Logs full traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SRP verification failed"
        )
