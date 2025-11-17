from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime

from domain.entities.device import Device
from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress


class DeviceRepository(ABC):

    @abstractmethod
    async def save(self, device: Device) -> Device: ...

    @abstractmethod
    async def delete(self, mac_address: MacAddress) -> bool: ...

    @abstractmethod
    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]: ...

    @abstractmethod
    async def update_last_activity(self, mac_address: MacAddress) -> Optional[Device]: ...

    @abstractmethod
    async def get_by_filters(
        self,
        ip_address: Optional[IpAddress] = None,
        model: Optional[str] = None,
        last_activity_from: Optional[datetime] = None,
        last_activity_to: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> list[Device]: ...
