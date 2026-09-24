import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { DND_CONDITIONS, EXHAUSTION_LEVELS } from '../../data/conditionsData';
import { getConditionEffects } from '../../utils/dndCalculations';
import { LINGERING_INJURIES_PRESETS, isPermanentInjury } from '../../utils/characterSessionSync';
import { ShieldAlert, Plus, X, AlertCircle, Info, Activity, HeartCrack } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface ConditionsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const ConditionsPanel: React.FC<ConditionsPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'conditions' | 'injuries'>('conditions');
  const activeConditions = character.conditions || [];
  const lingeringInjuries = character.lingeringInjuries || [];
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

  const handleToggleLingeringInjury = (injuryName: string) => {
    let updatedInjuries: string[];
    const exists = lingeringInjuries.includes(injuryName);
    if (exists) {
      updatedInjuries = lingeringInjuries.filter(i => i !== injuryName);
    } else {
      updatedInjuries = [...lingeringInjuries, injuryName];
    }

    // Check if hands modifier applies
    const isLostArm = updatedInjuries.some(i => i.toLowerCase().includes('lost arm') || i.toLowerCase().includes('one-armed') || i.toLowerCase().includes('severed arm'));
    const isLostBothArms = updatedInjuries.some(i => i.toLowerCase().includes('lost both arms') || i.toLowerCase().includes('no arms'));

    let handsOverride: number | undefined = character.handsCountOverride;
    if (isLostBothArms) {
      handsOverride = 0;
    } else if (isLostArm) {
      handsOverride = 1;
    } else if (character.handsCountOverride !== undefined && !isLostArm && !isLostBothArms) {
      handsOverride = undefined;
    }

    onUpdateCharacter({
      ...character,
      lingeringInjuries: updatedInjuries,
      handsCountOverride: handsOverride
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
          <h3 className="font-serif font-bold text-stone-100 text-sm">{t('combat.statusEffects', 'Conditions & Status Effects')}</h3>
          {(activeConditions.length > 0 || exhaustion > 0 || lingeringInjuries.length > 0) && (
            <span className="bg-rose-950 text-rose-300 border border-rose-600/50 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {activeConditions.length + (exhaustion > 0 ? 1 : 0) + lingeringInjuries.length} Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(activeConditions.length > 0 || exhaustion > 0) && (
            <button
              onClick={handleClearAll}
              className="text-[11px] text-stone-400 hover:text-stone-200 transition underline"
            >
              {t('common.clear', 'Clear Combat Conditions')}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 px-2.5 py-1 rounded-lg font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('combat.statusEffects', 'Manage Status & Injuries')}</span>
          </button>
        </div>
      </div>

      {/* Active Badges Grid */}
      {activeConditions.length === 0 && exhaustion === 0 && lingeringInjuries.length === 0 ? (
        <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 text-center text-xs text-stone-400 font-sans">
          No active combat conditions, exhaustion, or lingering injuries. Click <span className="text-amber-300 font-medium">Manage Status & Injuries</span> to apply effects.
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

          {/* Lingering Permanent Injuries & Lost Limbs */}
          {lingeringInjuries.map(injury => (
            <div
              key={injury}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border font-mono bg-red-950/90 text-red-200 border-red-600 shadow-sm"
              title="Permanent Lingering Injury (Persists on Base Character)"
            >
              <HeartCrack className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{injury} (Permanent)</span>
              <button
                onClick={() => handleToggleLingeringInjury(injury)}
                className="hover:text-red-100 font-bold ml-0.5"
                title={`Remove ${injury}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Standard Combat Conditions */}
          {activeConditions.map(condName => {
            const info = DND_CONDITIONS.find(c => c.name === condName);
            const isPerm = isPermanentInjury(condName);
            return (
              <div
                key={condName}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border font-mono ${
                  isPerm
                    ? 'bg-red-950/90 text-red-200 border-red-600'
                    : info?.badgeClass || 'bg-amber-900/80 text-amber-200 border-amber-600'
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
      {(activeConditions.length > 0 || exhaustion > 0 || lingeringInjuries.length > 0) && (
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-2.5 space-y-1.5 text-xs">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Active Status Penalties & Modifications:
          </div>
          <ul className="space-y-1 text-stone-300 list-disc list-inside">
            {lingeringInjuries.map(injury => {
              const preset = LINGERING_INJURIES_PRESETS.find(p => p.name === injury);
              return (
                <li key={injury} className="text-[11px] text-red-300 font-sans">
                  <strong>{injury}:</strong> {preset?.description || 'Permanent injury affecting combat capacity.'}
                </li>
              );
            })}
            {getConditionEffects(activeConditions, exhaustion).mechanicalSummary.map((summaryItem, idx) => (
              <li key={idx} className="text-[11px] text-amber-200/90 font-sans">
                {summaryItem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manage Conditions & Injuries Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-serif font-bold text-stone-100">
                  Conditions, Exhaustion & Lingering Injuries
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
              <button
                type="button"
                onClick={() => setModalTab('conditions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  modalTab === 'conditions'
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Combat Conditions & Exhaustion
              </button>
              <button
                type="button"
                onClick={() => setModalTab('injuries')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modalTab === 'injuries'
                    ? 'bg-red-700 text-white shadow'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <HeartCrack className="w-3.5 h-3.5" />
                <span>Lost Limbs & Lingering Injuries</span>
                {lingeringInjuries.length > 0 && (
                  <span className="bg-red-950 text-red-200 text-[10px] px-1.5 rounded-full font-mono">
                    {lingeringInjuries.length}
                  </span>
                )}
              </button>
            </div>

            {modalTab === 'conditions' ? (
              <>
                {/* Exhaustion Selector */}
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                    <span>{character.edition === '3.5e' ? 'Exhaustion / Fatigue Level (3.5e & 5e RAW)' : 'Exhaustion Level (PHB p. 291 / DMG Rules)'}</span>
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
              </>
            ) : (
              /* Lingering Injuries Tab */
              <div className="space-y-3">
                <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-xs text-red-200 leading-relaxed">
                  <strong>Permanent Bodily Changes & Lost Limbs:</strong> Unlike temporary combat debuffs, permanent lingering injuries carry over to your Base Character. Lost limbs automatically limit available hand slots for weapon wielding and shield carrying.
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Anatomical Injuries & Lost Limbs:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {LINGERING_INJURIES_PRESETS.map(preset => {
                      const isActive = lingeringInjuries.includes(preset.name);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleToggleLingeringInjury(preset.name)}
                          className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                            isActive
                              ? 'bg-red-950/80 border-red-500 text-red-100 ring-1 ring-red-500 shadow-md'
                              : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              <HeartCrack className="w-3.5 h-3.5 text-red-400" />
                              <span>{preset.name}</span>
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-mono bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                                INJURED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 leading-tight">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
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
