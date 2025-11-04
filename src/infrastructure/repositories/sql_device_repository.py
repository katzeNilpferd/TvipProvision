from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.entities.device import Device
from domain.repositories.device_repository import DeviceRepository
from infrastructure.database.models import DeviceModel


class SQLDeviceRepository(DeviceRepository):

    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session

    async def save(self, device: Device) -> Device:
        result = await self.db.execute(
            select(DeviceModel).where(DeviceModel.mac_address == device.mac_address.value)
        )
        db_device = result.scalar_one_or_none()

        if db_device:
            #Update
            db_device.model = device.model
            db_device.last_activity = device.last_activity
            db_device.config_id = device.config_id
        else:
            #Create
            db_device = DeviceModel(
                id = device.id,
                mac_address = device.mac_address.value,
                model = device.model,
                last_activity = device.last_activity,
                config_id = device.config_id
            )
            self.db.add(db_device)
        
        await self.db.commit()
        return self._to_entity(db_device)

    async def delete(self, mac_address: MacAddress) -> bool:
        result = await self.db.execute(
            select(DeviceModel).where(DeviceModel.mac_address == mac_address.value)
        )
        db_device = result.scalar_one_or_none()

        if not db_device:
            return False
        
        await self.db.delete(db_device)
        await self.db.commit()
        return True

    async def get_by_mac(self, mac_address: MacAddress) -> Optional[Device]:
        result = await self.db.execute(
            select(DeviceModel).where(DeviceModel.mac_address == mac_address.value)
        )
        db_device = result.scalar_one_or_none()

        return self._to_entity(db_device) if db_device else None

    async def update_last_activity(self, mac_address: MacAddress) -> Optional[Device]:
        result = await self.db.execute(
            select(DeviceModel).where(DeviceModel.mac_address == mac_address.value)
        )
        db_device = result.scalar_one_or_none()

        if not db_device:
            return None
        
        db_device.last_activity = datetime.utcnow()
        await self.db.commit()
        return self._to_entity(db_device)

    
    def _to_entity(self, db_device: DeviceModel) -> Device:
        return Device(
            id=db_device.id,
            mac_address=MacAddress(db_device.mac_address),
            model=db_device.model,
            last_activity=db_device.last_activity,
            config_id=db_device.config_id
        )
