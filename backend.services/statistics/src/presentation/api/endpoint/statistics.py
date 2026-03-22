from fastapi import APIRouter, Request, Header
from typing import Annotated, Optional

from application.dto import StatisticReportDTO


router = APIRouter(prefix='/api', tags=['Statistics'])


@router.post('/statistics', status_code=202)
async def receive_statistics(
    request: Request,
    reports: list[StatisticReportDTO],
    mac_address: Annotated[str, Header(alias='Mac-Address')],
    x_real_ip: Annotated[Optional[str], Header(alias='X-Real-IP')] = None,
    tvip_model: Annotated[Optional[str], Header(alias='tvip-model', max_length=100)] = None,
    # use_case: ProcessStatisticsUseCase = Depends(get_process_statistics_use_case)
):
    # Приоритет: X-Real-IP (от nginx) -> request.client.host (прямое подключение)
    ip_address = x_real_ip or (request.client.host if request.client else None)

    "TODO: Реализовать обработку статистики через use case"
    from pprint import pprint
    pprint(f"Received statistics from device {mac_address} (model: {tvip_model}) at IP {ip_address}\nReports: {reports}")
    
    return {
        "status": "accepted",
        "message": "Processing statistics"
    }
