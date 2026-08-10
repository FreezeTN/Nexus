import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { ShadowrunSpellsComplexForms } from '../shadowrun/ShadowrunSpellsComplexForms';
import { SpellcastingStatsPanel } from './sheet4/SpellcastingStatsPanel';
import { SpellbookListPanel } from './sheet4/SpellbookListPanel';
import { SpellTargetModal } from '../modals/SpellTargetModal';
import { TransformationModal } from '../modals/TransformationModal';
import { CompanionModal } from '../modals/CompanionModal';

interface Sheet4Props {
  character: CharacterData;
  allCharacters?: CharacterData[];
  currentUser?: { role?: string; displayName?: string } | null;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
}

export const Sheet4Spells: React.FC<Sheet4Props> = ({
  character,
  allCharacters = [],
  currentUser,
  onUpdateCharacter,
  onAddMonsterToRoster,
  onRoll,
  onRollDamage
}) => {
  const [targetModalSpell, setTargetModalSpell] = useState<any | null>(null);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);

  const handleConfirmCastSpellTarget = (spellToCast: any, selectedTargetIds: string[], condName: string) => {
    const updatedSlots = spellToCast.level > 0
      ? character.spellSlots.map(s => s.level === spellToCast.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
      : character.spellSlots;

    const availableTargets = allCharacters.length > 0 ? allCharacters : [character];
    const targetList = availableTargets.filter(c => selectedTargetIds.includes(c.id));
    const targetNamesStr = targetList.map(c => c.name).join(', ') || character.name;

    targetList.forEach(target => {
      const currentConds = target.conditions || [];
      const updatedConds = currentConds.includes(condName) ? currentConds : [...currentConds, condName];

      onUpdateCharacter({
        ...target,
        ...(target.id === character.id ? { spellSlots: updatedSlots } : {}),
        conditions: updatedConds
      });
    });

    if (targetList.length === 0) {
      onUpdateCharacter({
        ...character,
        spellSlots: updatedSlots
      });
    }

    if (spellToCast.damage) {
      onRollDamage(`✨ Cast ${spellToCast.name} on ${targetNamesStr} (Damage: ${spellToCast.damage}) - Applied '${condName}'!`, spellToCast.damage);
    } else {
      onRollDamage(`✨ Cast ${spellToCast.name} on ${targetNamesStr} - Applied '${condName}' status!`, '1d20');
    }

    setTargetModalSpell(null);
  };

  if (character.edition === 'shadowrun') {
    return (
      <ShadowrunSpellsComplexForms
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollPool={(label, pool) => onRoll(label, 6, pool, 0, 'normal')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Spellcasting Stats & Slot Tracker */}
      <SpellcastingStatsPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* SECTION 2: Spellbook List & Spell Casting */}
      <SpellbookListPanel
        character={character}
        allCharacters={allCharacters}
        onUpdateCharacter={onUpdateCharacter}
        onRoll={onRoll}
        onRollDamage={onRollDamage}
        setTargetModalSpell={setTargetModalSpell}
        onOpenShapeshift={() => setShowTransformationModal(true)}
        onOpenSummonCompanion={() => setShowCompanionModal(true)}
      />

      {/* Target & Status Effect Modal */}
      {targetModalSpell && (
        <SpellTargetModal
          spell={targetModalSpell}
          caster={character}
          allCharacters={allCharacters.length > 0 ? allCharacters : [character]}
          onConfirmCast={(spell, targetIds, conditionName) => handleConfirmCastSpellTarget(spell, targetIds, conditionName)}
          onClose={() => setTargetModalSpell(null)}
        />
      )}

      {/* Shapeshift Engine Modal */}
      {showTransformationModal && (
        <TransformationModal
          isOpen={true}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowTransformationModal(false)}
        />
      )}

      {/* Companion Summon Engine Modal */}
      {showCompanionModal && (
        <CompanionModal
          isOpen={true}
          character={character}
          edition={character.edition}
          onUpdateCharacter={onUpdateCharacter}
          onAddMonsterToRoster={onAddMonsterToRoster}
          onClose={() => setShowCompanionModal(false)}
          onRoll={onRoll}
          onRollDamage={onRollDamage}
        />
      )}
    </div>
  );
};
