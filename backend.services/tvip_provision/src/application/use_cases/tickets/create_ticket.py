from typing import Optional, Any

from domain.auth.entities.ticket import Ticket
from domain.auth.entities.ticket import TicketType, TicketStatus
from domain.auth.repositories.ticket_repository import TicketRepository
from domain.auth.repositories.user_repository import UserRepository


class CreateTicketUseCase:

    def __init__(
        self,
        ticket_repo: TicketRepository,
        user_repo: UserRepository
    ) -> None:
        self.ticket_repo = ticket_repo
        self.user_repo = user_repo

    async def execute(
        self,
        username: str,
        ticket_type: TicketType,
        description: Optional[str] = None
    ) -> dict[str, dict[str, Any]]:
        if not await self._check_user_exists(username):
            raise ValueError(f"User '{username}' does not exist")

        ticket = await self._get_existing_active_ticket(username, ticket_type)
        if not ticket:
            ticket = Ticket(
                username=username,
                ticket_type=ticket_type,
                description=description
            )
            ticket.generate_secret()
            ticket = await self.ticket_repo.save(ticket)

        return {
            'user': {
                'username': username
            },
            'ticket': {
                'id': str(ticket.id),
                'ticket_type': ticket.ticket_type,
                'status': ticket.status,
                'description': ticket.description,
                'created_at': ticket.created_at
            }
        }

    async def _check_user_exists(self, username: str) -> bool:
        user = await self.user_repo.get_by_username(username)
        if not user:
            return False
        return True

    async def _get_existing_active_ticket(
        self,
        username: str,
        ticket_type: TicketType
    ) -> Optional[Ticket]:
        tickets = await self.ticket_repo.get_tickets_by_username(username)
        for ticket in tickets:
            if ticket.ticket_type == ticket_type and ticket.status == TicketStatus.IN_PROGRESS.value:
                return ticket
        return None
