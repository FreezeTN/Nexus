import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { GameSession } from '../../lib/firebase';
import { ShadowrunStatsPanel } from '../shadowrun/ShadowrunStatsPanel';
import { ShadowrunSkillsPanel } from '../shadowrun/ShadowrunSkillsPanel';
import { LevelProgressionModal } from '../modals/LevelProgressionModal';
import { TransformationModal } from '../modals/TransformationModal';
import { HybridHeritageModal } from '../modals/HybridHeritageModal';
import { recalculateCharacterAC } from '../../utils/dndCalculations';

import { CharacterHeaderSummary } from './sheet1/CharacterHeaderSummary';
import { AbilityScoresPanel } from './sheet1/AbilityScoresPanel';
import { SavingThrows35ePanel } from './sheet1/SavingThrows35ePanel';
import { SanityMadnessPanel } from './sheet1/SanityMadnessPanel';
import { SkillsPanel } from './sheet1/SkillsPanel';
import { ClassFeaturesPanel } from './sheet1/ClassFeaturesPanel';
import { FeatsPanel } from './sheet1/FeatsPanel';

interface Sheet1Props {
  character: CharacterData;
  currentUser?: { role?: string; displayName?: string } | null;
  activeSession?: GameSession | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const Sheet1StatsFeatures: React.FC<Sheet1Props> = ({
  character,
  currentUser,
  activeSession,
  onUpdateCharacter,
  onRoll
}) => {
  const [editingAbilities, setEditingAbilities] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showLevelProgressionModal, setShowLevelProgressionModal] = useState(false);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showHybridHeritageModal, setShowHybridHeritageModal] = useState(false);

  const isDmRole = currentUser?.role === 'DM';

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Character Summary Header */}
      <CharacterHeaderSummary
        character={character}
        editingProfile={editingProfile}
        editingAbilities={editingAbilities}
        onUpdateCharacter={onUpdateCharacter}
        setEditingProfile={setEditingProfile}
        setEditingAbilities={setEditingAbilities}
        setShowHybridHeritageModal={setShowHybridHeritageModal}
        setShowTransformationModal={setShowTransformationModal}
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
            <label className="block text-stone-400 mb-1 font-semibold">Total XP Points</label>
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

      {/* SECTION 2: Ability Scores, Saving Throws, Sanity */}
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
            <AbilityScoresPanel
              character={character}
              editingAbilities={editingAbilities}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
            />

            {character.edition === '3.5e' && (
              <SavingThrows35ePanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            )}
          </div>

          {character.edition === 'cthulhu' && (
            <SanityMadnessPanel
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onRoll={onRoll}
            />
          )}

          {/* SECTION 3: Skills & Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols): D&D Skills List (5e vs 3.5e) */}
            <div className="lg:col-span-5">
              <SkillsPanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                onRoll={onRoll}
              />
            </div>

            {/* Right Column (7 cols): Class Features & Feats */}
            <div className="lg:col-span-7 space-y-6">
              <ClassFeaturesPanel
                character={character}
                isDmRole={isDmRole}
                onUpdateCharacter={onUpdateCharacter}
              />

              <FeatsPanel
                character={character}
                onUpdateCharacter={onUpdateCharacter}
              />
            </div>
          </div>
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
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowTransformationModal(false)}
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
