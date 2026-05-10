import asyncio
import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator


class SSEManager:
    """In-memory per-job event queue for SSE streaming."""

    def __init__(self):
        self._queues: dict[str, asyncio.Queue] = {}

    def create_job(self, job_id: str) -> None:
        self._queues[job_id] = asyncio.Queue()

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

    async def subscribe(self, job_id: str) -> AsyncGenerator[dict[str, str], None]:
        if job_id not in self._queues:
            yield {"data": json.dumps({"error": "Job not found"})}
            return

        queue = self._queues[job_id]
        while True:
            event = await queue.get()
            yield {"data": json.dumps(event)}
            if event.get("status") == "complete":
                break

    def cleanup(self, job_id: str) -> None:
        self._queues.pop(job_id, None)


# Singleton
sse_manager = SSEManager()
