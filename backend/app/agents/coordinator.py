import asyncio
import csv
import io
import json
import traceback
from pathlib import Path

from app.agents.copywriter import run_copywriter_agent
from app.agents.followup import run_followup_agent
from app.agents.gap_analyzer import run_gap_analyzer
from app.agents.personalization import run_personalization_agent
from app.agents.prospect import run_prospect_agent
from app.agents.research import run_research_agent
from app.agents.scorer import run_scorer_agent
from app.agents.warm_path import run_warm_path_finder
from app.models.schemas import OutreachResult
from app.services.sse_manager import sse_manager

SEED_FILE = Path(__file__).parent.parent.parent.parent / "seed" / "demo_contacts.json"

# Seniority scoring — higher = more senior. Negative = exclude.
_SENIORITY: list[tuple[list[str], int]] = [
    (["ceo", "chief executive", "cto", "chief technology", "coo", "cfo", "cpo", "ciso", "chief "], 100),
    (["president", "founder", "co-founder", "cofounder"], 90),
    (["vp ", "vp,", "vice president", "v.p."], 80),
    (["director"], 70),
    (["head of", "head,"], 65),
    (["principal"], 60),
    (["staff "], 55),
    (["senior manager", "sr. manager"], 52),
    (["manager", " lead,", "lead "], 50),
    (["senior ", "sr. ", "sr,"], 40),
    (["engineer", "developer", "designer", "scientist", "analyst"], 30),
    (["associate", "coordinator", "specialist", "consultant"], 20),
    (["junior", "jr."], 10),
    (["intern", "student", "ambassador", "fellow", "volunteer", "undergraduate"], -1),
]


_EXCLUDE_KEYWORDS = ["intern", "student", "ambassador", "fellow", "volunteer", "undergraduate", "incoming"]

def _title_rank(title: str) -> int:
    t = title.lower()
    # Exclusions checked first — "Software Engineering Intern" must not match "engineer"
    if any(kw in t for kw in _EXCLUDE_KEYWORDS):
        return -1
    for keywords, score in _SENIORITY:
        if any(kw in t for kw in keywords):
            return score
    return 25


def _extract_linkedin_contacts(company: str, linkedin_csv: str) -> list[dict]:
    """Parse LinkedIn connections CSV, ranked by seniority. Excludes interns/students."""
    if not linkedin_csv.strip():
        return []

    company_lower = company.lower().strip()
    contacts = []

    reader = csv.reader(io.StringIO(linkedin_csv.strip()))
    for parts in reader:
        if not parts:
            continue
        # Skip header row
        if parts[0].strip().lower() in ("first name", "firstname"):
            continue

        # Standard LinkedIn export: First Name, Last Name, URL, Email, Company, Position, Connected On
        if len(parts) >= 6:
            first, last, url = parts[0].strip(), parts[1].strip(), parts[2].strip()
            contact_company, position = parts[4].strip(), parts[5].strip()
        elif len(parts) >= 4:
            first, last = parts[0].strip(), parts[1].strip()
            contact_company, position = parts[2].strip(), parts[3].strip()
            url = ""
        else:
            continue

        name = f"{first} {last}".strip()
        if not name or not contact_company:
            continue

        if company_lower not in contact_company.lower() and contact_company.lower() not in company_lower:
            continue

        rank = _title_rank(position)
        if rank < 0:
            continue  # skip interns, students, ambassadors

        contacts.append({
            "name": name,
            "title": position,
            "email": "",
            "linkedin_url": url,
            "relevance_score": min(0.95, 0.4 + rank / 130),
            "relevance_reason": f"LinkedIn connection at {contact_company}",
            "_rank": rank,
        })

    contacts.sort(key=lambda c: c["_rank"], reverse=True)
    for c in contacts:
        c.pop("_rank", None)
    return contacts[:5]


def _load_demo_contacts(company: str) -> dict:
    """Load seeded demo contacts as fallback."""
    if not SEED_FILE.exists():
        return {"contacts": []}

    data = json.loads(SEED_FILE.read_text())
    company_lower = company.lower()

    if company_lower in data:
        return {"contacts": data[company_lower]}

    for key, contacts in data.items():
        if key in company_lower or company_lower in key:
            return {"contacts": contacts}

    first_key = next(iter(data))
    return {"contacts": data[first_key]}


async def _safe_run(coro, fallback, job_id: str, agent_name: str):
    """Run agent with error handling — return fallback on failure."""
    try:
        return await coro
    except Exception as e:
        traceback.print_exc()
        await sse_manager.emit(
            job_id=job_id, agent=agent_name, status="done",
            message=f"{agent_name} failed: {str(e)[:100]}. Continuing...",
        )
        return fallback


async def run_outreach(
    company: str,
    resume_text: str,
    goal: str,
    sender_name: str,
    sender_email: str,
    job_id: str,
    linkedin_connections: str = "",
    job_description: str = "",
) -> OutreachResult:
    """
    Full coordinator flow — 8 agents with graceful failure handling.
    Critical agents: Prospect, Research, Personalization, Copywriter
    Optional agents: Gap Analyzer, Warm Path, Scorer, Follow-up
    """

    # --- Step 1: Prospect (critical) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Finding the right contact at {company}...",
    )

    try:
        prospect_result = await asyncio.wait_for(
            run_prospect_agent(company=company, resume_text=resume_text, goal=goal, job_id=job_id),
            timeout=25,
        )
    except asyncio.TimeoutError:
        prospect_result = {"contacts": []}
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="running",
            message="Apollo search timed out — continuing with LinkedIn contacts.",
        )

    apollo_contacts = prospect_result.get("contacts", [])

    # Always extract LinkedIn contacts independently (for warm connections)
    linkedin_contacts = _extract_linkedin_contacts(company, linkedin_connections) if linkedin_connections else []

    using_demo = False

    # Primary contact: best Apollo result (senior title) or best LinkedIn, fallback demo
    if apollo_contacts:
        top_contact = apollo_contacts[0]
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="running",
            message=f"Apollo found: {top_contact.get('name')} — {top_contact.get('title')}",
        )
    elif linkedin_contacts:
        top_contact = linkedin_contacts[0]
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="running",
            message=f"Using top LinkedIn connection: {top_contact.get('name')} — {top_contact.get('title')}",
        )
    else:
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="running",
            message="No contacts found. Using demo contacts.",
        )
        demo = _load_demo_contacts(company)
        apollo_contacts = demo.get("contacts", [])
        top_contact = apollo_contacts[0] if apollo_contacts else {}
        using_demo = True

    if not top_contact:
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="error",
            message="No contacts found. Cannot proceed.",
        )
        raise ValueError("No contacts found for this company.")

    # Best LinkedIn contact = highest ranked connection that isn't the primary contact
    best_linkedin = next(
        (c for c in linkedin_contacts if c.get("name") != top_contact.get("name")),
        linkedin_contacts[0] if linkedin_contacts and linkedin_contacts[0].get("name") != top_contact.get("name") else None,
    )
    # If primary IS a linkedin contact and there's a second one, use it; otherwise set to None if same
    if linkedin_contacts:
        other_linkedin = [c for c in linkedin_contacts if c.get("name") != top_contact.get("name")]
        best_linkedin = other_linkedin[0] if other_linkedin else (linkedin_contacts[0] if top_contact not in linkedin_contacts else None)
    else:
        best_linkedin = None

    if linkedin_contacts:
        msg = f"Found {len(linkedin_contacts)} LinkedIn connection(s) at {company}"
        if best_linkedin:
            msg += f": {best_linkedin.get('name')} ({best_linkedin.get('title')})"
        await sse_manager.emit(job_id=job_id, agent="coordinator", status="running", message=msg)

    contact_summary = f"{top_contact.get('name', 'Unknown')} — {top_contact.get('title', 'Unknown')}"

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Target contact: {contact_summary}" + (" (demo)" if using_demo else ""),
    )

    # --- Step 2: Research (critical) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Researching {company}...",
    )

    research_result = await run_research_agent(
        company=company,
        contact_context=f"Target contact: {contact_summary}",
        job_id=job_id,
    )

    findings = research_result.get("findings", [])
    research_quality = "strong" if len(findings) >= 2 else "weak"

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Research quality: {research_quality} ({len(findings)} findings)",
    )

    # --- Step 3 & 4: Gap Analysis + Warm Path (parallel, optional) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Analyzing resume gaps and finding warm paths...",
    )

    gap_task = _safe_run(
        run_gap_analyzer(resume_text=resume_text, research=research_result, job_description=job_description, job_id=job_id),
        fallback={"gaps": [], "strengths": [], "strategy": "", "match_percentage": 0},
        job_id=job_id, agent_name="gap_analyzer",
    )
    warm_task = _safe_run(
        run_warm_path_finder(
            resume_text=resume_text, contact=top_contact,
            research=research_result, linkedin_connections=linkedin_connections,
            job_id=job_id,
        ),
        fallback={"warm_paths": [], "warmest_path": None, "is_warm": False},
        job_id=job_id, agent_name="warm_path",
    )

    gap_result, warm_result = await asyncio.gather(gap_task, warm_task)

    # Normalize — agents sometimes return unexpected shapes
    if not isinstance(gap_result, dict):
        gap_result = {"gaps": [], "strengths": [], "strategy": "", "match_percentage": 0}
    if not isinstance(warm_result, dict):
        warm_result = {"warm_paths": [], "warmest_path": None, "is_warm": False}

    match_pct = gap_result.get("match_percentage", 0)
    is_warm = warm_result.get("is_warm", False)

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Resume match: {match_pct}% | Warm connection: {'Yes' if is_warm else 'No'}",
    )

    # --- Step 5: Personalization (critical) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Matching your background to research...",
    )

    personalization_result = await run_personalization_agent(
        resume_text=resume_text,
        research=research_result,
        contact=top_contact,
        research_quality=research_quality,
        job_description=job_description,
        job_id=job_id,
    )

    angles = personalization_result.get("angles", [])

    # Fallback: if LLM returned no angles, synthesize a minimal brief so copywriter can still run
    if not angles:
        goal_text = goal or f"connect with someone at {company}"
        fallback_angle = {
            "angle": f"Reaching out about opportunities at {company} aligned with your background",
            "reasoning": f"User's goal: {goal_text}. Resume highlights available for reference.",
            "priority": 1,
        }
        personalization_result = {"angles": [fallback_angle], "research_quality": research_quality}
        angles = [fallback_angle]

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Found {len(angles)} angles. Drafting emails...",
    )

    # --- Step 6: Copywriter (critical) ---
    copywriter_result = await run_copywriter_agent(
        personalization=personalization_result,
        contact=top_contact,
        sender_name=sender_name,
        sender_email=sender_email,
        job_id=job_id,
        job_description=job_description,
    )

    emails = copywriter_result.get("emails", [])

    # --- Step 7 & 8: Scorer + Follow-up (parallel, optional) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Scoring emails and generating follow-up sequence...",
    )

    best_email = next(
        (e for e in emails if e.get("tone") == "professional"),
        emails[0] if emails else {},
    )

    score_task = _safe_run(
        run_scorer_agent(
            emails=emails, contact=top_contact,
            personalization=personalization_result, job_id=job_id,
        ),
        fallback={"scores": []},
        job_id=job_id, agent_name="scorer",
    )
    followup_task = _safe_run(
        run_followup_agent(
            initial_email=best_email, contact=top_contact,
            personalization=personalization_result, job_id=job_id,
        ),
        fallback={"sequence": []},
        job_id=job_id, agent_name="followup",
    )

    score_result, followup_result = await asyncio.gather(score_task, followup_task)

    if not isinstance(score_result, dict):
        score_result = {"scores": []}
    if not isinstance(followup_result, dict):
        followup_result = {"sequence": []}
    if not isinstance(personalization_result, dict):
        personalization_result = {"angles": [], "research_quality": research_quality}
    if not isinstance(research_result, dict):
        research_result = {"findings": [], "company_summary": ""}

    # --- Complete — build result defensively ---
    def safe_get(data: dict, key: str, fallback: list) -> list:
        val = data.get(key, fallback)
        return val if isinstance(val, list) else fallback

    result = OutreachResult(
        contact={
            "name": top_contact.get("name", ""),
            "title": top_contact.get("title", ""),
            "email": top_contact.get("email", ""),
            "linkedin_url": top_contact.get("linkedin_url", ""),
            "relevance_score": top_contact.get("relevance_score", 0),
            "relevance_reason": top_contact.get("relevance_reason", ""),
        },
        linkedin_contact={
            "name": best_linkedin.get("name", ""),
            "title": best_linkedin.get("title", ""),
            "email": best_linkedin.get("email", ""),
            "linkedin_url": best_linkedin.get("linkedin_url", ""),
            "relevance_score": best_linkedin.get("relevance_score", 0),
            "relevance_reason": best_linkedin.get("relevance_reason", ""),
        } if best_linkedin else None,
        research={
            "findings": safe_get(research_result, "findings", []),
            "company_summary": research_result.get("company_summary", ""),
        },
        personalization={
            "angles": safe_get(personalization_result, "angles", []),
            "research_quality": personalization_result.get("research_quality", research_quality),
        },
        emails=emails if isinstance(emails, list) else [],
        gap_analysis=gap_result if gap_result.get("match_percentage") is not None else None,
        warm_paths=warm_result if warm_result.get("warm_paths") is not None else None,
        email_scores=score_result if safe_get(score_result, "scores", []) else None,
        follow_up=followup_result,
    )

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="complete",
        message=f"Done! {len(emails)} drafts ready.",
        result=result.model_dump(),
    )

    return result
