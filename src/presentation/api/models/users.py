from typing import Optional
from pydantic import BaseModel


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CreateTicketRequest(BaseModel):
    username: str
    description: Optional[str] = None

class PasswordRecoveryRequest(BaseModel):
    username: str
    secret_key: str
    new_password: str
