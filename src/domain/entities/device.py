from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from domain.value_objects.mac_address import MacAddress


@dataclass
class Device:
    mac_address: MacAddress
    model: Optional[str] = None
    last_activity: Optional[datetime] = None