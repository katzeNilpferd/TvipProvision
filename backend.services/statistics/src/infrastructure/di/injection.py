from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from domain.repositories.device_repository import DeviceRepository
from domain.repositories.statistic_repository import StatisticRepository
from infrastructure.database.database import get_session
from infrastructure.repositories.sql_device_repository import PGDeviceRepository
from infrastructure.repositories.sql_statistic_repository import PGStatisticRepository


def get_device_repository(db: AsyncSession = Depends(get_session)) -> DeviceRepository:
    return PGDeviceRepository(db_session=db)


def get_statistic_repository(db: AsyncSession = Depends(get_session)) -> StatisticRepository:
    return PGStatisticRepository(db_session=db)
