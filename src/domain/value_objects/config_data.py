from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class ConfigData:
    '''Provides configuration data for config provision with methods for processing and validating it.'''

    data: dict[str, Any]

    def get(self, path: str) -> Any:
        '''Retrieves a value from the configuration data based on the provided path.'''
        raise NotImplementedError()
    
    def set(self, path: str, value: Any) -> 'ConfigData':
        '''Sets a value in the configuration data at the specified path.'''
        raise NotImplementedError()

    def update(self, updates: dict[str, Any]) -> 'ConfigData':
        '''Updates existing configuration data by adding/modifying data.'''
        raise NotImplementedError()
    
    def replace(self, new_data: dict[str, Any]) -> 'ConfigData':
        '''Replaces the entire configuration data with new data.'''
        raise NotImplementedError()
    
    def validate_structure(self, required_params: Optional[list[str]] = None) -> bool:
        '''
        Validates the structure of the configuration data.
        
        - Checks that only one root element is present in the dictionary.

        Args:
            required_params (list[str] | None): List of required parameter keys to check for presence.
        '''
        if required_params:
            for param in required_params:
                if self.get(param) is None:
                    return False
            
        if len(self.data) != 1:
            return False
        
        return True

    @classmethod
    def create(cls, data: dict[str, Any] = {}) -> 'ConfigData':
        '''Factory method to create a ConfigData instance from a dictionary.'''
        return cls(data=data or {})
