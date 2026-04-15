from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from domain.repositories.device_repository import DeviceRepository
from domain.repositories.statistic_repository import StatisticRepository
from application.use_cases.receive_statistics import ReceiveStatisticsUseCase
from application.use_cases.get_network_statistics import GetNetworkStatisticsUseCase
from application.services.broadcast_service import StatisticsBroadcastService
from infrastructure.database.database import get_session
from infrastructure.repositories.sql_device_repository import PGDeviceRepository
from infrastructure.repositories.sql_statistic_repository import PGStatisticRepository


def get_device_repository(db: AsyncSession = Depends(get_session)) -> DeviceRepository:
    return PGDeviceRepository(db_session=db)


def get_statistic_repository(db: AsyncSession = Depends(get_session)) -> StatisticRepository:
    return PGStatisticRepository(db_session=db)


def get_broadcast_service(
    device_repo: DeviceRepository = Depends(get_device_repository),
    statistic_repo: StatisticRepository = Depends(get_statistic_repository)
) -> StatisticsBroadcastService:
    return StatisticsBroadcastService(
        device_repository=device_repo,
        statistic_repository=statistic_repo,
        broadcast_interval=5
    )


def get_receive_statistics_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    statistic_repo: StatisticRepository = Depends(get_statistic_repository)
) -> ReceiveStatisticsUseCase:
    return ReceiveStatisticsUseCase(
        device_repository=device_repo,
        statistic_repository=statistic_repo
    )


def get_network_statistics_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    statistic_repo: StatisticRepository = Depends(get_statistic_repository)
) -> GetNetworkStatisticsUseCase:
    return GetNetworkStatisticsUseCase(
        device_repository=device_repo,
        statistic_repository=statistic_repo
    )
