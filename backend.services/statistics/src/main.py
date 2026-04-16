from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from infrastructure.database.database import (
    engine,
    init_timescale_db
)
from infrastructure.di.injection import get_broadcast_service_builder
from presentation.api.endpoint import statistics
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan."""
    
    await init_timescale_db()
    
    # Start background broadcast service
    broadcast_service = await get_broadcast_service_builder(app)()
    broadcast_task = asyncio.create_task(broadcast_service.start())
    
    yield
    
    # Stop broadcast service on shutdown
    broadcast_service.stop()
    broadcast_task.cancel()
    await engine.dispose()


app = FastAPI(title="TVIP Statistics Service", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r".*"
)

app.include_router(statistics.router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=settings.SERVICE_HOST, port=settings.SERVICE_PORT)
