import React, { useState } from 'react';
import { CharacterData, RacialSkillBonus, RacialSkillBonusType, AbilityName } from '../../types';
import { SRD_RACIAL_SKILL_BONUSES, getCharacterRacialSkillBonuses } from '../../utils/racialSkillBonusEngine';
import { X, Plus, Trash2, Sparkles, Shield, AlertCircle, Info, Dna } from 'lucide-react';

interface CharacterRacialBonusesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (character: CharacterData) => void;
}

const COMMON_SKILLS = [
  'Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script',
  'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information',
  'Handle Animal', 'Heal', 'Hide', 'Intimidate', 'Jump', 'Knowledge (Arcana)', 'Knowledge (Dungeoneering)',
  'Knowledge (Nature)', 'Knowledge (Religion)', 'Knowledge (The Planes)', 'Listen', 'Move Silently',
  'Open Lock', 'Perform', 'Profession', 'Ride', 'Search', 'Sense Motive', 'Sleight of Hand',
  'Spellcraft', 'Spot', 'Survival', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope',
  // 5e Skills
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
  'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
  'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
];

export const CharacterRacialBonusesModal: React.FC<CharacterRacialBonusesModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  if (!isOpen) return null;

  const currentBonuses: RacialSkillBonus[] = getCharacterRacialSkillBonuses(character);

  // Form state
  const [bonusType, setBonusType] = useState<RacialSkillBonusType>('specific');
  const [skillName, setSkillName] = useState<string>('Spot');
  const [customSkill, setCustomSkill] = useState<string>('');
  const [ability, setAbility] = useState<AbilityName>('DEX');
  const [bonusValue, setBonusValue] = useState<number>(2);
  const [conditionText, setConditionText] = useState<string>('at night');
  const [sourceName, setSourceName] = useState<string>(character.race ? `${character.race} Trait` : 'Racial Trait');

  const handleAddBonus = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSkill = customSkill.trim() || skillName;

    const newBonus: RacialSkillBonus = {
      id: `racial_bonus_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: bonusType,
      bonus: Number(bonusValue) || 2,
      source: sourceName.trim() || 'Racial Trait'
    };

    if (bonusType === 'specific') {
      newBonus.skillName = finalSkill;
    } else if (bonusType === 'ability') {
      newBonus.ability = ability;
    } else if (bonusType === 'conditional') {
      newBonus.skillName = finalSkill;
      newBonus.condition = conditionText.trim() || 'under specific circumstances';
    }

    const updated = [...(character.racialSkillBonuses || currentBonuses), newBonus];
    onUpdateCharacter({
      ...character,
      racialSkillBonuses: updated
    });

    // Reset inputs
    setCustomSkill('');
  };

  const handleRemoveBonus = (id: string) => {
    // If character.racialSkillBonuses is not yet initialized, initialize it with currentBonuses minus this id
    const sourceList = character.racialSkillBonuses || currentBonuses;
    const updated = sourceList.filter(b => b.id !== id);
    onUpdateCharacter({
      ...character,
      racialSkillBonuses: updated
    });
  };

  const handleResetToSRD = () => {
    const raceKey = (character.race || '').toLowerCase().trim();
    let srdMatches: RacialSkillBonus[] = [];
    for (const [key, bonuses] of Object.entries(SRD_RACIAL_SKILL_BONUSES)) {
      if (raceKey.includes(key)) {
        srdMatches = [...bonuses];
        break;
      }
    }
    onUpdateCharacter({
      ...character,
      racialSkillBonuses: srdMatches
    });
  };

  return (
    <div
      id="modal-character-racial-bonuses"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-stone-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-100 flex items-center gap-2">
                <span>Racial Skill Bonuses</span>
                {character.race && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-amber-300">
                    {character.race}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-400">
                Manage innate species traits and racial modifier stacking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Rules Explanation Box */}
          <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl space-y-2 text-xs text-amber-200/90">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>D&D Racial Skill Bonus Mechanics</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-300 pl-1">
              <li>
                <strong>Non-Stacking Rule:</strong> Racial skill bonuses do not stack with one another; only the highest racial bonus applies to a skill.
              </li>
              <li>
                <strong>Specific Skills:</strong> Grants bonus directly to a named skill (e.g. +2 on Spot, +5 to Jump, +8 to Swim).
              </li>
              <li>
                <strong>Ability-Affiliated:</strong> Grants bonus to all skills affiliated with an ability modifier (e.g. +2 to all DEX-based skills).
              </li>
              <li>
                <strong>Conditional Bonuses:</strong> Applies when rolling under specific circumstances (e.g. +4 on Spot checks at night). Prompted on roll.
              </li>
            </ul>
          </div>

          {/* Current Active Racial Bonuses */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-stone-400 font-bold tracking-wider">
                Active Racial Bonuses ({currentBonuses.length})
              </label>
              <button
                type="button"
                onClick={handleResetToSRD}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
              >
                Reset to Standard {character.race || 'SRD'}
              </button>
            </div>

            {currentBonuses.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-800 text-center text-xs text-stone-500">
                No racial skill bonuses currently assigned to this character. Add one below!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentBonuses.map(b => (
                  <div
                    key={b.id}
                    className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 font-mono text-sm">
                          +{b.bonus}
                        </span>
                        <span className="font-medium text-stone-200 truncate">
                          {b.type === 'specific' && (b.skillName || 'Skill')}
                          {b.type === 'ability' && `All ${b.ability}-based skills`}
                          {b.type === 'conditional' && `${b.skillName} (Conditional)`}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                        {b.type === 'conditional' ? `When: "${b.condition}"` : `Source: ${b.source || 'Racial'}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBonus(b.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition shrink-0"
                      title="Remove racial bonus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Racial Bonus Form */}
          <form onSubmit={handleAddBonus} className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl space-y-3">
            <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Racial Skill Bonus</span>
            </label>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBonusType('specific')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                  bonusType === 'specific'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'
                }`}
              >
                Specific Skill
              </button>
              <button
                type="button"
                onClick={() => setBonusType('ability')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                  bonusType === 'ability'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'
                }`}
              >
                Ability-Based
              </button>
              <button
                type="button"
                onClick={() => setBonusType('conditional')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                  bonusType === 'conditional'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300'
                }`}
              >
                Conditional
              </button>
            </div>

            {/* Form Fields according to bonusType */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {bonusType !== 'ability' ? (
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Target Skill</label>
                  <select
                    value={skillName}
                    onChange={e => setSkillName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    {Array.from(new Set(COMMON_SKILLS)).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Ability Modifier Affiliation</label>
                  <select
                    value={ability}
                    onChange={e => setAbility(e.target.value as AbilityName)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="STR">STR (Strength-based skills)</option>
                    <option value="DEX">DEX (Dexterity-based skills)</option>
                    <option value="CON">CON (Constitution-based skills)</option>
                    <option value="INT">INT (Intelligence-based skills)</option>
                    <option value="WIS">WIS (Wisdom-based skills)</option>
                    <option value="CHA">CHA (Charisma-based skills)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Racial Bonus (+)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={bonusValue}
                  onChange={e => setBonusValue(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  placeholder="+2"
                />
              </div>

              {bonusType === 'conditional' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">
                    Specific Circumstances / Condition Text
                  </label>
                  <input
                    type="text"
                    value={conditionText}
                    onChange={e => setConditionText(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. at night, underwater, in rocky terrain, related to stone or metal"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Source / Trait Name</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Keen Senses, Halfling Agility, Racial Trait"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Racial Skill Bonus</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
