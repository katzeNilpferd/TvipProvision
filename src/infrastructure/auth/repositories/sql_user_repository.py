from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from uuid import UUID

from infrastructure.database.models import UserModel
from domain.auth.entities.user import User
from domain.auth.repositories.user_repository import UserRepository


class SQLUserRepository(UserRepository):
    
    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            return None
        return self._to_entity(db_user)

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(
            select(UserModel).where(UserModel.username == username)
        )
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            return None
        return self._to_entity(db_user)
    
    async def create_user(
        self,
        username: str,
        hashed_password: str
    ) -> User:
        db_user = UserModel(
            username=username,
            hashed_password=hashed_password
        )
        self.db.add(db_user)
        
        await self.db.commit()
        return self._to_entity(db_user)
    
    async def update_password(
        self,
        user: User,
        hashed_password: str
    ) -> None:
        result = await self.db.execute(
            update(UserModel).where(UserModel.id == user.id).values(hashed_password=hashed_password)
        )
        if result.rowcount == 0:    #type: ignore
            raise ValueError(f"User with ID {user.id} not found")

        await self.db.commit()

    def _to_entity(self, db_user: UserModel) -> User:
        return User(
            id=db_user.id,
            username=db_user.username,
            hashed_password=db_user.hashed_password,
            is_active=db_user.is_active,
            is_admin=db_user.is_admin
        )
