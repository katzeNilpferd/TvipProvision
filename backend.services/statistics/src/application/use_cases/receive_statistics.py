from typing import (
    List,
    Optional,
    Dict,
    Any
)
from uuid import UUID

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress
from domain.value_objects.video_statistic import VideoStats
from domain.value_objects.audio_statistic import AudioStats
from domain.value_objects.network_interface_statistic import NetworkInterfaceStats
from domain.entities.device import Device
from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic
from domain.repositories.device_repository import DeviceRepository
from domain.repositories.statistic_repository import StatisticRepository
from application.dto import (
    StatisticReportDTO,
    MediaStatisticDTO,
    NetworkStatisticDTO
)


class ReceiveStatisticsUseCase:

    def __init__(
        self,
        device_repository: DeviceRepository,
        statistic_repository: StatisticRepository
    ):
        self.device_repository = device_repository
        self.statistic_repository = statistic_repository
        self._handlers: Dict[str, Any] = {
            "media": self._handle_media,
            "network": self._handle_network
        }

    async def execute(
        self,
        mac_address: str,
        reports: List[StatisticReportDTO],
        ip_address: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        
        device = await self.device_repository.save(
            Device(
                mac_address=MacAddress(mac_address),
                ip_address=IpAddress(ip_address) if ip_address else None,
                model=model
            )
        )

        media_stats: List[MediaStatistic] = []
        network_stats: List[NetworkStatistic] = []

        for report in reports:
            handler = self._handlers.get(report.type)
            if not handler:
                continue
            
            statistic = handler(device.id, report)
            if report.type == "media":
                media_stats.append(statistic)
            elif report.type == "network":
                network_stats.append(statistic)

        if media_stats:
            await self.statistic_repository.save_media(media_stats)
        if network_stats:
            await self.statistic_repository.save_network(network_stats)

        return {
            "device_id": str(device.id),
            "mac_address": mac_address,
            "media_saved": len(media_stats),
            "network_saved": len(network_stats)
        }


    def _handle_media(
        self,
        device_id: UUID,
        report: MediaStatisticDTO
    ) -> MediaStatistic:
        """Handle media statistics."""

        return MediaStatistic(
            device_id=device_id,
            timestamp=report.timestamp,
            url=report.url,
            avg_bitrate=report.avg_bitrate,
            begin=report.begin,
            end=report.end,
            discontinuities=report.discontinuties,
            proto=report.proto or "",
            id=report.id or "",
            video=VideoStats(
                frames_decoded=report.video.frames_decoded,
                frames_dropped=report.video.frames_dropped,
                frames_failed=report.video.frames_failed
            ),
            audio=AudioStats(
                frames_decoded=report.audio.frames_decoded,
                frames_dropped=report.audio.frames_dropped,
                frames_failed=report.audio.frames_failed
            )
        )
        
    
    def _handle_network(
        self,
        device_id: UUID,
        report: NetworkStatisticDTO
    ) -> NetworkStatistic:
        """Handle network statistics."""

        return NetworkStatistic(
            device_id=device_id,
            timestamp=report.timestamp,
            name=report.name,
            speed=report.speed,
            duplex=report.duplex,
            ip=report.ip,
            netmask=report.netmask,
            gateway=report.gateway,
            stat=NetworkInterfaceStats(
                received_bytes=report.stat.received_bytes,
                received_total_packets=report.stat.received_total_packets,
                received_multicast_packets=report.stat.received_multicast_packets,
                received_error_packets=report.stat.received_error_packets,
                received_discard_packets=report.stat.received_discard_packets,
                sent_bytes=report.stat.sent_bytes,
                sent_total_packets=report.stat.sent_total_packets,
                sent_error_packets=report.stat.sent_error_packets
            )
        )
