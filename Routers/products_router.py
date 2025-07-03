from fastapi import APIRouter, HTTPException, Depends
from models import ProductKeyIn
from auth import get_current_user
from starlette import status
from operations import (
    add_product_key,
    view_product_keys,
    #reveal_license_key,
    #delete_product_key
)

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/",status_code=status.HTTP_201_CREATED)
def add_products(product:ProductKeyIn,user_id:str=Depends(get_current_user)):
    try:
        inserted_id=add_product_key(product.product_name,product.license_key,product.description,user_id)
        return {
            "id": inserted_id,
            "message": "Product key added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}") 
    
@router.get("/",status_code=status.HTTP_200_OK)
def view(user_id:str = Depends(get_current_user)):
    try:
        return view_product_keys(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")