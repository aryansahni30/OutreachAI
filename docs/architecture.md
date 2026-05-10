# Cold Reach — System Architecture

## Overview

Multi-agent email outreach system. Coordinator-specialist pattern with adaptive delegation.

**Core flow:** User input → Coordinator → Specialist agents → Structured output → UI

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| LLM | Groq API — Llama 3.3 70B | Free tier, fast inference (~500 tok/s), function calling support |
| Backend | Python 3.12 + FastAPI | Async-native, SSE support, clean API layer |
| Frontend | React 18 + TypeScript + Vite | Fast dev, type safety |
| Styling | Tailwind CSS | Rapid UI, no CSS overhead |
| Auth + DB | Supabase (PostgreSQL + Auth) | Auth out of the box, familiar from Aura |
| Streaming | SSE (Server-Sent Events) | Simpler than WebSockets for unidirectional agent progress |
| Contact Search | Apollo.io API | Contact discovery, email lookup |
| Web Research | Tavily API | Real-time search, structured results |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Input    │  │  Agent       │  │  Results      │  │
│  │  Form     │  │  Progress    │  │  Panel        │  │
│  │          │  │  Feed (SSE)  │  │  + Emails     │  │
│  └────┬─────┘  └──────▲───────┘  └───────▲───────┘  │
│       │               │                  │           │
└───────┼───────────────┼──────────────────┼───────────┘
        │ POST          │ SSE stream       │ Final JSON
        ▼               │                  │
┌─────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              API Layer (Routes)               │    │
│  │  POST /api/outreach/generate                  │    │
│  │  GET  /api/outreach/stream/{job_id}  (SSE)    │    │
│  │  GET  /api/outreach/history                   │    │
│  │  POST /api/auth/signup | /api/auth/login      │    │
│  └──────────────┬───────────────────────────────┘    │
│                 │                                     │
│  ┌──────────────▼───────────────────────────────┐    │
│  │           Orchestration Layer                 │    │
│  │                                               │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │         Coordinator Agent                │  │    │
│  │  │  - Receives user goal                    │  │    │
│  │  │  - Delegates to specialists              │  │    │
│  │  │  - Adapts on intermediate results        │  │    │
│  │  │  - Synthesizes final output              │  │    │
│  │  └────────────┬────────────────────────────┘  │    │
│  │               │ delegates                      │    │
│  │  ┌────────────▼────────────────────────────┐  │    │
│  │  │        Agent Runner                      │  │    │
│  │  │  - Executes agent with tools             │  │    │
│  │  │  - Handles tool calls (function calling) │  │    │
│  │  │  - Emits SSE events per step             │  │    │
│  │  │  - Enforces output schemas               │  │    │
│  │  └────────────┬────────────────────────────┘  │    │
│  │               │                                │    │
│  │  ┌────────┬───┴────┬──────────┬────────────┐  │    │
│  │  │Prospect│Research│Personal- │ Copywriter  │  │    │
│  │  │Agent   │Agent   │ization   │ Agent       │  │    │
│  │  │        │        │ Agent    │             │  │    │
│  │  └───┬────┘└───┬───┘└────┬────┘└─────┬─────┘  │    │
│  │      │         │         │           │         │    │
│  └──────┼─────────┼─────────┼───────────┼────────┘    │
│         │         │         │           │              │
│  ┌──────▼─────────▼─────────▼───────────▼────────┐    │
│  │              Tool Layer                        │    │
│  │  search_apollo()   search_news()               │    │
│  │  rank_contacts()   search_jobs()               │    │
│  │  verify_email()    fetch_page()                │    │
│  │  parse_resume()    match_angles()              │    │
│  │  draft_email()     check_length()              │    │
│  └───────────────────────────────────────────────┘    │
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │              Data Layer                        │    │
│  │  Supabase (PostgreSQL)                         │    │
│  │  - users, outreach_jobs, contacts, emails      │    │
│  └───────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘

External APIs:
  Apollo.io ←── Prospect Agent
  Tavily    ←── Research Agent
  Groq      ←── All agents (LLM inference)
```

---

## Project Structure

```
cold-reach/
├── docs/
│   ├── architecture.md          # this file
│   └── cold_reach_spec.md       # product spec
│
├── backend/
│   ├── pyproject.toml            # dependencies (uv/poetry)
│   ├── .env.example              # required env vars template
│   │
│   ├── app/
│   │   ├── main.py               # FastAPI app entry, CORS, lifespan
│   │   ├── config.py             # settings from env vars (pydantic-settings)
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── outreach.py   # POST /generate, GET /stream/{job_id}
│   │   │   │   ├── history.py    # GET /history
│   │   │   │   └── auth.py       # signup/login (Supabase auth)
│   │   │   └── dependencies.py   # auth middleware, rate limiting
│   │   │
│   │   ├── agents/
│   │   │   ├── coordinator.py    # coordinator agent — delegates + adapts
│   │   │   ├── prospect.py       # contact discovery agent
│   │   │   ├── research.py       # company research agent
│   │   │   ├── personalization.py# resume-to-research matching agent
│   │   │   ├── copywriter.py     # email drafting agent
│   │   │   ├── runner.py         # generic agent executor (LLM + tool loop)
│   │   │   └── prompts/
│   │   │       ├── coordinator.txt
│   │   │       ├── prospect.txt
│   │   │       ├── research.txt
│   │   │       ├── personalization.txt
│   │   │       └── copywriter.txt
│   │   │
│   │   ├── tools/
│   │   │   ├── apollo.py         # search_apollo, verify_email
│   │   │   ├── tavily.py         # search_news, search_jobs, fetch_page
│   │   │   ├── resume.py         # parse_resume (LLM-based extraction)
│   │   │   └── email.py          # draft_email, check_length
│   │   │
│   │   ├── models/
│   │   │   ├── schemas.py        # pydantic models — request/response
│   │   │   ├── agent_types.py    # agent output schemas, tool definitions
│   │   │   └── db_models.py      # SQLAlchemy / Supabase table models
│   │   │
│   │   ├── services/
│   │   │   ├── groq_client.py    # Groq API wrapper — chat completions + tools
│   │   │   ├── sse_manager.py    # SSE event emitter — per-job event queue
│   │   │   └── supabase_client.py# Supabase client singleton
│   │   │
│   │   └── utils/
│   │       ├── text.py           # text processing helpers
│   │       └── errors.py         # custom exceptions
│   │
│   └── tests/
│       ├── test_agents/
│       ├── test_tools/
│       └── test_api/
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── InputForm.tsx       # company + resume + goal input
│       │   ├── AgentFeed.tsx       # real-time SSE progress feed
│       │   ├── ResultsPanel.tsx    # contact card + research + emails
│       │   ├── EmailCard.tsx       # single email draft with copy button
│       │   ├── ContactCard.tsx     # prospect info display
│       │   └── Layout.tsx          # shell, nav
│       │
│       ├── hooks/
│       │   ├── useOutreach.ts      # trigger generation, manage state
│       │   └── useSSE.ts           # SSE connection, event parsing
│       │
│       ├── services/
│       │   └── api.ts              # fetch wrappers for backend
│       │
│       ├── types/
│       │   └── index.ts            # shared TypeScript types
│       │
│       └── lib/
│           └── supabase.ts         # Supabase client (auth)
│
└── seed/
    └── demo_contacts.json          # fallback contacts for demo mode
```

---

## Agent Execution Model

### Agent Runner (core abstraction)

Every specialist agent runs through the same executor:

```python
async def run_agent(
    agent_name: str,
    system_prompt: str,
    tools: list[ToolDef],
    context: dict,
    output_schema: type[BaseModel],
    event_emitter: SSEManager,
) -> BaseModel:
    """
    1. Call Groq with system prompt + context + tools
    2. If response contains tool_calls → execute tools, append results
    3. Loop until LLM returns final response (no more tool calls)
    4. Validate against output_schema
    5. Emit SSE events at each step
    """
```

This is a **ReAct loop**: the LLM reasons, calls a tool, observes the result, reasons again, until it has enough to produce the final structured output.

### Coordinator Flow (per request)

```python
async def run_outreach(user_input: OutreachRequest, emitter: SSEManager):
    # Step 1: Prospect
    emitter.emit("coordinator", "Analyzing goal, delegating to Prospect Agent...")
    contacts = await run_agent("prospect", ..., context={"company": user_input.company, ...})

    # Step 2: Coordinator decision point
    if not contacts.results:
        emitter.emit("coordinator", "No contacts found. Using demo contacts.")
        contacts = load_demo_contacts(user_input.company)

    top_contact = contacts.results[0]
    emitter.emit("coordinator", f"Top contact: {top_contact.name} ({top_contact.title})")

    # Step 3: Research
    emitter.emit("coordinator", "Delegating to Research Agent...")
    research = await run_agent("research", ..., context={"company": user_input.company, "contact": top_contact})

    research_quality = "strong" if len(research.findings) >= 2 else "weak"

    # Step 4: Personalization
    emitter.emit("coordinator", "Delegating to Personalization Agent...")
    personalization = await run_agent("personalization", ..., context={
        "resume": user_input.resume,
        "research": research,
        "contact": top_contact,
        "research_quality": research_quality,
    })

    # Step 5: Copywriter
    emitter.emit("coordinator", "Delegating to Copywriter Agent...")
    emails = await run_agent("copywriter", ..., context={
        "brief": personalization,
        "contact": top_contact,
        "sender": user_input.sender_info,
    })

    # Step 6: Return complete result
    return OutreachResult(
        contact=top_contact,
        research=research,
        personalization=personalization,
        emails=emails,
    )
```

### Why NOT parallel Research + Personalization?

Personalization needs research findings as input. Sequential is correct here.

What CAN overlap: **Research news + Research job postings** — these are independent tool calls within the Research Agent. Groq supports parallel tool calls, so the Research Agent can fire both searches simultaneously.

---

## API Design

### POST /api/outreach/generate

Starts an outreach job. Returns job ID immediately. Results stream via SSE.

```json
// Request
{
  "company": "Salesforce",
  "resume_text": "...",       // or resume_file (multipart)
  "goal": "Applying for ML Engineer role",
  "sender_name": "Aryan Sahni",
  "sender_email": "aryan@example.com"
}

// Response (immediate)
{
  "job_id": "uuid-here",
  "status": "started"
}
```

### GET /api/outreach/stream/{job_id}

SSE endpoint. Frontend connects after receiving job_id.

```
event: agent_status
data: {"agent": "prospect", "status": "searching", "message": "Searching Apollo for contacts at Salesforce..."}

event: agent_status
data: {"agent": "prospect", "status": "complete", "message": "Found 3 contacts. Top: VP of AI Platform"}

event: agent_result
data: {"agent": "prospect", "result": {"contacts": [...]}}

event: agent_status
data: {"agent": "research", "status": "searching", "message": "Fetching recent news..."}

... (continues for each agent)

event: complete
data: {"result": { full OutreachResult JSON }}
```

### GET /api/outreach/history

Returns past outreach jobs for authenticated user.

---

## Database Schema (Supabase)

```sql
-- Users managed by Supabase Auth (auth.users)

CREATE TABLE outreach_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company TEXT NOT NULL,
    goal TEXT,
    resume_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
    result JSONB,                            -- full OutreachResult
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES outreach_jobs(id),
    user_id UUID REFERENCES auth.users(id),
    tone TEXT NOT NULL,                      -- casual | professional | concise
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_jobs_user ON outreach_jobs(user_id, created_at DESC);
CREATE INDEX idx_emails_job ON saved_emails(job_id);
```

---

## SSE Manager Design

```python
class SSEManager:
    """Per-job event queue. Frontend subscribes by job_id."""

    def __init__(self):
        self._queues: dict[str, asyncio.Queue] = {}

    def create_job(self, job_id: str) -> None:
        self._queues[job_id] = asyncio.Queue()

    async def emit(self, job_id: str, agent: str, status: str, message: str, result: dict | None = None) -> None:
        event = {
            "agent": agent,
            "status": status,
            "message": message,
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self._queues[job_id].put(event)

    async def subscribe(self, job_id: str) -> AsyncGenerator[dict, None]:
        queue = self._queues[job_id]
        while True:
            event = await queue.get()
            yield event
            if event.get("status") == "complete":
                break

    def cleanup(self, job_id: str) -> None:
        self._queues.pop(job_id, None)
```

In-memory. Fine for single-server v1. Move to Redis pub/sub if you scale.

---

## Groq Client Design

```python
class GroqClient:
    """Wrapper around Groq API with tool-calling loop."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model

    async def chat_with_tools(
        self,
        system_prompt: str,
        messages: list[dict],
        tools: list[dict],          # Groq function definitions
        max_iterations: int = 5,    # safety cap on tool-call loops
    ) -> dict:
        """
        ReAct loop:
        1. Send messages + tools to Groq
        2. If response has tool_calls → execute, append results, loop
        3. If response has content (no tool_calls) → return final response
        4. Cap iterations to prevent runaway
        """
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM provider | Groq (Llama 3.3 70B) | Free, fast, function calling support |
| Coordinator pattern | Fresh call per delegation | Avoids growing context. Summary of prior results passed in (~200 tokens) |
| Agent state | In-memory (SSEManager) | Simple. No Redis needed for single-server v1 |
| Resume parsing | LLM-based (Groq call) | More flexible than regex. Handles any format |
| Output validation | Pydantic schemas | Each agent has typed output. Coordinator can trust structure |
| Streaming | SSE, not WebSocket | Unidirectional (server → client). Simpler, auto-reconnect built in |
| Auth | Supabase Auth | JWT-based, handles signup/login/session out of box |
| Demo fallback | Local JSON seed file | Guarantees demo works even if Apollo/Tavily are down |

---

## Groq Rate Limits (Free Tier)

| Limit | Value |
|-------|-------|
| Requests/min | 30 |
| Tokens/min | 20,000 |
| Tokens/day | 131,072 |

One full outreach run ≈ 5-6 Groq calls ≈ ~8,000-12,000 tokens total.
Free tier supports ~10-15 full runs/day. Enough for development + demo.

---

## Build Phases

### Phase 1: Core Agent Loop (backend only)
- Groq client with tool-calling loop
- Agent runner abstraction
- All 4 specialist agents + coordinator
- CLI test: run full outreach from terminal

### Phase 2: API + SSE
- FastAPI routes (generate, stream)
- SSE manager
- Job lifecycle (create → run → stream → complete)

### Phase 3: Frontend
- Input form (company, resume, goal)
- SSE hook + agent progress feed
- Results panel with email cards

### Phase 4: Auth + Persistence
- Supabase auth integration
- Save outreach jobs to DB
- History page

### Phase 5: Polish + Demo
- Demo mode with seeded data
- Error handling + loading states
- Mobile responsive
- Deploy (Vercel frontend, Railway/Fly backend)
