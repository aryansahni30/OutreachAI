# Cold Reach — Multi-Agent Email Outreach System

## What We're Building

Cold Reach is a multi-agent AI system that automates personalized cold email outreach. The user inputs a target company and their own background (resume + projects), and a team of specialized AI agents autonomously finds the right contact, researches the company, identifies the strongest personal angles, and drafts three versions of an outreach email (casual, professional, concise).

The key architectural distinction: this is **not a pipeline**. It's a coordinator-specialist multi-agent system where a supervisor agent reasons about the goal, delegates to specialists, observes their outputs, and adapts its strategy based on intermediate results — the same pattern used in Salesforce's Agentforce platform.

---

## The Problem It Solves

Cold outreach is broken for developers and founders. Generic templates get ignored. Personalizing manually takes 30-45 minutes per email — finding the right person, reading their recent news, matching your background to their needs, writing something that doesn't sound like everyone else's email. Cold Reach compresses this to under 60 seconds while producing emails that feel handcrafted.

**Personal angle:** Built this because I was doing this exact process manually while job hunting and fundraising for my startup (Aura) through the Antler program. I needed to reach out to dozens of companies and investors. The pain was real.

---

## Multi-Agent Architecture

### The Coordinator Agent
The brain of the system. Receives the user's goal, breaks it into subtasks, delegates to specialists in the right sequence, and adapts based on what comes back.

**Responsibilities:**
- Parse the user's intent ("reach out to Salesforce about my AI background")
- Decide delegation order (always prospect first, but research and personalization can sometimes run in parallel)
- Handle failures gracefully — if Research Agent finds nothing useful, instruct Copywriter to lean harder on resume angle
- Synthesize final output and present to user

**Key behavior:** If the Prospect Agent returns multiple contacts, the Coordinator ranks them by relevance to the user's background before passing to the next agent. It doesn't just blindly pass everything downstream.

---

### Specialist Agents

#### 1. Prospect Agent
**Goal:** Find the most relevant contact at the target company for this specific user.

**Tools:**
- `search_apollo(company, titles)` — queries Apollo.io API for contacts by company + relevant job titles
- `rank_contacts(contacts, user_background)` — LLM scores each contact's relevance to the user's background and goal
- `verify_email(email)` — basic format + domain verification

**Output:** Top 1-3 ranked contacts with name, title, email, LinkedIn URL, and a relevance score with reasoning.

---

#### 2. Research Agent
**Goal:** Find recent, specific, relevant information about the target company that can be referenced in the email.

**Tools:**
- `search_news(company)` — Tavily or Exa API, finds recent news, blog posts, product launches, funding rounds
- `search_job_postings(company)` — infers what the company is investing in based on open roles
- `fetch_page(url)` — fetches and summarizes specific URLs if needed

**Output:** 3-5 research findings ranked by recency and relevance, each with a suggested email hook ("They just launched X, you could reference your experience with Y").

**Fallback:** If nothing recent found, returns company description + known products. Coordinator is notified so Copywriter leans on resume angle instead.

---

#### 3. Personalization Agent
**Goal:** Match the user's strongest angles to what the Research Agent found.

**Tools:**
- `parse_resume(resume_text)` — extracts key skills, experiences, projects, and achievements
- `match_angles(resume_data, research_findings, contact_role)` — identifies the 2-3 strongest connection points between the user's background and the company's current focus

**Output:** A personalization brief — the specific angles to lead with, in priority order, with reasoning for each. This brief is passed directly to the Copywriter Agent.

**Example output:**
```
Angle 1: Your pgvector + semantic memory work at Aura maps to their AI search investment (they just posted 3 ML engineer roles)
Angle 2: Your Snowflake internship is directly relevant — they're a Snowflake partner
Angle 3: Your 72-hour build sprint story fits their "builder mindset" hiring push
```

---

#### 4. Copywriter Agent
**Goal:** Draft three versions of the outreach email using the personalization brief.

**Tools:**
- `draft_email(brief, tone, contact, sender)` — generates email for a specific tone
- `check_length(email)` — enforces length constraints per tone

**Tones:**
- **Casual** — conversational, short, feels like a message from a peer. Max 100 words.
- **Professional** — structured, formal, clear value prop. Max 150 words.
- **Concise** — 3 sentences max. Hook, value, ask. Max 50 words.

**Output:** Three complete emails with subject lines, ready to send or copy.

---

## Data Flow

```
User Input
  → company name
  → resume (PDF or text paste)
  → goal/context (optional: "applying for X role" or "looking for advisors")

Coordinator Agent
  ↓ delegates
  Prospect Agent → finds + ranks contacts
  ↓ returns top contacts
  Coordinator decides: proceed with top contact, pass to Research

  Research Agent → fetches news, job postings, signals
  ↓ returns findings + hooks
  Coordinator evaluates quality → flags if weak

  Personalization Agent → matches resume to research findings
  ↓ returns personalization brief
  Coordinator reviews brief → passes to Copywriter

  Copywriter Agent → drafts 3 tones
  ↓ returns emails
  Coordinator synthesizes → presents to user

User Output
  → contact card (name, title, email, LinkedIn)
  → research summary (what the agent found)
  → personalization rationale (why these angles)
  → 3 email drafts with subject lines
  → one-click copy per email
```

---

## Tech Stack

### Backend
- **Python + FastAPI** — API server
- **Claude API (claude-sonnet-4-5)** — all agent reasoning and drafting, using function-calling for tool invocation
- **Apollo.io API** — contact search (free tier: 50 credits/month)
- **Tavily API or Exa API** — real-time web search for company research (both have free tiers)
- **PostgreSQL** — store outreach history, user profiles, past emails
- **SSE (Server-Sent Events)** — stream agent progress to frontend in real time

### Frontend
- **React + TypeScript** — main UI
- **Tailwind CSS** — styling
- **Real-time agent progress feed** — user watches each agent's status as it works (Prospect Agent: searching... → found 3 contacts → Research Agent: fetching news...)

### Auth + Storage
- **Supabase** — auth + DB (you already know this from Aura)

---

## Key Implementation Details

### Agent Orchestration Pattern
Each agent is a Claude API call with:
1. A specific system prompt defining its role and constraints
2. A set of tools (function definitions) it can call
3. A structured output schema it must return

The Coordinator is a Claude call that receives the user goal + all previous agent outputs and returns:
```json
{
  "next_action": "delegate_to_research",
  "reasoning": "Prospect agent returned 2 strong contacts. Passing top contact to research.",
  "context_for_next_agent": "Focus on AI/ML initiatives — contact is VP of Engineering"
}
```

This is a **ReAct pattern** (Reason + Act) — the Coordinator reasons about what it knows, then decides what action to take next.

### Handling Agent Failures
- If Apollo returns no contacts → seed from a mock DB for demo, flag to user
- If Research Agent finds nothing recent → Coordinator instructs Copywriter to use resume-only angle
- If Copywriter draft is too long → automatic retry with explicit length constraint

### Streaming Agent Progress
Use SSE to stream each agent's status to the frontend as it happens:
```
[Coordinator] Analyzing your goal...
[Prospect Agent] Searching Apollo for contacts at Salesforce...
[Prospect Agent] Found 4 contacts. Ranking by relevance...
[Research Agent] Fetching recent news about Salesforce...
[Research Agent] Found 3 strong signals. Identifying hooks...
[Personalization Agent] Matching your background to research findings...
[Copywriter Agent] Drafting 3 email versions...
[Complete] Here are your emails.
```

This is a core UX feature — watching the agents work in real time is the demo moment.

---

## The Demo Flow (Builder Lab)

1. Paste "Salesforce" as target company
2. Upload resume (or use pre-loaded demo resume)
3. Hit "Find & Reach Out"
4. Watch the agent progress feed stream in real time — 4 agents working
5. See the contact card appear (real Apollo result or seeded demo contact)
6. See the research findings — "Salesforce just launched Agentforce for Fortune 500s"
7. See the personalization brief — "Your Aura agentic pipeline maps to their Agentforce architecture"
8. See 3 email drafts appear with subject lines
9. One-click copy any version

Total demo time: ~45 seconds. Zero explanation needed — the UI tells the story.

---

## Resume Bullet (After Building)

```
Cold Reach — Multi-Agent Email Outreach System
React • TypeScript • FastAPI • Claude API • Apollo.io • Tavily • PostgreSQL • SSE

• Architected a coordinator-specialist multi-agent system — Prospect, Research, Personalization,
  and Copywriter agents orchestrated by a ReAct-pattern supervisor that adapts delegation strategy
  based on intermediate results, not a fixed pipeline.

• Built real-time agent observability layer using SSE — users watch each agent reason and act
  as it happens, streaming tool calls and decisions to a live frontend progress feed.

• Integrated Apollo.io and Tavily APIs as discrete agent tools, enabling autonomous contact
  discovery and real-time company research within a single unified outreach workflow.
```

---

## Questions to Brainstorm With Claude Code

When you open this in Claude Code, start with these:

1. **Architecture:** Should the Coordinator be a single long-running Claude call with the full conversation history, or should each delegation be a fresh call with summarized context passed in? What are the tradeoffs?

2. **Parallelism:** Can Research and Personalization agents run in parallel once the Prospect Agent returns? How do we handle this in FastAPI — asyncio gather?

3. **State management:** How do we persist agent state across the SSE stream? Should we use a job queue (Redis/BullMQ) or keep it in-memory for simplicity?

4. **Apollo fallback:** Best way to seed a realistic mock contact database for demo reliability?

5. **Frontend:** Should agent progress be a sidebar or the main view? How do we transition from "agents working" to "here are your results" without a jarring UI shift?
