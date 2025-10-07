from dataclasses import dataclass
from enum import Enum


class ConfigType(Enum):
    DEFAULT = "default"
    CUSTOM = "custom"


@dataclass(frozen=True)
class ProvisionConfigType:
    value: ConfigType

    def __post_init__(self):
        if not isinstance(self.value, ConfigType):
            raise ValueError(f"Config type must be ConfigType enum")

    @classmethod
    def create_default(cls) -> 'ProvisionConfigType':
        return cls(ConfigType.DEFAULT)
    
    @classmethod
    def create_custom(cls) -> 'ProvisionConfigType':
        return cls(ConfigType.CUSTOM)