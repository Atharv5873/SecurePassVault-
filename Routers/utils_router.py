from fastapi import APIRouter
from strength_test import *
import secrets

router = APIRouter(
    prefix="/utils",
    tags={"utils"}
)

@router.post("/password-strength")
def password_strength(password: str):
    entropy_bits, charset_size= calculate_entropy(password)
    times=estimate_crack_times(entropy_bits)
    
    return {
        "password":password,
        "length":len(password),
        "charset_size":charset_size,
        "entropy_bits":entropy_bits,
        "estimted_crack_times":{
            "Slow Online (10/sec)":times["slow_online"],
            "Fast Offline (1B/sec)":times["fast_offline"],
            "Massive Offline (1T/sec)":times["massive_offline"],
            "Quantum Attack (Grover's Algo)":times["quantum"]
        },
        "verdict":get_verdict(entropy_bits)
    }
    
@router.get("/generate-strong-password")
def generate_strong_password():
    length = 64 
    charset = string.ascii_letters + string.digits + string.punctuation
    charset = charset.replace('"', '').replace("'", '').replace('\\', '').replace('`', '')

    password = ''.join(secrets.choice(charset) for _ in range(length))
    return {"password": password}