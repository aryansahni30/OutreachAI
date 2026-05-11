from app.agents.runner import run_agent


async def run_scorer_agent(
    emails: list[dict],
    contact: dict,
    personalization: dict,
    job_id: str | None = None,
) -> dict:
    context = {
        "emails": emails,
        "contact": contact,
        "personalization_brief": personalization,
    }

    # Scorer has no external tools — pure LLM evaluation
    return await run_agent(
        agent_name="scorer",
        context=context,
        tools=None,
        tool_handlers=None,
        job_id=job_id,
    )
