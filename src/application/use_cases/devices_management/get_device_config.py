from typing import Any

from domain.value_objects.mac_address import MacAddress
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository


class GetDeviceConfigUseCase:

    def __init__(
        self, 
        device_repo: DeviceRepository, 
        provision_repo: ProvisionRepository,
    ):
        self.device_repo = device_repo
        self.provision_repo = provision_repo

    async def execute(self, mac_address: str) -> dict[str, dict[str, Any]]:
        mac = MacAddress(mac_address)

        device = await self.device_repo.get_by_mac(mac)
        if not device:
            raise ValueError(f"Device with MAC {mac_address} not found")
        
        config = await self.provision_repo.get_by_device(device)
        if not config:
            config = self.provision_repo.get_default()
        
        return {
            'device': {
                'id': str(device.id),
                'mac_address': device.mac_address.value,
                'model': device.model,
                'last_activity': device.last_activity
            },
            'config': {
                'id': str(config.id),
                'type': config.config_type.value.value,
                'description': config.description,
                'parameters': config.config_data.data
            }
        }
