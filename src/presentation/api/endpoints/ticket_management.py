from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from application.use_cases.tickets.get_in_progress_ticket import GetInProgressTicketUseCase
from presentation.api.dependencies.auth import get_current_admin_user
from infrastructure.di.injection import (
    get_in_progress_ticket_use_case
)


router = APIRouter(tags=['Ticket-management'])


@router.get('/api/tickets/in-progress')
async def get_in_progress_ticket(
    current_user: dict[str, Any] = Depends(get_current_admin_user),
    use_case: GetInProgressTicketUseCase = Depends(get_in_progress_ticket_use_case)
) -> list[dict[str, Any]]:
    try:
        return await use_case.execute()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
