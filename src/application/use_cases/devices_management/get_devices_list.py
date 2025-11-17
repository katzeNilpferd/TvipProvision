from typing import Any

from domain.repositories.device_repository import DeviceRepository


class GetDevicesListUseCase:

    def __init__(self, device_repo: DeviceRepository):
        self.device_repo = device_repo

    async def execute(self) -> list[dict[str, Any]]:
        devices = await self.device_repo.get_all()
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
