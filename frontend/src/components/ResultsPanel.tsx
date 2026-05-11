import { Lightbulb, Newspaper } from 'lucide-react';
import type { OutreachResult } from '../types';
import { ContactCard } from './ContactCard';
import { EmailCard } from './EmailCard';

interface ResultsPanelProps {
  result: OutreachResult;
  sessionToken: string | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export function ResultsPanel({ result, sessionToken, isLoggedIn, onLoginRequired }: ResultsPanelProps) {
  const recipientEmail = result.contact.email || '';

  return (
    <div className="space-y-8">
      {/* Contact */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Target Contact
        </h2>
        <ContactCard contact={result.contact} />
      </div>

      {/* Research Summary */}
      {result.research?.findings?.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Newspaper size={13} />
            Research Findings
          </h2>
          <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
            {result.research.findings.map((finding, i) => (
              <div key={i} className="p-5">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{finding.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{finding.summary}</p>
                {finding.suggested_hook && (
                  <p className="text-xs text-[var(--color-primary-light)] mt-2 flex items-start gap-1.5">
                    <Lightbulb size={12} className="shrink-0 mt-0.5" />
                    {finding.suggested_hook}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalization Angles */}
      {result.personalization?.angles?.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Personalization Angles
          </h2>
          <div className="grid gap-3">
            {result.personalization.angles.map((angle, i) => (
              <div key={i} className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 text-sm font-bold text-[var(--color-primary-light)]">
                  {angle.priority || i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{angle.angle}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{angle.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Drafts */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Email Drafts
        </h2>
        <div className="grid gap-4">
          {result.emails.map((email, i) => (
            <EmailCard
              key={i}
              email={email}
              recipientEmail={recipientEmail}
              sessionToken={sessionToken}
              isLoggedIn={isLoggedIn}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
