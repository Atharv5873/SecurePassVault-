from fastapi import APIRouter, HTTPException, Depends
from models import CredentialIn
from auth import get_current_user
from starlette import status
from operations import (
    add_credential as op_add_credential,
    view_credentials as op_view_credentials,
    reveal_password as op_reveal_password,
    delete_credential as op_delete_credential
)

router = APIRouter(prefix="/credentials", tags=["Credentials"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_credential(cred: CredentialIn, user_id: str = Depends(get_current_user)):
    try:
        inserted_id = op_add_credential(cred.site, cred.username, cred.password, user_id)
        return {
            "id": inserted_id,
            "message": "Credential added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK)
def view(user_id: str = Depends(get_current_user)):
    try:
        return op_view_credentials(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/reveal/{cred_id}", status_code=status.HTTP_200_OK)
def reveal(cred_id: str, user_id: str = Depends(get_current_user)):
    result = op_reveal_password(cred_id, user_id)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="Credential not found or access denied")

@router.delete("/delete/{cred_id}", status_code=status.HTTP_200_OK)
def delete_cred(cred_id: str, user_id: str = Depends(get_current_user)):
    result = op_delete_credential(cred_id, user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Credential not found or access denied")
    elif result is False:
        raise HTTPException(status_code=500, detail="Failed to delete credential")
    return {
        "site": result["site"],
        "username": result["username"],
        "status": "Credential deleted successfully"
    }

