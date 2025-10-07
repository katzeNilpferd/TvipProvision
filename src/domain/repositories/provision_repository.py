from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig


class ProvisionRepository(ABC):

    @abstractmethod
    async def get_by_id(self, config_id: UUID) -> Optional[ProvisionConfig]: ...

    @abstractmethod
    async def get_by_device(self, device: Device) -> Optional[ProvisionConfig]: ...

    @abstractmethod
    async def get_default(self) -> ProvisionConfig: ...

    @abstractmethod
    async def save(self, config: ProvisionConfig) -> ProvisionConfig: ...

    @abstractmethod
    async def delete(self, config_id: UUID) -> bool: ...
