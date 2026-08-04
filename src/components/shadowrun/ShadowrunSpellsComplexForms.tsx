import React, { useState } from 'react';
import { CharacterData, ShadowrunData, ShadowrunSpellComplexForm } from '../../types';
import { Sparkles, Flame, Zap, Plus, Trash2, Shield, Dices } from 'lucide-react';

interface ShadowrunSpellsProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollPool: (label: string, poolSize: number) => void;
}

const DEFAULT_SPELLS: ShadowrunSpellComplexForm[] = [
  {
    id: 'sp-1',
    name: 'Powerbolt',
    type: 'Spell',
    category: 'Combat',
    drainValue: 'F - 3',
    duration: 'Instant',
    description: 'Direct physical damage spell targeting Body.'
  },
  {
    id: 'sp-2',
    name: 'Heal',
    type: 'Spell',
    category: 'Health',
    drainValue: 'F - 4',
    duration: 'Permanent',
    description: 'Heals physical damage boxes equal to net hits.'
  },
  {
    id: 'sp-3',
    name: 'Invisibility',
    type: 'Spell',
    category: 'Illusion',
    drainValue: 'F - 2',
    duration: 'Sustained',
    description: 'Renders target invisible to optical vision and sensors.'
  },
  {
    id: 'sp-4',
    name: 'Increased Reflexes',
    type: 'Adept Power',
    category: 'Passives',
    drainValue: 'Passive',
    duration: 'Passive',
    description: '+1 Reaction and +1d6 Initiative per level.',
    rating: 2
  }
];

export const ShadowrunSpellsComplexForms: React.FC<ShadowrunSpellsProps> = ({
  character,
  onUpdateCharacter,
  onRollPool
}) => {
  const sr: ShadowrunData = character.shadowrun || {
    bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 3, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 6, res: 0,
    nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 2, notoriety: 1, publicAwareness: 0,
    physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
    qualities: [], cyberware: [], srSkills: [], vehicles: []
  };

  const spellsList = sr.spellsComplexForms && sr.spellsComplexForms.length > 0
    ? sr.spellsComplexForms
    : DEFAULT_SPELLS;

  const updateSR = (patch: Partial<ShadowrunData>) => {
    onUpdateCharacter({
      ...character,
      shadowrun: {
        ...sr,
        ...patch
      }
    });
  };

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ShadowrunSpellComplexForm['type']>('Spell');
  const [newCat, setNewCat] = useState<ShadowrunSpellComplexForm['category']>('Combat');
  const [newDrain, setNewDrain] = useState('F - 2');
  const [newDuration, setNewDuration] = useState<ShadowrunSpellComplexForm['duration']>('Instant');
  const [newDesc, setNewDesc] = useState('');

  const handleAddSpell = () => {
    if (!newName.trim()) return;
    const item: ShadowrunSpellComplexForm = {
      id: 'sp-' + Date.now(),
      name: newName.trim(),
      type: newType,
      category: newCat,
      drainValue: newDrain.trim(),
      duration: newDuration,
      description: newDesc.trim()
    };
    updateSR({ spellsComplexForms: [...spellsList, item] });
    setNewName('');
    setNewDesc('');
  };

  const handleDeleteSpell = (id: string) => {
    updateSR({ spellsComplexForms: spellsList.filter(s => s.id !== id) });
  };

  // Drain / Fading Resistance Pool: Willpower + Logic or Willpower + Charisma
  const drainResistPool = Math.max(1, sr.wil + Math.max(sr.log, sr.cha));
  const spellcastingPool = Math.max(1, sr.mag + 6); // Magic + Spellcasting skill

  return (
    <div className="space-y-6">
      {/* MAGICAL POWER & DRAIN RESISTANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-purple-600/50 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-400">Magic / Resonance Attribute</span>
          <div className="text-2xl font-bold font-mono text-purple-200">
            {sr.mag > 0 ? `MAG ${sr.mag}` : sr.res > 0 ? `RES ${sr.res}` : 'Adept / Awakened'}
          </div>
          <p className="text-[10px] text-stone-400">Essence loss reduces maximum Magic/Resonance.</p>
        </div>

        <div className="bg-stone-900 border border-purple-600/50 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-400">Spellcasting / Complex Form Pool</span>
          <div className="text-2xl font-bold font-mono text-purple-200">{spellcastingPool}d6</div>
          <p className="text-[10px] text-stone-400">Magic ({sr.mag}) + Spellcasting Skill (6)</p>
        </div>

        <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400">Drain / Fading Resistance</span>
          <div className="text-2xl font-bold font-mono text-amber-200">{drainResistPool}d6</div>
          <p className="text-[10px] text-stone-400">Willpower ({sr.wil}) + Logic ({sr.log})</p>
        </div>
      </div>

      {/* SPELLS, COMPLEX FORMS & ADEPT POWERS TABLE */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-lg font-bold font-serif text-purple-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Spells, Complex Forms & Adept Powers
          </h3>
          <button
            onClick={() => onRollPool('Drain Resistance Test', drainResistPool)}
            className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-200 font-mono font-bold rounded-lg text-xs transition flex items-center gap-1 shadow"
          >
            <Dices className="w-3.5 h-3.5" /> Roll Drain Resistance ({drainResistPool}d6)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spellsList.map((item) => (
            <div
              key={item.id}
              className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2 hover:border-purple-500/50 transition group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                    {item.name}
                    <span className="text-[10px] bg-purple-950 border border-purple-600/50 px-2 py-0.5 rounded text-purple-300 font-mono">
                      {item.type}
                    </span>
                  </h4>
                  <div className="text-xs text-stone-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>Drain: <strong className="text-amber-300">{item.drainValue}</strong></span>
                    <span>•</span>
                    <span>Duration: {item.duration}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSpell(item.id)}
                  className="text-stone-600 hover:text-rose-400 p-1 opacity-50 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {item.description && <p className="text-xs text-stone-300">{item.description}</p>}

              <button
                onClick={() => onRollPool(`Cast ${item.name}`, spellcastingPool)}
                className="w-full py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-600/50 text-purple-200 text-xs font-mono font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
              >
                <Dices className="w-4 h-4 text-purple-300" /> Roll Spell Pool ({spellcastingPool}d6)
              </button>
            </div>
          ))}
        </div>

        {/* ADD SPELL FORM */}
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl space-y-3 pt-3">
          <span className="text-xs font-bold text-purple-300 block font-serif">Add Spell, Complex Form or Adept Power</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Name (e.g., Stunbolt)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 sm:col-span-2"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500"
            >
              <option value="Spell">Spell</option>
              <option value="Complex Form">Complex Form</option>
              <option value="Adept Power">Adept Power</option>
              <option value="Ritual">Ritual</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Drain Value (e.g. F - 3)"
              value={newDrain}
              onChange={(e) => setNewDrain(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-purple-500"
            />
            <textarea
              rows={2}
              placeholder="Spell effect description..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-purple-500 w-full"
            />
          </div>

          <button
            onClick={handleAddSpell}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Magic Entry
          </button>
        </div>
      </div>
    </div>
  );
};
