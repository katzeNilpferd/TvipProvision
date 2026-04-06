from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime

from domain.entities.device import Device
from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic


class StatisticRepository(ABC):
    """Interface for statistics repository."""
    
    @abstractmethod
    async def save_media(self, statistics: List[MediaStatistic]) -> None:
        """Save media statistics."""
    
    @abstractmethod
    async def save_network(self, statistics: List[NetworkStatistic]) -> None:
        """Save network statistics."""

    @abstractmethod
    async def get_media_by_device(
        self, 
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[MediaStatistic]:
        """Get media statistics for a specific device."""
    
    @abstractmethod
    async def get_network_by_device(
        self,
        device: Device,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[NetworkStatistic]:
        """Get network statistics for a specific device."""

    @abstractmethod
    async def clear_media_for_device(self, device: Device) -> None:
        """Clear media statistics for a specific device."""

    @abstractmethod
    async def clear_network_for_device(self, device: Device) -> None:
        """Clear network statistics for a specific device."""

    @abstractmethod
    async def get_latest_media_by_devices(
        self,
        device_ids: List[str],
        start_time: datetime
    ) -> List[MediaStatistic]:
        """Get latest media statistics for specific devices."""

    @abstractmethod
    async def get_latest_network_by_devices(
        self,
        device_ids: List[str],
        start_time: datetime
    ) -> List[NetworkStatistic]:
        """Get latest network statistics for specific devices."""
