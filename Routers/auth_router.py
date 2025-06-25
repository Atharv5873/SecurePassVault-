from fastapi import APIRouter,HTTPException, Depends, Query
from models import UserRegister
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token,create_user,authenticate_user,get_current_user
from starlette import status
from db_config import db
from bson import ObjectId

users_collection=db["users"]

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register",status_code=status.HTTP_201_CREATED)
def user_register(user:UserRegister):
    create_user(user.username,user.password,user.salt)
    
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

    