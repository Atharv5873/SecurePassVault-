import os
import requests
from dotenv import load_dotenv

load_dotenv()

def send_otp_email(to_email: str, otp: str):
    MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")
    MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
    EMAIL_SENDER = os.getenv("EMAIL_SENDER")
    
    if not all([MAILGUN_DOMAIN, MAILGUN_API_KEY, EMAIL_SENDER]):
        raise ValueError("Mailgun API key, domain, or sender email is not set in environment variables")
    
    return requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": EMAIL_SENDER,
            "to": to_email,
            "subject": "Verify your email - SecurePassVault",
            "text": f"Your SecurePassVault registration OTP is: {otp}"
        }
    )
