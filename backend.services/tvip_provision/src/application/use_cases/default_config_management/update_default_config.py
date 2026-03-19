from typing import Any

from domain.entities.provision_config import ProvisionConfig
from domain.repositories.provision_repository import ProvisionRepository


class UpdateDefaultConfigUseCase:

    def __init__(
        self, 
        provision_repo: ProvisionRepository
    ):
        self.provision_repo = provision_repo

    async def execute(self, updates: dict[str, Any]):
        current_config = await self.provision_repo.get_default()

        if not current_config:
            raise ValueError("There is no default provision config.")

        new_config = await self._update_config(current_config, updates)

        return {
            "status": "success",
            "action": "updated_default",
            "config_id": str(new_config.id),
            "config_type": new_config.config_type.value.value
        }

    async def _update_config(
        self,
        current_config: ProvisionConfig,
        updates: dict[str, Any]
    ) -> ProvisionConfig:
        new_config_data = current_config.config_data.update(updates)
        current_config.config_data = new_config_data

        return await self.provision_repo.save(current_config)
