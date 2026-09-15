import React, { useState, useMemo } from 'react';
import { CharacterData } from '../../types';
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
  calculate35eMulticlassXpPenalty
} from '../../utils/dndCalculations';
import {
  getClassesForSystem,
  getRacesForSystem,
  getSubclassesForSystemClass,
  getAlignmentsForSystem
} from '../modals/newCharacter/newCharacterData';
import { syncClassFeaturesForCharacter } from '../../data/srdRulesLibrary';
import { Crown, AlertTriangle, Eye } from 'lucide-react';

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

  const { isVisible } = useLayoutCustomization();
  const { uiMode } = useUiMode();
  const isDmRole = currentUser?.role === 'DM';

  const is35e = character.edition === '3.5e';
  const baseClasses = useMemo(() => getClassesForSystem(character.edition), [character.edition]);
  const baseRaces = useMemo(() => getRacesForSystem(character.edition), [character.edition]);
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
                  <input
                    type="text"
                    value={character.race}
                    onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                    placeholder={`Enter custom ${raceLabel.toLowerCase()}...`}
                  />
                ) : (
                  <select
                    value={character.race}
                    onChange={(e) => {
                      const newRace = e.target.value;
                      if (newRace === '__custom__') {
                        setCustomRaceMode(true);
                        return;
                      }
                      onUpdateCharacter({ ...character, race: newRace });
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
                  >
                    {isCustomRace && (
                      <option value={character.race}>{character.race} (Custom / Current)</option>
                    )}
                    {baseRaces.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="__custom__">+ Custom {raceLabel}...</option>
                  </select>
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
                    {is35e ? (
                      <>
                        <optgroup label="Core Base Classes">
                          {baseClasses.map(c => (
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
                      baseClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
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
              <div className="sm:col-span-2 lg:col-span-4 bg-stone-900/80 border border-stone-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-300 text-xs flex items-center gap-1.5">
                    <span>🏃</span> Movement Speeds (ft / round)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Tactical speeds for ground, aerial, aquatic, climbing, and subterranean travel
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] text-stone-400 font-medium mb-1">Walk (Base)</label>
                    <input
                      type="number"
                      value={character.speed ?? 30}
                      onChange={(e) => onUpdateCharacter({ ...character, speed: parseInt(e.target.value) || 0 })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-stone-100 font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-sky-400 font-medium mb-1">Fly Speed</label>
                    <input
                      type="number"
                      value={character.speedFly ?? ''}
                      onChange={(e) => onUpdateCharacter({ ...character, speedFly: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-sky-200 font-mono text-center placeholder-stone-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-cyan-400 font-medium mb-1">Swim Speed</label>
                    <input
                      type="number"
                      value={character.speedSwim ?? ''}
                      onChange={(e) => onUpdateCharacter({ ...character, speedSwim: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-cyan-200 font-mono text-center placeholder-stone-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-400 font-medium mb-1">Climb Speed</label>
                    <input
                      type="number"
                      value={character.speedClimb ?? ''}
                      onChange={(e) => onUpdateCharacter({ ...character, speedClimb: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-emerald-200 font-mono text-center placeholder-stone-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-400 font-medium mb-1">Burrow Speed</label>
                    <input
                      type="number"
                      value={character.speedBurrow ?? ''}
                      onChange={(e) => onUpdateCharacter({ ...character, speedBurrow: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="0"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-amber-200 font-mono text-center placeholder-stone-600"
                    />
                  </div>
                </div>
              </div>

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
                      <span className="text-stone-400 font-semibold">Secondary Lvl:</span>
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
            <div className="lg:col-span-5">
              <SkillsPanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            </div>
            <div className="lg:col-span-7 space-y-6">
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
              {/* Left Column (5 cols): D&D Skills List (5e vs 3.5e) */}
              {isVisible('s1_skills') && (
                <div className={isVisible('s1_classFeatures') || isVisible('s1_feats') ? "lg:col-span-5" : "lg:col-span-12"}>
                  <SkillsPanel
                    character={character}
                    onUpdateCharacter={onUpdateCharacter}
                    onRoll={onRoll}
                  />
                </div>
              )}

              {/* Right Column (7 cols): Class Features & Feats */}
              {(isVisible('s1_classFeatures') || isVisible('s1_feats')) && (
                <div className={isVisible('s1_skills') ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
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
    </div>
  );
};
