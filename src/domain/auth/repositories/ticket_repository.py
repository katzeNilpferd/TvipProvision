from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.auth.entities.ticket import Ticket, TicketType, TicketStatus


class TicketRepository(ABC):
    """Abstract base class for ticket repository operations."""

    @abstractmethod
    async def create_ticket(
        self,
        username: str,
        ticket_type: TicketType,
        description: Optional[str] = None
    ) -> Ticket:
        """Create a new ticket for a user for a specific event."""

    @abstractmethod
    async def get_ticket_by_id(self, ticket_id: UUID) -> Optional[Ticket]:
        """Retrieve a ticket by its ID."""

    @abstractmethod
    async def get_tickets_by_username(self, username: str) -> list[Ticket]:
        """Retrieve all tickets for a given username."""

    @abstractmethod
    async def get_in_progress_ticket(self) -> list[Ticket]:
        """Retrieve an in-progress ticket for a user for a specific event."""

    @abstractmethod
    async def update_ticket_status(self, ticket: Ticket, status: TicketStatus) -> None:
        """Update the status of a ticket."""
