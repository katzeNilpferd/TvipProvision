from fastapi import APIRouter, Response, Depends, Header
from typing import Annotated

from application.use_cases.tvip_provision.handle_provision_request import HandleProvisionRequestUseCase
from infrastructure.di.injection import get_handle_provision_use_case


router = APIRouter(prefix='/prov', tags=['Provision.xml'])


@router.get('/tvip_provision.xml', summary='Get XML config')
async def tvip_provision_endpoint(
    mac_address: Annotated[str, Header(alias='Mac-Address')],
    use_case: HandleProvisionRequestUseCase = Depends(get_handle_provision_use_case)
):      
    """
    Generate XML configuration for TVIP device.
    
    Args:
        mac_address: Device MAC address from request headers.
        use_case: Business logic handler (injected automatically).

    Returns:
        Response: Device-specific settings.
    """
    xml_content = await use_case.execute(mac_address)
    return Response(content=xml_content, media_type="application/xml")
