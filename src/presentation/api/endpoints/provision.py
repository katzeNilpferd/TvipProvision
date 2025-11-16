from fastapi import APIRouter, Response, Request, Depends, Header
from typing import Annotated, Optional

from application.use_cases.tvip_provision.handle_provision_request import HandleProvisionRequestUseCase
from infrastructure.di.injection import get_handle_provision_use_case


router = APIRouter(prefix='/prov', tags=['Provision.xml'])


@router.get('/tvip_provision.xml', summary='Get XML config')
async def tvip_provision_endpoint(
    request: Request,
    mac_address: Annotated[str, Header(alias='Mac-Address')],
    x_real_ip: Annotated[Optional[str], Header(alias='X-Real-IP')] = None,
    tvip_model: Annotated[Optional[str], Header(alias='tvip-model', max_length=100)] = None,
    use_case: HandleProvisionRequestUseCase = Depends(get_handle_provision_use_case)
):      
    """
    Generate XML configuration for TVIP device.
    
    Args:
        mac_address: Device MAC address from request headers.
        x_real_ip: Real client IP address from nginx proxy.
        tvip_model: TVIP device model from request headers.
        use_case: Business logic handler (injected automatically).

    Returns:
        Response: Device-specific settings.
    """
    # Приоритет: X-Real-IP (от nginx) -> request.client.host (прямое подключение)
    ip_address = x_real_ip or (request.client.host if request.client else None)

    xml_content = await use_case.execute(mac_address, ip_address, tvip_model)
    return Response(content=xml_content, media_type="application/xml")
