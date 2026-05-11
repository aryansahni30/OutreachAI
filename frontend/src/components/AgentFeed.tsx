import { BarChart3, Brain, Calendar, Cpu, Flame, Newspaper, Pen, Search, Shield } from 'lucide-react';
import type { SSEEvent } from '../types';

interface AgentFeedProps {
  events: SSEEvent[];
  isStreaming: boolean;
}

const AGENT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  coordinator: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Brain },
  prospect: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Search },
  research: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Newspaper },
  personalization: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Cpu },
  copywriter: { color: 'text-pink-400', bg: 'bg-pink-500/10', icon: Pen },
  gap_analyzer: { color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Shield },
  warm_path: { color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Flame },
  scorer: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: BarChart3 },
  followup: { color: 'text-teal-400', bg: 'bg-teal-500/10', icon: Calendar },
};

export function AgentFeed({ events, isStreaming }: AgentFeedProps) {
  if (events.length === 0 && !isStreaming) return null;

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Agent Terminal
          </span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary-light)] pulse-dot" />
            <span className="text-xs text-[var(--color-primary-light)] font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto font-mono text-[13px]">
        {events
          .filter((e) => e.status !== 'complete')
          .map((event, i) => {
            const config = AGENT_CONFIG[event.agent] || AGENT_CONFIG.coordinator;
            const Icon = config.icon;

            return (
              <div key={i} className="flex items-start gap-2.5 py-1">
                <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center ${config.bg} mt-0.5`}>
                  <Icon size={11} className={config.color} />
                </div>
                <span className={`font-semibold shrink-0 ${config.color}`}>
                  {event.agent}
                </span>
                <span className="text-[var(--color-text-muted)]">&gt;</span>
                <span className="text-[var(--color-text-secondary)]">{event.message}</span>
              </div>
            );
          })}

        {/* Blinking cursor when streaming */}
        {isStreaming && (
          <div className="flex items-center gap-2 py-1">
            <span className="w-2 h-4 bg-[var(--color-primary-light)] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
