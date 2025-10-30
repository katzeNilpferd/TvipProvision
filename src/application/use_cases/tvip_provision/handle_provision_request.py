from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository
from domain.services.xml_serializer import XmlSerializer


class HandleProvisionRequestUseCase:

    def __init__(
        self, 
        device_repo: DeviceRepository, 
        provision_repo: ProvisionRepository,
        xml_serializer: XmlSerializer
    ):
        self.device_repo = device_repo
        self.provision_repo = provision_repo
        self.xml_serializer = xml_serializer

    async def execute(self, mac_address: str) -> str:
        mac = MacAddress(mac_address)
        device = await self._get_or_create_device(mac_address=mac)
        config = await self.provision_repo.get_by_device(device)

        if not config:
            raise ValueError('Сonfiguration file could not be found.')

        return self.xml_serializer.serialize(config)

    async def _get_or_create_device(self, mac_address: MacAddress) -> Device:
        device = await self.device_repo.get_by_mac(mac_address)
        
        if device:
            device.update_last_activity()
        
        else:
            device = Device(mac_address=mac_address)
            config = await self.provision_repo.get_default()
            
            device.assign_config(config_id=config.id)
            device.update_last_activity()
        
        device = await self.device_repo.save(device)
        return device
