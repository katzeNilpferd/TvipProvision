from dataclasses import dataclass
import re


@dataclass(frozen=True)
class IpAddress:
    '''Value object representing an IPv4 address.'''
    value: str

    def __post_init__(self):
        if not self.is_valid(self.value):
            raise ValueError(f"Invalid IP address: {self.value}")

    def is_valid(self, ip: str) -> bool:
        '''Validate the IPv4 address format.'''
        ipv4_pattern = r'^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        return bool(re.match(ipv4_pattern, ip))
