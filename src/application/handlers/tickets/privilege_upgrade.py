from domain.auth.entities.user import User
from application.handlers.tickets.base import BaseTicketHandler


class PrivilegeUpgradeHandler(BaseTicketHandler):
    
    async def handle(
        self,
        user: User
    ) -> User:

        user.is_admin = True
        return user
