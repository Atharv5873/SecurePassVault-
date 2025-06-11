from fastapi import APIRouter,HTTPException, Depends
from models import UserLogin,UserRegister
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token,create_user,authenticate_user,get_current_user
from starlette import status

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register",status_code=status.HTTP_201_CREATED)
def user_register(user:UserRegister):
    create_user(user.username,user.password)
    
@router.post("/token")
def user_login(form_data: OAuth2PasswordRequestForm = Depends()):
    db_user=authenticate_user(form_data.username,form_data.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token=create_access_token({"user_id":str(db_user["_id"])})
    return {"access_token": token, "token_type": "bearer"}
    