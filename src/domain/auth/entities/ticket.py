from dataclasses import dataclass, field
from uuid import UUID, uuid4
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
import secrets


class TicketType(str, Enum):
    FORGOT_PASSWORD = "forgot_password"
    PRIVILEGE_UPGRADE = "privilege_upgrade"
    ACCOUNT_UNLOCK = "account_unlock"


class TicketStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"


@dataclass
class Ticket:
    '''Domain entity representing a support ticket.'''

    username: str
    ticket_type: TicketType
    status: TicketStatus = TicketStatus.IN_PROGRESS
    description: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    secret: Optional[str] = None
    secret_hint: Optional[str] = None
    id: UUID = field(default_factory=uuid4)

    def generate_secret(self, length: int = 6) -> None:
        '''Generates a random secret for the ticket.'''

        if self.ticket_type == TicketType.FORGOT_PASSWORD:
            self.secret = ''.join(secrets.choice('0123456789') for _ in range(length))
            self.secret_hint = 'Сообщите пользователю код для сброса пароля.'
        else:
            self.secret = None
            self.secret_hint = None

    def resolve(self, resolved_by: Optional[str] = None) -> None:
        '''Marks the ticket as resolved.'''

        self.status = TicketStatus.RESOLVED
        self.resolved_at = datetime.now(tz=timezone.utc)
        self.resolved_by = resolved_by
