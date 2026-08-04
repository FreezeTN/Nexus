import React, { useState } from 'react';
import { AbilityName, CharacterData, ClassFeature, Feat, Skill } from '../../types';
import { ShadowrunStatsPanel } from '../shadowrun/ShadowrunStatsPanel';
import { ShadowrunSkillsPanel } from '../shadowrun/ShadowrunSkillsPanel';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';
import { LevelProgressionModal } from '../modals/LevelProgressionModal';
import {
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSavingThrowBonus,
  getSkillBonus,
  get35eSkillBonus,
  get35eFortSave,
  get35eRefSave,
  get35eWillSave,
  recalculateCharacterAC
} from '../../utils/dndCalculations';
import {
  Shield,
  Dices,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Star,
  Zap,
  BookOpen,
  Award,
  Sparkles,
  Edit2,
  Store,
  Skull,
  Settings,
  Scale,
  Swords,
  Crosshair,
  Layers,
  Brain,
  Search,
  TrendingUp
} from 'lucide-react';
import {
  OFFICIAL_5E_FEATS,
  OFFICIAL_35E_FEATS,
  OFFICIAL_5E_CLASS_FEATURES,
  OFFICIAL_35E_CLASS_FEATURES
} from '../../data/srdRulesLibrary';

const SHORT_TERM_MADNESS_TABLE = [
  "The character retreats into his or her mind and becomes paralyzed until cured or 1d10 minutes pass.",
  "The character becomes incapacitated and spends the duration screaming, weeping, or laughing maniacally.",
  "The character becomes frightened and must use his or her action to flee from the source of fear.",
  "The character begins babbling incoherently and cannot speak or cast spells with verbal components.",
  "The character falls unconscious and cannot be awakened for 1d10 minutes.",
  "The character experiences vivid hallucinations and has disadvantage on all ability checks and attack rolls.",
  "The character becomes overpowered by extreme paranoia. All creatures are treated as hostile.",
  "The character faints on the spot and drops all held weapons and items."
];

const LONG_TERM_MADNESS_TABLE = [
  "The character feels compelled to repeat a specific action, such as washing hands or checking locks, every 10 minutes.",
  "The character experiences severe amnesia and knows his or her name, but remembers nothing else.",
  "The character suffers from vivid phobia and becomes frightened when in the presence of the trauma trigger.",
  "The character loses the ability to speak or comprehend any written or spoken language for 1d10 x 10 hours.",
  "The character suffers from tremors and uncontrollable twitching (-2 to Dexterity checks and attack rolls).",
  "The character refuses to eat or drink, believing all food and water is poisoned by malevolent forces.",
  "The character experiences terrifying auditory hallucinations whispering dark secrets constantly."
];

const INDEFINITE_MADNESS_TABLE = [
  "Flaw: 'There is only one person I can truly trust, and only I can keep them safe from the darkness.'",
  "Flaw: 'I see omens of doom and eldritch symbols in every shadow and corner.'",
  "Flaw: 'I must collect and hoard every ancient artifact or secret tome I encounter.'",
  "Flaw: 'I am convinced that I am an immortal cosmic vessel immune to mortal wounds.'",
  "Flaw: 'I cannot sleep without keeping a lit candle or torch directly next to my head.'",
  "Flaw: 'I believe everyone around me has been replaced by uncanny cosmic double impersonators.'"
];

interface Sheet1Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const Sheet1StatsFeatures: React.FC<Sheet1Props> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const [editingAbilities, setEditingAbilities] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [showAddFeatModal, setShowAddFeatModal] = useState(false);
  const [showLevelProgressionModal, setShowLevelProgressionModal] = useState(false);

  // New Feature Form state
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureSource, setNewFeatureSource] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureMaxUses, setNewFeatureMaxUses] = useState<string>('');
  const [newFeatureRecharge, setNewFeatureRecharge] = useState<'Short Rest' | 'Long Rest' | 'Special' | 'None'>('Short Rest');

  // New Feat Form state
  const [newFeatName, setNewFeatName] = useState('');
  const [newFeatSource, setNewFeatSource] = useState('');
  const [newFeatDesc, setNewFeatDesc] = useState('');

  // Official Compendium Tab state
  const [featureModalTab, setFeatureModalTab] = useState<'official' | 'custom'>('official');
  const [featModalTab, setFeatModalTab] = useState<'official' | 'custom'>('official');
  const [featureSearch, setFeatureSearch] = useState('');
  const [featSearch, setFeatSearch] = useState('');

  const handleAddOfficialFeature = (featObj: ClassFeature) => {
    const updatedFeatures = [
      ...character.classFeatures,
      {
        ...featObj,
        id: 'cf-off-' + Date.now() + Math.random().toString(36).substring(2, 6),
        usesRemaining: featObj.usesMax
      }
    ];
    onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
    setShowAddFeatureModal(false);
  };

  const handleAddOfficialFeat = (featObj: Feat) => {
    const updatedFeats = [
      ...character.feats,
      {
        ...featObj,
        id: 'feat-off-' + Date.now() + Math.random().toString(36).substring(2, 6)
      }
    ];
    onUpdateCharacter({ ...character, feats: updatedFeats });
    setShowAddFeatModal(false);
  };

  const abilitiesList: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const profBonus = getProficiencyBonus(character.level);

  // Ability Score Handlers
  const handleScoreChange = (ability: AbilityName, newScore: number) => {
    onUpdateCharacter({
      ...character,
      abilities: {
        ...character.abilities,
        [ability]: { ...character.abilities[ability], score: Math.max(1, newScore) }
      }
    });
  };

  const handleSavingThrowToggle = (ability: AbilityName) => {
    const isProf = character.savingThrowProficiencies.includes(ability);
    const updated = isProf
      ? character.savingThrowProficiencies.filter(a => a !== ability)
      : [...character.savingThrowProficiencies, ability];
    onUpdateCharacter({ ...character, savingThrowProficiencies: updated });
  };

  // Skill Handlers
  const handleSkillProficiencyChange = (skillId: string, type: 'proficient' | 'expertise') => {
    const updatedSkills = character.skills.map(skill => {
      if (skill.id === skillId) {
        if (type === 'proficient') {
          const nextProf = !skill.proficient;
          return { ...skill, proficient: nextProf, expertise: nextProf ? skill.expertise : false };
        } else {
          const nextExp = !skill.expertise;
          return { ...skill, expertise: nextExp, proficient: nextExp ? true : skill.proficient };
        }
      }
      return skill;
    });
    onUpdateCharacter({ ...character, skills: updatedSkills });
  };

  // Class Feature Handlers
  const handleUseFeature = (featureId: string, delta: number) => {
    const updated = character.classFeatures.map(f => {
      if (f.id === featureId && f.usesRemaining !== undefined && f.usesMax !== undefined) {
        const nextUses = Math.max(0, Math.min(f.usesMax, f.usesRemaining + delta));
        return { ...f, usesRemaining: nextUses };
      }
      return f;
    });
    onUpdateCharacter({ ...character, classFeatures: updated });
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    const maxUses = parseInt(newFeatureMaxUses);
    const newFeature: ClassFeature = {
      id: 'cf-' + Date.now(),
      name: newFeatureName,
      source: newFeatureSource || `${character.characterClass} Level ${character.level}`,
      description: newFeatureDesc,
      usesMax: isNaN(maxUses) ? undefined : maxUses,
      usesRemaining: isNaN(maxUses) ? undefined : maxUses,
      recharge: newFeatureRecharge
    };
    onUpdateCharacter({
      ...character,
      classFeatures: [...character.classFeatures, newFeature]
    });
    setNewFeatureName('');
    setNewFeatureSource('');
    setNewFeatureDesc('');
    setNewFeatureMaxUses('');
    setShowAddFeatureModal(false);
  };

  const handleDeleteFeature = (id: string) => {
    onUpdateCharacter({
      ...character,
      classFeatures: character.classFeatures.filter(f => f.id !== id)
    });
  };

  // Feats Handlers
  const handleAddFeat = () => {
    if (!newFeatName.trim()) return;
    const newFeat: Feat = {
      id: 'feat-' + Date.now(),
      name: newFeatName,
      source: newFeatSource || 'Feat',
      description: newFeatDesc
    };
    onUpdateCharacter({
      ...character,
      feats: [...character.feats, newFeat]
    });
    setNewFeatName('');
    setNewFeatSource('');
    setNewFeatDesc('');
    setShowAddFeatModal(false);
  };

  const handleDeleteFeat = (id: string) => {
    onUpdateCharacter({
      ...character,
      feats: character.feats.filter(f => f.id !== id)
    });
  };

  const handle35eSkillChange = (
    skillId: string,
    field: 'ranks' | 'miscMod' | 'isClassSkill',
    value: number | boolean
  ) => {
    const updated = character.skills.map(s => {
      if (s.id === skillId) {
        if (field === 'isClassSkill') {
          return { ...s, isClassSkill: !!value };
        }
        return { ...s, [field]: Math.max(0, value as number) };
      }
      return s;
    });
    onUpdateCharacter({ ...character, skills: updated });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Character Data Summary Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl text-stone-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Character / Monster Portrait Display */}
            {(() => {
              const displayPortrait = character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined);
              return displayPortrait ? (
                <img
                  src={displayPortrait}
                  alt={character.name}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-amber-500/50 shadow-xl shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-amber-950/60 border-2 border-amber-700/50 flex items-center justify-center text-amber-200 font-serif font-bold text-2xl shrink-0 shadow-xl">
                  {character.name.charAt(0)}
                </div>
              );
            })()}

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-serif font-bold text-amber-200">
                  {character.name}
                </h2>
                {/* Level Quick Adjustment */}
                <div className="flex items-center gap-1.5 bg-amber-950 border border-amber-600/50 px-3 py-1 rounded-full text-xs text-amber-300 font-sans font-bold flex-wrap">
                  <span>Level</span>
                  <button
                    onClick={() => onUpdateCharacter({ ...character, level: Math.max(1, character.level - 1) })}
                    className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                    title="Decrease Primary Level"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm px-1 text-amber-100">{character.level}</span>
                  <button
                    onClick={() => onUpdateCharacter({ ...character, level: character.level + 1 })}
                    className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                    title="Increase Primary Level"
                  >
                    +
                  </button>

                  {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass && (
                    <div className="flex items-center gap-1 border-l border-amber-700/60 pl-2 ml-1 text-amber-200">
                      <span>/ {character.optionalRules.secondaryClass}</span>
                      <button
                        onClick={() => onUpdateCharacter({
                          ...character,
                          optionalRules: {
                            ...character.optionalRules,
                            secondaryLevel: Math.max(1, (character.optionalRules?.secondaryLevel || 1) - 1)
                          }
                        })}
                        className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                        title="Decrease Secondary Level"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm px-1 text-amber-100">{character.optionalRules.secondaryLevel || 1}</span>
                      <button
                        onClick={() => onUpdateCharacter({
                          ...character,
                          optionalRules: {
                            ...character.optionalRules,
                            secondaryLevel: (character.optionalRules?.secondaryLevel || 1) + 1
                          }
                        })}
                        className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                        title="Increase Secondary Level"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {character.isMonster && (
                  <div className="flex items-center gap-1.5 bg-red-950 border border-red-500/60 px-3 py-1 rounded-full text-xs text-red-300 font-sans font-bold shadow-md">
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <span>Monster Creature</span>
                    {character.monsterXpReward !== undefined && (
                      <span className="text-[10px] bg-red-900/80 px-1.5 py-0.2 rounded font-mono font-extrabold text-white border border-red-400/40">
                        {character.monsterXpReward.toLocaleString()} XP
                      </span>
                    )}
                  </div>
                )}

                {character.isVendor && (
                  <div className="flex items-center gap-1 bg-amber-950 border border-amber-500/60 px-3 py-1 rounded-full text-xs text-amber-300 font-sans font-bold shadow-md">
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    <span>Merchant / Vendor ({character.vendorMargin || 120}%)</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-stone-400 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span><strong>Race:</strong> {character.race}</span>
                <span>
                  <strong>Class:</strong> {character.characterClass} ({character.subclass || 'None'})
                  {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass && (
                    <span className="text-amber-300 font-semibold ml-1 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                      <span>/ {character.optionalRules.secondaryClass}</span>
                      {character.optionalRules.secondarySubclass && (
                        <span>({character.optionalRules.secondarySubclass})</span>
                      )}
                      <span className="font-mono text-amber-200">Lvl {character.optionalRules.secondaryLevel || 1}</span>
                    </span>
                  )}
                </span>
                <span><strong>Background:</strong> {character.background}</span>
                <span><strong>Alignment:</strong> {character.alignment}</span>

                <span><strong>XP:</strong> {character.experiencePoints.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLevelProgressionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-500/50 rounded-xl text-xs font-bold transition shadow-md"
              title="Open D&D 5e Character Advancement Table & Level Up Wizard"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Level Progression & Table</span>
            </button>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-semibold border border-stone-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{editingProfile ? 'Close Edit Profile' : 'Edit Profile & Details'}</span>
            </button>
            <button
              onClick={() => setEditingAbilities(!editingAbilities)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{editingAbilities ? 'Done Editing Stats' : 'Edit Ability Scores'}</span>
            </button>
          </div>
        </div>

        {/* Profile / Level / XP Full Form when toggled */}
        {editingProfile && (
          <div className="pt-4 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-stone-950/80 p-4 rounded-xl border border-stone-800">
            <div>
              <label className="block text-stone-400 mb-1">Character Name</label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Level</label>
              <input
                type="number"
                min="1"
                value={character.level}
                onChange={(e) => onUpdateCharacter({ ...character, level: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-stone-900 border border-amber-600/50 rounded-lg p-2 text-amber-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">XP (Experience Points)</label>
              <input
                type="number"
                min="0"
                value={character.experiencePoints}
                onChange={(e) => onUpdateCharacter({ ...character, experiencePoints: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-amber-600/50 rounded-lg p-2 text-amber-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Race</label>
              <input
                type="text"
                value={character.race}
                onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Class</label>
              <input
                type="text"
                value={character.characterClass}
                onChange={(e) => onUpdateCharacter({ ...character, characterClass: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Subclass</label>
              <input
                type="text"
                value={character.subclass || ''}
                onChange={(e) => onUpdateCharacter({ ...character, subclass: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Background</label>
              <input
                type="text"
                value={character.background}
                onChange={(e) => onUpdateCharacter({ ...character, background: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1">Alignment</label>
              <input
                type="text"
                value={character.alignment}
                onChange={(e) => onUpdateCharacter({ ...character, alignment: e.target.value })}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-amber-300 font-bold mb-1">Base Speed (ft)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={character.speed || 30}
                onChange={(e) => onUpdateCharacter({ ...character, speed: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-stone-900 border border-amber-600/50 rounded-lg p-2 text-amber-100 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-stone-400 mb-1">Portrait Image Hyperlink URL</label>
              <input
                type="url"
                value={character.portraitUrl || ''}
                onChange={(e) => onUpdateCharacter({ ...character, portraitUrl: e.target.value })}
                placeholder="https://example.com/character.png"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-stone-400 mb-1">HP Calculation Mode</label>
              <select
                value={character.hpCalcMode || 'Average'}
                onChange={(e) => {
                  const mode = e.target.value as 'Average' | 'Rolled' | 'Max';
                  const conMod = Math.floor(((character.abilities.CON?.score || 10) - 10) / 2);
                  const hitDieValue = character.characterClass === 'Barbarian' ? 12 : ['Fighter', 'Paladin', 'Ranger'].includes(character.characterClass) ? 10 : ['Sorcerer', 'Wizard'].includes(character.characterClass) ? 6 : 8;
                  let newMax = character.hpMax;
                  if (mode === 'Max') {
                    newMax = Math.max(1, character.level * (hitDieValue + conMod));
                  } else if (mode === 'Rolled') {
                    newMax = Math.max(1, (hitDieValue + conMod) + (character.level - 1) * (Math.floor(hitDieValue * 0.6) + conMod));
                  } else {
                    newMax = Math.max(1, (hitDieValue + conMod) + (character.level - 1) * (Math.floor(hitDieValue / 2) + 1 + conMod));
                  }
                  onUpdateCharacter({ ...character, hpCalcMode: mode, hpMax: newMax });
                }}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-200 font-bold"
              >
                <option value="Average">Average HP (Standard D&D)</option>
                <option value="Rolled">Rolled HP (5e HP Calculator)</option>
                <option value="Max">Max Value HP (Max Hit Die)</option>
              </select>
            </div>

            {/* Merchant / Vendor Setting */}
            <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-3 rounded-lg border border-amber-800/40 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-amber-200 font-serif font-bold">
                <input
                  type="checkbox"
                  checked={!!character.isVendor}
                  onChange={(e) => onUpdateCharacter({
                    ...character,
                    isVendor: e.target.checked,
                    vendorMargin: character.vendorMargin || 120
                  })}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
                <Store className="w-4 h-4 text-amber-400" />
                <span>Is Merchant / Vendor NPC</span>
              </label>

              {character.isVendor && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-300 font-medium">Selling Margin (%):</span>
                  <div className="w-24 flex items-center gap-1 bg-stone-950 border border-stone-700 rounded px-2 py-1">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={character.vendorMargin || 120}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        vendorMargin: Math.max(1, parseInt(e.target.value) || 100)
                      })}
                      className="w-full bg-transparent font-mono font-bold text-amber-300 focus:outline-none text-center"
                    />
                    <span className="text-amber-400 font-bold font-mono">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Monster / Encounter Creature Setting */}
            <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-3 rounded-lg border border-red-800/40 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-red-200 font-serif font-bold">
                <input
                  type="checkbox"
                  checked={!!character.isMonster}
                  onChange={(e) => onUpdateCharacter({
                    ...character,
                    isMonster: e.target.checked,
                    monsterXpReward: character.monsterXpReward || 450
                  })}
                  className="accent-red-500 w-4 h-4 rounded"
                />
                <Skull className="w-4 h-4 text-red-400" />
                <span>Is Monster / Encounter Creature (DM Session Planning)</span>
              </label>

              {character.isMonster && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-300 font-medium">Defeat XP Reward:</span>
                  <div className="w-28 flex items-center gap-1 bg-stone-950 border border-stone-700 rounded px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={character.monsterXpReward ?? 450}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        monsterXpReward: Math.max(0, parseInt(e.target.value) || 0)
                      })}
                      className="w-full bg-transparent font-mono font-bold text-red-300 focus:outline-none text-center"
                    />
                    <span className="text-red-400 font-bold font-mono text-[10px]">XP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional D&D Rules & Variant Calculations Editor */}
            <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-4 rounded-xl border border-amber-800/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Optional D&D Rules & Calculation Toggles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Variant Encumbrance */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useVariantEncumbrance}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useVariantEncumbrance: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Variant Encumbrance
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      STR×5 lbs = Encumbered (-10ft speed), STR×10 lbs = Heavy (-20ft speed & Disadvantage).
                    </p>
                  </div>
                </label>

                {/* Flanking Rules */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useFlankingRules}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useFlankingRules: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5 text-amber-400" /> Tactical Flanking
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Adds Advantage prompt (5e) or +2 Attack bonus (3.5e) when positioned with an ally.
                    </p>
                  </div>
                </label>

                {/* Dual Classing / Multiclassing */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition sm:col-span-2 lg:col-span-1">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useMulticlassing}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          useMulticlassing: isChecked,
                          secondaryClass: isChecked ? (character.optionalRules?.secondaryClass || 'Rogue') : undefined,
                          secondaryLevel: isChecked ? (character.optionalRules?.secondaryLevel || 1) : undefined,
                          secondarySubclass: isChecked ? character.optionalRules?.secondarySubclass : undefined,
                        }
                      });
                    }}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div className="w-full">
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" /> Dual / Multiclassing
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Combines level, Hit Dice, and spellcaster slots across two classes.
                    </p>
                  </div>
                </label>

                {/* Gritty Realism Resting */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useGrittyRealismResting}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useGrittyRealismResting: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Gritty Realism Resting
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Short Rest = 8 Hours (overnight), Long Rest = 7 Days (sanctuary).
                    </p>
                  </div>
                </label>

                {/* Variant Critical Damage */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useVariantCritDamage}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useVariantCritDamage: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" /> Variant Critical Damage
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Maximize initial weapon die + roll second die (e.g. 8 + 1d8 + STR).
                    </p>
                  </div>
                </label>

                {/* Milestone XP Mode */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useMilestoneXp}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useMilestoneXp: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Milestone Mode
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Hides raw XP progress bars in favor of story/DM milestone level-ups.
                    </p>
                  </div>
                </label>

                {/* UA p.72: Gestalt Characters */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useGestaltUA72}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          useGestaltUA72: isChecked,
                          useMulticlassing: isChecked ? true : character.optionalRules?.useMulticlassing,
                          secondaryClass: isChecked ? (character.optionalRules?.secondaryClass || 'Rogue') : character.optionalRules?.secondaryClass,
                          secondaryLevel: isChecked ? character.level : character.optionalRules?.secondaryLevel
                        }
                      });
                    }}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" /> UA p.72: Gestalt Characters
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Combines 2 classes simultaneously at every level (takes best HD, BAB, and Save bonuses).
                    </p>
                  </div>
                </label>

                {/* UA p.109: Class Defense Bonus */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useDefenseBonusUA109}
                    onChange={(e) => {
                      const updated = {
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          useDefenseBonusUA109: e.target.checked
                        }
                      };
                      onUpdateCharacter(recalculateCharacterAC(updated));
                    }}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> UA p.109: Defense Bonus
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Grants Class Defense Bonus to AC scaling with level (+2 to +12 based on class role).
                    </p>
                  </div>
                </label>

                {/* UA p.111: Armor as Damage Reduction */}
                <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={!!character.optionalRules?.useArmorAsDRUA109}
                    onChange={(e) => onUpdateCharacter({
                      ...character,
                      optionalRules: {
                        ...character.optionalRules,
                        useArmorAsDRUA109: e.target.checked
                      }
                    })}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" /> UA p.111: Armor as DR
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Converts equipped armor into Damage Reduction (Heavy=DR 4, Med=DR 2, Light=DR 1).
                    </p>
                  </div>
                </label>

                {/* Sanity & Madness System Toggle (Call of Cthulhu System only) */}
                {character.edition === 'cthulhu' && (
                  <label className="flex items-start gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                    <input
                      type="checkbox"
                      checked={!!character.optionalRules?.useSanityRules || character.edition === 'cthulhu'}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        onUpdateCharacter({
                          ...character,
                          optionalRules: {
                            ...character.optionalRules,
                            useSanityRules: enabled
                          },
                          sanity: enabled
                            ? (character.sanity || {
                                current: 15,
                                max: 20,
                                score: 10,
                                madnessState: 'Sane',
                                madnessEffect: '',
                                sanityNotes: ''
                              })
                            : character.sanity
                        });
                      }}
                      className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-stone-200 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5 text-amber-400" /> Sanity & Madness System
                      </span>
                      <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                        Sanity score/pool, Sanity saves, Short/Long-Term & Indefinite Madness tracking.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Multiclass Configuration Sub-panel */}
              {character.optionalRules?.useMulticlassing && (
                <div className="pt-2 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950 p-3 rounded-lg border border-amber-600/30">
                  <div>
                    <label className="block text-xs font-serif font-bold text-amber-300 mb-1">Secondary Class</label>
                    <select
                      value={character.optionalRules?.secondaryClass || 'Rogue'}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          secondaryClass: e.target.value
                        }
                      })}
                      className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded px-2.5 py-1 text-xs font-sans"
                    >
                      {['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock', 'Artificer'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-amber-300 mb-1">Secondary Level</label>
                    <input
                      type="number"
                      min="1"
                      value={character.optionalRules?.secondaryLevel || 1}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          secondaryLevel: Math.max(1, parseInt(e.target.value) || 1)
                        }
                      })}
                      className="w-full bg-stone-900 border border-stone-700 font-mono font-bold text-stone-200 rounded px-2.5 py-1 text-xs text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-amber-300 mb-1">Secondary Subclass</label>
                    <input
                      type="text"
                      value={character.optionalRules?.secondarySubclass || ''}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          secondarySubclass: e.target.value
                        }
                      })}
                      placeholder="e.g. Assassin"
                      className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Ability Scores & Skills (Branch for Shadowrun vs D&D) */}
      {character.edition === 'shadowrun' ? (
        <div className="space-y-6">
          <ShadowrunStatsPanel
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
          />
          <ShadowrunSkillsPanel
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
          />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {abilitiesList.map((ability) => {
            const score = character.abilities[ability]?.score || 10;
            const mod = getAbilityModifier(score);
            const isSaveProf = character.savingThrowProficiencies.includes(ability);
            const saveBonus = getSavingThrowBonus(ability, character.abilities, character.savingThrowProficiencies, character.level);

            return (
              <div
                key={ability}
                className="bg-stone-900 border border-amber-800/30 hover:border-amber-600/60 rounded-2xl p-3 shadow-lg flex flex-col items-center justify-between transition group"
              >
                <div className="text-xs font-mono font-extrabold uppercase text-amber-500 tracking-wider">
                  {ability}
                </div>

                {/* Score (Primary Big Display) & Modifier */}
                <div className="my-1.5 text-center flex flex-col items-center">
                  {editingAbilities ? (
                    <div className="flex items-center gap-1 my-1">
                      <span className="text-[10px] text-stone-400 font-mono">Score:</span>
                      <input
                        type="number"
                        min="1"
                        value={score}
                        onChange={(e) => handleScoreChange(ability, parseInt(e.target.value) || 10)}
                        className="w-14 bg-stone-800 border border-amber-500 text-center font-mono text-base rounded font-bold text-amber-200"
                      />
                    </div>
                  ) : (
                    <div className="text-3xl font-serif font-extrabold text-amber-100">
                      {score}
                    </div>
                  )}

                  <div className="text-xs font-mono font-bold text-amber-300 bg-stone-950/90 px-2.5 py-0.5 rounded-full border border-stone-800 mt-1 shadow-inner">
                    Mod: <span className="text-emerald-400">{formatModifier(mod)}</span>
                  </div>
                </div>

                {/* Quick Roll Ability Check Button */}
                <button
                  onClick={() => onRoll(`${ability} Ability Check`, 20, 1, mod, 'normal')}
                  className="w-full mt-1 py-1 bg-stone-800 hover:bg-amber-700/80 text-amber-200 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                  title={`Roll ${ability} Check (d20${formatModifier(mod)})`}
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" /> Roll Check
                </button>

                {/* 5e Saving Throw Indicator */}
                {character.edition !== '3.5e' && (
                  <div className="w-full mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => handleSavingThrowToggle(ability)}
                      className="flex items-center gap-1 text-stone-400 hover:text-amber-300 transition"
                      title="Toggle Saving Throw Proficiency"
                    >
                      {isSaveProf ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>

                    <button
                      onClick={() => onRoll(`${ability} Saving Throw`, 20, 1, saveBonus, 'normal')}
                      className="font-mono font-bold text-emerald-300 hover:underline"
                      title={`Roll ${ability} Save`}
                    >
                      {formatModifier(saveBonus)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3.5e Saving Throws Card (Fortitude, Reflex, Will) */}
        {character.edition === '3.5e' && (
          <div className="bg-stone-900 border border-amber-700/40 rounded-2xl p-4 shadow-xl text-stone-100">
            <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
              <div className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                D&D 3.5e Saving Throws (Fortitude / Reflex / Will)
              </div>
              <span className="text-xs text-stone-400 font-mono">Base Save + Ability Mod = Total Save</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fortitude Save */}
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs uppercase">Fortitude (FORT)</span>
                  <span className="text-[10px] text-stone-400">CON Mod: {formatModifier(getAbilityModifier(character.abilities.CON?.score || 10))}</span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div className="text-xs text-stone-400 flex items-center gap-1">
                    <span>Base:</span>
                    <input
                      type="number"
                      value={character.fortSaveBase ?? 4}
                      onChange={(e) => onUpdateCharacter({ ...character, fortSaveBase: parseInt(e.target.value) || 0 })}
                      className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
                    />
                  </div>
                  <div className="text-2xl font-serif font-extrabold text-emerald-300">
                    {formatModifier(get35eFortSave(character))}
                  </div>
                </div>

                <button
                  onClick={() => onRoll('Fortitude Save (3.5e)', 20, 1, get35eFortSave(character), 'normal')}
                  className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Fort Save
                </button>
              </div>

              {/* Reflex Save */}
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs uppercase">Reflex (REF)</span>
                  <span className="text-[10px] text-stone-400">DEX Mod: {formatModifier(getAbilityModifier(character.abilities.DEX?.score || 10))}</span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div className="text-xs text-stone-400 flex items-center gap-1">
                    <span>Base:</span>
                    <input
                      type="number"
                      value={character.refSaveBase ?? 1}
                      onChange={(e) => onUpdateCharacter({ ...character, refSaveBase: parseInt(e.target.value) || 0 })}
                      className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
                    />
                  </div>
                  <div className="text-2xl font-serif font-extrabold text-emerald-300">
                    {formatModifier(get35eRefSave(character))}
                  </div>
                </div>

                <button
                  onClick={() => onRoll('Reflex Save (3.5e)', 20, 1, get35eRefSave(character), 'normal')}
                  className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Ref Save
                </button>
              </div>

              {/* Will Save */}
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs uppercase">Will (WILL)</span>
                  <span className="text-[10px] text-stone-400">WIS Mod: {formatModifier(getAbilityModifier(character.abilities.WIS?.score || 10))}</span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div className="text-xs text-stone-400 flex items-center gap-1">
                    <span>Base:</span>
                    <input
                      type="number"
                      value={character.willSaveBase ?? 1}
                      onChange={(e) => onUpdateCharacter({ ...character, willSaveBase: parseInt(e.target.value) || 0 })}
                      className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-mono text-xs p-0.5"
                    />
                  </div>
                  <div className="text-2xl font-serif font-extrabold text-emerald-300">
                    {formatModifier(get35eWillSave(character))}
                  </div>
                </div>

                <button
                  onClick={() => onRoll('Will Save (3.5e)', 20, 1, get35eWillSave(character), 'normal')}
                  className="w-full py-1 bg-stone-800 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5 text-emerald-400" /> Roll Will Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sanity & Madness System Card Widget (Call of Cthulhu) */}
      {character.edition === 'cthulhu' && (
        <div className="bg-stone-900 border border-emerald-600/50 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950 rounded-xl border border-emerald-500/50">
                <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-emerald-200 flex items-center gap-2">
                  Sanity & Madness System
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 uppercase">
                    DMG p.264 / Call of Cthulhu
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Track mental composure, Sanity saving throws, and Short-Term, Long-Term, or Indefinite Madness states.
                </p>
              </div>
            </div>

            {/* Current Madness State Badge & Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-medium">State:</span>
              <select
                value={character.sanity?.madnessState || 'Sane'}
                onChange={(e) => {
                  const state = e.target.value as any;
                  onUpdateCharacter({
                    ...character,
                    sanity: {
                      ...(character.sanity || { current: 15, max: 20 }),
                      madnessState: state
                    }
                  });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-serif border transition ${
                  (character.sanity?.madnessState || 'Sane') === 'Sane'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : (character.sanity?.madnessState) === 'Short-Term Madness'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                    : (character.sanity?.madnessState) === 'Long-Term Madness'
                    ? 'bg-orange-950/80 border-orange-500 text-orange-200'
                    : 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md animate-pulse'
                }`}
              >
                <option value="Sane">🟢 Sane & Composed</option>
                <option value="Short-Term Madness">🟡 Short-Term Madness (1d10 mins)</option>
                <option value="Long-Term Madness">🟠 Long-Term Madness (1d10x10 hrs)</option>
                <option value="Indefinite Madness">🔴 Indefinite Madness (Permanent/Cured)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sanity Pool Counter & Meter (5 cols) */}
            <div className="lg:col-span-5 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-serif font-bold text-emerald-300">
                <span>Sanity Points (Current / Max)</span>
                <span className="font-mono text-emerald-100 text-sm">
                  {character.sanity?.current ?? 15} / {character.sanity?.max ?? 20}
                </span>
              </div>

              {/* Sanity Bar */}
              {(() => {
                const current = character.sanity?.current ?? 15;
                const max = Math.max(1, character.sanity?.max ?? 20);
                const pct = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
                const barColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-amber-500' : 'bg-rose-600';

                return (
                  <div className="w-full bg-stone-900 rounded-full h-3 border border-stone-800 overflow-hidden relative">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                );
              })()}

              {/* Quick Adjust Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <div className="flex items-center gap-1">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => {
                        const cur = character.sanity?.current ?? 15;
                        const mx = character.sanity?.max ?? 20;
                        const next = Math.max(0, Math.min(mx, cur + delta));
                        onUpdateCharacter({
                          ...character,
                          sanity: {
                            ...(character.sanity || { current: 15, max: 20 }),
                            current: next
                          }
                        });
                      }}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold border transition ${
                        delta < 0
                          ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-700/50 text-rose-200'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700/50 text-emerald-200'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const mx = character.sanity?.max ?? 20;
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        current: mx
                      }
                    });
                  }}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs font-semibold border border-stone-700 transition"
                >
                  Reset
                </button>
              </div>

              {/* Editable Max & Score */}
              <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-1.5">
                  <span>Max Sanity:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={character.sanity?.max ?? 20}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 20);
                      onUpdateCharacter({
                        ...character,
                        sanity: {
                          ...(character.sanity || { current: 15, max: 20 }),
                          max: val
                        }
                      });
                    }}
                    className="w-14 bg-stone-900 border border-stone-700 rounded text-center text-emerald-300 font-mono font-bold p-0.5"
                  />
                </div>

                {/* Roll Sanity Save Button */}
                <button
                  onClick={() => {
                    const wisMod = getAbilityModifier(character.abilities.WIS?.score || 10);
                    const chaMod = getAbilityModifier(character.abilities.CHA?.score || 10);
                    const sanMod = character.sanity?.score
                      ? Math.floor((character.sanity.score - 10) / 2)
                      : Math.max(wisMod, chaMod);

                    onRoll('Sanity Saving Throw', 20, 1, sanMod, 'normal');
                  }}
                  className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold rounded-lg transition flex items-center gap-1.5 shadow"
                >
                  <Dices className="w-3.5 h-3.5 text-emerald-300" /> Roll Save
                </button>
              </div>
            </div>

            {/* Random Madness Table Generators & Active Symptom Input (7 cols) */}
            <div className="lg:col-span-7 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Roll Random Madness Table (DMG p.259)
                </span>
                <span className="text-[10px] text-stone-500 font-mono">1d100 Random Rollers</span>
              </div>

              {/* Roll Madness Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const idx = Math.floor(Math.random() * SHORT_TERM_MADNESS_TABLE.length);
                    const effect = SHORT_TERM_MADNESS_TABLE[idx];
                    const rollVal = Math.floor(Math.random() * 100) + 1;
                    onRoll('Short-Term Madness Roll (1d100)', 100, 1, 0, 'normal');
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        madnessState: 'Short-Term Madness',
                        madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-amber-950 text-amber-300 border border-amber-800/50 rounded-lg text-xs font-semibold transition text-left"
                >
                  🎲 Roll Short-Term
                </button>

                <button
                  onClick={() => {
                    const idx = Math.floor(Math.random() * LONG_TERM_MADNESS_TABLE.length);
                    const effect = LONG_TERM_MADNESS_TABLE[idx];
                    const rollVal = Math.floor(Math.random() * 100) + 1;
                    onRoll('Long-Term Madness Roll (1d100)', 100, 1, 0, 'normal');
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        madnessState: 'Long-Term Madness',
                        madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-orange-950 text-orange-300 border border-orange-800/50 rounded-lg text-xs font-semibold transition text-left"
                >
                  🎲 Roll Long-Term
                </button>

                <button
                  onClick={() => {
                    const idx = Math.floor(Math.random() * INDEFINITE_MADNESS_TABLE.length);
                    const effect = INDEFINITE_MADNESS_TABLE[idx];
                    const rollVal = Math.floor(Math.random() * 100) + 1;
                    onRoll('Indefinite Madness Roll (1d100)', 100, 1, 0, 'normal');
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        madnessState: 'Indefinite Madness',
                        madnessEffect: `[d100 Roll #${rollVal}]: ${effect}`
                      }
                    });
                  }}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-rose-950 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold transition text-left"
                >
                  🎲 Roll Indefinite
                </button>
              </div>

              {/* Madness Symptom & Effect Editor */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Active Madness Symptoms & Trauma Effects
                </label>
                <textarea
                  rows={2}
                  value={character.sanity?.madnessEffect || ''}
                  onChange={(e) => {
                    onUpdateCharacter({
                      ...character,
                      sanity: {
                        ...(character.sanity || { current: 15, max: 20 }),
                        madnessEffect: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g. Paralyzed with fear when encountering dark shadows or water. Disadvantage on Wisdom checks."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Skills & Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): D&D Skills List (5e vs 3.5e) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
              <Shield className="w-5 h-5 text-amber-500" />
              <span>Skills ({character.edition === '3.5e' ? '3.5e Ranks System' : '5e Proficiency System'})</span>
            </div>
            {character.edition !== '3.5e' && (
              <div className="text-xs text-stone-400 font-mono">
                Prof: <span className="text-purple-300 font-bold">+{profBonus}</span>
              </div>
            )}
          </div>

          {/* 3.5e Skill Point Calculator Summary Panel */}
          {character.edition === '3.5e' && (() => {
            const defaultBaseSP = ['Rogue'].includes(character.characterClass) ? 8 : ['Bard', 'Ranger'].includes(character.characterClass) ? 6 : ['Barbarian', 'Druid', 'Monk'].includes(character.characterClass) ? 4 : 2;
            const baseSP = character.classBaseSkillPoints ?? defaultBaseSP;
            const intMod = getAbilityModifier(character.abilities.INT?.score || 10);
            const isHuman = character.race.toLowerCase().includes('human');

            const lvl1SP = Math.max(4, (baseSP + intMod) * 4) + (isHuman ? 4 : 0);
            const addLvlSP = (character.level - 1) * (Math.max(1, baseSP + intMod) + (isHuman ? 1 : 0));
            const totalAvailableSP = lvl1SP + addLvlSP;

            const totalSpentSP = character.skills.reduce((sum, s) => {
              const ranks = s.ranks || 0;
              const isClass = s.isClassSkill !== false;
              return sum + (ranks * (isClass ? 1 : 2));
            }, 0);

            const remainingSP = totalAvailableSP - totalSpentSP;
            const maxClassRanks = character.level + 3;
            const maxCrossRanks = (character.level + 3) / 2;

            return (
              <div className="mb-3 bg-stone-950 p-3 rounded-xl border border-amber-600/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-amber-300">3.5e Skill Point Calculator</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-stone-400">Base SP/Lvl:</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={baseSP}
                      onChange={(e) => onUpdateCharacter({ ...character, classBaseSkillPoints: parseInt(e.target.value) || 2 })}
                      className="w-10 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-0.5"
                      title="Base Skill Points per level for class (e.g. Rogue 8, Bard 6, Fighter 2)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono py-1.5 bg-stone-900/80 rounded-lg border border-stone-800">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Available</div>
                    <div className="text-sm font-bold text-amber-300">{totalAvailableSP} SP</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Spent</div>
                    <div className="text-sm font-bold text-stone-200">{totalSpentSP} SP</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Remaining</div>
                    <div className={`text-sm font-bold ${remainingSP < 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                      {remainingSP} SP
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-stone-400 flex items-center justify-between pt-0.5 font-mono">
                  <span>Class Max: <strong className="text-amber-300">{maxClassRanks} Ranks</strong> (1 SP)</span>
                  <span>Cross Max: <strong className="text-stone-300">{maxCrossRanks} Ranks</strong> (2 SP)</span>
                </div>
              </div>
            );
          })()}

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {character.skills.map((skill) => {
              if (character.edition === '3.5e') {
                const skillBonus = get35eSkillBonus(skill, character.abilities);
                const abilityMod = getAbilityModifier(character.abilities[skill.ability]?.score || 10);
                return (
                  <div
                    key={skill.id}
                    className="bg-stone-950/70 hover:bg-stone-800/80 p-2 rounded-xl flex items-center justify-between gap-1 text-xs border border-stone-800 transition"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {/* Class Skill Checkbox */}
                      <label
                        className="flex items-center gap-1 cursor-pointer shrink-0"
                        title="Check if Class Skill (1 SP per rank). Uncheck if Cross-Class Skill (2 SP per rank)."
                      >
                        <input
                          type="checkbox"
                          checked={skill.isClassSkill !== false}
                          onChange={(e) => handle35eSkillChange(skill.id, 'isClassSkill', e.target.checked)}
                          className="accent-amber-500 w-3.5 h-3.5 rounded"
                        />
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                          skill.isClassSkill !== false
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : 'bg-stone-900 text-stone-500 border border-stone-800'
                        }`}>
                          {skill.isClassSkill !== false ? 'C' : 'X'}
                        </span>
                      </label>

                      <span className="font-mono text-[10px] text-amber-500 font-bold w-6">
                        {skill.ability}
                      </span>
                      <span className="font-medium text-stone-200 truncate">{skill.name}</span>
                    </div>

                    {/* 3.5e Ranks, Mod, Misc Input */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Skill Ranks">
                        <span className="text-stone-500 text-[9px]">R:</span>
                        <input
                          type="number"
                          min="0"
                          value={skill.ranks || 0}
                          onChange={(e) => handle35eSkillChange(skill.id, 'ranks', parseInt(e.target.value) || 0)}
                          className="w-8 bg-transparent text-center font-bold text-amber-300 focus:outline-none"
                        />
                      </div>

                      <div className="text-stone-400 text-[10px]" title="Ability Modifier">
                        A:{formatModifier(abilityMod)}
                      </div>

                      <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Misc Modifier">
                        <span className="text-stone-500 text-[9px]">M:</span>
                        <input
                          type="number"
                          value={skill.miscMod || 0}
                          onChange={(e) => handle35eSkillChange(skill.id, 'miscMod', parseInt(e.target.value) || 0)}
                          className="w-7 bg-transparent text-center font-bold text-stone-300 focus:outline-none"
                        />
                      </div>

                      <span className="font-bold text-emerald-300 text-sm ml-1">
                        {formatModifier(skillBonus)}
                      </span>

                      <button
                        onClick={() => onRoll(`${skill.name} Check (3.5e)`, 20, 1, skillBonus, 'normal')}
                        className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition"
                        title={`Roll ${skill.name} Check`}
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Standard 5e Skill Render
              const skillBonus = getSkillBonus(skill, character.abilities, character.level);
              return (
                <div
                  key={skill.id}
                  className="bg-stone-950/60 hover:bg-stone-800/80 p-2 rounded-xl flex items-center justify-between gap-2 text-xs border border-stone-800 transition"
                >
                  {/* Left: Toggles and Skill Name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => handleSkillProficiencyChange(skill.id, 'proficient')}
                      className="text-stone-400 hover:text-amber-300 transition"
                      title="Toggle Proficiency"
                    >
                      {skill.proficient ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleSkillProficiencyChange(skill.id, 'expertise')}
                      className={`text-xs transition font-mono ${
                        skill.expertise ? 'text-amber-400 font-bold' : 'text-stone-600 hover:text-stone-400'
                      }`}
                      title="Toggle Expertise (Double Proficiency)"
                    >
                      [EXP]
                    </button>

                    <span className="font-mono text-[10px] text-amber-500 font-bold w-7">
                      {skill.ability}
                    </span>

                    <span className="font-medium text-stone-200 truncate">{skill.name}</span>
                  </div>

                  {/* Right: Calculated Bonus & Roll Button */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-200 text-sm">
                      {formatModifier(skillBonus)}
                    </span>
                    <button
                      onClick={() => onRoll(`${skill.name} Check`, 20, 1, skillBonus, 'normal')}
                      className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition"
                      title={`Roll ${skill.name} Check`}
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Class Features & Feats */}
        <div className="lg:col-span-7 space-y-6">
          {/* Class Features Box */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Class Features</span>
              </div>
              <button
                onClick={() => setShowAddFeatureModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Feature
              </button>
            </div>

            <div className="space-y-3">
              {character.classFeatures.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-2">No class features recorded yet.</p>
              ) : (
                character.classFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-serif font-bold text-amber-200 text-sm">{feature.name}</span>
                        <span className="ml-2 text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full font-sans">
                          {feature.source}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteFeature(feature.id)}
                        className="text-stone-500 hover:text-rose-400 p-1 transition"
                        title="Delete Feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-stone-300 text-xs leading-relaxed">{feature.description}</p>

                    {/* Usages Counter & Recharge */}
                    {feature.usesMax !== undefined && (
                      <div className="flex items-center justify-between bg-stone-900 p-2 rounded-lg border border-stone-800 mt-1">
                        <div className="text-stone-400 text-[11px] font-mono">
                          Uses: <span className="text-amber-300 font-bold">{feature.usesRemaining}</span> / {feature.usesMax}
                          {feature.recharge && (
                            <span className="ml-2 text-stone-500 text-[10px]">({feature.recharge})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUseFeature(feature.id, -1)}
                            className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleUseFeature(feature.id, 1)}
                            className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feats Box */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Feats</span>
              </div>
              <button
                onClick={() => setShowAddFeatModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Feat
              </button>
            </div>

            <div className="space-y-3">
              {character.feats.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-2">No feats added yet.</p>
              ) : (
                character.feats.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-serif font-bold text-amber-200 text-sm">{feat.name}</div>
                      <button
                        onClick={() => handleDeleteFeat(feat.id)}
                        className="text-stone-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* MODAL: Add Class Feature */}
      {showAddFeatureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Add Class Feature
              </h3>

              {/* Mode Tabs */}
              <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => setFeatureModalTab('official')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featureModalTab === 'official' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Official Library ({character.edition === '3.5e' ? '3.5e' : '5e'})
                </button>
                <button
                  onClick={() => setFeatureModalTab('custom')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featureModalTab === 'custom' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Custom Feature
                </button>
              </div>
            </div>

            {featureModalTab === 'official' ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Search official class features..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  {(character.edition === '3.5e' ? OFFICIAL_35E_CLASS_FEATURES : OFFICIAL_5E_CLASS_FEATURES)
                    .filter(f => f.name.toLowerCase().includes(featureSearch.toLowerCase()) || f.description.toLowerCase().includes(featureSearch.toLowerCase()) || f.className.toLowerCase().includes(featureSearch.toLowerCase()))
                    .map((feat) => (
                      <div key={feat.id} className="bg-stone-950/80 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs space-y-1.5 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                            <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                              {feat.source}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddOfficialFeature(feat)}
                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow transition"
                          >
                            + Add to Sheet
                          </button>
                        </div>
                        <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-stone-400 mb-1">Feature Name *</label>
                  <input
                    type="text"
                    value={newFeatureName}
                    onChange={(e) => setNewFeatureName(e.target.value)}
                    placeholder="e.g. Action Surge"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Source (e.g. Fighter Level 2)</label>
                  <input
                    type="text"
                    value={newFeatureSource}
                    onChange={(e) => setNewFeatureSource(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Max Uses (Optional)</label>
                    <input
                      type="number"
                      value={newFeatureMaxUses}
                      onChange={(e) => setNewFeatureMaxUses(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Recharge</label>
                    <select
                      value={newFeatureRecharge}
                      onChange={(e: any) => setNewFeatureRecharge(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                    >
                      <option value="Short Rest">Short Rest</option>
                      <option value="Long Rest">Long Rest</option>
                      <option value="Special">Special</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Description</label>
                  <textarea
                    value={newFeatureDesc}
                    onChange={(e) => setNewFeatureDesc(e.target.value)}
                    rows={3}
                    placeholder="Feature effect..."
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddFeatureModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {featureModalTab === 'custom' && (
                <button
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save Feature
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Feat */}
      {showAddFeatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Add Feat
              </h3>

              {/* Mode Tabs */}
              <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => setFeatModalTab('official')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featModalTab === 'official' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Official Library ({character.edition === '3.5e' ? '3.5e' : '5e'})
                </button>
                <button
                  onClick={() => setFeatModalTab('custom')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featModalTab === 'custom' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Custom Feat
                </button>
              </div>
            </div>

            {featModalTab === 'official' ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={featSearch}
                    onChange={(e) => setFeatSearch(e.target.value)}
                    placeholder="Search official feats..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  {(character.edition === '3.5e' ? OFFICIAL_35E_FEATS : OFFICIAL_5E_FEATS)
                    .filter(f => f.name.toLowerCase().includes(featSearch.toLowerCase()) || f.description.toLowerCase().includes(featSearch.toLowerCase()))
                    .map((feat) => (
                      <div key={feat.id} className="bg-stone-950/80 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs space-y-1.5 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                            {feat.source && (
                              <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                                {feat.source}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddOfficialFeat(feat)}
                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow transition"
                          >
                            + Add to Sheet
                          </button>
                        </div>
                        <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-stone-400 mb-1">Feat Name *</label>
                  <input
                    type="text"
                    value={newFeatName}
                    onChange={(e) => setNewFeatName(e.target.value)}
                    placeholder="e.g. Sentinel"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Description</label>
                  <textarea
                    value={newFeatDesc}
                    onChange={(e) => setNewFeatDesc(e.target.value)}
                    rows={4}
                    placeholder="Feat benefits..."
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddFeatModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {featModalTab === 'custom' && (
                <button
                  onClick={handleAddFeat}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save Feat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level Progression & Character Advancement Modal */}
      {showLevelProgressionModal && (
        <LevelProgressionModal
          character={character}
          onClose={() => setShowLevelProgressionModal(false)}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </div>
  );
};
