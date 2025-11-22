from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress


@dataclass
class Device:
    '''Represents a network device with its attributes and behaviors.'''

    mac_address: MacAddress
    model: Optional[str] = None
    last_activity: Optional[datetime] = None
    ip_address: Optional[IpAddress] = None
    id: UUID = field(default_factory=uuid4)
    config_id: Optional[UUID] = None

    def update_last_activity(self) -> None:
        '''Updates the last activity timestamp to the current UTC time.'''
        self.last_activity = datetime.utcnow()  # type: ignore

    def assign_config(self, config_id: UUID) -> None:
        '''Assigns a configuration ID to the device.'''
        self.config_id = config_id
