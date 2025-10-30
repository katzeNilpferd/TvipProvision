import pydash
from typing import Any

from domain.value_objects.config_data import ConfigData


class PydashConfigData(ConfigData):

    def get(self, path: str) -> Any:
        return pydash.get(self.data, path)
    
    def set(self, path: str, value: Any) -> 'PydashConfigData':
        new_data = pydash.clone_deep(self.data)
        pydash.set_(new_data, path, value)
        return PydashConfigData(new_data)

    def update(self, updates: dict[str, Any]) -> 'PydashConfigData':
        new_data = pydash.clone_deep(self.data)

        for path, value in updates.items():
            if not path.startswith('provision.'):
                path = f'provision.{path}'
            
            pydash.set_(new_data, path, value)
            
        return PydashConfigData(new_data)

    @classmethod
    def create(cls, data: dict[str, Any]) -> 'PydashConfigData':
        return cls(data=data or {})
