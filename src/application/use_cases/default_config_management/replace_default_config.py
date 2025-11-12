from typing import Any

from domain.entities.provision_config import ProvisionConfig
from domain.repositories.provision_repository import ProvisionRepository


class ReplaceDefaultConfigUseCase:
    
    def __init__(self, provision_repo: ProvisionRepository):
        self.provision_repo = provision_repo

    async def execute(self, new_config_data: dict[str, Any]):
        current_config = await self.provision_repo.get_default()

        if not current_config:
            raise ValueError("There is no default provision config.")

        new_config = await self._replace_config(current_config, new_config_data)

        return {
            "status": "success",
            "action": "replaced_default",
            "config_id": str(new_config.id),
            "config_type": new_config.config_type.value.value
        }

    async def _replace_config(
        self,
        current_config: ProvisionConfig,
        new_config_data: dict[str, Any]
    ) -> ProvisionConfig:
        config_data = current_config.config_data.replace(new_config_data)
        current_config.config_data = config_data

        return await self.provision_repo.save(current_config)

