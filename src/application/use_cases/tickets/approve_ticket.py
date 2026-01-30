from typing import Any, Optional
from uuid import UUID

from domain.auth.entities.user import User
from domain.auth.entities.ticket import Ticket, TicketType, TicketStatus
from domain.auth.repositories.user_repository import UserRepository
from domain.auth.repositories.ticket_repository import TicketRepository
from application.handlers.tickets.base import BaseTicketHandler


class ApproveTicketUseCase:

    def __init__(
        self,
        ticket_repo: TicketRepository,
        user_repo: UserRepository,
        ticket_handler: dict[TicketType, BaseTicketHandler]
    ) -> None:
        self.ticket_repo = ticket_repo
        self.user_repo = user_repo
        self.ticket_handler = ticket_handler

    async def execute(
        self,
        ticket_id: str,
        resolved_by: str
    ) -> dict[str, dict[str, Any]]:
        
        ticket = await self.ticket_repo.get_ticket_by_id(UUID(ticket_id))
        ticket = await self._check_ticket_validity(ticket)

        user = await self.user_repo.get_by_username(ticket.username)
        user = await self._check_user_availability(user)
        
        user = await self._handle_ticket(ticket, user)
        ticket.resolve(resolved_by=resolved_by)

        await self.user_repo.save(user)
        await self.ticket_repo.save(ticket)

        return {
            'ticket': {
                'id': str(ticket.id),
                'ticket_type': ticket.ticket_type,
                'status': ticket.status,
                'description': ticket.description,
                'created_at': ticket.created_at
            }
        }

    async def _check_ticket_validity(self, ticket: Optional[Ticket]) -> Ticket:
        if not ticket:
            raise ValueError(f'Ticket with id {ticket.id} not found')   # type: ignore

        if ticket.status != TicketStatus.IN_PROGRESS:
            raise ValueError(f'Only tickets with in progress status can be rejected')
        
        if not ticket.ticket_type:
            raise ValueError(f'Ticket type is invalid')
        
        return ticket

    async def _check_user_availability(self, user: Optional[User]) -> User:
        if not user:
            raise ValueError("Invalid username or password")
        
        if not user.is_active:
            raise ValueError("User account is inactive")

        return user
    
    async def _handle_ticket(self, ticket: Ticket, user: User) -> User:
        handler = self.ticket_handler.get(ticket.ticket_type)

        if not handler:
            raise ValueError(f'No handler found for ticket type {ticket.ticket_type}')
        
        return await handler.handle(user)
