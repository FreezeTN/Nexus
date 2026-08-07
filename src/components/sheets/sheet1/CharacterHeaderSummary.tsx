import React, { useState } from 'react';
import { CharacterData } from '../../../types';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../../data/monsterPortraits';
import { syncClassFeaturesForCharacter } from '../../../data/srdRulesLibrary';
import {
  getCombinedLevel,
  getActiveClassChoice,
  getPrimaryXp,
  getSecondaryXp,
  getUnallocatedXp
} from '../../../utils/dndCalculations';
import {
  Skull,
  Store,
  Dna,
  Star,
  TrendingUp,
  Edit2
} from 'lucide-react';

interface CharacterHeaderSummaryProps {
  character: CharacterData;
  editingProfile: boolean;
  editingAbilities: boolean;
  onUpdateCharacter: (updated: CharacterData) => void;
  setEditingProfile: (val: boolean) => void;
  setEditingAbilities: (val: boolean) => void;
  setShowHybridHeritageModal: (val: boolean) => void;
  setShowTransformationModal: (val: boolean) => void;
  setShowLevelProgressionModal: (val: boolean) => void;
}

export const CharacterHeaderSummary: React.FC<CharacterHeaderSummaryProps> = ({
  character,
  editingProfile,
  editingAbilities,
  onUpdateCharacter,
  setEditingProfile,
  setEditingAbilities,
  setShowHybridHeritageModal,
  setShowTransformationModal,
  setShowLevelProgressionModal
}) => {
  return (
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
                  const img = e.target as HTMLImageElement;
                  img.onerror = null;
                  img.src = generateMonsterSvgPortrait(character?.name);
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
              <div className="flex items-center gap-1.5 bg-amber-950 border border-amber-600/50 px-3 py-1.5 rounded-2xl text-xs text-amber-300 font-sans font-bold flex-wrap shadow-md">
                {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass ? (
                  <span className="font-mono font-extrabold text-amber-200 bg-amber-900/80 px-2 py-0.5 rounded-lg border border-amber-400/50">
                    Comb. Lvl {getCombinedLevel(character)}
                  </span>
                ) : (
                  <span>Level</span>
                )}

                {/* Primary Class Controls */}
                <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-0.5 rounded-xl border border-stone-800">
                  <span className="text-[11px] text-stone-300 font-serif font-bold">
                    {character.characterClass}:
                  </span>
                  <button
                    onClick={() => {
                      const newLvl = Math.max(1, character.level - 1);
                      onUpdateCharacter(syncClassFeaturesForCharacter({ ...character, level: newLvl }, character.characterClass, newLvl, character.edition));
                    }}
                    className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                    title="Decrease Primary Level"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm px-0.5 text-amber-100">{character.level}</span>
                  <button
                    onClick={() => {
                      const newLvl = character.level + 1;
                      onUpdateCharacter(syncClassFeaturesForCharacter({ ...character, level: newLvl }, character.characterClass, newLvl, character.edition));
                    }}
                    className="w-4 h-4 rounded bg-amber-900 hover:bg-amber-800 text-amber-100 flex items-center justify-center font-mono text-[11px] font-extrabold transition"
                    title="Increase Primary Level"
                  >
                    +
                  </button>
                </div>

                {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass && (
                  <>
                    {/* Secondary Class Controls */}
                    <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-0.5 rounded-xl border border-stone-800">
                      <span className="text-[11px] text-stone-300 font-serif font-bold">
                        {character.optionalRules.secondaryClass}:
                      </span>
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
                      <span className="font-mono text-sm px-0.5 text-amber-100">{character.optionalRules.secondaryLevel || 1}</span>
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

                    {/* Active Class Switcher */}
                    <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-amber-500/40 ml-1">
                      <span className="text-[10px] text-stone-400 font-mono font-bold px-1">Active:</span>
                      <button
                        onClick={() => onUpdateCharacter({
                          ...character,
                          optionalRules: {
                            ...character.optionalRules,
                            activeClassChoice: 'primary'
                          }
                        })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition font-mono ${
                          getActiveClassChoice(character) === 'primary'
                            ? 'bg-amber-500 text-stone-950 shadow font-extrabold'
                            : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                        }`}
                        title="Set Primary Class as Active (earns XP & levels up)"
                      >
                        {character.characterClass} {getActiveClassChoice(character) === 'primary' ? '★ Active' : '⏸ Paused'}
                      </button>
                      <button
                        onClick={() => onUpdateCharacter({
                          ...character,
                          optionalRules: {
                            ...character.optionalRules,
                            activeClassChoice: 'secondary'
                          }
                        })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition font-mono ${
                          getActiveClassChoice(character) === 'secondary'
                            ? 'bg-amber-500 text-stone-950 shadow font-extrabold'
                            : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                        }`}
                        title="Set Secondary Class as Active (earns XP & levels up)"
                      >
                        {character.optionalRules.secondaryClass} {getActiveClassChoice(character) === 'secondary' ? '★ Active' : '⏸ Paused'}
                      </button>
                    </div>
                  </>
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

            <div className="text-xs text-stone-400 mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>
                <strong>Race:</strong> {character.race}
                <button
                  onClick={() => setShowHybridHeritageModal(true)}
                  className="ml-1.5 inline-flex items-center gap-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full cursor-pointer transition shadow-sm"
                  title="Click to configure Half-Breed Dual Ancestry & Heritage"
                >
                  <Dna className="w-3 h-3 text-amber-400" />
                  <span>
                    {(character.hybridHeritage?.enabled || character.optionalRules?.useHalfBreedSystem || character.optionalRules?.useClassicSRDHalfBreed)
                      ? (character.hybridHeritage?.isClassicSRD || character.optionalRules?.useClassicSRDHalfBreed)
                        ? `Half-Breed (${character.race})`
                        : `Half-Breed (${character.hybridHeritage?.primaryParent || 'Parent 1'} / ${character.hybridHeritage?.secondaryParent || 'Parent 2'})`
                      : 'Configure Half-Breed Ancestry'}
                  </span>
                </button>
              </span>
              <span>
                <strong>Class:</strong> {character.characterClass} ({character.subclass || 'None'})
                {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass && (
                  <span className="text-amber-300 font-semibold ml-1.5 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                    <span>/ {character.optionalRules.secondaryClass}</span>
                    {character.optionalRules.secondarySubclass && (
                      <span>({character.optionalRules.secondarySubclass})</span>
                    )}
                    <span className="font-mono text-amber-200">Lvl {character.optionalRules.secondaryLevel || 1}</span>
                    <span className="font-mono font-extrabold text-amber-400 text-[10px]">
                      (Comb. Lvl {getCombinedLevel(character)})
                    </span>
                  </span>
                )}
              </span>
              <span><strong>Background:</strong> {character.background}</span>
              <span><strong>Alignment:</strong> {character.alignment}</span>

              {character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass ? (
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full mt-1 pt-2 border-t border-stone-800/80">
                  <span className="text-stone-300 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-lg">
                    General XP Pool: <strong className="text-amber-300">{character.experiencePoints.toLocaleString()} XP</strong>
                  </span>
                  <span className="text-stone-300 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-lg">
                    {character.characterClass}: <strong className="text-stone-200">{getPrimaryXp(character).toLocaleString()} XP</strong>
                  </span>
                  <span className="text-stone-300 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-lg">
                    {character.optionalRules.secondaryClass}: <strong className="text-stone-200">{getSecondaryXp(character).toLocaleString()} XP</strong>
                  </span>
                  {getUnallocatedXp(character) > 0 && (
                    <button
                      onClick={() => setShowLevelProgressionModal(true)}
                      className="text-amber-200 font-bold bg-amber-900/90 border border-amber-500/80 px-2.5 py-1 rounded-lg hover:bg-amber-800 transition flex items-center gap-1.5 animate-pulse shadow-sm"
                      title="Click to allocate general XP to your classes"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>{getUnallocatedXp(character).toLocaleString()} Unallocated XP (Spend)</span>
                    </button>
                  )}
                </div>
              ) : (
                <span><strong>XP:</strong> {character.experiencePoints.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowTransformationModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-500/60 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          title="Open Transformation Engine (Wild Shape, Polymorph, Lycanthropy, Natural Weapons)"
        >
          <span>🐾</span>
          <span>{character.activeTransformation ? `Form: ${character.activeTransformation.form.name}` : 'Transformation Engine'}</span>
        </button>
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
  );
};
