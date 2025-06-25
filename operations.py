from db_config import vault_collection, db
from encryptor import encrypt_password, decrypt_password
from bson import ObjectId

users_collection = db["users"]

def get_user_key(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user and "key" in user:
        return user['key']
    else:
        raise Exception("User not found or key missing.")

def add_credential(site, username, password, user_id):
    key = get_user_key(user_id)
    encrypted_password = encrypt_password(password, key)
    result = vault_collection.insert_one({
        "site": site,
        "username": username,
        "password": encrypted_password,
        "user_id": ObjectId(user_id)
    })
    return str(result.inserted_id)

def view_credentials(user_id):
    creds = vault_collection.find({"user_id": ObjectId(user_id)})
    return [{
        "id": str(c["_id"]),
        "site": c["site"],
        "username": c["username"]
    } for c in creds]

def reveal_password(cred_id, user_id):
    cred = vault_collection.find_one({
        "_id": ObjectId(cred_id),
        "user_id": ObjectId(user_id)
    })
    if not cred:
        return None
    key = get_user_key(user_id)
    decrypted_password = decrypt_password(cred["password"], key)
    return {
        "site": cred["site"],
        "username": cred["username"],
        "password": decrypted_password
    }

def delete_credential(cred_id, user_id):
    cred = vault_collection.find_one({
        "_id": ObjectId(cred_id),
        "user_id": ObjectId(user_id)
    })
    if not cred:
        return None
    result = vault_collection.delete_one({
        "_id": ObjectId(cred_id),
        "user_id": ObjectId(user_id)
    })
    if result.deleted_count > 0:
        return {
            "site": cred["site"],
            "username": cred["username"]
        }
    return False
