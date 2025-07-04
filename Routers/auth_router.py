from fastapi import APIRouter,HTTPException, Depends, Query
from models import VerifyRequest, EmailRequest
from utils.otp import *
from utils.email_utils import *
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token,create_user,authenticate_user,get_current_user
from starlette import status
from db_config import db
from bson import ObjectId
import time
from pymongo import ReturnDocument

pending_otps = {}  # email -> {"otp": ..., "expiry": ...}

users_collection=db["users"]

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(data: EmailRequest):
    email = data.email.strip().lower()
    if users_collection.find_one({"username": email}):
        raise HTTPException(400, "Email already registered")

    otp = generate_otp()
    expiry = time.time() + 300  # 5 minutes from now

    # Upsert OTP doc
    db["pending_otps"].find_one_and_update(
        {"email": email},
        {"$set": {"otp": otp, "expiry": expiry}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    send_otp_email(email, otp)
    return {"message": "OTP sent"}


@router.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    record = db["pending_otps"].find_one({"email": email})

    if not record:
        raise HTTPException(400, "No OTP request found for this email")
    if record["otp"] != data.otp:
        raise HTTPException(400, "Invalid OTP")
    if time.time() > record["expiry"]:
        db["pending_otps"].delete_one({"email": email})
        raise HTTPException(400, "OTP expired")
    
    db["black"].find_one_and_update(
        {"email": email},
        {"$set": {"pepper": data.pepper}},
        upsert=True
    )
    create_user(email, data.password, data.salt)
    db["pending_otps"].delete_one({"email": email})
    return {"message": "Registration successful"}

@router.get("/pepper")
def get_pepper(email: str = Query(...)):
    email = email.strip().lower()
    record = db["black"].find_one({"email": email})
    if not record:
        raise HTTPException(404, "Pepper not found for this email")
    return {"pepper": record["pepper"]}

    
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

    