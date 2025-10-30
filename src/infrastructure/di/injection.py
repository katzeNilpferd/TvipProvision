from fastapi import Depends
from sqlalchemy.orm import Session

from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository
from domain.services.xml_serializer import XmlSerializer
from application.use_cases.tvip_provision.handle_provision_request import HandleProvisionRequestUseCase
from application.use_cases.devices_management.get_device_config import GetDeviceConfigUseCase
from application.use_cases.devices_management.update_device_config import UpdateDeviceConfigUseCase
from application.use_cases.devices_management.reset_device_config import ResetDeviceConfigUseCase
from application.use_cases.default_config_management.get_default_config import GetDefaultConfigUseCase
from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from infrastructure.database.database import get_db
from infrastructure.repositories.sql_device_repository import SQLDeviceRepository
from infrastructure.repositories.sql_provision_repository import SQLProvisionRepository
from infrastructure.serializers.xmltodict_serializer import XmlToDictSerializer


def get_device_repository(db: Session = Depends(get_db)) -> DeviceRepository:
    return SQLDeviceRepository(db_session=db)


def get_provision_repository(db: Session = Depends(get_db)) -> ProvisionRepository:
    return SQLProvisionRepository(db_session=db)


def get_xml_serializer() -> XmlSerializer:
    return XmlToDictSerializer()


def get_handle_provision_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    provision_repo: ProvisionRepository = Depends(get_provision_repository),
    xml_serializer: XmlSerializer = Depends(get_xml_serializer)
) -> HandleProvisionRequestUseCase:
    return HandleProvisionRequestUseCase(
        device_repo=device_repo,
        provision_repo=provision_repo, 
        xml_serializer=xml_serializer
    )


def get_device_config_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> GetDeviceConfigUseCase:
    return GetDeviceConfigUseCase(
        device_repo=device_repo,
        provision_repo=provision_repo
    )


def update_device_config_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> UpdateDeviceConfigUseCase:
    return UpdateDeviceConfigUseCase(
        device_repo=device_repo,
        provision_repo=provision_repo
    )


def reset_device_config_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> ResetDeviceConfigUseCase:
    return ResetDeviceConfigUseCase(
        device_repo=device_repo,
        provision_repo=provision_repo
    )


def get_default_config_use_case(
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> GetDefaultConfigUseCase:
    return GetDefaultConfigUseCase(
        provision_repo=provision_repo
    )


def update_default_config_use_case(
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> UpdateDefaultConfigUseCase:
    return UpdateDefaultConfigUseCase(
        provision_repo=provision_repo
    )
