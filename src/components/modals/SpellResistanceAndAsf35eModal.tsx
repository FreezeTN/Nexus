import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getCharacterCasterLevel,
  getSpellPenetrationBonus,
  calculate35eTotalArcaneSpellFailure,
  roll35eArcaneSpellFailure,
  roll35eCasterLevelCheck,
  formatModifier
} from '../../utils/dndCalculations';
import {
  Sparkles,
  Shield,
  X,
  Dices,
  Zap,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  HelpCircle,
  Layers,
  Wand2
} from 'lucide-react';

interface SpellResistanceAndAsf35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const SpellResistanceAndAsf35eModal: React.FC<SpellResistanceAndAsf35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const currentCl = getCharacterCasterLevel(character);
  const [clOverride, setClOverride] = useState<number>(
    typeof character.casterLevelOverride === 'number' ? character.casterLevelOverride : currentCl
  );
  const [spellPen, setSpellPen] = useState<'none' | 'spell_penetration' | 'greater'>(
    character.spellPenetration || 'none'
  );
  const [asfOverride, setAsfOverride] = useState<string>(
    character.arcaneSpellFailureOverride !== undefined
      ? String(character.arcaneSpellFailureOverride)
      : ''
  );

  // Testing Target SR
  const [targetSr, setTargetSr] = useState<number>(20);
  const [srRollResult, setSrRollResult] = useState<{
    d20: number;
    cl: number;
    spellPenBonus: number;
    total: number;
    targetSr: number;
    passed: boolean;
  } | null>(null);

  // Testing ASF
  const [asfRollResult, setAsfRollResult] = useState<{
    passed: boolean;
    roll: number;
    asf: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const previewChar: CharacterData = {
    ...character,
    casterLevelOverride: clOverride,
    spellPenetration: spellPen,
    arcaneSpellFailureOverride: asfOverride !== '' ? parseInt(asfOverride, 10) : undefined
  };

  const asfData = calculate35eTotalArcaneSpellFailure(previewChar);
  const spellPenBonus = getSpellPenetrationBonus(previewChar);

  const handleSaveSettings = () => {
    onUpdateCharacter({
      ...character,
      casterLevelOverride: clOverride,
      spellPenetration: spellPen,
      arcaneSpellFailureOverride: asfOverride !== '' ? parseInt(asfOverride, 10) : undefined
    });
  };

  const handleRollVsSr = () => {
    const res = roll35eCasterLevelCheck(previewChar, targetSr);
    setSrRollResult({
      d20: res.d20,
      cl: res.cl,
      spellPenBonus: res.spellPenBonus,
      total: res.total,
      targetSr,
      passed: Boolean(res.passed)
    });

    if (onRoll) {
      onRoll(
        `Caster Level Check vs SR ${targetSr} (1d20+${res.cl + res.spellPenBonus})`,
        20,
        1,
        res.cl + res.spellPenBonus,
        'normal'
      );
    }
  };

  const handleRollAsf = () => {
    const res = roll35eArcaneSpellFailure(previewChar);
    setAsfRollResult(res);

    if (onRoll) {
      onRoll(
        `Arcane Spell Failure Check (d100 vs ${res.asf}% ASF)`,
        100,
        1,
        0,
        'normal'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/70 border border-cyan-500/40 rounded-xl text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-200">
                3.5e Spell Resistance & Arcane Spell Failure (ASF)
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {character.name} &bull; Caster Level {clOverride} &bull; ASF {asfData.totalAsf}%
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleSaveSettings();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* SECTION 1: Caster Level & Spell Penetration vs SR */}
          <div className="bg-stone-950 p-4 rounded-xl border border-cyan-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                <span className="font-serif font-bold text-sm text-cyan-300">
                  Caster Level Check vs Spell Resistance (SR)
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                1d20 + Caster Level + Feats &ge; Target SR
              </span>
            </div>

            {/* CL & Feat Config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
                <span className="text-stone-300 font-mono font-bold">Caster Level (CL):</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={clOverride}
                  onChange={(e) => setClOverride(parseInt(e.target.value) || 0)}
                  className="w-14 bg-stone-950 border border-stone-700 rounded text-center text-cyan-300 font-bold p-1 font-mono text-sm"
                />
              </div>

              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800 flex items-center justify-between">
                <span className="text-stone-300 font-mono font-bold">Spell Penetration:</span>
                <select
                  value={spellPen}
                  onChange={(e) => setSpellPen(e.target.value as any)}
                  className="bg-stone-950 border border-stone-700 rounded text-amber-300 font-bold p-1 text-xs font-mono"
                >
                  <option value="none">None (+0)</option>
                  <option value="spell_penetration">Spell Penetration (+2)</option>
                  <option value="greater">Greater Spell Penetration (+4)</option>
                </select>
              </div>
            </div>

            {/* Target SR Roll Simulator */}
            <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-mono font-bold">Target Creature SR:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  {[16, 18, 20, 24, 28].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetSr(val)}
                      className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                        targetSr === val
                          ? 'bg-cyan-600 text-stone-950 border-cyan-400'
                          : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-white'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={targetSr}
                    onChange={(e) => setTargetSr(parseInt(e.target.value) || 1)}
                    className="w-12 bg-stone-950 border border-stone-700 rounded text-center text-cyan-300 font-bold p-0.5 ml-1 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRollVsSr}
                className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 text-stone-950 font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-mono"
              >
                <Dices className="w-4 h-4" /> Roll CL Check vs SR {targetSr} (1d20 + {clOverride + spellPenBonus})
              </button>

              {srRollResult && (
                <div className={`p-3 rounded-lg border font-mono flex items-center justify-between ${
                  srRollResult.passed
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600 text-rose-200'
                }`}>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      {srRollResult.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {srRollResult.passed ? 'SPELL PIERCES SR!' : 'SPELL RESISTED BY SR!'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-300 pt-0.5">
                      1d20 ({srRollResult.d20}) + CL ({srRollResult.cl})
                      {srRollResult.spellPenBonus > 0 ? ` + Feats (${srRollResult.spellPenBonus})` : ''} ={' '}
                      <strong className="text-white text-sm">{srRollResult.total}</strong> vs SR{' '}
                      {srRollResult.targetSr}
                    </div>
                  </div>
                  <div className="text-right font-bold text-sm">
                    {srRollResult.passed ? (
                      <span className="text-emerald-400">SUCCESS</span>
                    ) : (
                      <span className="text-rose-400">RESISTED</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Arcane Spell Failure (ASF %) */}
          <div className="bg-stone-950 p-4 rounded-xl border border-amber-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-sm text-amber-300">
                  Arcane Spell Failure (ASF %)
                </span>
              </div>
              <span className="text-base font-serif font-bold text-amber-400 font-mono">
                {asfData.totalAsf}% ASF
              </span>
            </div>

            {/* Equipped Items Breakdown */}
            <div className="space-y-1.5">
              <span className="text-stone-400 font-mono text-[11px] block">
                Equipped Armor & Shield Sources:
              </span>
              {asfData.breakdown.length === 0 ? (
                <div className="text-stone-500 italic p-2 bg-stone-900/50 rounded-lg text-center font-mono">
                  No equipped armor or shields with Arcane Spell Failure (0% ASF).
                </div>
              ) : (
                <div className="space-y-1 font-mono">
                  {asfData.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-stone-900/80 px-3 py-1.5 rounded-lg border border-stone-800"
                    >
                      <span className="text-stone-300">{item.name}</span>
                      <span className="text-amber-400 font-bold">+{item.asf}%</span>
                    </div>
                  ))}
                </div>
              )}
              {asfData.note && (
                <p className="text-[11px] text-emerald-400 italic pt-0.5">
                  &bull; {asfData.note}
                </p>
              )}
            </div>

            {/* Manual Override & Test Roll */}
            <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800/80 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-stone-400 text-xs">Manual ASF % Override:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Auto"
                  value={asfOverride}
                  onChange={(e) => setAsfOverride(e.target.value)}
                  className="w-16 bg-stone-950 border border-stone-700 rounded text-center text-amber-300 font-bold p-1 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleRollAsf}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-xs"
              >
                <Dices className="w-4 h-4" /> Roll ASF Check (1d100 vs {asfData.totalAsf}% Failure)
              </button>

              {asfRollResult && (
                <div className={`p-3 rounded-lg border flex items-center justify-between ${
                  asfRollResult.passed
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600 text-rose-200'
                }`}>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      {asfRollResult.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {asfRollResult.passed ? 'SPELL CAST CLEANLY!' : 'SPELL FAILED & LOST!'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 pt-0.5">
                      {asfRollResult.message}
                    </p>
                  </div>
                  <div className="text-right font-bold text-sm">
                    {asfRollResult.passed ? (
                      <span className="text-emerald-400">PASSED</span>
                    ) : (
                      <span className="text-rose-400">FAILED</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              handleSaveSettings();
              onClose();
            }}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition text-xs"
          >
            Close & Save
          </button>
        </div>
      </div>
    </div>
  );
};
