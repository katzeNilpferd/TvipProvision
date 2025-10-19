from typing import Any

from domain.value_objects.config_data import ConfigData


class DefaultConfigService:

    @staticmethod
    def get_default_config_template() -> dict[str, Any]:
        return {
            'provision': {
                '@reload': '3600',
                'provision_server': {'name': ''},
                'operator': {'name': ''},
                'syslog_host': {'name': ''}
            }
        }
    
    @staticmethod
    def validate_default_config(config_data: ConfigData) -> bool:
        """Валидация дефолтного конфига"""
        required_params = [
            'provision.@reload',
            'provision.provision_server',
            'provision.operator', 
            'provision.syslog_host'
        ]
        return config_data.validate_structure(required_params)
