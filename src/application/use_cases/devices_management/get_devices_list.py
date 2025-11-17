from typing import Any, Optional
from datetime import datetime

from domain.repositories.device_repository import DeviceRepository
from domain.value_objects.ip_address import IpAddress


class GetDevicesListUseCase:

    def __init__(self, device_repo: DeviceRepository):
        self.device_repo = device_repo

    async def execute(self, ip: Optional[str] = None, model: Optional[str] = None, last_activity_after: Optional[str] = None, last_activity_before: Optional[str] = None, limit: Optional[int] = None, offset: Optional[int] = None) -> list[dict[str, Any]]:
        ip_value_object = IpAddress(ip) if ip else None
        datetime_after = datetime.fromisoformat(last_activity_after) if last_activity_after else None
        datetime_before = datetime.fromisoformat(last_activity_before) if last_activity_before else None
        
        devices = await self.device_repo.get_by_filters(
            ip_address=ip_value_object,
            model=model,
            last_activity_from=datetime_after,
            last_activity_to=datetime_before,
            limit=limit,
            offset=offset
        )
        return [
            {
                'id': str(d.id),
                'mac_address': d.mac_address.value,
                'model': d.model,
                'ip_address': d.ip_address.value if d.ip_address else None,
                'last_activity': d.last_activity
            }
            for d in devices
        ]
