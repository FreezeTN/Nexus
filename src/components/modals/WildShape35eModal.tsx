import React, { useState } from 'react';
import { CharacterData, Attack } from '../../types';
import { OFFICIAL_35E_WILD_SHAPE_PRESETS, WildShapePreset } from '../../utils/dndCalculations';
import { Sparkles, Shield, X, Check, RotateCcw, PawPrint, Eye, Info } from 'lucide-react';

interface WildShape35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onClose: () => void;
}

export const WildShape35eModal: React.FC<WildShape35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('wolf');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Custom Form fields
  const [customName, setCustomName] = useState('Tiger');
  const [customSize, setCustomSize] = useState<'Small' | 'Medium' | 'Large' | 'Huge'>('Large');
  const [customStr, setCustomStr] = useState<number>(23);
  const [customDex, setCustomDex] = useState<number>(15);
  const [customCon, setCustomCon] = useState<number>(17);
  const [customNatArmor, setCustomNatArmor] = useState<number>(3);
  const [customSpeed, setCustomSpeed] = useState('40 ft.');
  const [customAtkName, setCustomAtkName] = useState('Claw (x2)');
  const [customAtkDamage, setCustomAtkDamage] = useState('1d8 + 6');

  if (!isOpen) return null;

  const activeShape = character.wildShapeActive ? character.wildShapeForm : null;
  const selectedPreset = OFFICIAL_35E_WILD_SHAPE_PRESETS.find(p => p.id === selectedPresetId) || OFFICIAL_35E_WILD_SHAPE_PRESETS[0];

  const handleAssumeForm = (preset: WildShapePreset) => {
    // Generate natural attacks to append to combat attacks
    const naturalAttacks: Attack[] = preset.naturalAttacks.map((atk, idx) => ({
      id: `nat-${preset.id}-${idx}-${Date.now()}`,
      name: `${preset.name}: ${atk.name}`,
      attackBonus: atk.attackBonus,
      damage: atk.damage,
      damageType: atk.type,
      range: 'Melee',
      notes: `Wild Shape natural attack (${preset.specialAbilities.join(', ')})`
    }));

    // Keep non-wildshape attacks, add form's attacks
    const cleanedAttacks = (character.attacks || []).filter(a => !a.id.startsWith('nat-'));

    onUpdateCharacter({
      ...character,
      wildShapeActive: true,
      wildShapeForm: {
        name: preset.name,
        size: preset.size,
        str: preset.str,
        dex: preset.dex,
        con: preset.con,
        naturalArmorBonus: preset.naturalArmorBonus,
        speed: preset.speed,
        naturalAttacks: preset.naturalAttacks,
        specialAbilities: preset.specialAbilities
      },
      attacks: [...cleanedAttacks, ...naturalAttacks]
    });
  };

  const handleAssumeCustomForm = () => {
    const naturalAttack: Attack = {
      id: `nat-custom-${Date.now()}`,
      name: `${customName}: ${customAtkName}`,
      attackBonus: Math.floor((customStr - 10) / 2),
      damage: customAtkDamage,
      damageType: 'Slashing',
      range: 'Melee',
      notes: 'Custom Wild Shape / Polymorph Natural Weapon'
    };

    const cleanedAttacks = (character.attacks || []).filter(a => !a.id.startsWith('nat-'));

    onUpdateCharacter({
      ...character,
      wildShapeActive: true,
      wildShapeForm: {
        name: customName,
        size: customSize,
        str: customStr,
        dex: customDex,
        con: customCon,
        naturalArmorBonus: customNatArmor,
        speed: customSpeed,
        naturalAttacks: [{ name: customAtkName, damage: customAtkDamage, attackBonus: Math.floor((customStr - 10) / 2), type: 'Slashing' }],
        specialAbilities: ['Low-Light Vision']
      },
      attacks: [...cleanedAttacks, naturalAttack]
    });
  };

  const handleRevertToNatural = () => {
    const cleanedAttacks = (character.attacks || []).filter(a => !a.id.startsWith('nat-'));
    onUpdateCharacter({
      ...character,
      wildShapeActive: false,
      wildShapeForm: undefined,
      attacks: cleanedAttacks
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-emerald-600/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 p-4 border-b border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <PawPrint className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-emerald-200">Wild Shape & Alternate Form</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Rules As Written (PHB p. 37 / MM p. 270)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Active Wild Shape Status */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Current Physical Form</div>
              <div className="text-xl font-serif font-black text-emerald-300 flex items-center gap-2 mt-0.5">
                {activeShape ? (
                  <>
                    <span>{activeShape.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-950 border border-emerald-700 rounded-full font-mono text-emerald-300">
                      {activeShape.size}
                    </span>
                  </>
                ) : (
                  <span>Natural Form ({character.race} {character.characterClass})</span>
                )}
              </div>
              {activeShape && (
                <div className="text-xs text-stone-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
                  <span>STR: <b className="text-emerald-400">{activeShape.str}</b></span>
                  <span>DEX: <b className="text-emerald-400">{activeShape.dex}</b></span>
                  <span>CON: <b className="text-emerald-400">{activeShape.con}</b></span>
                  <span>Nat Armor: <b className="text-amber-400">+{activeShape.naturalArmorBonus}</b></span>
                  <span>Speed: <b className="text-sky-400">{activeShape.speed}</b></span>
                </div>
              )}
            </div>

            {activeShape && (
              <button
                type="button"
                onClick={handleRevertToNatural}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                <span>Revert to Natural Form</span>
              </button>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isCustomMode
                  ? 'bg-emerald-950 border border-emerald-600 text-emerald-200'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              Official 3.5e Beast Library
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isCustomMode
                  ? 'bg-emerald-950 border border-emerald-600 text-emerald-200'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              Custom Creature / Polymorph Builder
            </button>
          </div>

          {!isCustomMode ? (
            /* Presets Grid */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {OFFICIAL_35E_WILD_SHAPE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const isCurrent = activeShape?.name === preset.name;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-emerald-950/70 border-emerald-500 shadow-md'
                          : isSelected
                          ? 'bg-stone-800 border-stone-600'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-200 text-sm">{preset.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-900 border border-stone-700 rounded text-stone-400 font-mono">
                            {preset.size}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 grid grid-cols-3 gap-1 my-1.5 font-mono">
                          <div>STR: <b className="text-stone-200">{preset.str}</b></div>
                          <div>DEX: <b className="text-stone-200">{preset.dex}</b></div>
                          <div>CON: <b className="text-stone-200">{preset.con}</b></div>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Nat Armor: <b className="text-amber-300">+{preset.naturalArmorBonus}</b> • Speed: <b className="text-sky-300">{preset.speed}</b>
                        </div>
                        <div className="text-[10px] text-stone-500 line-clamp-1 mt-1">
                          Attacks: {preset.naturalAttacks.map(a => `${a.name} (${a.damage})`).join(', ')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssumeForm(preset);
                        }}
                        className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          isCurrent
                            ? 'bg-emerald-800 text-white cursor-default'
                            : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200'
                        }`}
                      >
                        {isCurrent ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isCurrent ? 'Active Form' : `Assume ${preset.name}`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Form Builder */
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Form Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Size Category</label>
                  <select
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200"
                  >
                    <option value="Small">Small (+1 AC & Atk)</option>
                    <option value="Medium">Medium (Normal)</option>
                    <option value="Large">Large (-1 AC & Atk, +4 Grapple)</option>
                    <option value="Huge">Huge (-2 AC & Atk, +8 Grapple)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Base STR</label>
                  <input
                    type="number"
                    value={customStr}
                    onChange={(e) => setCustomStr(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Base DEX</label>
                  <input
                    type="number"
                    value={customDex}
                    onChange={(e) => setCustomDex(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Base CON</label>
                  <input
                    type="number"
                    value={customCon}
                    onChange={(e) => setCustomCon(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Natural Armor Bonus</label>
                  <input
                    type="number"
                    value={customNatArmor}
                    onChange={(e) => setCustomNatArmor(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Movement Speeds</label>
                  <input
                    type="text"
                    value={customSpeed}
                    onChange={(e) => setCustomSpeed(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Primary Natural Attack</label>
                  <input
                    type="text"
                    value={customAtkName}
                    onChange={(e) => setCustomAtkName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Attack Damage</label>
                  <input
                    type="text"
                    value={customAtkDamage}
                    onChange={(e) => setCustomAtkDamage(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAssumeCustomForm}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-black rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Assume Custom Form ({customName})</span>
              </button>
            </div>
          )}

          {/* RAW Wild Shape Rules Reminder */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
            <div className="font-bold text-stone-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>D&D 3.5e RAW Rules Compendium p. 120-123</span>
            </div>
            <p>
              • Physical scores (STR, DEX, CON) are replaced by the base values of the form.
              <br />
              • Mental scores (INT, WIS, CHA) and hit point maximums remain unchanged.
              <br />
              • Size category, natural armor, and movement modes/speeds are granted by the new form.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
