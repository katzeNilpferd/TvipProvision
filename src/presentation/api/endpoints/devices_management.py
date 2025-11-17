from fastapi import APIRouter, Depends
from typing import Any, Optional

from application.use_cases.devices_management.get_device_config import GetDeviceConfigUseCase
from application.use_cases.devices_management.update_device_config import UpdateDeviceConfigUseCase
from application.use_cases.devices_management.replace_device_config import ReplaceDeviceConfigUseCase
from application.use_cases.devices_management.reset_device_config import ResetDeviceConfigUseCase
from application.use_cases.devices_management.get_devices_list import GetDevicesListUseCase
from infrastructure.di.injection import (
    get_device_config_use_case,
    update_device_config_use_case,
    replace_device_config_use_case,
    reset_device_config_use_case,
    get_devices_list_use_case
)


router = APIRouter(tags=['Devices-config'])


@router.get('/api/devices')
async def get_devices_list(
    ip: Optional[str] = None,
    model: Optional[str] = None,
    last_activity_after: Optional[str] = None,
    last_activity_before: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    use_case: GetDevicesListUseCase = Depends(get_devices_list_use_case)
):
    return await use_case.execute(ip, model, last_activity_after, last_activity_before, limit, offset)


@router.get('/api/devices/{mac_address}/config')
async def get_device_config(
    mac_address: str,
    use_case: GetDeviceConfigUseCase = Depends(get_device_config_use_case)
):  
    return await use_case.execute(mac_address)


@router.put('/api/devices/{mac_address}/config/update')
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


@router.post("/api/devices/{mac_address}/config/reset")
async def reset_device_config(
    mac_address: str,
    use_case: ResetDeviceConfigUseCase = Depends(reset_device_config_use_case)
):
    return await use_case.execute(mac_address)
