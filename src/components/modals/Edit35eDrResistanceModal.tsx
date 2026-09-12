import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eDamageReduction,
  calculate35eIncomingDamage
} from '../../utils/dndCalculations';
import {
  Shield,
  X,
  Flame,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Heart,
  Droplet
} from 'lucide-react';

interface Edit35eDrResistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const Edit35eDrResistanceModal: React.FC<Edit35eDrResistanceModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  if (!isOpen) return null;

  const currentDrValue = character.damageReductionValue || 0;
  const currentDrBypass = character.damageReductionBypass || '-';
  const currentResistances = character.energyResistances || {
    fire: 0,
    cold: 0,
    electricity: 0,
    acid: 0,
    sonic: 0
  };

  const [drValue, setDrValue] = useState<number>(currentDrValue);
  const [drBypass, setDrBypass] = useState<string>(currentDrBypass);
  const [resistances, setResistances] = useState<Record<string, number>>(currentResistances);

  // Incoming Damage Calculator State
  const [incomingAmount, setIncomingAmount] = useState<number>(15);
  const [incomingType, setIncomingType] = useState<string>('Slashing');
  const [isMagicWeapon, setIsMagicWeapon] = useState<boolean>(false);
  const [weaponMaterial, setWeaponMaterial] = useState<'normal' | 'silver' | 'cold_iron' | 'adamantine'>('normal');
  const [weaponAlignment, setWeaponAlignment] = useState<'none' | 'good' | 'evil' | 'lawful' | 'chaotic'>('none');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Temporary Character for Calculator preview
  const tempChar: CharacterData = {
    ...character,
    damageReductionValue: drValue,
    damageReductionBypass: drBypass,
    energyResistances: resistances
  };

  const calcResult = calculate35eIncomingDamage(tempChar, incomingAmount, incomingType, {
    isMagic: isMagicWeapon,
    material: weaponMaterial,
    alignment: weaponAlignment
  });

  const handleResistanceChange = (type: string, val: number) => {
    setResistances((prev) => ({
      ...prev,
      [type]: Math.max(0, val)
    }));
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      damageReductionValue: drValue,
      damageReductionBypass: drBypass,
      energyResistances: resistances
    });
    onClose();
  };

  const handleApplyDamageToHp = () => {
    const dmg = calcResult.finalDamage;
    const nextHp = Math.max(-10, character.hpCurrent - dmg);
    onUpdateCharacter({
      ...character,
      hpCurrent: nextHp,
      damageReductionValue: drValue,
      damageReductionBypass: drBypass,
      energyResistances: resistances
    });
    setAppliedNotice(`Applied -${dmg} HP! Character HP: ${character.hpCurrent} → ${nextHp}`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-sky-600/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-950/80 border border-sky-600/50 rounded-lg text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-sky-200">
                  Damage Reduction & Energy Resistances
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/60 font-bold">
                  3.5e Defenses
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                Current: <strong className="text-sky-300">DR {drValue}/{drBypass}</strong> &bull; Total Energy Resistances: {Object.values(resistances).reduce((a, b) => a + b, 0)}
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

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Damage Reduction (DR) Settings */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Damage Reduction (DR)
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">
                Formula: DR [Amount] / [Bypass]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-400 block mb-1 font-mono">
                  DR Amount (Damage Subtracted):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={drValue}
                    onChange={(e) => setDrValue(parseInt(e.target.value) || 0)}
                    className="w-20 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-center text-sky-300 font-bold font-mono text-base focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex items-center gap-1">
                    {[0, 2, 5, 10, 15].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDrValue(v)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition ${
                          drValue === v
                            ? 'bg-sky-950 text-sky-300 border-sky-600'
                            : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1 font-mono">
                  Bypass Property (Overcomes DR):
                </label>
                <input
                  type="text"
                  value={drBypass}
                  onChange={(e) => setDrBypass(e.target.value)}
                  placeholder="e.g. magic, silver, cold iron, adamantine, bludgeoning, -"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-200 font-mono text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-1">
              <span className="text-[10px] text-stone-500 font-mono block mb-1.5">
                Common 3.5e Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'DR 1/- (Barbarian 7)', val: 1, bypass: '-' },
                  { label: 'DR 2/- (Barbarian 10)', val: 2, bypass: '-' },
                  { label: 'DR 5/- (Barbarian 19)', val: 5, bypass: '-' },
                  { label: 'DR 10/silver (Lycanthrope)', val: 10, bypass: 'silver' },
                  { label: 'DR 10/cold iron (Fey/Demon)', val: 10, bypass: 'cold iron' },
                  { label: 'DR 10/adamantine (Stoneskin/Golem)', val: 10, bypass: 'adamantine' },
                  { label: 'DR 5/bludgeoning (Skeleton)', val: 5, bypass: 'bludgeoning' },
                  { label: 'DR 5/slashing (Zombie)', val: 5, bypass: 'slashing' },
                  { label: 'DR 10/magic (Lesser Fiend)', val: 10, bypass: 'magic' },
                  { label: 'DR 10/good (Evil Fiend)', val: 10, bypass: 'good' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDrValue(preset.val);
                      setDrBypass(preset.bypass);
                    }}
                    className="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-sky-700 text-[10px] font-mono text-stone-400 hover:text-sky-300 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Energy Resistances */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Energy Resistances (Subtracts from Energy Dmg)
              </span>
              <button
                type="button"
                onClick={() => setResistances({ fire: 0, cold: 0, electricity: 0, acid: 0, sonic: 0 })}
                className="text-[10px] text-stone-500 hover:text-stone-300 font-mono flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: 'fire', label: 'Fire', color: 'text-orange-400', border: 'border-orange-900/50' },
                { key: 'cold', label: 'Cold', color: 'text-cyan-400', border: 'border-cyan-900/50' },
                { key: 'electricity', label: 'Elec', color: 'text-yellow-400', border: 'border-yellow-900/50' },
                { key: 'acid', label: 'Acid', color: 'text-lime-400', border: 'border-lime-900/50' },
                { key: 'sonic', label: 'Sonic', color: 'text-purple-400', border: 'border-purple-900/50' }
              ].map((elem) => (
                <div key={elem.key} className={`bg-stone-900 p-2.5 rounded-lg border ${elem.border} text-center space-y-1`}>
                  <span className={`text-xs font-bold block font-sans ${elem.color}`}>
                    {elem.label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={resistances[elem.key] || 0}
                    onChange={(e) => handleResistanceChange(elem.key, parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-800 rounded px-1.5 py-1 text-center text-stone-200 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-center gap-1 pt-0.5">
                    {[5, 10].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => handleResistanceChange(elem.key, (resistances[elem.key] || 0) + step)}
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-stone-800 text-stone-400 hover:text-white"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Interactive Incoming Damage & Mitigation Calculator */}
          <div className="bg-stone-950 p-4 rounded-xl border border-amber-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Incoming Damage Calculator
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                Test DR & Resistance Mitigation
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-stone-400 block mb-1 font-mono text-[10px]">Damage Amount:</label>
                <input
                  type="number"
                  min="0"
                  value={incomingAmount}
                  onChange={(e) => setIncomingAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-center font-bold text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-mono text-[10px]">Damage Type:</label>
                <select
                  value={incomingType}
                  onChange={(e) => setIncomingType(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-stone-200 font-mono"
                >
                  <option value="Slashing">Slashing</option>
                  <option value="Piercing">Piercing</option>
                  <option value="Bludgeoning">Bludgeoning</option>
                  <option value="Fire">Fire</option>
                  <option value="Cold">Cold</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Acid">Acid</option>
                  <option value="Sonic">Sonic</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-mono text-[10px]">Weapon Material:</label>
                <select
                  value={weaponMaterial}
                  onChange={(e) => setWeaponMaterial(e.target.value as any)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-stone-200 font-mono text-[11px]"
                >
                  <option value="normal">Standard Steel</option>
                  <option value="silver">Alchemical Silver</option>
                  <option value="cold_iron">Cold Iron</option>
                  <option value="adamantine">Adamantine</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-mono text-[10px]">Alignment / Magic:</label>
                <div className="flex items-center gap-1.5 pt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMagicWeapon}
                      onChange={(e) => setIsMagicWeapon(e.target.checked)}
                      className="accent-amber-500 w-3.5 h-3.5 rounded"
                    />
                    <span className="text-[11px] font-mono text-stone-300">Magic</span>
                  </label>
                  <select
                    value={weaponAlignment}
                    onChange={(e) => setWeaponAlignment(e.target.value as any)}
                    className="bg-stone-900 border border-stone-700 rounded px-1.5 py-0.5 text-stone-200 font-mono text-[10px]"
                  >
                    <option value="none">Align: None</option>
                    <option value="good">Good</option>
                    <option value="evil">Evil</option>
                    <option value="lawful">Lawful</option>
                    <option value="chaotic">Chaotic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="p-3 bg-stone-900/90 rounded-lg border border-stone-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-stone-200 font-mono flex items-center gap-2">
                  <span>Raw: {incomingAmount} {incomingType}</span>
                  <span>&rarr;</span>
                  <span className="text-amber-300">Final Damage: {calcResult.finalDamage}</span>
                  {calcResult.drMitigated > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-700">
                      -{calcResult.drMitigated} DR
                    </span>
                  )}
                  {calcResult.energyMitigated > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      -{calcResult.energyMitigated} Resist
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5 font-mono">
                  {calcResult.explanation}
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyDamageToHp}
                className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-bold rounded-lg border border-rose-600/50 transition flex items-center gap-1.5 shrink-0"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Apply -{calcResult.finalDamage} HP</span>
              </button>
            </div>

            {appliedNotice && (
              <div className="p-2 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs rounded-lg text-center font-mono animate-in fade-in">
                {appliedNotice}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 bg-sky-600 hover:bg-sky-500 text-stone-950 text-xs font-bold rounded-lg transition shadow-lg"
          >
            Save Defenses
          </button>
        </div>
      </div>
    </div>
  );
};
