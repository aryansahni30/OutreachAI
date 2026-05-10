import json
from pathlib import Path

from app.agents.copywriter import run_copywriter_agent
from app.agents.personalization import run_personalization_agent
from app.agents.prospect import run_prospect_agent
from app.agents.research import run_research_agent
from app.models.schemas import OutreachResult
from app.services.sse_manager import sse_manager

SEED_FILE = Path(__file__).parent.parent.parent.parent / "seed" / "demo_contacts.json"


def _load_demo_contacts(company: str) -> dict:
    """Load seeded demo contacts as fallback."""
    if not SEED_FILE.exists():
        return {"contacts": []}

    data = json.loads(SEED_FILE.read_text())
    company_lower = company.lower()

    # Try exact match, then partial match
    if company_lower in data:
        return {"contacts": data[company_lower]}

    for key, contacts in data.items():
        if key in company_lower or company_lower in key:
            return {"contacts": contacts}

    # Return first available as last resort
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
    Full coordinator flow:
    1. Prospect Agent → find contacts
    2. Research Agent → company intel
    3. Personalization Agent → match angles
    4. Copywriter Agent → draft emails
    """

    # --- Step 1: Prospect ---
    await sse_manager.emit(
        job_id=job_id,
        agent="coordinator",
        status="running",
        message=f"Finding the right contact at {company}...",
    )

    prospect_result = await run_prospect_agent(
        company=company,
        resume_text=resume_text,
        goal=goal,
        job_id=job_id,
    )

    contacts = prospect_result.get("contacts", [])
    using_demo = False

    if not contacts:
        await sse_manager.emit(
            job_id=job_id,
            agent="coordinator",
            status="running",
            message="No contacts from Apollo. Using demo contacts.",
        )
        demo = _load_demo_contacts(company)
        contacts = demo.get("contacts", [])
        using_demo = True

    if not contacts:
        await sse_manager.emit(
            job_id=job_id,
            agent="coordinator",
            status="error",
            message="No contacts found. Cannot proceed.",
        )
        raise ValueError("No contacts found for this company.")

    top_contact = contacts[0]
    contact_summary = f"{top_contact.get('name', 'Unknown')} — {top_contact.get('title', 'Unknown')}"

    await sse_manager.emit(
        job_id=job_id,
        agent="coordinator",
        status="running",
        message=f"Top contact: {contact_summary}" + (" (demo)" if using_demo else ""),
    )

    # --- Step 2: Research ---
    await sse_manager.emit(
        job_id=job_id,
        agent="coordinator",
        status="running",
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
        job_id=job_id,
        agent="coordinator",
        status="running",
        message=f"Research quality: {research_quality} ({len(findings)} findings)",
    )

    # --- Step 3: Personalization ---
    await sse_manager.emit(
        job_id=job_id,
        agent="coordinator",
        status="running",
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
        job_id=job_id,
        agent="coordinator",
        status="running",
        message=f"Found {len(angles)} personalization angles. Drafting emails...",
    )

    # --- Step 4: Copywriter ---
    copywriter_result = await run_copywriter_agent(
        personalization=personalization_result,
        contact=top_contact,
        sender_name=sender_name,
        sender_email=sender_email,
        job_id=job_id,
    )

    emails = copywriter_result.get("emails", [])

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
    )

    await sse_manager.emit(
        job_id=job_id,
        agent="coordinator",
        status="complete",
        message=f"Done! {len(emails)} email drafts ready.",
        result=result.model_dump(),
    )

    return result
