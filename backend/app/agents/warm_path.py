from app.agents.runner import run_agent


async def run_warm_path_finder(
    resume_text: str,
    contact: dict,
    research: dict,
    job_id: str | None = None,
) -> dict:
    context = {
        "resume_text": resume_text[:3000],
        "contact": contact,
        "company_research": research,
    }

    # Pure LLM agent — no tools needed
    return await run_agent(
        agent_name="warm_path",
        context=context,
        tools=None,
        tool_handlers=None,
        job_id=job_id,
    )
