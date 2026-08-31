import React, { useState } from 'react';
import { ValidationResult, ValidationIssue } from '../../../utils/homebrewValidator';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Scale
} from 'lucide-react';

interface ValidationBadgeBannerProps {
  validation: ValidationResult;
  categoryLabel?: string;
  className?: string;
}

export const ValidationBadgeBanner: React.FC<ValidationBadgeBannerProps> = ({
  validation,
  categoryLabel = 'Homebrew Entry',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { isValid, hasWarnings, hasCritical, score, issues } = validation;

  // Determine overall status color & theme
  let statusBg = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
  let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let icon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  let statusText = 'Mechanically Balanced & SRD Compliant';

  if (hasCritical) {
    statusBg = 'bg-red-950/60 border-red-500/60 text-red-200';
    badgeBg = 'bg-red-500/20 text-red-300 border-red-500/50';
    icon = <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />;
    statusText = 'Game-Breaking Stat / Rule Violations Detected';
  } else if (hasWarnings) {
    statusBg = 'bg-amber-950/40 border-amber-500/50 text-amber-200';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
    statusText = 'Balance Notices & High Stat Increment Warnings';
  } else if (issues.length > 0) {
    statusBg = 'bg-sky-950/40 border-sky-500/40 text-sky-200';
    badgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    icon = <Info className="w-4 h-4 text-sky-400" />;
    statusText = 'Formatting & Optimization Suggestions';
  }

  return (
    <div className={`border rounded-xl p-3 transition-all ${statusBg} ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xs sm:text-sm">
                Forge Balance Guard
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${badgeBg}`}>
                {hasCritical ? 'Critical Issues' : hasWarnings ? 'Balance Warning' : 'Balanced'}
              </span>
            </div>
            <p className="text-[11px] opacity-90">{statusText}</p>
          </div>
        </div>

        {/* Balance Score & Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-stone-800">
            <Scale className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-400">Balance Rating:</span>
            <span className={`font-bold ${
              score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {score}/100
            </span>
          </div>

          {issues.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/60 transition flex items-center gap-1 border border-stone-800"
            >
              <span>{issues.length} {issues.length === 1 ? 'Notice' : 'Notices'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Issues Diagnostic List */}
      {isExpanded && issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-stone-300 mb-1">
            Diagnostic Breakdown for this {categoryLabel}:
          </div>

          <div className="space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-2.5 rounded-lg border ${
                  issue.severity === 'critical'
                    ? 'bg-red-950/40 border-red-600/50 text-red-100'
                    : issue.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-100'
                    : 'bg-stone-900/60 border-stone-700/50 text-stone-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  {issue.severity === 'critical' && <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  {issue.severity === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {issue.severity === 'info' && <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  <span>{issue.title}</span>
                </div>

                <p className="text-[11px] leading-relaxed opacity-95">
                  {issue.message}
                </p>

                {issue.suggestion && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[11px] flex items-start gap-1.5 text-stone-300">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-amber-300">Recommendation:</strong> {issue.suggestion}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
