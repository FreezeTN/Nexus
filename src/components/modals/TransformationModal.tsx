import React, { useState } from 'react';
import { CharacterData, TransformationForm, Attack } from '../../types';
import { PRESET_TRANSFORMATION_FORMS, applyTransformation, revertTransformation, updateActiveTransformation } from '../../data/transformationData';

interface TransformationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const TransformationModal: React.FC<TransformationModalProps> = ({
  isOpen = true,
  onClose,
  character,
  onUpdateCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [editingActiveForm, setEditingActiveForm] = useState(false);
  
  // Custom / Form Builder State
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<TransformationForm['type']>('Wild Shape');
  const [customSize, setCustomSize] = useState<TransformationForm['sizeCategory']>('Medium');
  const [customHp, setCustomHp] = useState(30);
  const [customAc, setCustomAc] = useState(13);
  const [customSpeed, setCustomSpeed] = useState(30);
  const [customStr, setCustomStr] = useState(14);
  const [customDex, setCustomDex] = useState(14);
  const [customCon, setCustomCon] = useState(14);
  const [customHasHands, setCustomHasHands] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  // Custom Natural Weapons List
  const [naturalWeapons, setNaturalWeapons] = useState<Attack[]>([
    {
      id: 'nw-1',
      name: 'Claws',
      attackBonus: 5,
      damage: '2d6 + 3',
      damageType: 'Slashing',
      range: '5 ft Melee',
      notes: 'Sharp beast claws'
    }
  ]);

  if (!isOpen) return null;

  const isTransformed = Boolean(character.activeTransformation);
  const activeForm = character.activeTransformation?.form;

  const handleApplyPreset = (form: TransformationForm) => {
    const updated = applyTransformation(character, form);
    onUpdateCharacter(updated);
    onClose();
  };

  const handleCustomizePreset = (form: TransformationForm) => {
    setCustomName(`${form.name} (Customized)`);
    setCustomType(form.type);
    setCustomSize(form.sizeCategory || 'Medium');
    setCustomHp(form.formHpMax);
    setCustomAc(form.formAc);
    setCustomSpeed(form.formSpeed);
    setCustomStr(form.formAbilities?.STR ?? 14);
    setCustomDex(form.formAbilities?.DEX ?? 14);
    setCustomCon(form.formAbilities?.CON ?? 14);
    setCustomHasHands(form.hasHands ?? false);
    setCustomNotes(form.notes || '');
    setNaturalWeapons(JSON.parse(JSON.stringify(form.naturalWeapons || [])));
    setActiveTab('custom');
  };

  const handleRevert = () => {
    const updated = revertTransformation(character);
    onUpdateCharacter(updated);
    onClose();
  };

  const handleStartEditActiveForm = () => {
    if (!activeForm) return;
    setCustomName(activeForm.name);
    setCustomType(activeForm.type);
    setCustomSize(activeForm.sizeCategory || 'Medium');
    setCustomHp(character.hpMax);
    setCustomAc(character.armorClass);
    setCustomSpeed(character.speed);
    setCustomStr(character.abilities.STR.score);
    setCustomDex(character.abilities.DEX.score);
    setCustomCon(character.abilities.CON.score);
    setCustomHasHands(activeForm.hasHands ?? false);
    setCustomNotes(activeForm.notes || '');
    setNaturalWeapons(JSON.parse(JSON.stringify(activeForm.naturalWeapons || [])));
    setEditingActiveForm(true);
  };

  const handleSaveActiveFormEdits = () => {
    if (!activeForm) return;
    const updatedForm: TransformationForm = {
      ...activeForm,
      name: customName || activeForm.name,
      type: customType,
      sizeCategory: customSize,
      formHpMax: Number(customHp) || character.hpMax,
      formHpCurrent: Math.min(character.hpCurrent, Number(customHp) || character.hpMax),
      formAc: Number(customAc) || character.armorClass,
      formSpeed: Number(customSpeed) || character.speed,
      formAbilities: {
        STR: Number(customStr),
        DEX: Number(customDex),
        CON: Number(customCon),
      },
      hasHands: customHasHands,
      naturalWeapons,
      notes: customNotes,
    };

    const updatedChar = updateActiveTransformation(character, updatedForm);
    onUpdateCharacter(updatedChar);
    setEditingActiveForm(false);
  };

  const handleAddNaturalWeapon = () => {
    setNaturalWeapons(prev => [
      ...prev,
      {
        id: `nw-custom-${Date.now()}`,
        name: 'Bite',
        attackBonus: 5,
        damage: '1d8 + 3',
        damageType: 'Piercing',
        range: '5 ft Melee',
        notes: 'Vicious bite attack'
      }
    ]);
  };

  const handleRemoveNaturalWeapon = (id: string) => {
    setNaturalWeapons(prev => prev.filter(nw => nw.id !== id));
  };

  const handleUpdateNaturalWeapon = (id: string, field: keyof Attack, value: any) => {
    setNaturalWeapons(prev =>
      prev.map(nw => (nw.id === id ? { ...nw, [field]: value } : nw))
    );
  };

  const handleApplyCustomForm = () => {
    if (!customName.trim()) return;

    const customForm: TransformationForm = {
      id: `custom-form-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      sizeCategory: customSize,
      formHpMax: Number(customHp) || 20,
      formHpCurrent: Number(customHp) || 20,
      formAc: Number(customAc) || 12,
      formSpeed: Number(customSpeed) || 30,
      formAbilities: {
        STR: Number(customStr) || 10,
        DEX: Number(customDex) || 10,
        CON: Number(customCon) || 10,
      },
      hasHands: customHasHands,
      naturalWeapons,
      notes: customNotes,
    };

    const updated = applyTransformation(character, customForm);
    onUpdateCharacter(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-3xl text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐾</span>
            <div>
              <h2 className="text-xl font-bold text-amber-200">Shapeshift Engine</h2>
              <p className="text-xs text-stone-400">
                Wild Shape, Polymorph, Lycanthropy & Shapechange form management with auto-injected Natural Weapons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 font-bold text-xl px-2 py-1 rounded-lg hover:bg-stone-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Active Transformation Status Banner if transformed */}
        {isTransformed && activeForm && (
          <div className="bg-emerald-950/80 border-b border-emerald-700/60 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐺</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-200 uppercase tracking-wide">Active Form:</span>
                    <span className="text-lg font-extrabold text-amber-300">{activeForm.name}</span>
                    <span className="text-xs bg-emerald-900 border border-emerald-500 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {activeForm.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1">
                    HP: <span className="font-bold text-emerald-400">{character.hpCurrent} / {character.hpMax}</span> | AC: <span className="font-bold text-amber-300">{character.armorClass}</span> | Speed: <span className="font-bold text-sky-300">{character.speed} ft</span> | STR: <span className="font-bold text-amber-200">{character.abilities.STR.score}</span> | DEX: <span className="font-bold text-amber-200">{character.abilities.DEX.score}</span> | CON: <span className="font-bold text-amber-200">{character.abilities.CON.score}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (editingActiveForm) {
                      setEditingActiveForm(false);
                    } else {
                      handleStartEditActiveForm();
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 border border-emerald-400 text-emerald-100 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                >
                  <span>⚙️</span> {editingActiveForm ? 'Cancel Editing' : 'Edit Live Form Stats'}
                </button>
                <button
                  onClick={handleRevert}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 border border-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                >
                  <span>⏪</span> Revert to True Form
                </button>
              </div>
            </div>

            {/* Live Active Form Stat Editor */}
            {editingActiveForm && (
              <div className="bg-stone-900 border border-purple-500/80 rounded-xl p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between border-b border-purple-800/50 pb-2">
                  <h4 className="text-xs font-bold uppercase text-purple-200">Adjust Live Transformation Stats & Modifiers</h4>
                  <span className="text-[10px] text-purple-300 italic">Changes update your character stats immediately</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">STR Score</label>
                    <input
                      type="number"
                      value={customStr}
                      onChange={e => setCustomStr(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-mono text-amber-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">DEX Score</label>
                    <input
                      type="number"
                      value={customDex}
                      onChange={e => setCustomDex(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-mono text-amber-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">CON Score</label>
                    <input
                      type="number"
                      value={customCon}
                      onChange={e => setCustomCon(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-mono text-amber-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Form Max HP</label>
                    <input
                      type="number"
                      value={customHp}
                      onChange={e => setCustomHp(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-bold text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Armor Class</label>
                    <input
                      type="number"
                      value={customAc}
                      onChange={e => setCustomAc(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-bold text-amber-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Speed (ft)</label>
                    <input
                      type="number"
                      value={customSpeed}
                      onChange={e => setCustomSpeed(Number(e.target.value))}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-sm font-bold text-sky-300 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-purple-800/40">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customHasHands}
                      onChange={e => setCustomHasHands(e.target.checked)}
                      className="accent-purple-500 rounded w-4 h-4"
                    />
                    <span>✋ Form Has Hands / Humanoid Anatomy (Allows equipping weapons, armor & gear)</span>
                  </label>

                  <button
                    onClick={handleSaveActiveFormEdits}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs rounded-lg transition shadow"
                  >
                    💾 Save Active Form Stat Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'presets'
                ? 'border-amber-400 text-amber-300 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            🐾 Beast & Monster Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'custom'
                ? 'border-amber-400 text-amber-300 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            ✨ Custom Form Builder
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Edition Rules Banner */}
              <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <div>
                    <span className="font-bold text-amber-300">
                      {character.edition === '3.5e' ? '3.5e Wild Shape & Polymorph Rules Active' : '5e Wild Shape & Polymorph Rules Active'}
                    </span>
                    <p className="text-[11px] text-stone-300 mt-0.5">
                      {character.edition === '3.5e'
                        ? '3.5e Rule: You retain your true Hit Points & Hit Dice (healing 1 HP/level on transformation). You gain physical stats (STR/DEX/CON), Natural Armor, and Base Attack Bonus natural attack routines.'
                        : '5e Rule: You gain the form\'s Hit Points as a temporary HP pool. Excess damage carries over to your normal HP pool. Mental stats (INT/WIS/CHA) are retained.'}
                    </p>
                  </div>
                </div>
                <span className="bg-amber-900/80 border border-amber-500/50 text-amber-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                  {character.edition || '5e'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_TRANSFORMATION_FORMS.filter(form => {
                  if (!form.edition || form.edition === 'both') return true;
                  if (character.edition === '3.5e') return form.edition === '3.5e';
                  return form.edition === '5e';
                }).map(form => (
                <div
                  key={form.id}
                  className="bg-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-xl p-4 transition flex flex-col justify-between space-y-3 shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-amber-300">{form.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5 flex-wrap">
                          <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">{form.type}</span>
                          <span>•</span>
                          <span>{form.sizeCategory}</span>
                          <span>•</span>
                          {form.hasHands ? (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] px-1.5 py-0.5 rounded-full font-bold">✋ Has Hands</span>
                          ) : (
                            <span className="bg-purple-950 text-purple-300 border border-purple-700/60 text-[10px] px-1.5 py-0.5 rounded-full font-bold">🐾 No Hands</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold block">{form.formHpMax} HP</span>
                        <span className="text-amber-300 block">{form.formAc} AC</span>
                        <span className="text-sky-300 block">{form.formSpeed} ft Speed</span>
                      </div>
                    </div>

                    {form.formAbilities && (
                      <div className="mt-2 text-xs bg-stone-900/80 p-2 rounded border border-stone-800 flex justify-around text-stone-300 font-mono">
                        <span>STR: <strong className="text-amber-300">{form.formAbilities.STR}</strong></span>
                        <span>DEX: <strong className="text-amber-300">{form.formAbilities.DEX}</strong></span>
                        <span>CON: <strong className="text-amber-300">{form.formAbilities.CON}</strong></span>
                      </div>
                    )}

                    {/* Natural Weapons List */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[11px] font-bold uppercase text-stone-400 tracking-wider">Natural Weapons:</span>
                      {form.naturalWeapons.map((nw, idx) => (
                        <div key={idx} className="bg-stone-900 border border-stone-800 rounded p-1.5 text-xs flex items-center justify-between">
                          <span className="font-bold text-stone-200">{nw.name}</span>
                          <span className="text-amber-300 font-mono">+{nw.attackBonus} to hit | {nw.damage} {nw.damageType}</span>
                        </div>
                      ))}
                    </div>

                    {form.specialTraits && form.specialTraits.length > 0 && (
                      <div className="mt-2 text-xs text-stone-400 italic">
                        {form.specialTraits.join(' • ')}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleCustomizePreset(form)}
                      className="py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-lg transition border border-stone-700 flex items-center justify-center gap-1.5"
                      title="Adjust Strength, Dexterity, Constitution, HP, AC or Natural Weapons before transforming"
                    >
                      <span>✏️</span> Adjust Stats
                    </button>
                    <button
                      onClick={() => handleApplyPreset(form)}
                      className="py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs rounded-lg transition shadow flex items-center justify-center gap-1"
                    >
                      <span>⚡</span> Quick Transform
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {activeTab === 'custom' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Form Name *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Manticore, Shadow Beast, Displacer Beast"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-sm text-stone-100 focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Transformation Type</label>
                  <select
                    value={customType}
                    onChange={e => setCustomType(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-sm text-stone-100 focus:border-amber-400 outline-none"
                  >
                    <option value="Wild Shape">Wild Shape</option>
                    <option value="Polymorph">Polymorph</option>
                    <option value="Shapechange">Shapechange</option>
                    <option value="Lycanthropy">Lycanthropy</option>
                    <option value="Vampire Form">Vampire Form</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Size Category</label>
                  <select
                    value={customSize}
                    onChange={e => setCustomSize(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-sm text-stone-100 focus:border-amber-400 outline-none"
                  >
                    <option value="Tiny">Tiny</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Huge">Huge</option>
                    <option value="Gargantuan">Gargantuan</option>
                  </select>
                </div>
              </div>

              {/* Form Vitals & Physical Stats */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase text-amber-300 tracking-wider">Form Physical Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Form HP</label>
                    <input
                      type="number"
                      value={customHp}
                      onChange={e => setCustomHp(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-emerald-400 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Armor Class</label>
                    <input
                      type="number"
                      value={customAc}
                      onChange={e => setCustomAc(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-amber-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Speed (ft)</label>
                    <input
                      type="number"
                      value={customSpeed}
                      onChange={e => setCustomSpeed(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-sky-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">STR Score</label>
                    <input
                      type="number"
                      value={customStr}
                      onChange={e => setCustomStr(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-stone-100 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">DEX Score</label>
                    <input
                      type="number"
                      value={customDex}
                      onChange={e => setCustomDex(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-stone-100 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">CON Score</label>
                    <input
                      type="number"
                      value={customCon}
                      onChange={e => setCustomCon(Number(e.target.value))}
                      className="w-full bg-stone-900 border border-stone-700 rounded p-1.5 text-sm text-stone-100 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customHasHands}
                      onChange={e => setCustomHasHands(e.target.checked)}
                      className="accent-amber-500 rounded w-4 h-4 cursor-pointer"
                    />
                    <span>✋ Form Has Hands / Humanoid Anatomy (Allows equipping weapons, armor & gear while transformed)</span>
                  </label>
                  <p className="text-[11px] text-stone-400 mt-0.5 ml-6">
                    If unchecked (e.g., Bear, Wolf, Spider), standard weapons and armor are automatically unequipped while transformed and restored when reverting.
                  </p>
                </div>
              </div>

              {/* Natural Weapons Builder */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-amber-300 tracking-wider">Natural Weapons (Claws, Bite, Horns, Slam)</h4>
                  <button
                    onClick={handleAddNaturalWeapon}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded transition"
                  >
                    + Add Natural Weapon
                  </button>
                </div>

                <div className="space-y-3">
                  {naturalWeapons.map((nw, index) => (
                    <div key={nw.id} className="bg-stone-900 border border-stone-800 rounded-lg p-3 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-200">Natural Weapon #{index + 1}</span>
                        {naturalWeapons.length > 1 && (
                          <button
                            onClick={() => handleRemoveNaturalWeapon(nw.id)}
                            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400">Weapon Name</label>
                          <input
                            type="text"
                            value={nw.name}
                            onChange={e => handleUpdateNaturalWeapon(nw.id, 'name', e.target.value)}
                            placeholder="e.g. Claws, Bite, Gore"
                            className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-xs text-stone-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400">Attack Bonus (+)</label>
                          <input
                            type="number"
                            value={nw.attackBonus}
                            onChange={e => handleUpdateNaturalWeapon(nw.id, 'attackBonus', Number(e.target.value))}
                            className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-xs text-stone-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400">Damage Roll</label>
                          <input
                            type="text"
                            value={nw.damage}
                            onChange={e => handleUpdateNaturalWeapon(nw.id, 'damage', e.target.value)}
                            placeholder="e.g. 2d6 + 4"
                            className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-xs text-stone-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400">Damage Type</label>
                          <input
                            type="text"
                            value={nw.damageType}
                            onChange={e => handleUpdateNaturalWeapon(nw.id, 'damageType', e.target.value)}
                            placeholder="e.g. Slashing, Piercing"
                            className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-xs text-stone-100 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleApplyCustomForm}
                disabled={!customName.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold text-base rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <span>⚡ Transform into Custom {customName || 'Form'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
