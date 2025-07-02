import math
import string

def get_charset_size(password: str) -> int:
    charset = 0
    if any(c in string.ascii_lowercase for c in password):
        charset += 26
    if any(c in string.ascii_uppercase for c in password):
        charset += 26
    if any(c in string.digits for c in password):
        charset += 10
    if any(c in string.punctuation for c in password):
        charset += len(string.punctuation)
    if any(ord(c) > 127 for c in password):
        charset += 100  # Unicode chars assumed
    return charset

def calculate_entropy(password: str) -> (float, int):
    charset_size = get_charset_size(password)
    if charset_size == 0:
        return 0.0, 0  # Avoid math error on empty or unsupported password
    entropy = len(password) * math.log2(charset_size)
    return round(entropy, 2), charset_size

def convert_seconds(seconds: float) -> str:
    if seconds < 1:
        return "Instantly"
    minutes = seconds / 60
    hours = minutes / 60
    days = hours / 24
    years = days / 365
    if years >= 1:
        return f"{years:.2f} years"
    elif days >= 1:
        return f"{days:.2f} days"
    elif hours >= 1:
        return f"{hours:.2f} hours"
    elif minutes >= 1:
        return f"{minutes:.2f} minutes"
    else:
        return f"{seconds:.2f} seconds"

def estimate_crack_times(entropy_bits: float) -> dict:
    total_combinations = 2 ** entropy_bits

    attack_speeds = {
        "slow_online": 10,             # guesses/sec
        "fast_offline": 10**9,         # GPU
        "massive_offline": 10**12,     # supercluster
        "quantum": 10**12              # Assume 1 trillion guesses/sec for Grover
    }

    times = {}
    for method, speed in attack_speeds.items():
        if method == "quantum":
            guesses = 2 ** (entropy_bits / 2)  # sqrt(N) with Grover's algorithm
        else:
            guesses = total_combinations / 2  # average guesses
        seconds = guesses / speed
        times[method] = convert_seconds(seconds)

    return times

def get_verdict(entropy_bits: float) -> str:
    if entropy_bits < 40:
        return "Very Weak"
    elif entropy_bits < 60:
        return "Weak"
    elif entropy_bits < 80:
        return "Moderate"
    elif entropy_bits < 100:
        return "Strong"
    else:
        return "Very Strong"
