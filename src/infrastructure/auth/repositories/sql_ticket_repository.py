from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID

from domain.auth.entities.ticket import Ticket, TicketStatus
from domain.auth.repositories.ticket_repository import TicketRepository
from infrastructure.database.models import TicketModel


class SQLTicketRepository(TicketRepository):

    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session
    
    async def get_ticket_by_id(self, ticket_id: UUID) -> Optional[Ticket]:
        result = await self.db.execute(
            select(TicketModel).where(TicketModel.id == ticket_id)
        )
        db_ticket = result.scalar_one_or_none()
        if db_ticket:
            return self._to_entity(db_ticket)
        return None

    async def get_tickets_by_username(self, username: str) -> list[Ticket]:
        result = await self.db.execute(
            select(TicketModel).where(TicketModel.username == username)
        )
        db_tickets = result.scalars().all()
        return [self._to_entity(db_ticket) for db_ticket in db_tickets]

    async def get_in_progress_ticket(self) -> list[Ticket]:
        result = await self.db.execute(
            select(TicketModel).where(TicketModel.status == TicketStatus.IN_PROGRESS.value)
        )
        db_tickets = result.scalars().all()
        return [self._to_entity(db_ticket) for db_ticket in db_tickets]

    async def save(self, ticket: Ticket) -> Ticket:
        db_ticket = self._to_model(ticket)

        existing_ticket = await self.get_ticket_by_id(ticket.id)
        if existing_ticket:
            await self.db.merge(db_ticket)
        else:
            self.db.add(db_ticket)
        
        await self.db.commit()
        return self._to_entity(db_ticket)

    def _to_entity(self, db_ticket: TicketModel) -> Ticket:
        return Ticket(
            id=db_ticket.id,
            username=db_ticket.username,
            ticket_type=db_ticket.ticket_type,
            status=db_ticket.status,
            description=db_ticket.description,
            created_at=db_ticket.created_at,
            resolved_at=db_ticket.resolved_at,
            resolved_by=db_ticket.resolved_by,
            secret=db_ticket.secret,
            secret_hint=db_ticket.secret_hint
        )

    def _to_model(self, ticket: Ticket) -> TicketModel:
        return TicketModel(
            id=ticket.id,
            username=ticket.username,
            ticket_type=ticket.ticket_type.value,
            status=ticket.status.value,
            description=ticket.description,
            created_at=ticket.created_at,
            resolved_at=ticket.resolved_at,
            resolved_by=ticket.resolved_by,
            secret=ticket.secret,
            secret_hint=ticket.secret_hint
        )
