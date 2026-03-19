from typing import Any

from domain.value_objects.config_data import ConfigData


class DefaultConfigService:
    '''Service for managing default provision configurations.'''

    @staticmethod
    def get_default_config_template() -> dict[str, Any]:
        '''Returns a template for the default provision configuration.'''
        return {
            'provision': {
                '@reload': '3600',
                'provision_server': {'@name': ''},
                'operator': {'@name': ''},
                'syslog_host': {'@name': ''}
            }
        }
    
    @staticmethod
    def validate_default_config(config_data: ConfigData) -> bool:
        '''Validates the structure of the default configuration data.'''
        return config_data.validate_structure()
