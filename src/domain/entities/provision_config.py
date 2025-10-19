from dataclasses import dataclass, field
from uuid import UUID, uuid4

from domain.value_objects.config_data import ConfigData
from domain.value_objects.provision_config_type import ProvisionConfigType


@dataclass
class ProvisionConfig:
    id: UUID = field(default_factory=uuid4)
    config_data: ConfigData = field(default_factory=ConfigData.create)
    config_type: ProvisionConfigType = field(default_factory=ProvisionConfigType.create_default)
    description: str = ""
