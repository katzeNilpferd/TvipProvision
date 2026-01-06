from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from application.use_cases.auth.verify_token import VerifyTokenUseCase
from infrastructure.di.injection import get_verify_token_use_case


security = HTTPBearer()


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    verify_token_use_case: VerifyTokenUseCase = Depends(get_verify_token_use_case)
) -> dict[str, Any]:    
    try:
        result = await verify_token_use_case.execute(token.credentials)
        return result['user']
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: dict[str, Any] = Depends(get_current_user)
):
    print(current_user.get('username'))
    if not current_user.get('is_active'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def get_current_admin_user(
    current_user: dict[str, Any] = Depends(get_current_user)
):
    print(current_user.get('username'))
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
