from db_config import vault_collection, db
from encryptor import encrypt_password, decrypt_password
from bson import ObjectId

users_collection = db["users"]
products_collection=db["products"]
notes_collection = db["notes"]

### Creds:

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

### Product Key:

def add_product_key(product_name,license_key,description,user_id):
    key=get_user_key(user_id)
    encrypted_license_key=encrypt_password(license_key,key)
    result=products_collection.insert_one({
        "product_name":product_name,
        "license_key":encrypted_license_key,
        "description":description,
        "user_id": ObjectId(user_id)
    })
    return str(result.inserted_id)

def view_product_keys(user_id):
    products=products_collection.find({"user_id":ObjectId(user_id)})
    return [{
        "id":str(c["_id"]),
        "product_name":(c["product_name"]),
        "description":(c["description"])
    } for c in products]

def reveal_license_key(product_id,user_id):
    product=products_collection.find_one({
        "_id":ObjectId(product_id),
        "user_id":ObjectId(user_id),
    })
    if not product:
        return None
    key=get_user_key(user_id)
    decrypted_license_key=decrypt_password(product["license_key"],key)
    return {
        "product_name":product["product_name"],
        "license_key":decrypted_license_key,
        "description":product["description"],
    }
    
def delete_product_key(product_id, user_id):
    product = products_collection.find_one({
        "_id": ObjectId(product_id),
        "user_id": ObjectId(user_id)
    })
    if not product:
        return None
    result = products_collection.delete_one({
        "_id": ObjectId(product_id),
        "user_id": ObjectId(user_id)
    })
    if result.deleted_count > 0:
        return {
            "product_name": product["product_name"]
        }
    return False

def add_note(title, content, user_id):
    key = get_user_key(user_id)
    encrypted_content = encrypt_password(content, key)
    result = notes_collection.insert_one({
        "title": title,
        "content": encrypted_content,
        "user_id": ObjectId(user_id)
    })
    return str(result.inserted_id)

def view_notes(user_id):
    notes = notes_collection.find({"user_id": ObjectId(user_id)})
    return [{"id": str(n["_id"]), "title": n["title"]} for n in notes]

def reveal_note(note_id, user_id):
    note = notes_collection.find_one({
        "_id": ObjectId(note_id),
        "user_id": ObjectId(user_id)
    })
    if not note:
        return None
    key = get_user_key(user_id)
    decrypted_content = decrypt_password(note["content"], key)
    return {
        "title": note["title"],
        "content": decrypted_content
    }

### Notes

def delete_note(note_id, user_id):
    note = notes_collection.find_one({
        "_id": ObjectId(note_id),
        "user_id": ObjectId(user_id)
    })
    if not note:
        return None
    result = notes_collection.delete_one({
        "_id": ObjectId(note_id),
        "user_id": ObjectId(user_id)
    })
    if result.deleted_count > 0:
        return {"title": note["title"]}
    return False

