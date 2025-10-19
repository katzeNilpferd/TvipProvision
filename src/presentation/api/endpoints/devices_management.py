from fastapi import APIRouter, Depends

from application.use_cases.get_device_config import GetDeviceConfigUseCase
from infrastructure.di.injection import get_device_config_use_case


router = APIRouter()


@router.get('/api/devices/{mac_address}/config')
async def tvip_provision_endpoint(
    mac_address: str,
    use_case: GetDeviceConfigUseCase = Depends(get_device_config_use_case)
):  
    return await use_case.execute(mac_address)
