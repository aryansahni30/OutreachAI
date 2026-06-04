import { useEffect, useState } from 'react';
import { ExternalLink, Lightbulb, Link2, Mail, Newspaper, Sparkles } from 'lucide-react';
import type { Contact, OutreachResult } from '../types';
import { EmailCard } from './EmailCard';
import { FollowUpTimeline } from './FollowUpTimeline';
import { GapAnalysisCard } from './GapAnalysisCard';
import { WarmPathCard } from './WarmPathCard';

type Tab = 'emails' | 'research' | 'strategy';

// — Animated SVG score ring —
interface ScoreRingProps {
  score: number;
  size?: number;
}

function ScoreRing({ score, size = 52 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (animated ? score / 100 : 0);
  const color = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="rgba(255,255,255,0.07)" strokeWidth={4} fill="none"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={4} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  );
}

// — Compact contact bar shown above all tabs —
interface CompactContactBarProps {
  contact: Contact;
  linkedinContact?: Contact | null;
}

function CompactContactBar({ contact, linkedinContact }: CompactContactBarProps) {
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const relevanceScore = Math.round(contact.relevance_score * 100);

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4 gradient-border">
      <div className="flex items-center gap-4">
        {/* Gradient avatar */}
        <div className="w-11 h-11 rounded-full animated-gradient flex items-center justify-center text-white font-bold text-sm shrink-0 select-none">
          {initials}
        </div>

        {/* Name / title / links */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--color-text-primary)] truncate">{contact.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border border-[var(--color-primary)]/20 shrink-0">
              Cold Target
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">{contact.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {contact.email && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] truncate">
                <Mail size={11} />
                {contact.email}
              </span>
            )}
            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors shrink-0"
              >
                <Link2 size={11} />
                LinkedIn
                <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>

        {/* Relevance score ring */}
        {relevanceScore > 0 && (
          <div className="relative shrink-0">
            <ScoreRing score={relevanceScore} size={52} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">{relevanceScore}</span>
            </div>
          </div>
        )}
      </div>

      {contact.relevance_reason && (
        <p className="text-xs text-[var(--color-text-muted)] mt-3 pt-3 border-t border-[var(--color-border-subtle)] leading-relaxed">
          {contact.relevance_reason}
        </p>
      )}

      {/* Warm LinkedIn contact inline */}
      {linkedinContact && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 select-none">
            {linkedinContact.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-400 truncate">{linkedinContact.name}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">
              {linkedinContact.title} · Warm Connection
            </p>
          </div>
          {linkedinContact.linkedin_url && (
            <a
              href={linkedinContact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// — Tone pill styles —
const TONE_PILL: Record<string, { active: string; inactive: string }> = {
  casual: {
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    inactive: 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-emerald-500/30 hover:text-emerald-400',
  },
  professional: {
    active: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
    inactive: 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-blue-500/30 hover:text-blue-400',
  },
  concise: {
    active: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    inactive: 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-amber-500/30 hover:text-amber-400',
  },
};

// — Main export —
interface ResultsPanelProps {
  result: OutreachResult;
  sessionToken: string | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export function ResultsPanel({ result, sessionToken, isLoggedIn, onLoginRequired }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('emails');
  const [activeTone, setActiveTone] = useState(result.emails[0]?.tone ?? 'casual');

  const recipientEmail = result.contact.email || '';
  const scores = result.email_scores?.scores ?? [];

  const activeEmail = result.emails.find((e) => e.tone === activeTone) ?? result.emails[0];
  const activeScore = scores.find((s) => s.tone === activeTone);

  const hasResearch =
    (result.research?.findings?.length ?? 0) > 0 ||
    (result.personalization?.angles?.length ?? 0) > 0;

  const hasStrategy =
    (result.warm_paths?.warm_paths?.length ?? 0) > 0 ||
    !!result.gap_analysis ||
    (result.follow_up?.sequence?.length ?? 0) > 0;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'emails', label: 'Emails' },
    ...(hasResearch ? [{ id: 'research' as Tab, label: 'Research' }] : []),
    ...(hasStrategy ? [{ id: 'strategy' as Tab, label: 'Strategy' }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Contact bar */}
      <CompactContactBar
        contact={result.contact}
        linkedinContact={result.linkedin_contact}
      />

      {/* Tab nav — segmented control style */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — re-mounts on switch for fade-slide animation */}
      <div key={activeTab} className="animate-fade-slide-up">

        {/* ── EMAILS TAB ── */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            {/* Tone switcher — only if multiple emails */}
            {result.emails.length > 1 && (
              <div className="flex gap-2">
                {result.emails.map((email) => {
                  const s = scores.find((sc) => sc.tone === email.tone);
                  const isActive = email.tone === activeTone;
                  const colors = TONE_PILL[email.tone] ?? {
                    active: 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary-light)]',
                    inactive: 'border-[var(--color-border-subtle)] text-[var(--color-text-muted)]',
                  };
                  return (
                    <button
                      key={email.tone}
                      onClick={() => setActiveTone(email.tone)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        isActive ? colors.active : colors.inactive
                      }`}
                    >
                      <span className="capitalize">{email.tone}</span>
                      {s && (
                        <span className="text-[11px] opacity-60 font-normal">{s.overall_score}/100</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Single email card — re-animates when tone changes */}
            {activeEmail && (
              <div key={activeTone} className="animate-fade-slide-up">
                <EmailCard
                  email={activeEmail}
                  recipientEmail={recipientEmail}
                  sessionToken={sessionToken}
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={onLoginRequired}
                  score={activeScore}
                />
              </div>
            )}
          </div>
        )}

        {/* ── RESEARCH TAB ── */}
        {activeTab === 'research' && (
          <div className="space-y-5">
            {result.research?.company_summary && (
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Company Overview
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {result.research.company_summary}
                </p>
              </div>
            )}

            {(result.research?.findings?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Newspaper size={12} />
                  Recent Findings
                </h2>
                <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
                  {result.research.findings.map((finding, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{finding.title}</p>
                        {finding.recency && (
                          <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{finding.recency}</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                        {finding.summary}
                      </p>
                      {finding.suggested_hook && (
                        <p className="text-xs text-[var(--color-primary-light)] mt-2 flex items-start gap-1.5">
                          <Lightbulb size={11} className="shrink-0 mt-0.5" />
                          {finding.suggested_hook}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(result.personalization?.angles?.length ?? 0) > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles size={12} />
                  Personalization Angles
                </h2>
                <div className="space-y-2.5">
                  {result.personalization.angles.map((angle, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4 flex gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[var(--color-primary-light)]">
                        {angle.priority ?? i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{angle.angle}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                          {angle.reasoning}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STRATEGY TAB ── */}
        {activeTab === 'strategy' && (
          <div className="space-y-5">
            {(result.warm_paths?.warm_paths?.length ?? 0) > 0 && result.warm_paths && (
              <WarmPathCard result={result.warm_paths} />
            )}
            {result.gap_analysis && (
              <GapAnalysisCard analysis={result.gap_analysis} />
            )}
            {(result.follow_up?.sequence?.length ?? 0) > 0 && result.follow_up && (
              <FollowUpTimeline
                result={result.follow_up}
                initialSubject={result.emails[0]?.subject ?? 'Initial outreach'}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
