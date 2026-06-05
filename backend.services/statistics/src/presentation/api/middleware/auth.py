from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from infrastructure.auth.auth_client import auth_client
from config import settings


class AuthMiddleware(BaseHTTPMiddleware):
    
    EXCLUDED_PATHS: set[str] = {
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/ws/statistics"
    }

    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.AUTH_ENABLED:
            return await call_next(request)
        
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(content="Unauthorized", status_code=401)

        token = auth_header[len("Bearer "):]
        try:
            await auth_client.verify_token(token)
        except HTTPException as e:
            return Response(content=str(e.detail), status_code=e.status_code)

        return await call_next(request)
