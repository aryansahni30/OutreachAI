import { AlertTriangle, ArrowUpRight, ChevronRight, Shield } from 'lucide-react';
import type { GapAnalysis } from '../types';

interface GapAnalysisCardProps {
  analysis: GapAnalysis;
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string }> = {
  high: { dot: 'bg-red-400', text: 'text-red-400' },
  medium: { dot: 'bg-amber-400', text: 'text-amber-400' },
  low: { dot: 'bg-zinc-500', text: 'text-zinc-500' },
};

export function GapAnalysisCard({ analysis }: GapAnalysisCardProps) {
  const matchColor =
    analysis.match_percentage >= 70 ? 'text-emerald-400' :
    analysis.match_percentage >= 40 ? 'text-amber-400' : 'text-red-400';

  const matchBg =
    analysis.match_percentage >= 70 ? 'bg-emerald-500/10' :
    analysis.match_percentage >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] overflow-hidden">
      {/* Header with match score */}
      <div className="p-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Shield size={18} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Resume Match Analysis</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Skills vs. company requirements</p>
          </div>
        </div>
        <div className={`text-right px-4 py-2 rounded-xl ${matchBg}`}>
          <p className={`text-2xl font-bold ${matchColor}`}>{analysis.match_percentage}%</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">match</p>
        </div>
      </div>

      {/* Strategy */}
      {analysis.strategy && (
        <div className="px-5 py-3 bg-[var(--color-primary)]/5 border-b border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-primary-light)] flex items-start gap-2">
            <ChevronRight size={14} className="shrink-0 mt-0.5" />
            <span className="font-medium">{analysis.strategy}</span>
          </p>
        </div>
      )}

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ArrowUpRight size={12} />
              Strengths to Lead With
            </h4>
            <div className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium text-[var(--color-text-primary)]">{s.skill}</p>
                  {s.relevance && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.relevance}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {analysis.gaps.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Gaps & Reframes
            </h4>
            <div className="space-y-2.5">
              {analysis.gaps.map((g, i) => {
                const style = SEVERITY_STYLES[g.severity] || SEVERITY_STYLES.medium;
                return (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className={`font-medium ${style.text}`}>{g.skill}</span>
                    </div>
                    {g.reframe && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 ml-3.5">{g.reframe}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
