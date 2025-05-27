import os
from cryptography.fernet import Fernet

KEY_FILE="key.key"

def load_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE,"rb") as file:
            return file.read()
    else:
        key=Fernet.generate_key()
        with open(KEY_FILE,"wb") as file:
            file.write(key)
        return key

SECRET_KEY=load_key()
cipher=Fernet(SECRET_KEY)

def encrypt_password(password):
    return cipher.encrypt(password.encode()).decode()

def decrypt_password(token):
    return cipher.decrypt(token.encode()).decode()