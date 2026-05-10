import json
from typing import Any

from groq import AsyncGroq

from app.config import settings

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def chat_with_tools(
    system_prompt: str,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    tool_handlers: dict[str, Any] | None = None,
    model: str = "llama-3.3-70b-versatile",
    max_iterations: int = 5,
    temperature: float = 0.7,
) -> str:
    """
    ReAct loop: call Groq, execute tool calls, loop until final text response.

    Args:
        system_prompt: Agent system prompt
        messages: Conversation messages
        tools: Groq function definitions
        tool_handlers: Map of function_name -> async callable
        model: Groq model ID
        max_iterations: Safety cap on tool-call loops
        temperature: LLM temperature

    Returns:
        Final text response from LLM
    """
    client = get_groq_client()
    all_messages = [{"role": "system", "content": system_prompt}, *messages]

    for _ in range(max_iterations):
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": all_messages,
            "temperature": temperature,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await client.chat.completions.create(**kwargs)
        message = response.choices[0].message

        # No tool calls — final response
        if not message.tool_calls:
            return message.content or ""

        # Process tool calls — serialize only fields Groq accepts
        assistant_msg: dict[str, Any] = {
            "role": "assistant",
            "content": message.content or "",
        }
        if message.tool_calls:
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in message.tool_calls
            ]
        all_messages.append(assistant_msg)

        for tool_call in message.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)

            if tool_handlers and fn_name in tool_handlers:
                result = await tool_handlers[fn_name](**fn_args)
            else:
                result = {"error": f"Unknown tool: {fn_name}"}

            all_messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result) if isinstance(result, dict) else str(result),
            })

    return "Max tool iterations reached."
