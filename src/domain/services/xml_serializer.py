from abc import ABC, abstractmethod

from domain.entities.provision_config import ProvisionConfig


class XmlSerializer(ABC):
    '''Abstract serializer interface for ProvisionConfig entity to XML format.'''
    
    @abstractmethod
    def serialize(self, config: ProvisionConfig) -> str:
        '''Serializes a ProvisionConfig entity to an XML string.'''
