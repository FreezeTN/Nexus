import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { get35eArmorClass } from '../../utils/calculators/dnd35eCalculators';
import { Shield, X, CheckCircle2, Info, HelpCircle, Layers, Sparkles, Maximize2 } from 'lucide-react';
import { CreatureSizeScaleModal } from './CreatureSizeScaleModal';

interface Edit35eAcModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

const SIZE_OPTIONS: { size: CharacterData['sizeCategory']; label: string; mod: number }[] = [
  { size: 'Fine', label: 'Fine (+8 AC / +8 Atk)', mod: 8 },
  { size: 'Diminutive', label: 'Diminutive (+4 AC / +4 Atk)', mod: 4 },
  { size: 'Tiny', label: 'Tiny (+2 AC / +2 Atk)', mod: 2 },
  { size: 'Small', label: 'Small (+1 AC / +1 Atk, e.g. Halfling/Gnome)', mod: 1 },
  { size: 'Medium', label: 'Medium (+0 AC / +0 Atk, e.g. Human/Elf/Dwarf)', mod: 0 },
  { size: 'Large', label: 'Large (-1 AC / -1 Atk, e.g. Ogre/Centaur)', mod: -1 },
  { size: 'Huge', label: 'Huge (-2 AC / -2 Atk, e.g. Giant)', mod: -2 },
  { size: 'Gargantuan', label: 'Gargantuan (-4 AC / -4 Atk)', mod: -4 },
  { size: 'Colossal', label: 'Colossal (-8 AC / -8 Atk, e.g. Great Dragon)', mod: -8 },
];

export const Edit35eAcModal: React.FC<Edit35eAcModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const [sizeCategory, setSizeCategory] = useState<CharacterData['sizeCategory']>(character.sizeCategory || 'Medium');
  const [naturalArmor, setNaturalArmor] = useState<string>(character.naturalArmorBonus !== undefined ? String(character.naturalArmorBonus) : '');
  const [deflectionBonus, setDeflectionBonus] = useState<string>(character.deflectionBonus !== undefined ? String(character.deflectionBonus) : '');
  const [dodgeBonus, setDodgeBonus] = useState<string>(character.dodgeBonus !== undefined ? String(character.dodgeBonus) : '');
  const [miscBonus, setMiscBonus] = useState<string>(character.miscAcBonus !== undefined ? String(character.miscAcBonus) : '');
  const [maxDexOverride, setMaxDexOverride] = useState<string>(character.maxDexBonusOverride !== undefined ? String(character.maxDexBonusOverride) : '');
  const [spellResist, setSpellResist] = useState<string>(character.spellResist !== undefined ? String(character.spellResist) : '');
  const [touchAcOverride, setTouchAcOverride] = useState<string>(character.touchAcOverride !== undefined ? String(character.touchAcOverride) : '');
  const [flatFootedOverride, setFlatFootedOverride] = useState<string>(character.flatFootedAcOverride !== undefined ? String(character.flatFootedAcOverride) : '');
  const [showSizeTableModal, setShowSizeTableModal] = useState(false);

  if (!isOpen) return null;

  // Preview live changes
  const previewChar: CharacterData = {
    ...character,
    sizeCategory,
    naturalArmorBonus: naturalArmor !== '' ? Number(naturalArmor) : undefined,
    deflectionBonus: deflectionBonus !== '' ? Number(deflectionBonus) : undefined,
    dodgeBonus: dodgeBonus !== '' ? Number(dodgeBonus) : undefined,
    miscAcBonus: miscBonus !== '' ? Number(miscBonus) : undefined,
    maxDexBonusOverride: maxDexOverride !== '' ? Number(maxDexOverride) : undefined,
    spellResist: spellResist !== '' ? Number(spellResist) : undefined,
    touchAcOverride: touchAcOverride !== '' ? Number(touchAcOverride) : undefined,
    flatFootedAcOverride: flatFootedOverride !== '' ? Number(flatFootedOverride) : undefined,
  };

  const previewAc = get35eArmorClass(previewChar);

  const handleSave = () => {
    onUpdateCharacter({
      ...previewChar,
      armorClass: previewAc.totalAc
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-200">D&D 3.5e Armor Class Calculator</h2>
              <p className="text-xs text-stone-400">Configure all 8 official 3.5e defense factors and stacking modifiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Equation Breakdown Preview */}
        <div className="p-4 bg-stone-950 border-b border-stone-800/80">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Live 3.5e Formula Result</span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 min-w-[560px] text-center font-mono text-xs">
              {/* TOTAL AC */}
              <div className="flex flex-col items-center bg-stone-900 border-2 border-amber-500 rounded-lg p-1.5 min-w-[56px] shadow">
                <span className="text-lg font-black text-amber-300 font-serif leading-none">{previewAc.totalAc}</span>
                <span className="text-[8px] text-stone-300 font-sans uppercase font-bold mt-1">TOTAL AC</span>
              </div>

              <span className="text-stone-400 font-bold text-base">=</span>

              {/* BASE 10 */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]">
                <span className="text-xs font-bold text-stone-200">10</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">BASE</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* ARMOR BONUS */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.armor.join(', ') || 'Armor Bonus'}>
                <span className="text-xs font-bold text-sky-300">{previewAc.armorBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">ARMOR</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* SHIELD BONUS */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.shield.join(', ') || 'Shield Bonus'}>
                <span className="text-xs font-bold text-indigo-300">{previewAc.shieldBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">SHIELD</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* DEX MOD */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.dex.join(', ') || 'Dexterity Modifier'}>
                <span className="text-xs font-bold text-emerald-300">{previewAc.dexBonus >= 0 ? `+${previewAc.dexBonus}` : previewAc.dexBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">DEX</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* SIZE MOD */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.size.join(', ') || 'Size Modifier'}>
                <span className="text-xs font-bold text-yellow-300">{previewAc.sizeModifier >= 0 ? `+${previewAc.sizeModifier}` : previewAc.sizeModifier}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">SIZE</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* NATURAL ARMOR */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.natural.join(', ') || 'Natural Armor'}>
                <span className="text-xs font-bold text-amber-300">{previewAc.naturalArmorBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">NATURAL</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* DEFLECTION */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.deflection.join(', ') || 'Deflection'}>
                <span className="text-xs font-bold text-cyan-300">{previewAc.deflectionBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">DEFLECT.</span>
              </div>

              <span className="text-stone-500 font-bold">+</span>

              {/* MISC */}
              <div className="flex flex-col items-center bg-stone-900/80 border border-stone-700 rounded p-1 min-w-[44px]" title={previewAc.sources.misc.join(', ') || 'Misc/Dodge'}>
                <span className="text-xs font-bold text-purple-300">{previewAc.miscBonus}</span>
                <span className="text-[7.5px] text-stone-400 font-sans uppercase mt-0.5">MISC</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-800 text-xs font-mono text-center">
            <div className="bg-stone-900 p-1.5 rounded border border-stone-800 flex items-center justify-between px-3">
              <span className="text-stone-400 text-[10px] font-sans">Touch AC (Ray/Touch spells):</span>
              <span className="font-bold text-amber-300 text-sm">{previewAc.touchAc}</span>
            </div>
            <div className="bg-stone-900 p-1.5 rounded border border-stone-800 flex items-center justify-between px-3">
              <span className="text-stone-400 text-[10px] font-sans">Flat-Footed AC (Surprised):</span>
              <span className="font-bold text-amber-300 text-sm">{previewAc.flatFootedAc}</span>
            </div>
          </div>
        </div>

        {/* Input Fields Form */}
        <div className="p-4 space-y-4 flex-1">
          {/* Size Category */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-amber-300 text-xs font-semibold">
                Character Size Category (Modifies AC & Attack)
              </label>
              <button
                type="button"
                onClick={() => setShowSizeTableModal(true)}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-stone-900 border border-amber-600/40 px-2 py-0.5 rounded flex items-center gap-1 transition"
              >
                <Maximize2 className="w-3 h-3" />
                <span>View Full Size & Scale Table</span>
              </button>
            </div>
            <select
              value={sizeCategory || 'Medium'}
              onChange={(e) => setSizeCategory(e.target.value as CharacterData['sizeCategory'])}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 text-xs font-mono"
            >
              {SIZE_OPTIONS.map(opt => (
                <option key={opt.size} value={opt.size}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Natural Armor */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-amber-200 text-xs font-semibold">Natural Armor Bonus</label>
                <span className="text-[10px] text-stone-500 font-mono">e.g. Barkskin, Amulet</span>
              </div>
              <input
                type="number"
                min="0"
                value={naturalArmor}
                onChange={(e) => setNaturalArmor(e.target.value)}
                placeholder={previewAc.sources.natural.length > 0 ? `Auto: +${previewAc.naturalArmorBonus}` : '0'}
                className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
              <p className="text-[10px] text-stone-500">
                {previewAc.sources.natural.length > 0 ? `Active: ${previewAc.sources.natural.join(', ')}` : 'Racial scales, thick hide, or magical amulet.'}
              </p>
            </div>

            {/* Deflection Bonus */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-cyan-200 text-xs font-semibold">Deflection Bonus</label>
                <span className="text-[10px] text-stone-500 font-mono">e.g. Ring of Protection</span>
              </div>
              <input
                type="number"
                min="0"
                value={deflectionBonus}
                onChange={(e) => setDeflectionBonus(e.target.value)}
                placeholder={previewAc.sources.deflection.length > 0 ? `Auto: +${previewAc.deflectionBonus}` : '0'}
                className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
              <p className="text-[10px] text-stone-500">
                {previewAc.sources.deflection.length > 0 ? `Active: ${previewAc.sources.deflection.join(', ')}` : 'Deflects incoming attacks and applies to Touch AC.'}
              </p>
            </div>

            {/* Dodge Bonus */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-emerald-200 text-xs font-semibold">Dodge Bonus (Stacks)</label>
                <span className="text-[10px] text-stone-500 font-mono">e.g. Dodge Feat, Haste</span>
              </div>
              <input
                type="number"
                min="0"
                value={dodgeBonus}
                onChange={(e) => setDodgeBonus(e.target.value)}
                placeholder="0"
                className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
              <p className="text-[10px] text-stone-500">
                Dodge bonuses stack with each other and apply to Touch AC, but are lost when Flat-Footed.
              </p>
            </div>

            {/* Misc AC Bonus */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-purple-200 text-xs font-semibold">Misc / Insight / Sacred Bonus</label>
                <span className="text-[10px] text-stone-500 font-mono">e.g. Monk WIS, Luck</span>
              </div>
              <input
                type="number"
                value={miscBonus}
                onChange={(e) => setMiscBonus(e.target.value)}
                placeholder="0"
                className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
              <p className="text-[10px] text-stone-500">
                {previewAc.sources.misc.length > 0 ? `Active: ${previewAc.sources.misc.join(', ')}` : 'Insight, Morale, Sacred, Profane, or Monk Wisdom modifiers.'}
              </p>
            </div>
          </div>

          {/* Secondary Overrides & Special Defenses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-stone-800">
            <div>
              <label className="block text-stone-400 text-[11px] mb-1">Max DEX Cap Override</label>
              <input
                type="number"
                value={maxDexOverride}
                onChange={(e) => setMaxDexOverride(e.target.value)}
                placeholder={`Current: +${previewAc.maxDexCap === 99 ? '∞' : previewAc.maxDexCap}`}
                className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-[11px] mb-1">Spell Resistance (SR)</label>
              <input
                type="number"
                min="0"
                value={spellResist}
                onChange={(e) => setSpellResist(e.target.value)}
                placeholder="e.g. 15, 22"
                className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-stone-400 text-[11px] mb-1">Touch AC Flat Override (±)</label>
              <input
                type="number"
                value={touchAcOverride}
                onChange={(e) => setTouchAcOverride(e.target.value)}
                placeholder="0"
                className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-stone-200 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-800 flex items-center justify-end gap-2 bg-stone-900 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply 3.5e Defenses</span>
          </button>
        </div>
      </div>

      {/* Embedded Creature Size and Scale Table Modal */}
      <CreatureSizeScaleModal
        isOpen={showSizeTableModal}
        onClose={() => setShowSizeTableModal(false)}
        character={{ ...previewChar, sizeCategory }}
        onUpdateCharacter={(up) => {
          if (up.sizeCategory) setSizeCategory(up.sizeCategory);
          onUpdateCharacter(up);
        }}
      />
    </div>
  );
};
