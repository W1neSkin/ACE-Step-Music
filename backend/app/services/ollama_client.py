"""HTTP client for Ollama — used for song lyrics generation."""

import httpx

from app.config import settings

TIMEOUT = httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0)

# Language name mapping for the prompt
_LANG_NAMES = {
    "en": "English",
    "ru": "Russian",
    "by": "Belarusian",
}

# System prompt that turns Qwen into a lyrics writer
_SYSTEM_PROMPT = (
    "You are a professional songwriter and lyricist. "
    "You write creative, emotional, and well-structured song lyrics. "
    "Always format lyrics with section tags like [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]. "
    "Output ONLY the lyrics — no explanations, no comments."
)


def _build_user_prompt(theme: str, language: str, genre: str, mood: str) -> str:
    """Build the user prompt for lyrics generation."""
    lang_name = _LANG_NAMES.get(language, language)
    parts = [f"Write song lyrics in {lang_name}."]
    parts.append(f"Theme: {theme}")
    if genre:
        parts.append(f"Genre: {genre}")
    if mood:
        parts.append(f"Mood: {mood}")
    return "\n".join(parts)


async def generate_lyrics(theme: str, language: str, genre: str, mood: str) -> str:
    """Generate song lyrics via Ollama chat endpoint.

    Returns the generated lyrics text.
    """
    user_prompt = _build_user_prompt(theme, language, genre, mood)

    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": 0.9,
            "top_p": 0.95,
        },
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(f"{settings.ollama_url}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


async def ensure_model_pulled() -> bool:
    """Pull the lyrics model if it's not already downloaded. Returns True on success."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(connect=10, read=600, write=10, pool=10)) as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/pull",
                json={"name": settings.ollama_model, "stream": False},
            )
            return resp.status_code == 200
    except Exception:
        return False


async def is_model_ready() -> bool:
    """Check whether the configured lyrics model is downloaded and available."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(f"{settings.ollama_url}/api/tags")
            if resp.status_code != 200:
                return False
            models = resp.json().get("models", [])
            return any(settings.ollama_model in m.get("name", "") for m in models)
    except Exception:
        return False


async def health_check() -> bool:
    """Check if Ollama is reachable."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(f"{settings.ollama_url}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False
