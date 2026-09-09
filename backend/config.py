import os
from typing import List, Literal, Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    class Settings(BaseSettings):
        APP_ENV: Literal["development", "staging", "production"] = "development"
        PROJECT_NAME: str = "CINE-SYNAPSE Studio OS"
        API_V1_PREFIX: str = "/api/v1"
        PORT: int = 8000
        HOST: str = "0.0.0.0"
        
        # Security
        JWT_SECRET: str = "dev-secret-key-32-chars-long-for-jwt-2026"
        JWT_ALGORITHM: str = "HS256"
        ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
        RATE_LIMIT_ENABLED: bool = False
        
        # ClickHouse Cloud
        CLICKHOUSE_HOST: str = "localhost"
        CLICKHOUSE_PORT: int = 8443
        CLICKHOUSE_USER: str = "default"
        CLICKHOUSE_PASSWORD: str = ""
        CLICKHOUSE_DATABASE: str = "default"
        CLICKHOUSE_SECURE: bool = True
        CLICKHOUSE_MOCK_FALLBACK: bool = True
        
        # Gemini AI
        GEMINI_API_KEY: Optional[str] = None
        GEMINI_MODEL_ID: str = "gemini-1.5-pro"
        
        # File Storage
        STORAGE_PROVIDER: Literal["local", "gcs"] = "local"
        STORAGE_LOCAL_PATH: str = "storage/local"
        GCS_BUCKET_VAULT: str = "cine-synapse-local-vault"
        
        # Enterprise Mesh Webhooks
        SHOTGRID_API_URL: str = "https://paramount.shotgrid.autodesk.com/api/v1"
        SHOTGRID_SCRIPT_NAME: str = "cinesynapse_daemon"
        SHOTGRID_API_KEY: str = "mock-shotgrid-key"
        SLACK_WEBHOOK_URL: str = "https://hooks.slack.com/services/mock/token"
        TEAMS_WEBHOOK_URL: str = "https://outlook.office.com/webhook/mock/token"

        model_config = SettingsConfigDict(
            env_file=(".env", f".env.{os.getenv('APP_ENV', 'development')}"),
            env_file_encoding="utf-8",
            extra="ignore"
        )
    settings = Settings()
except ImportError:
    class FallbackSettings:
        APP_ENV = os.getenv("APP_ENV", "development")
        PROJECT_NAME = "CINE-SYNAPSE Studio OS"
        API_V1_PREFIX = "/api/v1"
        PORT = int(os.getenv("PORT", 8000))
        HOST = os.getenv("HOST", "0.0.0.0")
        JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-32-chars-long-for-jwt-2026")
        JWT_ALGORITHM = "HS256"
        ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
        RATE_LIMIT_ENABLED = False
        CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
        CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", 8443))
        CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
        CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "")
        CLICKHOUSE_DATABASE = os.getenv("CLICKHOUSE_DATABASE", "default")
        CLICKHOUSE_SECURE = True
        CLICKHOUSE_MOCK_FALLBACK = True
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
        GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-1.5-pro")
        STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local")
        STORAGE_LOCAL_PATH = os.getenv("STORAGE_LOCAL_PATH", "storage/local")
        GCS_BUCKET_VAULT = os.getenv("GCS_BUCKET_VAULT", "cine-synapse-local-vault")
        SHOTGRID_API_URL = os.getenv("SHOTGRID_API_URL", "https://paramount.shotgrid.autodesk.com/api/v1")
        SHOTGRID_SCRIPT_NAME = os.getenv("SHOTGRID_SCRIPT_NAME", "cinesynapse_daemon")
        SHOTGRID_API_KEY = os.getenv("SHOTGRID_API_KEY", "mock-shotgrid-key")
        SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/mock/token")
        TEAMS_WEBHOOK_URL = os.getenv("TEAMS_WEBHOOK_URL", "https://outlook.office.com/webhook/mock/token")
    settings = FallbackSettings()
