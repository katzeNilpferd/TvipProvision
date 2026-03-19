from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import json
from uuid import UUID
from typing import Optional

from domain.value_objects.provision_config_type import ConfigType, ProvisionConfigType
from domain.entities.device import Device
from domain.entities.provision_config import ProvisionConfig
from domain.repositories.provision_repository import ProvisionRepository
from domain.services.default_config_service import DefaultConfigService
from infrastructure.database.models import ProvisionConfigModel, DeviceModel
from infrastructure.factories.config_data_factory import ConfigDataFactory


class SQLProvisionRepository(ProvisionRepository):

    def __init__(self, db_session: AsyncSession) -> None:
        self.db = db_session

    async def _ensure_default_exists(self) -> None:
        result = await self.db.execute(
            select(ProvisionConfigModel).where(
                ProvisionConfigModel.config_type == ConfigType.DEFAULT.value
            )
        )
        default_config = result.scalar_one_or_none()

        if default_config:
            return

        try:
            config_template = DefaultConfigService.get_default_config_template()
            config_data = ConfigDataFactory.create(config_template)

            if not DefaultConfigService.validate_default_config(config_data):
                raise ValueError("Invalid default configuration")

            default_config = ProvisionConfigModel(
                config_json=json.dumps(config_data.data),
                config_type=ConfigType.DEFAULT.value,
                description="Default configuration for all devices",
            )
            self.db.add(default_config)
            await self.db.commit()
        except (ValueError, IntegrityError):
            await self.db.rollback()
    
    async def get_by_id(self, config_id: UUID) -> Optional[ProvisionConfig]:
        result = await self.db.execute(
            select(ProvisionConfigModel).where(ProvisionConfigModel.id == config_id)
        )
        db_config = result.scalar_one_or_none()
        return self._to_entity(db_config) if db_config else None

    async def get_by_device(self, device: Device) -> Optional[ProvisionConfig]:
        result = await self.db.execute(
            select(DeviceModel).where(DeviceModel.id == device.id)
        )
        db_device = result.scalar_one_or_none()
        if not db_device:
            return None
        
        result = await self.db.execute(
            select(ProvisionConfigModel).where(ProvisionConfigModel.id == db_device.config_id)
        )
        db_config = result.scalar_one_or_none()
        return self._to_entity(db_config) if db_config else None

    async def get_default(self) -> ProvisionConfig:
        await self._ensure_default_exists()
        result = await self.db.execute(
            select(ProvisionConfigModel).where(
                ProvisionConfigModel.config_type == ConfigType.DEFAULT.value
            )
        )
        db_config = result.scalar_one_or_none()
        if not db_config:
            raise ValueError("Default configuration not found")
        return self._to_entity(db_config)

    async def save(self, config: ProvisionConfig) -> ProvisionConfig:
        result = await self.db.execute(
            select(ProvisionConfigModel).where(ProvisionConfigModel.id == config.id)
        )
        db_config = result.scalar_one_or_none()

        if db_config:
            #Update
            db_config.config_json = json.dumps(config.config_data.data)
            db_config.description = config.description
        else:
            #Create
            db_config = ProvisionConfigModel(
                id=config.id,
                config_json=json.dumps(config.config_data.data),
                config_type=config.config_type.value.value,
                description=config.description
            )
            self.db.add(db_config)

        await self.db.commit()
        return self._to_entity(db_config)
    
    async def delete(self, config_id: UUID) -> bool:
        result = await self.db.execute(
            select(ProvisionConfigModel).where(ProvisionConfigModel.id == config_id)
        )
        db_config = result.scalar_one_or_none()
        if not db_config:
            return False
        
        if db_config.config_type == ConfigType.DEFAULT.value:
            raise ValueError("Cannot delete the default configuration")
        
        await self.db.delete(db_config)
        await self.db.commit()
        return True


    def _to_entity(self, db_config: ProvisionConfigModel) -> ProvisionConfig:
        config_json = json.loads(db_config.config_json)
        config_data = ConfigDataFactory.create(config_json)

        return ProvisionConfig(
            id=db_config.id,
            config_data=config_data,
            config_type=ProvisionConfigType(ConfigType(db_config.config_type)),
            description=db_config.description
        )
