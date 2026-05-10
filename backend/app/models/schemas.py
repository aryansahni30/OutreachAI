from pydantic import BaseModel


# --- Request ---

class OutreachRequest(BaseModel):
    company: str
    resume_text: str
    goal: str = ""
    sender_name: str
    sender_email: str


# --- Agent Outputs ---

class Contact(BaseModel):
    name: str
    title: str
    email: str
    linkedin_url: str = ""
    relevance_score: float = 0.0
    relevance_reason: str = ""


class ProspectResult(BaseModel):
    contacts: list[Contact]


class ResearchFinding(BaseModel):
    title: str
    summary: str
    source_url: str = ""
    suggested_hook: str = ""
    recency: str = ""  # "this week", "this month", etc.


class ResearchResult(BaseModel):
    findings: list[ResearchFinding]
    company_summary: str = ""


class PersonalizationAngle(BaseModel):
    angle: str
    reasoning: str
    priority: int = 0


class PersonalizationResult(BaseModel):
    angles: list[PersonalizationAngle]
    research_quality: str = "strong"  # strong | weak


class EmailDraft(BaseModel):
    tone: str  # casual | professional | concise
    subject: str
    body: str
    word_count: int = 0


class CopywriterResult(BaseModel):
    emails: list[EmailDraft]


# --- Final Output ---

class OutreachResult(BaseModel):
    contact: Contact
    research: ResearchResult
    personalization: PersonalizationResult
    emails: list[EmailDraft]


# --- API Response ---

class JobCreatedResponse(BaseModel):
    job_id: str
    status: str = "started"
