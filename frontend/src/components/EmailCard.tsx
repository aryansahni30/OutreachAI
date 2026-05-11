import { useRef, useState } from 'react';
import { Check, Copy, Paperclip, Send, X } from 'lucide-react';
import type { EmailDraft } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface EmailCardProps {
  email: EmailDraft;
  recipientEmail: string;
  sessionToken: string | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const TONE_STYLES: Record<string, { label: string; badge: string; border: string }> = {
  casual: { label: 'Casual', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', border: 'hover:border-emerald-500/30' },
  professional: { label: 'Professional', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', border: 'hover:border-blue-500/30' },
  concise: { label: 'Concise', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', border: 'hover:border-amber-500/30' },
};

export function EmailCard({
  email,
  recipientEmail,
  sessionToken,
  isLoggedIn,
  onLoginRequired,
}: EmailCardProps) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = TONE_STYLES[email.tone] || TONE_STYLES.professional;
  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;

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
    <div className={`rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5 sm:p-6 transition-all ${style.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${style.badge}`}>
          {style.label}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{email.word_count} words</span>
      </div>

      {/* Email content */}
      <div className="space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">To</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{recipientEmail}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Subject</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{email.subject}</p>
        </div>
        <div className="pt-2 border-t border-[var(--color-border-subtle)]">
          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{email.body}</p>
        </div>
      </div>

      {/* Attachments */}
      {!sent && (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />

          {attachments.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2">
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

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            <Paperclip size={12} />
            Attach resume or cover letter
          </button>
        </div>
      )}

      {sendError && (
        <p className="mt-3 text-xs text-red-400">{sendError}</p>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-2.5">
        <button
          onClick={handleCopy}
          className="flex-1 py-2.5 px-3 text-sm font-medium rounded-xl transition-all cursor-pointer bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-2"
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>

        {sent ? (
          <div className="flex-1 py-2.5 px-3 text-sm font-medium rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2">
            <Check size={14} /> Sent
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-2.5 px-3 text-sm font-medium rounded-xl transition-all cursor-pointer animated-gradient text-white disabled:opacity-40 hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
          >
            {sending ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending</>
            ) : (
              <><Send size={14} /> Send Email</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
