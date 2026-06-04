import asyncio
import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

KEEPALIVE_INTERVAL = 15  # seconds — prevents Render.com 90s timeout


class SSEManager:
    """In-memory per-job event queue for SSE streaming."""

    def __init__(self):
        self._queues: dict[str, asyncio.Queue] = {}
        self._done: set[str] = set()  # jobs that have completed

    def create_job(self, job_id: str) -> None:
        self._queues[job_id] = asyncio.Queue()
        self._done.discard(job_id)

    async def emit(
        self,
        job_id: str,
        agent: str,
        status: str,
        message: str,
        result: dict[str, Any] | None = None,
    ) -> None:
        if job_id not in self._queues:
            return

        event = {
            "agent": agent,
            "status": status,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if result is not None:
            event["result"] = result

        await self._queues[job_id].put(event)

        if status in ("complete", "error"):
            self._done.add(job_id)

    async def subscribe(self, job_id: str) -> AsyncGenerator[dict[str, str], None]:
        if job_id not in self._queues:
            yield {"data": json.dumps({"error": "Job not found"})}
            return

        # If job already completed and queue is empty, nothing to stream
        if job_id in self._done and self._queues[job_id].empty():
            yield {"data": json.dumps({"status": "error", "message": "Job already completed — reload to retry."})}
            return

        queue = self._queues[job_id]
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=KEEPALIVE_INTERVAL)
            except asyncio.TimeoutError:
                # Send keepalive ping to prevent proxy/Render timeout
                yield {"data": json.dumps({"type": "ping"})}
                continue

            yield {"data": json.dumps(event)}
            if event.get("status") in ("complete", "error"):
                break

    def cleanup(self, job_id: str) -> None:
        self._queues.pop(job_id, None)
        self._done.discard(job_id)


# Singleton
sse_manager = SSEManager()
