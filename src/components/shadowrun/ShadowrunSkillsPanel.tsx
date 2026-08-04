import React, { useState } from 'react';
import { CharacterData, ShadowrunData, ShadowrunSkill } from '../../types';
import { Dices, Plus, Trash2, Search, Crosshair, Cpu, Sparkles, Shield, User, Wrench, BookOpen } from 'lucide-react';

interface ShadowrunSkillsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollPool: (label: string, poolSize: number) => void;
}

const DEFAULT_SHADOWRUN_SKILLS: ShadowrunSkill[] = [
  // Combat
  { id: 'sr-sk-1', name: 'Firearms', category: 'Combat', rating: 6, linkedAttribute: 'AGI', specialization: 'Heavy Pistols' },
  { id: 'sr-sk-2', name: 'Close Combat', category: 'Combat', rating: 5, linkedAttribute: 'AGI', specialization: 'Blades' },
  { id: 'sr-sk-3', name: 'Heavy Weapons', category: 'Combat', rating: 3, linkedAttribute: 'AGI' },
  
  // Physical
  { id: 'sr-sk-4', name: 'Stealth', category: 'Physical', rating: 5, linkedAttribute: 'AGI', specialization: 'Urban' },
  { id: 'sr-sk-5', name: 'Athletics', category: 'Physical', rating: 4, linkedAttribute: 'STR' },
  { id: 'sr-sk-6', name: 'Perception', category: 'Physical', rating: 4, linkedAttribute: 'INT', specialization: 'Visual' },

  // Social
  { id: 'sr-sk-7', name: 'Negotiation', category: 'Social', rating: 3, linkedAttribute: 'CHA', specialization: 'Bargaining' },
  { id: 'sr-sk-8', name: 'Con', category: 'Social', rating: 2, linkedAttribute: 'CHA' },
  { id: 'sr-sk-9', name: 'Intimidation', category: 'Social', rating: 3, linkedAttribute: 'CHA' },

  // Matrix
  { id: 'sr-sk-10', name: 'Hacking', category: 'Matrix', rating: 4, linkedAttribute: 'LOG', specialization: 'Cyberdecks' },
  { id: 'sr-sk-11', name: 'Electronic Warfare', category: 'Matrix', rating: 3, linkedAttribute: 'LOG' },
  { id: 'sr-sk-12', name: 'Cybercombat', category: 'Matrix', rating: 2, linkedAttribute: 'LOG' },

  // Technical & Vehicles
  { id: 'sr-sk-13', name: 'Piloting (Ground)', category: 'Technical', rating: 3, linkedAttribute: 'REA' },
  { id: 'sr-sk-14', name: 'Engineering', category: 'Technical', rating: 2, linkedAttribute: 'LOG' },
  { id: 'sr-sk-15', name: 'Biotech', category: 'Technical', rating: 2, linkedAttribute: 'LOG' },

  // Knowledge & Languages
  { id: 'sr-sk-16', name: 'Seattle Street Gangs', category: 'Knowledge', rating: 4, linkedAttribute: 'INT' },
  { id: 'sr-sk-17', name: 'Corporate Security Procedures', category: 'Knowledge', rating: 3, linkedAttribute: 'LOG' },
  { id: 'sr-sk-18', name: 'English', category: 'Language', rating: 6, linkedAttribute: 'INT', specialization: 'Native' },
  { id: 'sr-sk-19', name: 'Japanese', category: 'Language', rating: 3, linkedAttribute: 'INT' }
];

export const ShadowrunSkillsPanel: React.FC<ShadowrunSkillsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRollPool
}) => {
  const sr: ShadowrunData = character.shadowrun || {
    bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 3, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 0, res: 0,
    nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 2, notoriety: 1, publicAwareness: 0,
    physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
    qualities: [], cyberware: [], srSkills: DEFAULT_SHADOWRUN_SKILLS, vehicles: []
  };

  const skillsList = sr.srSkills && sr.srSkills.length > 0 ? sr.srSkills : DEFAULT_SHADOWRUN_SKILLS;

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // New Skill form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<ShadowrunSkill['category']>('Combat');
  const [newSkillAttr, setNewSkillAttr] = useState<ShadowrunSkill['linkedAttribute']>('AGI');
  const [newSkillRating, setNewSkillRating] = useState(1);
  const [newSkillSpec, setNewSkillSpec] = useState('');

  // Calculate Wound Modifiers
  const totalDamage = sr.physicalBoxesCurrent + sr.stunBoxesCurrent;
  const woundMod = -Math.floor(totalDamage / 3);

  // Helper to get linked attribute value
  const getAttrVal = (attr: ShadowrunSkill['linkedAttribute']): number => {
    switch (attr) {
      case 'BOD': return sr.bod;
      case 'AGI': return sr.agi;
      case 'REA': return sr.rea;
      case 'STR': return sr.str;
      case 'WIL': return sr.wil;
      case 'LOG': return sr.log;
      case 'INT': return sr.int;
      case 'CHA': return sr.cha;
      case 'EDG': return sr.edg;
      case 'MAG': return sr.mag;
      case 'RES': return sr.res;
      default: return 3;
    }
  };

  const updateSR = (patch: Partial<ShadowrunData>) => {
    onUpdateCharacter({
      ...character,
      shadowrun: {
        ...sr,
        ...patch
      }
    });
  };

  const handleUpdateRating = (id: string, newRating: number) => {
    const updated = skillsList.map(s => s.id === id ? { ...s, rating: Math.max(0, Math.min(12, newRating)) } : s);
    updateSR({ srSkills: updated });
  };

  const handleDeleteSkill = (id: string) => {
    updateSR({ srSkills: skillsList.filter(s => s.id !== id) });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const ns: ShadowrunSkill = {
      id: 'sr-sk-' + Date.now(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      rating: newSkillRating,
      linkedAttribute: newSkillAttr,
      specialization: newSkillSpec.trim() || undefined
    };
    updateSR({ srSkills: [...skillsList, ns] });
    setNewSkillName('');
    setNewSkillSpec('');
  };

  const filteredSkills = skillsList.filter(s => {
    const matchCat = categoryFilter === 'All' || s.category === categoryFilter;
    const matchSearch = s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        (s.specialization && s.specialization.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchCat && matchSearch;
  });

  const categories = ['All', 'Combat', 'Physical', 'Social', 'Matrix', 'Magic', 'Technical', 'Knowledge', 'Language'];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <h3 className="text-xl font-bold font-serif text-cyan-300 flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-cyan-400" /> Shadowrun Skill Ratings & Dice Pools
          </h3>
          <p className="text-xs text-stone-400">
            Dice Pool = Skill Rating + Linked Attribute + Wound Modifiers. Click any pool to roll D6 Success Test.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter skills..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SKILLS TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-stone-400 font-serif font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Skill Name</th>
              <th className="py-2.5 px-2">Category</th>
              <th className="py-2.5 px-2 text-center">Attr</th>
              <th className="py-2.5 px-2 text-center">Rating</th>
              <th className="py-2.5 px-2 text-center">Attr Val</th>
              <th className="py-2.5 px-3 text-center">Total Dice Pool</th>
              <th className="py-2.5 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {filteredSkills.map((sk) => {
              const attrVal = getAttrVal(sk.linkedAttribute);
              const poolSize = Math.max(1, sk.rating + attrVal + woundMod);
              const specPoolSize = Math.max(1, poolSize + 2); // +2 for specialization

              return (
                <tr key={sk.id} className="hover:bg-stone-950/50 transition group">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-stone-200 text-sm">{sk.name}</div>
                    {sk.specialization && (
                      <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                        <span>Spec: {sk.specialization} (+2d6)</span>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                      {sk.category}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono font-bold text-cyan-400">
                    {sk.linkedAttribute}
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={sk.rating}
                      onChange={(e) => handleUpdateRating(sk.id, parseInt(e.target.value) || 0)}
                      className="w-12 bg-stone-950 border border-stone-700 rounded text-center text-stone-200 font-bold font-mono py-0.5"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-center font-mono text-stone-400">
                    {attrVal}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onRollPool(`${sk.name} (${sk.rating} + ${sk.linkedAttribute})`, poolSize)}
                        className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-200 font-mono font-bold rounded-lg transition flex items-center gap-1 shadow"
                      >
                        <Dices className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{poolSize}d6</span>
                      </button>

                      {sk.specialization && (
                        <button
                          onClick={() => onRollPool(`${sk.name} [Spec: ${sk.specialization}]`, specPoolSize)}
                          className="px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/70 text-amber-200 font-mono font-bold rounded-lg transition text-[11px]"
                          title="Roll with Specialization +2d6"
                        >
                          +{specPoolSize}d6 Spec
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => handleDeleteSkill(sk.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 opacity-60 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD NEW SKILL FORM */}
      <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl space-y-3 pt-3">
        <span className="text-xs font-bold text-cyan-300 block font-serif">Add Custom Shadowrun Skill</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          <input
            type="text"
            placeholder="Skill Name (e.g., Cybercombat)"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 sm:col-span-2"
          />

          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value as any)}
            className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="Combat">Combat</option>
            <option value="Physical">Physical</option>
            <option value="Social">Social</option>
            <option value="Matrix">Matrix</option>
            <option value="Magic">Magic</option>
            <option value="Technical">Technical</option>
            <option value="Knowledge">Knowledge</option>
            <option value="Language">Language</option>
          </select>

          <select
            value={newSkillAttr}
            onChange={(e) => setNewSkillAttr(e.target.value as any)}
            className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="AGI">AGI (Agility)</option>
            <option value="REA">REA (Reaction)</option>
            <option value="STR">STR (Strength)</option>
            <option value="BOD">BOD (Body)</option>
            <option value="LOG">LOG (Logic)</option>
            <option value="INT">INT (Intuition)</option>
            <option value="WIL">WIL (Willpower)</option>
            <option value="CHA">CHA (Charisma)</option>
            <option value="EDG">EDG (Edge)</option>
            <option value="MAG">MAG (Magic)</option>
            <option value="RES">RES (Resonance)</option>
          </select>

          <input
            type="number"
            min="1"
            max="12"
            placeholder="Rating"
            value={newSkillRating}
            onChange={(e) => setNewSkillRating(parseInt(e.target.value) || 1)}
            className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-center text-cyan-300"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Specialization (Optional, e.g. Urban, Heavy Pistols)"
            value={newSkillSpec}
            onChange={(e) => setNewSkillSpec(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 w-full"
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>
    </div>
  );
};
