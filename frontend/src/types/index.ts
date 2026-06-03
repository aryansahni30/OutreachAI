export interface Contact {
  name: string;
  title: string;
  email: string;
  linkedin_url: string;
  relevance_score: number;
  relevance_reason: string;
}

export interface ResearchFinding {
  title: string;
  summary: string;
  source_url: string;
  suggested_hook: string;
  recency: string;
}

export interface ResearchResult {
  findings: ResearchFinding[];
  company_summary: string;
}

export interface PersonalizationAngle {
  angle: string;
  reasoning: string;
  priority: number;
}

export interface PersonalizationResult {
  angles: PersonalizationAngle[];
  research_quality: string;
}

export interface EmailDraft {
  tone: string;
  subject: string;
  body: string;
  word_count: number;
}

// --- New Features ---

export interface SkillGap {
  skill: string;
  severity: string;
  reframe: string;
}

export interface SkillStrength {
  skill: string;
  relevance: string;
  priority: number;
}

export interface GapAnalysis {
  gaps: SkillGap[];
  strengths: SkillStrength[];
  strategy: string;
  match_percentage: number;
}

export interface WarmPath {
  connection: string;
  type: string;
  strength: string;
  suggested_mention: string;
}

export interface MutualContact {
  name: string;
  title: string;
  company: string;
}

export interface WarmPathResult {
  warm_paths: WarmPath[];
  warmest_path: string | null;
  is_warm: boolean;
  mutual_contacts: MutualContact[];
}

export interface ScoreBreakdown {
  personalization: number;
  hook: number;
  value: number;
  cta: number;
  readability: number;
}

export interface EmailScore {
  tone: string;
  overall_score: number;
  predicted_response_rate: string;
  breakdown: ScoreBreakdown;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

export interface ScorerResult {
  scores: EmailScore[];
}

export interface FollowUpEmail {
  day: number;
  subject: string;
  body: string;
  word_count: number;
  strategy: string;
}

export interface FollowUpResult {
  sequence: FollowUpEmail[];
}

// --- Final Output ---

export interface OutreachResult {
  contact: Contact;
  linkedin_contact?: Contact | null;
  research: ResearchResult;
  personalization: PersonalizationResult;
  emails: EmailDraft[];
  gap_analysis: GapAnalysis | null;
  warm_paths: WarmPathResult | null;
  email_scores: ScorerResult | null;
  follow_up: FollowUpResult | null;
}

export interface SSEEvent {
  agent: string;
  status: string;
  message: string;
  timestamp: string;
  result?: OutreachResult;
}

export interface OutreachRequest {
  company: string;
  resume_text: string;
  goal: string;
  sender_name: string;
  sender_email: string;
  linkedin_connections: string;
  job_description: string;
}
