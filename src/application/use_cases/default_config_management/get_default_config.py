from typing import Any

from domain.repositories.provision_repository import ProvisionRepository


class GetDefaultConfigUseCase:

    def __init__(
        self,
        provision_repo: ProvisionRepository
    ):
        self.provision_repo = provision_repo

    async def execute(self) -> dict[str, dict[str, Any]]:
        default_config = await self.provision_repo.get_default()

        if not default_config:
            raise ValueError("There is no default provision config.")
        
        return {
            'config': {
                'id': str(default_config.id),
                'type': default_config.config_type.value.value,
                'description': default_config.description,
                'parameters': default_config.config_data.data
            }
        }
