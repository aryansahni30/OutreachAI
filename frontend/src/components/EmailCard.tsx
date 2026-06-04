import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Paperclip, Send, X } from 'lucide-react';
import type { EmailDraft, EmailScore } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface EmailCardProps {
  email: EmailDraft;
  recipientEmail: string;
  sessionToken: string | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  score?: EmailScore;
}

interface ScoreBarProps {
  label: string;
  value: number;
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const barColor =
    value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-[var(--color-primary)]';

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] text-[var(--color-text-muted)] w-20 shrink-0 capitalize">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} animate-progress-fill`}
          style={{ width: mounted ? `${value}%` : '0%' }}
        />
      </div>
      <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] w-6 text-right shrink-0">
        {value}
      </span>
    </div>
  );
}

export function EmailCard({
  email,
  recipientEmail,
  sessionToken,
  isLoggedIn,
  onLoginRequired,
  score,
}: EmailCardProps) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showScore, setShowScore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;

  const scoreColor = score
    ? score.overall_score >= 70
      ? 'text-emerald-400'
      : score.overall_score >= 50
        ? 'text-amber-400'
        : 'text-red-400'
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setSending(true);
    setSendError(null);

    const formData = new FormData();
    formData.append('to_email', recipientEmail);
    formData.append('subject', email.subject);
    formData.append('body', email.body);
    for (const file of attachments) {
      formData.append('attachments', file);
    }

    try {
      const response = await fetch(`${API_BASE}/email/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Send failed' }));
        throw new Error(error.detail || 'Failed to send');
      }
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed';
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
      {/* Header — metadata */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--color-text-muted)]">To:</span>
            <span className="text-[var(--color-text-secondary)]">{recipientEmail || '—'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            {score && (
              <span className="text-[var(--color-primary-light)]">{score.predicted_response_rate} resp. est.</span>
            )}
            <span>{email.word_count}w</span>
          </div>
        </div>
        <p className="text-base font-semibold text-[var(--color-text-primary)] leading-snug">
          {email.subject}
        </p>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
          {email.body}
        </p>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Attachments */}
      {!sent && (
        <div className="px-5 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />
          {attachments.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)] truncate">
                    <Paperclip size={12} />
                    {file.name}
                  </div>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-[var(--color-text-muted)] hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score breakdown — collapsible */}
      {score && showScore && (
        <div key="breakdown" className="px-5 pb-3 animate-fade-slide-up">
          <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2.5">
            {Object.entries(score.breakdown).map(([key, val]) => (
              <ScoreBar key={key} label={key} value={val} />
            ))}
            {score.verdict && (
              <p className="text-xs text-[var(--color-text-muted)] italic pt-1 border-t border-[var(--color-border-subtle)]">
                {score.verdict}
              </p>
            )}
          </div>
        </div>
      )}

      {sendError && (
        <p className="px-5 pb-2 text-xs text-red-400">{sendError}</p>
      )}

      {/* Footer — actions */}
      <div className="px-4 py-3 flex items-center gap-1.5">
        {!sent && (
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer rounded-lg hover:bg-white/5"
          >
            <Paperclip size={15} />
          </button>
        )}

        {score && (
          <button
            onClick={() => setShowScore(!showScore)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              showScore
                ? `${scoreColor} bg-white/5 border-white/10`
                : `${scoreColor} border-transparent hover:bg-white/5`
            }`}
          >
            <span className="text-sm font-bold">{score.overall_score}</span>
            <span className="opacity-50">/100</span>
            <span
              className="ml-0.5 opacity-60 transition-transform duration-200"
              style={{ display: 'inline-block', transform: showScore ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </span>
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={handleCopy}
          className="py-2 px-3.5 text-sm font-medium rounded-xl transition-all cursor-pointer bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] flex items-center gap-2"
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>

        {sent ? (
          <div className="py-2 px-3.5 text-sm font-medium rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
            <Check size={14} /> Sent
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="py-2 px-3.5 text-sm font-medium rounded-xl transition-all cursor-pointer animated-gradient text-white disabled:opacity-40 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] flex items-center gap-2"
          >
            {sending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send size={14} /> Send
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
