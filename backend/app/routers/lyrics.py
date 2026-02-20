"""Lyrics generation endpoints — proxy to Ollama."""

from fastapi import APIRouter, HTTPException

from app.schemas import LyricsRequest, LyricsResponse
from app.services import ollama_client

router = APIRouter(prefix="/api/lyrics", tags=["lyrics"])


@router.post("/generate", response_model=LyricsResponse)
async def generate_lyrics(req: LyricsRequest):
    """Generate song lyrics using Ollama + Qwen2.5."""
    # Quick guard: tell the user if the model hasn't finished downloading yet
    if not await ollama_client.is_model_ready():
        raise HTTPException(
            status_code=503,
            detail="Lyrics model is still loading. Please wait a minute and try again.",
        )

    try:
        text = await ollama_client.generate_lyrics(
            theme=req.theme,
            language=req.language,
            genre=req.genre,
            mood=req.mood,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama unavailable: {e}")

    if not text:
        raise HTTPException(status_code=500, detail="Empty response from Ollama")

    return LyricsResponse(lyrics=text.strip(), language=req.language)
