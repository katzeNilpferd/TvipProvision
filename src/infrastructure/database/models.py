from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime


Base = declarative_base()


class DeviceModel(Base):
    __tablename__ = 'devices'

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    mac_address = Column(String(17), unique=True, index=True, nullable=False)
    model = Column(String(100), nullable=True)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    config_id = Column(UUID, ForeignKey('provision_configs.id'), nullable=False)

    provision_config = relationship('ProvisionConfigModel', back_populates='devices')


class ProvisionConfigModel(Base):
    __tablename__ = 'provision_configs'

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    config = Column(Text, nullable=False)
    description = Column(Text, default="")

    devices = relationship('DeviceModel', back_populates='provision_config')
