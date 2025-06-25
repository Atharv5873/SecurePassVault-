from cryptography.fernet import Fernet

def encrypt_password(password: str, key: bytes) -> str:
    return Fernet(key).encrypt(password.encode()).decode()

def decrypt_password(token: str, key: bytes) -> str:
    return Fernet(key).decrypt(token.encode()).decode()
