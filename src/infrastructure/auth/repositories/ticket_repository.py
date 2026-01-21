from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone

from domain.auth.entities.ticket import Ticket, TicketType, TicketStatus
from domain.auth.repositories.ticket_repository import TicketRepository
from infrastructure.database.models import TicketModel


class SQLTicketRepository(TicketRepository):

    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session

    async def create_ticket(
        self,
        username: str,
        ticket_type: TicketType,
        description: Optional[str] = None
    ) -> Ticket:
        ticket = Ticket(
            username=username,
            ticket_type=ticket_type,
            description=description
        )
        ticket.generate_secret()

        db_ticket = self._to_model(ticket)

        self.db.add(db_ticket)
        await self.db.commit()
        return self._to_entity(db_ticket)

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

    async def update_ticket_status(self, ticket: Ticket, status: TicketStatus) -> None:
        result = await self.db.execute(
            select(TicketModel).where(TicketModel.id == ticket.id)
        )
        db_ticket = result.scalar_one_or_none()

        if db_ticket:
            db_ticket.status = status.value     #type: ignore

            if status == TicketStatus.RESOLVED:
                db_ticket.resolved_at = datetime.now(tz=timezone.utc)
            await self.db.commit()


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
