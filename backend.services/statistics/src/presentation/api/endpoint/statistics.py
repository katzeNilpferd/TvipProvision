from fastapi import (
    APIRouter, Request, Header, Depends, WebSocket, Query
)
from typing import Annotated, Optional

from application.dto import StatisticReportDTO
from application.use_cases.receive_statistics import ReceiveStatisticsUseCase
from application.services.websocket_service import WebSocketService
from infrastructure.di.injection import get_receive_statistics_use_case


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
