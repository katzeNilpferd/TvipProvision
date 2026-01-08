from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.auth.entities.user import User


class UserRepository(ABC):

    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        '''Retrieves a User entity by its ID.'''

    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        '''Retrieves a User entity by its username.'''

    @abstractmethod
    async def create_user(
        self,
        username: str,
        hashed_password: str
    ) -> User:
        '''Creates a new User entity in the repository.'''

    @abstractmethod
    async def update_password(
        self,
        user: User,
        hashed_password: str
    ) -> None:
        '''Updates the password of a User entity.'''
