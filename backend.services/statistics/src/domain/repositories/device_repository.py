from abc import ABC, abstractmethod
from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device


class DeviceRepository(ABC):
    '''Abstract repository interface for Device entity.'''

    @abstractmethod
    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]:
        '''Retrieves a Device entity by its MAC address.'''

    @abstractmethod
    async def get_count_network_statistics(self, device: Device) -> int:
        '''Retrieves the count of network statistics associated with a Device entity.'''

    @abstractmethod
    async def get_count_media_statistics(self, device: Device) -> int:
        '''Retrieves the count of media statistics associated with a Device entity.'''

    @abstractmethod
    async def update_last_activity(self, device: Device) -> Optional[Device]:
        '''Updates the last activity timestamp of a Device entity.'''

    @abstractmethod
    async def save(self, device: Device) -> Device:
        '''Saves a Device entity to the repository.'''

    @abstractmethod
    async def delete(self, device: Device) -> None:
        '''Deletes a Device entity from the repository.'''
