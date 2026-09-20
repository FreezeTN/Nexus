import React, { useState, useMemo, useEffect } from 'react';
import { CharacterData, GestaltTrack, GestaltTrackClass } from '../../types';
import { GameSession } from '../../lib/firebase';
import { ShadowrunStatsPanel } from '../shadowrun/ShadowrunStatsPanel';
import { ShadowrunSkillsPanel } from '../shadowrun/ShadowrunSkillsPanel';
import { PathfinderTacticalPanel } from '../pathfinder/PathfinderTacticalPanel';
import { CthulhuInvestigatorPanel } from '../cthulhu/CthulhuInvestigatorPanel';
import { LevelProgressionModal } from '../modals/LevelProgressionModal';
import { TransformationModal } from '../modals/TransformationModal';
import { CompanionModal } from '../modals/CompanionModal';
import { HybridHeritageModal } from '../modals/HybridHeritageModal';
import { TurnUndead35eModal } from '../modals/TurnUndead35eModal';
import { PrestigeClassValidatorModal } from '../modals/PrestigeClassValidatorModal';
import {
  recalculateCharacterAC,
  OFFICIAL_35E_PRESTIGE_CLASSES,
  validateCharacterForPrestigeClass,
  validate35eClassAlignment,
  calculate35eMulticlassXpPenalty,
  getGestaltHitDie,
  getGestaltBaseSkillPoints,
  getCharacterBab,
  calculate35eBaseSaves,
  getCharacterGestaltTracks,
  format35eBabProgression,
  apply35eDefaultClassSkills
} from '../../utils/dndCalculations';
import {
  getClassesForSystem,
  getRacesForSystem,
  getRaceDetailsForSystem,
  getClassDetailsForSystem,
  getSubclassesForSystemClass,
  getAlignmentsForSystem
} from '../modals/newCharacter/newCharacterData';
import { syncClassFeaturesForCharacter } from '../../data/srdRulesLibrary';
import {
  findRaceInCompendiumOrSRD,
  applyRaceToCharacter,
  calculateRaceBonusesAndDefenses,
  getRacialBaseSpeed
} from '../../utils/raceApplication';
import { Crown, AlertTriangle, Eye, Sparkles, RefreshCw, Footprints, RotateCcw, Info, Plus, Trash2, Pause, Play, Check, Layers } from 'lucide-react';
import { EditMovementSpeedModal } from '../modals/EditMovementSpeedModal';

import { CharacterHeaderSummary } from './sheet1/CharacterHeaderSummary';
import { WorkspaceCustomizer } from '../common/WorkspaceCustomizer';
import { AbilityScoresPanel } from './sheet1/AbilityScoresPanel';
import { SavingThrows35ePanel } from './sheet1/SavingThrows35ePanel';
import { SanityMadnessPanel } from './sheet1/SanityMadnessPanel';
import { SkillsPanel } from './sheet1/SkillsPanel';
import { ClassFeaturesPanel } from './sheet1/ClassFeaturesPanel';
import { FeatsPanel } from './sheet1/FeatsPanel';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { useUiMode } from '../../context/UiModeContext';
import { EmptyLayoutState } from '../common/EmptyLayoutState';

interface Sheet1Props {
  character: CharacterData;
  currentUser?: { role?: string; displayName?: string } | null;
  activeSession?: GameSession | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onDuplicateCharacter?: (character: CharacterData) => void;
  onSyncToBaseCharacter?: (sessionCharId: string) => void;
}

export const Sheet1StatsFeatures: React.FC<Sheet1Props> = ({
  character,
  currentUser,
  activeSession,
  onUpdateCharacter,
  onAddMonsterToRoster,
  onRoll,
  onDuplicateCharacter,
  onSyncToBaseCharacter
}) => {
  const [editingAbilities, setEditingAbilities] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLevelProgressionModal, setShowLevelProgressionModal] = useState(false);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showHybridHeritageModal, setShowHybridHeritageModal] = useState(false);
  const [showTurnUndeadModal, setShowTurnUndeadModal] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [customClassMode, setCustomClassMode] = useState(false);
  const [customRaceMode, setCustomRaceMode] = useState(false);
  const [customSubclassMode, setCustomSubclassMode] = useState(false);
  const [customAlignmentMode, setCustomAlignmentMode] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  const { isVisible } = useLayoutCustomization();
  const { uiMode } = useUiMode();
  const isDmRole = currentUser?.role === 'DM';

  const is35e = character.edition === '3.5e';
  const [compendiumVersion, setCompendiumVersion] = useState(0);

  useEffect(() => {
    const handleCompendiumUpdate = () => {
      setCompendiumVersion(v => v + 1);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dnd_app_custom_compendium_v1') {
        setCompendiumVersion(v => v + 1);
      }
    };
    window.addEventListener('compendiumUpdated' as any, handleCompendiumUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('compendiumUpdated' as any, handleCompendiumUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const raceDetails = useMemo(() => getRaceDetailsForSystem(character.edition), [character.edition, compendiumVersion]);
  const classDetails = useMemo(() => getClassDetailsForSystem(character.edition), [character.edition, compendiumVersion]);

  const baseClasses = useMemo(() => getClassesForSystem(character.edition), [character.edition, compendiumVersion]);
  const baseRaces = useMemo(() => getRacesForSystem(character.edition), [character.edition, compendiumVersion]);
  const baseAlignments = useMemo(() => getAlignmentsForSystem(character.edition), [character.edition]);
  const availableSubclasses = useMemo(
    () => getSubclassesForSystemClass(character.edition, character.characterClass),
    [character.edition, character.characterClass]
  );

  const isCustomRace = !baseRaces.includes(character.race) && character.race.trim() !== '';
  const isCustomAlignment = !baseAlignments.includes(character.alignment) && character.alignment?.trim() !== '';
  const isCustomSubclass = Boolean(
    character.subclass &&
    character.subclass.trim() !== '' &&
    !availableSubclasses.includes(character.subclass)
  );

  const raceLabel =
    character.edition === 'shadowrun'
      ? 'Metatype'
      : character.edition === 'cthulhu'
      ? 'Origin / Nationality'
      : 'Race / Species';

  const subclassLabel =
    character.edition === 'shadowrun'
      ? 'Specialization'
      : character.edition === 'pathfinder'
      ? 'Subclass / Doctrine'
      : character.edition === 'cthulhu'
      ? 'Specialist Focus'
      : character.edition === '3.5e'
      ? 'Specialization / Archetype'
      : 'Subclass / Archetype';

  const alignmentLabel =
    character.edition === 'shadowrun'
      ? 'Disposition / Allegiance'
      : character.edition === 'cthulhu'
      ? 'Mental Disposition'
      : 'Alignment';

  const unlockedPrestigeNames = useMemo(() => {
    if (!is35e) return new Set<string>();
    const set = new Set<string>();
    for (const pc of OFFICIAL_35E_PRESTIGE_CLASSES) {
      const res = validateCharacterForPrestigeClass(character, pc);
      if (res.isQualified) {
        set.add(pc.name);
      }
    }
    return set;
  }, [character, is35e]);

  const allKnownClasses = useMemo(() => {
    const set = new Set<string>(baseClasses);
    if (is35e) {
      OFFICIAL_35E_PRESTIGE_CLASSES.forEach(p => set.add(p.name));
    }
    return set;
  }, [baseClasses, is35e]);

  const isCustomClass = !allKnownClasses.has(character.characterClass) && character.characterClass.trim() !== '';

  const deityLabel =
    is35e
      ? 'Patron Deity'
      : character.edition === '5e'
      ? 'Deity / Patron'
      : 'Deity / Faith';

  const alignmentValidation = useMemo(() => {
    if (!is35e) return { isValid: true, requiredDesc: 'Any', allowedAlignments: [] };
    return validate35eClassAlignment(character.characterClass, character.alignment);
  }, [is35e, character.characterClass, character.alignment]);

  const multiclassXpInfo = useMemo(() => {
    if (!is35e) return null;
    return calculate35eMulticlassXpPenalty(character);
  }, [is35e, character]);

  const handleRaceChange = (newRaceName: string) => {
    const trimmed = (newRaceName || '').trim();
    if (!trimmed) {
      onUpdateCharacter({ ...character, race: '' });
      return;
    }

    const raceItem = findRaceInCompendiumOrSRD(trimmed, character.edition);
    if (raceItem) {
      const updated = applyRaceToCharacter(character, raceItem, {
        applyAbilities: true,
        replaceTraits: true
      });
      onUpdateCharacter(updated);
    } else {
      const updated = applyRaceToCharacter(
        character,
        { name: trimmed, raceData: { name: trimmed } },
        {
          applyAbilities: true,
          replaceTraits: true
        }
      );
      onUpdateCharacter(updated);
    }
  };

  const currentRaceCalculated = useMemo(() => {
    if (!character.race) return null;
    const raceItem = findRaceInCompendiumOrSRD(character.race, character.edition);
    if (!raceItem) return null;
    return calculateRaceBonusesAndDefenses(raceItem, character.level || 1);
  }, [character.race, character.edition, character.level, compendiumVersion]);

  const currentRaceSummary = useMemo(() => {
    if (!currentRaceCalculated) return null;
    const parts: string[] = [];
    if (currentRaceCalculated.abilityBonusSummary.length > 0) {
      parts.push(currentRaceCalculated.abilityBonusSummary.join(', '));
    }
    if (currentRaceCalculated.racialSkillBonuses && currentRaceCalculated.racialSkillBonuses.length > 0) {
      const skSummaries = currentRaceCalculated.racialSkillBonuses.map(b => `${b.bonus >= 0 ? '+' : ''}${b.bonus} ${b.skillName}`);
      parts.push(`Skills: ${skSummaries.join(', ')}`);
    }
    if (currentRaceCalculated.speed && currentRaceCalculated.speed !== 30) {
      parts.push(`${currentRaceCalculated.speed} ft.`);
    }
    if (currentRaceCalculated.naturalArmor.bonus > 0) {
      parts.push(`+${currentRaceCalculated.naturalArmor.bonus} Nat Armor`);
    }
    return parts.join(' • ');
  }, [currentRaceCalculated]);

  // Check if at least one panel on Sheet 1 is visible
  const hasVisibleFeatures = character.edition === 'shadowrun'
    ? (isVisible('sr_stats') || isVisible('sr_skills') || isVisible('s1_workspace'))
    : (
        isVisible('s1_workspace') ||
        isVisible('s1_characterHeader') ||
        isVisible('s1_abilityScores') ||
        (character.edition === '3.5e' && isVisible('s1_savingThrows35e')) ||
        (character.edition === 'cthulhu' && isVisible('s1_sanityMadness')) ||
        isVisible('s1_skills') ||
        isVisible('s1_classFeatures') ||
        isVisible('s1_feats')
      );

  if (!hasVisibleFeatures) {
    return <EmptyLayoutState sheetName="Stats & Features" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Pinned Workspace Customizer Dashboard (Master Mode) */}
      {uiMode === 'master' && isVisible('s1_workspace') && (
        <WorkspaceCustomizer
          character={character}
          onNavigateTab={(tab) => {
            const navEvent = new CustomEvent('penpaper_navigate_tab', { detail: tab });
            window.dispatchEvent(navEvent);
          }}
          onRollDice={(formula) => onRoll(`Workspace Roll ${formula}`, 20, 1, 0, 'normal')}
        />
      )}

      {/* SECTION 1: Character Summary Header */}
      {isVisible('s1_characterHeader') && (
        <>
          <CharacterHeaderSummary
            character={character}
            editingProfile={editingProfile}
            editingAbilities={editingAbilities}
            onUpdateCharacter={onUpdateCharacter}
            setEditingProfile={setEditingProfile}
            setEditingAbilities={setEditingAbilities}
            setShowHybridHeritageModal={setShowHybridHeritageModal}
            setShowTransformationModal={setShowTransformationModal}
            setShowCompanionModal={setShowCompanionModal}
            setShowLevelProgressionModal={setShowLevelProgressionModal}
            onDuplicateCharacter={onDuplicateCharacter}
            onSyncToBaseCharacter={onSyncToBaseCharacter}
          />

          {/* Profile Form toggled via Edit Profile */}
          {editingProfile && (
            <div className="pt-4 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-stone-950/80 p-4 rounded-xl border border-stone-800">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Character Name</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-serif"
                />
              </div>

              {/* Campaign Box & Versioning Fields */}
              <div className="sm:col-span-2 lg:col-span-4 bg-stone-900/90 border border-amber-600/40 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span className="text-sm">🏷️</span> Campaign & Version Box
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Determines active campaign grouping and Base Character synchronization
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-300 mb-1 font-medium">Active Campaign Name</label>
                    <input
                      type="text"
                      value={character.campaignName || ''}
                      onChange={(e) => onUpdateCharacter({ ...character, campaignName: e.target.value || undefined })}
                      placeholder="e.g. Curse of Strahd, Descent into Avernus..."
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-amber-200"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1 font-medium">Version Tag / Branch</label>
                    <input
                      type="text"
                      value={character.versionTag || ''}
                      onChange={(e) => onUpdateCharacter({ ...character, versionTag: e.target.value || undefined })}
                      placeholder="e.g. Session 14, Arc 2, Backup..."
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1 font-medium">Base Character ID</label>
                    <input
                      type="text"
                      value={character.baseCharacterId || ''}
                      onChange={(e) => onUpdateCharacter({ ...character, baseCharacterId: e.target.value || undefined })}
                      placeholder="Leave blank if this is the Base Character"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-300 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-400 font-semibold">{raceLabel}</label>
                  <button
                    type="button"
                    onClick={() => setCustomRaceMode(!customRaceMode)}
                    className="text-[10px] text-stone-400 hover:text-amber-300 transition underline cursor-pointer"
                  >
                    {customRaceMode ? 'Dropdown Menu' : 'Custom Name'}
                  </button>
                </div>
                {customRaceMode ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={character.race}
                      onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                      onBlur={() => handleRaceChange(character.race)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRaceChange(character.race);
                        }
                      }}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                      placeholder={`Enter custom ${raceLabel.toLowerCase()} (press Enter to apply)...`}
                    />
                    <div className="text-[10px] text-stone-400">
                      Press Enter or click away to apply homebrew modifiers.
                    </div>
                  </div>
                ) : (
                  <select
                    value={character.race}
                    onChange={(e) => {
                      const newRace = e.target.value;
                      if (newRace === '__custom__') {
                        setCustomRaceMode(true);
                        return;
                      }
                      handleRaceChange(newRace);
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    {isCustomRace && (
                      <option value={character.race}>{character.race} (Custom / Current)</option>
                    )}
                    {raceDetails.customRaces.length > 0 && (
                      <optgroup label="✨ Custom Homebrew Races & Half-Breeds">
                        {raceDetails.customRaces.map(r => (
                          <option key={r.name} value={r.name}>
                            ✨ {r.name} {r.isTemplate ? '(Half-Breed Template)' : r.isHalfBreed ? '(Half-Breed)' : '(Homebrew)'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {raceDetails.otherCustomRaces.length > 0 && (
                      <optgroup label="🌟 Homebrew Races from Other Systems">
                        {raceDetails.otherCustomRaces.map(r => (
                          <option key={r.name} value={r.name}>
                            🌟 {r.name} ({r.edition || 'Universal'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Core Races (SRD)">
                      {raceDetails.coreRaces.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <option value="__custom__">+ Custom {raceLabel}...</option>
                  </select>
                )}

                {/* Live Racial Modifiers Summary & Re-Apply Badge */}
                {currentRaceSummary && (
                  <div className="mt-1.5 px-2.5 py-1.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-[11px] text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-amber-200">Racial Traits:</strong> {currentRaceSummary}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRaceChange(character.race)}
                      className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 text-amber-100 rounded text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
                      title="Re-apply racial stats & skill bonuses to character sheet"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Reapply</span>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                    <span>Class</span>
                    {is35e && (
                      <button
                        type="button"
                        onClick={() => setShowPrestigeModal(true)}
                        className="text-amber-400 hover:text-amber-300 transition cursor-pointer p-0.5"
                        title={`3.5e Prestige Classes (${unlockedPrestigeNames.size} Unlocked) - Click to open Prestige Class Prerequisites & Switcher`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomClassMode(!customClassMode)}
                    className="text-[10px] text-stone-400 hover:text-amber-300 transition underline cursor-pointer"
                  >
                    {customClassMode ? 'Dropdown Menu' : 'Custom Name'}
                  </button>
                </div>

                {customClassMode ? (
                  <input
                    type="text"
                    value={character.characterClass}
                    onChange={(e) => onUpdateCharacter({ ...character, characterClass: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                    placeholder="Enter custom class name..."
                  />
                ) : (
                  <select
                    value={character.characterClass}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      if (newCls === '__custom__') {
                        setCustomClassMode(true);
                        return;
                      }
                      const updated = {
                        ...character,
                        characterClass: newCls
                      };
                      const synced = syncClassFeaturesForCharacter(
                        updated,
                        newCls,
                        updated.level,
                        updated.edition,
                        character.subclass
                      );
                      onUpdateCharacter(synced);
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    {isCustomClass && (
                      <option value={character.characterClass}>{character.characterClass} (Custom / Current)</option>
                    )}
                    {classDetails.customClasses.length > 0 && (
                      <optgroup label="✨ Custom Homebrew Classes">
                        {classDetails.customClasses.map(c => (
                          <option key={c.name} value={c.name}>
                            ✨ {c.name} (Custom Class)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {classDetails.otherCustomClasses.length > 0 && (
                      <optgroup label="🌟 Homebrew Classes from Other Systems">
                        {classDetails.otherCustomClasses.map(c => (
                          <option key={c.name} value={c.name}>
                            🌟 {c.name} ({c.edition || 'Universal'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {is35e ? (
                      <>
                        <optgroup label="Core Base Classes">
                          {classDetails.coreClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Prestige Classes (D&D 3.5e DMG)">
                          {OFFICIAL_35E_PRESTIGE_CLASSES.map(pc => {
                            const isUnlocked = unlockedPrestigeNames.has(pc.name);
                            return (
                              <option key={pc.name} value={pc.name}>
                                {isUnlocked ? `⭐ ${pc.name} (Unlocked)` : pc.name}
                              </option>
                            );
                          })}
                        </optgroup>
                      </>
                    ) : (
                      <optgroup label="Core Classes">
                        {classDetails.coreClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__custom__">+ Custom Class Name...</option>
                  </select>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-400 font-semibold">{subclassLabel}</label>
                  <button
                    type="button"
                    onClick={() => setCustomSubclassMode(!customSubclassMode)}
                    className="text-[10px] text-stone-400 hover:text-amber-300 transition underline cursor-pointer"
                  >
                    {customSubclassMode ? 'Dropdown Menu' : 'Custom Name'}
                  </button>
                </div>
                {customSubclassMode ? (
                  <input
                    type="text"
                    value={character.subclass || ''}
                    onChange={(e) => {
                      const newSubclass = e.target.value;
                      const synced = syncClassFeaturesForCharacter(
                        character,
                        character.characterClass,
                        character.level,
                        character.edition,
                        newSubclass
                      );
                      onUpdateCharacter(synced);
                    }}
                    placeholder={`Enter custom ${subclassLabel.toLowerCase()}...`}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                ) : (
                  <select
                    value={character.subclass || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setCustomSubclassMode(true);
                        return;
                      }
                      const newSubclass = val === '__none__' ? '' : val;
                      const synced = syncClassFeaturesForCharacter(
                        character,
                        character.characterClass,
                        character.level,
                        character.edition,
                        newSubclass
                      );
                      onUpdateCharacter(synced);
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    <option value="__none__">None / General</option>
                    {isCustomSubclass && (
                      <option value={character.subclass}>{character.subclass} (Custom / Current)</option>
                    )}
                    {availableSubclasses.map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                    <option value="__custom__">+ Custom {subclassLabel}...</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Background</label>
                <input
                  type="text"
                  value={character.background}
                  onChange={(e) => onUpdateCharacter({ ...character, background: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-400 font-semibold">{alignmentLabel}</label>
                  <button
                    type="button"
                    onClick={() => setCustomAlignmentMode(!customAlignmentMode)}
                    className="text-[10px] text-stone-400 hover:text-amber-300 transition underline cursor-pointer"
                  >
                    {customAlignmentMode ? 'Dropdown Menu' : 'Custom Name'}
                  </button>
                </div>
                {customAlignmentMode ? (
                  <input
                    type="text"
                    value={character.alignment}
                    onChange={(e) => onUpdateCharacter({ ...character, alignment: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                    placeholder={`Enter custom ${alignmentLabel.toLowerCase()}...`}
                  />
                ) : (
                  <select
                    value={character.alignment}
                    onChange={(e) => {
                      const newAlign = e.target.value;
                      if (newAlign === '__custom__') {
                        setCustomAlignmentMode(true);
                        return;
                      }
                      onUpdateCharacter({ ...character, alignment: newAlign });
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    {isCustomAlignment && (
                      <option value={character.alignment}>{character.alignment} (Custom / Current)</option>
                    )}
                    {baseAlignments.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="__custom__">+ Custom {alignmentLabel}...</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">{deityLabel}</label>
                <input
                  type="text"
                  value={character.deity || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, deity: e.target.value || undefined })}
                  placeholder={is35e ? 'e.g. Pelor, Moradin, Heironeous...' : 'e.g. The Fiend, Selûne, Corellon...'}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              {/* Special Senses & Vision Ranges */}
              <div className="sm:col-span-2 lg:col-span-4 bg-stone-900/90 border border-stone-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-stone-300 font-semibold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" /> Senses & Vision Ranges
                  </label>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Active: <strong className="text-amber-300">{character.senses || 'Normal Vision'}</strong>
                  </span>
                </div>
                <input
                  type="text"
                  value={character.senses || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, senses: e.target.value })}
                  placeholder="e.g. Darkvision 60 ft., Low-Light Vision, Blindsight 30 ft."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono text-xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold">Quick Presets:</span>
                  {[
                    'Normal Vision',
                    'Darkvision 60 ft.',
                    'Darkvision 120 ft.',
                    'Low-Light Vision',
                    'Low-Light Vision, Darkvision 60 ft.',
                    'Blindsight 30 ft.',
                    'Tremorsense 30 ft.',
                    'Truesight 60 ft.'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateCharacter({ ...character, senses: preset })}
                      className="px-2 py-0.5 bg-stone-800 hover:bg-amber-950 hover:text-amber-200 border border-stone-700 hover:border-amber-600/60 rounded text-[10px] text-stone-300 transition cursor-pointer font-mono"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              {!alignmentValidation.isValid && alignmentValidation.warningMessage && (
                <div className="sm:col-span-2 lg:col-span-4 bg-amber-950/80 border border-amber-500/70 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">
                      3.5e Alignment Restriction Conflict (Required: {alignmentValidation.requiredDesc})
                    </div>
                    <div className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                      {alignmentValidation.warningMessage}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-stone-400 font-semibold">Total XP Points</label>
                  <button
                    type="button"
                    onClick={() => {
                      const isManual = !(character.optionalRules?.disableAutoXpGain || character.optionalRules?.useManualXpMode);
                      onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          disableAutoXpGain: isManual,
                          useManualXpMode: isManual
                        }
                      });
                    }}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                      character.optionalRules?.disableAutoXpGain || character.optionalRules?.useManualXpMode
                        ? 'bg-amber-950 text-amber-300 border-amber-600/60 hover:bg-amber-900'
                        : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                    title={
                      character.optionalRules?.disableAutoXpGain || character.optionalRules?.useManualXpMode
                        ? 'Manual Tabletop EXP: Combat encounters do not auto-increase XP. Click to switch to Auto-XP'
                        : 'Auto-XP Gain Active: Encounter kills auto-grant XP. Click to switch to Manual Tabletop EXP'
                    }
                  >
                    {character.optionalRules?.disableAutoXpGain || character.optionalRules?.useManualXpMode
                      ? '📖 Manual EXP (Off)'
                      : '⚡ Auto-XP (On)'}
                  </button>
                </div>
                <input
                  type="number"
                  value={character.experiencePoints}
                  onChange={(e) => onUpdateCharacter({ ...character, experiencePoints: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-200 font-mono font-bold"
                />
              </div>
              <div className={is35e ? '' : 'lg:col-span-2'}>
                <label className="block text-stone-400 mb-1 font-semibold">Portrait Image URL</label>
                <input
                  type="text"
                  value={character.portraitUrl || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, portraitUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
              {is35e && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-400 font-semibold flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prestige Classes</span>
                    </label>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">
                      {unlockedPrestigeNames.size} Unlocked
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrestigeModal(true)}
                    className="w-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/70 hover:border-purple-500 rounded-lg p-2 text-purple-200 font-semibold flex items-center justify-center gap-2 transition cursor-pointer text-xs h-[38px] shadow"
                    title="Open D&D 3.5e Prestige Class Prerequisites & Switcher"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prereqs & Switcher</span>
                  </button>
                </div>
              )}

              {/* Movement Speeds Configuration */}
              {(() => {
                const racialSpeed = getRacialBaseSpeed(character.race, character.edition);
                const isOverridden = character.speedOverridden || (character.speed !== undefined && character.speed !== racialSpeed.speed);

                const handleResetToRacial = () => {
                  onUpdateCharacter({
                    ...character,
                    speed: racialSpeed.speed,
                    speedFly: racialSpeed.speedFly,
                    speedSwim: racialSpeed.speedSwim,
                    speedClimb: racialSpeed.speedClimb,
                    speedBurrow: racialSpeed.speedBurrow,
                    baseRacialSpeed: racialSpeed.speed,
                    speedOverridden: false
                  });
                };

                return (
                  <div className="sm:col-span-2 lg:col-span-4 bg-stone-900/80 border border-stone-800 p-3 rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                          <Footprints className="w-3.5 h-3.5 text-sky-400" />
                          <span>Movement Speeds (ft / round)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-[10px] font-mono">
                          Racial Base: {racialSpeed.speed} ft ({character.race || 'Standard'})
                        </span>
                        {isOverridden && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-600/40 text-blue-300 text-[10px] font-mono">
                            Manual Override Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleResetToRacial}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 text-[11px] font-medium border border-stone-700 flex items-center gap-1 transition"
                          title={`Reset to default racial base speed (${racialSpeed.speed} ft)`}
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>Reset to Racial ({racialSpeed.speed} ft)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSpeedModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[11px] font-medium border border-amber-600/40 flex items-center gap-1 transition"
                          title="Open detailed movement & tactical mobility inspector"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Mobility Inspector</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] text-stone-400 font-medium mb-1">Walk (Base)</label>
                        <input
                          type="number"
                          value={character.speed ?? racialSpeed.speed}
                          onChange={(e) => {
                            const newSpeed = parseInt(e.target.value) || 0;
                            onUpdateCharacter({
                              ...character,
                              speed: newSpeed,
                              speedOverridden: newSpeed !== racialSpeed.speed,
                              baseRacialSpeed: racialSpeed.speed
                            });
                          }}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-stone-100 font-mono text-center focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-sky-400 font-medium mb-1">Fly Speed</label>
                        <input
                          type="number"
                          value={character.speedFly ?? ''}
                          onChange={(e) => onUpdateCharacter({ ...character, speedFly: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-sky-200 font-mono text-center placeholder-stone-600 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-cyan-400 font-medium mb-1">Swim Speed</label>
                        <input
                          type="number"
                          value={character.speedSwim ?? ''}
                          onChange={(e) => onUpdateCharacter({ ...character, speedSwim: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-cyan-200 font-mono text-center placeholder-stone-600 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-400 font-medium mb-1">Climb Speed</label>
                        <input
                          type="number"
                          value={character.speedClimb ?? ''}
                          onChange={(e) => onUpdateCharacter({ ...character, speedClimb: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-emerald-200 font-mono text-center placeholder-stone-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-amber-400 font-medium mb-1">Burrow Speed</label>
                        <input
                          type="number"
                          value={character.speedBurrow ?? ''}
                          onChange={(e) => onUpdateCharacter({ ...character, speedBurrow: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder="0"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-amber-200 font-mono text-center placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Multiclassing Quick Setup */}
              <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-3 rounded-xl border border-amber-600/30 flex flex-col gap-3 mt-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                    <input
                      type="checkbox"
                      checked={character.optionalRules?.useMulticlassing || false}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          useMulticlassing: e.target.checked
                        }
                      })}
                      className="accent-amber-500 w-4 h-4 rounded"
                    />
                    <span>Enable D&D 5e / 3.5e Multiclassing System</span>
                  </label>

                  {character.optionalRules?.useMulticlassing && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-stone-400 font-semibold">Secondary Class:</span>
                      <select
                        value={character.optionalRules?.secondaryClass || ''}
                        onChange={(e) => {
                          const secClass = e.target.value;
                          const updated: CharacterData = {
                            ...character,
                            optionalRules: {
                              ...character.optionalRules,
                              secondaryClass: secClass
                            }
                          };
                          const synced = syncClassFeaturesForCharacter(
                            updated,
                            updated.characterClass,
                            updated.level,
                            updated.edition,
                            updated.subclass
                          );
                          onUpdateCharacter(synced);
                        }}
                        className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 text-xs font-medium focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">Select Secondary Class...</option>
                        {character.optionalRules?.secondaryClass && !allKnownClasses.has(character.optionalRules.secondaryClass) && (
                          <option value={character.optionalRules.secondaryClass}>{character.optionalRules.secondaryClass} (Custom)</option>
                        )}
                        {is35e ? (
                          <>
                            <optgroup label="Core Base Classes">
                              {baseClasses.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Prestige Classes (D&D 3.5e DMG)">
                              {OFFICIAL_35E_PRESTIGE_CLASSES.map(pc => (
                                <option key={pc.name} value={pc.name}>
                                  {unlockedPrestigeNames.has(pc.name) ? `⭐ ${pc.name} (Unlocked)` : pc.name}
                                </option>
                              ))}
                            </optgroup>
                          </>
                        ) : (
                          baseClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        )}
                      </select>
                      <span className="text-stone-400 font-semibold">
                        Secondary Lvl:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={character.optionalRules?.secondaryLevel || 1}
                        onChange={(e) => {
                          const secLvl = parseInt(e.target.value) || 1;
                          const updated: CharacterData = {
                            ...character,
                            optionalRules: {
                              ...character.optionalRules,
                              secondaryLevel: secLvl
                            }
                          };
                          const synced = syncClassFeaturesForCharacter(
                            updated,
                            updated.characterClass,
                            updated.level,
                            updated.edition,
                            updated.subclass
                          );
                          onUpdateCharacter(synced);
                        }}
                        className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-amber-200 font-mono w-14 font-bold text-center"
                        title="Secondary class level"
                      />
                    </div>
                  )}
                </div>

                {/* 3.5e Multiclass Favored Class & XP Penalty Audit */}
                {is35e && character.optionalRules?.useMulticlassing && multiclassXpInfo && (
                  <div className="w-full pt-2 border-t border-stone-800/80 flex flex-col gap-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-stone-300">
                        Racial Favored Class: <strong className="text-amber-300 font-mono">{multiclassXpInfo.favoredClass}</strong>
                      </span>
                      {multiclassXpInfo.hasPenalty ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600/70 font-bold font-mono text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>-{multiclassXpInfo.penaltyPercent}% Multiclass XP Penalty Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold font-mono text-[11px]">
                          ✓ 0% XP Penalty (Compliant)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {multiclassXpInfo.explanation}
                    </div>
                  </div>
                )}
              </div>

              {/* Gestalt Character Mode (Unearthed Arcana p. 72) - Comprehensive Multi-Track System */}
              {(is35e || character.edition === '5e') && (
                <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-3.5 rounded-xl border border-amber-500/40 flex flex-col gap-3 mt-1 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                      <input
                        type="checkbox"
                        checked={character.optionalRules?.useGestaltUA72 || false}
                        onChange={(e) => {
                          const isGestalt = e.target.checked;
                          const currentTracks = getCharacterGestaltTracks(character);
                          const updated: CharacterData = {
                            ...character,
                            optionalRules: {
                              ...character.optionalRules,
                              useGestaltUA72: isGestalt,
                              gestaltTrackCount: isGestalt ? (character.optionalRules?.gestaltTrackCount || currentTracks.length || 2) : character.optionalRules?.gestaltTrackCount,
                              gestaltTracks: isGestalt ? currentTracks : character.optionalRules?.gestaltTracks
                            }
                          };
                          const synced = syncClassFeaturesForCharacter(
                            updated,
                            updated.characterClass,
                            updated.level,
                            updated.edition,
                            updated.subclass
                          );
                          onUpdateCharacter(synced);
                        }}
                        className="accent-amber-500 w-4 h-4 rounded"
                      />
                      <span className="flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Gestalt Character Mode (Unearthed Arcana p. 72)</span>
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-600/50 font-semibold">
                        Multi-Track Parallel Progression (Up to 4 Simultaneous Classes)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed">
                    Gestalt characters advance two, three, or four simultaneous tracks in parallel at each level. Characters gain the best Hit Die, highest Base Attack Bonus, best saving throws for each category, and highest skill points per level across all active classes.
                  </p>

                  {character.optionalRules?.useGestaltUA72 && (() => {
                    const tracks = getCharacterGestaltTracks(character);
                    const trackCount = character.optionalRules?.gestaltTrackCount || tracks.length || 2;

                    const updateTracks = (newTracks: GestaltTrack[], newCount?: number) => {
                      const updated: CharacterData = {
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          useGestaltUA72: true,
                          gestaltTrackCount: newCount !== undefined ? newCount : newTracks.length,
                          gestaltTracks: newTracks
                        }
                      };
                      const synced = syncClassFeaturesForCharacter(
                        updated,
                        updated.characterClass,
                        updated.level,
                        updated.edition,
                        updated.subclass
                      );
                      onUpdateCharacter(synced);
                    };

                    const handleTrackCountChange = (count: 2 | 3 | 4) => {
                      let nextTracks = [...tracks];
                      if (count > nextTracks.length) {
                        const fallbackClasses = ['Wizard', 'Cleric', 'Rogue', 'Fighter'];
                        for (let i = nextTracks.length; i < count; i++) {
                          const defaultClass = fallbackClasses[i] || 'Fighter';
                          nextTracks.push({
                            id: `track-${i + 1}`,
                            name: `Track ${i + 1}`,
                            classes: [
                              {
                                id: `t${i + 1}-c1`,
                                className: defaultClass,
                                subclass: '',
                                level: character.level,
                                isPaused: false
                              }
                            ]
                          });
                        }
                      } else if (count < nextTracks.length) {
                        nextTracks = nextTracks.slice(0, count);
                      }
                      updateTracks(nextTracks, count);
                    };

                    const handleClassChange = (tIdx: number, cIdx: number, field: keyof GestaltTrackClass, val: any) => {
                      const nextTracks = tracks.map((t, trkI) => {
                        if (trkI !== tIdx) return t;
                        const nextClasses = t.classes.map((c, clsI) => {
                          if (clsI !== cIdx) return c;
                          return { ...c, [field]: val };
                        });
                        return { ...t, classes: nextClasses };
                      });
                      updateTracks(nextTracks);
                    };

                    const handleTogglePause = (tIdx: number, cIdx: number) => {
                      const nextTracks = tracks.map((t, trkI) => {
                        if (trkI !== tIdx) return t;
                        const targetClass = t.classes[cIdx];
                        const willPause = !targetClass.isPaused;
                        const nextClasses = t.classes.map((c, clsI) => {
                          if (clsI === cIdx) {
                            return { ...c, isPaused: willPause };
                          }
                          if (!willPause && clsI !== cIdx) {
                            return { ...c, isPaused: true };
                          }
                          return c;
                        });
                        return { ...t, classes: nextClasses };
                      });
                      updateTracks(nextTracks);
                    };

                    const handleAddClassToTrack = (tIdx: number) => {
                      const nextTracks = tracks.map((t, trkI) => {
                        if (trkI !== tIdx) return t;
                        const pausedExisting = t.classes.map(c => ({ ...c, isPaused: true }));
                        const newClassEntry: GestaltTrackClass = {
                          id: `t${tIdx + 1}-c${t.classes.length + 1}-${Date.now()}`,
                          className: 'Rogue',
                          subclass: '',
                          level: 1,
                          isPaused: false
                        };
                        return { ...t, classes: [...pausedExisting, newClassEntry] };
                      });
                      updateTracks(nextTracks);
                    };

                    const handleRemoveClassFromTrack = (tIdx: number, cIdx: number) => {
                      const nextTracks = tracks.map((t, trkI) => {
                        if (trkI !== tIdx) return t;
                        const remaining = t.classes.filter((_, clsI) => clsI !== cIdx);
                        if (remaining.length > 0 && remaining.every(c => c.isPaused)) {
                          remaining[0].isPaused = false;
                        }
                        return { ...t, classes: remaining };
                      });
                      updateTracks(nextTracks);
                    };

                    const gestaltHd = getGestaltHitDie(character);
                    const gestaltSp = getGestaltBaseSkillPoints(character);
                    const gestaltBab = getCharacterBab(character);
                    const gestaltSaves = calculate35eBaseSaves(character);
                    const multiclassStatus = calculate35eMulticlassXpPenalty(character);

                    return (
                      <div className="space-y-3 pt-2 border-t border-stone-800">
                        {/* Track Count Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                          <span className="text-xs font-bold text-stone-300">
                            Number of Simultaneous Gestalt Tracks:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {([2, 3, 4] as const).map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleTrackCountChange(num)}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                                  trackCount === num
                                    ? 'bg-amber-600 text-stone-950 shadow-sm'
                                    : 'bg-stone-900 text-stone-300 border border-stone-700 hover:border-amber-500/50'
                                }`}
                              >
                                <span>{num} Tracks</span>
                                {trackCount === num && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tracks Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tracks.slice(0, trackCount).map((track, tIdx) => {
                            const totalTrackLevel = track.classes.reduce((sum, c) => sum + (c.level || 0), 0);
                            return (
                              <div key={track.id} className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between border-b border-stone-800/80 pb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-600/50 font-bold">
                                      Track {tIdx + 1}
                                    </span>
                                    <span className="font-semibold text-xs text-stone-200">
                                      {track.classes.find(c => !c.isPaused)?.className || track.classes[0]?.className || 'None'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                    <span className="text-stone-400">Total Lv:</span>
                                    <span className={`font-bold ${totalTrackLevel === character.level ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {totalTrackLevel} / {character.level}
                                    </span>
                                  </div>
                                </div>

                                {/* Classes on this Track */}
                                <div className="space-y-2">
                                  {track.classes.map((cls, cIdx) => (
                                    <div
                                      key={cls.id || cIdx}
                                      className={`p-2 rounded border text-xs flex flex-col gap-1.5 transition ${
                                        cls.isPaused
                                          ? 'bg-stone-900/40 border-stone-800/80 opacity-75'
                                          : 'bg-stone-900/90 border-amber-600/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          <select
                                            value={cls.className}
                                            onChange={(e) => handleClassChange(tIdx, cIdx, 'className', e.target.value)}
                                            className="bg-stone-950 border border-stone-700 rounded px-1.5 py-1 text-xs text-stone-100 font-medium focus:border-amber-500 cursor-pointer flex-1 min-w-[110px]"
                                          >
                                            {is35e ? (
                                              <>
                                                <optgroup label="Base Classes">
                                                  {baseClasses.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                  ))}
                                                </optgroup>
                                                <optgroup label="Prestige Classes">
                                                  {OFFICIAL_35E_PRESTIGE_CLASSES.map(pc => (
                                                    <option key={pc.name} value={pc.name}>
                                                      {unlockedPrestigeNames.has(pc.name) ? `⭐ ${pc.name}` : pc.name}
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              </>
                                            ) : (
                                              baseClasses.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))
                                            )}
                                          </select>

                                          <input
                                            type="text"
                                            value={cls.subclass || ''}
                                            onChange={(e) => handleClassChange(tIdx, cIdx, 'subclass', e.target.value)}
                                            placeholder="Subclass..."
                                            className="bg-stone-950 border border-stone-700 rounded px-1.5 py-1 text-xs text-stone-200 w-24"
                                            title="Subclass or archetype"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-stone-400 font-mono">Lv</span>
                                          <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={cls.level}
                                            onChange={(e) => handleClassChange(tIdx, cIdx, 'level', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="bg-stone-950 border border-stone-700 rounded px-1 py-0.5 text-amber-200 font-mono w-11 font-bold text-center text-xs"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/60">
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePause(tIdx, cIdx)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                                            cls.isPaused
                                              ? 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700'
                                              : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                          }`}
                                          title={cls.isPaused ? 'Click to make this class active on this track' : 'Click to pause this class progression on this track'}
                                        >
                                          {cls.isPaused ? (
                                            <>
                                              <Pause className="w-2.5 h-2.5 text-amber-400" />
                                              <span>Paused</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-2.5 h-2.5 text-emerald-400" />
                                              <span>Active Class</span>
                                            </>
                                          )}
                                        </button>

                                        {track.classes.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveClassFromTrack(tIdx, cIdx)}
                                            className="text-stone-500 hover:text-rose-400 p-0.5 transition"
                                            title="Remove this multiclass from track"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddClassToTrack(tIdx)}
                                  className="w-full mt-1 py-1 px-2 rounded border border-dashed border-stone-700 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                                >
                                  <Plus className="w-3 h-3 text-amber-400" />
                                  <span>Multiclass Track {tIdx + 1} (Pause & Branch)</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Gestalt Live Calculated Progression Metrics */}
                        <div className="bg-stone-950 p-3 rounded-lg border border-amber-600/40 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                            <span className="text-amber-300 font-semibold font-serif flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Gestalt Best-of-Class Calculations (Lv. {character.level})</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-mono text-[10px]">
                              ✓ Gestalt Tracks Advance Simultaneously
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[11px]">
                            <div className="bg-stone-900/90 p-1.5 rounded border border-stone-800">
                              <div className="text-stone-400 text-[10px]">Gestalt Hit Die</div>
                              <div className="text-amber-300 font-bold">{gestaltHd}</div>
                            </div>
                            <div className="bg-stone-900/90 p-1.5 rounded border border-stone-800">
                              <div className="text-stone-400 text-[10px]">Base Attack Bonus</div>
                              <div className="text-amber-300 font-bold" title={`Iterative attacks: ${format35eBabProgression(gestaltBab)}`}>
                                {gestaltBab > 5 ? format35eBabProgression(gestaltBab) : `+${gestaltBab}`}
                              </div>
                            </div>
                            <div className="bg-stone-900/90 p-1.5 rounded border border-stone-800">
                              <div className="text-stone-400 text-[10px]">Base Saves</div>
                              <div className="text-amber-300 font-bold">
                                F+{gestaltSaves.fort} / R+{gestaltSaves.ref} / W+{gestaltSaves.will}
                              </div>
                            </div>
                            <div className="bg-stone-900/90 p-1.5 rounded border border-stone-800">
                              <div className="text-stone-400 text-[10px]">Base Skill Points</div>
                              <div className="text-amber-300 font-bold">{gestaltSp} + INT / lvl</div>
                            </div>
                          </div>

                          <div className="text-[11px] text-stone-400 border-t border-stone-800/80 pt-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="flex-1">
                                Per Unearthed Arcana p. 72, Gestalt characters combine the best attributes of their simultaneous classes: highest Hit Die, highest BAB progression, best base saving throw for each category, highest skill points per level, and merged class skill lists.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedWithSkills = apply35eDefaultClassSkills(character);
                                  const synced = syncClassFeaturesForCharacter(
                                    updatedWithSkills,
                                    updatedWithSkills.characterClass,
                                    updatedWithSkills.level,
                                    updatedWithSkills.edition,
                                    updatedWithSkills.subclass
                                  );
                                  onUpdateCharacter(synced);
                                }}
                                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-600/50 hover:border-amber-400 rounded text-xs font-mono flex items-center gap-1.5 transition shrink-0"
                                title="Re-synchronize all class features and combined class skill lists across all Gestalt tracks"
                              >
                                <RefreshCw className="w-3 h-3 text-amber-400" />
                                <span>Sync Features & Skills</span>
                              </button>
                            </div>
                            <p className="text-stone-300 font-medium">
                              {multiclassStatus?.hasPenalty ? (
                                <span className="text-rose-400">
                                  ⚠️ Note: One of your Gestalt tracks contains paused/multiclassed classes with an active -{multiclassStatus.penaltyPercent}% multiclass XP penalty.
                                </span>
                              ) : (
                                <span className="text-emerald-400">
                                  ✓ Standard Gestalt parallel progression is exempt from multiclass XP penalties. Pausing a class on a track to advance another adheres to standard 3.5e multiclass rules.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SECTION 2: Ability Scores, Saving Throws, Sanity & System Suites */}
      {character.edition === 'shadowrun' ? (
        <div className="space-y-6">
          {isVisible('sr_stats') && (
            <ShadowrunStatsPanel
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
            />
          )}
          {isVisible('sr_skills') && (
            <ShadowrunSkillsPanel
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
            />
          )}
        </div>
      ) : character.edition === 'pathfinder' ? (
        <div className="space-y-6">
          <PathfinderTacticalPanel
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onRoll={onRoll}
          />
          {(isVisible('s1_abilityScores')) && (
            <AbilityScoresPanel
              character={character}
              editingAbilities={editingAbilities}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
            />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 xl:col-span-5">
              <SkillsPanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            </div>
            <div className="lg:col-span-6 xl:col-span-7 space-y-6">
              <ClassFeaturesPanel
                character={character}
                isDmRole={isDmRole}
                onUpdateCharacter={onUpdateCharacter}
                onOpenShapeshift={() => setShowTransformationModal(true)}
                onOpenSummonCompanion={() => setShowCompanionModal(true)}
              />
              <FeatsPanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                onOpenShapeshift={() => setShowTransformationModal(true)}
                onOpenSummonCompanion={() => setShowCompanionModal(true)}
              />
            </div>
          </div>
        </div>
      ) : character.edition === 'cthulhu' ? (
        <div className="space-y-6">
          <CthulhuInvestigatorPanel
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onRoll={onRoll}
          />
        </div>
      ) : (
        <>
          {(isVisible('s1_abilityScores') || (character.edition === '3.5e' && isVisible('s1_savingThrows35e'))) && (
            <div className="space-y-4">
              {isVisible('s1_abilityScores') && (
                <AbilityScoresPanel
                  character={character}
                  editingAbilities={editingAbilities}
                  onUpdateCharacter={onUpdateCharacter}
                  onRoll={onRoll}
                />
              )}

              {character.edition === '3.5e' && isVisible('s1_savingThrows35e') && (
                <SavingThrows35ePanel
                  character={character}
                  onUpdateCharacter={onUpdateCharacter}
                  onRoll={onRoll}
                />
              )}
            </div>
          )}

          {/* SECTION 3: Skills & Features Grid */}
          {(isVisible('s1_skills') || isVisible('s1_classFeatures') || isVisible('s1_feats')) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: D&D Skills List (5e vs 3.5e) */}
              {isVisible('s1_skills') && (
                <div className={isVisible('s1_classFeatures') || isVisible('s1_feats') ? "lg:col-span-6 xl:col-span-5" : "lg:col-span-12"}>
                  <SkillsPanel
                    character={character}
                    onUpdateCharacter={onUpdateCharacter}
                    onRoll={onRoll}
                  />
                </div>
              )}

              {/* Right Column: Class Features & Feats */}
              {(isVisible('s1_classFeatures') || isVisible('s1_feats')) && (
                <div className={isVisible('s1_skills') ? "lg:col-span-6 xl:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                  {isVisible('s1_classFeatures') && (
                    <ClassFeaturesPanel
                      character={character}
                      isDmRole={isDmRole}
                      onUpdateCharacter={onUpdateCharacter}
                      onOpenShapeshift={() => setShowTransformationModal(true)}
                      onOpenSummonCompanion={() => setShowCompanionModal(true)}
                      onOpenTurnUndead={() => setShowTurnUndeadModal(true)}
                      onOpenPrestigeValidator={() => setShowPrestigeModal(true)}
                    />
                  )}

                  {isVisible('s1_feats') && (
                    <FeatsPanel
                      character={character}
                      onUpdateCharacter={onUpdateCharacter}
                      onOpenShapeshift={() => setShowTransformationModal(true)}
                      onOpenSummonCompanion={() => setShowCompanionModal(true)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      {showLevelProgressionModal && (
        <LevelProgressionModal
          character={character}
          onUpdateCharacter={(updated) => {
            const recomputed = recalculateCharacterAC(updated);
            onUpdateCharacter(recomputed);
          }}
          onClose={() => setShowLevelProgressionModal(false)}
        />
      )}

      {showTransformationModal && (
        <TransformationModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowTransformationModal(false)}
        />
      )}

      {showCompanionModal && (
        <CompanionModal
          isOpen={true}
          character={character}
          edition={character.edition}
          onUpdateCharacter={onUpdateCharacter}
          onAddMonsterToRoster={onAddMonsterToRoster}
          onClose={() => setShowCompanionModal(false)}
          onRoll={onRoll}
        />
      )}

      {showHybridHeritageModal && (
        <HybridHeritageModal
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowHybridHeritageModal(false)}
        />
      )}

      {showTurnUndeadModal && (
        <TurnUndead35eModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowTurnUndeadModal(false)}
          onRoll={onRoll}
        />
      )}

      {showPrestigeModal && (
        <PrestigeClassValidatorModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowPrestigeModal(false)}
        />
      )}

      {/* Movement Speeds & Tactical Mobility Modal */}
      {showSpeedModal && (
        <EditMovementSpeedModal
          character={character}
          isOpen={showSpeedModal}
          onClose={() => setShowSpeedModal(false)}
          onSave={onUpdateCharacter}
        />
      )}
    </div>
  );
};
