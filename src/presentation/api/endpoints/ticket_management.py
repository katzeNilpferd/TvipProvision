from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from application.use_cases.tickets.get_in_progress_ticket import GetInProgressTicketUseCase
from application.use_cases.tickets.approve_ticket import ApproveTicketUseCase
from application.use_cases.tickets.reject_ticket import RejectTicketUseCase
from presentation.api.dependencies.auth import get_current_admin_user
from infrastructure.di.injection import (
    get_in_progress_ticket_use_case,
    get_approve_ticket_use_case,
    get_reject_ticket_use_case
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

@router.post('/api/tickets/{ticket_id}/approve')
async def approve_ticket(
    ticket_id: str,
    current_user: dict[str, Any] = Depends(get_current_admin_user),
    use_case: ApproveTicketUseCase = Depends(get_approve_ticket_use_case)
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            ticket_id=ticket_id,
            resolved_by=current_user.get('username')  # type: ignore
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post('/api/tickets/{ticket_id}/reject')
async def reject_ticket(
    ticket_id: str,
    current_user: dict[str, Any] = Depends(get_current_admin_user),
    use_case: RejectTicketUseCase = Depends(get_reject_ticket_use_case)
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            ticket_id=ticket_id,
            resolved_by=current_user.get('username')  # type: ignore
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
