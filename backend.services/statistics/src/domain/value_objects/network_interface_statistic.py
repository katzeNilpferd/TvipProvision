from dataclasses import dataclass


@dataclass
class NetworkInterfaceStats:
    
    received_bytes: int = 0
    received_total_packets: int = 0
    received_multicast_packets: int = 0
    received_error_packets: int = 0
    received_discard_packets: int = 0
    sent_bytes: int = 0
    sent_total_packets: int = 0
    sent_error_packets: int = 0
