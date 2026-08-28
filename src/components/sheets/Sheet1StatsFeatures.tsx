import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { GameSession } from '../../lib/firebase';
import { ShadowrunStatsPanel } from '../shadowrun/ShadowrunStatsPanel';
import { ShadowrunSkillsPanel } from '../shadowrun/ShadowrunSkillsPanel';
import { LevelProgressionModal } from '../modals/LevelProgressionModal';
import { TransformationModal } from '../modals/TransformationModal';
import { CompanionModal } from '../modals/CompanionModal';
import { HybridHeritageModal } from '../modals/HybridHeritageModal';
import { recalculateCharacterAC } from '../../utils/dndCalculations';

import { CharacterHeaderSummary } from './sheet1/CharacterHeaderSummary';
import { WorkspaceCustomizer } from '../common/WorkspaceCustomizer';
import { AbilityScoresPanel } from './sheet1/AbilityScoresPanel';
import { SavingThrows35ePanel } from './sheet1/SavingThrows35ePanel';
import { SanityMadnessPanel } from './sheet1/SanityMadnessPanel';
import { SkillsPanel } from './sheet1/SkillsPanel';
import { ClassFeaturesPanel } from './sheet1/ClassFeaturesPanel';
import { FeatsPanel } from './sheet1/FeatsPanel';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { EmptyLayoutState } from '../common/EmptyLayoutState';

interface Sheet1Props {
  character: CharacterData;
  currentUser?: { role?: string; displayName?: string } | null;
  activeSession?: GameSession | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const Sheet1StatsFeatures: React.FC<Sheet1Props> = ({
  character,
  currentUser,
  activeSession,
  onUpdateCharacter,
  onAddMonsterToRoster,
  onRoll
}) => {
  const [editingAbilities, setEditingAbilities] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLevelProgressionModal, setShowLevelProgressionModal] = useState(false);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showHybridHeritageModal, setShowHybridHeritageModal] = useState(false);

  const { isVisible } = useLayoutCustomization();
  const isDmRole = currentUser?.role === 'DM';

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
      {/* Pinned Workspace Customizer Dashboard */}
      {isVisible('s1_workspace') && (
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
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Race / Species</label>
                <input
                  type="text"
                  value={character.race}
                  onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Class</label>
                <input
                  type="text"
                  value={character.characterClass}
                  onChange={(e) => onUpdateCharacter({ ...character, characterClass: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Subclass / Archetype</label>
                <input
                  type="text"
                  value={character.subclass || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, subclass: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
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
                <label className="block text-stone-400 mb-1 font-semibold">Alignment</label>
                <input
                  type="text"
                  value={character.alignment}
                  onChange={(e) => onUpdateCharacter({ ...character, alignment: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
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
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Portrait Image URL</label>
                <input
                  type="text"
                  value={character.portraitUrl || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, portraitUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              {/* Multiclassing Quick Setup */}
              <div className="sm:col-span-2 lg:col-span-4 bg-stone-900 p-3 rounded-xl border border-amber-600/30 flex flex-wrap items-center justify-between gap-3 mt-1">
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
                    <input
                      type="text"
                      value={character.optionalRules?.secondaryClass || ''}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          secondaryClass: e.target.value
                        }
                      })}
                      placeholder="e.g. Fighter"
                      className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-stone-100 w-28"
                    />
                    <span className="text-stone-400 font-semibold">Secondary Lvl:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={character.optionalRules?.secondaryLevel || 1}
                      onChange={(e) => onUpdateCharacter({
                        ...character,
                        optionalRules: {
                          ...character.optionalRules,
                          secondaryLevel: parseInt(e.target.value) || 1
                        }
                      })}
                      className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-amber-200 font-mono w-14 font-bold text-center"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* SECTION 2: Ability Scores, Saving Throws, Sanity */}
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

          {character.edition === 'cthulhu' && isVisible('s1_sanityMadness') && (
            <SanityMadnessPanel
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
            />
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
    </div>
  );
};
