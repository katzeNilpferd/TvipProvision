from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig


class ProvisionRepository(ABC):
    '''Abstract repository interface for ProvisionConfig entity.'''

    @abstractmethod
    async def get_by_id(self, config_id: UUID) -> Optional[ProvisionConfig]:
        '''Retrieves a ProvisionConfig entity by its ID.'''

    @abstractmethod
    async def get_by_device(self, device: Device) -> Optional[ProvisionConfig]:
        '''Retrieves a ProvisionConfig entity associated with a Device.'''

    @abstractmethod
    async def get_default(self) -> ProvisionConfig:
        '''Retrieves the default ProvisionConfig entity.'''

    @abstractmethod
    async def save(self, config: ProvisionConfig) -> ProvisionConfig:
        '''Saves a ProvisionConfig entity to the repository.'''

    @abstractmethod
    async def delete(self, config_id: UUID) -> bool:
        '''Deletes a ProvisionConfig entity by its ID.'''
