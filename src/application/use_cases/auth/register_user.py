from typing import Any

from domain.auth.entities.user import User
from domain.auth.repositories.user_repository import UserRepository
from domain.auth.exceptions.auth import UserAlreadyExistsException
from infrastructure.auth.password_hasher import PasswordHasher


class RegisterUserUseCase:

    def __init__(
        self,
        user_repo: UserRepository,
        password_hasher: PasswordHasher
    ) -> None:
        self.user_repo = user_repo
        self.password_hasher = password_hasher

    async def execute(self, username: str, password: str) -> dict[str, dict[str, Any]]:
        existing_user = await self.user_repo.get_by_username(username)

        if existing_user:
            raise UserAlreadyExistsException(f"User {username} already exists")
        
        hashed_password = self.password_hasher.hash_password(password)
        user = User(
            username=username,
            hashed_password=hashed_password
        )
        await self.user_repo.save(user=user)
        return {
            'user': {
                'id': str(user.id),
                'username': user.username,
                'is_admin': user.is_admin,
                'is_active': user.is_active
            }
        }
