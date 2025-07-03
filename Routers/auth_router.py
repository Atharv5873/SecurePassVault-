from fastapi import APIRouter,HTTPException, Depends, Query
from models import VerifyRequest
from utils.otp import *
from utils.email_utils import *
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token,create_user,authenticate_user,get_current_user
from starlette import status
from db_config import db
from bson import ObjectId

pending_otps = {}  # email -> {"otp": ..., "expiry": ...}

users_collection=db["users"]

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(email: str):
    if users_collection.find_one({"username": email}):
        raise HTTPException(400, "Email already registered")
    otp = generate_otp()
    pending_otps[email] = {"otp": otp, "expiry": time.time() + 300}
    send_otp_email(email, otp)
    return {"message": "OTP sent"}

@router.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    record = pending_otps.get(data.email)
    if not record or record["otp"] != data.otp or is_otp_expired(record["expiry"]):
        raise HTTPException(400, "Invalid or expired OTP")
    create_user(data.email, data.password, data.salt)
    del pending_otps[data.email]
    return {"message": "Registration successful"}
    
@router.post("/token")
def user_login(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user=authenticate_user(form_data.username,form_data.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token=create_access_token({"user_id":str(db_user["_id"])})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/salt")
def get_salt(username:str=Query(...),user_id:str=Depends(get_current_user)):
    username = username.strip().lower()
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["username"] != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own salt."
        )
    return {"salt": user["salt"]}

@router.get("/me")
def get_user_info(user_id: str = Depends(get_current_user)):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["username"],
        "is_admin": user.get("is_admin", False)
    }

    