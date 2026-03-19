from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    '''Application configuration settings loaded from environment variables.'''
    
    auth_enabled: bool = False

    jwt_secret_key: str = "your-default-secret-key"
    jwt_access_token_expire_minutes: int = 30
    jwt_algorithm: str = "HS256"

    # It just points the service to the database address (It is not involved in creating the database itself).
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tvip_provision"

    # Root user credentials (Used during database migration to create default root user).
    default_username: str = "admin"
    default_password: str = "tvip_manager"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
