from fastapi import APIRouter, HTTPException, Depends
from db_config import db
from bson import ObjectId
from auth import get_current_admin

users_collection = db["users"]

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users")
def list_users(admin_id: str = Depends(get_current_admin)):
    users = users_collection.find()
    return [{
        "id": str(u["_id"]),
        "email": u["username"],
        "is_admin": u.get("is_admin", False)
    } for u in users]

@router.delete("/user/{user_id}")
def delete_user(user_id: str, admin_id: str = Depends(get_current_admin)):
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.put("/rename/{user_id}")
def rename_user(user_id: str, new_email: str, admin_id: str = Depends(get_current_admin)):
    new_email = new_email.strip().lower()
    if users_collection.find_one({"username": new_email}):
        raise HTTPException(status_code=400, detail="Email already taken")
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"username": new_email}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User renamed successfully"}
