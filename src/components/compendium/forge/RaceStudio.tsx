import React, { useState, useMemo } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition } from './ForgeTypes';
import { Users, Sparkles, Plus, Trash2, BookOpen, Shield, Eye, Globe, Zap } from 'lucide-react';
import { generateProceduralRace } from '../../../services/proceduralGenerators';
import { validateHomebrewRace, ValidationResult } from '../../../utils/homebrewValidator';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

interface RaceStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
}

interface RacialTraitItem {
  id: string;
  name: string;
  description: string;
  actionType: 'Passive' | 'Action' | 'Bonus Action' | 'Reaction' | 'Special';
  recharge: 'Passive' | 'Short Rest' | 'Long Rest' | 'Proficiency Bonus / Long Rest' | 'None';
}

interface SubraceItem {
  id: string;
  name: string;
  description: string;
  traitBonus: string;
}

export const RaceStudio: React.FC<RaceStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creatureType, setCreatureType] = useState('Humanoid');
  const [size, setSize] = useState<'Medium' | 'Small' | 'Large' | 'Tiny'>('Medium');
  const [speed, setSpeed] = useState(30);
  const [speedNotes, setSpeedNotes] = useState('30 ft. walking');
  
  // Ability Bonuses
  const [abilityBonusesStr, setAbilityBonusesStr] = useState('+2 to one Ability Score, +1 to another (or +2 Dexterity, +1 Charisma)');
  const [darkvision, setDarkvision] = useState(true);
  const [senses, setSenses] = useState('Darkvision 60 ft.');

  // Traits
  const [traits, setTraits] = useState<RacialTraitItem[]>([
    {
      id: 't1',
      name: 'Planar Shifting',
      description: 'As a bonus action, teleport up to 30 feet to an unoccupied space you can see.',
      actionType: 'Bonus Action',
      recharge: 'Proficiency Bonus / Long Rest'
    },
    {
      id: 't2',
      name: 'Resilient Ancestry',
      description: 'You have advantage on saving throws against being charmed and resistance against radiant damage.',
      actionType: 'Passive',
      recharge: 'Passive'
    }
  ]);

  // Subraces
  const [subraces, setSubraces] = useState<SubraceItem[]>([
    {
      id: 'sr1',
      name: 'Astral Nomad',
      description: 'Lineage steeped in cosmic starlight and deep astral void.',
      traitBonus: '+1 Intelligence, Astral Senses trait'
    }
  ]);

  // Languages & Lore
  const [languages, setLanguages] = useState('Common, Elvish or Draconic');
  const [ageAndLifespan, setAgeAndLifespan] = useState('Reach physical maturity at age 18 and can live up to 350 years.');
  const [alignmentTendencies, setAlignmentTendencies] = useState('Tend toward Chaotic Good or Neutral alignments valuing personal liberty.');

  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Live Validation
  const validation = useMemo(() => {
    return validateHomebrewRace({
      name,
      speed,
      abilityBonusesStr,
      traits: traits.map(t => ({ name: t.name, description: t.description })),
      edition
    });
  }, [name, speed, abilityBonusesStr, traits, edition]);

  const addTrait = () => {
    setTraits([
      ...traits,
      {
        id: `tr_${Date.now()}`,
        name: 'New Racial Trait',
        description: 'Describe the trait rules, dice mechanics, and flavor.',
        actionType: 'Passive',
        recharge: 'Passive'
      }
    ]);
  };

  const updateTrait = (id: string, field: keyof RacialTraitItem, value: any) => {
    setTraits(traits.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTrait = (id: string) => {
    setTraits(traits.filter(t => t.id !== id));
  };

  const addSubrace = () => {
    setSubraces([
      ...subraces,
      {
        id: `sbr_${Date.now()}`,
        name: 'New Subrace / Lineage Variant',
        description: 'Flavor and biological divergence.',
        traitBonus: '+1 Ability Score or Unique Lineage Perk'
      }
    ]);
  };

  const updateSubrace = (id: string, field: keyof SubraceItem, value: any) => {
    setSubraces(subraces.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSubrace = (id: string) => {
    setSubraces(subraces.filter(s => s.id !== id));
  };

  // Auto Generate via Procedural Generator
  const handleAutoFill = () => {
    setIsGenerating(true);
    try {
      const generated = generateProceduralRace(name, edition === 'pathfinder' ? 'pathfinder' : edition === '3.5e' ? '3.5e' : '5e');
      if (generated) {
        setName(generated.name || name || 'Voidtouched Astralkin');
        setDescription(generated.description || '');
        setCreatureType(generated.creatureType || 'Humanoid');
        setSize((generated.size as any) || 'Medium');
        setSpeed(Number(generated.speed) || 30);
        setSpeedNotes(generated.speedNotes || `${generated.speed || 30} ft. walking`);
        setAbilityBonusesStr(generated.abilityBonusesStr || '+2 / +1 to Ability Scores');
        setDarkvision(Boolean(generated.darkvision));
        setSenses(generated.senses || 'Darkvision 60 ft.');
        if (Array.isArray(generated.traits) && generated.traits.length > 0) {
          setTraits(
            generated.traits.map((tr: any, i: number) => ({
              id: `tr_gen_${i}`,
              name: tr.name || `Trait ${i + 1}`,
              description: tr.description || '',
              actionType: (tr.actionType as any) || 'Passive',
              recharge: (tr.recharge as any) || 'Passive'
            }))
          );
        }
        if (Array.isArray(generated.subraces) && generated.subraces.length > 0) {
          setSubraces(
            generated.subraces.map((sr: any, i: number) => ({
              id: `sr_gen_${i}`,
              name: sr.name || `Subrace ${i + 1}`,
              description: sr.description || '',
              traitBonus: sr.traitBonus || ''
            }))
          );
        }
        if (Array.isArray(generated.languages)) {
          setLanguages(generated.languages.join(', '));
        }
        if (generated.ageAndLifespan) setAgeAndLifespan(generated.ageAndLifespan);
        if (generated.alignmentTendencies) setAlignmentTendencies(generated.alignmentTendencies);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const executeSave = () => {
    const raceDataPayload = {
      size,
      speed,
      speedNotes,
      creatureType,
      abilityBonusesStr,
      darkvision,
      senses,
      traits: traits.map(t => ({
        name: t.name,
        description: t.description,
        actionType: t.actionType,
        recharge: t.recharge
      })),
      subraces: subraces.map(s => ({
        name: s.name,
        description: s.description,
        traitBonus: s.traitBonus
      })),
      languages: languages.split(',').map(s => s.trim()).filter(Boolean),
      ageAndLifespan,
      alignmentTendencies
    };

    const newItem: CompendiumItem = {
      id: `custom-race-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category: 'races',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: description.trim() || `${name} — ${size} ${creatureType}. Speed: ${speed} ft. ${abilityBonusesStr}.`,
      isCustom: true,
      tags: ['races', edition, size, creatureType, 'Homebrew'],
      raceData: raceDataPayload
    };

    onSave(newItem);
    setShowOverrideModal(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (validation.hasCritical) {
      setShowOverrideModal(true);
      return;
    }

    executeSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in text-stone-200">
      {/* Top Banner with Auto-Fill / AI Generator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-linear-to-r from-emerald-950/40 via-stone-900 to-stone-900 border border-emerald-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-200">Homebrew Race & Lineage Forge ({edition.toUpperCase()})</h4>
            <p className="text-xs text-stone-400">
              Design species, lineages, ancestral traits, and subraces with custom stats, speeds, and abilities.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={isGenerating}
          className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isGenerating ? 'Forging Ancestry...' : 'Auto-Generate Idea'}</span>
        </button>
      </div>

      {/* 1. Core Anatomy & Attributes */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>1. Species Name & Biology</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono text-emerald-300 font-bold mb-1">
              Race / Lineage Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Voidtouched Astralkin, Clockwork Automaton, Kitsune"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Creature Type</label>
            <select
              value={creatureType}
              onChange={e => setCreatureType(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
            >
              <option value="Humanoid">Humanoid</option>
              <option value="Fey">Fey</option>
              <option value="Construct">Construct</option>
              <option value="Monstrosity">Monstrosity</option>
              <option value="Celestial">Celestial</option>
              <option value="Fiend">Fiend</option>
              <option value="Aberration">Aberration</option>
              <option value="Elemental">Elemental</option>
              <option value="Undead">Undead</option>
              <option value="Dragon">Dragon</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Size Category</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value as any)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            >
              <option value="Small">Small (Halfling / Gnome scale)</option>
              <option value="Medium">Medium (Human / Elf scale)</option>
              <option value="Large">Large (Centaur / Goliath scale)</option>
              <option value="Tiny">Tiny (Sprite scale)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Base Walking Speed (ft.)</label>
            <input
              type="number"
              value={speed}
              onChange={e => setSpeed(parseInt(e.target.value, 10) || 30)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-emerald-400 font-mono font-bold text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Speed Notes / Special Movement</label>
            <input
              type="text"
              value={speedNotes}
              onChange={e => setSpeedNotes(e.target.value)}
              placeholder="e.g. 30 ft. walk, 30 ft. swim or climb"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Ability Score Increases</label>
            <input
              type="text"
              value={abilityBonusesStr}
              onChange={e => setAbilityBonusesStr(e.target.value)}
              placeholder="e.g. +2 Dexterity, +1 Charisma (or +2 to one, +1 to another)"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Senses & Vision</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={senses}
                onChange={e => setSenses(e.target.value)}
                placeholder="e.g. Darkvision 60 ft., Blindsight 10 ft."
                className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkvision}
                  onChange={e => {
                    setDarkvision(e.target.checked);
                    if (e.target.checked && !senses.includes('Darkvision')) {
                      setSenses('Darkvision 60 ft.');
                    }
                  }}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Darkvision</span>
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Origins, Lore & Appearance</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the aesthetic, physical traits, cultural origins, and roleplay hooks..."
            className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Racial Traits & Features */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>2. Racial Traits & Powers</span>
          </h5>
          <button
            type="button"
            onClick={addTrait}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trait</span>
          </button>
        </div>

        <div className="space-y-3">
          {traits.map(t => (
            <div key={t.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Trait Name</label>
                  <input
                    type="text"
                    value={t.name}
                    onChange={e => updateTrait(t.id, 'name', e.target.value)}
                    placeholder="Trait Name"
                    className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Action Type</label>
                  <select
                    value={t.actionType}
                    onChange={e => updateTrait(t.id, 'actionType', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 text-xs"
                  >
                    <option value="Passive">Passive</option>
                    <option value="Action">Action</option>
                    <option value="Bonus Action">Bonus Action</option>
                    <option value="Reaction">Reaction</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div className="sm:col-span-4 flex items-end justify-between gap-1">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Recharge</label>
                    <select
                      value={t.recharge}
                      onChange={e => updateTrait(t.id, 'recharge', e.target.value)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 text-xs"
                    >
                      <option value="Passive">Passive (Always on)</option>
                      <option value="Short Rest">1 / Short Rest</option>
                      <option value="Long Rest">1 / Long Rest</option>
                      <option value="Proficiency Bonus / Long Rest">PB / Long Rest</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTrait(t.id)}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                    title="Remove trait"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={t.description}
                  onChange={e => updateTrait(t.id, 'description', e.target.value)}
                  placeholder="Mechanical effect of this racial trait, saving throws, damage resistance..."
                  className="w-full px-2.5 py-1.5 bg-stone-900/70 border border-stone-800 rounded-lg text-stone-300 text-xs leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Subraces / Lineage Variants */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>3. Subraces & Lineage Branches</span>
          </h5>
          <button
            type="button"
            onClick={addSubrace}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subrace</span>
          </button>
        </div>

        <div className="space-y-3">
          {subraces.map(sub => (
            <div key={sub.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sub.name}
                  onChange={e => updateSubrace(sub.id, 'name', e.target.value)}
                  placeholder="Subrace Name (e.g. High Astral, Deep Stalker)"
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeSubrace(sub.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={sub.description}
                onChange={e => updateSubrace(sub.id, 'description', e.target.value)}
                placeholder="Description of this sub-lineage"
                className="w-full px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg text-stone-300 text-xs"
              />

              <input
                type="text"
                value={sub.traitBonus}
                onChange={e => updateSubrace(sub.id, 'traitBonus', e.target.value)}
                placeholder="Subrace stat bonus / unique traits (e.g. +1 Wisdom, Stealth Proficiency)"
                className="w-full px-3 py-1.5 bg-stone-900/40 border border-stone-800 rounded-lg text-stone-300 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Languages & Cultural Lore */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>4. Languages & Roleplay Details</span>
        </h5>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Languages</label>
            <input
              type="text"
              value={languages}
              onChange={e => setLanguages(e.target.value)}
              placeholder="e.g. Common, Sylvan, Undercommon"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Age & Lifespan</label>
              <input
                type="text"
                value={ageAndLifespan}
                onChange={e => setAgeAndLifespan(e.target.value)}
                placeholder="e.g. Mature at 20, live up to 400 years"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Alignment Tendencies</label>
              <input
                type="text"
                value={alignmentTendencies}
                onChange={e => setAlignmentTendencies(e.target.value)}
                placeholder="e.g. Tend toward Chaotic Good or Neutral"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Validation & Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Race / Ancestry" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Save Race to Compendium</span>
        </button>
      </div>

      {/* Game-Breaking Warning Confirmation Modal */}
      <ValidationConfirmModal
        isOpen={showOverrideModal}
        entryName={name}
        category="Race / Ancestry"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
