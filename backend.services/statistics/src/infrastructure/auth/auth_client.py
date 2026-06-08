import httpx
from typing import Any
from fastapi import HTTPException
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE

from config import settings


TVIP_PROVISION_VALIDATE_URL = f"{settings.SERVICE_PROVISION_HOST}:{settings.SERVICE_PROVISION_PORT}/api/auth/validate"


class AuthClient:
    """A client for interacting with the authentication service."""

    def __init__(self) -> None:
        self.auth_validate_url = TVIP_PROVISION_VALIDATE_URL
        self.timeout = 10
    
    async def verify_token(self, token: str) -> dict[str, Any]:

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    url=self.auth_validate_url,
                    json={"token": token}
                )
                response.raise_for_status()
                return response.json()
            
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=e.response.text
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Authentication service unavailable: {str(e)}"
                )


auth_client = AuthClient()
