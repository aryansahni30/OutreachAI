from typing import Any

from app.agents.runner import run_agent


GAP_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "analyze_gaps",
            "description": "Compare resume skills against job postings and company needs to identify gaps and strengths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_skills": {
                        "type": "string",
                        "description": "Key skills and experiences from the resume",
                    },
                    "company_needs": {
                        "type": "string",
                        "description": "Skills and roles the company is hiring for",
                    },
                },
                "required": ["resume_skills", "company_needs"],
            },
        },
    },
]


async def _analyze_gaps(resume_skills: str, company_needs: str) -> dict:
    """Pass data back for LLM to reason about gaps."""
    return {
        "resume_skills": resume_skills,
        "company_needs": company_needs,
        "instruction": (
            "Identify skill gaps (what they want but user lacks), "
            "strengths (what user has that matches), and "
            "reframing strategies for each gap."
        ),
    }


TOOL_HANDLERS: dict[str, Any] = {
    "analyze_gaps": _analyze_gaps,
}


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

    return await run_agent(
        agent_name="gap_analyzer",
        context=context,
        tools=GAP_TOOLS,
        tool_handlers=TOOL_HANDLERS,
        job_id=job_id,
    )
