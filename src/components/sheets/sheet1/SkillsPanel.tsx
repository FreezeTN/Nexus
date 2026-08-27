import React from 'react';
import { CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getProficiencyBonus,
  getAbilityModifier,
  get35eSkillBonus,
  getSkillBonus,
  formatModifier
} from '../../../utils/dndCalculations';
import { Shield, CheckSquare, Square, Dices } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface SkillsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

const getTranslatedSkillName = (name: string, t: (key: string, def?: string) => string) => {
  const map: Record<string, string> = {
    'Acrobatics': 'skills.acrobatics',
    'Animal Handling': 'skills.animalHandling',
    'Arcana': 'skills.arcana',
    'Athletics': 'skills.athletics',
    'Deception': 'skills.deception',
    'History': 'skills.history',
    'Insight': 'skills.insight',
    'Intimidation': 'skills.intimidation',
    'Investigation': 'skills.investigation',
    'Medicine': 'skills.medicine',
    'Nature': 'skills.nature',
    'Perception': 'skills.perception',
    'Performance': 'skills.performance',
    'Persuasion': 'skills.persuasion',
    'Religion': 'skills.religion',
    'Sleight of Hand': 'skills.sleightOfHand',
    'Stealth': 'skills.stealth',
    'Survival': 'skills.survival',
  };
  const key = map[name];
  return key ? t(key, name) : name;
};

export const SkillsPanel: React.FC<SkillsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const { t } = useLanguage();
  const profBonus = getProficiencyBonus(character.level);

  const handleSkillProficiencyChange = (skillId: string, type: 'proficient' | 'expertise') => {
    const updatedSkills = character.skills.map(skill => {
      if (skill.id === skillId) {
        if (type === 'proficient') {
          const nextProf = !skill.proficient;
          return { ...skill, proficient: nextProf, expertise: nextProf ? skill.expertise : false };
        } else {
          const nextExp = !skill.expertise;
          return { ...skill, expertise: nextExp, proficient: nextExp ? true : skill.proficient };
        }
      }
      return skill;
    });
    onUpdateCharacter({ ...character, skills: updatedSkills });
  };

  const handle35eSkillChange = (
    skillId: string,
    field: 'ranks' | 'miscMod' | 'isClassSkill',
    value: number | boolean
  ) => {
    const updated = character.skills.map(s => {
      if (s.id === skillId) {
        if (field === 'isClassSkill') {
          return { ...s, isClassSkill: !!value };
        }
        return { ...s, [field]: Math.max(0, value as number) };
      }
      return s;
    });
    onUpdateCharacter({ ...character, skills: updated });
  };

  return (
    <CollapsibleBox
      title={`${t('stats.skills', 'Skills')} (${character.edition === '3.5e' ? '3.5e Ranks System' : '5e Proficiency System'})`}
      icon={<Shield className="w-5 h-5 text-amber-500" />}
      storageKey="sheet1_skills"
      headerExtra={
        character.edition !== '3.5e' ? (
          <div className="text-xs text-stone-400 font-mono">
            {t('stats.profBonus', 'Prof')}: <span className="text-purple-300 font-bold">+{profBonus}</span>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-1.5 pt-2">
        {/* 3.5e Skill Point Calculator Summary Panel */}
        {character.edition === '3.5e' && (() => {
          const defaultBaseSP = ['Rogue'].includes(character.characterClass) ? 8 : ['Bard', 'Ranger'].includes(character.characterClass) ? 6 : ['Barbarian', 'Druid', 'Monk'].includes(character.characterClass) ? 4 : 2;
          const baseSP = character.classBaseSkillPoints ?? defaultBaseSP;
          const intMod = getAbilityModifier(character.abilities.INT?.score || 10);
          const isHuman = character.race.toLowerCase().includes('human');

          const lvl1SP = Math.max(4, (baseSP + intMod) * 4) + (isHuman ? 4 : 0);
          const addLvlSP = (character.level - 1) * (Math.max(1, baseSP + intMod) + (isHuman ? 1 : 0));
          const totalAvailableSP = lvl1SP + addLvlSP;

          const totalSpentSP = character.skills.reduce((sum, s) => {
            const ranks = s.ranks || 0;
            const isClass = s.isClassSkill !== false;
            return sum + (ranks * (isClass ? 1 : 2));
          }, 0);

          const remainingSP = totalAvailableSP - totalSpentSP;
          const maxClassRanks = character.level + 3;
          const maxCrossRanks = (character.level + 3) / 2;

          return (
            <div className="mb-3 bg-stone-950 p-3 rounded-xl border border-amber-600/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-amber-300">3.5e Skill Point Calculator</span>
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-stone-400">Base SP/Lvl:</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={baseSP}
                    onChange={(e) => onUpdateCharacter({ ...character, classBaseSkillPoints: parseInt(e.target.value) || 2 })}
                    className="w-10 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-0.5"
                    title="Base Skill Points per level for class (e.g. Rogue 8, Bard 6, Fighter 2)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono py-1.5 bg-stone-900/80 rounded-lg border border-stone-800">
                <div>
                  <div className="text-[10px] text-stone-400 uppercase">Available</div>
                  <div className="text-sm font-bold text-amber-300">{totalAvailableSP} SP</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 uppercase">Spent</div>
                  <div className="text-sm font-bold text-stone-200">{totalSpentSP} SP</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 uppercase">Remaining</div>
                  <div className={`text-sm font-bold ${remainingSP < 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {remainingSP} SP
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-stone-400 flex items-center justify-between pt-0.5 font-mono">
                <span>Class Max: <strong className="text-amber-300">{maxClassRanks} Ranks</strong> (1 SP)</span>
                <span>Cross Max: <strong className="text-stone-300">{maxCrossRanks} Ranks</strong> (2 SP)</span>
              </div>
            </div>
          );
        })()}

        <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
          {character.skills.map((skill) => {
            const displayName = getTranslatedSkillName(skill.name, t);
            if (character.edition === '3.5e') {
              const skillBonus = get35eSkillBonus(skill, character.abilities);
              const abilityMod = getAbilityModifier(character.abilities[skill.ability]?.score || 10);
              return (
                <div
                  key={skill.id}
                  className="bg-stone-950/70 hover:bg-stone-800/80 p-2 rounded-xl flex items-center justify-between gap-1 text-xs border border-stone-800 transition"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <label
                      className="flex items-center gap-1 cursor-pointer shrink-0"
                      title="Check if Class Skill (1 SP per rank). Uncheck if Cross-Class Skill (2 SP per rank)."
                    >
                      <input
                        type="checkbox"
                        checked={skill.isClassSkill !== false}
                        onChange={(e) => handle35eSkillChange(skill.id, 'isClassSkill', e.target.checked)}
                        className="accent-amber-500 w-3.5 h-3.5 rounded"
                      />
                      <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                        skill.isClassSkill !== false
                          ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                          : 'bg-stone-900 text-stone-500 border border-stone-800'
                      }`}>
                        {skill.isClassSkill !== false ? 'C' : 'X'}
                      </span>
                    </label>

                    <span className="font-mono text-[10px] text-amber-500 font-bold w-6">
                      {skill.ability}
                    </span>
                    <span className="font-medium text-stone-200 truncate">{displayName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Skill Ranks">
                      <span className="text-stone-500 text-[9px]">R:</span>
                      <input
                        type="number"
                        min="0"
                        value={skill.ranks || 0}
                        onChange={(e) => handle35eSkillChange(skill.id, 'ranks', parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-center font-bold text-amber-300 focus:outline-none"
                      />
                    </div>

                    <div className="text-stone-400 text-[10px]" title="Ability Modifier">
                      A:{formatModifier(abilityMod)}
                    </div>

                    <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Misc Modifier">
                      <span className="text-stone-500 text-[9px]">M:</span>
                      <input
                        type="number"
                        value={skill.miscMod || 0}
                        onChange={(e) => handle35eSkillChange(skill.id, 'miscMod', parseInt(e.target.value) || 0)}
                        className="w-7 bg-transparent text-center font-bold text-stone-300 focus:outline-none"
                      />
                    </div>

                    <span className="font-bold text-emerald-300 text-sm ml-1">
                      {formatModifier(skillBonus)}
                    </span>

                    <button
                      onClick={() => onRoll(`${displayName} Check (3.5e)`, 20, 1, skillBonus, 'normal')}
                      className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition"
                      title={`Roll ${displayName} Check`}
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // Standard 5e Skill Render
            const skillBonus = getSkillBonus(skill, character.abilities, character.level);
            return (
              <div
                key={skill.id}
                className="bg-stone-950/60 hover:bg-stone-800/80 p-2 rounded-xl flex items-center justify-between gap-2 text-xs border border-stone-800 transition"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => handleSkillProficiencyChange(skill.id, 'proficient')}
                    className="text-stone-400 hover:text-amber-300 transition"
                    title="Toggle Proficiency"
                  >
                    {skill.proficient ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSkillProficiencyChange(skill.id, 'expertise')}
                    className={`text-xs transition font-mono ${
                      skill.expertise ? 'text-amber-400 font-bold' : 'text-stone-600 hover:text-stone-400'
                    }`}
                    title="Toggle Expertise (Double Proficiency)"
                  >
                    [EXP]
                  </button>

                  <span className="font-mono text-[10px] text-amber-500 font-bold w-7">
                    {skill.ability}
                  </span>

                  <span className="font-medium text-stone-200 truncate">{displayName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-200 text-sm">
                    {formatModifier(skillBonus)}
                  </span>
                  <button
                    onClick={() => onRoll(`${displayName} Check`, 20, 1, skillBonus, 'normal')}
                    className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition"
                    title={`Roll ${displayName} Check`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CollapsibleBox>
  );
};
