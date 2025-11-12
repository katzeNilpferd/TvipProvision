from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from application.use_cases.default_config_management.replace_default_config import ReplaceDefaultConfigUseCase
from application.use_cases.default_config_management.get_default_config import GetDefaultConfigUseCase
from infrastructure.di.injection import (
    update_default_config_use_case,
    replace_default_config_use_case,
    get_default_config_use_case
)


router = APIRouter(tags=['Default-config'])


@router.get('/api/default/config')
async def get_default_config(
    use_case: GetDefaultConfigUseCase = Depends(get_default_config_use_case)
):
    return await use_case.execute()


@router.put('/api/default/config/update')
async def update_default_config(
    updates: dict[str, Any],
    use_case: UpdateDefaultConfigUseCase = Depends(update_default_config_use_case)
):
    return await use_case.execute(updates)


@router.put('/api/default/config/replace')
async def replace_default_config(
    new_config: dict[str, Any],
    use_case: ReplaceDefaultConfigUseCase = Depends(replace_default_config_use_case)
):
    return await use_case.execute(new_config)
