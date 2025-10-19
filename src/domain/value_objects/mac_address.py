from dataclasses import dataclass
import re


@dataclass(frozen=True)
class MacAddress:
    value: str

    def __post_init__(self):
        if not self.is_valid(self.value):
            raise ValueError(f"Invalid MAC address: {self.value}")

        object.__setattr__(self, 'value', self.normalize(self.value))

    def is_valid(self, mac: str) -> bool:
        pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
        return bool(re.match(pattern, mac))

    def normalize(self, mac: str) -> str:
        clean_mac = re.sub(r'[^0-9A-Fa-f]', '', mac).lower()
        return ':'.join(clean_mac[i:i+2] for i in range(0, 12, 2))
