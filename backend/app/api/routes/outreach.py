import asyncio
import uuid

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.agents.coordinator import run_outreach
from app.models.schemas import JobCreatedResponse, OutreachRequest
from app.services.sse_manager import sse_manager

router = APIRouter(prefix="/api/outreach", tags=["outreach"])

# In-memory job results (v1 — move to Supabase in Phase 4)
_job_results: dict[str, dict] = {}


@router.post("/generate", response_model=JobCreatedResponse)
async def generate_outreach(request: OutreachRequest):
    job_id = str(uuid.uuid4())
    sse_manager.create_job(job_id)

    # Run orchestration in background task
    asyncio.create_task(_run_job(job_id, request))

    return JobCreatedResponse(job_id=job_id, status="started")


async def _run_job(job_id: str, request: OutreachRequest):
    try:
        result = await run_outreach(
            company=request.company,
            resume_text=request.resume_text,
            goal=request.goal,
            sender_name=request.sender_name,
            sender_email=request.sender_email,
            job_id=job_id,
            linkedin_connections=request.linkedin_connections,
            job_description=request.job_description,
        )
        _job_results[job_id] = result.model_dump()
    except Exception as e:
        import traceback
        traceback.print_exc()
        await sse_manager.emit(
            job_id=job_id,
            agent="coordinator",
            status="complete",
            message=f"Error: {str(e)}",
        )


@router.get("/stream/{job_id}")
async def stream_outreach(job_id: str):
    if job_id not in sse_manager._queues:
        raise HTTPException(status_code=404, detail="Job not found")

    return EventSourceResponse(sse_manager.subscribe(job_id))


@router.get("/result/{job_id}")
async def get_result(job_id: str):
    if job_id not in _job_results:
        raise HTTPException(status_code=404, detail="Result not ready or job not found")
    return _job_results[job_id]
