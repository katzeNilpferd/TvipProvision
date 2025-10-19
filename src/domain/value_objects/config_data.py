from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class ConfigData:
    data: dict[str, Any]

    def get(self, path: str) -> Any:
        raise NotImplementedError()
    
    def set(self, path: str, value: Any) -> 'ConfigData':
        raise NotImplementedError()

    def update(self, updates: dict[str, Any]) -> 'ConfigData':
        raise NotImplementedError()
    
    def validate_structure(self, required_params: Optional[list[str]] = None) -> bool:
        
        if required_params:
            for param in required_params:
                if self.get(param) is None:
                    return False
            
        if len(self.data) != 1:
            return False
        
        return True

    @classmethod
    def create(cls, data: dict[str, Any]) -> 'ConfigData':
        return cls(data=data or {})
