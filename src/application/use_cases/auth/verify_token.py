from typing import Any

from domain.auth.repositories.user_repository import UserRepository
from infrastructure.auth.jwt_provider import JWTProvider


class VerifyTokenUseCase:
    
    def __init__(
        self,
        user_repo: UserRepository,
        jwt_provider: JWTProvider
    ) -> None:
        self.user_repo = user_repo
        self.jwt_provider = jwt_provider

    async def execute(self, token: str) -> dict[str, Any]:
        try:
            payload = await self.jwt_provider.verify_token(token)
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid token payload")

            user = await self.user_repo.get_by_id(user_id)
            if not user or not user.is_active:
                raise ValueError("User not found or inactive")
            
            return {
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'is_admin': user.is_admin,
                    'is_active': user.is_active
                }
            }
        except ValueError as e:
            raise ValueError(f"Token verification failed: {str(e)}")
