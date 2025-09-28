from abc import ABC, abstractmethod
from typing import Optional

from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig


class ProvisionRepository(ABC):

    @abstractmethod
    async def save_config(self, config: ProvisionConfig) -> None: ...

    @abstractmethod
    async def get_config(self, device: Device) -> Optional[ProvisionConfig]: ...
