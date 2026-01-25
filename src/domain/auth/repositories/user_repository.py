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
    async def save(self, user: User) -> User:
        '''Saves or updates the User entity to the repository.'''
