from typing import Any

from pydantic import BaseModel


# --- Request ---

class OutreachRequest(BaseModel):
    company: str
    resume_text: str
    goal: str = ""
    sender_name: str
    linkedin_connections: str = ""
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
    recency: str = ""


class ResearchResult(BaseModel):
    findings: list[ResearchFinding]
    company_summary: str = ""


class PersonalizationAngle(BaseModel):
    angle: str
    reasoning: str
    priority: int = 0


class PersonalizationResult(BaseModel):
    angles: list[PersonalizationAngle]
    research_quality: str = "strong"


class EmailDraft(BaseModel):
    tone: str
    subject: str
    body: str
    word_count: int = 0


class CopywriterResult(BaseModel):
    emails: list[EmailDraft]


# --- New Feature: Gap Analysis ---

class SkillGap(BaseModel):
    skill: str
    severity: str = "medium"  # low | medium | high
    reframe: str = ""


class SkillStrength(BaseModel):
    skill: str
    relevance: str = ""
    priority: int = 0


class GapAnalysis(BaseModel):
    gaps: list[SkillGap] = []
    strengths: list[SkillStrength] = []
    strategy: str = ""
    match_percentage: int = 0


# --- New Feature: Warm Path ---

class WarmPath(BaseModel):
    connection: str
    type: str = "indirect"  # direct | indirect | cultural | mutual_contact
    strength: str = "weak"  # strong | medium | weak
    suggested_mention: str = ""


class MutualContact(BaseModel):
    name: str = ""
    title: str = ""
    company: str = ""


class WarmPathResult(BaseModel):
    warm_paths: list[WarmPath] = []
    warmest_path: Any = None
    is_warm: bool = False
    mutual_contacts: list[MutualContact] = []


# --- New Feature: Email Score ---

class ScoreBreakdown(BaseModel):
    personalization: int = 0
    hook: int = 0
    value: int = 0
    cta: int = 0
    readability: int = 0


class EmailScore(BaseModel):
    tone: str
    overall_score: int = 0
    predicted_response_rate: str = ""
    breakdown: ScoreBreakdown = ScoreBreakdown()
    strengths: list[str] = []
    improvements: list[str] = []
    verdict: str = ""


class ScorerResult(BaseModel):
    scores: list[EmailScore] = []


# --- New Feature: Follow-up Sequence ---

class FollowUpEmail(BaseModel):
    day: int
    subject: str
    body: str
    word_count: int = 0
    strategy: str = ""


class FollowUpResult(BaseModel):
    sequence: list[FollowUpEmail] = []


# --- Final Output ---

class OutreachResult(BaseModel):
    contact: Contact
    research: ResearchResult
    personalization: PersonalizationResult
    emails: list[EmailDraft]
    gap_analysis: GapAnalysis | None = None
    warm_paths: WarmPathResult | None = None
    email_scores: ScorerResult | None = None
    follow_up: FollowUpResult | None = None


# --- API Response ---

class JobCreatedResponse(BaseModel):
    job_id: str
    status: str = "started"
