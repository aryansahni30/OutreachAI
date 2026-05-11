from app.agents.runner import run_agent


async def run_followup_agent(
    initial_email: dict,
    contact: dict,
    personalization: dict,
    job_id: str | None = None,
) -> dict:
    context = {
        "initial_email": initial_email,
        "contact": contact,
        "personalization_brief": personalization,
    }

    # Follow-up agent has no external tools — pure LLM generation
    return await run_agent(
        agent_name="followup",
        context=context,
        tools=None,
        tool_handlers=None,
        job_id=job_id,
    )
