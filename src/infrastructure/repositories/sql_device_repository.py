from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress
from domain.value_objects.sort_order import SortOrder
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
            db_device.model = device.model  # type: ignore
            db_device.last_activity = device.last_activity  # type: ignore
            db_device.ip_address = device.ip_address.value if device.ip_address else None  # type: ignore
            db_device.config_id = device.config_id  # type: ignore
        else:
            #Create
            db_device = DeviceModel(
                id = device.id,
                mac_address = device.mac_address.value,
                model = device.model,
                last_activity = device.last_activity,
                ip_address = device.ip_address.value if device.ip_address else None,
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
        
        db_device.last_activity = datetime.now(tz=timezone.utc)
        await self.db.commit()
        return self._to_entity(db_device)

    async def get_by_filters(
        self,
        ip_address: Optional[IpAddress] = None,
        model: Optional[str] = None,
        last_activity_from: Optional[datetime] = None,
        last_activity_to: Optional[datetime] = None,
        sort_by_last_activity: Optional[SortOrder] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> list[Device]:
        conditions = []

        if ip_address:
            conditions.append(DeviceModel.ip_address == ip_address.value) 
        if model:
            conditions.append(DeviceModel.model == model)
        if last_activity_from:
            conditions.append(DeviceModel.last_activity >= last_activity_from)
        if last_activity_to:
            conditions.append(DeviceModel.last_activity <= last_activity_to)

        query = select(DeviceModel).where(*conditions)
        
        if sort_by_last_activity == SortOrder.ASC:
            query = query.order_by(DeviceModel.last_activity.asc())
        elif sort_by_last_activity == SortOrder.DESC:
            query = query.order_by(DeviceModel.last_activity.desc())
        
        query = query.limit(limit) if limit else query
        query = query.offset(offset) if offset else query

        result = await self.db.execute(query)
        db_devices = result.scalars().all()
        return [self._to_entity(d) for d in db_devices]

    def _to_entity(self, db_device: DeviceModel) -> Device:
        return Device(
            id=db_device.id,  # type: ignore
            mac_address=MacAddress(db_device.mac_address),  # type: ignore
            model=db_device.model,  # type: ignore
            last_activity=db_device.last_activity,  # type: ignore
            ip_address=IpAddress(db_device.ip_address) if db_device.ip_address else None,  # type: ignore
            config_id=db_device.config_id  # type: ignore
        )
