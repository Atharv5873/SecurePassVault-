from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from starlette import status
from encryptor import encrypt_password,decrypt_password
from db_config import vault_collection



router=APIRouter()

class CredentialIn(BaseModel):
    site:str
    username:str
    password:str
    
class CredentialOut(BaseModel):
    id:str
    site:str
    username:str
    password:str
    
@router.post("/add",status_code=status.HTTP_201_CREATED)
def add_credential(cred:CredentialIn):
    encrypted_password=encrypt_password(cred.password)
    result=vault_collection.insert_one({
        "site":cred.site,
        "username":cred.username,
        "password":encrypted_password
    })
    if result is None:
        raise HTTPException(status_code=409)
    return {"id":str(result.inserted_id),"message":"Credential added Sucessfully."}

@router.get("/view",status_code=status.HTTP_200_OK)
def view_credentials():
    creds=vault_collection.find()
    return [{
        "id":str(c["_id"]),
        "site":str(c["site"]),
        "username":str(c["username"]),
        "password(encrypted)":str(c["password"])
    }for c in creds]
