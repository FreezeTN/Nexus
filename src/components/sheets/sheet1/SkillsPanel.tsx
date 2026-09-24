import React, { useState } from 'react';
import { CharacterData, Skill } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import {
  getProficiencyBonus,
  getAbilityModifier,
  get35eSkillBonus,
  get35eSkillSynergyBonus,
  getSkillBonus,
  formatModifier,
  getEffectiveAbilities,
  apply35eDefaultClassSkills,
  check35eSkillRankCap,
  DND35E_SKILL_SYNERGIES,
  getSynergiesGrantedBySkill,
  isSkillGrantingSynergy,
  getActiveGrantingSynergySkills,
  calculate35eTotalArmorCheckPenalty,
  DND35E_ACP_SKILLS,
  getSizeHideModifier,
  resolveRacialSkillBonus,
  getRacialSkillBonusForSkill,
  getGestaltBaseSkillPoints,
  get35eClassBaseSkillPoints,
  getPassivePerception,
  getPassiveInvestigation,
  getPassiveInsight,
  hasObservantFeat
} from '../../../utils/dndCalculations';
import {
  Shield,
  CheckSquare,
  Square,
  Dices,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Info,
  Filter,
  Dna,
  Maximize2,
  Minimize2,
  Eye
} from 'lucide-react';
import { ConditionalSkillRollModal } from '../../modals/ConditionalSkillRollModal';
import { CharacterRacialBonusesModal } from '../../modals/CharacterRacialBonusesModal';

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
  const effectiveAbilities = getEffectiveAbilities(character);
  const acpInfo = calculate35eTotalArmorCheckPenalty(character);

  const [filterMode, setFilterMode] = useState<'all' | 'class' | 'cross' | 'trained' | 'synergy' | 'knowledge'>('all');
  const [isTallView, setIsTallView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRacialBonusesModal, setShowRacialBonusesModal] = useState(false);
  const [conditionalRollModalSkill, setConditionalRollModalSkill] = useState<{
    skill: Skill;
    baseModifier: number;
    edition: '5e' | '3.5e';
  } | null>(null);

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

  const handleCapToMax = (skillId: string, maxRanks: number) => {
    const updated = character.skills.map(s => {
      if (s.id === skillId) {
        return { ...s, ranks: maxRanks };
      }
      return s;
    });
    onUpdateCharacter({ ...character, skills: updated });
  };

  const handleApplyDefaultClassSkills = () => {
    const updated = apply35eDefaultClassSkills(character);
    onUpdateCharacter(updated);
  };

  // Find all skills that currently grant synergies according to 3.5e rules
  const skillsGrantingSynergies = character.edition === '3.5e' ? getActiveGrantingSynergySkills(character.skills) : [];

  return (
    <CollapsibleBox
      title={`${t('stats.skills', 'Skills')} (${character.edition === '3.5e' ? '3.5e Ranks & Synergies' : '5e Proficiency System'})`}
      icon={<Shield className="w-5 h-5 text-amber-500" />}
      storageKey="sheet1_skills"
      headerExtra={
        <div className="flex items-center gap-2">
          {character.edition !== '3.5e' && (
            <div className="text-xs text-stone-400 font-mono hidden sm:block">
              {t('stats.profBonus', 'Prof')}: <span className="text-purple-300 font-bold">+{profBonus}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowRacialBonusesModal(true)}
            className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-700/40 rounded text-[10px] font-mono flex items-center gap-1 transition"
            title="View and customize D&D Racial Skill Bonuses"
          >
            <Dna className="w-3 h-3 text-amber-400" />
            <span>Racial Bonuses</span>
          </button>
        </div>
      }
    >
      <div className="space-y-2 pt-2">
        {/* 3.5e Skill Point Calculator Summary Panel */}
        {character.edition === '3.5e' && (() => {
          const isGestalt = Boolean(character.optionalRules?.useGestaltUA72);
          const isMulticlass = Boolean(character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass);
          const defaultBaseSP = isGestalt
            ? getGestaltBaseSkillPoints(character)
            : get35eClassBaseSkillPoints(character.characterClass);
          const baseSP = Math.max(character.classBaseSkillPoints ?? 0, defaultBaseSP);
          const intMod = getAbilityModifier(character.abilities.INT?.score || 10);
          const isHuman = character.race.toLowerCase().includes('human') || (character.hybridHeritage?.isTemplateMode && character.hybridHeritage?.baseRaceId === 'human');

          let totalAvailableSP = 0;
          if (isMulticlass && !isGestalt) {
            const secClass = character.optionalRules?.secondaryClass || '';
            const secLevel = Math.max(1, character.optionalRules?.secondaryLevel || 1);
            const priLevel = Math.max(1, character.level - secLevel);
            const priBaseSP = baseSP;
            const secBaseSP = get35eClassBaseSkillPoints(secClass);

            const priSP = Math.max(4, (priBaseSP + intMod) * 4) + (priLevel - 1) * Math.max(1, priBaseSP + intMod);
            const secSP = secLevel * Math.max(1, secBaseSP + intMod);
            const humanSP = isHuman ? (4 + (character.level - 1)) : 0;
            totalAvailableSP = priSP + secSP + humanSP;
          } else {
            const lvl1SP = Math.max(4, (baseSP + intMod) * 4) + (isHuman ? 4 : 0);
            const addLvlSP = (character.level - 1) * (Math.max(1, baseSP + intMod) + (isHuman ? 1 : 0));
            totalAvailableSP = lvl1SP + addLvlSP;
          }

          const totalSpentSP = character.skills.reduce((sum, s) => {
            const ranks = s.ranks || 0;
            const isClass = s.isClassSkill !== false;
            return sum + (ranks * (isClass ? 1 : 2));
          }, 0);

          const remainingSP = totalAvailableSP - totalSpentSP;
          const maxClassRanks = character.level + 3;
          const maxCrossRanks = (character.level + 3) / 2;

          return (
            <div className="mb-2 bg-stone-950 p-3 rounded-xl border border-amber-600/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>3.5e Skill Points & Caps</span>
                  {isGestalt && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50" title="Gestalt UA p. 72: Gains higher skill points and combined class skills of all simultaneous tracks">
                      Gestalt ({baseSP} SP/lvl)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyDefaultClassSkills}
                    className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-700/40 rounded text-[10px] font-mono flex items-center gap-1 transition"
                    title={isGestalt
                      ? `Auto-check combined Class Skills for all Gestalt tracks (UA p. 72)`
                      : `Auto-check Class Skills according to 3.5e PHB rules for ${character.characterClass}`}
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Class Skills
                  </button>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="text-stone-400">Base SP:</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={baseSP}
                      onChange={(e) => onUpdateCharacter({ ...character, classBaseSkillPoints: parseInt(e.target.value) || 2 })}
                      className="w-9 bg-stone-900 border border-stone-700 rounded text-center text-amber-200 font-bold p-0.5"
                      title="Base Skill Points per level for class (e.g. Rogue 8, Bard 6, Fighter 2)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono py-2 bg-stone-900/80 rounded-lg border border-stone-800">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] text-stone-400 uppercase">Available</div>
                  <div className="text-sm font-bold text-amber-300">{totalAvailableSP} SP</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] text-stone-400 uppercase">Spent</div>
                  <div className="text-sm font-bold text-stone-200">{totalSpentSP} SP</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[10px] text-stone-400 uppercase">Remaining</div>
                  <div className={`text-sm font-bold ${remainingSP < 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {remainingSP} SP
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-stone-400 flex flex-wrap items-center justify-around gap-2 py-1.5 px-2 bg-stone-900/50 rounded-lg border border-stone-800/60 font-mono text-center">
                <span title="Class Skill maximum ranks = Character Level + 3. 1 Skill Point buys 1 full Rank.">
                  Class Skill Max: <strong className="text-amber-300">{maxClassRanks} Ranks</strong> (1 SP = 1 Rank)
                </span>
                <span className="text-stone-600 hidden sm:inline">•</span>
                <span title="D&D 3.5e PHB p. 62: Cross-Class maximum rank = (Level + 3) / 2. 1 SP buys ½ Rank (2 SP for 1 full Rank). At Level 6, max is 4.5 ranks, costing 9 SP total.">
                  Cross-Class Max: <strong className="text-stone-200">{maxCrossRanks} Ranks</strong> (2 SP = 1 Rank / 1 SP = ½ Rank)
                </span>
              </div>

              {/* 3.5e Half-Breed Template Notice if active */}
              {character.hybridHeritage?.isTemplateMode && (
                <div className="pt-1 border-t border-stone-800/80 text-[10px] text-amber-300/90 font-mono flex items-center justify-between">
                  <span>🧬 Half-Breed Template:</span>
                  <span className="text-stone-400">Template racial skill points waived (Class progression active)</span>
                </div>
              )}

              {/* Active Synergies summary banner if any skills actively grant synergies */}
              {skillsGrantingSynergies.length > 0 && (
                <div className="pt-1 border-t border-stone-800/80 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-stone-400 font-bold shrink-0">Active Synergies (5+ Ranks):</span>
                  {skillsGrantingSynergies.map(item => (
                    <span
                      key={item.skill.id}
                      title={item.description}
                      className="px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-700/50 rounded text-emerald-300 shrink-0 cursor-help"
                    >
                      {item.skill.name} ({item.skill.ranks})
                    </span>
                  ))}
                </div>
              )}

              {/* Total Armor Check Penalty (ACP) Banner */}
              <div className="pt-1 border-t border-stone-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-stone-400">Total Armor Check Penalty:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${acpInfo.totalAcp < 0 ? 'text-amber-400' : 'text-stone-400'}`}>
                    {acpInfo.totalAcp} ACP
                  </span>
                  {acpInfo.breakdown.length > 0 && (
                    <span className="text-[9px] text-stone-500 font-normal">
                      ({acpInfo.breakdown.join(', ')})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 5e Passive Senses Suite Banner */}
        {character.edition !== '3.5e' && (() => {
          const pPerception = getPassivePerception(character);
          const pInvestigation = getPassiveInvestigation(character);
          const pInsight = getPassiveInsight(character);
          const hasObservant = hasObservantFeat(character);

          const perceptionSkill = character.skills.find(s => s.name === 'Perception');
          const investigationSkill = character.skills.find(s => s.name === 'Investigation');
          const insightSkill = character.skills.find(s => s.name === 'Insight');

          const getSenseCalcDetail = (skillName: string, abilityKey: 'WIS' | 'INT', skillObj?: Skill, extraBonus: number = 0) => {
            const base = 10;
            const mod = getAbilityModifier(effectiveAbilities[abilityKey]?.score || 10);
            const prof = skillObj?.expertise ? profBonus * 2 : skillObj?.proficient ? profBonus : 0;
            const parts = [`Base 10`, `${abilityKey} ${mod >= 0 ? '+' + mod : mod}`];
            if (prof > 0) parts.push(`Prof +${prof}${skillObj?.expertise ? ' (Expertise)' : ''}`);
            if (hasObservant && (skillName === 'Perception' || skillName === 'Investigation')) {
              parts.push('Observant +5');
            }
            if (extraBonus > 0) parts.push(`Item +${extraBonus}`);
            return parts.join(' + ');
          };

          return (
            <div className="mb-2 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-3 rounded-xl border border-teal-800/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-teal-300 flex items-center gap-1.5 text-xs">
                  <Eye className="w-3.5 h-3.5 text-teal-400" />
                  <span>Passive Senses (D&D 5e RAW)</span>
                  {hasObservant && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-600/60 font-semibold" title="Observant Feat: +5 bonus to passive Wisdom (Perception) and passive Intelligence (Investigation)">
                      Observant (+5)
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                  DC = 10 + modifier + prof. bonus
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Passive Perception */}
                <div
                  className="bg-stone-950/80 p-2 rounded-lg border border-teal-900/60 flex flex-col items-center justify-between text-center group hover:border-teal-600/70 transition"
                  title={`Passive Perception (Wisdom)\nFormula: ${getSenseCalcDetail('Perception', 'WIS', perceptionSkill)} = ${pPerception}`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-teal-200">
                    <span>Perception</span>
                    {perceptionSkill?.expertise && <span className="text-[9px] text-amber-400">★</span>}
                  </div>
                  <div className="text-lg font-mono font-extrabold text-teal-300 py-0.5">
                    {pPerception}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bonus = perceptionSkill ? getSkillBonus(perceptionSkill, effectiveAbilities, character.level, character) : getAbilityModifier(effectiveAbilities.WIS?.score || 10);
                      onRoll('Active Perception Check', 20, 1, bonus, 'normal');
                    }}
                    className="w-full mt-1 py-0.5 bg-stone-900 hover:bg-teal-950 text-stone-400 hover:text-teal-200 border border-stone-800 hover:border-teal-700/60 rounded text-[9px] font-mono transition flex items-center justify-center gap-0.5"
                    title="Roll active d20 Perception check"
                  >
                    <Dices className="w-2.5 h-2.5 text-teal-400" /> Roll
                  </button>
                </div>

                {/* Passive Investigation */}
                <div
                  className="bg-stone-950/80 p-2 rounded-lg border border-cyan-900/60 flex flex-col items-center justify-between text-center group hover:border-cyan-600/70 transition"
                  title={`Passive Investigation (Intelligence)\nFormula: ${getSenseCalcDetail('Investigation', 'INT', investigationSkill)} = ${pInvestigation}`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-200">
                    <span>Investigation</span>
                    {investigationSkill?.expertise && <span className="text-[9px] text-amber-400">★</span>}
                  </div>
                  <div className="text-lg font-mono font-extrabold text-cyan-300 py-0.5">
                    {pInvestigation}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bonus = investigationSkill ? getSkillBonus(investigationSkill, effectiveAbilities, character.level, character) : getAbilityModifier(effectiveAbilities.INT?.score || 10);
                      onRoll('Active Investigation Check', 20, 1, bonus, 'normal');
                    }}
                    className="w-full mt-1 py-0.5 bg-stone-900 hover:bg-cyan-950 text-stone-400 hover:text-cyan-200 border border-stone-800 hover:border-cyan-700/60 rounded text-[9px] font-mono transition flex items-center justify-center gap-0.5"
                    title="Roll active d20 Investigation check"
                  >
                    <Dices className="w-2.5 h-2.5 text-cyan-400" /> Roll
                  </button>
                </div>

                {/* Passive Insight */}
                <div
                  className="bg-stone-950/80 p-2 rounded-lg border border-emerald-900/60 flex flex-col items-center justify-between text-center group hover:border-emerald-600/70 transition"
                  title={`Passive Insight (Wisdom)\nFormula: ${getSenseCalcDetail('Insight', 'WIS', insightSkill)} = ${pInsight}`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-200">
                    <span>Insight</span>
                    {insightSkill?.expertise && <span className="text-[9px] text-amber-400">★</span>}
                  </div>
                  <div className="text-lg font-mono font-extrabold text-emerald-300 py-0.5">
                    {pInsight}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bonus = insightSkill ? getSkillBonus(insightSkill, effectiveAbilities, character.level, character) : getAbilityModifier(effectiveAbilities.WIS?.score || 10);
                      onRoll('Active Insight Check', 20, 1, bonus, 'normal');
                    }}
                    className="w-full mt-1 py-0.5 bg-stone-900 hover:bg-emerald-950 text-stone-400 hover:text-emerald-200 border border-stone-800 hover:border-emerald-700/60 rounded text-[9px] font-mono transition flex items-center justify-center gap-0.5"
                    title="Roll active d20 Insight check"
                  >
                    <Dices className="w-2.5 h-2.5 text-emerald-400" /> Roll
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Search & Filter Controls for 3.5e */}
        {character.edition === '3.5e' && (
          <div className="flex items-center gap-1.5 pb-1 flex-wrap">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[120px] bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600"
            />
            <div className="flex items-center gap-1 text-[10px] font-mono flex-wrap">
              {(['all', 'class', 'cross', 'trained', 'synergy', 'knowledge'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-2 py-1 rounded border capitalize transition ${
                    filterMode === mode
                      ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold'
                      : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                  }`}
                >
                  {mode === 'cross' ? 'Cross-Class' : mode}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsTallView(!isTallView)}
                className={`p-1 rounded border transition ${
                  isTallView
                    ? 'bg-amber-700/60 border-amber-500 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title={isTallView ? 'Collapse skill list view' : 'Expand full height skill list'}
              >
                {isTallView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        <div className={`space-y-1.5 ${isTallView ? 'max-h-none' : 'max-h-[560px]'} overflow-y-auto pr-1`}>
          {character.skills
            .filter((skill) => {
              if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
              }
              if (character.edition === '3.5e') {
                if (filterMode === 'class' && skill.isClassSkill === false) return false;
                if (filterMode === 'cross' && skill.isClassSkill !== false) return false;
                if (filterMode === 'trained' && (!skill.ranks || skill.ranks === 0)) return false;
                if (filterMode === 'knowledge' && !skill.name.toLowerCase().startsWith('knowledge')) return false;
                if (filterMode === 'synergy') {
                  const syn = get35eSkillSynergyBonus(skill.name, character.skills);
                  const isGranting = isSkillGrantingSynergy(skill.name, skill.ranks || 0);
                  if (syn.totalBonus === 0 && !isGranting) return false;
                }
              }
              return true;
            })
            .map((skill) => {
              const displayName = getTranslatedSkillName(skill.name, t);

              if (character.edition === '3.5e') {
                const synergyInfo = get35eSkillSynergyBonus(skill.name, character.skills);
                const grantedSynergies = getSynergiesGrantedBySkill(skill.name, skill.ranks || 0);
                const isAcpSkill = DND35E_ACP_SKILLS.includes(skill.name);
                const isSwim = skill.name.toLowerCase() === 'swim';
                const isHide = skill.name.toLowerCase() === 'hide';
                const hideSizeMod = isHide ? getSizeHideModifier(character.sizeCategory) : 0;
                const skillBonus = get35eSkillBonus(skill, character.abilities, character.skills, acpInfo.totalAcp, character.sizeCategory, character);
                const abilityMod = getAbilityModifier(character.abilities[skill.ability]?.score || 10);
                const capInfo = check35eSkillRankCap(skill, character.level);
                const racialRes = resolveRacialSkillBonus(skill, character);

                return (
                  <div
                    key={skill.id}
                    className={`p-2 rounded-xl flex items-center justify-between gap-1 text-xs border transition ${
                      capInfo.isExceeded
                        ? 'bg-amber-950/20 border-rose-600/60'
                        : 'bg-stone-950/70 hover:bg-stone-800/80 border-stone-800'
                    }`}
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

                      <span className="font-mono text-[10px] text-amber-500 font-bold w-6 shrink-0">
                        {skill.ability}
                      </span>
                      <span className="font-medium text-stone-200 truncate shrink-0 max-w-[130px]" title={displayName}>
                        {displayName}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Racial Bonus Badge (Non-stacking) */}
                        {racialRes.unconditionalBonus > 0 && (
                          <span
                            className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                            title={`+${racialRes.unconditionalBonus} Racial Bonus (${racialRes.highestUnconditionalSource || 'Racial Trait'}). Racial bonuses do not stack.`}
                          >
                            +{racialRes.unconditionalBonus} Race
                          </span>
                        )}

                        {/* Conditional Racial Bonus Badges */}
                        {racialRes.conditionalMatches.map(c => (
                          <button
                            key={c.bonusObj.id}
                            type="button"
                            onClick={() => setConditionalRollModalSkill({
                              skill,
                              baseModifier: skillBonus,
                              edition: '3.5e'
                            })}
                            className="px-1.5 py-0.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-300 text-[9px] font-mono font-bold rounded shrink-0 flex items-center gap-1 transition cursor-pointer"
                            title={`Situational Racial Bonus: +${c.value} (${c.condition || 'Situational'}). Click to roll situational check.`}
                          >
                            <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                            <span>+{c.value} Sit.</span>
                          </button>
                        ))}

                        {/* Synergy Received Badge */}
                        {synergyInfo.totalBonus > 0 && (
                          <span
                            className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                            title={`+${synergyInfo.totalBonus} Synergy Bonus from: ${synergyInfo.sources.join(', ')}`}
                          >
                            +{synergyInfo.totalBonus} Syn
                          </span>
                        )}

                        {/* Synergy Granted Badge */}
                        {grantedSynergies.length > 0 && (
                          <span
                            className="px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                            title={`${skill.name} (${skill.ranks || 0} ranks) grants synergy to: ${grantedSynergies.map(g => `${g.targetSkill} (+${g.bonus}${g.conditionDesc ? ` ${g.conditionDesc}` : ''})`).join(', ')}`}
                          >
                            Grants Syn
                          </span>
                        )}

                        {/* ACP Badge */}
                        {isAcpSkill && acpInfo.totalAcp < 0 && (
                          <span
                            className="px-1.5 py-0.5 bg-stone-900 border border-amber-700/50 text-amber-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                            title={isSwim ? `${acpInfo.totalAcp * 2} ACP (Double penalty for Swim in 3.5e)` : `${acpInfo.totalAcp} Armor Check Penalty`}
                          >
                            {isSwim ? `${acpInfo.totalAcp * 2} ACP` : `${acpInfo.totalAcp} ACP`}
                          </span>
                        )}

                        {/* Size Modifier Badge for Hide */}
                        {isHide && hideSizeMod !== 0 && (
                          <span
                            className="px-1.5 py-0.5 bg-blue-950 border border-blue-600/60 text-blue-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                            title={`${formatModifier(hideSizeMod)} Size Modifier to Hide (${character.sizeCategory || 'Medium'})`}
                          >
                            {formatModifier(hideSizeMod)} Size
                          </span>
                        )}

                        {/* Exceeded Cap Warning */}
                        {capInfo.isExceeded && (
                          <button
                            type="button"
                            onClick={() => handleCapToMax(skill.id, capInfo.maxRanks)}
                            className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-600/60 text-[9px] font-mono font-bold rounded flex items-center gap-0.5 shrink-0 hover:bg-rose-900"
                            title={`Exceeds 3.5e cap (${capInfo.maxRanks} ranks). Click to clamp.`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            <span>Max {capInfo.maxRanks}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                      <div className="flex items-center gap-0.5 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Skill Ranks (R) — 1 SP = 1 Class Rank, 2 SP = 1 Cross-Class Rank (1 SP = ½ Rank)">
                        <span className="text-stone-500 text-[9px]">R:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={skill.ranks || 0}
                          onChange={(e) => handle35eSkillChange(skill.id, 'ranks', parseFloat(e.target.value) || 0)}
                          className="w-8 bg-transparent text-center font-bold text-amber-300 focus:outline-none"
                        />
                      </div>

                      <div className="text-stone-400 text-[10px] min-w-[22px] text-center" title="Ability Modifier (A)">
                        A:{formatModifier(abilityMod)}
                      </div>

                      <div className="flex items-center gap-0.5 bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5" title="Misc Modifier (M)">
                        <span className="text-stone-500 text-[9px]">M:</span>
                        <input
                          type="number"
                          value={skill.miscMod || 0}
                          onChange={(e) => handle35eSkillChange(skill.id, 'miscMod', parseInt(e.target.value) || 0)}
                          className="w-5 bg-transparent text-center font-bold text-stone-300 focus:outline-none"
                        />
                      </div>

                      <span className="font-bold text-emerald-300 text-sm min-w-[24px] text-right">
                        {formatModifier(skillBonus)}
                      </span>

                      <button
                        onClick={() => {
                          if (racialRes.hasConditional) {
                            setConditionalRollModalSkill({
                              skill,
                              baseModifier: skillBonus,
                              edition: '3.5e'
                            });
                          } else {
                            onRoll(`${displayName} Check (3.5e)`, 20, 1, skillBonus, 'normal');
                          }
                        }}
                        className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition shrink-0"
                        title={racialRes.hasConditional ? `Roll ${displayName} Check (Situational racial bonus available)` : `Roll ${displayName} Check`}
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Standard 5e Skill Render
              const skillBonus = getSkillBonus(skill, effectiveAbilities, character.level, character);
              const racialRes = resolveRacialSkillBonus(skill, character);

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

                    <span className="font-mono text-[10px] text-amber-500 font-bold w-7 shrink-0">
                      {skill.ability}
                    </span>

                    <span className="font-medium text-stone-200 truncate shrink-0 max-w-[140px]" title={displayName}>
                      {displayName}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Racial Bonus Badge (Non-stacking) */}
                      {racialRes.unconditionalBonus > 0 && (
                        <span
                          className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[9px] font-mono font-bold rounded shrink-0 cursor-help"
                          title={`+${racialRes.unconditionalBonus} Racial Bonus (${racialRes.highestUnconditionalSource || 'Racial Trait'}). Racial bonuses do not stack.`}
                        >
                          +{racialRes.unconditionalBonus} Race
                        </span>
                      )}

                      {/* Conditional Racial Bonus Badges */}
                      {racialRes.conditionalMatches.map(c => (
                        <button
                          key={c.bonusObj.id}
                          type="button"
                          onClick={() => setConditionalRollModalSkill({
                            skill,
                            baseModifier: skillBonus,
                            edition: '5e'
                          })}
                          className="px-1.5 py-0.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-300 text-[9px] font-mono font-bold rounded shrink-0 flex items-center gap-1 transition cursor-pointer"
                          title={`Situational Racial Bonus: +${c.value} (${c.condition || 'Situational'}). Click to roll situational check.`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                          <span>+{c.value} Sit.</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-amber-200 text-sm min-w-[24px] text-right">
                      {formatModifier(skillBonus)}
                    </span>
                    <button
                      onClick={() => {
                        if (racialRes.hasConditional) {
                          setConditionalRollModalSkill({
                            skill,
                            baseModifier: skillBonus,
                            edition: '5e'
                          });
                        } else {
                          onRoll(`${displayName} Check`, 20, 1, skillBonus, 'normal');
                        }
                      }}
                      className="p-1 bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white rounded-lg transition shrink-0"
                      title={racialRes.hasConditional ? `Roll ${displayName} Check (Situational racial bonus available)` : `Roll ${displayName} Check`}
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {conditionalRollModalSkill && (
        <ConditionalSkillRollModal
          isOpen={!!conditionalRollModalSkill}
          onClose={() => setConditionalRollModalSkill(null)}
          skill={conditionalRollModalSkill.skill}
          character={character}
          edition={conditionalRollModalSkill.edition}
          baseModifier={conditionalRollModalSkill.baseModifier}
          calculateWithConditions={(activeConditionIds) => {
            if (conditionalRollModalSkill.edition === '3.5e') {
              return get35eSkillBonus(
                conditionalRollModalSkill.skill,
                character.abilities,
                character.skills,
                acpInfo.totalAcp,
                character.sizeCategory,
                character,
                activeConditionIds
              );
            } else {
              return getSkillBonus(
                conditionalRollModalSkill.skill,
                effectiveAbilities,
                character.level,
                character,
                activeConditionIds
              );
            }
          }}
          onRoll={onRoll}
        />
      )}

      {showRacialBonusesModal && (
        <CharacterRacialBonusesModal
          isOpen={showRacialBonusesModal}
          onClose={() => setShowRacialBonusesModal(false)}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </CollapsibleBox>
  );
};
