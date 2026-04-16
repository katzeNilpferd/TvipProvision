from fastapi import FastAPI, Depends
from fastapi_depends_anywhere import with_fastapi_depends
from sqlalchemy.ext.asyncio import AsyncSession

from domain.repositories.device_repository import DeviceRepository
from domain.repositories.statistic_repository import StatisticRepository
from application.use_cases.receive_statistics import ReceiveStatisticsUseCase
from application.use_cases.get_network_statistics import GetNetworkStatisticsUseCase
from application.use_cases.get_media_statistics import GetMediaStatisticsUseCase
from application.services.broadcast_service import StatisticsBroadcastService
from infrastructure.database.database import get_session
from infrastructure.repositories.sql_device_repository import PGDeviceRepository
from infrastructure.repositories.sql_statistic_repository import PGStatisticRepository


def get_device_repository(db: AsyncSession = Depends(get_session)) -> DeviceRepository:
    return PGDeviceRepository(db_session=db)


def get_statistic_repository(db: AsyncSession = Depends(get_session)) -> StatisticRepository:
    return PGStatisticRepository(db_session=db)


def get_broadcast_service_builder(app: FastAPI):
    @with_fastapi_depends(app=app)
    def _builder(
        device_repo: DeviceRepository = Depends(get_device_repository),
        statistic_repo: StatisticRepository = Depends(get_statistic_repository),
    ) -> StatisticsBroadcastService:
        return StatisticsBroadcastService(
            device_repository=device_repo,
            statistic_repository=statistic_repo,
            broadcast_interval=5
        )
    return _builder


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


def get_media_statistics_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    statistic_repo: StatisticRepository = Depends(get_statistic_repository)
) -> GetMediaStatisticsUseCase:
    return GetMediaStatisticsUseCase(
        device_repository=device_repo,
        statistic_repository=statistic_repo
    )
