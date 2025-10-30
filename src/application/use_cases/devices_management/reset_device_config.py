from typing import Any

from domain.value_objects.mac_address import MacAddress
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository


class ResetDeviceConfigUseCase:

    def __init__(
        self, 
        device_repo: DeviceRepository, 
        provision_repo: ProvisionRepository,
    ):
        self.device_repo = device_repo
        self.provision_repo = provision_repo

    async def execute(self, mac_address: str) -> dict[str, Any]:
        mac = MacAddress(mac_address)

        device = await self.device_repo.get_by_mac(mac)
        if not device:
            raise ValueError(f"Device with MAC {mac_address} not found")
        
        current_config = await self.provision_repo.get_by_device(device)
        default_config = await self.provision_repo.get_default()

        if not current_config.config_type.is_default():
            device.assign_config(default_config.id)
            await self.device_repo.save(device)

            await self.provision_repo.delete(current_config.id)

        return {
            "status": "success",
            "action": "set_default",
            "device_id": str(device.id),
            "config_id": str(default_config.id),
            "config_type": default_config.config_type.value.value,
            "mac_address": mac_address
        }