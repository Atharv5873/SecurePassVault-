from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from db_config import db
import os
from dotenv import load_dotenv

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="auth/token")

SECRET_KEY=str(os.getenv("SECRET"))
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

users_collection=db["users"]

def create_user(username,password):
    hashed=bcrypt.hashpw(password.encode(),bcrypt.gensalt())
    user={
        "username":username,
        "password":hashed
    }
    users_collection.insert_one(user)
    
def authenticate_user(username,password):
    user=users_collection.find_one({"username":username})
    if not user or not bcrypt.checkpw(password.encode(),user["password"]):
        return None
    return user

def create_access_token(data:dict):
    to_encode=data.copy()
    expire=datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

def get_current_user(token:str=Depends(oauth2_scheme)):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        user_id=payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401,detail="Invalid Token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401,detail="Invalid Token")
        
    
