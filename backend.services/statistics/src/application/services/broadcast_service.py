import asyncio
import logging
from datetime import datetime, timedelta, timezone

from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic
from domain.repositories.statistic_repository import StatisticRepository
from domain.repositories.device_repository import DeviceRepository
from application.dto import (
    WebSocketStatsMessage,
    NetworkStatisticDTO,
    MediaStatisticDTO
)
from infrastructure.websocket.connection_manager import connection_manager


logger = logging.getLogger(__name__)


class StatisticsBroadcastService:
    """Background service for broadcasting statistics updates via WebSocket."""
    
    def __init__(
        self,
        device_repository: DeviceRepository,
        statistic_repository: StatisticRepository,
        broadcast_interval: int = 5  # seconds
    ):
        self.device_repository = device_repository
        self.statistic_repository = statistic_repository
        self.broadcast_interval = broadcast_interval
        
        # Track last broadcast timestamps per device to avoid duplicates
        self._last_media_timestamp: dict[str, datetime] = {}  # device_id -> last_broadcast_time
        self._last_network_timestamp: dict[str, datetime] = {}  # device_id -> last_broadcast_time
        
        self._running = False
        self._task = None
    
    async def start(self) -> None:
        """Start the broadcast service."""
        self._running = True
        logger.info(f"Statistics broadcast service started (interval: {self.broadcast_interval}s)")
        
        while self._running:
            try:
                await self._broadcast_cycle()
                await asyncio.sleep(self.broadcast_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in broadcast cycle: {e}")
                await asyncio.sleep(self.broadcast_interval)
    
    def stop(self) -> None:
        """Stop the broadcast service."""
        self._running = False
        logger.info("Statistics broadcast service stopped")
    
    async def _broadcast_cycle(self) -> None:
        """Execute one broadcast cycle."""
        subscribed_device_ids = await connection_manager.get_subscribed_device_ids()

        if not subscribed_device_ids:
            logger.debug("No active device subscriptions, skipping broadcast cycle")
            return
        
        start_time = datetime.now(tz=timezone.utc) - timedelta(minutes=2)
        
        media_stats = await self.statistic_repository.get_latest_media_by_devices(
            device_ids=list(subscribed_device_ids),
            start_time=start_time
        )
        network_stats = await self.statistic_repository.get_latest_network_by_devices(
            device_ids=list(subscribed_device_ids),
            start_time=start_time
        )
        
        for stat in media_stats:
            await self._broadcast_media_stat(stat)
        
        for stat in network_stats:
            await self._broadcast_network_stat(stat)
        
        # Cleanup old timestamps periodically
        self._cleanup_old_timestamps()
    
    async def _broadcast_media_stat(self, stat: MediaStatistic) -> None:
        """Broadcast single media statistic."""
        device_id = str(stat.device_id)
        
        # Check if we already broadcasted this timestamp
        last_time = self._last_media_timestamp.get(device_id)
        if last_time and stat.timestamp <= last_time.timestamp():
            return
        
        self._last_media_timestamp[device_id] = datetime.fromtimestamp(stat.timestamp, tz=timezone.utc)
        
        message = WebSocketStatsMessage(
            type='media',
            device_id=str(stat.device_id),
            mac_address=None,
            timestamp=stat.timestamp,
            data=MediaStatisticDTO.from_domain(stat)
        )
        
        await connection_manager.broadcast_to_device(
            str(stat.device_id),
            message.model_dump(mode='json')
        )
    
    async def _broadcast_network_stat(self, stat: NetworkStatistic) -> None:
        """Broadcast single network statistic."""
        device_id = str(stat.device_id)
        
        # Check if we already broadcasted this timestamp
        last_time = self._last_network_timestamp.get(device_id)
        if last_time and stat.timestamp <= last_time.timestamp():
            return
        
        self._last_network_timestamp[device_id] = datetime.fromtimestamp(stat.timestamp, tz=timezone.utc)
        
        message = WebSocketStatsMessage(
            type='network',
            device_id=str(stat.device_id),
            mac_address=None,
            timestamp=stat.timestamp,
            data=NetworkStatisticDTO.from_domain(stat)
        )
        
        await connection_manager.broadcast_to_device(
            str(stat.device_id),
            message.model_dump(mode='json')
        )
    
    def _cleanup_old_timestamps(self) -> None:
        """Remove old timestamp records to prevent memory leaks."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=2)
        
        # Clean media timestamps
        self._last_media_timestamp = {
            device_id: ts for device_id, ts in self._last_media_timestamp.items()
            if ts > cutoff_time
        }
        
        # Clean network timestamps
        self._last_network_timestamp = {
            device_id: ts for device_id, ts in self._last_network_timestamp.items()
            if ts > cutoff_time
        }
