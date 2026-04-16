from fastapi import (
    APIRouter, Request, Header, Depends, WebSocket, Query
)
from datetime import datetime
from typing import Annotated, Optional

from domain.value_objects.sort_time import SortTime
from application.dto import StatisticReportDTO
from application.use_cases.receive_statistics import ReceiveStatisticsUseCase
from application.use_cases.get_network_statistics import GetNetworkStatisticsUseCase
from application.use_cases.get_media_statistics import GetMediaStatisticsUseCase
from application.services.websocket_service import WebSocketService
from infrastructure.di.injection import (
    get_receive_statistics_use_case,
    get_network_statistics_use_case,
    get_media_statistics_use_case
)


router = APIRouter(prefix='/api', tags=['Statistics'])


@router.post('/statistics', status_code=202)
async def receive_statistics(
    request: Request,
    reports: list[StatisticReportDTO],
    mac_address: Annotated[str, Header(alias='Mac-Address')],
    x_real_ip: Annotated[Optional[str], Header(alias='X-Real-IP')] = None,
    tvip_model: Annotated[Optional[str], Header(alias='tvip-model', max_length=100)] = None,
    use_case: ReceiveStatisticsUseCase = Depends(get_receive_statistics_use_case)
):
    # Приоритет: X-Real-IP (от nginx) -> request.client.host (прямое подключение)
    ip_address = x_real_ip or (request.client.host if request.client else None)
 
    return await use_case.execute(
        mac_address=mac_address,
        reports=reports,
        ip_address=ip_address,
        model=tvip_model
    )


@router.get('/statistics/network')
async def get_network_statistics(
    mac_address: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
    sort_by_timestamp: Optional[SortTime] = SortTime.DESC,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    use_case: GetNetworkStatisticsUseCase = Depends(get_network_statistics_use_case)
):
    return await use_case.execute(
        mac_address=mac_address,
        start_time=start_time,
        end_time=end_time,
        sort_by_timestamp=sort_by_timestamp,
        limit=limit,
        offset=offset
    )


@router.get('/statistics/media')
async def get_media_statistics(
    mac_address: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
    sort_by_timestamp: Optional[SortTime] = SortTime.DESC,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    use_case: GetMediaStatisticsUseCase = Depends(get_media_statistics_use_case)
):
    return await use_case.execute(
        mac_address=mac_address,
        start_time=start_time,
        end_time=end_time,
        sort_by_timestamp=sort_by_timestamp,
        limit=limit,
        offset=offset
    )


@router.websocket('/ws/statistics')
async def websocket_statistics(
    websocket: WebSocket,
    device_id: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time statistics updates.
    
    Query parameters:
        - device_id: Optional device ID to subscribe to immediately
    
    Client commands:
        - {"action": "subscribe", "device_id": "..."}
        - {"action": "unsubscribe", "device_id": "..."}
        - {"action": "ping"}
    """
    await WebSocketService.handle_connection(websocket, device_id)
