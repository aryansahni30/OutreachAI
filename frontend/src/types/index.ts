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

export interface OutreachResult {
  contact: Contact;
  research: ResearchResult;
  personalization: PersonalizationResult;
  emails: EmailDraft[];
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
}
