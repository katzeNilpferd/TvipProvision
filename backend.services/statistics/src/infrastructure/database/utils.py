import asyncio
import asyncpg

from config import settings

DB_NAME = settings.DB_NAME
DATABASE_URL = settings.DATABASE_URL

async def ensure_db():
    conn = await asyncpg.connect(
        DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://'),
    )

    exists = await conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        DB_NAME
    )
    if not exists:
        await conn.execute(f'CREATE DATABASE "{DB_NAME}"')

    await conn.close()
