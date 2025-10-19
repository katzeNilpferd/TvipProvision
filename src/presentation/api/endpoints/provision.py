from fastapi import APIRouter, Request, Response, HTTPException, Depends

from application.use_cases.handle_provision_request import HandleProvisionRequestUseCase
from infrastructure.di.injection import get_handle_provision_use_case


router = APIRouter()


@router.get('/prov/tvip_provision.xml')
async def tvip_provision_endpoint(
    request: Request,
    use_case: HandleProvisionRequestUseCase = Depends(get_handle_provision_use_case)
):  
    mac_address = request.headers.get('Mac-Address')
    
    if not mac_address:
        raise HTTPException(
            status_code=400,
            detail='Mac-Address header is required'
        )
    
    xml_content = await use_case.execute(mac_address)
    return Response(content=xml_content, media_type="application/xml")
