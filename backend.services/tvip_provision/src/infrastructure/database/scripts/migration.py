import asyncio
from pathlib import Path
from alembic.config import Config
from alembic import command


def find_alembic_config():
    '''Locate the alembic.ini configuration file.'''

    current = Path.cwd()
    while current != current.parent:
        config_path = current / "alembic.ini"
        if config_path.exists():
            return config_path
        current = current.parent
    raise FileNotFoundError("alembic.ini not found in any parent directory.")


async def run_migrations() -> None:
    '''Run database migrations to the latest version.'''
    
    def _upgrade_sync():
        alembic_cfg = Config(str(find_alembic_config()))
        command.upgrade(alembic_cfg, "head")
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _upgrade_sync)


async def create_migration(message: str) -> None:
    '''Create a new migration script with the given message.'''
    
    def _create_sync():
        alembic_cfg = Config(str(find_alembic_config()))
        command.revision(alembic_cfg, message=message, autogenerate=True)
    
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _create_sync)
