import { useState } from 'react';
import { Calendar, Check, Copy } from 'lucide-react';
import type { FollowUpResult } from '../types';

interface FollowUpTimelineProps {
  result: FollowUpResult;
  initialSubject: string;
}

export function FollowUpTimeline({ result, initialSubject }: FollowUpTimelineProps) {
  if (!result.sequence || result.sequence.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-5 flex items-center gap-3 border-b border-[var(--color-border-subtle)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Calendar size={18} className="text-[var(--color-primary-light)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Follow-up Sequence</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Automated timing with value-add at each step</p>
        </div>
      </div>

      <div className="p-5">
        {/* Timeline */}
        <div className="space-y-0">
          {/* Day 0 — initial email */}
          <TimelineNode
            day={0}
            label="Initial Email"
            subject={initialSubject}
            isFirst
            isSent
          />

          {result.sequence.map((followup, i) => (
            <TimelineNode
              key={i}
              day={followup.day}
              label={followup.day === 3 ? 'Value Add' : 'Soft Close'}
              subject={followup.subject}
              body={followup.body}
              strategy={followup.strategy}
              wordCount={followup.word_count}
              isLast={i === result.sequence.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TimelineNodeProps {
  day: number;
  label: string;
  subject: string;
  body?: string;
  strategy?: string;
  wordCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  isSent?: boolean;
}

function TimelineNode({ day, label, subject, body, strategy, wordCount, isFirst, isLast, isSent }: TimelineNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!body) return;
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
          isSent
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]'
        }`}>
          {isSent ? <Check size={14} /> : `D${day}`}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[var(--color-border-subtle)] min-h-[20px]" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'} ${isFirst ? '' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Day {day}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <span className="text-xs text-[var(--color-primary-light)] font-medium">{label}</span>
          {wordCount && <span className="text-xs text-[var(--color-text-muted)]">· {wordCount}w</span>}
        </div>

        <p className="text-sm font-medium text-[var(--color-text-primary)]">{subject}</p>

        {strategy && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">{strategy}</p>
        )}

        {body && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[var(--color-primary-light)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
            >
              {expanded ? 'Hide preview' : 'Show preview'}
            </button>

            {expanded && (
              <div className="mt-2 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{body}</p>
                <button
                  onClick={handleCopy}
                  className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer transition-colors"
                >
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
