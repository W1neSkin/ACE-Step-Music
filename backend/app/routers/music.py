"""Music generation endpoints — proxy to ACE-Step API."""

import json
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Generation
from app.schemas import MusicGenerateRequest, MusicGenerateResponse, TaskStatusResponse
from app.services import acestep_client

router = APIRouter(prefix="/api/music", tags=["music"])


@router.post("/generate", response_model=MusicGenerateResponse)
async def generate_music(req: MusicGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Submit a music generation task to ACE-Step and store it in DB."""
    payload = {
        "prompt": req.prompt,
        "lyrics": req.lyrics,
        "audio_duration": req.duration,
        "bpm": req.bpm,
        "key_scale": req.key_scale,
        "time_signature": req.time_signature,
        "vocal_language": req.vocal_language,
        "thinking": req.thinking,
        "batch_size": req.batch_size,
        "inference_steps": req.inference_steps,
    }
    # Remove None values so ACE-Step uses its own defaults
    payload = {k: v for k, v in payload.items() if v is not None and v != ""}

    try:
        result = await acestep_client.submit_task(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ACE-Step unavailable: {e}")

    task_id = result.get("task_id", "")

    gen = Generation(
        task_id=task_id,
        status="queued",
        prompt=req.prompt,
        lyrics=req.lyrics,
        duration=req.duration,
        bpm=req.bpm,
        key_scale=req.key_scale,
        vocal_language=req.vocal_language,
        batch_size=req.batch_size,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    return MusicGenerateResponse(id=gen.id, task_id=task_id, status="queued")


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str, db: AsyncSession = Depends(get_db)):
    """Poll the status of a generation task."""
    results = await acestep_client.query_task([task_id])

    if not results:
        raise HTTPException(status_code=404, detail="Task not found")

    task = results[0]
    status_code = task.get("status", 0)
    status_map = {0: "running", 1: "succeeded", 2: "failed"}
    status = status_map.get(status_code, "running")

    audio_urls: list[str] = []
    meta = None

    # Parse the result JSON string when task succeeded
    if status == "succeeded" and task.get("result"):
        try:
            result_list = json.loads(task["result"]) if isinstance(task["result"], str) else task["result"]
            for item in result_list:
                file_path = item.get("file", "")
                if file_path:
                    # ACE-Step returns a relative URL like "/v1/audio?path=/app/.cache/.../x.mp3".
                    # Extract just the real filesystem path so our proxy can fetch it cleanly.
                    parsed = urlparse(file_path)
                    actual_path = parse_qs(parsed.query).get("path", [file_path])[0]
                    # No "/api" prefix — frontend audioUrl() adds it
                    audio_urls.append(f"/music/audio?path={actual_path}")
                meta = item.get("metas")
        except (json.JSONDecodeError, TypeError):
            pass

    # Update DB record
    stmt = select(Generation).where(Generation.task_id == task_id)
    result_row = await db.execute(stmt)
    gen = result_row.scalar_one_or_none()
    if gen:
        gen.status = status
        if audio_urls:
            gen.audio_paths = audio_urls
        if meta:
            gen.generation_meta = meta
        if status in ("succeeded", "failed"):
            gen.completed_at = datetime.now(timezone.utc)
        await db.commit()

    return TaskStatusResponse(
        task_id=task_id,
        status=status,
        audio_urls=audio_urls,
        generation_meta=meta,
    )


@router.get("/audio")
async def proxy_audio(path: str):
    """Proxy audio download from ACE-Step to the frontend."""
    try:
        resp, client = await acestep_client.get_audio_stream(path)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Audio fetch failed: {e}")

    content_type = resp.headers.get("content-type", "audio/mpeg")

    async def stream():
        try:
            async for chunk in resp.aiter_bytes(chunk_size=8192):
                yield chunk
        finally:
            await resp.aclose()
            await client.aclose()

    return StreamingResponse(stream(), media_type=content_type)


@router.get("/models")
async def list_models():
    """List available ACE-Step models."""
    try:
        models = await acestep_client.list_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
