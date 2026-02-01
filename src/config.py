from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    '''Application configuration settings loaded from environment variables.'''
    
    auth_enabled: bool = False

    jwt_secret_key: str = "your-default-secret-key"
    jwt_access_token_expire_minutes: int = 30
    jwt_algorithm: str = "HS256"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
