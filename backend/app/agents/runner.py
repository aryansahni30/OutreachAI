import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from app.services.groq_client import chat_with_tools
from app.services.sse_manager import sse_manager

PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(agent_name: str) -> str:
    prompt_file = PROMPTS_DIR / f"{agent_name}.txt"
    return prompt_file.read_text()


# All agents use Llama 4 Scout — best free tier limits on Groq
DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


async def run_agent(
    agent_name: str,
    context: dict[str, Any],
    tools: list[dict[str, Any]] | None = None,
    tool_handlers: dict[str, Any] | None = None,
    output_schema: type[BaseModel] | None = None,
    job_id: str | None = None,
) -> dict[str, Any]:
    """
    Execute a specialist agent through the Groq ReAct loop.

    1. Load agent's system prompt
    2. Build context message
    3. Run Groq with tools until final response
    4. Emit SSE events at each stage
    5. Parse and validate output
    """
    system_prompt = load_prompt(agent_name)

    # Add output schema instruction to system prompt
    if output_schema:
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        system_prompt += (
            "\n\nIMPORTANT: When you have gathered enough information and are ready to give your final answer, "
            "DO NOT call any more tools. Instead, respond with a plain text message containing ONLY valid JSON "
            f"matching this schema:\n```json\n{schema_json}\n```\n"
            "Return ONLY the JSON object as your message content, no other text. Do NOT use a tool call for your final response."
        )

    # Build user message with context
    context_str = json.dumps(context, indent=2, default=str)
    messages = [{"role": "user", "content": f"Here is the context for this task:\n{context_str}"}]

    # Emit starting event
    if job_id:
        await sse_manager.emit(
            job_id=job_id,
            agent=agent_name,
            status="running",
            message=f"{agent_name.title()} Agent starting...",
        )

    # Run the ReAct loop
    response_text = await chat_with_tools(
        system_prompt=system_prompt,
        messages=messages,
        tools=tools,
        tool_handlers=tool_handlers,
        model=DEFAULT_MODEL,
    )

    # Parse response as JSON
    result = _parse_json_response(response_text)

    # Validate against schema if provided
    if output_schema:
        try:
            validated = output_schema.model_validate(result)
            result = validated.model_dump()
        except Exception:
            # If validation fails, return raw result
            pass

    # Emit completion event
    if job_id:
        await sse_manager.emit(
            job_id=job_id,
            agent=agent_name,
            status="done",
            message=f"{agent_name.title()} Agent complete.",
            result=result,
        )

    return result


def _parse_json_response(text: str) -> dict[str, Any]:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from code block
    if "```" in text:
        start = text.find("```")
        end = text.rfind("```")
        if start != end:
            block = text[start:end]
            # Remove ```json or ``` prefix
            first_newline = block.find("\n")
            if first_newline != -1:
                block = block[first_newline + 1:]
            try:
                return json.loads(block.strip())
            except json.JSONDecodeError:
                pass

    # Try finding first { to last }
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1:
        try:
            return json.loads(text[brace_start : brace_end + 1])
        except json.JSONDecodeError:
            pass

    return {"raw_response": text}
