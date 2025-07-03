import smtplib
from dotenv import load_dotenv
from email.message import EmailMessage
import os

load_dotenv() 

def send_otp_email(to_email: str, otp: str):
    msg = EmailMessage()
    msg.set_content(f"Your SecurePassVault registration OTP is: {otp}")
    msg["Subject"] = "Verify your email - SecurePassVault"
    msg["From"] = os.getenv("EMAIL_SENDER")  
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
        smtp.send_message(msg)
