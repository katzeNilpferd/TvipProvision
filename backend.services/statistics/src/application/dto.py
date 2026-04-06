from pydantic import BaseModel, Field
from typing import Optional, Union
from uuid import UUID

from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic
from domain.value_objects.audio_statistic import AudioStats
from domain.value_objects.video_statistic import VideoStats
from domain.value_objects.network_interface_statistic import NetworkInterfaceStats


class VideoStatsDTO(BaseModel):
    frames_decoded: int = 0
    frames_dropped: int = 0
    frames_failed: int = 0
    
    def to_domain(self) -> VideoStats:
        return VideoStats(
            frames_decoded=self.frames_decoded,
            frames_dropped=self.frames_dropped,
            frames_failed=self.frames_failed
        )
    
    @classmethod
    def from_domain(cls, video: VideoStats) -> "VideoStatsDTO":
        return cls(
            frames_decoded=video.frames_decoded,
            frames_dropped=video.frames_dropped,
            frames_failed=video.frames_failed
        )


class AudioStatsDTO(BaseModel):
    frames_decoded: int = 0
    frames_dropped: int = 0
    frames_failed: int = 0
    
    def to_domain(self) -> AudioStats:
        return AudioStats(
            frames_decoded=self.frames_decoded,
            frames_dropped=self.frames_dropped,
            frames_failed=self.frames_failed
        )
    
    @classmethod
    def from_domain(cls, audio: AudioStats) -> "AudioStatsDTO":
        return cls(
            frames_decoded=audio.frames_decoded,
            frames_dropped=audio.frames_dropped,
            frames_failed=audio.frames_failed
        )


class MediaStatisticDTO(BaseModel):
    type: str = "media"
    timestamp: int
    url: str
    avg_bitrate: int
    begin: int
    end: int
    discontinuties: int = 0
    id: Optional[str] = None
    proto: Optional[str] = None
    video: VideoStatsDTO = Field(default_factory=VideoStatsDTO)
    audio: AudioStatsDTO = Field(default_factory=AudioStatsDTO)
    
    def to_domain(self, device_id: UUID) -> MediaStatistic:
        return MediaStatistic(
            device_id=device_id,
            timestamp=self.timestamp,
            url=self.url,
            avg_bitrate=self.avg_bitrate,
            begin=self.begin,
            end=self.end,
            discontinuities=self.discontinuties,
            proto=self.proto or "",
            id=self.id or "",
            video=self.video.to_domain(),
            audio=self.audio.to_domain()
        )
    
    @classmethod
    def from_domain(cls, media: MediaStatistic) -> "MediaStatisticDTO":
        return cls(
            timestamp=media.timestamp,
            url=media.url,
            avg_bitrate=media.avg_bitrate,
            begin=media.begin,
            end=media.end,
            discontinuties=media.discontinuities,
            id=media.id,
            proto=media.proto,
            video=VideoStatsDTO.from_domain(media.video),
            audio=AudioStatsDTO.from_domain(media.audio)
        )


class NetworkStatsDTO(BaseModel):
    received_bytes: int = 0
    received_total_packets: int = 0
    received_multicast_packets: int = 0
    received_error_packets: int = 0
    received_discard_packets: int = 0
    sent_bytes: int = 0
    sent_total_packets: int = 0
    sent_error_packets: int = 0
    
    def to_domain(self) -> NetworkInterfaceStats:
        return NetworkInterfaceStats(
            received_bytes=self.received_bytes,
            received_total_packets=self.received_total_packets,
            received_multicast_packets=self.received_multicast_packets,
            received_error_packets=self.received_error_packets,
            received_discard_packets=self.received_discard_packets,
            sent_bytes=self.sent_bytes,
            sent_total_packets=self.sent_total_packets,
            sent_error_packets=self.sent_error_packets
        )
    
    @classmethod
    def from_domain(cls, stats: NetworkInterfaceStats) -> "NetworkStatsDTO":
        return cls(
            received_bytes=stats.received_bytes,
            received_total_packets=stats.received_total_packets,
            received_multicast_packets=stats.received_multicast_packets,
            received_error_packets=stats.received_error_packets,
            received_discard_packets=stats.received_discard_packets,
            sent_bytes=stats.sent_bytes,
            sent_total_packets=stats.sent_total_packets,
            sent_error_packets=stats.sent_error_packets
        )


class NetworkStatisticDTO(BaseModel):
    type: str = "network"
    timestamp: int
    name: str
    speed: int
    duplex: str
    ip: str
    netmask: str
    gateway: str
    stat: NetworkStatsDTO = Field(default_factory=NetworkStatsDTO)
    
    def to_domain(self, device_id: UUID) -> NetworkStatistic:
        return NetworkStatistic(
            device_id=device_id,
            timestamp=self.timestamp,
            name=self.name,
            speed=self.speed,
            duplex=self.duplex,
            ip=self.ip,
            netmask=self.netmask,
            gateway=self.gateway,
            stat=self.stat.to_domain()
        )
    
    @classmethod
    def from_domain(cls, network: NetworkStatistic) -> "NetworkStatisticDTO":
        return cls(
            timestamp=network.timestamp,
            name=network.name,
            speed=network.speed,
            duplex=network.duplex,
            ip=network.ip,
            netmask=network.netmask,
            gateway=network.gateway,
            stat=NetworkStatsDTO.from_domain(network.stat)
        )


StatisticReportDTO = Union[MediaStatisticDTO, NetworkStatisticDTO]


class WebSocketStatsMessage(BaseModel):
    """Message format for WebSocket statistics updates."""
    
    type: str  # 'media', 'network', 'error', 'connection'
    device_id: Optional[str] = None
    mac_address: Optional[str] = None
    timestamp: int
    data: StatisticReportDTO
    message: Optional[str] = None  # For error/connection messages
