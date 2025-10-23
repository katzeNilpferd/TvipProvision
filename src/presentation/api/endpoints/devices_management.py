from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.get_device_config import GetDeviceConfigUseCase
from application.use_cases.update_device_config import UpdateDeviceConfigUseCase
from infrastructure.di.injection import (
    get_device_config_use_case,
    update_device_config_use_case
)


router = APIRouter()


@router.get('/api/devices/{mac_address}/config')
async def get_device_config(
    mac_address: str,
    use_case: GetDeviceConfigUseCase = Depends(get_device_config_use_case)
):  
    return await use_case.execute(mac_address)


@router.put('/api/devices/{mac_address}/config')
async def update_device_config(
    mac_address: str,
    updates: dict[str, Any],
    use_case: UpdateDeviceConfigUseCase = Depends(update_device_config_use_case)
):
    return await use_case.execute(mac_address, updates)
