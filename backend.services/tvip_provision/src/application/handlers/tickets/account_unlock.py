from domain.auth.entities.user import User
from application.handlers.tickets.base import BaseTicketHandler


class AccountUnlockHandler(BaseTicketHandler):
    
    async def handle(
        self,
        user: User
    ) -> User:

        user.is_active = True
        return user
