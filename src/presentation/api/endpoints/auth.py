from fastapi import APIRouter, HTTPException, Depends

from application.use_cases.auth.login_user import LoginUserUseCase
from application.use_cases.auth.register_user import RegisterUserUseCase
from application.use_cases.auth.verify_token import VerifyTokenUseCase
from infrastructure.di.injection import (
    get_login_user_use_case,
    get_register_user_use_case,
    get_verify_token_use_case
)
from presentation.api.models.auth import (
    LoginRequest,
    RegisterRequest,
    VerifyTokenRequest
)


router = APIRouter(tags=['Authentication'])


@router.post('/api/auth/login')
async def login(
    request: LoginRequest,
    use_case: LoginUserUseCase = Depends(get_login_user_use_case)
):
    return await use_case.execute(request.username, request.password)
    

@router.post('/api/auth/register')
async def register(
    request: RegisterRequest,
    use_case: RegisterUserUseCase = Depends(get_register_user_use_case)
):
    return await use_case.execute(request.username, request.password)


@router.post('/api/auth/validate')
async def verify_token(
    request: VerifyTokenRequest,
    use_case: VerifyTokenUseCase = Depends(get_verify_token_use_case)
):
    try:
        return await use_case.execute(request.token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
