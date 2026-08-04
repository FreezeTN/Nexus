import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { DND_CONDITIONS, EXHAUSTION_LEVELS } from '../../data/conditionsData';
import { ShieldAlert, Plus, X, AlertCircle, Info, Activity } from 'lucide-react';

interface ConditionsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const ConditionsPanel: React.FC<ConditionsPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const activeConditions = character.conditions || [];
  const exhaustion = character.exhaustionLevel || 0;

  const handleToggleCondition = (conditionName: string) => {
    let updated: string[];
    if (activeConditions.includes(conditionName)) {
      updated = activeConditions.filter(c => c !== conditionName);
    } else {
      updated = [...activeConditions, conditionName];
    }
    onUpdateCharacter({
      ...character,
      conditions: updated
    });
  };

  const handleSetExhaustion = (level: number) => {
    onUpdateCharacter({
      ...character,
      exhaustionLevel: level
    });
  };

  const handleClearAll = () => {
    onUpdateCharacter({
      ...character,
      conditions: [],
      exhaustionLevel: 0
    });
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <h3 className="font-serif font-bold text-stone-100 text-sm">Conditions & Status Effects</h3>
          {(activeConditions.length > 0 || exhaustion > 0) && (
            <span className="bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {activeConditions.length + (exhaustion > 0 ? 1 : 0)} Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(activeConditions.length > 0 || exhaustion > 0) && (
            <button
              onClick={handleClearAll}
              className="text-[11px] text-stone-400 hover:text-stone-200 transition underline"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 px-2.5 py-1 rounded-lg font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Status</span>
          </button>
        </div>
      </div>

      {/* Active Badges Grid */}
      {activeConditions.length === 0 && exhaustion === 0 ? (
        <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 text-center text-xs text-stone-400 font-sans">
          No active combat conditions or exhaustion penalties. Click <span className="text-amber-300 font-medium">Manage Status</span> to apply conditions like Poisoned, Prone, or Invisible.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {exhaustion > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs px-2.5 py-1 rounded-xl font-mono">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Exhaustion Lvl {exhaustion}</span>
              <button
                onClick={() => handleSetExhaustion(Math.max(0, exhaustion - 1))}
                className="hover:text-rose-100 ml-1 font-bold"
                title="Decrease Exhaustion"
              >
                ×
              </button>
            </div>
          )}

          {activeConditions.map(condName => {
            const info = DND_CONDITIONS.find(c => c.name === condName);
            return (
              <div
                key={condName}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border font-mono ${
                  info?.badgeClass || 'bg-amber-900/80 text-amber-200 border-amber-600'
                }`}
              >
                <span>{condName}</span>
                <button
                  onClick={() => handleToggleCondition(condName)}
                  className="hover:opacity-75 font-bold"
                  title={`Remove ${condName}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Rules Tooltip / Alerts */}
      {activeConditions.length > 0 && (
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-2.5 space-y-1.5 text-xs">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Mechanical Penalties Active:
          </div>
          <ul className="space-y-1 text-stone-300 list-disc list-inside">
            {activeConditions.map(condName => {
              const info = DND_CONDITIONS.find(c => c.name === condName);
              if (!info) return null;
              return (
                <li key={condName} className="text-[11px]">
                  <strong className="text-amber-200">{info.name}:</strong> {info.summary}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Manage Conditions Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-serif font-bold text-stone-100">Conditions & Exhaustion Manager</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exhaustion Selector */}
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span>Exhaustion Level (DMG Rules)</span>
                <span className="font-mono text-rose-400">Level {exhaustion} / 6</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleSetExhaustion(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                      exhaustion === lvl
                        ? 'bg-rose-600 text-stone-950 border-rose-400 shadow-md'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-600'
                    }`}
                  >
                    Lvl {lvl}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-stone-400 italic">
                {EXHAUSTION_LEVELS.find(e => e.level === exhaustion)?.effect}
              </div>
            </div>

            {/* Conditions Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Select Active Conditions:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {DND_CONDITIONS.map(cond => {
                  const isActive = activeConditions.includes(cond.name);
                  return (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => handleToggleCondition(cond.name)}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                        isActive
                          ? `${cond.colorClass} ring-1 ring-amber-500/50 shadow-md`
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{cond.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-mono bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-tight">
                        {cond.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-2 rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
