from typing import Any

from app.agents.runner import run_agent
from app.models.schemas import ResearchResult
from app.tools.tavily import fetch_page, search_jobs, search_news


RESEARCH_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_news",
            "description": "Search for recent news, product launches, funding rounds about a company.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company": {
                        "type": "string",
                        "description": "Company name to research",
                    },
                },
                "required": ["company"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_jobs",
            "description": "Search for open job postings to infer what the company is investing in.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company": {
                        "type": "string",
                        "description": "Company name to search jobs for",
                    },
                },
                "required": ["company"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_page",
            "description": "Fetch content from a specific URL for more detail.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL to fetch",
                    },
                },
                "required": ["url"],
            },
        },
    },
]

TOOL_HANDLERS: dict[str, Any] = {
    "search_news": search_news,
    "search_jobs": search_jobs,
    "fetch_page": fetch_page,
}


async def run_research_agent(
    company: str,
    contact_context: str = "",
    job_id: str | None = None,
) -> dict:
    context = {
        "company": company,
        "contact_context": contact_context,
    }

    return await run_agent(
        agent_name="research",
        context=context,
        tools=RESEARCH_TOOLS,
        tool_handlers=TOOL_HANDLERS,
        output_schema=ResearchResult,
        job_id=job_id,
    )
