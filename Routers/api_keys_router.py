from fastapi import APIRouter, HTTPException, Depends, status
from models import APIKeyIn
from auth import get_current_user
from operations import (
    add_api_key as op_add_api_key,
    view_api_keys as op_view_api_keys,
    reveal_api_key as op_reveal_api_key,
    delete_api_key as op_delete_api_key,
)

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def add_key(data: APIKeyIn, user_id: str = Depends(get_current_user)):
    try:
        inserted_id = op_add_api_key(data.service_name, data.api_key, data.description, user_id)
        return {"id": inserted_id, "message": "API Key added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/", status_code=status.HTTP_200_OK)
def list_keys(user_id: str = Depends(get_current_user)):
    try:
        return op_view_api_keys(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/reveal/{key_id}", status_code=status.HTTP_200_OK)
def reveal_key(key_id: str, user_id: str = Depends(get_current_user)):
    result = op_reveal_api_key(key_id, user_id)
    if result:
        return result
    else:
        raise HTTPException(status_code=404, detail="API Key not found or access denied")

@router.delete("/delete/{key_id}", status_code=status.HTTP_200_OK)
def delete_key(key_id: str, user_id: str = Depends(get_current_user)):
    result = op_delete_api_key(key_id, user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="API Key not found or access denied")
    elif result is False:
        raise HTTPException(status_code=500, detail="Failed to delete API Key")
    return {"service_name": result["service_name"], "status": "API Key deleted successfully"}
