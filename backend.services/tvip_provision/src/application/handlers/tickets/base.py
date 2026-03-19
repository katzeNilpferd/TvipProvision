from abc import ABC, abstractmethod

from domain.auth.entities.user import User


class BaseTicketHandler(ABC):
    '''Abstract base class for ticket handlers.'''

    @abstractmethod
    async def handle(
        self,
        user: User
    ) -> User:
        '''Handle ticket processing based on its type.'''

