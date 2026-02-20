"""Pydantic request / response schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


# ---------- Music generation ----------

class MusicGenerateRequest(BaseModel):
    """Parameters sent from the frontend to create a music generation task."""
    prompt: str = Field("", description="Music style description")
    lyrics: str = Field("", description="Song lyrics text")
    duration: float | None = Field(None, ge=10, le=300, description="Duration in seconds")
    bpm: int | None = Field(None, ge=30, le=300)
    key_scale: str = Field("", description="e.g. 'C Major', 'Am'")
    time_signature: str = Field("", description="2, 3, 4, or 6")
    vocal_language: str = Field("en", description="Language code: en, ru, zh, etc.")
    thinking: bool = Field(True, description="Use LM for enhanced quality")
    batch_size: int = Field(2, ge=1, le=8)
    inference_steps: int = Field(8, ge=1, le=50)


class MusicGenerateResponse(BaseModel):
    id: int
    task_id: str
    status: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    audio_urls: list[str] = []
    generation_meta: dict | None = None


# ---------- Lyrics generation ----------

class LyricsRequest(BaseModel):
    theme: str = Field(..., description="Song theme / topic")
    language: str = Field("en", description="en, ru, or by")
    genre: str = Field("pop", description="Music genre for context")
    mood: str = Field("", description="Mood / emotion")


class LyricsResponse(BaseModel):
    lyrics: str
    language: str


# ---------- History ----------

class GenerationItem(BaseModel):
    id: int
    task_id: str
    status: str
    prompt: str
    lyrics: str
    duration: float | None
    bpm: int | None
    key_scale: str
    vocal_language: str
    audio_urls: list[str] = []
    created_at: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    items: list[GenerationItem]
    total: int
