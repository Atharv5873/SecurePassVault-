from db_config import vault_collection
from encryptor import encrypt_password,decrypt_password
from bson import ObjectId

def add_credential(site,username,password):
    encrypted_password=encrypt_password(password)
    vault_collection.insert_one({
        "site":site,
        "username":username,
        "password":encrypted_password
    })
    print("Credential added Successfully.")

def view_credentials():
    creds=vault_collection.find()
    for c in creds:
        print(f"\n ID: {c['_id']}")
        print(f"Site: {c['site']}")
        print(f"Username: {c['username']}")
        print(f"Password (encrypted): {c['password']}")

def show_password(cred_id):
    try:
        cred = vault_collection.find_one({"_id": ObjectId(cred_id)})
        if cred:
            decrypted_password=decrypt_password(cred['password'])
            print(f"\nDecrypted Password: {decrypted_password}")
        else:
            print("Credential not found.")
    except Exception as e:
        print("Error: ",e)
    
def delete_credential(cred_id):
    try:
        result=vault_collection.delete_one({"_id": ObjectId(cred_id)})
        print("Deleted Successfully." if result.deleted_count > 0 else "Credential Not found.")
    except Exception as e:
        print("Error: ",e)
