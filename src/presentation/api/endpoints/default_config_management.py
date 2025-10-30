from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from application.use_cases.default_config_management.get_default_config import GetDefaultConfigUseCase
from infrastructure.di.injection import update_default_config_use_case, get_default_config_use_case


router = APIRouter()


@router.get('/api/default/config')
async def get_default_config(
    use_case: GetDefaultConfigUseCase = Depends(get_default_config_use_case)
):
    return await use_case.execute()


@router.put('/api/default/config')
async def update_default_config(
    updates: dict[str, Any],
    use_case: UpdateDefaultConfigUseCase = Depends(update_default_config_use_case)
):
    return await use_case.execute(updates)
