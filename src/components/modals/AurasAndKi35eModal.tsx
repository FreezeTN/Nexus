import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getDragonShamanAuraBonus,
  getMarshalMajorAuraBonus,
  getNinjaMaxKiPoints,
  DRAGON_SHAMAN_AURAS,
  MARSHAL_MINOR_AURAS
} from '../../utils/calculators/supplemental35eCalculators';
import { Sun, Shield, Eye, Flame, Zap, X, Plus, Minus, CheckCircle2, RotateCcw, Heart, Sparkles } from 'lucide-react';
import { getCombinedLevel, getAbilityModifier } from '../../utils/dndCalculations';

interface AurasAndKi35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const AurasAndKi35eModal: React.FC<AurasAndKi35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const level = getCombinedLevel(character);
  const chaMod = getAbilityModifier(character.abilities.CHA.score);
  const wisMod = getAbilityModifier(character.abilities.WIS.score);
  const clsLower = (character.characterClass || '').toLowerCase();

  const isDragonShaman = clsLower.includes('dragon shaman') || clsLower.includes('shaman');
  const isMarshal = clsLower.includes('marshal');
  const isNinja = clsLower.includes('ninja');

  const dsAuraBonus = getDragonShamanAuraBonus(level);
  const marshalMajorBonus = getMarshalMajorAuraBonus(level);
  const maxKi = getNinjaMaxKiPoints(level, wisMod);
  const maxVitalityPool = Math.max(1, level * Math.max(1, chaMod) * 2);

  const existingState = character.aurasAndKi35e || {
    activeDraconicAura: 'Vigor',
    activeMajorAura: 'Motivate Ardor (+Damage)',
    activeMinorAura: 'Motivate Dexterity',
    currentKiPoints: maxKi,
    ghostStepActive: false,
    touchOfVitalitySpent: 0
  };

  const [activeDraconicAura, setActiveDraconicAura] = useState<string>(existingState.activeDraconicAura || 'Vigor');
  const [activeMajorAura, setActiveMajorAura] = useState<string>(existingState.activeMajorAura || '');
  const [activeMinorAura, setActiveMinorAura] = useState<string>(existingState.activeMinorAura || '');
  const [kiPoints, setKiPoints] = useState<number>(existingState.currentKiPoints ?? maxKi);
  const [ghostStep, setGhostStep] = useState<boolean>(existingState.ghostStepActive || false);
  const [vitalitySpent, setVitalitySpent] = useState<number>(existingState.touchOfVitalitySpent || 0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVitality = Math.max(0, maxVitalityPool - vitalitySpent);

  const handleSpendKi = (ability: string) => {
    if (kiPoints <= 0) {
      setStatusNotice(`⚠️ No Ki Points Remaining! Cannot activate "${ability}".`);
      return;
    }
    const updated = kiPoints - 1;
    setKiPoints(updated);
    if (ability === 'Ghost Step') setGhostStep(true);
    setStatusNotice(`⚡ Ki Activated: ${ability}! (1 Ki spent, ${updated} remaining)`);
  };

  const handleSpendVitality = (amount: number) => {
    if (amount > currentVitality) {
      setStatusNotice('⚠️ Not enough Touch of Vitality pool remaining!');
      return;
    }
    setVitalitySpent(prev => prev + amount);
    setStatusNotice(`💖 Touch of Vitality: Healed ${amount} HP! (${currentVitality - amount} pool remaining)`);
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      aurasAndKi35e: {
        activeDraconicAura,
        activeMajorAura,
        activeMinorAura,
        currentKiPoints: kiPoints,
        ghostStepActive: ghostStep,
        touchOfVitalitySpent: vitalitySpent
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-emerald-500/40 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-600/40 rounded-lg text-emerald-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Auras, Ki & Vitality Suite
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-mono">
                  3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Draconic auras, Marshal battlefield commands, and Ninja supernatural Ki powers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {statusNotice && (
            <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-amber-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dragon Shaman Auras & Touch of Vitality */}
          {(isDragonShaman || (!isMarshal && !isNinja)) && (
            <div className="p-4 bg-neutral-950/70 border border-emerald-800/40 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div>
                  <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-emerald-400" /> Draconic Aura
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Aura Radius: 30 ft • Bonus: <strong className="text-emerald-300 font-mono">+{dsAuraBonus}</strong> to all allies
                  </p>
                </div>
                <select
                  value={activeDraconicAura}
                  onChange={e => setActiveDraconicAura(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  {DRAGON_SHAMAN_AURAS.map(a => (
                    <option key={a.name} value={a.name}>
                      {a.name} (+{dsAuraBonus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-300">
                <span className="font-semibold text-white">Active Effect: </span>
                {DRAGON_SHAMAN_AURAS.find(a => a.name === activeDraconicAura)?.effect}
              </div>

              {/* Touch of Vitality Pool */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400" /> Touch of Vitality Pool:
                    <span className="font-mono text-emerald-300 ml-1">{currentVitality} / {maxVitalityPool} HP</span>
                  </span>
                  <p className="text-[11px] text-neutral-400">Heal allies by touch; also removes conditions at higher levels</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpendVitality(5)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded transition"
                  >
                    Heal 5 HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setVitalitySpent(0)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded transition"
                    title="Refresh pool upon long rest"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Marshal Minor & Major Auras */}
          {(isMarshal || (!isDragonShaman && !isNinja)) && (
            <div className="p-4 bg-neutral-950/70 border border-blue-800/40 rounded-xl space-y-3">
              <h3 className="font-bold text-xs text-blue-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                <Shield className="w-4 h-4 text-blue-400" /> Marshal Commander Auras (60 ft Radius)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Minor Aura */}
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
                  <span className="text-xs font-bold text-white">Minor Aura (+CHA Mod: {chaMod >= 0 ? `+${chaMod}` : chaMod})</span>
                  <select
                    value={activeMinorAura}
                    onChange={e => setActiveMinorAura(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-xs text-white rounded p-1.5"
                  >
                    <option value="">No Minor Aura Active</option>
                    {MARSHAL_MINOR_AURAS.map(a => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-400">
                    {MARSHAL_MINOR_AURAS.find(a => a.name === activeMinorAura)?.effect || 'Adds your Charisma bonus to the chosen roll.'}
                  </p>
                </div>

                {/* Major Aura */}
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
                  <span className="text-xs font-bold text-white">Major Aura (+{marshalMajorBonus})</span>
                  <select
                    value={activeMajorAura}
                    onChange={e => setActiveMajorAura(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-xs text-white rounded p-1.5"
                  >
                    <option value="">No Major Aura Active</option>
                    <option value="Motivate Ardor">Motivate Ardor (+{marshalMajorBonus} Melee Damage)</option>
                    <option value="Motivate Attack">Motivate Attack (+{marshalMajorBonus} Melee Attack)</option>
                    <option value="Motivate Care">Motivate Care (+{marshalMajorBonus} Armor Class)</option>
                    <option value="Motivate Urgency">Motivate Urgency (+5 ft Base Speed)</option>
                    <option value="Hardy Soldiers">Hardy Soldiers (+{marshalMajorBonus} Damage Reduction)</option>
                  </select>
                  <p className="text-[10px] text-neutral-400">
                    Broad tactical aura bolstering troop combat readiness.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ninja Ki Pool & Ghost Step */}
          {(isNinja || (!isDragonShaman && !isMarshal)) && (
            <div className="p-4 bg-neutral-950/70 border border-amber-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Ninja Ki Power Pool
                </h3>
                <div className="flex items-baseline gap-1 font-mono text-sm">
                  <span className="text-white font-bold">{kiPoints}</span>
                  <span className="text-neutral-400">/ {maxKi} Ki Daily</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSpendKi('Ghost Step')}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-white">Ghost Step</div>
                    <div className="text-[10px] text-neutral-400">Swift action: Invisibility for 1 round (or Ethereal at lvl 10+)</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">1 Ki</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSpendKi('Ki Dodge')}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-white">Ki Dodge</div>
                    <div className="text-[10px] text-neutral-400">Swift action (lvl 6+): Gain 20% miss chance against attacks for 1 round</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">1 Ki</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            Save Auras & Ki
          </button>
        </div>

      </div>
    </div>
  );
};
