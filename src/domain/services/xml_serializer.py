from abc import ABC, abstractmethod

from domain.entities.provision_config import ProvisionConfig


class XmlSerializer(ABC):
    
    @abstractmethod
    def serialize(self, config: ProvisionConfig) -> str: ...
