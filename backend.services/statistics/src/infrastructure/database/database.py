import os
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.sql import text

from infrastructure.database.models import Base
from config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_session():
    """Dependency for getting database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


#TODO:  A temporary solution instead of migrations. Need to implement proper migration strategy.
async def init_timescale_db():
    """Initialize TimescaleDB extension and configure hypertables."""
    async with engine.begin() as conn:
        # Create TimescaleDB extension
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Convert media_statistics to hypertable
        await conn.execute(text("""
            SELECT create_hypertable('media_statistics', 'timestamp', 
                chunk_time_interval => INTERVAL '7 days',
                if_not_exists => TRUE
            );
        """))
        
        # Convert network_statistics to hypertable
        await conn.execute(text("""
            SELECT create_hypertable('network_statistics', 'timestamp',
                chunk_time_interval => INTERVAL '7 days',
                if_not_exists => TRUE
            );
        """))
        
        # Enable compression for media_statistics
        await conn.execute(text(f"""
            ALTER TABLE media_statistics SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'device_id',
                timescaledb.compress_orderby = 'timestamp DESC'
            );
            
            SELECT add_compression_policy('media_statistics', 
                INTERVAL '{settings.COMPRESSION_DAYS} days',
                if_not_exists => TRUE
            );
        """))
        
        # Enable compression for network_statistics
        await conn.execute(text(f"""
            ALTER TABLE network_statistics SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'device_id',
                timescaledb.compress_orderby = 'timestamp DESC'
            );
            
            SELECT add_compression_policy('network_statistics',
                INTERVAL '{settings.COMPRESSION_DAYS} days',
                if_not_exists => TRUE
            );
        """))
        
        # Add retention policy
        await conn.execute(text(f"""
            SELECT add_retention_policy('media_statistics',
                INTERVAL '{settings.RETENTION_DAYS} days',
                if_not_exists => TRUE
            );
            
            SELECT add_retention_policy('network_statistics',
                INTERVAL '{settings.RETENTION_DAYS} days',
                if_not_exists => TRUE
            );
        """))
