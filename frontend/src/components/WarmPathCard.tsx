import { Flame, Link2, Sparkles, Users } from 'lucide-react';
import type { WarmPathResult } from '../types';

interface WarmPathCardProps {
  result: WarmPathResult;
}

const STRENGTH_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strong: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Strong' },
  medium: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Medium' },
  weak: { bg: 'bg-zinc-500/10 border-zinc-500/20', text: 'text-zinc-400', label: 'Weak' },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  direct: Link2,
  indirect: Sparkles,
  cultural: Flame,
  mutual_contact: Users,
};

export function WarmPathCard({ result }: WarmPathCardProps) {
  if (!result.warm_paths || result.warm_paths.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-5 flex items-center gap-3 border-b border-[var(--color-border-subtle)]">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.is_warm ? 'bg-emerald-500/10' : 'bg-zinc-500/10'}`}>
          <Flame size={18} className={result.is_warm ? 'text-emerald-400' : 'text-zinc-500'} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {result.is_warm ? 'Warm Connections Found' : 'Connection Analysis'}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {result.is_warm
              ? 'Shared history detected — use these to warm up your outreach'
              : 'No strong direct connections — emails will emphasize value instead'}
          </p>
        </div>
      </div>

      {/* Warmest path highlight */}
      {result.warmest_path && (
        <div className="px-5 py-3 bg-emerald-500/5 border-b border-[var(--color-border-subtle)]">
          <p className="text-xs font-medium text-emerald-400 flex items-start gap-2">
            <Sparkles size={13} className="shrink-0 mt-0.5" />
            Lead with: {result.warmest_path}
          </p>
        </div>
      )}

      {/* Mutual LinkedIn Contacts */}
      {result.mutual_contacts?.length > 0 && (
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <h4 className="text-xs font-semibold text-[var(--color-primary-light)] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users size={12} />
            Mutual LinkedIn Contacts at Target Company
          </h4>
          <div className="space-y-2">
            {result.mutual_contacts.map((contact, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary-light)]">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{contact.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{contact.title} · {contact.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        {result.warm_paths.map((path, i) => {
          const style = STRENGTH_STYLES[path.strength] || STRENGTH_STYLES.weak;
          const Icon = TYPE_ICONS[path.type] || Sparkles;

          return (
            <div key={i} className={`rounded-xl border p-3.5 ${style.bg}`}>
              <div className="flex items-start gap-3">
                <Icon size={14} className={`${style.text} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{path.connection}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.bg} ${style.text} border font-semibold`}>
                      {style.label}
                    </span>
                  </div>
                  {path.suggested_mention && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{path.suggested_mention}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
