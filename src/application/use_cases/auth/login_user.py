from typing import Any

from domain.auth.repositories.user_repository import UserRepository
from domain.auth.exceptions.auth import (
    UserNotFoundException,
    InactiveUserException,
    InvalidPasswordException
)
from infrastructure.auth.password_hasher import PasswordHasher
from infrastructure.auth.jwt_provider import JWTProvider


class LoginUserUseCase:

    def __init__(
        self,
        user_repo: UserRepository,
        password_hasher: PasswordHasher,
        jwt_provider: JWTProvider
    ) -> None:
        self.user_repo = user_repo
        self.password_hasher = password_hasher
        self.jwt_provider = jwt_provider

    async def execute(self, username: str, password: str) -> dict[str, dict[str, Any]]:
        user = await self.user_repo.get_by_username(username)

        if not user:
            raise UserNotFoundException("User not found")
        
        if not user.is_active:
            raise InactiveUserException("User account is inactive")
        
        if not self.password_hasher.verify_password(password, user.hashed_password):
            raise InvalidPasswordException("Invalid password")

        token = await self.jwt_provider.create_token(
            user_id=str(user.id),
            username=user.username,
            is_admin=user.is_admin
        )

        return {
            'user': {
                'id': str(user.id),
                'username': user.username,
                'is_admin': user.is_admin,
                'is_active': user.is_active
            },
            'token': {
                'access_token': token.access_token,
                'token_type': token.token_type
            }
        }
