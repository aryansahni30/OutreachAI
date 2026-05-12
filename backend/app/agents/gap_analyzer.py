from app.agents.runner import run_agent


async def run_gap_analyzer(
    resume_text: str,
    research: dict,
    job_id: str | None = None,
) -> dict:
    context = {
        "resume_text": resume_text[:3000],
        "research_findings": research.get("findings", []),
        "company_summary": research.get("company_summary", ""),
    }

    # Pure LLM agent — no tools needed
    return await run_agent(
        agent_name="gap_analyzer",
        context=context,
        tools=None,
        tool_handlers=None,
        job_id=job_id,
    )
