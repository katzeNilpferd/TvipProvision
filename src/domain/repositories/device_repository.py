from abc import ABC, abstractmethod
from typing import Optional

from domain.entities.device import Device
from domain.value_objects.mac_address import MacAddress


class DeviceRepository(ABC):

    @abstractmethod
    async def save(self, device: Device) -> Device: ...

    @abstractmethod
    async def delete(self, mac_address: MacAddress) -> bool: ...

    @abstractmethod
    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]: ...

    @abstractmethod
    async def update_last_activity(self, mac_address: MacAddress) -> Optional[Device]: ...
