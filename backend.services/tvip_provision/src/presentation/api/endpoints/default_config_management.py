from fastapi import APIRouter, Depends
from typing import Any

from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from application.use_cases.default_config_management.replace_default_config import ReplaceDefaultConfigUseCase
from application.use_cases.default_config_management.get_default_config import GetDefaultConfigUseCase
from presentation.api.dependencies.auth import get_current_active_user, get_current_admin_user
from presentation.api.decorators.auth import optional_auth_endpoint
from infrastructure.di.injection import (
    update_default_config_use_case,
    replace_default_config_use_case,
    get_default_config_use_case
)


router = APIRouter(tags=['Default-config'])


@router.get('/api/default/config')
@optional_auth_endpoint
async def get_default_config(
    current_user: dict[str, Any] = Depends(get_current_active_user),
    use_case: GetDefaultConfigUseCase = Depends(get_default_config_use_case)
):
    return await use_case.execute()


@router.put('/api/default/config/update')
@optional_auth_endpoint
async def update_default_config(
    updates: dict[str, Any],
    current_user: dict[str, Any] = Depends(get_current_admin_user),
    use_case: UpdateDefaultConfigUseCase = Depends(update_default_config_use_case)
):
    return await use_case.execute(updates)


@router.put('/api/default/config/replace')
@optional_auth_endpoint
async def replace_default_config(
    new_config: dict[str, Any],
    current_user: dict[str, Any] = Depends(get_current_admin_user),
    use_case: ReplaceDefaultConfigUseCase = Depends(replace_default_config_use_case)
):
    return await use_case.execute(new_config)
