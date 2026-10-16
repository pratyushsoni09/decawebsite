from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    PROJECT_NAME: str = "DecaCorpus API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # No database (project decision): writes are appended to JSON-lines files here.
    DATA_DIR: Path = BASE_DIR / "data"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
