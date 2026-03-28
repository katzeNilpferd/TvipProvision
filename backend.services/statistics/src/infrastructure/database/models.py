from typing import Optional
from sqlalchemy import ( 
    String,
    Text,
    Integer,
    BigInteger,
    DateTime,
    ForeignKey,
    PrimaryKeyConstraint
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

    # Relationships
    media_statistics: Mapped[list["MediaStatisticModel"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )
    network_statistics: Mapped[list["NetworkStatisticModel"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )


class MediaStatisticModel(Base):
    __tablename__ = "media_statistics"
    
    device_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    avg_bitrate: Mapped[int] = mapped_column(Integer, nullable=False)
    begin_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    discontinuities: Mapped[int] = mapped_column(Integer, default=0)
    proto: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    content_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Video stats
    video_frames_decoded: Mapped[int] = mapped_column(Integer, default=0)
    video_frames_dropped: Mapped[int] = mapped_column(Integer, default=0)
    video_frames_failed: Mapped[int] = mapped_column(Integer, default=0)
    
    # Audio stats
    audio_frames_decoded: Mapped[int] = mapped_column(Integer, default=0)
    audio_frames_dropped: Mapped[int] = mapped_column(Integer, default=0)
    audio_frames_failed: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        PrimaryKeyConstraint('device_id', 'timestamp', name='media_statistics_pkey'),
    )

    # Relationship
    device: Mapped["DeviceModel"] = relationship(back_populates="media_statistics")


class NetworkStatisticModel(Base):
    __tablename__ = "network_statistics"
    
    device_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    interface_name: Mapped[str] = mapped_column(String(50), nullable=False)
    speed: Mapped[int] = mapped_column(Integer, nullable=False)
    duplex: Mapped[str] = mapped_column(String(10), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(15), nullable=False)
    netmask: Mapped[str] = mapped_column(String(15), nullable=False)
    gateway: Mapped[str] = mapped_column(String(15), nullable=False)
    
    # Interface statistics
    received_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    received_total_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    received_multicast_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    received_error_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    received_discard_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    
    sent_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    sent_total_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    sent_error_packets: Mapped[int] = mapped_column(BigInteger, default=0)
    
    __table_args__ = (
        PrimaryKeyConstraint('device_id', 'timestamp', name='network_statistics_pkey'),
    )

    # Relationship
    device: Mapped["DeviceModel"] = relationship(back_populates="network_statistics")
