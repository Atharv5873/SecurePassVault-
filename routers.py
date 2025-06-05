from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
from starlette import status
from encryptor import encrypt_password,decrypt_password
from db_config import vault_collection
from bson import ObjectId



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
    return {"id":str(result.inserted_id),"message":"Credential added Successfully."}

@router.get("/view",status_code=status.HTTP_200_OK)
def view_credentials():
    creds=vault_collection.find()
    return [{
        "id":str(c["_id"]),
        "site":str(c["site"]),
        "username":str(c["username"]),
        "password(encrypted)":str(c["password"])
    }for c in creds]

@router.get("/reveal/{cred_id}",status_code=status.HTTP_200_OK)
def reveal_password(cred_id:str):
    try:
        cred=vault_collection.find_one({"_id": ObjectId(cred_id)})
        if cred:
            password=decrypt_password(cred["password"])
            return {
                "site":cred["site"],
                "username":cred["username"],
                "password":password
            }
        raise HTTPException(status_code=404, detail="Credential not found.")
    except:
        raise HTTPException(status_code=404, detail="Invalid Credential ID")
    
@router.delete("/delete/{cred_id}", status_code=status.HTTP_200_OK)
def delete_credential(cred_id: str):
    credential = vault_collection.find_one({"_id": ObjectId(cred_id)})
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    result = vault_collection.delete_one({"_id": ObjectId(cred_id)})
    if result.deleted_count > 0:
        return {
            "site": credential["site"],
            "username": credential["username"],
            "status": "Credential deleted successfully"
        }
    raise HTTPException(status_code=500, detail="Failed to delete credential")
    