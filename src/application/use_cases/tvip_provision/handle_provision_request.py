from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress
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

    async def execute(self, mac_address: str, ip_address: Optional[str] = None) -> str:
        mac = MacAddress(mac_address)
        device = await self._get_or_create_device(mac_address=mac, ip_address=ip_address)
        config = await self.provision_repo.get_by_device(device)

        if not config:
            raise ValueError('Сonfiguration file could not be found.')

        return self.xml_serializer.serialize(config)

    async def _get_or_create_device(self, mac_address: MacAddress, ip_address: Optional[str] = None) -> Device:
        device = await self.device_repo.get_by_mac(mac_address)
        
        ip_value_object = IpAddress(ip_address) if ip_address else None
        
        if device:
            device.update_last_activity()
            device.ip_address = ip_value_object
        
        else:
            device = Device(mac_address=mac_address, ip_address=ip_value_object)
            config = await self.provision_repo.get_default()
            
            device.assign_config(config_id=config.id)
            device.update_last_activity()
        
        device = await self.device_repo.save(device)
        return device
