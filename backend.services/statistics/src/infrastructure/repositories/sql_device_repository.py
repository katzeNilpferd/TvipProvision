from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device
from domain.repositories.device_repository import DeviceRepository
from infrastructure.database.mappers import DeviceMapper as _
from infrastructure.database.models import DeviceModel
from infrastructure.database.models import MediaStatisticModel
from infrastructure.database.models import NetworkStatisticModel

class PGDeviceRepository(DeviceRepository):
    '''PostgreSQL implementation of the DeviceRepository interface.'''

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
    
    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]:
        result = await self.db_session.execute(
            select(DeviceModel).where(DeviceModel.mac_address == mac_address.value)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        return _.to_entity(model)
    
    async def get_count_network_statistics(self, device: Device) -> int:
        result = await self.db_session.execute(
            select(func.count()).select_from(NetworkStatisticModel).where(
                NetworkStatisticModel.device_id == device.id
            )
        )
        return result.scalar_one()
    
    async def get_count_media_statistics(self, device: Device) -> int:
        result = await self.db_session.execute(
            select(func.count()).select_from(MediaStatisticModel).where(
                MediaStatisticModel.device_id == device.id
            )
        )
        return result.scalar_one()
    
    async def update_last_activity(self, device: Device) -> Optional[Device]:
        result = await self.db_session.execute(
            select(DeviceModel).where(DeviceModel.id == device.id)
        )
        model = result.scalar_one_or_none()
        
        if not model:
            return None
        
        model.last_activity = device.last_activity
        await self.db_session.flush()
        
        return _.to_entity(model)
    
    async def save(self, device: Device) -> Device:
        result = await self.db_session.execute(
            select(DeviceModel).where(DeviceModel.mac_address == device.mac_address.value)
        )
        model = result.scalar_one_or_none()
        
        if model:
            # Update existing
            model = _.update_model(model, device)
        else:
            # Create new
            model = _.to_model(device)
            self.db_session.add(model)
        
        await self.db_session.flush()

        return device
    
    async def delete(self, device: Device) -> None:
        result = await self.db_session.execute(
            select(DeviceModel).where(DeviceModel.id == device.id)
        )
        model = result.scalar_one_or_none()
        
        if model:
            await self.db_session.delete(model)
            await self.db_session.flush()
