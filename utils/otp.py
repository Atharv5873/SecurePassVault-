import random
import time


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def is_otp_expired(expiry_timestamp: float) -> bool:
    return time.time() > expiry_timestamp
