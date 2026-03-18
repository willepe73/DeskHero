from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SEATAPP_", case_sensitive=False)

    database_url: str = "sqlite:///./data/app.db"
    floorplans_dir: Path = Path("./floorplans")
    seat_registry_cache_path: Path = Path("./data/seat_registry_cache.json")

    api_prefix: str = "/api/v1"


settings = Settings()


