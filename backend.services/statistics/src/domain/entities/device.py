from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress


@dataclass
class Device:
    '''Represents a network device with its attributes and behaviors.'''

    mac_address: MacAddress
    model: Optional[str] = None
    ip_address: Optional[IpAddress] = None
    last_activity: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))
    id: UUID = field(default_factory=uuid4)

    def update_last_activity(self) -> None:
        '''Updates the last activity timestamp to the current UTC time.'''
        self.last_activity = datetime.now(tz=timezone.utc)
