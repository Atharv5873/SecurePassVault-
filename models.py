from pydantic import BaseModel

class UserRegister(BaseModel):
    username:str
    password:str
    
class UserLogin(BaseModel):
    username:str
    password:str
    
class CredentialIn(BaseModel):
    site:str
    username:str
    password:str