from dataclasses import dataclass
import re


@dataclass(frozen=True)
class MacAddress:
    value: str

    def __post_init__(self):
        if not self.is_valid(self.value):
            raise ValueError(f"Invalid MAC address: {self.value}")
    
    def is_valid(self, mac: str) -> bool:
        pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
        return bool(re.match(pattern, mac))

