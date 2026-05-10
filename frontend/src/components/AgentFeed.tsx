import type { SSEEvent } from '../types';

interface AgentFeedProps {
  events: SSEEvent[];
  isStreaming: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  coordinator: 'text-purple-400',
  prospect: 'text-cyan-400',
  research: 'text-amber-400',
  personalization: 'text-emerald-400',
  copywriter: 'text-pink-400',
};

const AGENT_ICONS: Record<string, string> = {
  coordinator: '\u{1F9E0}',
  prospect: '\u{1F50D}',
  research: '\u{1F4F0}',
  personalization: '\u{1F3AF}',
  copywriter: '\u{270D}\uFE0F',
};

export function AgentFeed({ events, isStreaming }: AgentFeedProps) {
  if (events.length === 0 && !isStreaming) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Agent Activity</h3>
        {isStreaming && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {events
          .filter((e) => e.status !== 'complete')
          .map((event, i) => {
            const color = AGENT_COLORS[event.agent] || 'text-zinc-400';
            const icon = AGENT_ICONS[event.agent] || '\u{2699}\uFE0F';

            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="shrink-0">{icon}</span>
                <span className={`font-medium ${color}`}>
                  {event.agent}
                </span>
                <span className="text-zinc-400">{event.message}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
