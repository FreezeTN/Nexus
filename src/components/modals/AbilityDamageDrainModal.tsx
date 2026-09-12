import React, { useState } from 'react';
import { AbilityName, CharacterData } from '../../types';
import {
  calculate35eAbilityDamageDrainSummary,
  DND35E_COMMON_POISONS,
  formatModifier,
  getAbilityModifier,
  PresetPoison
} from '../../utils/dndCalculations';
import {
  Skull,
  X,
  HeartPulse,
  Sparkles,
  Plus,
  Trash2,
  Dice5,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

interface AbilityDamageDrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollSave?: (label: string, bonus: number) => void;
}

const ABILITIES: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const AbilityDamageDrainModal: React.FC<AbilityDamageDrainModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  if (!isOpen) return null;

  const summary = calculate35eAbilityDamageDrainSummary(character);
  const [activeTab, setActiveTab] = useState<'abilities' | 'poisons'>('abilities');

  // Poison form
  const [selectedPresetId, setSelectedPresetId] = useState<string>('black_adder_venom');
  const [customPoisonName, setCustomPoisonName] = useState('');
  const [customDc, setCustomDc] = useState(13);
  const [customPrimary, setCustomPrimary] = useState('1d4 CON damage');
  const [customSecondary, setCustomSecondary] = useState('1d6 CON damage');

  const updateDamage = (ability: AbilityName, val: number) => {
    const nextDamage = { ...(character.abilityDamage || {}) };
    const clamped = Math.max(0, val);
    if (clamped === 0) {
      delete nextDamage[ability];
    } else {
      nextDamage[ability] = clamped;
    }
    onUpdateCharacter({
      ...character,
      abilityDamage: nextDamage
    });
  };

  const updateDrain = (ability: AbilityName, val: number) => {
    const nextDrain = { ...(character.abilityDrain || {}) };
    const clamped = Math.max(0, val);
    if (clamped === 0) {
      delete nextDrain[ability];
    } else {
      nextDrain[ability] = clamped;
    }
    onUpdateCharacter({
      ...character,
      abilityDrain: nextDrain
    });
  };

  // Quick healing helpers
  const handleNaturalRest = (amount: number = 1) => {
    const nextDamage = { ...(character.abilityDamage || {}) };
    for (const ab of ABILITIES) {
      if (nextDamage[ab]) {
        nextDamage[ab] = Math.max(0, nextDamage[ab]! - amount);
        if (nextDamage[ab] === 0) delete nextDamage[ab];
      }
    }
    onUpdateCharacter({
      ...character,
      abilityDamage: nextDamage
    });
  };

  const handleLesserRestoration = (ability: AbilityName) => {
    const roll = Math.floor(Math.random() * 4) + 1; // 1d4
    const cur = character.abilityDamage?.[ability] || 0;
    const nextVal = Math.max(0, cur - roll);
    updateDamage(ability, nextVal);
  };

  const handleFullRestoration = () => {
    onUpdateCharacter({
      ...character,
      abilityDamage: {},
      abilityDrain: {}
    });
  };

  // Poison / Disease methods
  const handleAddPresetPoison = () => {
    const preset = DND35E_COMMON_POISONS.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    const newToxin = {
      id: `toxin-${Date.now()}`,
      name: preset.name,
      type: 'poison' as const,
      source: preset.source,
      dc: preset.dc,
      saveType: preset.saveType,
      primaryEffect: preset.primaryEffect,
      secondaryEffect: preset.secondaryEffect,
      incubationRoundsRemaining: 10, // 1 minute = 10 rounds in 3.5e
      roundsElapsed: 0,
      notes: preset.description
    };
    onUpdateCharacter({
      ...character,
      activePoisonsDiseases: [...(character.activePoisonsDiseases || []), newToxin]
    });
  };

  const handleAddCustomPoison = () => {
    if (!customPoisonName.trim()) return;
    const newToxin = {
      id: `toxin-${Date.now()}`,
      name: customPoisonName.trim(),
      type: 'poison' as const,
      dc: customDc,
      saveType: 'Fortitude' as const,
      primaryEffect: customPrimary,
      secondaryEffect: customSecondary,
      incubationRoundsRemaining: 10,
      roundsElapsed: 0
    };
    onUpdateCharacter({
      ...character,
      activePoisonsDiseases: [...(character.activePoisonsDiseases || []), newToxin]
    });
    setCustomPoisonName('');
  };

  const handleAdvanceRounds = (roundsToAdvance: number) => {
    const list = (character.activePoisonsDiseases || []).map((item) => {
      if (item.isResolved) return item;
      const nextRemaining = Math.max(0, item.incubationRoundsRemaining - roundsToAdvance);
      const nextElapsed = item.roundsElapsed + roundsToAdvance;
      return {
        ...item,
        incubationRoundsRemaining: nextRemaining,
        roundsElapsed: nextElapsed
      };
    });
    onUpdateCharacter({
      ...character,
      activePoisonsDiseases: list
    });
  };

  const handleRemoveToxin = (id: string) => {
    const filtered = (character.activePoisonsDiseases || []).filter((t) => t.id !== id);
    onUpdateCharacter({
      ...character,
      activePoisonsDiseases: filtered
    });
  };

  const handleApplySecondaryDamage = (toxinId: string, ability: AbilityName, diceExpression: string) => {
    // Parse expression e.g. 1d6, 2d6, 1d4
    let dmg = 2;
    const match = diceExpression.match(/([0-9]+)d([0-9]+)/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const die = parseInt(match[2], 10);
      dmg = 0;
      for (let i = 0; i < count; i++) {
        dmg += Math.floor(Math.random() * die) + 1;
      }
    } else {
      dmg = parseInt(diceExpression, 10) || 2;
    }

    const cur = character.abilityDamage?.[ability] || 0;
    const nextDamage = { ...(character.abilityDamage || {}), [ability]: cur + dmg };

    const updatedToxins = (character.activePoisonsDiseases || []).map((t) =>
      t.id === toxinId ? { ...t, isResolved: true, secondarySavePassed: false } : t
    );

    onUpdateCharacter({
      ...character,
      abilityDamage: nextDamage,
      activePoisonsDiseases: updatedToxins
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-stone-900 to-stone-900 p-4 border-b border-emerald-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                Ability Damage, Drain & Poison Tracker
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 rounded-full font-bold">
                  D&D 3.5e
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Temporary damage vs. permanent drain, restorative magic & secondary poison saves
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-stone-800 bg-stone-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('abilities')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'abilities'
                ? 'border-emerald-500 text-emerald-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Ability Scores Status {summary.totalDamage + summary.totalDrain > 0 && `(–${summary.totalDamage + summary.totalDrain})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('poisons')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'poisons'
                ? 'border-emerald-500 text-emerald-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Active Toxins & Poisons ({character.activePoisonsDiseases?.length || 0})</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'abilities' ? (
            <>
              {/* Overview & Quick Heals */}
              <div className="bg-stone-950/70 border border-stone-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-stone-400">
                    Total Damage: <span className="text-amber-400 font-bold">{summary.totalDamage}</span> | Total Drain: <span className="text-red-400 font-bold">{summary.totalDrain}</span>
                  </div>
                  {summary.conHpPenalty > 0 && (
                    <div className="text-xs text-red-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Constitution Penalty: Max & Current HP reduced by –{summary.conHpPenalty}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNaturalRest(1)}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition flex items-center gap-1"
                    title="8 hours of rest restores 1 point of temporary ability damage to each damaged score"
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Night's Rest (+1 All)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNaturalRest(2)}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition"
                    title="24 hours of complete bed rest restores 2 points of temporary ability damage"
                  >
                    <span>Bed Rest (+2 All)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFullRestoration}
                    className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    title="Cures all ability damage and all ability drain"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restoration Spell</span>
                  </button>
                </div>
              </div>

              {/* Ability Breakdown Table */}
              <div className="space-y-2">
                {ABILITIES.map((ab) => {
                  const base = character.abilities?.[ab]?.score || 10;
                  const damage = character.abilityDamage?.[ab] || 0;
                  const drain = character.abilityDrain?.[ab] || 0;
                  const effective = Math.max(0, base - damage - drain);
                  const effectiveMod = getAbilityModifier(effective);
                  const baseMod = getAbilityModifier(base);

                  return (
                    <div
                      key={ab}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        damage > 0 || drain > 0
                          ? 'bg-stone-950/90 border-red-900/40'
                          : 'bg-stone-950/40 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 text-center">
                          <span className="text-xs font-bold text-stone-400 block font-mono">{ab}</span>
                          <span className="text-lg font-mono font-bold text-stone-100">{base}</span>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-stone-400">Effective:</span>
                            <span className={`font-bold text-sm ${effective < base ? 'text-red-400' : 'text-stone-200'}`}>
                              {effective}
                            </span>
                            <span className="text-amber-400 font-bold">
                              ({formatModifier(effectiveMod)})
                            </span>
                            {effectiveMod < baseMod && (
                              <span className="text-[10px] text-red-400">
                                ({effectiveMod - baseMod} penalty)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {ab === 'CON' && damage + drain > 0 && 'Reduces HP by 1/level per 2 points of damage'}
                            {ab === 'STR' && damage + drain > 0 && 'Reduces carrying capacity & melee damage'}
                            {ab === 'DEX' && damage + drain > 0 && 'Reduces AC, Reflex saves, and ranged attacks'}
                          </div>
                        </div>
                      </div>

                      {/* Damage / Drain adjusters */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Temporary Damage */}
                        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
                          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Dmg:</span>
                          <button
                            type="button"
                            onClick={() => updateDamage(ab, damage - 1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-bold flex items-center justify-center text-xs"
                          >
                            –
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-amber-300 text-xs">
                            {damage}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDamage(ab, damage + 1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Permanent Drain */}
                        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-lg border border-stone-800">
                          <span className="text-[10px] font-mono text-red-400 uppercase font-bold">Drain:</span>
                          <button
                            type="button"
                            onClick={() => updateDrain(ab, drain - 1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-bold flex items-center justify-center text-xs"
                          >
                            –
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-red-300 text-xs">
                            {drain}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDrain(ab, drain + 1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Quick Lesser Restoration */}
                        {damage > 0 && (
                          <button
                            type="button"
                            onClick={() => handleLesserRestoration(ab)}
                            className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/40 text-amber-200 text-[10px] font-bold rounded-lg transition"
                            title="Lesser Restoration (heals 1d4 temporary damage to this score)"
                          >
                            Lesser Rest (1d4)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Active Poisons & Toxins Sub-Panel */
            <div className="space-y-4">
              {/* Ticker bar */}
              <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-stone-200">
                    Incubation Time Advancement (3.5e: 1 minute = 10 combat rounds)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdvanceRounds(1)}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition"
                  >
                    +1 Round
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceRounds(10)}
                    className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/40 text-amber-200 text-xs font-bold rounded-lg transition"
                  >
                    +10 Rounds (1 Min)
                  </button>
                </div>
              </div>

              {/* Active Toxins List */}
              <div className="space-y-2">
                {(!character.activePoisonsDiseases || character.activePoisonsDiseases.length === 0) ? (
                  <div className="text-center py-6 text-stone-500 text-xs bg-stone-950/30 rounded-xl border border-stone-800">
                    No active poisons or diseases affecting the character.
                  </div>
                ) : (
                  character.activePoisonsDiseases.map((toxin) => {
                    const isDue = toxin.incubationRoundsRemaining <= 0 && !toxin.isResolved;

                    return (
                      <div
                        key={toxin.id}
                        className={`p-3 rounded-xl border space-y-2 ${
                          isDue
                            ? 'bg-red-950/30 border-red-700/60 animate-pulse'
                            : toxin.isResolved
                            ? 'bg-stone-950/30 border-stone-800 opacity-60'
                            : 'bg-stone-950/80 border-stone-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skull className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-bold text-stone-100">{toxin.name}</span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                              DC {toxin.dc} Fortitude
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-stone-400">
                              {toxin.isResolved
                                ? 'Resolved'
                                : `${toxin.incubationRoundsRemaining} rounds until 2nd save`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveToxin(toxin.id)}
                              className="p-1 text-stone-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-400 grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono">
                          <div>Primary (Initial): <span className="text-stone-200">{toxin.primaryEffect}</span></div>
                          <div>Secondary (1 Min): <span className="text-amber-300 font-bold">{toxin.secondaryEffect}</span></div>
                        </div>

                        {/* Secondary Save Trigger & Apply */}
                        {isDue && (
                          <div className="p-2.5 bg-red-950/70 border border-red-600/50 rounded-lg flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-red-200 font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              1 Minute Elapsed! Roll Secondary Fortitude Save vs DC {toxin.dc}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Auto apply secondary
                                  const ab: AbilityName = toxin.secondaryEffect.toUpperCase().includes('STR')
                                    ? 'STR'
                                    : toxin.secondaryEffect.toUpperCase().includes('DEX')
                                    ? 'DEX'
                                    : 'CON';
                                  handleApplySecondaryDamage(toxin.id, ab, toxin.secondaryEffect);
                                }}
                                className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-stone-100 text-xs font-bold rounded-lg transition"
                              >
                                Save Failed: Apply {toxin.secondaryEffect}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (character.activePoisonsDiseases || []).map((t) =>
                                    t.id === toxin.id ? { ...t, isResolved: true, secondarySavePassed: true } : t
                                  );
                                  onUpdateCharacter({ ...character, activePoisonsDiseases: updated });
                                }}
                                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-bold rounded-lg transition"
                              >
                                Save Passed (0 Dmg)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Poison Presets / Custom */}
              <div className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-xl space-y-3">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                  Add 3.5e SRD Poison or Custom Toxin
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:border-emerald-500 outline-none flex-1 min-w-[200px]"
                  >
                    {DND35E_COMMON_POISONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (DC {p.dc}, {p.primaryEffect} / {p.secondaryEffect})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPresetPoison}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Infect with Preset</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-400 font-mono">
            3.5e Rule: Ability Damage heals at 1 point per day of natural rest; Ability Drain requires Restoration.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
