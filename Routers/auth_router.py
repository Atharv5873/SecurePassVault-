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

# In-memory storage for active SRP sessions
# In production, use Redis or similar
active_sessions = {}

# Cleanup old sessions (call this periodically)
def cleanup_old_sessions():
    current_time = time.time()
    to_remove = []
    for email, (session_data, timestamp) in active_sessions.items():
        if current_time - timestamp > 300:  # 5 minutes
            to_remove.append(email)
    
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
        # Clean up old sessions
        cleanup_old_sessions()

        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        # Store user data for later verifier creation
        # pysrp requires the client's A to create the verifier
        session_data = {
            'salt': salt_bytes,
            'verifier': verifier_bytes,
            'username': email
        }
        active_sessions[email] = (session_data, time.time())

        # Also store in database for reference
        srp_sessions.update_one(
            {"email": email},
            {"$set": {
                "salt": user["salt"],
                "verifier": user["verifier"],
                "timestamp": time.time()
            }},
            upsert=True
        )

        return {
            "salt": user["salt"],
            "message": "Send A and M1 to /srp/verify"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge error: {str(e)}")

# --- Step 4: SRP Verify ---
@router.post("/srp/verify")
def srp_verify(data: SRPVerifyRequest):
    email = data.email.strip().lower()
    
    # Check if we have an active session
    if email not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SRP challenge started or session expired"
        )

    session_data, timestamp = active_sessions[email]
    
    # Check expiry
    if time.time() - timestamp > 300:
        del active_sessions[email]
        srp_sessions.delete_one({"email": email})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SRP session expired"
        )

    try:
        print("=== SRP VERIFY DEBUG ===")
        print(f"Email: {email}")

        client_A_hex = data.clientEphemeralPublic
        client_M1_hex = data.clientSessionProof

        print(f"Client ephemeral A (hex): {client_A_hex}")
        print(f"Client proof M1 (hex): {client_M1_hex}")

        # Get session data
        salt_bytes = session_data['salt']
        verifier_bytes = session_data['verifier']
        username = session_data['username']

        # Decode client data
        A_bytes = bytes.fromhex(client_A_hex)
        M1_bytes = bytes.fromhex(client_M1_hex)

        print(f"Client A (bytes): {A_bytes.hex()}")
        print(f"Client M1 (bytes): {M1_bytes.hex()}")

        # Create verifier with client's A - this is required by pysrp
        print("Creating verifier with client A...")
        verifier = srp.Verifier(username, salt_bytes, verifier_bytes, A_bytes)
        
        # Get server's challenge
        s, B = verifier.get_challenge()
        if s is None or B is None:
            print("Failed to get challenge from verifier")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate server challenge"
            )

        print(f"Server challenge s: {s.hex()}")
        print(f"Server public B: {B.hex()}")

        # Verify the session using pysrp API
        # The verifier.verify_session method expects only M1
        HAMK = verifier.verify_session(M1_bytes)
        
        if HAMK is None:
            print("Client proof invalid: verifier.verify_session returned None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed"
            )

        print(f"Server session proof HAMK: {HAMK.hex()}")

        # Create JWT token
        user = users_collection.find_one({"username": email})
        token = create_access_token({"user_id": str(user["_id"])})

        # Clear session after successful login
        del active_sessions[email]
        srp_sessions.delete_one({"email": email})

        return {
            "serverProof": HAMK.hex(),
            "access_token": token
        }

    except Exception as e:
        print("=== SRP VERIFY EXCEPTION ===")
        print(f"Exception type: {type(e)}")
        print(f"Exception message: {str(e)}")
        traceback.print_exc()
        # Clean up on error
        if email in active_sessions:
            del active_sessions[email]
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SRP verification failed: {str(e)}"
        )

# --- Alternative endpoints for v2 ---
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    return srp_challenge(email)

@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
    return srp_verify(data)
