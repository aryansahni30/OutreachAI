from typing import Any

from app.agents.runner import run_agent


WARM_PATH_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "find_warm_paths",
            "description": "Compare user background against contact and company to find shared history or common ground.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_background": {
                        "type": "string",
                        "description": "User's resume highlights, employers, schools, skills",
                    },
                    "contact_info": {
                        "type": "string",
                        "description": "Contact's name, title, company, LinkedIn",
                    },
                    "company_info": {
                        "type": "string",
                        "description": "Company details, culture, tech stack, recent news",
                    },
                },
                "required": ["user_background", "contact_info"],
            },
        },
    },
]


async def _find_warm_paths(
    user_background: str,
    contact_info: str,
    company_info: str = "",
) -> dict:
    """Pass data back for LLM to reason about connections."""
    return {
        "user_background": user_background,
        "contact_info": contact_info,
        "company_info": company_info,
        "instruction": (
            "Find shared employers, schools, communities, tech stacks, "
            "industries, or cultural alignment between the user and the "
            "contact/company. Score each connection as strong/medium/weak."
        ),
    }


TOOL_HANDLERS: dict[str, Any] = {
    "find_warm_paths": _find_warm_paths,
}


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

    return await run_agent(
        agent_name="warm_path",
        context=context,
        tools=WARM_PATH_TOOLS,
        tool_handlers=TOOL_HANDLERS,
        job_id=job_id,
    )
