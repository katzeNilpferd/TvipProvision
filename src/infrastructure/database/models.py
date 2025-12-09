from typing import Optional
from sqlalchemy import ( 
    String, 
    Text, 
    ForeignKey, 
    DateTime
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime, timezone


Base = declarative_base()


class DeviceModel(Base):
    __tablename__ = 'devices'

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    mac_address: Mapped[str] = mapped_column(String(17), unique=True, index=True, nullable=False)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    config_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey('provision_configs.id'), nullable=False)

    provision_config = relationship('ProvisionConfigModel', back_populates='devices')


class ProvisionConfigModel(Base):
    __tablename__ = 'provision_configs'

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    config_json: Mapped[str] = mapped_column(Text, nullable=False)
    config_type: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")

    devices = relationship('DeviceModel', back_populates='provision_config')
