from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.database.database import init_migrations
from presentation.api.endpoints import (
    provision,
    devices_management,
    default_config_management
)
from config import settings

AUTH_ENABLED = settings.auth_enabled


app = FastAPI(title="TVIP Provisioning Service")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(provision.router)
app.include_router(devices_management.router)
app.include_router(default_config_management.router)

if AUTH_ENABLED:
    from presentation.api.endpoints import (
        auth,
        users_management,
        ticket_management
    )
    app.include_router(auth.router)
    app.include_router(users_management.router)
    app.include_router(ticket_management.router)


@app.on_event("startup")
async def on_startup() -> None:
    await init_migrations()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
