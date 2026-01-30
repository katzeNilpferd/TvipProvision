from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from domain.auth.entities.ticket import TicketType
from application.use_cases.users_management.change_password import ChangePasswordUseCase
from application.use_cases.users_management.password_recovery import PasswordRecoveryUseCase
from application.use_cases.tickets.create_ticket import CreateTicketUseCase
from presentation.api.dependencies.auth import get_current_active_user
from presentation.api.models.users import (
    ChangePasswordRequest,
    CreateTicketRequest,
    PasswordRecoveryRequest
)
from infrastructure.di.injection import (
    get_change_password_use_case,
    get_create_ticket_use_case,
    get_password_recovery_use_case
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


@router.post('/api/users/{user_id}/upgrade-privilege')
async def upgrade_privilege(
    user_id: str,
    current_user: dict[str, Any] = Depends(get_current_active_user),
    use_case: CreateTicketUseCase = Depends(get_create_ticket_use_case)
):
    username = current_user.get('username')
    if not username or current_user.get('id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only request privilege upgrade for your own account"
        )
    ticket_type = TicketType.PRIVILEGE_UPGRADE
    description = f'User {username} requests privilege upgrade.'

    try:
        return await use_case.execute(
            username=username,
            ticket_type=ticket_type,
            description=description
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post('/api/users/forgot-password')
async def forgot_user_password(
    request: CreateTicketRequest,
    use_case: CreateTicketUseCase = Depends(get_create_ticket_use_case)
):
    ticket_type = TicketType.FORGOT_PASSWORD
    description = f'User {request.username} requested password reset' if not request.description else request.description

    try:
        return await use_case.execute(
            username=request.username,
            ticket_type=ticket_type,
            description=description
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post('/api/users/password-recovery')
async def password_recovery(
    request: PasswordRecoveryRequest,
    use_case: PasswordRecoveryUseCase = Depends(get_password_recovery_use_case)
):
    try:
        return await use_case.execute(
            username=request.username,
            secret_key=request.secret_key,
            new_password=request.new_password
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
