"""HTTP client for communicating with the ACE-Step API server."""

import httpx

from app.config import settings

# Generous timeout — music generation can take 10-60s depending on duration
TIMEOUT = httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0)


async def submit_task(params: dict) -> dict:
    """Submit a generation task to ACE-Step. Returns {task_id, status, queue_position}."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(f"{settings.acestep_url}/release_task", json=params)
        resp.raise_for_status()
        body = resp.json()
        return body.get("data", body)


async def query_task(task_ids: list[str]) -> list[dict]:
    """Query status of one or more tasks. Returns list of task result dicts."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{settings.acestep_url}/query_result",
            json={"task_id_list": task_ids},
        )
        resp.raise_for_status()
        body = resp.json()
        return body.get("data", [])


async def get_audio_stream(path: str):
    """Stream audio bytes from ACE-Step without buffering the whole file.

    Returns (response, client) — caller must close both when done.
    Uses send() with stream=True so bytes arrive incrementally.
    """
    client = httpx.AsyncClient(timeout=TIMEOUT)
    req = client.build_request("GET", f"{settings.acestep_url}/v1/audio", params={"path": path})
    resp = await client.send(req, stream=True)
    resp.raise_for_status()
    return resp, client


async def health_check() -> bool:
    """Check if ACE-Step is reachable."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(f"{settings.acestep_url}/health")
            return resp.status_code == 200
    except Exception:
        return False


async def list_models() -> list[dict]:
    """List available DiT models on the ACE-Step server."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(f"{settings.acestep_url}/v1/models")
        resp.raise_for_status()
        body = resp.json()
        data = body.get("data", {})
        return data.get("models", [])
