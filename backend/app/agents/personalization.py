from typing import Any

from app.agents.runner import run_agent
from app.models.schemas import PersonalizationResult
from app.tools.resume import parse_resume


PERSONALIZATION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "parse_resume",
            "description": "Extract structured data from resume text — skills, experiences, projects, achievements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_text": {
                        "type": "string",
                        "description": "Raw resume text to parse",
                    },
                },
                "required": ["resume_text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "match_angles",
            "description": "Identify the strongest connection points between user background and company research.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_highlights": {
                        "type": "string",
                        "description": "Key highlights from the resume",
                    },
                    "research_findings": {
                        "type": "string",
                        "description": "Research findings about the company",
                    },
                    "contact_role": {
                        "type": "string",
                        "description": "The target contact's role/title",
                    },
                },
                "required": ["resume_highlights", "research_findings"],
            },
        },
    },
]


async def _match_angles(
    resume_highlights: str,
    research_findings: str,
    contact_role: str = "",
) -> dict:
    """Pass data back for LLM to reason about angle matching."""
    return {
        "resume_highlights": resume_highlights,
        "research_findings": research_findings,
        "contact_role": contact_role,
        "instruction": (
            "Identify 2-3 strongest angles where the user's background "
            "connects to the company's current focus. Be specific, not generic."
        ),
    }


TOOL_HANDLERS: dict[str, Any] = {
    "parse_resume": parse_resume,
    "match_angles": _match_angles,
}


async def run_personalization_agent(
    resume_text: str,
    research: dict,
    contact: dict,
    research_quality: str = "strong",
    job_id: str | None = None,
) -> dict:
    context = {
        "resume_text": resume_text[:3000],
        "research_findings": research,
        "contact": contact,
        "research_quality": research_quality,
    }

    return await run_agent(
        agent_name="personalization",
        context=context,
        tools=PERSONALIZATION_TOOLS,
        tool_handlers=TOOL_HANDLERS,
        output_schema=PersonalizationResult,
        job_id=job_id,
    )
