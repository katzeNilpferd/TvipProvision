from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress
from domain.value_objects.sort_order import SortOrder
from domain.entities.device import Device


class DeviceRepository(ABC):
    '''Abstract repository interface for Device entity.'''

    @abstractmethod
    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]:
        '''Retrieves a Device entity by its MAC address.'''

    @abstractmethod
    async def get_by_filters(
        self,
        ip_address: Optional[IpAddress] = None,
        model: Optional[str] = None,
        last_activity_from: Optional[datetime] = None,
        last_activity_to: Optional[datetime] = None,
        sort_by_last_activity: Optional[SortOrder] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> list[Device]:
        '''Retrieves a list of Device entities matching the given filters.'''

    @abstractmethod
    async def update_last_activity(self, mac_address: MacAddress) -> Optional[Device]:
        '''Updates the last activity timestamp of a Device entity.'''

    @abstractmethod
    async def save(self, device: Device) -> Device:
        '''Saves a Device entity to the repository.'''

    @abstractmethod
    async def delete(self, mac_address: MacAddress) -> bool:
        '''Deletes a Device entity from the repository by its MAC address.'''
