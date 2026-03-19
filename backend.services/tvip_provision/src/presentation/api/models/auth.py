from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class VerifyTokenRequest(BaseModel):
    token: str
