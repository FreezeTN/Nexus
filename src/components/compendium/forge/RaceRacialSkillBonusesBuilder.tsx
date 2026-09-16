import React from 'react';
import { RacialSkillBonus, RacialSkillBonusType, AbilityName } from '../../../types';
import { SupportedEdition } from './ForgeTypes';
import { Sparkles, Plus, Trash2, Shield, Info, Dna, Eye, Check } from 'lucide-react';
import { SRD_RACIAL_SKILL_BONUSES } from '../../../utils/racialSkillBonusEngine';

interface RaceRacialSkillBonusesBuilderProps {
  edition: SupportedEdition;
  bonuses: RacialSkillBonus[];
  onChange: (bonuses: RacialSkillBonus[]) => void;
  onSyncString?: (summaryStr: string) => void;
}

const COMMON_35E_SKILLS = [
  'Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft',
  'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist',
  'Forging', 'Gather Information', 'Handle Animal', 'Heal', 'Hide',
  'Intimidate', 'Jump', 'Knowledge', 'Listen', 'Move Silently',
  'Open Lock', 'Perform', 'Profession', 'Ride', 'Search',
  'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft',
  'Spot', 'Survival', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'
];

const COMMON_5E_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

const ABILITIES: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const RaceRacialSkillBonusesBuilder: React.FC<RaceRacialSkillBonusesBuilderProps> = ({
  edition,
  bonuses,
  onChange,
  onSyncString
}) => {
  const is35e = edition === '3.5e' || edition === 'pathfinder';
  const skillList = is35e ? COMMON_35E_SKILLS : COMMON_5E_SKILLS;

  const updateBonusList = (newList: RacialSkillBonus[]) => {
    onChange(newList);
    if (onSyncString) {
      const summary = newList.map(b => {
        const sign = b.bonus >= 0 ? '+' : '';
        if (b.type === 'specific') return `${sign}${b.bonus} ${b.skillName || 'Skill'}`;
        if (b.type === 'ability') return `${sign}${b.bonus} to all ${b.ability}-based skills`;
        if (b.type === 'conditional') return `${sign}${b.bonus} ${b.skillName || 'Skill'} (${b.condition || 'situational'})`;
        return `${sign}${b.bonus}`;
      }).join(', ');
      onSyncString(summary);
    }
  };

  const handleAddBonus = (type: RacialSkillBonusType = 'specific') => {
    const newBonus: RacialSkillBonus = {
      id: `rsb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      bonus: 2,
      source: 'Racial Trait',
      ...(type === 'specific' ? { skillName: is35e ? 'Spot' : 'Perception' } : {}),
      ...(type === 'ability' ? { ability: 'DEX' } : {}),
      ...(type === 'conditional' ? {
        skillName: is35e ? 'Spot' : 'Perception',
        condition: 'at night'
      } : {})
    };
    updateBonusList([...bonuses, newBonus]);
  };

  const handleUpdateBonus = (id: string, updates: Partial<RacialSkillBonus>) => {
    const updated = bonuses.map(b => (b.id === id ? { ...b, ...updates } : b));
    updateBonusList(updated);
  };

  const handleRemoveBonus = (id: string) => {
    const updated = bonuses.filter(b => b.id !== id);
    updateBonusList(updated);
  };

  const handleApplyPreset = (raceKey: string) => {
    const preset = SRD_RACIAL_SKILL_BONUSES[raceKey];
    if (preset) {
      const cloned = preset.map((b, i) => ({
        ...b,
        id: `preset_${raceKey}_${i}_${Date.now()}`
      }));
      updateBonusList(cloned);
    }
  };

  return (
    <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
        <div>
          <h5 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Racial Skill Bonuses Engine</span>
          </h5>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Racial skill bonuses apply to skill totals. In accordance with D&D rules, racial bonuses <strong className="text-stone-300">do not stack</strong> with one another (only highest bonus applies).
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md">
          <span>{bonuses.length} Bonus{bonuses.length === 1 ? '' : 'es'} Configured</span>
        </div>
      </div>

      {/* Quick SRD Presets */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-stone-400">Load Classic SRD Racial Skill Presets:</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('elf')}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-lg text-[11px] font-mono text-stone-300 transition"
            title="Elf: +2 Listen, +2 Search, +2 Spot"
          >
            Elf (+2 Senses)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('halfling')}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-lg text-[11px] font-mono text-stone-300 transition"
            title="Halfling: +2 Climb, +2 Jump, +2 Listen, +2 Move Silently"
          >
            Halfling (+2 Agility & Stealth)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('dwarf')}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-lg text-[11px] font-mono text-stone-300 transition"
            title="Dwarf: +2 Appraise & Craft (stone/metal)"
          >
            Dwarf (Stonecunning)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('gnome')}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-lg text-[11px] font-mono text-stone-300 transition"
            title="Gnome: +2 Listen, +2 Craft (Alchemy)"
          >
            Gnome (+2 Listen/Alchemy)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('goblin')}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 rounded-lg text-[11px] font-mono text-stone-300 transition"
            title="Goblin: +4 Move Silently, +4 Ride"
          >
            Goblin (+4 Stealth/Ride)
          </button>
          {bonuses.length > 0 && (
            <button
              type="button"
              onClick={() => updateBonusList([])}
              className="px-2 py-1 bg-stone-900 hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/40 rounded-lg text-[11px] font-mono text-rose-300 transition"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bonuses List */}
      <div className="space-y-2">
        {bonuses.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-stone-800 text-center text-xs text-stone-500 font-mono">
            No racial skill bonuses configured yet. Click below to add a specific skill bonus, ability-affiliated bonus, or conditional bonus.
          </div>
        ) : (
          bonuses.map((bonus, idx) => (
            <div
              key={bonus.id}
              className="p-3 bg-stone-900/90 border border-stone-800 rounded-xl space-y-2 text-xs hover:border-stone-700 transition"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-stone-500 font-bold">#{idx + 1}</span>
                  {/* Type Selector */}
                  <div className="flex items-center rounded-lg bg-stone-950 border border-stone-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateBonus(bonus.id, {
                        type: 'specific',
                        skillName: bonus.skillName || (is35e ? 'Spot' : 'Perception')
                      })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        bonus.type === 'specific'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Specific Skill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBonus(bonus.id, {
                        type: 'ability',
                        ability: bonus.ability || 'DEX'
                      })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        bonus.type === 'ability'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Ability-Affiliated
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBonus(bonus.id, {
                        type: 'conditional',
                        skillName: bonus.skillName || (is35e ? 'Spot' : 'Perception'),
                        condition: bonus.condition || 'at night'
                      })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        bonus.type === 'conditional'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Conditional
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBonus(bonus.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 transition"
                  title="Remove this bonus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bonus Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center font-mono">
                {/* 1. Value */}
                <div className="sm:col-span-3 flex items-center gap-1">
                  <span className="text-stone-400 text-[10px]">Bonus:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bonus.bonus}
                    onChange={(e) => handleUpdateBonus(bonus.id, { bonus: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 bg-stone-950 border border-stone-700 rounded text-amber-300 font-bold text-center"
                  />
                </div>

                {/* 2. Target (Skill vs Ability) */}
                {bonus.type === 'specific' && (
                  <div className="sm:col-span-5 flex items-center gap-1">
                    <span className="text-stone-400 text-[10px]">Skill:</span>
                    <input
                      type="text"
                      list={`skill-list-${bonus.id}`}
                      value={bonus.skillName || ''}
                      onChange={(e) => handleUpdateBonus(bonus.id, { skillName: e.target.value })}
                      placeholder="e.g. Spot, Listen, Swim"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs"
                    />
                    <datalist id={`skill-list-${bonus.id}`}>
                      {skillList.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                )}

                {bonus.type === 'ability' && (
                  <div className="sm:col-span-5 flex items-center gap-1">
                    <span className="text-stone-400 text-[10px]">Ability:</span>
                    <select
                      value={bonus.ability || 'DEX'}
                      onChange={(e) => handleUpdateBonus(bonus.id, { ability: e.target.value as AbilityName })}
                      className="w-full px-2 py-1 bg-stone-950 border border-indigo-700 rounded text-indigo-300 font-bold text-xs"
                    >
                      {ABILITIES.map(ab => (
                        <option key={ab} value={ab}>{ab} (All {ab}-based skills)</option>
                      ))}
                    </select>
                  </div>
                )}

                {bonus.type === 'conditional' && (
                  <div className="sm:col-span-5 flex items-center gap-1">
                    <span className="text-stone-400 text-[10px]">Skill:</span>
                    <input
                      type="text"
                      list={`skill-list-${bonus.id}`}
                      value={bonus.skillName || ''}
                      onChange={(e) => handleUpdateBonus(bonus.id, { skillName: e.target.value })}
                      placeholder="e.g. Spot"
                      className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs"
                    />
                    <datalist id={`skill-list-${bonus.id}`}>
                      {skillList.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                )}

                {/* 3. Trait Source / Name */}
                <div className="sm:col-span-4 flex items-center gap-1">
                  <span className="text-stone-400 text-[10px]">Trait:</span>
                  <input
                    type="text"
                    value={bonus.source || ''}
                    onChange={(e) => handleUpdateBonus(bonus.id, { source: e.target.value })}
                    placeholder="e.g. Keen Senses"
                    className="w-full px-2 py-1 bg-stone-950 border border-stone-700 rounded text-stone-300 text-xs"
                  />
                </div>
              </div>

              {/* Conditional Circumstance field */}
              {bonus.type === 'conditional' && (
                <div className="pt-1 flex items-center gap-2 bg-purple-950/20 border border-purple-900/40 p-2 rounded-lg font-mono">
                  <span className="text-purple-300 text-[10px] shrink-0">Circumstance / Condition:</span>
                  <input
                    type="text"
                    value={bonus.condition || ''}
                    onChange={(e) => handleUpdateBonus(bonus.id, { condition: e.target.value })}
                    placeholder="e.g. at night, related to stone or metal, underwater, in forest"
                    className="flex-1 px-2 py-1 bg-stone-950 border border-purple-700/50 rounded text-purple-200 text-xs"
                  />
                </div>
              )}

              {/* Explanatory badge */}
              <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                <Info className="w-3 h-3 text-stone-500 shrink-0" />
                {bonus.type === 'specific' && (
                  <span>Applies a +{bonus.bonus} racial bonus to {bonus.skillName || 'the skill'}. Does not stack with other racial bonuses to this skill.</span>
                )}
                {bonus.type === 'ability' && (
                  <span className="text-indigo-300">Applies a +{bonus.bonus} racial bonus to all skills affiliated with {bonus.ability} (e.g. Hide, Move Silently, Tumble for DEX). Non-stacking.</span>
                )}
                {bonus.type === 'conditional' && (
                  <span className="text-purple-300">Prompts the player with a toggle when rolling {bonus.skillName || 'this skill'} to apply +{bonus.bonus} under "{bonus.condition || 'specific conditions'}".</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add bonus buttons */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <button
          type="button"
          onClick={() => handleAddBonus('specific')}
          className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 rounded-xl text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Specific Skill (+2 Spot)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddBonus('ability')}
          className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-600/50 rounded-xl text-xs font-mono text-indigo-300 font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Ability-Affiliated (+2 all DEX skills)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddBonus('conditional')}
          className="px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-600/50 rounded-xl text-xs font-mono text-purple-300 font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Conditional (+4 Spot at night)</span>
        </button>
      </div>
    </div>
  );
};
