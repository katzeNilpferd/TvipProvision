from datetime import datetime, timezone

from domain.value_objects.mac_address import MacAddress
from domain.value_objects.ip_address import IpAddress
from domain.value_objects.video_statistic import VideoStats
from domain.value_objects.audio_statistic import AudioStats
from domain.value_objects.network_interface_statistic import NetworkInterfaceStats
from domain.entities.device import Device
from domain.entities.media_statistic import MediaStatistic
from domain.entities.network_statistic import NetworkStatistic
from infrastructure.database.models import MediaStatisticModel
from infrastructure.database.models import NetworkStatisticModel
from infrastructure.database.models import DeviceModel


class DeviceMapper:
    '''Mapper class to convert between DeviceModel and Device entity.'''

    @staticmethod
    def to_entity(model: DeviceModel) -> Device:
        '''Converts a DeviceModel instance to a Device entity.'''
        return Device(
            id=model.id,
            mac_address=MacAddress(model.mac_address),
            model=model.model,
            last_activity=model.last_activity,
            ip_address=IpAddress(model.ip_address) if model.ip_address else None
        )
    
    @staticmethod
    def to_model(entity: Device) -> DeviceModel:
        '''Converts a Device entity to a DeviceModel instance.'''
        return DeviceModel(
            id=entity.id,
            mac_address=entity.mac_address.value,
            model=entity.model,
            last_activity=entity.last_activity,
            ip_address=entity.ip_address.value if entity.ip_address else None
        )


class MediaStatisticMapper:
    '''Mapper class to convert between MediaStatisticModel and MediaStatistic entity.'''
    
    @staticmethod
    def to_entity(model: MediaStatisticModel) -> MediaStatistic:
        '''Converts a MediaStatisticModel instance to a MediaStatistic entity.'''
        return MediaStatistic(
            statistic_id=model.statistic_id,
            device_id=model.device_id,
            timestamp=int(model.timestamp.timestamp()),
            url=model.url,
            avg_bitrate=model.avg_bitrate,
            begin=int(model.begin_time.timestamp()),
            end=int(model.end_time.timestamp()),
            discontinuities=model.discontinuities,
            proto=model.proto or "",
            id=model.content_id or "",
            video=VideoStats(
                frames_decoded=model.video_frames_decoded,
                frames_dropped=model.video_frames_dropped,
                frames_failed=model.video_frames_failed
            ),
            audio=AudioStats(
                frames_decoded=model.audio_frames_decoded,
                frames_dropped=model.audio_frames_dropped,
                frames_failed=model.audio_frames_failed
            )
        )
    
    @staticmethod
    def to_model(entity: MediaStatistic) -> MediaStatisticModel:
        '''Converts a MediaStatistic entity to a MediaStatisticModel instance.'''
        return MediaStatisticModel(
            statistic_id=entity.statistic_id,
            device_id=entity.device_id,
            timestamp=datetime.fromtimestamp(entity.timestamp, tz=timezone.utc),
            url=entity.url,
            avg_bitrate=entity.avg_bitrate,
            begin_time=datetime.fromtimestamp(entity.begin, tz=timezone.utc),
            end_time=datetime.fromtimestamp(entity.end, tz=timezone.utc),
            discontinuities=entity.discontinuities,
            proto=entity.proto,
            content_id=entity.id,
            video_frames_decoded=entity.video.frames_decoded,
            video_frames_dropped=entity.video.frames_dropped,
            video_frames_failed=entity.video.frames_failed,
            audio_frames_decoded=entity.audio.frames_decoded,
            audio_frames_dropped=entity.audio.frames_dropped,
            audio_frames_failed=entity.audio.frames_failed
        )


class NetworkStatisticMapper:
    '''Mapper class to convert between NetworkStatisticModel and NetworkStatistic entity.'''
    
    @staticmethod
    def to_entity(model: NetworkStatisticModel) -> NetworkStatistic:
        '''Converts a NetworkStatisticModel instance to a NetworkStatistic entity.'''
        return NetworkStatistic(
            statistic_id=model.statistic_id,
            device_id=model.device_id,
            timestamp=int(model.timestamp.timestamp()),
            name=model.interface_name,
            speed=model.speed,
            duplex=model.duplex,
            ip=model.ip_address,
            netmask=model.netmask,
            gateway=model.gateway,
            stat=NetworkInterfaceStats(
                received_bytes=model.received_bytes,
                received_total_packets=model.received_total_packets,
                received_multicast_packets=model.received_multicast_packets,
                received_error_packets=model.received_error_packets,
                received_discard_packets=model.received_discard_packets,
                sent_bytes=model.sent_bytes,
                sent_total_packets=model.sent_total_packets,
                sent_error_packets=model.sent_error_packets
            )
        )
    
    @staticmethod
    def to_model(entity: NetworkStatistic) -> NetworkStatisticModel:
        '''Converts a NetworkStatistic entity to a NetworkStatisticModel instance.'''
        return NetworkStatisticModel(
            statistic_id=entity.statistic_id,
            device_id=entity.device_id,
            timestamp=datetime.fromtimestamp(entity.timestamp, tz=timezone.utc),
            interface_name=entity.name,
            speed=entity.speed,
            duplex=entity.duplex,
            ip_address=entity.ip,
            netmask=entity.netmask,
            gateway=entity.gateway,
            received_bytes=entity.stat.received_bytes,
            received_total_packets=entity.stat.received_total_packets,
            received_multicast_packets=entity.stat.received_multicast_packets,
            received_error_packets=entity.stat.received_error_packets,
            received_discard_packets=entity.stat.received_discard_packets,
            sent_bytes=entity.stat.sent_bytes,
            sent_total_packets=entity.stat.sent_total_packets,
            sent_error_packets=entity.stat.sent_error_packets
        )