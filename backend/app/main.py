"""FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import music, lyrics, history
from app.services import acestep_client, ollama_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Pull Ollama model in background (non-blocking)."""
    await init_db()

    # Pull the lyrics model in the background — don't block startup
    asyncio.create_task(ollama_client.ensure_model_pulled())

    yield


app = FastAPI(
    title="ACE-Step Music Generator",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow requests from the frontend dev server and Docker frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route groups
app.include_router(music.router)
app.include_router(lyrics.router)
app.include_router(history.router)


@app.get("/api/health")
async def health():
    """Overall health check — pings both downstream services."""
    ace_ok = await acestep_client.health_check()
    ollama_ok = await ollama_client.health_check()
    return {
        "status": "ok" if (ace_ok and ollama_ok) else "degraded",
        "acestep": ace_ok,
        "ollama": ollama_ok,
    }
