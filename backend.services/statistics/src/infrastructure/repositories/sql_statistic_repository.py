from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from domain.value_objects.sort_time import SortTime
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
    
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def save_media(self, statistics: List[MediaStatistic]) -> None:
        if not statistics:
            return
        
        models = [media_mapper.to_model(stat) for stat in statistics]
        self.db_session.add_all(models)
        await self.db_session.flush()
    
    async def save_network(self, statistics: List[NetworkStatistic]) -> None:
        if not statistics:
            return
        
        models = [network_mapper.to_model(stat) for stat in statistics]
        self.db_session.add_all(models)
        await self.db_session.flush()

    async def get_media_by_device(
        self,
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        sort_by_timestamp: Optional[SortTime] = SortTime.DESC,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[MediaStatistic]:
        conditions: List[Any]= []

        if device:
            conditions.append(MediaStatisticModel.device_id == device.id) 
        if start_time:
            conditions.append(MediaStatisticModel.timestamp >= start_time)
        if end_time:
            conditions.append(MediaStatisticModel.timestamp <= end_time)
        
        query = select(MediaStatisticModel).where(*conditions)
        
        if sort_by_timestamp == SortTime.ASC:
            query = query.order_by(MediaStatisticModel.timestamp.asc())
        elif sort_by_timestamp == SortTime.DESC:
            query = query.order_by(MediaStatisticModel.timestamp.desc())

        query = query.limit(limit) if limit else query
        query = query.offset(offset) if offset else query
        
        result = await self.db_session.execute(query)
        models = result.scalars().all()
        
        return [media_mapper.to_entity(model) for model in models]
    
    async def get_network_by_device(
        self,
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        sort_by_timestamp: Optional[SortTime] = SortTime.DESC,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[NetworkStatistic]:
        conditions: List[Any]= []

        if device:
            conditions.append(NetworkStatisticModel.device_id == device.id) 
        if start_time:
            conditions.append(NetworkStatisticModel.timestamp >= start_time)
        if end_time:
            conditions.append(NetworkStatisticModel.timestamp <= end_time)
        
        query = select(NetworkStatisticModel).where(*conditions)
        
        if sort_by_timestamp == SortTime.ASC:
            query = query.order_by(NetworkStatisticModel.timestamp.asc())
        elif sort_by_timestamp == SortTime.DESC:
            query = query.order_by(NetworkStatisticModel.timestamp.desc())

        query = query.limit(limit) if limit else query
        query = query.offset(offset) if offset else query
        
        result = await self.db_session.execute(query)
        models = result.scalars().all()
        
        return [network_mapper.to_entity(model) for model in models]

    async def clear_media_for_device(self, device: Device) -> None:
        await self.db_session.execute(
            delete(MediaStatisticModel).where(
                MediaStatisticModel.device_id == device.id
            )
        )
        await self.db_session.flush()
    
    async def clear_network_for_device(self, device: Device) -> None:
        await self.db_session.execute(
            delete(NetworkStatisticModel).where(
                NetworkStatisticModel.device_id == device.id
            )
        )
        await self.db_session.flush()

    async def get_latest_media_by_devices(
        self,
        device_ids: List[str],
        start_time: datetime
    ) -> List[MediaStatistic]:
        """Get latest media statistics for specific devices."""
        if not device_ids:
            return []
        
        uuids = [UUID(did) for did in device_ids]
        
        query = select(MediaStatisticModel).where(
            and_(
                MediaStatisticModel.device_id.in_(uuids),
                MediaStatisticModel.timestamp >= start_time
            )
        ).order_by(
            MediaStatisticModel.timestamp.asc()
        )
        
        result = await self.db_session.execute(query)
        all_models = result.scalars().all()
        
        return [media_mapper.to_entity(model) for model in all_models]
    
    async def get_latest_network_by_devices(
        self,
        device_ids: List[str],
        start_time: datetime
    ) -> List[NetworkStatistic]:
        """Get latest network statistics for specific devices."""
        if not device_ids:
            return []
        
        uuids = [UUID(did) for did in device_ids]
        
        query = select(NetworkStatisticModel).where(
            and_(
                NetworkStatisticModel.device_id.in_(uuids),
                NetworkStatisticModel.timestamp >= start_time
            )
        ).order_by(
            NetworkStatisticModel.timestamp.asc()
        )
        
        result = await self.db_session.execute(query)
        all_models = result.scalars().all()
        
        return [network_mapper.to_entity(model) for model in all_models]
