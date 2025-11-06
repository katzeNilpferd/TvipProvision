import os
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from infrastructure.database.models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # Example: postgresql+asyncpg://user:password@localhost:5432/tvip_provision
    "postgresql+asyncpg://postgres:postgres@localhost:5432/tvip_provision",
)

engine = create_async_engine(
    DATABASE_URL,
    future=True,
    pool_size=25,
    max_overflow=50,
    pool_pre_ping=True,
    echo=False
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_models() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
