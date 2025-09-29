from typing import Any

from domain.value_objects.config_data import ConfigData
from infrastructure.value_objects.pydash_config_data import PydashConfigData


class ConfigDataFactory:

    @staticmethod
    def create(data: dict[str, Any]) -> 'ConfigData':
        return PydashConfigData.create(data)
