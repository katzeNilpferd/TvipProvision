from typing import Optional, Any
from datetime import datetime

from domain.value_objects.sort_time import SortTime
from domain.value_objects.mac_address import MacAddress
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.statistic_repository import StatisticRepository
from application.dto import NetworkStatisticDTO


class GetNetworkStatisticsUseCase:

    def __init__(
        self,
        device_repository: DeviceRepository,
        statistic_repository: StatisticRepository
    ):
        self.device_repository = device_repository
        self.statistic_repository = statistic_repository

    async def execute(
        self,
        mac_address: str,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        sort_by_timestamp: Optional[SortTime] = SortTime.DESC,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> dict[str, Any]:
        
        mac_address_obj = MacAddress(mac_address)
        device = await self.device_repository.get_by_mac(mac_address_obj)
        if not device:
            raise ValueError(f"Device with MAC {mac_address} not found")
        
        network_stats = await self.statistic_repository.get_network_by_device(
            device=device,
            start_time=start_time,
            end_time=end_time,
            sort_by_timestamp=sort_by_timestamp,
            limit=limit,
            offset=offset
        )
    
        return {
            'device': {
                'id': str(device.id),
                'mac_address': device.mac_address.value,
                'model': device.model,
                'ip_address': device.ip_address.value if device.ip_address else None,
                'last_activity': device.last_activity
            },
            'statistics': [
                NetworkStatisticDTO
                    .from_domain(stat)
                    .model_dump(mode='json')
                for stat in network_stats
            ]
        }
        
