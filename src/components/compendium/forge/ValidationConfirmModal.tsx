import React from 'react';
import { ValidationResult } from '../../../utils/homebrewValidator';
import { AlertOctagon, AlertTriangle, X, ShieldAlert, ArrowLeft, Check } from 'lucide-react';

interface ValidationConfirmModalProps {
  isOpen: boolean;
  entryName: string;
  category: string;
  validation: ValidationResult;
  onProceedAnyway: () => void;
  onCancel: () => void;
}

export const ValidationConfirmModal: React.FC<ValidationConfirmModalProps> = ({
  isOpen,
  entryName,
  category,
  validation,
  onProceedAnyway,
  onCancel
}) => {
  if (!isOpen) return null;

  const criticalIssues = validation.issues.filter(i => i.severity === 'critical');
  const warningIssues = validation.issues.filter(i => i.severity === 'warning');

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-red-500/70 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/80 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-red-300">
                Game-Breaking Balance Warning
              </h3>
              <p className="text-xs text-stone-400">
                Homebrew Forge Balance & Bounded Accuracy Guard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-200 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Text */}
        <div className="text-xs space-y-2 text-stone-300 leading-relaxed">
          <p>
            You are attempting to add <strong className="text-amber-300 font-serif font-bold">"{entryName || 'Untitled'}"</strong> ({category}) to your compendium, but the validation engine detected extreme stat or power anomalies that may break encounter math and game balance:
          </p>

          {/* List of critical issues */}
          <div className="bg-red-950/40 border border-red-700/60 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
            {criticalIssues.map((issue) => (
              <div key={issue.id} className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{issue.title}</span>
                </div>
                <p className="text-[11px] text-red-200/90 pl-5">
                  {issue.message}
                </p>
                {issue.suggestion && (
                  <p className="text-[10px] text-amber-300/90 pl-5 italic">
                    💡 Tip: {issue.suggestion}
                  </p>
                )}
              </div>
            ))}

            {warningIssues.slice(0, 2).map((issue) => (
              <div key={issue.id} className="text-xs space-y-0.5 pt-1.5 border-t border-red-900/60">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{issue.title}</span>
                </div>
                <p className="text-[11px] text-stone-300 pl-5">
                  {issue.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return & Adjust Stats</span>
          </button>

          <button
            type="button"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/60 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Anyway (Override)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
