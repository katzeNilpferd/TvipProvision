from typing import Any

from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository


class UpdateDeviceConfigUseCase:
    def __init__(self, device_repo: DeviceRepository, provision_repo: ProvisionRepository):
        self.device_repo = device_repo
        self.provision_repo = provision_repo

    async def execute(self, mac_address: str, updates: dict[str, Any]):
        mac = MacAddress(mac_address)

        device = await self.device_repo.get_by_mac(mac)
        if not device:
            raise ValueError(f"Device with MAC {mac_address} not found")
        
        current_config = await self.provision_repo.get_by_device(device)

        if not current_config or current_config.config_type.is_default():
            new_config = await self._create_custom_config(device, updates)
            action = "created_custom"
        
        else:
            new_config = await self._update_existing_config(current_config, updates)
            action = "updated_custom"

        device.assign_config(new_config.id)
        await self.device_repo.save(device)

        return {
            "status": "success",
            "action": action,
            "device_id": str(device.id),
            "config_id": str(new_config.id),
            "config_type": new_config.config_type.value.value,
            "mac_address": mac_address
        }
    
    async def _create_custom_config(
        self,
        device: Device,
        updates: dict[str, Any]
    ) -> ProvisionConfig:
        default_config = await self.provision_repo.get_default()
    
        new_config_data = default_config.config_data.update(updates)
        custom_config_type = default_config.config_type.create_custom()

        custom_config = ProvisionConfig(
            config_data=new_config_data,
            config_type=custom_config_type,
            description=f"Custom config for {device.mac_address.value}"
        )
        return await self.provision_repo.save(custom_config)

    async def _update_existing_config(
        self, 
        current_config: ProvisionConfig, 
        updates: dict[str, Any]
    ) -> ProvisionConfig:
        current_config.config_data.update(updates)
        
        return await self.provision_repo.save(current_config)
