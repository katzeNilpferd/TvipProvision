from typing import Any

from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig
from domain.value_objects.provision_config_type import ProvisionConfigType
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository
from infrastructure.factories.config_data_factory import ConfigDataFactory


class ReplaceDeviceConfigUseCase:
    
    def __init__(self, device_repo: DeviceRepository, provision_repo: ProvisionRepository):
        self.device_repo = device_repo
        self.provision_repo = provision_repo

    async def execute(self, mac_address: str, new_config_data: dict[str, Any]):
        mac = MacAddress(mac_address)

        device = await self.device_repo.get_by_mac(mac)
        if not device:
            raise ValueError(f"Device with MAC {mac_address} not found")
        
        current_config = await self.provision_repo.get_by_device(device)

        if not current_config or current_config.config_type.is_default():
            new_config = await self._create_custom_config(device, new_config_data)
            action = "created_custom"
        else:
            new_config = await self._replace_existing_config(current_config, new_config_data)
            action = "replaced_custom"

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
        new_config_data: dict[str, Any]
    ) -> ProvisionConfig:
        empty_config_data = ConfigDataFactory.create({})
        config_data = empty_config_data.replace(new_config_data)
        
        custom_config_type = ProvisionConfigType.create_custom()

        custom_config = ProvisionConfig(
            config_data=config_data,
            config_type=custom_config_type,
            description=f"Custom config for {device.mac_address.value}"
        )
        return await self.provision_repo.save(custom_config)

    async def _replace_existing_config(
        self, 
        current_config: ProvisionConfig, 
        new_config_data: dict[str, Any]
    ) -> ProvisionConfig:
        config_data = current_config.config_data.replace(new_config_data)
        current_config.config_data = config_data

        return await self.provision_repo.save(current_config)

