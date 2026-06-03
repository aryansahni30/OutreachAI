from app.agents.runner import run_agent
from app.models.schemas import PersonalizationResult


async def run_personalization_agent(
    resume_text: str,
    research: dict,
    contact: dict,
    research_quality: str = "strong",
    job_description: str = "",
    job_id: str | None = None,
) -> dict:
    context = {
        "resume_text": resume_text[:3000],
        "research_findings": research,
        "contact": contact,
        "research_quality": research_quality,
    }
    if job_description:
        context["job_description"] = job_description[:3000]

    # Pure LLM agent — no tools needed
    return await run_agent(
        agent_name="personalization",
        context=context,
        tools=None,
        tool_handlers=None,
        output_schema=PersonalizationResult,
        job_id=job_id,
    )
