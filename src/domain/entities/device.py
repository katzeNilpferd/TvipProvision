from dataclasses import dataclass, field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from domain.value_objects.mac_address import MacAddress


@dataclass
class Device:
    mac_address: MacAddress
    model: Optional[str] = None
    last_activity: Optional[datetime] = None
    id: UUID = field(default_factory=uuid4)
    config_id: Optional[UUID] = None
