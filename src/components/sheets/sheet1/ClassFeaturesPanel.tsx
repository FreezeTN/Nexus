import React, { useState } from 'react';
import { CharacterData, ClassFeature } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { saveCustomCompendiumEntry } from '../../../data/compendiumData';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import {
  OFFICIAL_5E_CLASS_FEATURES,
  OFFICIAL_35E_CLASS_FEATURES,
  syncClassFeaturesForCharacter
} from '../../../data/srdRulesLibrary';
import { getCombinedLevel } from '../../../utils/dndCalculations';
import { Zap, Sparkles, Plus, Trash2, Search, Lock, Crown, Flame, Sun, Crosshair, Music, Target, Brain, TreePine, Sword, BookOpen, PawPrint, Skull } from 'lucide-react';
import { BarbarianRage35eModal } from '../../modals/BarbarianRage35eModal';
import { PaladinAbilities35eModal } from '../../modals/PaladinAbilities35eModal';
import { SneakAttack35eModal } from '../../modals/SneakAttack35eModal';
import { BardicMusic35eModal } from '../../modals/BardicMusic35eModal';
import { FavoredEnemy35eModal } from '../../modals/FavoredEnemy35eModal';
import { MonkMartialArts35eModal } from '../../modals/MonkMartialArts35eModal';
import { PsionicEngine35eModal } from '../../modals/PsionicEngine35eModal';
import { DruidNatureBond35eModal } from '../../modals/DruidNatureBond35eModal';
import { ClericDomains35eModal } from '../../modals/ClericDomains35eModal';
import { FighterBonusFeats35eModal } from '../../modals/FighterBonusFeats35eModal';
import { WizardSpecialization35eModal } from '../../modals/WizardSpecialization35eModal';
import { ArcaneFamiliar35eModal } from '../../modals/ArcaneFamiliar35eModal';
import { WarlockInvocations35eModal } from '../../modals/WarlockInvocations35eModal';
import { FactotumInspiration35eModal } from '../../modals/FactotumInspiration35eModal';
import { TomeOfBattle35eModal } from '../../modals/TomeOfBattle35eModal';
import { ArtificerCraft35eModal } from '../../modals/ArtificerCraft35eModal';
import { BinderPact35eModal } from '../../modals/BinderPact35eModal';
import { Incarnum35eModal } from '../../modals/Incarnum35eModal';
import { AurasAndKi35eModal } from '../../modals/AurasAndKi35eModal';

interface ClassFeaturesPanelProps {
  character: CharacterData;
  isDmRole: boolean;
  onUpdateCharacter: (updated: CharacterData) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
  onOpenTurnUndead?: () => void;
  onOpenPrestigeValidator?: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode?: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const ClassFeaturesPanel: React.FC<ClassFeaturesPanelProps> = ({
  character,
  isDmRole,
  onUpdateCharacter,
  onOpenShapeshift,
  onOpenSummonCompanion,
  onOpenTurnUndead,
  onOpenPrestigeValidator,
  onRoll
}) => {
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [featureModalTab, setFeatureModalTab] = useState<'official' | 'custom'>('official');
  const [featureSearch, setFeatureSearch] = useState('');
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  // 3.5e Signature Class Feature Engines Modals
  const [showRageModal, setShowRageModal] = useState(false);
  const [showPaladinModal, setShowPaladinModal] = useState(false);
  const [showSneakAttackModal, setShowSneakAttackModal] = useState(false);
  const [showBardicMusicModal, setShowBardicMusicModal] = useState(false);
  const [showFavoredEnemyModal, setShowFavoredEnemyModal] = useState(false);
  const [showMonkModal, setShowMonkModal] = useState(false);
  const [showPsionicModal, setShowPsionicModal] = useState(false);
  const [showDruidModal, setShowDruidModal] = useState(false);
  const [showClericModal, setShowClericModal] = useState(false);
  const [showFighterModal, setShowFighterModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showFamiliarModal, setShowFamiliarModal] = useState(false);

  // 3.5e Supplemental Subsystems Modals
  const [showWarlockModal, setShowWarlockModal] = useState(false);
  const [showFactotumModal, setShowFactotumModal] = useState(false);
  const [showTomeOfBattleModal, setShowTomeOfBattleModal] = useState(false);
  const [showArtificerModal, setShowArtificerModal] = useState(false);
  const [showBinderModal, setShowBinderModal] = useState(false);
  const [showIncarnumModal, setShowIncarnumModal] = useState(false);
  const [showAurasKiModal, setShowAurasKiModal] = useState(false);

  // New Feature Form state
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureSource, setNewFeatureSource] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureMaxUses, setNewFeatureMaxUses] = useState<string>('');
  const [newFeatureRecharge, setNewFeatureRecharge] = useState<'Short Rest' | 'Long Rest' | 'Special' | 'None'>('Short Rest');

  const effectiveCharacterLevel = getCombinedLevel(character);
  const is35e = character.edition === '3.5e';
  const clsLower = (character.characterClass || '').toLowerCase();

  const handleUseFeature = (id: string, delta: number) => {
    const updatedFeatures = character.classFeatures.map(f => {
      if (f.id === id && f.usesMax !== undefined) {
        const remaining = f.usesRemaining ?? f.usesMax;
        const nextUses = Math.max(0, Math.min(f.usesMax, remaining + delta));
        return { ...f, usesRemaining: nextUses };
      }
      return f;
    });
    onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
  };

  const handleDeleteFeature = (id: string) => {
    onUpdateCharacter({
      ...character,
      classFeatures: character.classFeatures.filter(f => f.id !== id)
    });
  };

  const handleAddOfficialFeature = (featObj: ClassFeature & { reqLevel?: number }) => {
    const reqLevel = featObj.reqLevel || 1;
    if (reqLevel > effectiveCharacterLevel && !isDmRole) {
      setModalNotice(`🔒 Perk Locked: "${featObj.name}" requires Level ${reqLevel} (Your Level: ${effectiveCharacterLevel}). Class features unlock automatically as you level up. Ask your DM to grant early!`);
      return;
    }
    setModalNotice(null);

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

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    const maxUsesNum = parseInt(newFeatureMaxUses);
    const newFeature: ClassFeature = {
      id: 'cf-' + Date.now(),
      name: newFeatureName,
      source: newFeatureSource || 'Custom',
      description: newFeatureDesc,
      usesMax: !isNaN(maxUsesNum) ? maxUsesNum : undefined,
      usesRemaining: !isNaN(maxUsesNum) ? maxUsesNum : undefined,
      recharge: newFeatureRecharge
    };
    onUpdateCharacter({
      ...character,
      classFeatures: [...character.classFeatures, newFeature]
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-feat-' + newFeature.id,
        name: newFeature.name,
        category: 'features',
        edition: character.edition || '5e',
        description: newFeature.description,
        source: newFeature.source || 'Custom Feature',
        isCustom: true,
        tags: [character.edition || '5e', 'Custom'],
        featureData: newFeature
      });
    } catch (e) {
      console.error('Failed to auto-add feature to compendium', e);
    }

    setNewFeatureName('');
    setNewFeatureSource('');
    setNewFeatureDesc('');
    setNewFeatureMaxUses('');
    setShowAddFeatureModal(false);
  };

  return (
    <>
      <CollapsibleBox
        title="Class Features"
        icon={<Zap className="w-5 h-5 text-amber-500" />}
        storageKey="sheet1_features"
        headerExtra={
          <div className="flex flex-wrap items-center gap-1.5">
            {is35e && (
              <>
                {clsLower.includes('barbarian') && (
                  <button
                    type="button"
                    onClick={() => setShowRageModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-600/60 text-red-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Barbarian Rage Engine"
                  >
                    <Flame className="w-3.5 h-3.5 text-red-400" /> Rage Engine
                  </button>
                )}
                {clsLower.includes('paladin') && (
                  <button
                    type="button"
                    onClick={() => setShowPaladinModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Paladin Smite & Lay on Hands Suite"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Holy Suite
                  </button>
                )}
                {(clsLower.includes('rogue') || clsLower.includes('assassin')) && (
                  <button
                    type="button"
                    onClick={() => setShowSneakAttackModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-950 hover:bg-yellow-900 border border-yellow-600/60 text-yellow-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Sneak Attack & Precision Calculator"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-yellow-400" /> Sneak Attack
                  </button>
                )}
                {clsLower.includes('bard') && (
                  <button
                    type="button"
                    onClick={() => setShowBardicMusicModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 text-purple-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Bardic Music Studio"
                  >
                    <Music className="w-3.5 h-3.5 text-purple-400" /> Bardic Music
                  </button>
                )}
                {clsLower.includes('ranger') && (
                  <button
                    type="button"
                    onClick={() => setShowFavoredEnemyModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Favored Enemy & Combat Style Engine"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-400" /> Favored Enemy
                  </button>
                )}
                {clsLower.includes('monk') && (
                  <button
                    type="button"
                    onClick={() => setShowMonkModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-300 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Monk Ki & Martial Arts Suite"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Martial Arts
                  </button>
                )}
                {(clsLower.includes('psion') || clsLower.includes('wilder') || clsLower.includes('soulknife') || clsLower.includes('psychic')) && (
                  <button
                    type="button"
                    onClick={() => setShowPsionicModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-950 hover:bg-violet-900 border border-violet-600/60 text-violet-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Expanded Psionics Engine"
                  >
                    <Brain className="w-3.5 h-3.5 text-violet-400" /> Psionic Engine
                  </button>
                )}
                {clsLower.includes('druid') && (
                  <button
                    type="button"
                    onClick={() => setShowDruidModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Druid Nature's Bond & Wild Empathy Suite"
                  >
                    <TreePine className="w-3.5 h-3.5 text-emerald-400" /> Nature's Bond
                  </button>
                )}
                {clsLower.includes('cleric') && (
                  <button
                    type="button"
                    onClick={() => setShowClericModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-200 rounded-lg text-xs font-bold transition shadow"
                    title="Configure 3.5e Cleric Divine Domains & Spontaneous Casting"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Domains
                  </button>
                )}
                {clsLower.includes('fighter') && (
                  <button
                    type="button"
                    onClick={() => setShowFighterModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-600/60 text-red-200 rounded-lg text-xs font-bold transition shadow"
                    title="Manage 3.5e Fighter Bonus Feats & Weapon Specializations"
                  >
                    <Sword className="w-3.5 h-3.5 text-red-400" /> Fighter Feats
                  </button>
                )}
                {clsLower.includes('wizard') && (
                  <button
                    type="button"
                    onClick={() => setShowWizardModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/60 text-indigo-200 rounded-lg text-xs font-bold transition shadow"
                    title="Configure 3.5e Wizard Arcane School Specialization & Prohibited Schools"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Arcane School
                  </button>
                )}
                {(clsLower.includes('wizard') || clsLower.includes('sorcerer')) && (
                  <button
                    type="button"
                    onClick={() => setShowFamiliarModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 text-purple-200 rounded-lg text-xs font-bold transition shadow"
                    title="Manage 3.5e Arcane Familiar & Master Synergy Perks"
                  >
                    <PawPrint className="w-3.5 h-3.5 text-purple-400" /> Familiar
                  </button>
                )}
                {(clsLower.includes('warlock') || clsLower.includes('dragonfire')) && (
                  <button
                    type="button"
                    onClick={() => setShowWarlockModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 text-purple-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Eldritch Blast, Breath Weapon & Invocations Suite"
                  >
                    <Flame className="w-3.5 h-3.5 text-purple-400" /> Invocations
                  </button>
                )}
                {clsLower.includes('factotum') && (
                  <button
                    type="button"
                    onClick={() => setShowFactotumModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Factotum Inspiration Points & Tactical Spends Suite"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Inspiration
                  </button>
                )}
                {(clsLower.includes('crusader') || clsLower.includes('warblade') || clsLower.includes('swordsage')) && (
                  <button
                    type="button"
                    onClick={() => setShowTomeOfBattleModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-600/60 text-red-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Tome of Battle: The Sublime Way Maneuvers & Stances Suite"
                  >
                    <Sword className="w-3.5 h-3.5 text-red-400" /> Sublime Way
                  </button>
                )}
                {clsLower.includes('artificer') && (
                  <button
                    type="button"
                    onClick={() => setShowArtificerModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-600/60 text-blue-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Artificer Craft Reserve & Item Creation Feats Engine"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Craft Reserve
                  </button>
                )}
                {clsLower.includes('binder') && (
                  <button
                    type="button"
                    onClick={() => setShowBinderModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-950 hover:bg-violet-900 border border-violet-600/60 text-violet-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Binder Pact Magic & Vestige Binding Engine"
                  >
                    <Brain className="w-3.5 h-3.5 text-violet-400" /> Pact Magic
                  </button>
                )}
                {(clsLower.includes('incarnate') || clsLower.includes('totemist') || clsLower.includes('soulborn')) && (
                  <button
                    type="button"
                    onClick={() => setShowIncarnumModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/60 text-cyan-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Magic of Incarnum Essentia & Soulmelds Suite"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Incarnum
                  </button>
                )}
                {(clsLower.includes('dragon shaman') || clsLower.includes('marshal') || clsLower.includes('ninja')) && (
                  <button
                    type="button"
                    onClick={() => setShowAurasKiModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Auras, Vitality & Ki Powers Suite"
                  >
                    <Sun className="w-3.5 h-3.5 text-emerald-400" /> Auras & Ki
                  </button>
                )}
                {(clsLower.includes('cleric') || clsLower.includes('paladin')) && onOpenTurnUndead && (
                  <button
                    type="button"
                    onClick={onOpenTurnUndead}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-950 hover:bg-yellow-900 border border-yellow-600/60 text-yellow-200 rounded-lg text-xs font-bold transition shadow"
                    title="Launch 3.5e Turn / Rebuke Undead Dice Engine"
                  >
                    <Skull className="w-3.5 h-3.5 text-yellow-400" /> Turn Undead
                  </button>
                )}
                {onOpenPrestigeValidator && (
                  <button
                    type="button"
                    onClick={onOpenPrestigeValidator}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 text-purple-200 rounded-lg text-xs font-bold transition shadow"
                    title="Verify prerequisites for D&D 3.5e Prestige Classes (BAB, Feats, Skills, Alignment)"
                  >
                    <Crown className="w-3.5 h-3.5 text-purple-400" /> Prestige Prereqs
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                const synced = syncClassFeaturesForCharacter(character, character.characterClass, character.level, character.edition);
                onUpdateCharacter(synced);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-300 rounded-lg text-xs font-bold transition shadow"
              title={`Auto-add official ${character.characterClass} features for level ${character.level}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Sync Class ({character.characterClass})
            </button>
            <button
              onClick={() => setShowAddFeatureModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Feature
            </button>
          </div>
        }
      >
        <div className="space-y-3 pt-2">
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
                  <div className="flex items-center gap-1.5">
                    {isShapeshiftAbility(feature.name, feature.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Shapeshift Engine for this feature"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(feature.name, feature.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Companion & Summon Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}
                    {(feature.name.toLowerCase().includes('turn undead') || feature.name.toLowerCase().includes('rebuke undead')) && (
                      <button
                        onClick={onOpenTurnUndead}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Launch 3.5e Turn / Rebuke Undead Sequence"
                      >
                        <span>☀️</span>
                        <span>Turn Undead</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('barbarian rage') || feature.name.toLowerCase() === 'rage' || feature.name.toLowerCase().includes('greater rage') || feature.name.toLowerCase().includes('mighty rage')) && (
                      <button
                        onClick={() => setShowRageModal(true)}
                        className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Manage Barbarian Rage"
                      >
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                        <span>Rage</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('smite evil') || feature.name.toLowerCase().includes('lay on hands') || feature.name.toLowerCase().includes('divine grace')) && (
                      <button
                        onClick={() => setShowPaladinModal(true)}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Paladin Abilities"
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Holy</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('sneak attack') || feature.name.toLowerCase().includes('death attack')) && (
                      <button
                        onClick={() => setShowSneakAttackModal(true)}
                        className="px-2.5 py-1 bg-yellow-950 hover:bg-yellow-900 text-yellow-200 border border-yellow-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Sneak Attack Suite"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Precision</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('bardic music') || feature.name.toLowerCase().includes('inspire courage') || feature.name.toLowerCase().includes('countersong') || feature.name.toLowerCase().includes('fascinate')) && (
                      <button
                        onClick={() => setShowBardicMusicModal(true)}
                        className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Bardic Music Studio"
                      >
                        <Music className="w-3.5 h-3.5 text-purple-400" />
                        <span>Music</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('favored enemy') || feature.name.toLowerCase().includes('combat style')) && (
                      <button
                        onClick={() => setShowFavoredEnemyModal(true)}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Favored Enemy Manager"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Hunter</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('flurry of blows') || feature.name.toLowerCase().includes('unarmed strike') || feature.name.toLowerCase().includes('stunning fist') || feature.name.toLowerCase().includes('ki strike') || feature.name.toLowerCase().includes('wholeness of body')) && (
                      <button
                        onClick={() => setShowMonkModal(true)}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Monk Martial Arts Suite"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Martial</span>
                      </button>
                    )}
                    {is35e && (feature.name.toLowerCase().includes('power point') || feature.name.toLowerCase().includes('mind blade') || feature.name.toLowerCase().includes('wild surge') || feature.name.toLowerCase().includes('psionic')) && (
                      <button
                        onClick={() => setShowPsionicModal(true)}
                        className="px-2.5 py-1 bg-violet-950 hover:bg-violet-900 text-violet-200 border border-violet-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Psionic Engine"
                      >
                        <Brain className="w-3.5 h-3.5 text-violet-400" />
                        <span>Psionics</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 transition"
                      title="Delete Feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
      </CollapsibleBox>

      {/* MODAL: Add Class Feature */}
      {showAddFeatureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Add Class Feature
              </h3>

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

            {/* Locked feature or feedback banner */}
            {modalNotice && (
              <div className="bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <span>{modalNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNotice(null)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            )}

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
                    .map((feat) => {
                      const reqLevel = (feat as any).reqLevel || 1;
                      const isLocked = reqLevel > effectiveCharacterLevel;

                      return (
                        <div key={feat.id} className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                          isLocked ? 'bg-stone-950/40 border-stone-800/80 opacity-80' : 'bg-stone-950/80 border-stone-800 hover:border-amber-600/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                              <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                                {feat.source}
                              </span>
                              {isLocked && (
                                <span className="ml-1.5 text-[10px] text-amber-400 font-mono bg-amber-950/90 border border-amber-600/50 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Req. Lvl {reqLevel}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddOfficialFeature(feat)}
                              className={`px-3 py-1 rounded-lg font-bold text-[11px] shadow transition flex items-center gap-1 ${
                                isLocked && !isDmRole
                                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                  : isLocked && isDmRole
                                    ? 'bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-500/60'
                                    : 'bg-amber-700 hover:bg-amber-600 text-white'
                              }`}
                              title={
                                isLocked && !isDmRole
                                  ? `🔒 Unlocks at Level ${reqLevel}. Ask your DM to grant early.`
                                  : isLocked && isDmRole
                                    ? `👑 DM Grant: Manually grant Level ${reqLevel} feature early`
                                    : '+ Add to Sheet'
                              }
                            >
                              {isLocked && isDmRole && <Crown className="w-3 h-3 text-amber-400" />}
                              {isLocked && !isDmRole && <Lock className="w-3 h-3 text-amber-500/80" />}
                              <span>{isLocked && !isDmRole ? `Lvl ${reqLevel} Req.` : isLocked && isDmRole ? 'Grant (DM)' : '+ Add to Sheet'}</span>
                            </button>
                          </div>
                          <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                        </div>
                      );
                    })}
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

      {/* 3.5e Signature Class Feature Engines Modals */}
      {is35e && (
        <>
          <BarbarianRage35eModal
            isOpen={showRageModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowRageModal(false)}
          />

          <PaladinAbilities35eModal
            isOpen={showPaladinModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowPaladinModal(false)}
          />

          <SneakAttack35eModal
            isOpen={showSneakAttackModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowSneakAttackModal(false)}
          />

          <BardicMusic35eModal
            isOpen={showBardicMusicModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowBardicMusicModal(false)}
          />

          <FavoredEnemy35eModal
            isOpen={showFavoredEnemyModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowFavoredEnemyModal(false)}
          />

          <MonkMartialArts35eModal
            isOpen={showMonkModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowMonkModal(false)}
          />

          <PsionicEngine35eModal
            isOpen={showPsionicModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowPsionicModal(false)}
          />

          <DruidNatureBond35eModal
            isOpen={showDruidModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowDruidModal(false)}
          />

          <ClericDomains35eModal
            isOpen={showClericModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowClericModal(false)}
          />

          <FighterBonusFeats35eModal
            isOpen={showFighterModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowFighterModal(false)}
          />

          <WizardSpecialization35eModal
            isOpen={showWizardModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowWizardModal(false)}
          />

          <ArcaneFamiliar35eModal
            isOpen={showFamiliarModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowFamiliarModal(false)}
          />

          <WarlockInvocations35eModal
            isOpen={showWarlockModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowWarlockModal(false)}
            onRoll={onRoll ? (lbl, dt, dc, mod) => onRoll(lbl, dt, dc, mod) : undefined}
          />

          <FactotumInspiration35eModal
            isOpen={showFactotumModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowFactotumModal(false)}
            onRoll={onRoll ? (lbl, dt, dc, mod) => onRoll(lbl, dt, dc, mod) : undefined}
          />

          <TomeOfBattle35eModal
            isOpen={showTomeOfBattleModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowTomeOfBattleModal(false)}
            onRoll={onRoll ? (lbl, dt, dc, mod) => onRoll(lbl, dt, dc, mod) : undefined}
          />

          <ArtificerCraft35eModal
            isOpen={showArtificerModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowArtificerModal(false)}
          />

          <BinderPact35eModal
            isOpen={showBinderModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowBinderModal(false)}
            onRoll={onRoll ? (lbl, dt, dc, mod) => onRoll(lbl, dt, dc, mod) : undefined}
          />

          <Incarnum35eModal
            isOpen={showIncarnumModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowIncarnumModal(false)}
          />

          <AurasAndKi35eModal
            isOpen={showAurasKiModal}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onClose={() => setShowAurasKiModal(false)}
          />
        </>
      )}
    </>
  );
};
