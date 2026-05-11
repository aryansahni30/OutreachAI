import json
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


async def run_outreach(
    company: str,
    resume_text: str,
    goal: str,
    sender_name: str,
    sender_email: str,
    job_id: str,
) -> OutreachResult:
    """
    Full coordinator flow — 8 agents:
    1. Prospect Agent → find contacts
    2. Research Agent → company intel
    3. Gap Analyzer → resume vs job requirements (parallel with #4)
    4. Warm Path Finder → shared history (parallel with #3)
    5. Personalization Agent → match angles
    6. Copywriter Agent → draft emails
    7. Email Scorer → predict response rates
    8. Follow-up Generator → 3-email sequence
    """

    # --- Step 1: Prospect ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Finding the right contact at {company}...",
    )

    prospect_result = await run_prospect_agent(
        company=company, resume_text=resume_text, goal=goal, job_id=job_id,
    )

    contacts = prospect_result.get("contacts", [])
    using_demo = False

    if not contacts:
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="running",
            message="No contacts from Apollo. Using demo contacts.",
        )
        demo = _load_demo_contacts(company)
        contacts = demo.get("contacts", [])
        using_demo = True

    if not contacts:
        await sse_manager.emit(
            job_id=job_id, agent="coordinator", status="error",
            message="No contacts found. Cannot proceed.",
        )
        raise ValueError("No contacts found for this company.")

    top_contact = contacts[0]
    contact_summary = f"{top_contact.get('name', 'Unknown')} — {top_contact.get('title', 'Unknown')}"

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Top contact: {contact_summary}" + (" (demo)" if using_demo else ""),
    )

    # --- Step 2: Research ---
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

    # --- Step 3 & 4: Gap Analysis + Warm Path (parallel) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Analyzing resume gaps and finding warm paths...",
    )

    import asyncio
    gap_task = asyncio.create_task(
        run_gap_analyzer(resume_text=resume_text, research=research_result, job_id=job_id)
    )
    warm_task = asyncio.create_task(
        run_warm_path_finder(
            resume_text=resume_text, contact=top_contact,
            research=research_result, job_id=job_id,
        )
    )

    gap_result, warm_result = await asyncio.gather(gap_task, warm_task)

    match_pct = gap_result.get("match_percentage", 0)
    is_warm = warm_result.get("is_warm", False)

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Resume match: {match_pct}% | Warm connection: {'Yes' if is_warm else 'No'}",
    )

    # --- Step 5: Personalization ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Matching your background to research...",
    )

    personalization_result = await run_personalization_agent(
        resume_text=resume_text,
        research=research_result,
        contact=top_contact,
        research_quality=research_quality,
        job_id=job_id,
    )

    angles = personalization_result.get("angles", [])
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message=f"Found {len(angles)} personalization angles. Drafting emails...",
    )

    # --- Step 6: Copywriter ---
    copywriter_result = await run_copywriter_agent(
        personalization=personalization_result,
        contact=top_contact,
        sender_name=sender_name,
        sender_email=sender_email,
        job_id=job_id,
    )

    emails = copywriter_result.get("emails", [])

    # --- Step 7 & 8: Scorer + Follow-up (parallel) ---
    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="running",
        message="Scoring emails and generating follow-up sequence...",
    )

    # Pick the best email for follow-up (professional tone preferred)
    best_email = next(
        (e for e in emails if e.get("tone") == "professional"),
        emails[0] if emails else {},
    )

    score_task = asyncio.create_task(
        run_scorer_agent(
            emails=emails, contact=top_contact,
            personalization=personalization_result, job_id=job_id,
        )
    )
    followup_task = asyncio.create_task(
        run_followup_agent(
            initial_email=best_email, contact=top_contact,
            personalization=personalization_result, job_id=job_id,
        )
    )

    score_result, followup_result = await asyncio.gather(score_task, followup_task)

    # --- Complete ---
    result = OutreachResult(
        contact={
            "name": top_contact.get("name", ""),
            "title": top_contact.get("title", ""),
            "email": top_contact.get("email", ""),
            "linkedin_url": top_contact.get("linkedin_url", ""),
            "relevance_score": top_contact.get("relevance_score", 0),
            "relevance_reason": top_contact.get("relevance_reason", ""),
        },
        research=research_result,
        personalization=personalization_result,
        emails=emails,
        gap_analysis=gap_result,
        warm_paths=warm_result,
        email_scores=score_result,
        follow_up=followup_result,
    )

    await sse_manager.emit(
        job_id=job_id, agent="coordinator", status="complete",
        message=f"Done! {len(emails)} drafts, {len(followup_result.get('sequence', []))} follow-ups ready.",
        result=result.model_dump(),
    )

    return result
