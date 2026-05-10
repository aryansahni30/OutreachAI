import type { OutreachResult } from '../types';
import { ContactCard } from './ContactCard';
import { EmailCard } from './EmailCard';

interface ResultsPanelProps {
  result: OutreachResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Contact */}
      <ContactCard contact={result.contact} />

      {/* Research Summary */}
      {result.research?.findings?.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Research Findings
          </h3>
          <div className="space-y-3">
            {result.research.findings.map((finding, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-white">{finding.title}</p>
                <p className="text-zinc-400 mt-0.5">{finding.summary}</p>
                {finding.suggested_hook && (
                  <p className="text-xs text-blue-400 mt-1">Hook: {finding.suggested_hook}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalization Angles */}
      {result.personalization?.angles?.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Personalization Angles
          </h3>
          <div className="space-y-2">
            {result.personalization.angles.map((angle, i) => (
              <div key={i} className="text-sm flex gap-2">
                <span className="text-blue-400 font-bold shrink-0">#{angle.priority || i + 1}</span>
                <div>
                  <p className="text-white">{angle.angle}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{angle.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Drafts */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Email Drafts
        </h3>
        <div className="grid gap-4">
          {result.emails.map((email, i) => (
            <EmailCard key={i} email={email} />
          ))}
        </div>
      </div>
    </div>
  );
}
