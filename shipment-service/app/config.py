import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = int(os.getenv("PORT", 4002))
    jwt_secret: str = os.getenv("JWT_SECRET", "super-secret-shared-key-change-in-prod")
    jwt_algorithm: str = "HS256"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/shipments.db")
    warehouse_service_url: str = os.getenv("WAREHOUSE_SERVICE_URL", "http://localhost:4004")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    class Config:
        env_file = ".env"


settings = Settings()
