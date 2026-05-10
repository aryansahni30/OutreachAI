import { useState } from 'react';
import type { EmailDraft } from '../types';

interface EmailCardProps {
  email: EmailDraft;
}

const TONE_STYLES: Record<string, { label: string; badge: string }> = {
  casual: { label: 'Casual', badge: 'bg-emerald-500/20 text-emerald-400' },
  professional: { label: 'Professional', badge: 'bg-blue-500/20 text-blue-400' },
  concise: { label: 'Concise', badge: 'bg-amber-500/20 text-amber-400' },
};

export function EmailCard({ email }: EmailCardProps) {
  const [copied, setCopied] = useState(false);
  const style = TONE_STYLES[email.tone] || TONE_STYLES.professional;

  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
          {style.label}
        </span>
        <span className="text-xs text-zinc-500">{email.word_count} words</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Subject</p>
          <p className="text-sm font-medium text-white">{email.subject}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Body</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{email.body}</p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="mt-4 w-full py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
      >
        {copied ? 'Copied!' : 'Copy Email'}
      </button>
    </div>
  );
}
