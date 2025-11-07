import os
import base64
import logging
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_PATH = 'credentials.json'  # file path on Render
TOKEN_PATH = 'token.json'             # upload this after local run

def gmail_authenticate():
    creds = None
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        print(f"Gmail auth error: {e}")
        raise

def create_message(sender, to, subject, message_text):
    message = MIMEText(message_text)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    raw_bytes = base64.urlsafe_b64encode(message.as_bytes())
    return {'raw': raw_bytes.decode()}

def send_otp_email(to_email, otp):
    service = gmail_authenticate()
    sender_email = os.getenv('SENDER_EMAIL')
    if not sender_email:
        raise ValueError("Set SENDER_EMAIL environment variable.")
    message = create_message(
        sender=sender_email,
        to=to_email,
        subject='Verify your email - SecurePassVault',
        message_text=f'Your SecurePassVault registration OTP is: {otp}'
    )
    result = service.users().messages().send(userId='me', body=message).execute()
    print(f"OTP email sent! Message ID: {result['id']}")

# Call send_otp_email() with the recipient's email and OTP as needed.
