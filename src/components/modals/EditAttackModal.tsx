import React, { useState, useMemo } from 'react';
import { Attack, CharacterData, WeaponDamageRow, AbilityName } from '../../types';
import {
  calculate35eAttackBonus,
  calculate35eDamageFormula,
  getCharacterBab,
  formatModifier,
  getEffectiveAbilities,
  getAbilityModifier
} from '../../utils/dndCalculations';
import {
  Swords,
  X,
  Sparkles,
  Zap,
  Crosshair,
  Flame,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';

interface EditAttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  attack?: Attack | null;
  onSave: (savedAttack: Attack) => void;
}

const COMMON_DICE = ['1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d4', '2d6'];
const DAMAGE_TYPES = [
  'Slashing',
  'Piercing',
  'Bludgeoning',
  'Fire',
  'Cold',
  'Electricity',
  'Acid',
  'Sonic',
  'Force',
  'Positive Energy',
  'Negative Energy'
];
const SIZES: NonNullable<Attack['weaponSize']>[] = [
  'Fine',
  'Diminutive',
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
  'Colossal'
];

export const EditAttackModal: React.FC<EditAttackModalProps> = ({
  isOpen,
  onClose,
  character,
  attack,
  onSave
}) => {
  const is35e = character.edition === '3.5e';
  const bab = getCharacterBab(character);
  const abilities = getEffectiveAbilities(character);

  // Form State
  const [name, setName] = useState(attack?.name || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [baseDamageDice, setBaseDamageDice] = useState(
    attack?.baseDamageDice || (attack?.damage ? attack.damage.split(' ')[0] : '1d8')
  );
  const [damageType, setDamageType] = useState(attack?.damageType || 'Slashing');
  const [range, setRange] = useState(attack?.range || '5 ft Melee');
  const [abilityUsed, setAbilityUsed] = useState<AbilityName | 'auto'>(
    attack?.abilityUsed || 'auto'
  );
  const [enhancementBonus, setEnhancementBonus] = useState<number>(
    attack?.enhancementBonus ?? 0
  );
  const [miscBonus, setMiscBonus] = useState<number>(attack?.miscBonus ?? 0);
  const [miscBonusDamage, setMiscBonusDamage] = useState<number>(
    attack?.miscBonusDamage ?? 0
  );
  const [grip, setGrip] = useState<'oneHand' | 'twoHand' | 'offHand'>(
    attack?.isTwoHanded ? 'twoHand' : attack?.isOffhand ? 'offHand' : 'oneHand'
  );
  const [weaponSize, setWeaponSize] = useState<NonNullable<Attack['weaponSize']>>(
    attack?.weaponSize || (character.sizeCategory as any) || 'Medium'
  );
  const [threatRange, setThreatRange] = useState<number>(attack?.threatRange || 20);
  const [critMultiplier, setCritMultiplier] = useState<number>(
    attack?.critMultiplier || 2
  );
  const [isKeen, setIsKeen] = useState<boolean>(Boolean(attack?.isKeen));
  const [bypassMaterial, setBypassMaterial] = useState<NonNullable<Attack['bypassMaterial']>>(
    attack?.bypassMaterial || 'normal'
  );
  const [alignmentBypass, setAlignmentBypass] = useState<NonNullable<Attack['alignmentBypass']>>(
    attack?.alignmentBypass || 'none'
  );
  const [isNatural, setIsNatural] = useState<boolean>(Boolean(attack?.isNatural));
  const [isSecondaryNatural, setIsSecondaryNatural] = useState<boolean>(Boolean(attack?.isSecondaryNatural));
  const [isSoleNaturalAttack, setIsSoleNaturalAttack] = useState<boolean>(Boolean(attack?.isSoleNaturalAttack));
  const [twoHandedMultiplier, setTwoHandedMultiplier] = useState<number>(attack?.twoHandedMultiplier ?? 1.5);
  const [offhandMultiplier, setOffhandMultiplier] = useState<number>(attack?.offhandMultiplier ?? 0.5);
  const [notes, setNotes] = useState(attack?.notes || '');
  const [additionalRows, setAdditionalRows] = useState<WeaponDamageRow[]>(
    attack?.additionalDamageRows || []
  );

  // Manual Override
  const [useManualBonus, setUseManualBonus] = useState<boolean>(
    Boolean(attack?.useManualBonus)
  );
  const [manualAttackBonus, setManualAttackBonus] = useState<number>(
    attack?.attackBonus ?? 0
  );
  const [manualDamage, setManualDamage] = useState<string>(
    attack?.damage || '1d8'
  );

  // Transient attack representation for live calculation preview
  const previewAttack: Attack = useMemo(() => {
    return {
      id: attack?.id || 'preview',
      name: name.trim() || 'Weapon Attack',
      attackBonus: manualAttackBonus,
      damage: manualDamage,
      damageType,
      range,
      notes,
      isTwoHanded: grip === 'twoHand',
      isOffhand: grip === 'offHand',
      wieldGrip: grip === 'twoHand' ? '2H' : grip === 'offHand' ? 'OH' : '1H',
      isNatural,
      isSecondaryNatural,
      isSoleNaturalAttack,
      twoHandedMultiplier,
      offhandMultiplier,
      inventoryItemId: attack?.inventoryItemId,
      weaponSize: is35e ? weaponSize : undefined,
      enhancementBonus,
      miscBonus,
      miscBonusDamage,
      baseDamageDice,
      abilityUsed: abilityUsed === 'auto' ? undefined : abilityUsed,
      threatRange,
      critMultiplier,
      isKeen,
      bypassMaterial,
      alignmentBypass,
      useManualBonus,
      additionalDamageRows: additionalRows.filter((r) => r.damage && r.damage.trim())
    };
  }, [
    attack?.id,
    attack?.inventoryItemId,
    name,
    manualAttackBonus,
    manualDamage,
    damageType,
    range,
    notes,
    grip,
    isNatural,
    isSecondaryNatural,
    isSoleNaturalAttack,
    twoHandedMultiplier,
    offhandMultiplier,
    is35e,
    weaponSize,
    enhancementBonus,
    miscBonus,
    miscBonusDamage,
    baseDamageDice,
    abilityUsed,
    threatRange,
    critMultiplier,
    isKeen,
    bypassMaterial,
    alignmentBypass,
    useManualBonus,
    additionalRows
  ]);

  const calcAttack = useMemo(() => {
    if (is35e) {
      return calculate35eAttackBonus(character, previewAttack);
    }
    return null;
  }, [is35e, character, previewAttack]);

  const calcDamage = useMemo(() => {
    if (is35e) {
      return calculate35eDamageFormula(character, previewAttack);
    }
    return null;
  }, [is35e, character, previewAttack]);

  if (!isOpen) return null;

  const handleAddExtraDamage = () => {
    setAdditionalRows((prev) => [
      ...prev,
      {
        id: 'dmg-' + Date.now(),
        damage: '1d6',
        damageType: 'Fire',
        label: 'Flaming'
      }
    ]);
  };

  const handleRemoveExtraDamage = (id: string) => {
    setAdditionalRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateExtraDamage = (id: string, field: keyof WeaponDamageRow, val: string) => {
    setAdditionalRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      setValidationError('Please enter a Weapon / Attack Name.');
      return;
    }
    setValidationError(null);

    const calculatedBonus = is35e && !useManualBonus && calcAttack
      ? calcAttack.totalAttackBonus
      : manualAttackBonus;

    const calculatedDmg = is35e && !useManualBonus && calcDamage
      ? calcDamage.damageFormula
      : manualDamage;

    const saved: Attack = {
      ...previewAttack,
      id: attack?.id || 'atk-' + Date.now(),
      name: name.trim(),
      attackBonus: calculatedBonus,
      damage: calculatedDmg
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-stone-200">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-xl text-amber-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-amber-200">
                {attack ? 'Edit Weapon & Attack Details' : 'Add New Weapon / Attack'}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {is35e
                  ? 'Dynamic 3.5e BAB, Ability Modifiers, Weapon Size & Iterative Attacks'
                  : 'Configure Attack Bonus, Damage Formula & Special Rules'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Live Calculation Preview Card (Sticky Top Banner) */}
          {is35e && calcAttack && calcDamage && (
            <div className="bg-stone-950/90 border border-amber-600/60 rounded-xl p-3 space-y-2 shadow-inner">
              <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Zap className="w-4 h-4" />
                  <span className="font-serif text-sm">Dynamic Calculation Preview</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Auto-scales with BAB & STR/DEX
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Attack Bonus Preview */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Full Attack Routine:</span>
                    <span className="text-amber-200 font-extrabold font-mono text-sm">
                      {calcAttack.fullAttackDisplay}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 leading-relaxed border-t border-stone-800/80 pt-1">
                    <span className="text-stone-500">Breakdown: </span>
                    <span className="text-amber-300/90">{calcAttack.breakdown}</span>
                  </div>
                </div>

                {/* Damage Preview */}
                <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Damage Formula:</span>
                    <span className="text-rose-300 font-extrabold font-mono text-sm">
                      {calcDamage.damageFormula} {damageType}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-stone-400 leading-relaxed border-t border-stone-800/80 pt-1">
                    <span className="text-stone-500">Breakdown: </span>
                    <span className="text-rose-300/90">{calcDamage.breakdown}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Attack Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-stone-300 font-semibold flex items-center justify-between">
                <span>Weapon / Attack Name *</span>
                <span className="text-stone-500 text-[10px]">e.g. +1 Longsword, Greatsword, Heavy Crossbow</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Masterwork Composite Longbow"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            {/* Base Damage Dice */}
            <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold flex items-center justify-between">
                <span>Base Weapon Damage Dice *</span>
                <span className="text-stone-500 text-[10px]">Without modifiers</span>
              </label>
              <input
                type="text"
                value={baseDamageDice}
                onChange={(e) => setBaseDamageDice(e.target.value)}
                placeholder="e.g. 1d8, 2d6, 1d10"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {COMMON_DICE.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setBaseDamageDice(d)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] border transition ${
                      baseDamageDice === d
                        ? 'bg-amber-600 border-amber-500 text-white font-bold'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Damage Type */}
            <div className="space-y-1.5">
              <label className="text-stone-300 font-semibold">Damage Type</label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
              >
                {DAMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3.5e Dynamic Mechanics Section */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              Attack & Damage Scaling Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ability Modifier Used */}
              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Ability Modifier</label>
                <select
                  value={abilityUsed}
                  onChange={(e) => setAbilityUsed(e.target.value as any)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:border-amber-500"
                >
                  <option value="auto">Auto-Detect (STR Melee / DEX Ranged & Finesse)</option>
                  <option value="STR">Strength ({formatModifier(getAbilityModifier(abilities.STR?.score ?? 10))})</option>
                  <option value="DEX">Dexterity ({formatModifier(getAbilityModifier(abilities.DEX?.score ?? 10))})</option>
                  <option value="CON">Constitution ({formatModifier(getAbilityModifier(abilities.CON?.score ?? 10))})</option>
                  <option value="INT">Intelligence ({formatModifier(getAbilityModifier(abilities.INT?.score ?? 10))})</option>
                  <option value="WIS">Wisdom ({formatModifier(getAbilityModifier(abilities.WIS?.score ?? 10))})</option>
                  <option value="CHA">Charisma ({formatModifier(getAbilityModifier(abilities.CHA?.score ?? 10))})</option>
                </select>
              </div>

              {/* Weapon Grip / Hand */}
              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Grip / Hand</label>
                <select
                  value={grip}
                  onChange={(e) => setGrip(e.target.value as any)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:border-amber-500"
                >
                  <option value="oneHand">One-Handed (Normal 1.0× STR)</option>
                  <option value="twoHand">Two-Handed (1.5× STR Damage)</option>
                  <option value="offHand">Off-Hand (0.5× STR Damage)</option>
                </select>
              </div>

              {/* Weapon Size */}
              {is35e && (
                <div className="space-y-1">
                  <label className="text-stone-300 font-medium">Weapon Size (PHB p. 113)</label>
                  <select
                    value={weaponSize}
                    onChange={(e) => setWeaponSize(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:border-amber-500"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} {s === (character.sizeCategory || 'Medium') ? '(Wielder Size)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bonuses: Magic Enhancement & Misc */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Magic Enhancement</label>
                <div className="flex items-center gap-1">
                  <span className="text-stone-400 font-mono">+</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={enhancementBonus}
                    onChange={(e) => setEnhancementBonus(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Misc Attack Bonus</label>
                <input
                  type="number"
                  value={miscBonus}
                  onChange={(e) => setMiscBonus(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. +1 Focus"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Misc Damage Bonus</label>
                <input
                  type="number"
                  value={miscBonusDamage}
                  onChange={(e) => setMiscBonusDamage(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. +2 Specialization"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 font-mono focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-300 font-medium">Range / Reach</label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="e.g. 5 ft Melee, 100 ft"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Critical Threat & DR Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-2">
              <span className="text-stone-300 font-semibold block">Critical Threat Range</span>
              <div className="flex gap-2">
                {[20, 19, 18].map((threat) => (
                  <button
                    key={threat}
                    type="button"
                    onClick={() => setThreatRange(threat)}
                    className={`flex-1 py-1.5 rounded-lg border font-mono font-bold transition ${
                      threatRange === threat
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {threat === 20 ? '20' : `${threat}-20`}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-stone-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKeen}
                  onChange={(e) => setIsKeen(e.target.checked)}
                  className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                />
                <span>Keen / Improved Critical (Doubles Range)</span>
              </label>
            </div>

            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-2">
              <span className="text-stone-300 font-semibold block">Critical Multiplier</span>
              <div className="flex gap-2">
                {[2, 3, 4].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setCritMultiplier(mult)}
                    className={`flex-1 py-1.5 rounded-lg border font-mono font-bold transition ${
                      critMultiplier === mult
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    &times;{mult}
                  </button>
                ))}
              </div>
            </div>

            {/* DR Material Bypass */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-1.5">
              <span className="text-stone-300 font-semibold block">3.5e DR Material Bypass</span>
              <select
                value={bypassMaterial}
                onChange={(e) => setBypassMaterial(e.target.value as any)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-100 focus:border-amber-500"
              >
                <option value="normal">Standard Steel / Wood</option>
                <option value="magic">Magic (+1 or higher)</option>
                <option value="silver">Alchemical Silver</option>
                <option value="cold_iron">Cold Iron</option>
                <option value="adamantine">Adamantine</option>
              </select>
            </div>
          </div>

          {/* 3.5e Natural Weapon & Special Grip Multipliers */}
          {is35e && (
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-200 font-semibold flex items-center gap-1.5 text-xs">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  3.5e Natural Weapon & Grip Mechanics
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isNatural}
                    onChange={(e) => setIsNatural(e.target.checked)}
                    className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span className={isNatural ? 'text-amber-300 font-bold' : 'text-stone-400'}>
                    Natural Weapon (Bite/Claw/Slam)
                  </span>
                </label>
              </div>

              {isNatural && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-stone-800/80">
                  <label className="flex items-start gap-2 cursor-pointer p-2 bg-stone-900/60 rounded-lg border border-stone-800 hover:border-stone-700">
                    <input
                      type="checkbox"
                      checked={isSecondaryNatural}
                      onChange={(e) => setIsSecondaryNatural(e.target.checked)}
                      className="rounded border-stone-700 text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-stone-200">Secondary Natural Attack</span>
                      <p className="text-stone-400 text-[10px] leading-tight">
                        -5 to attack roll (-2 with Multiattack feat) and 0.5× STR damage modifier.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 bg-stone-900/60 rounded-lg border border-stone-800 hover:border-stone-700">
                    <input
                      type="checkbox"
                      checked={isSoleNaturalAttack}
                      onChange={(e) => setIsSoleNaturalAttack(e.target.checked)}
                      className="rounded border-stone-700 text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-stone-200">Sole Natural Weapon</span>
                      <p className="text-stone-400 text-[10px] leading-tight">
                        Creature's only natural attack (applies 1.5× STR damage modifier).
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Custom Multipliers */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-800/60">
                <div className="space-y-1">
                  <label className="text-stone-400 text-[11px] font-medium flex items-center justify-between">
                    <span>2-Handed STR Multiplier</span>
                    <span className="text-stone-500 font-mono">Standard 1.5×</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={twoHandedMultiplier}
                    onChange={(e) => setTwoHandedMultiplier(parseFloat(e.target.value) || 1.5)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-400 text-[11px] font-medium flex items-center justify-between">
                    <span>Off-Hand STR Multiplier</span>
                    <span className="text-stone-500 font-mono">Standard 0.5×</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1.5"
                    value={offhandMultiplier}
                    onChange={(e) => setOffhandMultiplier(parseFloat(e.target.value) || 0.5)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-stone-100 font-mono text-xs focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Damage Rows (e.g. +1d6 Fire) */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Additional Elemental or Precision Damage Rows
              </span>
              <button
                type="button"
                onClick={handleAddExtraDamage}
                className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-amber-300 font-bold text-[11px] transition"
              >
                <Plus className="w-3 h-3" /> Add Bonus Damage
              </button>
            </div>

            {additionalRows.length === 0 ? (
              <p className="text-stone-500 italic text-[11px]">
                No additional damage rows (e.g. +1d6 Flaming, +1d6 Sneak Attack).
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {additionalRows.map((row) => (
                  <div key={row.id} className="flex items-center gap-2 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                    <input
                      type="text"
                      value={row.damage}
                      onChange={(e) => handleUpdateExtraDamage(row.id, 'damage', e.target.value)}
                      placeholder="e.g. 1d6"
                      className="w-20 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 font-mono"
                    />
                    <select
                      value={row.damageType}
                      onChange={(e) => handleUpdateExtraDamage(row.id, 'damageType', e.target.value)}
                      className="w-28 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100"
                    >
                      {DAMAGE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={row.label || ''}
                      onChange={(e) => handleUpdateExtraDamage(row.id, 'label', e.target.value)}
                      placeholder="Label (e.g. Flaming, Sneak Attack)"
                      className="flex-1 bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraDamage(row.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special Notes */}
          <div className="space-y-1">
            <label className="text-stone-300 font-semibold">Special Properties & Tactical Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Trip weapon, Disarm +2, Reach, Masterwork, Silvered..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-stone-100 focus:outline-none focus:border-amber-500"
              rows={2}
            />
          </div>

          {/* Advanced Manual Override Collapsible / Toggle */}
          <div className="border border-stone-800 rounded-xl p-3 bg-stone-950/40 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-semibold text-stone-300">Manual Override Mode</span>
                <p className="text-stone-500 text-[11px]">
                  Bypasses automatic dynamic scaling and locks exact fixed numbers.
                </p>
              </div>
              <input
                type="checkbox"
                checked={useManualBonus}
                onChange={(e) => setUseManualBonus(e.target.checked)}
                className="rounded border-stone-700 text-amber-600 focus:ring-amber-500"
              />
            </label>

            {useManualBonus && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800">
                <div className="space-y-1">
                  <label className="text-stone-400 font-medium">Manual Fixed Attack Bonus</label>
                  <input
                    type="number"
                    value={manualAttackBonus}
                    onChange={(e) => setManualAttackBonus(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-400 font-medium">Manual Fixed Damage Formula</label>
                  <input
                    type="text"
                    value={manualDamage}
                    onChange={(e) => setManualDamage(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-950/80 border-t border-b border-rose-600/60 text-rose-200 px-4 py-2.5 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-stone-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{attack ? 'Save Weapon Changes' : 'Save Weapon'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
