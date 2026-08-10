import React from 'react';
import { CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  formatModifier,
  getAbilityModifier,
  get35eTouchAC,
  get35eFlatFootedAC,
  get35eGrapple,
  getEffectiveSpeed,
  getArmorClassBreakdown,
  getEffectiveMaxHp,
  calculateCharacterTotalDR,
  getCharacterResistances,
  getCharacterImmunities
} from '../../../utils/dndCalculations';
import { HpOrb } from '../../HpOrb';
import { ConditionsPanel } from '../../combat/ConditionsPanel';
import { getEnvironmentalTraitStatus } from '../../../utils/environmentRules';
import {
  Shield,
  Heart,
  Zap,
  Footprints,
  Plus,
  Dices,
  Skull,
  Flame,
  Moon,
  Pencil,
  Crosshair,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface CombatDefensesPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  setShowMaxHpInspector: (val: boolean) => void;
  setShowTransformationModal: (val: boolean) => void;
  setShowCompanionModal?: (val: boolean) => void;
  setShowRestModal: (val: boolean) => void;
}

export const CombatDefensesPanel: React.FC<CombatDefensesPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  setShowMaxHpInspector,
  setShowTransformationModal,
  setShowCompanionModal,
  setShowRestModal
}) => {
  const effectiveMaxHp = getEffectiveMaxHp(character);
  const speedInfo = getEffectiveSpeed(character);

  const handleToggleDeathSuccess = (index: number) => {
    const current = character.deathSavesSuccesses;
    const next = current === index + 1 ? index : index + 1;
    let updatedHpCurrent = character.hpCurrent;
    let updatedSuccesses = next;
    let updatedFailures = character.deathSavesFailures;
    let conds = character.conditions || [];

    if (next >= 3) {
      updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
      updatedSuccesses = 0;
      updatedFailures = 0;
      conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: updatedHpCurrent,
      deathSavesSuccesses: updatedSuccesses,
      deathSavesFailures: updatedFailures,
      conditions: conds
    });
  };

  const handleToggleDeathFailure = (index: number) => {
    const current = character.deathSavesFailures;
    const next = current === index + 1 ? index : index + 1;
    const isNowDead = next >= 3;
    const conds = character.conditions || [];

    onUpdateCharacter({
      ...character,
      hpCurrent: isNowDead ? 0 : character.hpCurrent,
      deathSavesFailures: next,
      conditions: conds
    });
  };

  const handleRollDeathSave = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let label = `Death Save Roll (${d20})`;
    let updatedSuccesses = character.deathSavesSuccesses;
    let updatedFailures = character.deathSavesFailures;
    let updatedHpCurrent = character.hpCurrent;
    let conds = character.conditions || [];

    if (d20 === 20) {
      label += ' - NAT 20! Regain 1 HP & Stabilized!';
      updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
      updatedSuccesses = 0;
      updatedFailures = 0;
      conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
    } else if (d20 === 1) {
      label += ' - NAT 1! 2 Failures!';
      updatedFailures = Math.min(3, updatedFailures + 2);
    } else if (d20 >= 10) {
      label += ' - Success!';
      updatedSuccesses = Math.min(3, updatedSuccesses + 1);
      if (updatedSuccesses >= 3) {
        label += ' 🌟 3 Successes! Regained 1 HP & Stabilized!';
        updatedHpCurrent = Math.max(1, updatedHpCurrent || 1);
        updatedSuccesses = 0;
        updatedFailures = 0;
        conds = conds.filter(c => c !== 'Unconscious' && c !== 'Dead');
      }
    } else {
      label += ' - Failure!';
      updatedFailures = Math.min(3, updatedFailures + 1);
    }

    const isNowDead = updatedFailures >= 3;

    if (isNowDead) {
      updatedHpCurrent = 0;
      label += ' 💀 3 Failures - CHARACTER DIED!';
      if (!conds.includes('Dead')) {
        conds = [...conds, 'Dead'];
      }
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: updatedHpCurrent,
      deathSavesSuccesses: updatedSuccesses,
      deathSavesFailures: updatedFailures,
      conditions: conds
    });

    onRoll(label, 20, 1, 0, 'normal');
  };

  return (
    <div className="space-y-6">
      {/* Primary Defense & HP Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left 4 cols: HP Orb & Health Controls */}
        <div className="md:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xl">
          <div className="w-full flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
            <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" /> Vitality & HP
            </span>

            <button
              onClick={() => setShowMaxHpInspector(true)}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold bg-stone-950 px-2 py-0.5 rounded border border-amber-600/40 hover:border-amber-500 transition"
              title="Inspect Max HP Formula and Level-by-Level Breakdown"
            >
              Max HP Inspector 🔍
            </button>
          </div>

          <HpOrb
            hpCurrent={character.hpCurrent}
            hpMax={effectiveMaxHp}
          />

          <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-800 text-xs font-mono">
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-center">
              <div className="text-[10px] text-stone-400 font-sans uppercase">Temp HP</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <input
                  type="number"
                  min="0"
                  value={character.hpTemp || 0}
                  onChange={(e) => onUpdateCharacter({ ...character, hpTemp: parseInt(e.target.value) || 0 })}
                  className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-sky-300 font-bold p-0.5"
                />
              </div>
            </div>

            <button
              onClick={() => setShowRestModal(true)}
              className="bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 p-2 rounded-xl text-amber-200 font-sans font-bold flex flex-col items-center justify-center gap-1 transition shadow-md"
            >
              <Moon className="w-4 h-4 text-amber-400" />
              <span>Rest & Hit Dice</span>
            </button>
          </div>
        </div>

        {/* Middle 4 cols: Armor Class, Initiative, Speed */}
        <div className="md:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" /> Defense Stats
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {character.edition === '3.5e' ? '3.5e Rules' : '5e Rules'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            {/* AC */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-amber-500/30 flex flex-col items-center justify-center relative group">
              <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Armor Class</span>
              <span className="text-2xl font-serif font-extrabold text-amber-300 my-0.5">{character.armorClass}</span>
              <span className="text-[9px] text-stone-500 truncate max-w-full">
                {getArmorClassBreakdown(character).explanation || `Base ${getArmorClassBreakdown(character).baseAc}`}
              </span>
            </div>

            {/* Initiative */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Initiative</span>
              <button
                onClick={() => onRoll('Initiative Roll', 20, 1, getAbilityModifier(character.abilities.DEX?.score || 10), 'normal')}
                className="text-2xl font-serif font-extrabold text-emerald-300 hover:text-emerald-200 transition my-0.5"
                title="Roll Initiative"
              >
                {formatModifier(getAbilityModifier(character.abilities.DEX?.score || 10))}
              </button>
              <span className="text-[9px] text-stone-500">DEX Mod</span>
            </div>

            {/* Speed */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
              <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Speed</span>
              <span className="text-xl font-serif font-extrabold text-sky-300 my-0.5 flex items-center gap-1">
                <Footprints className="w-4 h-4 text-sky-400 shrink-0" />
                {speedInfo.effectiveSpeed} <span className="text-xs font-normal">ft</span>
              </span>
              <span className="text-[9px] text-stone-500 truncate max-w-full" title={speedInfo.reasons?.join('; ') || speedInfo.status}>
                {speedInfo.reasons?.join('; ') || speedInfo.status || 'Base speed'}
              </span>
            </div>
          </div>

          {/* 3.5e Specific Defenses (Touch AC, Flat-Footed, Grapple) */}
          {character.edition === '3.5e' && (
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-stone-950 p-2 rounded-xl border border-amber-600/30">
              <div>
                <div className="text-[9px] text-stone-400">Touch AC</div>
                <div className="font-bold text-amber-300">{get35eTouchAC(character)}</div>
              </div>
              <div>
                <div className="text-[9px] text-stone-400">Flat-Footed</div>
                <div className="font-bold text-amber-300">{get35eFlatFootedAC(character)}</div>
              </div>
              <div>
                <div className="text-[9px] text-stone-400">Grapple Mod</div>
                <div className="font-bold text-emerald-300">{formatModifier(get35eGrapple(character))}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 cols: Death Saving Throws / Transformation State */}
        <div className="md:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-serif font-bold text-amber-200 text-sm flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-rose-400" /> Death Saves & Form
            </span>
            {character.activeTransformation && (
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-mono font-bold">
                Transformed
              </span>
            )}
          </div>

          {/* Death Saves Control Panel */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">Successes:</span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <button
                    key={'succ-' + i}
                    onClick={() => handleToggleDeathSuccess(i)}
                    className="p-1 text-stone-600 hover:text-emerald-400 transition"
                  >
                    {character.deathSavesSuccesses > i ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400 font-bold">Failures:</span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <button
                    key={'fail-' + i}
                    onClick={() => handleToggleDeathFailure(i)}
                    className="p-1 text-stone-600 hover:text-rose-400 transition"
                  >
                    {character.deathSavesFailures > i ? (
                      <XCircle className="w-4 h-4 text-rose-500 fill-rose-950" />
                    ) : (
                      <XCircle className="w-4 h-4 text-stone-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRollDeathSave}
              className="w-full py-1.5 bg-stone-800 hover:bg-rose-950 border border-stone-700 hover:border-rose-600 text-stone-200 hover:text-rose-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
            >
              <Dices className="w-3.5 h-3.5 text-rose-400" /> Roll Death Saving Throw
            </button>
          </div>

          {/* Active Transformation / Wild Shape Quick Bar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowTransformationModal(true)}
              className="w-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 p-2 rounded-xl text-emerald-200 text-xs font-bold transition flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <span>🐾</span>
                <span>
                  {character.activeTransformation ? `Form: ${character.activeTransformation.form.name}` : 'Shapeshift'}
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">→</span>
            </button>
            {setShowCompanionModal && (
              <button
                onClick={() => setShowCompanionModal(true)}
                className="w-full bg-teal-950/60 hover:bg-teal-900/80 border border-teal-600/40 p-2 rounded-xl text-teal-200 text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span>🦅</span>
                  <span>Summon Engine</span>
                </span>
                <span className="text-[10px] text-teal-400 font-mono">→</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resistances, Immunities & Damage Reduction Panel */}
      <CollapsibleBox
        title="Resistances, Immunities & Damage Reduction (DR)"
        icon={<Shield className="w-5 h-5 text-amber-500" />}
        storageKey="sheet2_defenses_res"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-mono">
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
            <span className="text-amber-400 font-serif font-bold text-xs block font-sans">Damage Resistances (50% Damage)</span>
            <div className="text-stone-300 flex flex-wrap gap-1 pt-1">
              {getCharacterResistances(character).length > 0 ? (
                getCharacterResistances(character).map((r, idx) => (
                  <span key={`${r.type}-${idx}`} className="bg-stone-900 text-amber-200 border border-amber-800/50 px-2 py-0.5 rounded text-[11px]">
                    {r.type} {r.source ? `(${r.source})` : ''}
                  </span>
                ))
              ) : (
                <span className="text-stone-500 italic text-[11px]">None recorded</span>
              )}
            </div>
          </div>

          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
            <span className="text-emerald-400 font-serif font-bold text-xs block font-sans">Damage Immunities (0 Damage)</span>
            <div className="text-stone-300 flex flex-wrap gap-1 pt-1">
              {getCharacterImmunities(character).length > 0 ? (
                getCharacterImmunities(character).map((i, idx) => (
                  <span key={`${i.type}-${idx}`} className="bg-stone-900 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px]">
                    {i.type} {i.source ? `(${i.source})` : ''}
                  </span>
                ))
              ) : (
                <span className="text-stone-500 italic text-[11px]">None recorded</span>
              )}
            </div>
          </div>

          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
            <span className="text-sky-400 font-serif font-bold text-xs block font-sans">Damage Reduction (DR)</span>
            <div className="text-sky-200 font-bold text-sm pt-1">
              -{calculateCharacterTotalDR(character).totalDR} Flat Damage Reduced
            </div>
          </div>
        </div>
      </CollapsibleBox>

      {/* Conditions & Status Effects Widget */}
      <ConditionsPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />
    </div>
  );
};
