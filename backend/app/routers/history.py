"""History endpoints — CRUD for past generations."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Generation
from app.schemas import GenerationItem, HistoryResponse

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=HistoryResponse)
async def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated list of past generations, newest first."""
    offset = (page - 1) * page_size

    total_q = await db.execute(select(func.count(Generation.id)))
    total = total_q.scalar() or 0

    rows_q = await db.execute(
        select(Generation).order_by(desc(Generation.created_at)).offset(offset).limit(page_size)
    )
    rows = rows_q.scalars().all()

    items = [
        GenerationItem(
            id=g.id,
            task_id=g.task_id,
            status=g.status,
            prompt=g.prompt,
            lyrics=g.lyrics,
            duration=g.duration,
            bpm=g.bpm,
            key_scale=g.key_scale,
            vocal_language=g.vocal_language,
            audio_urls=g.audio_paths or [],
            created_at=g.created_at,
            completed_at=g.completed_at,
        )
        for g in rows
    ]

    return HistoryResponse(items=items, total=total)


@router.get("/{gen_id}", response_model=GenerationItem)
async def get_generation(gen_id: int, db: AsyncSession = Depends(get_db)):
    """Get details of a single generation."""
    result = await db.execute(select(Generation).where(Generation.id == gen_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    return GenerationItem(
        id=gen.id,
        task_id=gen.task_id,
        status=gen.status,
        prompt=gen.prompt,
        lyrics=gen.lyrics,
        duration=gen.duration,
        bpm=gen.bpm,
        key_scale=gen.key_scale,
        vocal_language=gen.vocal_language,
        audio_urls=gen.audio_paths or [],
        created_at=gen.created_at,
        completed_at=gen.completed_at,
    )


@router.delete("/{gen_id}")
async def delete_generation(gen_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a generation record."""
    result = await db.execute(select(Generation).where(Generation.id == gen_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    await db.delete(gen)
    await db.commit()
    return {"ok": True}
