from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from domain.entities.device import Device
from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic
from domain.repositories.statistic_repository import StatisticRepository
from infrastructure.database.mappers import MediaStatisticMapper as media_mapper
from infrastructure.database.mappers import NetworkStatisticMapper as network_mapper
from infrastructure.database.models import MediaStatisticModel
from infrastructure.database.models import NetworkStatisticModel


class PGStatisticRepository(StatisticRepository):
    '''PostgreSQL implementation of the StatisticRepository interface.'''
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_media(self, statistics: List[MediaStatistic]) -> None:
        if not statistics:
            return
        
        models = [media_mapper.to_model(stat) for stat in statistics]
        self.session.add_all(models)
        await self.session.flush()
    
    async def save_network(self, statistics: List[NetworkStatistic]) -> None:
        if not statistics:
            return
        
        models = [network_mapper.to_model(stat) for stat in statistics]
        self.session.add_all(models)
        await self.session.flush()

    async def get_media_by_device(
        self,
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[MediaStatistic]:
        query = select(MediaStatisticModel).where(
            MediaStatisticModel.device_id == device.id
        )
        if start_time:
            query = query.where(MediaStatisticModel.timestamp >= start_time)
        if end_time:
            query = query.where(MediaStatisticModel.timestamp <= end_time)
        
        query = query.order_by(MediaStatisticModel.timestamp.desc())
        
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [media_mapper.to_entity(model) for model in models]
    
    async def get_network_by_device(
        self,
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[NetworkStatistic]:
        query = select(NetworkStatisticModel).where(
            NetworkStatisticModel.device_id == device.id
        )
        if start_time:
            query = query.where(NetworkStatisticModel.timestamp >= start_time)
        if end_time:
            query = query.where(NetworkStatisticModel.timestamp <= end_time)
        
        query = query.order_by(NetworkStatisticModel.timestamp.desc())
        
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [network_mapper.to_entity(model) for model in models]

    async def clear_media_for_device(self, device: Device) -> None:
        await self.session.execute(
            delete(MediaStatisticModel).where(
                MediaStatisticModel.device_id == device.id
            )
        )
        await self.session.flush()
    
    async def clear_network_for_device(self, device: Device) -> None:
        await self.session.execute(
            delete(NetworkStatisticModel).where(
                NetworkStatisticModel.device_id == device.id
            )
        )
        await self.session.flush()
