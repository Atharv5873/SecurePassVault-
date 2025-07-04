from pydantic import BaseModel

class UserRegister(BaseModel):
    username:str
    password:str
    salt:str
    
class UserLogin(BaseModel):
    username:str
    password:str
    
class CredentialIn(BaseModel):
    site:str
    username:str
    password:str
    
class ProductKeyIn(BaseModel):
    product_name:str
    license_key:str
    description:str | None  = None
    
class VerifyRequest(BaseModel):
    email: str
    otp: str
    salt: str  # base64-encoded string from frontend
    verifier: str  # hex-encoded verifier from frontend

class EmailRequest(BaseModel):
    email: str
    
class SRPVerifyRequest(BaseModel):
    email: str
    clientEphemeralPublic: str  # A (hex)
    clientSessionProof: str     # M1 (hex)
