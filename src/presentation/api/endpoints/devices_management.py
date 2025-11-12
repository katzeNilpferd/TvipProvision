from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.devices_management.get_device_config import GetDeviceConfigUseCase
from application.use_cases.devices_management.update_device_config import UpdateDeviceConfigUseCase
from application.use_cases.devices_management.replace_device_config import ReplaceDeviceConfigUseCase
from application.use_cases.devices_management.reset_device_config import ResetDeviceConfigUseCase
from infrastructure.di.injection import (
    get_device_config_use_case,
    update_device_config_use_case,
    replace_device_config_use_case,
    reset_device_config_use_case
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


@router.put('/api/devices/{mac_address}/config/replace')
async def replace_device_config(
    mac_address: str,
    new_config: dict[str, Any],
    use_case: ReplaceDeviceConfigUseCase = Depends(replace_device_config_use_case)
):
    return await use_case.execute(mac_address, new_config)


@router.post("/api/devices/{mac_address}/reset-config")
async def reset_device_config(
    mac_address: str,
    use_case: ResetDeviceConfigUseCase = Depends(reset_device_config_use_case)
):
    return await use_case.execute(mac_address)
