from typing import Any

from domain.auth.repositories.ticket_repository import TicketRepository


class GetInProgressTicketUseCase:

    def __init__(
        self,
        ticket_repo: TicketRepository
    ) -> None:
        self.ticket_repo = ticket_repo
        
    async def execute(
        self
    ) -> list[dict[str, Any]]:
        
        tickets = await self.ticket_repo.get_in_progress_ticket()
        return [
            {
                'id': str(t.id),
                'username': t.username,
                'ticket_type': t.ticket_type.value,
                'status': t.status.value,
                'description': t.description,
                'created_at': t.created_at,
                'resolved_at': t.resolved_at,
                'resolved_by': t.resolved_by,
                'secret': t.secret,
                'secret_hint': t.secret_hint
            }
            for t in tickets
        ]
