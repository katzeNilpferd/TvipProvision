from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from infrastructure.database.database import (
    engine,
    init_timescale_db
)
from presentation.api.endpoint import statistics
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan."""
    
    await init_timescale_db()
    yield
    
    await engine.dispose()


app = FastAPI(title="TVIP Statistics Service", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(statistics.router)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=settings.SERVICE_HOST, port=settings.SERVICE_PORT)
