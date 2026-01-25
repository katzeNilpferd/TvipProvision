from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from domain.repositories.device_repository import DeviceRepository
from domain.repositories.provision_repository import ProvisionRepository
from domain.auth.repositories.user_repository import UserRepository
from domain.services.xml_serializer import XmlSerializer
from application.use_cases.tvip_provision.handle_provision_request import HandleProvisionRequestUseCase
from application.use_cases.devices_management.get_device_config import GetDeviceConfigUseCase
from application.use_cases.devices_management.update_device_config import UpdateDeviceConfigUseCase
from application.use_cases.devices_management.replace_device_config import ReplaceDeviceConfigUseCase
from application.use_cases.devices_management.reset_device_config import ResetDeviceConfigUseCase
from application.use_cases.devices_management.get_devices_list import GetDevicesListUseCase
from application.use_cases.default_config_management.get_default_config import GetDefaultConfigUseCase
from application.use_cases.default_config_management.update_default_config import UpdateDefaultConfigUseCase
from application.use_cases.default_config_management.replace_default_config import ReplaceDefaultConfigUseCase
from application.use_cases.auth.login_user import LoginUserUseCase
from application.use_cases.auth.register_user import RegisterUserUseCase
from application.use_cases.auth.verify_token import VerifyTokenUseCase
from application.use_cases.users_management.change_password import ChangePasswordUseCase
from application.use_cases.users_management.password_recovery import PasswordRecoveryUseCase
from application.use_cases.tickets.create_ticket import CreateTicketUseCase
from application.use_cases.tickets.get_in_progress_ticket import GetInProgressTicketUseCase
from infrastructure.database.database import get_db
from infrastructure.repositories.sql_device_repository import SQLDeviceRepository
from infrastructure.repositories.sql_provision_repository import SQLProvisionRepository
from infrastructure.serializers.xmltodict_serializer import XmlToDictSerializer
from infrastructure.auth.repositories.sql_user_repository import SQLUserRepository
from infrastructure.auth.repositories.sql_ticket_repository import SQLTicketRepository
from infrastructure.auth.jwt_provider import JWTProvider
from infrastructure.auth.password_hasher import PasswordHasher
from config import settings

JWT_SECRET_KEY = settings.jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = settings.jwt_access_token_expire_minutes
JWT_ALGORITHM = settings.jwt_algorithm


def get_device_repository(db: AsyncSession = Depends(get_db)) -> DeviceRepository:
    return SQLDeviceRepository(db_session=db)


def get_provision_repository(db: AsyncSession = Depends(get_db)) -> ProvisionRepository:
    return SQLProvisionRepository(db_session=db)


def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return SQLUserRepository(db_session=db)


def get_ticket_repository(db: AsyncSession = Depends(get_db)) -> SQLTicketRepository:
    return SQLTicketRepository(db_session=db)


def get_xml_serializer() -> XmlSerializer:
    return XmlToDictSerializer()


def get_jwt_provider() -> JWTProvider:
    return JWTProvider(
        secret_key=JWT_SECRET_KEY,
        access_token_expire_minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        algorithm=JWT_ALGORITHM
    )


def get_password_hasher() -> PasswordHasher:
    return PasswordHasher()


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


def get_devices_list_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository)
) -> GetDevicesListUseCase:
    return GetDevicesListUseCase(
        device_repo=device_repo
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


def replace_device_config_use_case(
    device_repo: DeviceRepository = Depends(get_device_repository),
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> ReplaceDeviceConfigUseCase:
    return ReplaceDeviceConfigUseCase(
        device_repo=device_repo,
        provision_repo=provision_repo
    )


def replace_default_config_use_case(
    provision_repo: ProvisionRepository = Depends(get_provision_repository)
) -> ReplaceDefaultConfigUseCase:
    return ReplaceDefaultConfigUseCase(
        provision_repo=provision_repo
    )


def get_login_user_use_case(
    user_repo: UserRepository = Depends(get_user_repository),
    jwt_provider: JWTProvider = Depends(get_jwt_provider),
    password_hasher: PasswordHasher = Depends(get_password_hasher)
) -> LoginUserUseCase:
    return LoginUserUseCase(
        user_repo=user_repo,
        jwt_provider=jwt_provider,
        password_hasher=password_hasher
    )


def get_register_user_use_case(
    user_repo: UserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher)
) -> RegisterUserUseCase:
    return RegisterUserUseCase(
        user_repo=user_repo,
        password_hasher=password_hasher
    )


def get_change_password_use_case(
    user_repo: UserRepository = Depends(get_user_repository),
    jwt_provider: JWTProvider = Depends(get_jwt_provider),
    password_hasher: PasswordHasher = Depends(get_password_hasher)
) -> ChangePasswordUseCase:
    return ChangePasswordUseCase(
        user_repo=user_repo,
        jwt_provider=jwt_provider,
        password_hasher=password_hasher
    )


def get_password_recovery_use_case(
    ticket_repo: SQLTicketRepository = Depends(get_ticket_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher)
) -> PasswordRecoveryUseCase:
    return PasswordRecoveryUseCase(
        ticket_repo=ticket_repo,
        user_repo=user_repo,
        password_hasher=password_hasher
    )


def get_verify_token_use_case(
    user_repo: UserRepository = Depends(get_user_repository),
    jwt_provider: JWTProvider = Depends(get_jwt_provider)
) -> VerifyTokenUseCase:
    return VerifyTokenUseCase(
        user_repo=user_repo,
        jwt_provider=jwt_provider
    )


def get_create_ticket_use_case(
    ticket_repo: SQLTicketRepository = Depends(get_ticket_repository),
    user_repo: UserRepository = Depends(get_user_repository)
) -> CreateTicketUseCase:
    return CreateTicketUseCase(
        ticket_repo=ticket_repo,
        user_repo=user_repo
    )


def get_in_progress_ticket_use_case(
    ticket_repo: SQLTicketRepository = Depends(get_ticket_repository)
) -> GetInProgressTicketUseCase:
    return GetInProgressTicketUseCase(
        ticket_repo=ticket_repo
    )
