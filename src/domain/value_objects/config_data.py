from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ConfigData:
    data: dict[str, Any]

    def get(self, path: str) -> Any:
        raise NotImplementedError()
    
    def set(self, path: str, value: Any) -> 'ConfigData':
        raise NotImplementedError()

    def update(self, updates: dict[str, Any]) -> 'ConfigData':
        raise NotImplementedError()
    
    @classmethod
    def create(cls, data: dict[str, Any]) -> 'ConfigData':
        return cls(data=data or {})
