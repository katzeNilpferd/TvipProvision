from dataclasses import dataclass


@dataclass
class VideoStats:

    frames_decoded: int
    frames_dropped: int
    frames_failed: int
