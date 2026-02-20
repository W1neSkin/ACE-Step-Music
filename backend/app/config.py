"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://musicapp:musicapp_secret_2024@localhost:5432/musicapp"

    # ACE-Step API server
    acestep_url: str = "http://localhost:8001"

    # Ollama server (lyrics generation)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"

    # Audio storage path inside the container
    audio_dir: str = "/app/audio"

    class Config:
        env_file = ".env"


settings = Settings()
