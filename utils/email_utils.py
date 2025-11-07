import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
TOKEN_PATH = os.getenv('GOOGLE_TOKEN_PATH', 'token.json')

def gmail_authenticate():
    creds = None
    try:
        if os.path.exists(TOKEN_PATH):
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
                creds = flow.run_local_server(port=0)
            with open(TOKEN_PATH, 'w') as token:
                token.write(creds.to_json())
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        logging.error(f"Gmail authentication failed: {e}")
        raise

def create_message(sender, to, subject, message_text):
    message = MIMEText(message_text)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes())
    return {'raw': raw.decode()}

def send_otp_email(to_email: str, otp: str):
    service = gmail_authenticate()
    sender_email = os.getenv("SENDER_EMAIL")

    message = create_message(
        sender=sender_email,
        to=to_email,
        subject="Verify your email - SecurePassVault",
        message_text=f"Your SecurePassVault registration OTP is: {otp}"
    )
    try:
        sent_message = service.users().messages().send(userId='me', body=message).execute()
        logging.info(f"Message sent, ID: {sent_message['id']}")
    except Exception as e:
        logging.error(f"Failed to send OTP email: {e}")
        raise
