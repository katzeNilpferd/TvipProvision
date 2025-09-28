from dataclasses import dataclass, field
from uuid import UUID, uuid4

from domain.value_objects.config_data import ConfigData


@dataclass
class ProvisionConfig:
    id: UUID = field(default_factory=uuid4)
    config_data: ConfigData = field(default_factory=ConfigData.create)
    description: str = ""
