from typing import Any

from domain.auth.entities.ticket import TicketType, TicketStatus
from domain.auth.repositories.ticket_repository import TicketRepository
from domain.auth.repositories.user_repository import UserRepository
from infrastructure.auth.password_hasher import PasswordHasher


class PasswordRecoveryUseCase:
    
    def __init__(
        self,
        ticket_repo: TicketRepository,
        user_repo: UserRepository,
        password_hasher: PasswordHasher
    ) -> None:
        self.ticket_repo = ticket_repo
        self.user_repo = user_repo
        self.password_hasher = password_hasher

    async def execute(
        self,
        username: str,
        secret_key: str,
        new_password: str
    ) -> dict[str, dict[str, Any]]:
        user = await self.user_repo.get_by_username(username)
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        tickets = await self.ticket_repo.get_tickets_by_username(username)
        valid_ticket = None
        
        for ticket in tickets:
            if (ticket.ticket_type == TicketType.FORGOT_PASSWORD and 
                ticket.status == TicketStatus.IN_PROGRESS):
                valid_ticket = ticket
                break
        
        if not valid_ticket:
            raise ValueError("No active password recovery requests found")

        if valid_ticket.secret != secret_key:
            raise ValueError("Invalid secret key")

        new_hashed_password = self.password_hasher.hash_password(new_password)
        await self.user_repo.update_password(user, new_hashed_password)
        await self.ticket_repo.update_ticket_status(valid_ticket, TicketStatus.RESOLVED)

        return {
            'user': {
                'id': str(user.id),
                'username': user.username,
                'is_admin': user.is_admin,
                'is_active': user.is_active
            }
        }
