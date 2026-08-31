import React, { useState, useMemo } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition } from './ForgeTypes';
import { Shield, Sparkles, Plus, Trash2, BookOpen, Wand2, Zap, Swords, Award } from 'lucide-react';
import { generateProceduralClass } from '../../../services/proceduralGenerators';
import { validateHomebrewClass, ValidationResult } from '../../../utils/homebrewValidator';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

interface ClassStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
}

interface ClassFeatureItem {
  id: string;
  level: number;
  name: string;
  description: string;
  actionType: 'Passive' | 'Action' | 'Bonus Action' | 'Reaction' | 'Special';
  uses: string;
}

interface SubclassItem {
  id: string;
  name: string;
  description: string;
  features: string;
}

export const ClassStudio: React.FC<ClassStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('Frontline Combat Specialist & Tactical Controller');
  const [hitDie, setHitDie] = useState<'d6' | 'd8' | 'd10' | 'd12'>('d8');
  const [primaryAbility, setPrimaryAbility] = useState('Strength or Dexterity');
  const [savingThrows, setSavingThrows] = useState<string[]>(['STR', 'CON']);
  
  // Proficiencies
  const [armorProf, setArmorProf] = useState('Light armor, Medium armor, Shields');
  const [weaponProf, setWeaponProf] = useState('Simple weapons, Martial weapons');
  const [toolProf, setToolProf] = useState("Smith's tools or Herbalism kit");
  const [skillProf, setSkillProf] = useState('Choose two from Athletics, Acrobatics, Insight, Intimidation, Perception, Survival');

  // Spellcasting
  const [spellProgression, setSpellProgression] = useState<'None' | 'Full' | 'Half' | 'Third' | 'Pact'>('None');
  const [spellAbility, setSpellAbility] = useState('Intelligence');
  const [spellNotes, setSpellNotes] = useState('');

  // Class Features
  const [features, setFeatures] = useState<ClassFeatureItem[]>([
    {
      id: 'f1',
      level: 1,
      name: 'Signature Combat Focus',
      description: 'Gain tactical bonus dice equal to your proficiency bonus to add to weapon attacks or AC.',
      actionType: 'Bonus Action',
      uses: 'Proficiency Bonus / Short Rest'
    },
    {
      id: 'f2',
      level: 2,
      name: 'Tactical Surge',
      description: 'Push beyond limits to take an additional Action on your turn.',
      actionType: 'Action',
      uses: '1 / Short Rest'
    }
  ]);

  // Subclasses
  const [subclasses, setSubclasses] = useState<SubclassItem[]>([
    {
      id: 'sc1',
      name: 'Order of the Vanguard',
      description: 'Specializes in crushing charge attacks and defensive bulwarks.',
      features: 'Level 3: Shield Wall, Level 7: Unyielding Charge, Level 15: Vanguard Retaliation'
    }
  ]);

  const [quickBuild, setQuickBuild] = useState('Prioritize primary attack stat (Strength/Dexterity), followed by Constitution for maximum survivability.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Live Validation
  const validation = useMemo(() => {
    return validateHomebrewClass({
      name,
      hitDie,
      savingThrows,
      spellProgression,
      features: features.map(f => ({ level: f.level, name: f.name, description: f.description })),
      edition
    });
  }, [name, hitDie, savingThrows, spellProgression, features, edition]);

  // Toggle saving throw
  const toggleSavingThrow = (st: string) => {
    if (savingThrows.includes(st)) {
      setSavingThrows(savingThrows.filter(s => s !== st));
    } else {
      if (savingThrows.length < 3) {
        setSavingThrows([...savingThrows, st]);
      }
    }
  };

  // Feature helpers
  const addFeature = () => {
    setFeatures([
      ...features,
      {
        id: `feat_${Date.now()}`,
        level: 3,
        name: 'New Class Feature',
        description: 'Describe the mechanics, dice formulas, and flavor of this ability.',
        actionType: 'Action',
        uses: '1 / Long Rest'
      }
    ]);
  };

  const updateFeature = (id: string, field: keyof ClassFeatureItem, value: any) => {
    setFeatures(features.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  // Subclass helpers
  const addSubclass = () => {
    setSubclasses([
      ...subclasses,
      {
        id: `sc_${Date.now()}`,
        name: 'New Archetype Path',
        description: 'Flavor and theme of this specialization.',
        features: 'Level 3: Feature A, Level 6: Feature B, Level 14: Feature C'
      }
    ]);
  };

  const updateSubclass = (id: string, field: keyof SubclassItem, value: any) => {
    setSubclasses(subclasses.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSubclass = (id: string) => {
    setSubclasses(subclasses.filter(s => s.id !== id));
  };

  // Quick AI / Procedural Generation
  const handleAutoFill = () => {
    setIsGenerating(true);
    try {
      const generated = generateProceduralClass(name, edition === 'pathfinder' ? 'pathfinder' : edition === '3.5e' ? '3.5e' : '5e');
      if (generated) {
        setName(generated.name || name || 'Chronomancer');
        setDescription(generated.description || '');
        setRole(generated.role || role);
        setHitDie((generated.hitDie as any) || 'd8');
        setPrimaryAbility(generated.primaryAbility || 'Intelligence');
        if (Array.isArray(generated.savingThrows)) {
          setSavingThrows(generated.savingThrows.map((st: string) => st.substring(0, 3).toUpperCase()));
        }
        if (generated.proficiencies) {
          if (Array.isArray(generated.proficiencies.armor)) setArmorProf(generated.proficiencies.armor.join(', '));
          if (Array.isArray(generated.proficiencies.weapons)) setWeaponProf(generated.proficiencies.weapons.join(', '));
          if (Array.isArray(generated.proficiencies.tools)) setToolProf(generated.proficiencies.tools.join(', '));
          if (generated.proficiencies.skills) setSkillProf(generated.proficiencies.skills);
        }
        if (generated.spellcasting) {
          setSpellProgression((generated.spellcasting.type as any) || 'None');
          setSpellAbility(generated.spellcasting.ability || 'Intelligence');
          setSpellNotes(generated.spellcasting.notes || '');
        }
        if (Array.isArray(generated.featuresByLevel) && generated.featuresByLevel.length > 0) {
          setFeatures(
            generated.featuresByLevel.map((f: any, i: number) => ({
              id: `f_gen_${i}`,
              level: f.level || 1,
              name: f.name || `Feature ${i + 1}`,
              description: f.description || '',
              actionType: (f.actionType as any) || 'Action',
              uses: f.uses || '1 / Long Rest'
            }))
          );
        }
        if (Array.isArray(generated.subclasses) && generated.subclasses.length > 0) {
          setSubclasses(
            generated.subclasses.map((s: any, i: number) => ({
              id: `sc_gen_${i}`,
              name: s.name || `Archetype ${i + 1}`,
              description: s.description || '',
              features: Array.isArray(s.features)
                ? s.features.map((sf: any) => `Level ${sf.level}: ${sf.name} - ${sf.description}`).join(' | ')
                : s.features || ''
            }))
          );
        }
        if (generated.quickBuild) {
          setQuickBuild(generated.quickBuild);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const executeSave = () => {
    const classDataPayload = {
      hitDie,
      primaryAbility,
      savingThrows,
      role,
      proficiencies: {
        armor: armorProf.split(',').map(s => s.trim()).filter(Boolean),
        weapons: weaponProf.split(',').map(s => s.trim()).filter(Boolean),
        tools: toolProf.split(',').map(s => s.trim()).filter(Boolean),
        savingThrows,
        skills: skillProf
      },
      spellcasting: {
        type: spellProgression,
        ability: spellAbility,
        notes: spellNotes
      },
      featuresByLevel: features.map(f => ({
        level: f.level,
        name: f.name,
        description: f.description,
        actionType: f.actionType,
        uses: f.uses
      })),
      subclasses: subclasses.map(s => s.name),
      subclassDetails: subclasses.map(s => ({
        name: s.name,
        description: s.description,
        features: s.features ? [s.features] : []
      }))
    };

    const newItem: CompendiumItem = {
      id: `custom-class-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category: 'classes',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: description.trim() || `${name} — ${role}. Hit Die: ${hitDie}. Primary: ${primaryAbility}.`,
      isCustom: true,
      tags: ['classes', edition, hitDie, role, 'Homebrew'],
      classData: classDataPayload
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-linear-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-200">Homebrew Class Architect ({edition.toUpperCase()})</h4>
            <p className="text-xs text-stone-400">
              Create complete custom character classes with progression paths, hit dice, proficiencies, and subclass archetypes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={isGenerating}
          className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isGenerating ? 'Forging Archetype...' : 'Auto-Generate Idea'}</span>
        </button>
      </div>

      {/* 1. Core Identity */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>1. Class Identity & Core Attributes</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono text-amber-300 font-bold mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chronomancer, Blood Knight, Runecarver Juggernaut"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Hit Die</label>
            <select
              value={hitDie}
              onChange={e => setHitDie(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="d6">d6 (Arcane Specialist / Glass Cannon)</option>
              <option value="d8">d8 (Skirmisher / Utility / Priest)</option>
              <option value="d10">d10 (Martial Warrior / Frontliner)</option>
              <option value="d12">d12 (Heavy Juggernaut / Berserker)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Primary Ability</label>
            <input
              type="text"
              value={primaryAbility}
              onChange={e => setPrimaryAbility(e.target.value)}
              placeholder="e.g. Intelligence, Strength or Dexterity"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Combat & Party Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Battlefield Controller, Melee Burst Striker"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>
        </div>

        {/* Saving Throws */}
        <div>
          <label className="block text-[11px] font-mono text-stone-400 mb-1.5">Saving Throw Proficiencies</label>
          <div className="flex flex-wrap gap-2">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(st => {
              const active = savingThrows.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleSavingThrow(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                    active
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description / Lore */}
        <div>
          <label className="block text-[11px] font-mono text-stone-400 mb-1">Lore & Thematic Background</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the origins, martial traditions, esoteric training, or planar pacts behind this class..."
            className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* 2. Proficiencies & Spellcasting */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>2. Proficiencies & Spellcasting Progression</span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor Proficiencies</label>
            <input
              type="text"
              value={armorProf}
              onChange={e => setArmorProf(e.target.value)}
              placeholder="e.g. Light armor, Medium armor, Shields"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Weapon Proficiencies</label>
            <input
              type="text"
              value={weaponProf}
              onChange={e => setWeaponProf(e.target.value)}
              placeholder="e.g. Simple weapons, Martial weapons"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Tool Proficiencies</label>
            <input
              type="text"
              value={toolProf}
              onChange={e => setToolProf(e.target.value)}
              placeholder="e.g. Thieves' tools, Herbalism kit, None"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 mb-1">Skill Choices</label>
            <input
              type="text"
              value={skillProf}
              onChange={e => setSkillProf(e.target.value)}
              placeholder="e.g. Choose two from Athletics, Insight, Perception"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            />
          </div>
        </div>

        {/* Spellcasting Selector */}
        <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-amber-400 mb-1 font-bold flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Spellcasting Progression</span>
              </label>
              <select
                value={spellProgression}
                onChange={e => setSpellProgression(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-amber-300 text-xs font-bold"
              >
                <option value="None">None (Martial / Non-Spellcaster)</option>
                <option value="Full">Full Caster (Wizard / Cleric Progression, 1st-9th slots)</option>
                <option value="Half">Half Caster (Paladin / Ranger Progression, 1st-5th slots)</option>
                <option value="Third">Third Caster (Eldritch Knight / Arcane Trickster, 1st-4th slots)</option>
                <option value="Pact">Pact Magic (Warlock Style short rest slots)</option>
              </select>
            </div>

            {spellProgression !== 'None' && (
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1 font-bold">
                  Spellcasting Ability
                </label>
                <select
                  value={spellAbility}
                  onChange={e => setSpellAbility(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 text-xs"
                >
                  <option value="Intelligence">Intelligence</option>
                  <option value="Wisdom">Wisdom</option>
                  <option value="Charisma">Charisma</option>
                  <option value="Constitution">Constitution</option>
                </select>
              </div>
            )}
          </div>

          {spellProgression !== 'None' && (
            <div>
              <label className="block text-[10px] font-mono text-stone-500 mb-1">Spellcasting Flavor Notes</label>
              <input
                type="text"
                value={spellNotes}
                onChange={e => setSpellNotes(e.target.value)}
                placeholder="e.g. Uses a runic timepiece as spell focus; prepares spells daily from a codex"
                className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-300 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Class Features by Level */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>3. Features by Level</span>
          </h5>
          <button
            type="button"
            onClick={addFeature}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feature</span>
          </button>
        </div>

        <div className="space-y-3">
          {features.map(feat => (
            <div key={feat.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Level</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={feat.level}
                    onChange={e => updateFeature(feat.id, 'level', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-center font-mono font-bold text-amber-400 text-xs"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Feature Name</label>
                  <input
                    type="text"
                    value={feat.name}
                    onChange={e => updateFeature(feat.id, 'name', e.target.value)}
                    placeholder="Feature Name"
                    className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Action Type</label>
                  <select
                    value={feat.actionType}
                    onChange={e => updateFeature(feat.id, 'actionType', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 text-xs"
                  >
                    <option value="Passive">Passive</option>
                    <option value="Action">Action</option>
                    <option value="Bonus Action">Bonus Action</option>
                    <option value="Reaction">Reaction</option>
                    <option value="Special">Special / Free</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end justify-between gap-1">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono text-stone-500 mb-0.5">Uses/Recharge</label>
                    <input
                      type="text"
                      value={feat.uses}
                      onChange={e => updateFeature(feat.id, 'uses', e.target.value)}
                      placeholder="1 / Short Rest"
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(feat.id)}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                    title="Remove feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={feat.description}
                  onChange={e => updateFeature(feat.id, 'description', e.target.value)}
                  placeholder="Feature mechanical effect, saving throw DCs, damage formulas..."
                  className="w-full px-2.5 py-1.5 bg-stone-900/70 border border-stone-800 rounded-lg text-stone-300 text-xs leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Subclasses / Archetype Paths */}
      <div className="space-y-4 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>4. Subclasses & Specialization Paths</span>
          </h5>
          <button
            type="button"
            onClick={addSubclass}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subclass</span>
          </button>
        </div>

        <div className="space-y-3">
          {subclasses.map(sub => (
            <div key={sub.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={sub.name}
                  onChange={e => updateSubclass(sub.id, 'name', e.target.value)}
                  placeholder="Subclass Name (e.g. Order of Paradox)"
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeSubclass(sub.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={sub.description}
                onChange={e => updateSubclass(sub.id, 'description', e.target.value)}
                placeholder="Brief thematic lore and gameplay identity"
                className="w-full px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-lg text-stone-300 text-xs"
              />

              <textarea
                rows={2}
                value={sub.features}
                onChange={e => updateSubclass(sub.id, 'features', e.target.value)}
                placeholder="Key subclass features (e.g. Level 3: Feature Name - description | Level 7: ...)"
                className="w-full px-3 py-1.5 bg-stone-900/40 border border-stone-800 rounded-lg text-stone-300 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quick Build Recommendation */}
      <div className="space-y-2 bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
        <label className="block text-xs font-mono font-bold text-stone-400">
          Quick Build Recommendation:
        </label>
        <input
          type="text"
          value={quickBuild}
          onChange={e => setQuickBuild(e.target.value)}
          placeholder="e.g. Prioritize Intelligence first, then Constitution."
          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-300 text-xs"
        />
      </div>

      {/* Validation & Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Homebrew Class" />

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
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Swords className="w-4 h-4" />
          <span>Save Class to Compendium</span>
        </button>
      </div>

      {/* Game-Breaking Warning Confirmation Modal */}
      <ValidationConfirmModal
        isOpen={showOverrideModal}
        entryName={name}
        category="Class"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
