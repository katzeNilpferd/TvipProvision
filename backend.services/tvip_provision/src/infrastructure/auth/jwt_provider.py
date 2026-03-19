import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class Token:
    access_token: str
    token_type: str = "bearer"


class JWTProvider:

    def __init__(
        self,
        secret_key: str = "",
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 30
    ) -> None:
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes

    async def create_token(
        self,
        user_id: str,
        username: str,
        is_admin: bool
    ) -> Token:
        payload: Dict[str, Any] = {
            "sub": user_id,
            "username": username,
            "is_admin": is_admin,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        }

        token = jwt.encode(
            payload=payload,
            key=self.secret_key,
            algorithm=self.algorithm
        )
        return Token(access_token=token)
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except ExpiredSignatureError:
            raise ValueError("Token has expired")
        except InvalidTokenError:
            raise ValueError("Invalid token")
