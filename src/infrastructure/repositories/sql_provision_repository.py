from sqlalchemy.orm import Session
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

    def __init__(self, db_session: Session) -> None:
        self.db = db_session
        self._ensure_default_config()

    def _ensure_default_config(self) -> None:
        default_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.config_type == ConfigType.DEFAULT.value
        ).first()
        
        if not default_config:
            try:
                config_template = DefaultConfigService.get_default_config_template()
                config_data = ConfigDataFactory.create(config_template)
                
                if not DefaultConfigService.validate_default_config(config_data):
                    raise ValueError("Invalid default configuration")
                
                default_config = ProvisionConfigModel(
                    config_json=json.dumps(config_data.data),
                    config_type=ConfigType.DEFAULT.value,
                    description="Default configuration for all devices"
                )
                self.db.add(default_config)
                self.db.commit()
            except (ValueError, IntegrityError) as e:
                self.db.rollback()
    
    async def get_by_id(self, config_id: UUID) -> Optional[ProvisionConfig]:
        db_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.id == config_id
        ).first()
        return self._to_entity(db_config) if db_config else None

    async def get_by_device(self, device: Device) -> Optional[ProvisionConfig]:
        db_device = self.db.query(DeviceModel).filter(
            DeviceModel.id == device.id
        ).first()
        if not db_device:
            return None
        
        db_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.id == db_device.config_id
        ).first()
        return self._to_entity(db_config) if db_config else None

    async def get_default(self) -> ProvisionConfig:
        db_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.config_type == ConfigType.DEFAULT.value
        ).first()
        if not db_config:
            raise ValueError("Default configuration not found")
        return self._to_entity(db_config)

    async def save(self, config: ProvisionConfig) -> ProvisionConfig:
        db_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.id == config.id
        ).first()

        if db_config:
            #Update
            db_config.config_json = json.dumps(config.config_data.data)
            db_config.description = config.description
        else:
            #Create
            db_config = ProvisionConfigModel(
                id=config.id,
                config_json=json.dumps(config.config_data.data),
                config_type=config.config_type.value,
                description=config.description
            )
            self.db.add(db_config)

        self.db.commit()
        return self._to_entity(db_config)
    
    async def delete(self, config_id: UUID) -> bool:
        db_config = self.db.query(ProvisionConfigModel).filter(
            ProvisionConfigModel.id == config_id
        ).first()
        if not db_config:
            return False
        
        if db_config.config_type == ConfigType.DEFAULT.value:
            raise ValueError("Cannot delete the default configuration")
        
        self.db.delete(db_config)
        self.db.commit()
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
