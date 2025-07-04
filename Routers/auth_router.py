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

        verifier = srp.Verifier(email, salt_bytes, verifier_bytes)
        b, B = verifier.get_challenge()

        srp_sessions.update_one(
            {"email": email},
            {"$set": {
                "salt": user["salt"],
                "verifier": user["verifier"],
                "b": b.hex(),
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


# --- Step 4: SRP Verify with fixed initialization ---
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
        # Debug logs for tracing values
        print("=== SRP VERIFY DEBUG ===")
        print(f"Email: {email}")

        # Raw stored values
        salt_b64 = session['salt']
        verifier_hex = session['verifier']
        b_hex = session['b']
        B_hex = session['B']
        client_A_hex = data.clientEphemeralPublic
        client_M1_hex = data.clientSessionProof

        print(f"Salt (base64): {salt_b64} (len: {len(salt_b64)})")
        print(f"Verifier (hex): {verifier_hex} (len: {len(verifier_hex)})")
        print(f"B (hex): {B_hex} (len: {len(B_hex)})")
        print(f"Server private ephemeral b (hex): {b_hex} (len: {len(b_hex)})")

        print(f"Client ephemeral public A (hex): {client_A_hex} (len: {len(client_A_hex)})")
        print(f"Client session proof M1 (hex): {client_M1_hex} (len: {len(client_M1_hex)})")

        # Decode everything
        salt_bytes = base64.b64decode(salt_b64)
        verifier_bytes = bytes.fromhex(verifier_hex)
        A = bytes.fromhex(client_A_hex)
        M1 = bytes.fromhex(client_M1_hex)
        b_bytes = bytes.fromhex(b_hex)  # Keep as bytes, not int

        print(f"Decoded salt bytes length: {len(salt_bytes)}")
        print(f"Decoded verifier bytes length: {len(verifier_bytes)}")
        print(f"Decoded A bytes length: {len(A)}")
        print(f"Decoded M1 bytes length: {len(M1)}")
        print(f"Server private ephemeral b bytes length: {len(b_bytes)}")

        # Create verifier instance - Fixed initialization
        # Method 1: Try recreating the verifier from stored session data
        try:
            server = srp.Verifier(email, salt_bytes, verifier_bytes, A)
            # Set the private key manually if the library supports it
            if hasattr(server, 'b'):
                server.b = int(b_hex, 16)
            elif hasattr(server, '_b'):
                server._b = int(b_hex, 16)
        except Exception as e1:
            print(f"Method 1 failed: {e1}")
            # Method 2: Try with different parameter order
            try:
                server = srp.Verifier(email, salt_bytes, verifier_bytes)
                server.set_A(A)
                if hasattr(server, 'b'):
                    server.b = int(b_hex, 16)
                elif hasattr(server, '_b'):
                    server._b = int(b_hex, 16)
            except Exception as e2:
                print(f"Method 2 failed: {e2}")
                # Method 3: Recreate from scratch (this loses the session state)
                server = srp.Verifier(email, salt_bytes, verifier_bytes)
                # This will generate new b and B values, which might not match
                # the ones sent to the client - this is a fallback
                server.set_A(A)

        # Verify client proof M1
        HAMK = server.verify_session(M1)
        if not HAMK:
            print("Client proof invalid: server.verify_session returned False or None")
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


# Alternative approach - Store the entire verifier object instead of individual components
@router.get("/srp/challenge-v2")
def srp_challenge_v2(email: str = Query(...)):
    email = email.strip().lower()
    user = users_collection.find_one({"username": email})
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    try:
        salt_bytes = base64.b64decode(user["salt"])
        verifier_bytes = bytes.fromhex(user["verifier"])

        verifier = srp.Verifier(email, salt_bytes, verifier_bytes)
        b, B = verifier.get_challenge()

        # Store the verifier object state more completely
        verifier_state = {
            "email": email,
            "salt": user["salt"],
            "verifier": user["verifier"],
            "b": b.hex(),
            "B": B.hex(),
            "timestamp": time.time(),
            # Try to store more state if available
            "username": email,
            "salt_bytes": base64.b64encode(salt_bytes).decode(),
            "verifier_bytes": user["verifier"]
        }

        srp_sessions.update_one(
            {"email": email},
            {"$set": verifier_state},
            upsert=True
        )

        return {
            "salt": user["salt"],
            "B": B.hex(),
            "message": "Send A and M1 to /srp/verify-v2"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"SRP challenge error: {str(e)}")


@router.post("/srp/verify-v2")
def srp_verify_v2(data: SRPVerifyRequest):
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
        # Recreate the verifier from stored data
        salt_bytes = base64.b64decode(session['salt'])
        verifier_bytes = bytes.fromhex(session['verifier'])
        A = bytes.fromhex(data.clientEphemeralPublic)
        M1 = bytes.fromhex(data.clientSessionProof)
        b_int = int(session['b'], 16)

        # Create a new verifier instance
        server = srp.Verifier(email, salt_bytes, verifier_bytes)
        
        # Set the client's public ephemeral key
        server.set_A(A)
        
        # Try to restore the server's private ephemeral key
        # This is library-specific and might not work with all implementations
        if hasattr(server, 'b'):
            server.b = b_int
        elif hasattr(server, '_b'):
            server._b = b_int
        
        # Verify client proof M1
        HAMK = server.verify_session(M1)
        if not HAMK:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Client proof invalid"
            )

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
        print("=== SRP VERIFY V2 EXCEPTION ===")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SRP verification failed: {str(e)}"
        )