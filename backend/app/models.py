"""SQLAlchemy database models."""

from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Generation(Base):
    """Stores each music generation request and its result."""

    __tablename__ = "generations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ACE-Step task id (UUID string)
    task_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # Status: queued, running, succeeded, failed
    status: Mapped[str] = mapped_column(String(20), default="queued")

    # Generation inputs
    prompt: Mapped[str] = mapped_column(Text, default="")
    lyrics: Mapped[str] = mapped_column(Text, default="")
    duration: Mapped[float] = mapped_column(Float, nullable=True)
    bpm: Mapped[int] = mapped_column(Integer, nullable=True)
    key_scale: Mapped[str] = mapped_column(String(32), default="")
    vocal_language: Mapped[str] = mapped_column(String(10), default="en")
    batch_size: Mapped[int] = mapped_column(Integer, default=2)

    # Results — list of audio file paths (JSON array)
    audio_paths: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Metadata returned by ACE-Step
    generation_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
