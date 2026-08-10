import React, { useState } from 'react';
import { CharacterData, Party } from '../../types';
import { UserProfile } from '../../lib/firebase';
import { ShadowrunCombatPanel } from '../shadowrun/ShadowrunCombatPanel';
import { RestModal } from '../combat/RestModal';
import { EncounterTracker } from '../combat/EncounterTracker';
import { MaxHpInspectorModal } from '../modals/MaxHpInspectorModal';
import { SpellTargetModal } from '../modals/SpellTargetModal';
import { TransformationModal } from '../modals/TransformationModal';
import { CompanionModal } from '../modals/CompanionModal';

import { CombatDefensesPanel } from './sheet2/CombatDefensesPanel';
import { AttacksSpellsPanel } from './sheet2/AttacksSpellsPanel';

interface Sheet2Props {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  currentUser?: UserProfile | null;
  onOpenPartyManager?: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
}

export const Sheet2Combat: React.FC<Sheet2Props> = ({
  character,
  allCharacters = [],
  parties = [],
  currentUser,
  onOpenPartyManager,
  onUpdateCharacter,
  onAddMonsterToRoster,
  onRoll,
  onRollDamage
}) => {
  const [showRestModal, setShowRestModal] = useState(false);
  const [showTransformationModal, setShowTransformationModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showMaxHpInspector, setShowMaxHpInspector] = useState(false);
  const [targetModalSpell, setTargetModalSpell] = useState<any | null>(null);

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
      <ShadowrunCombatPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Combat Defenses, HP & Saves */}
      <CombatDefensesPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRoll={onRoll}
        setShowMaxHpInspector={setShowMaxHpInspector}
        setShowTransformationModal={setShowTransformationModal}
        setShowCompanionModal={setShowCompanionModal}
        setShowRestModal={setShowRestModal}
      />

      {/* Interactive Encounter & Initiative Tracker */}
      <EncounterTracker
        character={character}
        allCharacters={allCharacters}
        parties={parties}
        currentUser={currentUser}
        onOpenPartyManager={onOpenPartyManager}
        onUpdateCharacter={onUpdateCharacter}
        onRoll={onRoll}
      />

      {/* Attacks, Spells & Quick Combat Panel */}
      <AttacksSpellsPanel
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        onRoll={onRoll}
        onRollDamage={onRollDamage}
        setTargetModalSpell={setTargetModalSpell}
        onOpenShapeshift={() => setShowTransformationModal(true)}
        onOpenSummonCompanion={() => setShowCompanionModal(true)}
      />

      {/* MODALS */}
      {showRestModal && (
        <RestModal
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowRestModal(false)}
        />
      )}

      {showMaxHpInspector && (
        <MaxHpInspectorModal
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onClose={() => setShowMaxHpInspector(false)}
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
          onRollDamage={onRollDamage}
        />
      )}

      {targetModalSpell && (
        <SpellTargetModal
          spell={targetModalSpell}
          caster={character}
          allCharacters={allCharacters.length > 0 ? allCharacters : [character]}
          onConfirmCast={(spell, targetIds, conditionName) => handleConfirmCastSpellTarget(spell, targetIds, conditionName)}
          onClose={() => setTargetModalSpell(null)}
        />
      )}
    </div>
  );
};
