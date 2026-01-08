from typing import Any

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

    async def execute(self, token: str, new_password: str) -> dict[str, Any]:
        try:
            payload = await self.jwt_provider.verify_token(token)
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid token payload")

            user = await self.user_repo.get_by_id(user_id)
            if not user or not user.is_active:
                raise ValueError("User not found or inactive")
            
            new_hashed_password = self.password_hasher.hash_password(new_password)

            await self.user_repo.update_password(user, new_hashed_password)
            return {
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'is_active': user.is_active
                }
            }

        except ValueError as e:
            raise ValueError(f"Password change failed: {str(e)}")
