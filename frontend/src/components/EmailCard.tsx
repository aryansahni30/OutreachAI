import { useRef, useState } from 'react';
import type { EmailDraft } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface EmailCardProps {
  email: EmailDraft;
  recipientEmail: string;
  sessionToken: string | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const TONE_STYLES: Record<string, { label: string; badge: string }> = {
  casual: { label: 'Casual', badge: 'bg-emerald-500/20 text-emerald-400' },
  professional: { label: 'Professional', badge: 'bg-blue-500/20 text-blue-400' },
  concise: { label: 'Concise', badge: 'bg-amber-500/20 text-amber-400' },
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

  const handleAddAttachment = () => {
    fileInputRef.current?.click();
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
          {style.label}
        </span>
        <span className="text-xs text-zinc-500">{email.word_count} words</span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">To</p>
          <p className="text-sm text-zinc-400">{recipientEmail}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Subject</p>
          <p className="text-sm font-medium text-white">{email.subject}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Body</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{email.body}</p>
        </div>
      </div>

      {/* Attachments */}
      {!sent && (
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />

          {attachments.length > 0 && (
            <div className="space-y-1 mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-zinc-800 rounded px-2 py-1.5">
                  <span className="text-zinc-300 truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-zinc-500 hover:text-red-400 ml-2 shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddAttachment}
            className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            + Attach resume or cover letter
          </button>
        </div>
      )}

      {/* Error */}
      {sendError && (
        <p className="mt-2 text-xs text-red-400">{sendError}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>

        {sent ? (
          <div className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-emerald-500/20 text-emerald-400 text-center">
            Sent ✓
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        )}
      </div>
    </div>
  );
}
