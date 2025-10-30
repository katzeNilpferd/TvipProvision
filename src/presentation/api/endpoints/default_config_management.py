from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from infrastructure.di.injection import update_default_config_use_case


router = APIRouter()


@router.put('/api/default/config')
async def update_default_config(
    updates: dict[str, Any],
    use_case: UpdateDefaultConfigUseCase = Depends(update_default_config_use_case)
):
    return await use_case.execute(updates)
