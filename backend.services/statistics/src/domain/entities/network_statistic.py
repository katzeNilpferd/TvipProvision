from dataclasses import dataclass, field
from uuid import UUID, uuid4

from domain.value_objects.network_interface_statistic import NetworkInterfaceStats


@dataclass
class NetworkStatistic:
    """Represents network statistics from STB device."""
    
    device_id: UUID
    timestamp: int
    name: str
    speed: int
    duplex: str
    ip: str
    netmask: str
    gateway: str
    stat: NetworkInterfaceStats
    statistic_id: UUID = field(default_factory=uuid4)
