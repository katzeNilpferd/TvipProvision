from typing import Any, Optional
from uuid import UUID

from domain.auth.entities.ticket import Ticket, TicketStatus
from domain.auth.repositories.ticket_repository import TicketRepository


class RejectTicketUseCase:

    def __init__(
        self,
        ticket_repo: TicketRepository
    ) -> None:
        self.ticket_repo = ticket_repo

    async def execute(
        self,
        ticket_id: str,
        resolved_by: str
    ) -> dict[str, dict[str, Any]]:
        
        ticket = await self.ticket_repo.get_ticket_by_id(
            ticket_id=UUID(ticket_id)
        )
        ticket = await self._check_ticket_validity(ticket)
        ticket.reject(resolved_by=resolved_by)
        
        await self.ticket_repo.save(ticket=ticket)

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
        
        return ticket