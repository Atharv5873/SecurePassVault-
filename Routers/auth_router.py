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

# --- Step 3: SRP Challenge (Fixed) ---
@router.get("/srp/challenge")
def srp_challenge(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    try:
        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        # Create verifier without A (client's ephemeral public key)
        verifier = srp.Verifier(email, salt_bytes, verifier_bytes)
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


# --- Step 4: SRP Verify (Corrected for pysrp) ---
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
        print("=== SRP VERIFY DEBUG ===")
        print(f"Email: {email}")

        # Get session data
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

        # Decode data
        salt_bytes = base64.b64decode(salt_b64)
        verifier_bytes = bytes.fromhex(verifier_hex)
        A = int(client_A_hex, 16)
        M1 = bytes.fromhex(client_M1_hex)
        A_bytes = A.to_bytes((A.bit_length() + 7) // 8, byteorder='big')
        
        server = srp.Verifier(email, salt_bytes, verifier_bytes, A_bytes)


        print("Verifier expected A:", A)
        print("Verifier received M1:", M1.hex())

        
        # Verify client proof M1
        HAMK = server.verify_session(M1)
        if HAMK is None:
            print("Client proof invalid: server.verify_session returned None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Client proof invalid"
            )

        print(f"Server session proof HAMK: {HAMK.hex()}")

        # Create JWT token
        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        # Clear session after successful login
        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        print("=== SRP VERIFY EXCEPTION ===")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SRP verification failed: {str(e)}"
        )


# --- Alternative endpoint for v2 (matches your frontend) ---
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    # This is identical to the main challenge endpoint
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    # This is identical to the main verify endpoint
    return srp_verify(data)
