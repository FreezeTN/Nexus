import React, { useState } from 'react';
import { CharacterData, ShadowrunData, ShadowrunQuality, ShadowrunCyberware } from '../../types';
import { Brain, Zap, Shield, Heart, Plus, Trash2, Cpu, Sparkles, Dices, ChevronDown, ChevronUp } from 'lucide-react';

interface ShadowrunStatsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollPool: (label: string, poolSize: number) => void;
}

export const ShadowrunStatsPanel: React.FC<ShadowrunStatsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRollPool
}) => {
  const sr: ShadowrunData = character.shadowrun || {
    bod: 5,
    agi: 5,
    rea: 4,
    str: 4,
    wil: 4,
    log: 3,
    int: 4,
    cha: 3,
    edg: 3,
    edgCurrent: 3,
    ess: 6.0,
    mag: 0,
    res: 0,
    nuyen: 25000,
    karmaCurrent: 10,
    karmaTotal: 50,
    streetCred: 2,
    notoriety: 1,
    publicAwareness: 0,
    physicalBoxesCurrent: 0,
    stunBoxesCurrent: 0,
    overflowBoxesCurrent: 0,
    ballisticArmor: 12,
    impactArmor: 10,
    qualities: [],
    cyberware: [],
    srSkills: [],
    vehicles: []
  };

  const [newQualityName, setNewQualityName] = useState('');
  const [newQualityType, setNewQualityType] = useState<'Positive' | 'Negative'>('Positive');
  const [newQualityCost, setNewQualityCost] = useState(10);
  const [newQualityDesc, setNewQualityDesc] = useState('');

  const [newCyberName, setNewCyberName] = useState('');
  const [newCyberCategory, setNewCyberCategory] = useState<'Cyberware' | 'Bioware' | 'Nanoware'>('Cyberware');
  const [newCyberCost, setNewCyberCost] = useState(0.5);
  const [newCyberGrade, setNewCyberGrade] = useState<'Standard' | 'Alphaware' | 'Betaware' | 'Deltaware' | 'Used'>('Standard');
  const [newCyberDesc, setNewCyberDesc] = useState('');

  // Update shadowrun nested state
  const updateSR = (patch: Partial<ShadowrunData>) => {
    onUpdateCharacter({
      ...character,
      shadowrun: {
        ...sr,
        ...patch
      }
    });
  };

  // Calculations
  const physicalBoxesMax = 8 + Math.ceil(sr.bod / 2);
  const stunBoxesMax = 8 + Math.ceil(sr.wil / 2);
  const overflowBoxesMax = sr.bod;

  // Wound Modifier: -1 per 3 full boxes filled across Physical & Stun
  const totalDamageBoxes = sr.physicalBoxesCurrent + sr.stunBoxesCurrent;
  const woundModifier = -Math.floor(totalDamageBoxes / 3);

  // Total Essence Spent
  const essenceSpent = sr.cyberware.reduce((acc, c) => acc + (c.equipped !== false ? c.essenceCost : 0), 0);
  const remainingEssence = Math.max(0, Number((6.0 - essenceSpent).toFixed(2)));

  // Initiative calculation
  const physicalInitiativeBase = sr.rea + sr.int;
  const defensePoolBase = sr.rea + sr.int;

  const handleAddQuality = () => {
    if (!newQualityName.trim()) return;
    const q: ShadowrunQuality = {
      id: 'q-' + Date.now(),
      name: newQualityName.trim(),
      type: newQualityType,
      karmaCost: newQualityType === 'Positive' ? Math.abs(newQualityCost) : -Math.abs(newQualityCost),
      description: newQualityDesc.trim()
    };
    updateSR({ qualities: [...sr.qualities, q] });
    setNewQualityName('');
    setNewQualityDesc('');
  };

  const handleDeleteQuality = (id: string) => {
    updateSR({ qualities: sr.qualities.filter(q => q.id !== id) });
  };

  const handleAddCyberware = () => {
    if (!newCyberName.trim()) return;
    const c: ShadowrunCyberware = {
      id: 'cw-' + Date.now(),
      name: newCyberName.trim(),
      category: newCyberCategory,
      essenceCost: Number(newCyberCost) || 0,
      grade: newCyberGrade,
      description: newCyberDesc.trim(),
      equipped: true
    };
    updateSR({ cyberware: [...sr.cyberware, c] });
    setNewCyberName('');
    setNewCyberDesc('');
  };

  const handleDeleteCyberware = (id: string) => {
    updateSR({ cyberware: sr.cyberware.filter(c => c.id !== id) });
  };

  const attributesList = [
    { key: 'bod', label: 'Body (BOD)', desc: 'Physical stamina, health, damage tolerance', val: sr.bod },
    { key: 'agi', label: 'Agility (AGI)', desc: 'Hand-eye coordination, stealth, combat speed', val: sr.agi },
    { key: 'rea', label: 'Reaction (REA)', desc: 'Reflexes, physical initiative, defense rolls', val: sr.rea },
    { key: 'str', label: 'Strength (STR)', desc: 'Muscle power, melee damage, recoil control', val: sr.str },
    { key: 'wil', label: 'Willpower (WIL)', desc: 'Mental toughness, stun resistance, spell defense', val: sr.wil },
    { key: 'log', label: 'Logic (LOG)', desc: 'Technical knowledge, hacking, memory', val: sr.log },
    { key: 'int', label: 'Intuition (INT)', desc: 'Perception, alertness, street instincts', val: sr.int },
    { key: 'cha', label: 'Charisma (CHA)', desc: 'Leadership, social rolls, astral presence', val: sr.cha },
    { key: 'edg', label: 'Edge (EDG)', desc: 'Luck, rule of 6s, dramatic turns', val: sr.edg },
    { key: 'mag', label: 'Magic (MAG)', desc: 'Awakened power (Spells, Adept abilities)', val: sr.mag },
    { key: 'res', label: 'Resonance (RES)', desc: 'Technomancer Matrix power & Sprites', val: sr.res }
  ];

  return (
    <div className="space-y-6">
      {/* SHADOWRUN ATTRIBUTES & CONDITION TRACKS HEADER */}
      <div className="bg-stone-900 border border-cyan-600/50 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-cyan-300 flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" /> Shadowrun Core Attributes & Condition Monitors
            </h2>
            <p className="text-xs text-stone-400">
              Click any attribute to roll its raw D6 Success Pool. Wound penalties apply automatically (-1 per 3 damage boxes filled).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">Defense Pool</span>
              <span className="text-sm font-mono font-bold text-cyan-100">{defensePoolBase}d6</span>
            </div>
            <div className="bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-cyan-300 block">Physical Init</span>
              <span className="text-sm font-mono font-bold text-cyan-100">{physicalInitiativeBase} + 1d6</span>
            </div>
            <div className="bg-rose-950/80 border border-rose-500/50 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">Wound Mod</span>
              <span className={`text-sm font-mono font-bold ${woundModifier < 0 ? 'text-rose-300 animate-pulse' : 'text-stone-300'}`}>
                {woundModifier}
              </span>
            </div>
          </div>
        </div>

        {/* SHADOWRUN FINANCIAL & STREET CRED BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-stone-950/90 border border-stone-800 p-3 rounded-xl">
          {/* Nuyen */}
          <div className="bg-stone-900 border border-cyan-500/40 p-2 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Nuyen (¥)</span>
            <div className="flex items-center gap-1 justify-center">
              <span className="text-cyan-400 font-bold font-mono text-sm">¥</span>
              <input
                type="number"
                min="0"
                value={sr.nuyen}
                onChange={(e) => updateSR({ nuyen: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-950 border border-stone-700 rounded text-center font-mono font-bold text-cyan-200 text-sm py-0.5 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Current Karma */}
          <div className="bg-stone-900 border border-amber-500/40 p-2 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Current Karma</span>
            <input
              type="number"
              min="0"
              value={sr.karmaCurrent}
              onChange={(e) => updateSR({ karmaCurrent: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-stone-950 border border-stone-700 rounded text-center font-mono font-bold text-amber-300 text-sm py-0.5 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Street Cred */}
          <div className="bg-stone-900 border border-purple-500/40 p-2 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold text-purple-400 block mb-0.5">Street Cred</span>
            <input
              type="number"
              min="0"
              value={sr.streetCred}
              onChange={(e) => updateSR({ streetCred: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-stone-950 border border-stone-700 rounded text-center font-mono font-bold text-purple-300 text-sm py-0.5 focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Notoriety */}
          <div className="bg-stone-900 border border-rose-500/40 p-2 rounded-lg text-center">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Notoriety</span>
            <input
              type="number"
              min="0"
              value={sr.notoriety}
              onChange={(e) => updateSR({ notoriety: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-stone-950 border border-stone-700 rounded text-center font-mono font-bold text-rose-300 text-sm py-0.5 focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Public Awareness */}
          <div className="bg-stone-900 border border-emerald-500/40 p-2 rounded-lg text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Public Awareness</span>
            <input
              type="number"
              min="0"
              value={sr.publicAwareness}
              onChange={(e) => updateSR({ publicAwareness: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-stone-950 border border-stone-700 rounded text-center font-mono font-bold text-emerald-300 text-sm py-0.5 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {/* CONDITION MONITORS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Physical Condition Track */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-rose-400 font-serif">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" /> Physical Condition Monitor
              </span>
              <span className="font-mono text-stone-200">
                {sr.physicalBoxesCurrent} / {physicalBoxesMax} Boxes
              </span>
            </div>
            
            <div className="grid grid-cols-10 gap-1 pt-1">
              {Array.from({ length: physicalBoxesMax }).map((_, i) => {
                const isFilled = i < sr.physicalBoxesCurrent;
                const isWoundStep = (i + 1) % 3 === 0;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      const next = isFilled && i === sr.physicalBoxesCurrent - 1 ? i : i + 1;
                      updateSR({ physicalBoxesCurrent: next });
                    }}
                    className={`h-8 rounded font-mono font-bold text-xs flex flex-col items-center justify-center border transition ${
                      isFilled
                        ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                        : 'bg-stone-900 border-stone-700 text-stone-500 hover:border-rose-500/50'
                    }`}
                  >
                    <span>{i + 1}</span>
                    {isWoundStep && (
                      <span className="text-[8px] font-mono leading-none opacity-80">
                        -{Math.floor((i + 1) / 3)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-500">Filled boxes apply physical damage penalties to physical action pools.</p>
          </div>

          {/* Stun Condition Track */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-amber-400 font-serif">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Stun Condition Monitor
              </span>
              <span className="font-mono text-stone-200">
                {sr.stunBoxesCurrent} / {stunBoxesMax} Boxes
              </span>
            </div>

            <div className="grid grid-cols-10 gap-1 pt-1">
              {Array.from({ length: stunBoxesMax }).map((_, i) => {
                const isFilled = i < sr.stunBoxesCurrent;
                const isWoundStep = (i + 1) % 3 === 0;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      const next = isFilled && i === sr.stunBoxesCurrent - 1 ? i : i + 1;
                      updateSR({ stunBoxesCurrent: next });
                    }}
                    className={`h-8 rounded font-mono font-bold text-xs flex flex-col items-center justify-center border transition ${
                      isFilled
                        ? 'bg-amber-600 border-amber-400 text-stone-950 shadow-md'
                        : 'bg-stone-900 border-stone-700 text-stone-500 hover:border-amber-500/50'
                    }`}
                  >
                    <span>{i + 1}</span>
                    {isWoundStep && (
                      <span className="text-[8px] font-mono leading-none opacity-80">
                        -{Math.floor((i + 1) / 3)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-500">Stun damage causes unconsciousness when full, overflowing into Physical track.</p>
          </div>
        </div>

        {/* CORE ATTRIBUTES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {attributesList.map((attr) => {
            return (
              <div
                key={attr.key}
                className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-col justify-between hover:border-cyan-500/50 transition group relative"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    {attr.label}
                  </span>
                  <div className="flex items-center justify-between my-1">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={attr.val}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        updateSR({ [attr.key]: val } as any);
                      }}
                      className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-xl font-bold font-mono text-cyan-200 focus:border-cyan-400 focus:outline-none"
                    />
                    
                    <button
                      onClick={() => onRollPool(`${attr.label} Roll`, Math.max(1, attr.val + woundModifier))}
                      className="p-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/60 rounded-lg text-cyan-300 hover:text-white transition flex items-center justify-center gap-1 text-xs font-bold font-mono shadow"
                      title="Roll D6 Success Pool"
                    >
                      <Dices className="w-4 h-4" />
                      <span>{Math.max(1, attr.val + woundModifier)}d6</span>
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-stone-500 leading-tight mt-1">{attr.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUALITIES & CYBERWARE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POSITIVE & NEGATIVE QUALITIES */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="text-base font-serif font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Qualities (Positive & Negative)
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              Net Karma: {sr.qualities.reduce((acc, q) => acc - q.karmaCost, 0)}
            </span>
          </div>

          <div className="space-y-2">
            {sr.qualities.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No qualities added yet.</p>
            ) : (
              sr.qualities.map((q) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                    q.type === 'Positive'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{q.name}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        q.type === 'Positive' ? 'bg-amber-900/80 text-amber-200' : 'bg-purple-900/80 text-purple-200'
                      }`}>
                        {q.karmaCost > 0 ? `+${q.karmaCost} Karma` : `${q.karmaCost} Karma`}
                      </span>
                    </div>
                    {q.description && <p className="text-xs text-stone-300">{q.description}</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteQuality(q.id)}
                    className="text-stone-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Quality Form */}
          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-stone-300 block">Add New Quality</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Quality Name..."
                value={newQualityName}
                onChange={(e) => setNewQualityName(e.target.value)}
                className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 sm:col-span-2"
              />
              <div className="flex gap-1">
                <select
                  value={newQualityType}
                  onChange={(e) => setNewQualityType(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 w-full"
                >
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
                <input
                  type="number"
                  placeholder="Karma"
                  value={newQualityCost}
                  onChange={(e) => setNewQualityCost(parseInt(e.target.value) || 0)}
                  className="w-16 bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-center text-amber-300"
                />
              </div>
            </div>
            <textarea
              rows={2}
              placeholder="Effect or rules description..."
              value={newQualityDesc}
              onChange={(e) => setNewQualityDesc(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddQuality}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Quality
            </button>
          </div>
        </div>

        {/* CYBERWARE & BIOWARE AUGMENTATIONS */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="text-base font-serif font-bold text-cyan-300 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" /> Augmentations (Cyberware / Bioware)
            </h3>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              remainingEssence < 1.0 ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse' : 'bg-cyan-950 border-cyan-600/50 text-cyan-200'
            }`}>
              Essence: {remainingEssence.toFixed(2)} / 6.00
            </span>
          </div>

          <div className="space-y-2">
            {sr.cyberware.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No cyberware or bioware installed.</p>
            ) : (
              sr.cyberware.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-start justify-between gap-2 hover:border-cyan-500/40 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-cyan-200">{c.name}</span>
                      <span className="text-[10px] bg-stone-900 border border-stone-700 px-1.5 py-0.2 rounded text-stone-400">
                        {c.category} • {c.grade}
                      </span>
                      <span className="text-[10px] font-mono text-rose-400 font-bold">
                        -{c.essenceCost} ESS
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-stone-300">{c.description}</p>}
                  </div>

                  <button
                    onClick={() => handleDeleteCyberware(c.id)}
                    className="text-stone-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Augmentation Form */}
          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-stone-300 block">Install Augmentation</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Augment Name (e.g., Wired Reflexes Rating 2)"
                value={newCyberName}
                onChange={(e) => setNewCyberName(e.target.value)}
                className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 sm:col-span-2"
              />
              <div className="flex gap-1">
                <select
                  value={newCyberCategory}
                  onChange={(e) => setNewCyberCategory(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 w-full"
                >
                  <option value="Cyberware">Cyberware</option>
                  <option value="Bioware">Bioware</option>
                  <option value="Nanoware">Nanoware</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ESS"
                  value={newCyberCost}
                  onChange={(e) => setNewCyberCost(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-center text-rose-300"
                />
              </div>
            </div>
            <textarea
              rows={2}
              placeholder="System benefits, stat bonuses or wireless bonuses..."
              value={newCyberDesc}
              onChange={(e) => setNewCyberDesc(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleAddCyberware}
              className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Install Augmentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
