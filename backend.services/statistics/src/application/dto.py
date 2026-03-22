from pydantic import BaseModel, Field
from typing import Optional, Union


class VideoStatsDTO(BaseModel):
    frames_decoded: int = 0
    frames_dropped: int = 0
    frames_failed: int = 0


class AudioStatsDTO(BaseModel):
    frames_decoded: int = 0
    frames_dropped: int = 0
    frames_failed: int = 0


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


class NetworkStatsDTO(BaseModel):
    received_bytes: int = 0
    received_total_packets: int = 0
    received_multicast_packets: int = 0
    received_error_packets: int = 0
    received_discard_packets: int = 0
    sent_bytes: int = 0
    sent_total_packets: int = 0
    sent_error_packets: int = 0


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


StatisticReportDTO = Union[MediaStatisticDTO, NetworkStatisticDTO]
