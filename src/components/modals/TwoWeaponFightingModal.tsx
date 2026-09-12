import React, { useState, useMemo } from 'react';
import { Attack, CharacterData } from '../../types';
import {
  getCharacterBab,
  get35eIterativeAttacks,
  calculate35eTwoWeaponPenalties,
  adjust35eOffhandDamageFormula,
  formatModifier,
  getEffectiveAbilities,
  getAbilityModifier,
  evaluate35eMissChance,
  DND35E_MISS_CHANCE_PRESETS,
  MissChanceType
} from '../../utils/dndCalculations';
import {
  Swords,
  X,
  Shield,
  Sparkles,
  Zap,
  Dice5,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

interface TwoWeaponFightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
}

interface TwfStep {
  id: string;
  hand: 'Main Hand' | 'Off-Hand';
  weapon: Attack;
  bonus: number;
  damageFormula: string;
  notes: string;
}

export const TwoWeaponFightingModal: React.FC<TwoWeaponFightingModalProps> = ({
  isOpen,
  onClose,
  character,
  onRollDamage
}) => {
  if (!isOpen) return null;

  const attacks = character.attacks || [];
  const is35e = character.edition === '3.5e';
  const bab = getCharacterBab(character);
  const abilities = getEffectiveAbilities(character);
  const strMod = getAbilityModifier(abilities?.STR?.score || 10);

  // Weapon selections
  const [mainWeaponId, setMainWeaponId] = useState<string>(attacks[0]?.id || '');
  const [offWeaponId, setOffWeaponId] = useState<string>(attacks[1]?.id || attacks[0]?.id || '');
  const [isOffhandLight, setIsOffhandLight] = useState<boolean>(true);

  // Tactical modifiers
  const [isFlanking, setIsFlanking] = useState<boolean>(false);
  const [missChanceType, setMissChanceType] = useState<MissChanceType>('none');
  const hasBlindFight = Boolean(character.feats?.some((f) => f.name.toLowerCase().includes('blind-fight')));

  // Active Feat Overrides / Local Controls
  const [hasTWF, setHasTWF] = useState<boolean>(
    Boolean(character.hasTwoWeaponFighting || character.feats?.some((f) => f.name.toLowerCase().includes('two-weapon fighting') && !f.name.toLowerCase().includes('improved') && !f.name.toLowerCase().includes('greater')))
  );
  const [hasITWF, setHasITWF] = useState<boolean>(
    Boolean(character.hasImprovedTwoWeaponFighting || character.feats?.some((f) => f.name.toLowerCase().includes('improved two-weapon fighting')))
  );
  const [hasGTWF, setHasGTWF] = useState<boolean>(
    Boolean(character.hasGreaterTwoWeaponFighting || character.feats?.some((f) => f.name.toLowerCase().includes('greater two-weapon fighting')))
  );

  const mainWeapon = attacks.find((a) => a.id === mainWeaponId) || attacks[0] || {
    id: 'main',
    name: 'Primary Longsword',
    attackBonus: bab + strMod,
    damage: '1d8 + ' + strMod,
    damageType: 'Slashing',
    range: 'Melee'
  };

  const offWeapon = attacks.find((a) => a.id === offWeaponId) || attacks[1] || attacks[0] || {
    id: 'off',
    name: 'Off-hand Shortsword',
    attackBonus: bab + strMod,
    damage: '1d6 + ' + strMod,
    damageType: 'Piercing',
    range: 'Melee'
  };

  // Penalties
  let mainPenalty = -6;
  let offPenalty = -10;
  if (isOffhandLight) {
    mainPenalty = -4;
    offPenalty = -8;
  }
  if (hasTWF) {
    if (isOffhandLight) {
      mainPenalty = -2;
      offPenalty = -2;
    } else {
      mainPenalty = -4;
      offPenalty = -4;
    }
  }

  const flankBonus = isFlanking ? 2 : 0;

  // Generate iterative steps
  const steps: TwfStep[] = useMemo(() => {
    const list: TwfStep[] = [];
    const mainIteratives = get35eIterativeAttacks(mainWeapon.attackBonus || 0, bab);

    // Main hand attacks
    mainIteratives.forEach((iterEntry, index) => {
      const effectiveBonus = iterEntry.bonus + mainPenalty + flankBonus;
      list.push({
        id: `main-${index + 1}`,
        hand: 'Main Hand',
        weapon: mainWeapon,
        bonus: effectiveBonus,
        damageFormula: mainWeapon.damage || '1d8',
        notes: `Attack #${index + 1} (${iterEntry.label}, Penalty ${mainPenalty >= 0 ? '+' : ''}${mainPenalty}${isFlanking ? ', Flanking +2' : ''})`
      });
    });

    // Off-hand attacks
    const offhandBaseBonus = (offWeapon.attackBonus || 0);
    const offhandAdjustedDamage = adjust35eOffhandDamageFormula(offWeapon.damage || '1d6', strMod);

    // 1st off-hand attack (Standard TWF)
    list.push({
      id: 'off-1',
      hand: 'Off-Hand',
      weapon: offWeapon,
      bonus: offhandBaseBonus + offPenalty + flankBonus,
      damageFormula: offhandAdjustedDamage,
      notes: `Primary Off-hand (Penalty ${offPenalty >= 0 ? '+' : ''}${offPenalty}${isFlanking ? ', Flanking +2' : ''})`
    });

    // 2nd off-hand attack (Improved TWF at -5)
    if (hasITWF && bab >= 6) {
      list.push({
        id: 'off-2',
        hand: 'Off-Hand',
        weapon: offWeapon,
        bonus: offhandBaseBonus - 5 + offPenalty + flankBonus,
        damageFormula: offhandAdjustedDamage,
        notes: `Improved TWF 2nd Off-hand (-5 iterative, Penalty ${offPenalty >= 0 ? '+' : ''}${offPenalty}${isFlanking ? ', Flanking +2' : ''})`
      });
    }

    // 3rd off-hand attack (Greater TWF at -10)
    if (hasGTWF && bab >= 11) {
      list.push({
        id: 'off-3',
        hand: 'Off-Hand',
        weapon: offWeapon,
        bonus: offhandBaseBonus - 10 + offPenalty + flankBonus,
        damageFormula: offhandAdjustedDamage,
        notes: `Greater TWF 3rd Off-hand (-10 iterative, Penalty ${offPenalty >= 0 ? '+' : ''}${offPenalty}${isFlanking ? ', Flanking +2' : ''})`
      });
    }

    return list;
  }, [bab, mainWeapon, offWeapon, mainPenalty, offPenalty, flankBonus, hasITWF, hasGTWF, isFlanking, strMod]);

  // Roll results
  const [rollLogs, setRollLogs] = useState<Array<{
    stepId: string;
    d20: number;
    bonus: number;
    total: number;
    isNat20: boolean;
    isNat1: boolean;
    missChance?: { d100: number; isOvercome: boolean; log: string };
    damageResult?: string;
  }>>([]);

  const activeMissChance = DND35E_MISS_CHANCE_PRESETS.find((p) => p.id === missChanceType);

  const handleRollStep = (step: TwfStep) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let missChanceRes = undefined;
    if (is35e && activeMissChance && activeMissChance.percentage > 0) {
      const res = evaluate35eMissChance(activeMissChance.percentage, hasBlindFight);
      missChanceRes = {
        d100: res.d100Roll,
        isOvercome: res.isOvercome,
        log: res.log
      };
    }

    const logEntry = {
      stepId: step.id,
      d20,
      bonus: step.bonus,
      total: d20 + step.bonus,
      isNat20: d20 === 20,
      isNat1: d20 === 1,
      missChance: missChanceRes
    };

    setRollLogs((prev) => [...prev.filter((p) => p.stepId !== step.id), logEntry]);
  };

  const handleRollAll = () => {
    const newLogs = steps.map((step) => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      let missChanceRes = undefined;
      if (is35e && activeMissChance && activeMissChance.percentage > 0) {
        const res = evaluate35eMissChance(activeMissChance.percentage, hasBlindFight);
        missChanceRes = {
          d100: res.d100Roll,
          isOvercome: res.isOvercome,
          log: res.log
        };
      }
      return {
        stepId: step.id,
        d20,
        bonus: step.bonus,
        total: d20 + step.bonus,
        isNat20: d20 === 20,
        isNat1: d20 === 1,
        missChance: missChanceRes
      };
    });
    setRollLogs(newLogs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-stone-900 p-4 border-b border-amber-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                Two-Weapon Fighting (TWF) Full Attack
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-950/80 border border-amber-800/60 text-amber-300 rounded-full font-bold">
                  3.5e Engine
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Off-hand penalties, iterative dual attacks & ½ Strength damage scaling
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

        {/* Configuration Row */}
        <div className="p-4 bg-stone-950/50 border-b border-stone-800 space-y-3 shrink-0">
          {/* Weapon Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                Main Hand Weapon
              </label>
              <select
                value={mainWeaponId}
                onChange={(e) => setMainWeaponId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono focus:border-amber-500 outline-none"
              >
                {attacks.map((atk) => (
                  <option key={atk.id} value={atk.id}>
                    {atk.name} ({formatModifier(atk.attackBonus)}, {atk.damage})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                  Off-Hand Weapon
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-300 font-bold">
                  <input
                    type="checkbox"
                    checked={isOffhandLight}
                    onChange={(e) => setIsOffhandLight(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0 bg-stone-900 border-stone-700"
                  />
                  <span>Light Weapon (+2 bonus)</span>
                </label>
              </div>
              <select
                value={offWeaponId}
                onChange={(e) => setOffWeaponId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono focus:border-amber-500 outline-none"
              >
                {attacks.map((atk) => (
                  <option key={atk.id} value={atk.id}>
                    {atk.name} ({formatModifier(atk.attackBonus)}, {atk.damage})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feat Toggles & Penalty Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800/80">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg cursor-pointer text-stone-300 hover:text-stone-100">
                <input
                  type="checkbox"
                  checked={hasTWF}
                  onChange={(e) => setHasTWF(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-bold">Two-Weapon Fighting Feat</span>
              </label>
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg cursor-pointer text-stone-300 hover:text-stone-100">
                <input
                  type="checkbox"
                  checked={hasITWF}
                  onChange={(e) => setHasITWF(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-bold">Improved TWF (BAB 6+)</span>
              </label>
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg cursor-pointer text-stone-300 hover:text-stone-100">
                <input
                  type="checkbox"
                  checked={hasGTWF}
                  onChange={(e) => setHasGTWF(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-bold">Greater TWF (BAB 11+)</span>
              </label>
            </div>

            <div className="px-3 py-1 bg-amber-950/70 border border-amber-600/50 rounded-lg text-xs font-mono font-bold text-amber-300">
              Penalties: Main {formatModifier(mainPenalty)} / Off {formatModifier(offPenalty)}
            </div>
          </div>

          {/* Tactical Modifiers: Flanking & Miss Chance */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-blue-300 bg-blue-950/40 border border-blue-800/40 px-2.5 py-1 rounded-lg">
                <input
                  type="checkbox"
                  checked={isFlanking}
                  onChange={(e) => setIsFlanking(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span>Flanking Target (+2 Attack)</span>
              </label>

              {is35e && (
                <div className="flex items-center gap-1.5 text-xs text-stone-300">
                  <Eye className="w-3.5 h-3.5 text-stone-400" />
                  <span>Miss Chance:</span>
                  <select
                    value={missChanceType}
                    onChange={(e) => setMissChanceType(e.target.value as MissChanceType)}
                    className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2 py-0.5 font-mono focus:border-amber-500 outline-none"
                  >
                    {DND35E_MISS_CHANCE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRollAll}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition shadow flex items-center gap-1.5 ml-auto"
            >
              <Dice5 className="w-4 h-4" />
              <span>Roll Full Dual Barrage ({steps.length} Attacks)</span>
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {steps.map((step) => {
            const roll = rollLogs.find((r) => r.stepId === step.id);
            const isMain = step.hand === 'Main Hand';

            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMain
                    ? 'bg-stone-950/80 border-stone-800'
                    : 'bg-amber-950/20 border-amber-900/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        isMain
                          ? 'bg-stone-800 text-stone-300'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/40'
                      }`}
                    >
                      {step.hand}
                    </span>
                    <span className="text-xs font-bold text-stone-100">
                      {step.weapon.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {step.notes}
                  </div>
                  <div className="text-xs text-amber-300/90 font-mono">
                    Damage: {step.damageFormula} ({step.weapon.damageType || 'Physical'})
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Attack Bonus Display */}
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-amber-400 block">
                      {formatModifier(step.bonus)}
                    </span>
                    <span className="text-[9px] text-stone-500 uppercase font-mono">Atk Bonus</span>
                  </div>

                  {/* Roll Result */}
                  {roll ? (
                    <div className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-right min-w-[120px]">
                      <div className="text-xs font-mono font-bold">
                        <span className="text-stone-400">d20({roll.d20})</span>
                        <span className="text-amber-400"> + {roll.bonus}</span>
                        <span className="text-stone-100"> = {roll.total}</span>
                      </div>
                      {roll.isNat20 && (
                        <span className="text-[9px] text-emerald-400 font-bold uppercase block">
                          [NAT 20 THREAT]
                        </span>
                      )}
                      {roll.isNat1 && (
                        <span className="text-[9px] text-red-400 font-bold uppercase block">
                          [NAT 1 MISS]
                        </span>
                      )}
                      {is35e && roll.missChance && (
                        <div
                          className={`text-[10px] font-mono font-bold ${
                            roll.missChance.isOvercome ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          d100={roll.missChance.d100} ({roll.missChance.isOvercome ? 'Overcome' : 'Missed'})
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRollStep(step)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition flex items-center gap-1"
                    >
                      <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roll</span>
                    </button>
                  )}

                  {/* Damage Roll Button */}
                  {onRollDamage && (
                    <button
                      type="button"
                      onClick={() => onRollDamage(`${step.hand}: ${step.weapon.name}`, step.damageFormula)}
                      className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/40 text-amber-300 text-xs font-bold rounded-lg transition"
                      title="Roll weapon damage"
                    >
                      Dmg
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-400 font-mono">
            3.5e Rule: Off-hand weapons receive ½ Strength modifier to damage.
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
