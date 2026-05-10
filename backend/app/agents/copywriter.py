from app.agents.runner import run_agent
from app.models.schemas import CopywriterResult


async def run_copywriter_agent(
    personalization: dict,
    contact: dict,
    sender_name: str,
    sender_email: str,
    job_id: str | None = None,
) -> dict:
    context = {
        "personalization_brief": personalization,
        "contact": contact,
        "sender_name": sender_name,
        "sender_email": sender_email,
    }

    # Copywriter has no external tools — pure LLM generation
    return await run_agent(
        agent_name="copywriter",
        context=context,
        tools=None,
        tool_handlers=None,
        output_schema=CopywriterResult,
        job_id=job_id,
    )
