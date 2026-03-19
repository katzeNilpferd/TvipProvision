from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.auth.entities.ticket import Ticket


class TicketRepository(ABC):
    """Abstract base class for ticket repository operations."""

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
    async def save(self, ticket: Ticket) -> Ticket:
        """Save or update a ticket in the repository."""
