from dataclasses import dataclass, field
from uuid import UUID, uuid4

from domain.value_objects.audio_statistic import AudioStats
from domain.value_objects.video_statistic import VideoStats


@dataclass
class MediaStatistic:
    """Represents media playback statistics from STB device."""
    
    device_id: UUID
    timestamp: int
    url: str
    avg_bitrate: int
    begin: int
    end: int
    discontinuities: int
    proto: str
    id: str
    video: VideoStats
    audio: AudioStats
