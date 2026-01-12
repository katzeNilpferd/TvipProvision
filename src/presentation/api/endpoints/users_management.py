from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from application.use_cases.users_management.change_password import ChangePasswordUseCase
from presentation.api.dependencies.auth import get_current_active_user
from presentation.api.models.users import ChangePasswordRequest
from infrastructure.di.injection import (
    get_change_password_use_case
)


router = APIRouter(tags=['Users-management'])


@router.post('/api/users/{user_id}/change-password')
async def change_user_password(
    user_id: str,
    request: ChangePasswordRequest,
    current_user: dict[str, Any] = Depends(get_current_active_user),
    use_case: ChangePasswordUseCase = Depends(get_change_password_use_case)
):
    if current_user.get('id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only change your own password"
        )
    try:
        return await use_case.execute(
            user_id=user_id,
            current_password=request.current_password,
            new_password=request.new_password
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
