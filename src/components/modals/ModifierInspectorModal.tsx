import React, { useState, useMemo } from 'react';
import { CharacterData } from '../../types';
import {
  UniversalModifierEngine,
  ModifierTarget,
  BUILTIN_BUFF_PRESETS,
  DomainModifier,
  ModifierStackingRule
} from '../../domain/modifierEngine';
import {
  Shield,
  Sparkles,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ModifierInspectorModalProps {
  isOpen?: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  initialTarget?: ModifierTarget;
}

const TARGET_OPTIONS: { target: ModifierTarget; label: string; group: string }[] = [
  { target: 'ac', label: 'Armor Class (AC)', group: 'Core Defenses' },
  { target: 'initiative', label: 'Initiative Modifier', group: 'Core Defenses' },
  { target: 'speed', label: 'Speed (ft)', group: 'Core Defenses' },
  { target: 'attack.all', label: 'All Attack Rolls', group: 'Combat Offense' },
  { target: 'attack.melee', label: 'Melee Weapon Attacks', group: 'Combat Offense' },
  { target: 'attack.ranged', label: 'Ranged Weapon Attacks', group: 'Combat Offense' },
  { target: 'attack.spell', label: 'Spell Attack Rolls', group: 'Combat Offense' },
  { target: 'saving_throw.STR', label: 'Strength Save', group: 'Saving Throws' },
  { target: 'saving_throw.DEX', label: 'Dexterity Save', group: 'Saving Throws' },
  { target: 'saving_throw.CON', label: 'Constitution Save', group: 'Saving Throws' },
  { target: 'saving_throw.INT', label: 'Intelligence Save', group: 'Saving Throws' },
  { target: 'saving_throw.WIS', label: 'Wisdom Save', group: 'Saving Throws' },
  { target: 'saving_throw.CHA', label: 'Charisma Save', group: 'Saving Throws' },
  { target: 'skill.stealth', label: 'Stealth Skill Check', group: 'Skills' },
  { target: 'skill.perception', label: 'Perception Skill Check', group: 'Skills' }
];

export const ModifierInspectorModal: React.FC<ModifierInspectorModalProps> = ({
  isOpen = true,
  onClose,
  character,
  onUpdateCharacter,
  initialTarget = 'ac'
}) => {
  const [selectedTarget, setSelectedTarget] = useState<ModifierTarget>(initialTarget);
  const [activeTab, setActiveTab] = useState<'inspector' | 'buffs' | 'custom'>('inspector');

  // Custom Modifier Form
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState(1);
  const [customRule, setCustomRule] = useState<ModifierStackingRule>('additive');
  const [customDice, setCustomDice] = useState('');

  if (!isOpen) return null;

  const evaluation = UniversalModifierEngine.evaluate(selectedTarget, character);
  const activeConditions = character.conditions || [];

  const handleToggleBuff = (buffName: string) => {
    const exists = activeConditions.some(c => c.toLowerCase() === buffName.toLowerCase());
    let updatedConditions: string[];
    if (exists) {
      updatedConditions = activeConditions.filter(c => c.toLowerCase() !== buffName.toLowerCase());
    } else {
      updatedConditions = [...activeConditions, buffName];
    }
    onUpdateCharacter({
      ...character,
      conditions: updatedConditions
    });
  };

  const handleAddCustomModifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLabel.trim()) return;

    const newMod: DomainModifier = {
      id: `custom_mod_${Date.now()}`,
      label: customLabel.trim(),
      target: selectedTarget,
      category: 'custom',
      value: customValue,
      diceFormula: customDice.trim() ? customDice.trim() : undefined,
      stackingRule: customRule,
      source: 'Custom / Homebrew Modifier',
      isTemporary: true
    };

    const existingCustom = ((character as any).customModifiers || []) as DomainModifier[];
    const updatedCharacter = {
      ...character,
      customModifiers: [...existingCustom, newMod]
    };
    onUpdateCharacter(updatedCharacter as CharacterData);

    setCustomLabel('');
    setCustomValue(1);
    setCustomDice('');
  };

  const handleRemoveCustomModifier = (modId: string) => {
    const existingCustom = ((character as any).customModifiers || []) as DomainModifier[];
    const filtered = existingCustom.filter(m => m.id !== modId);
    onUpdateCharacter({
      ...character,
      customModifiers: filtered
    } as CharacterData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-amber-200">Universal Stacking Modifier Engine</h2>
              <p className="text-[11px] text-stone-400">Mathematical priority, stacking conflict resolution & live audit trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-2.5 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Live Stat Inspector
          </button>
          <button
            onClick={() => setActiveTab('buffs')}
            className={`py-2.5 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'buffs'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Quick Buffs & Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2.5 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Plus className="w-4 h-4" /> Custom Modifiers
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-stone-200 text-xs">
          {/* Target Selector Dropdown */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-bold text-stone-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> Inspected Target Metric:
            </span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value as ModifierTarget)}
              className="bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-amber-200 font-bold font-mono focus:border-amber-500 outline-none"
            >
              {TARGET_OPTIONS.map(opt => (
                <option key={opt.target} value={opt.target}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              {/* Primary Value Evaluation Card */}
              <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border border-amber-500/40 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    Evaluated Final Result
                  </span>
                  <div className="text-3xl font-serif font-extrabold text-amber-300 flex items-baseline gap-2">
                    {evaluation.finalValue}
                    {evaluation.effectiveBonus !== 0 && (
                      <span className="text-sm font-mono text-emerald-400">
                        ({evaluation.effectiveBonus > 0 ? `+${evaluation.effectiveBonus}` : evaluation.effectiveBonus} Net Bonus)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-stone-400 mt-1 bg-stone-950/80 px-2 py-1 rounded border border-stone-800">
                    {evaluation.formulaBreakdown}
                  </div>
                </div>

                {/* Roll Mode / Advantage Status */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400">Roll Advantage State</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    {evaluation.rollMode === 'advantage' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ⭐ Advantage
                      </span>
                    )}
                    {evaluation.rollMode === 'disadvantage' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        ⚠️ Disadvantage
                      </span>
                    )}
                    {evaluation.rollMode === 'normal' && (
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-bold">
                        Standard Roll
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Applied Modifiers Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1">
                  <span className="font-bold text-stone-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active Applied Modifiers ({evaluation.appliedModifiers.length})
                  </span>
                </div>

                {evaluation.appliedModifiers.length === 0 ? (
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 text-stone-500 text-center italic">
                    No active modifiers currently modifying this target. Base natural rules apply.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {evaluation.appliedModifiers.map((mod) => (
                      <div key={mod.id} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                          <div>
                            <div className="font-bold text-stone-200 flex items-center gap-1.5">
                              {mod.label}
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 uppercase font-mono">
                                {mod.stackingRule}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400">{mod.source}</div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {mod.contribution > 0 ? `+${mod.contribution}` : mod.contribution}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suppressed / Overridden Modifiers (Conflict Audit Trail) */}
              {evaluation.suppressedModifiers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-amber-400" /> Suppressed / Non-Stacking Modifiers ({evaluation.suppressedModifiers.length})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {evaluation.suppressedModifiers.map(({ modifier, reason }, i) => (
                      <div key={i} className="bg-amber-950/20 p-2.5 rounded-xl border border-amber-700/30 flex items-center justify-between gap-2 opacity-80">
                        <div>
                          <div className="font-bold text-amber-200 line-through">{modifier.label}</div>
                          <div className="text-[10px] text-stone-400">{reason}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono border border-amber-600/40">
                          Suppressed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'buffs' && (
            <div className="space-y-3">
              <p className="text-stone-400 text-[11px]">
                Toggle standard 5e spells, cover conditions, and tactical combat buffs to immediately test stacking interactions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.values(BUILTIN_BUFF_PRESETS).map((preset) => {
                  const isActive = activeConditions.some(c => c.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleToggleBuff(preset.name)}
                      className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-stone-200">
                          <span>{preset.icon || '✨'}</span>
                          <span>{preset.name}</span>
                          {preset.requiresConcentration && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-mono">
                              Conc
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{preset.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                        isActive ? 'bg-amber-500 border-amber-400 text-stone-950' : 'border-stone-700 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCustomModifier} className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <span className="font-bold text-amber-300 text-xs block">Add Custom Modifier to {selectedTarget}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Modifier Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Bardic Inspiration, Divine Favor"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Stacking Rule</label>
                    <select
                      value={customRule}
                      onChange={(e) => setCustomRule(e.target.value as ModifierStackingRule)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none focus:border-amber-500"
                    >
                      <option value="additive">Additive (+X / -X)</option>
                      <option value="highest_only">Highest Only (Non-Stacking Bonus)</option>
                      <option value="lowest_only">Lowest Only (Non-Stacking Penalty)</option>
                      <option value="override_fixed">Fixed Override (Set to X)</option>
                      <option value="floor">Minimum Floor (Cannot be less than X)</option>
                      <option value="dice">Dynamic Dice (+1d4, +1d8)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Numeric Value</label>
                    <input
                      type="number"
                      value={customValue}
                      onChange={(e) => setCustomValue(parseInt(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Dice Formula (Optional)</label>
                    <input
                      type="text"
                      placeholder="+1d6, -1d4"
                      value={customDice}
                      onChange={(e) => setCustomDice(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Attach Modifier
                </button>
              </form>

              {/* List of Custom Modifiers */}
              {(((character as any).customModifiers || []) as DomainModifier[]).length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-stone-300 uppercase tracking-wider text-[10px] block">
                    Custom Character Modifiers
                  </span>
                  {(((character as any).customModifiers || []) as DomainModifier[]).map((mod) => (
                    <div key={mod.id} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-stone-200">{mod.label} ({mod.target})</div>
                        <div className="text-[10px] text-stone-400">
                          {mod.value > 0 ? `+${mod.value}` : mod.value} [{mod.stackingRule}] {mod.diceFormula && `Dice: ${mod.diceFormula}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomModifier(mod.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-stone-900 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between text-stone-400 text-xs">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400" /> Stacking resolves automatically per ruleset
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
