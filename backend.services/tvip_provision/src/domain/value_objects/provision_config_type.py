from dataclasses import dataclass
from enum import Enum


class ConfigType(Enum):
    '''Enumeration for different types of provision configurations.'''
    DEFAULT = "default"
    CUSTOM = "custom"


@dataclass(frozen=True)
class ProvisionConfigType:
    '''Value object representing the type of provision configuration.'''
    value: ConfigType

    def __post_init__(self):
        if not isinstance(self.value, ConfigType):  # type: ignore
            raise ValueError(f"Config type must be ConfigType enum")

    @classmethod
    def create_default(cls) -> 'ProvisionConfigType':
        '''Factory method to create a ProvisionConfigType instance with DEFAULT type.'''
        return cls(ConfigType.DEFAULT)
    
    @classmethod
    def create_custom(cls) -> 'ProvisionConfigType':
        '''Factory method to create a ProvisionConfigType instance with CUSTOM type.'''
        return cls(ConfigType.CUSTOM)
    
    def is_default(self) -> bool:
        '''Checks if the configuration type is DEFAULT.'''
        return self.value == ConfigType.DEFAULT
    
    def is_custom(self) -> bool:
        '''Checks if the configuration type is CUSTOM.'''
        return self.value == ConfigType.CUSTOM
