from typing import Any
from uuid import UUID

from domain.auth.repositories.user_repository import UserRepository
from infrastructure.auth.jwt_provider import JWTProvider
from infrastructure.auth.password_hasher import PasswordHasher


class ChangePasswordUseCase:

    def __init__(
        self,
        user_repo: UserRepository,
        jwt_provider: JWTProvider,
        password_hasher: PasswordHasher
    ) -> None:
        self.user_repo = user_repo
        self.jwt_provider = jwt_provider
        self.password_hasher = password_hasher

    async def execute(
        self,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> dict[str, Any]:
        id = UUID(user_id)

        user = await self.user_repo.get_by_id(id)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        if not self.password_hasher.verify_password(current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")

        new_hashed_password = self.password_hasher.hash_password(new_password)
        user.update_password(new_hashed_password)
        
        await self.user_repo.save(user=user)
        return {
            'user': {
                'id': str(user.id),
                'username': user.username,
                'is_admin': user.is_admin,
                'is_active': user.is_active
            }
        }
