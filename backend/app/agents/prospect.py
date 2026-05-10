import json
from typing import Any

from app.agents.runner import run_agent
from app.models.schemas import ProspectResult
from app.tools.apollo import search_apollo, verify_email


PROSPECT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_apollo",
            "description": "Search Apollo.io for contacts at a company, filtered by job titles.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company": {
                        "type": "string",
                        "description": "Company name to search",
                    },
                    "titles": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Job titles to filter by",
                    },
                },
                "required": ["company"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "verify_email",
            "description": "Verify an email address format and domain.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "description": "Email address to verify",
                    },
                },
                "required": ["email"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "rank_contacts",
            "description": "Rank contacts by relevance to the user's background and goal. Returns the input for the LLM to reason about.",
            "parameters": {
                "type": "object",
                "properties": {
                    "contacts": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "List of contacts to rank",
                    },
                    "user_background": {
                        "type": "string",
                        "description": "User's background summary",
                    },
                    "goal": {
                        "type": "string",
                        "description": "User's outreach goal",
                    },
                },
                "required": ["contacts", "user_background"],
            },
        },
    },
]


async def _rank_contacts(contacts: list[dict], user_background: str, goal: str = "") -> dict:
    """Pass contacts back for LLM to reason about ranking."""
    return {
        "contacts": contacts,
        "user_background": user_background,
        "goal": goal,
        "instruction": "Rank these contacts by relevance. Consider title, seniority, and alignment with the user's goal.",
    }


TOOL_HANDLERS: dict[str, Any] = {
    "search_apollo": search_apollo,
    "verify_email": verify_email,
    "rank_contacts": _rank_contacts,
}


async def run_prospect_agent(
    company: str,
    resume_text: str,
    goal: str = "",
    job_id: str | None = None,
) -> dict:
    context = {
        "company": company,
        "user_background": resume_text[:2000],
        "goal": goal,
    }

    return await run_agent(
        agent_name="prospect",
        context=context,
        tools=PROSPECT_TOOLS,
        tool_handlers=TOOL_HANDLERS,
        output_schema=ProspectResult,
        job_id=job_id,
    )
