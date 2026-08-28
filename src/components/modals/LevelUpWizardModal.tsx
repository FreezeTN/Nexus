import React, { useState } from 'react';
import { CharacterData, AbilityName, Feat, ClassFeature } from '../../types';
import { getClassHitDie, DND_5E_LEVEL_TABLE } from '../../data/levelProgressionData';
import { getAbilityModifier, formatModifier, getProficiencyBonus } from '../../utils/dndCalculations';
import { playDiceSound, playLevelUpSound } from '../../utils/soundEffects';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Dices,
  Shield,
  Heart,
  Zap,
  BookOpen,
  X,
  Award,
  Crown
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface LevelUpWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onRoll?: (label: string, diceSides: number, count?: number, modifier?: number, mode?: 'normal' | 'advantage' | 'disadvantage') => void;
}

const SRD_FEATS: Array<{ name: string; prerequisite?: string; description: string; hpMaxBonus?: number }> = [
  {
    name: 'Alert',
    description: '+5 bonus to initiative. You cannot be surprised while conscious, and enemies do not gain advantage on attacks against you from being unseen.'
  },
  {
    name: 'War Caster',
    description: 'Advantage on CON saving throws to maintain concentration. Can perform somatic components with weapons/shields in hand. Can cast a 1-action spell as an opportunity attack.'
  },
  {
    name: 'Great Weapon Master',
    description: 'On critical hit or killing an enemy with a melee weapon, make one bonus action melee attack. Before making a melee attack with a heavy weapon, choose to take -5 to hit for +10 damage.'
  },
  {
    name: 'Sharpshooter',
    description: 'Attacking at long range does not impose disadvantage. Ranged weapon attacks ignore half and three-quarters cover. Can choose to take -5 to hit for +10 ranged damage.'
  },
  {
    name: 'Sentinel',
    description: 'When you hit a creature with an opportunity attack, its speed becomes 0 for the turn. Creatures provoke opportunity attacks even if they Disengage. Can use reaction to attack when enemy hits ally within 5ft.'
  },
  {
    name: 'Tough',
    description: 'Your hit point maximum increases by an amount equal to 2 × your level when you gain this feat, and by 2 additional hit points each time you gain a level thereafter.',
    hpMaxBonus: 2
  },
  {
    name: 'Lucky',
    description: 'You have 3 luck points per long rest. Roll an additional d20 on attack rolls, ability checks, or saving throws, or force an attacker to reroll an attack against you.'
  },
  {
    name: 'Mobile',
    description: 'Your speed increases by 10 feet. When you Dash, difficult terrain doesn’t cost extra movement. When you make a melee attack against a creature, you don’t provoke opportunity attacks from it.'
  },
  {
    name: 'Fey Touched',
    description: 'Increase INT, WIS, or CHA by +1. Learn Misty Step and one 1st-level Divination or Enchantment spell. Can cast each once per long rest without expending a spell slot.'
  },
  {
    name: 'Polearm Master',
    description: 'When attacking with a glaive, halberd, pike, or quarterstaff, make a bonus action melee strike dealing 1d4 bludgeoning. Provoke opportunity attack when enemies enter your reach.'
  },
  {
    name: 'Resilient (Constitution)',
    description: 'Increase CON by +1 and gain proficiency in Constitution saving throws.'
  },
  {
    name: 'Magic Initiate',
    description: 'Learn 2 cantrips and one 1st-level spell from a class spell list of your choice. Can cast the 1st-level spell once per long rest.'
  }
];

const SUBCLASS_OPTIONS: Record<string, string[]> = {
  fighter: ['Champion', 'Battle Master', 'Eldritch Knight', 'Samurai'],
  wizard: ['School of Evocation', 'School of Abjuration', 'School of Divination', 'School of Necromancy', 'Bladesinging'],
  rogue: ['Thief', 'Assassin', 'Arcane Trickster', 'Swashbuckler'],
  cleric: ['Life Domain', 'War Domain', 'Light Domain', 'Trickery Domain', 'Tempest Domain'],
  paladin: ['Oath of Devotion', 'Oath of Vengeance', 'Oath of the Ancients', 'Oath of Conquest'],
  barbarian: ['Path of the Berserker', 'Path of the Totem Warrior', 'Path of the Zealot'],
  bard: ['College of Lore', 'College of Valor', 'College of Swords'],
  druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of Stars'],
  monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Kensei'],
  ranger: ['Hunter', 'Beast Master', 'Gloom Stalker'],
  sorcerer: ['Draconic Bloodline', 'Wild Magic', 'Divine Soul'],
  warlock: ['The Fiend', 'The Great Old One', 'The Archfey', 'The Hexblade'],
  artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith']
};

export const LevelUpWizardModal: React.FC<LevelUpWizardModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const { t } = useLanguage();
  const currentLevel = character.level || 1;
  const targetLevel = Math.min(20, currentLevel + 1);

  const [step, setStep] = useState<number>(1);
  const [hpMethod, setHpMethod] = useState<'average' | 'rolled'>('average');
  const [rolledHpDie, setRolledHpDie] = useState<number | null>(null);

  // ASI or Feat state
  const isAsiLevel = [4, 8, 12, 16, 19].includes(targetLevel) || (character.characterClass.toLowerCase().includes('fighter') && [6, 14].includes(targetLevel));
  const [progressionChoice, setProgressionChoice] = useState<'asi' | 'feat'>('asi');
  const [selectedAsiType, setSelectedAsiType] = useState<'plusTwo' | 'plusOneOne'>('plusTwo');
  const [asiSingleStat, setAsiSingleStat] = useState<AbilityName>('STR');
  const [asiDoubleStat1, setAsiDoubleStat1] = useState<AbilityName>('STR');
  const [asiDoubleStat2, setAsiDoubleStat2] = useState<AbilityName>('DEX');
  const [selectedFeat, setSelectedFeat] = useState<string>(SRD_FEATS[0].name);

  // Subclass state
  const classKey = character.characterClass.toLowerCase().trim();
  const availableSubclasses = Object.keys(SUBCLASS_OPTIONS).find(k => classKey.includes(k))
    ? SUBCLASS_OPTIONS[Object.keys(SUBCLASS_OPTIONS).find(k => classKey.includes(k))!]
    : ['Standard Archetype', 'Custom Specialist'];
  const [selectedSubclass, setSelectedSubclass] = useState<string>(character.subclass || availableSubclasses[0]);

  const hitDieMeta = getClassHitDie(character.characterClass);
  const conMod = getAbilityModifier(character.abilities.CON.score);

  const hpGained = hpMethod === 'average'
    ? Math.max(1, hitDieMeta.averageHp + conMod)
    : Math.max(1, (rolledHpDie || hitDieMeta.averageHp) + conMod);

  const newMaxHp = character.hpMax + hpGained;
  const newProfBonus = getProficiencyBonus(targetLevel);
  const oldProfBonus = getProficiencyBonus(currentLevel);

  const handleRollHitDie = () => {
    playDiceSound();
    const roll = Math.floor(Math.random() * hitDieMeta.dieType) + 1;
    setRolledHpDie(roll);
    if (onRoll) {
      onRoll(`🎲 Hit Die Level-Up Roll (d${hitDieMeta.dieType} + ${conMod} CON)`, hitDieMeta.dieType, 1, conMod, 'normal');
    }
  };

  const handleApplyLevelUp = () => {
    let updatedAbilities = { ...character.abilities };
    let updatedFeats = [...(character.feats || [])];

    // Apply ASI or Feat if applicable
    if (isAsiLevel) {
      if (progressionChoice === 'asi') {
        if (selectedAsiType === 'plusTwo') {
          updatedAbilities[asiSingleStat] = {
            ...updatedAbilities[asiSingleStat],
            score: Math.min(20, updatedAbilities[asiSingleStat].score + 2)
          };
        } else {
          updatedAbilities[asiDoubleStat1] = {
            ...updatedAbilities[asiDoubleStat1],
            score: Math.min(20, updatedAbilities[asiDoubleStat1].score + 1)
          };
          updatedAbilities[asiDoubleStat2] = {
            ...updatedAbilities[asiDoubleStat2],
            score: Math.min(20, updatedAbilities[asiDoubleStat2].score + 1)
          };
        }
      } else {
        const featData = SRD_FEATS.find(f => f.name === selectedFeat);
        if (featData) {
          updatedFeats.push({
            id: `feat-${Date.now()}`,
            name: featData.name,
            description: featData.description,
            hpMaxBonus: featData.hpMaxBonus,
            source: `Level ${targetLevel}`
          });
        }
      }
    }

    // Auto add level milestone feature
    const updatedFeatures: ClassFeature[] = [...character.classFeatures];
    const levelMeta = DND_5E_LEVEL_TABLE.find(e => e.level === targetLevel);
    if (levelMeta && levelMeta.notes) {
      updatedFeatures.push({
        id: `feature-lvl-${targetLevel}-${Date.now()}`,
        name: `Level ${targetLevel} Milestone: ${levelMeta.notes}`,
        source: `${character.characterClass} ${targetLevel}`,
        description: `Unlocked upon reaching Level ${targetLevel}.`
      });
    }

    const updatedCharacter: CharacterData = {
      ...character,
      level: targetLevel,
      hpMax: newMaxHp,
      hpCurrent: character.hpCurrent + hpGained,
      hitDiceTotal: `${targetLevel}d${hitDieMeta.dieType}`,
      hitDiceCurrent: (character.hitDiceCurrent || 0) + 1,
      subclass: character.subclass || selectedSubclass,
      abilities: updatedAbilities,
      feats: updatedFeats,
      classFeatures: updatedFeatures
    };

    playLevelUpSound();
    onUpdateCharacter(updatedCharacter);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-950 border border-amber-500/50 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-purple-950 px-5 py-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold shadow-lg">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-200">
                Level-Up Progression Wizard
              </h2>
              <p className="text-xs text-amber-400/80 font-mono">
                {character.name} — Level {currentLevel} ➔ <span className="text-emerald-400 font-bold">Level {targetLevel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-around bg-stone-900/90 border-b border-stone-800 px-4 py-2 text-xs font-mono">
          <span className={step === 1 ? 'text-amber-400 font-bold' : 'text-stone-500'}>1. Hit Points</span>
          <span>➔</span>
          {isAsiLevel && (
            <>
              <span className={step === 2 ? 'text-amber-400 font-bold' : 'text-stone-500'}>2. ASI / Feat</span>
              <span>➔</span>
            </>
          )}
          {!character.subclass && (
            <>
              <span className={step === 3 ? 'text-amber-400 font-bold' : 'text-stone-500'}>3. Subclass</span>
              <span>➔</span>
            </>
          )}
          <span className={step === 4 ? 'text-emerald-400 font-bold' : 'text-stone-500'}>Review & Confirm</span>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Hit Points & Hit Die */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>Hit Point Increase (Class Hit Die: d{hitDieMeta.dieType})</span>
                </div>
                <p className="text-xs text-stone-400">
                  Choose how to determine your additional Maximum HP for Level {targetLevel}. (CON modifier: {formatModifier(conMod)})
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setHpMethod('average')}
                    className={`p-3 rounded-xl border text-left transition ${
                      hpMethod === 'average'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-100'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Standard Average</span>
                      <span className="text-emerald-400">+{hitDieMeta.averageHp + conMod} HP</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Fixed calculation: {hitDieMeta.averageHp} + {conMod} CON = +{hitDieMeta.averageHp + conMod}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHpMethod('rolled');
                      if (rolledHpDie === null) handleRollHitDie();
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      hpMethod === 'rolled'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-100'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Roll Hit Die (1d{hitDieMeta.dieType})</span>
                      <span className="text-purple-400">+{hpGained} HP</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      {rolledHpDie !== null ? `Rolled ${rolledHpDie} + ${conMod} CON` : 'Click to roll'}
                    </div>
                  </button>
                </div>

                {hpMethod === 'rolled' && (
                  <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-purple-800/40">
                    <div className="text-xs text-purple-300">
                      Rolled: <strong className="text-lg text-purple-100">{rolledHpDie || '?'}</strong> (d{hitDieMeta.dieType}) + {conMod} CON = <strong className="text-emerald-400">+{hpGained} HP</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleRollHitDie}
                      className="bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
                    >
                      <Dices className="w-4 h-4" />
                      <span>Reroll Die</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Proficiency Bonus Check */}
              <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300">Proficiency Bonus</div>
                  <div className="text-[11px] text-stone-400">Scales automatically across all saving throws, skills, and attack bonuses.</div>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-400">
                  {formatModifier(oldProfBonus)} ➔ {formatModifier(newProfBonus)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ASI or Feat (if applicable) */}
          {step === 2 && isAsiLevel && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-stone-900 p-1 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setProgressionChoice('asi')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                    progressionChoice === 'asi'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Ability Score Improvement (ASI)
                </button>
                <button
                  type="button"
                  onClick={() => setProgressionChoice('feat')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                    progressionChoice === 'feat'
                      ? 'bg-purple-600 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Select Feat
                </button>
              </div>

              {progressionChoice === 'asi' ? (
                <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-300">Choose ASI Distribution:</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAsiType('plusTwo')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedAsiType === 'plusTwo' ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}
                    >
                      +2 to One Stat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAsiType('plusOneOne')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedAsiType === 'plusOneOne' ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}
                    >
                      +1 to Two Stats
                    </button>
                  </div>

                  {selectedAsiType === 'plusTwo' ? (
                    <div className="space-y-1">
                      <label className="text-xs text-stone-400">Select Ability Score (+2):</label>
                      <select
                        value={asiSingleStat}
                        onChange={(e) => setAsiSingleStat(e.target.value as AbilityName)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-amber-200 font-mono"
                      >
                        {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(a => (
                          <option key={a} value={a}>{a} (Current: {character.abilities[a].score} ➔ {Math.min(20, character.abilities[a].score + 2)})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-stone-400">First Stat (+1):</label>
                        <select
                          value={asiDoubleStat1}
                          onChange={(e) => setAsiDoubleStat1(e.target.value as AbilityName)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-amber-200 font-mono"
                        >
                          {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(a => (
                            <option key={a} value={a}>{a} (+1)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-stone-400">Second Stat (+1):</label>
                        <select
                          value={asiDoubleStat2}
                          onChange={(e) => setAsiDoubleStat2(e.target.value as AbilityName)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-amber-200 font-mono"
                        >
                          {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(a => (
                            <option key={a} value={a}>{a} (+1)</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {SRD_FEATS.map((f) => (
                    <div
                      key={f.name}
                      onClick={() => setSelectedFeat(f.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedFeat === f.name
                          ? 'bg-purple-950/70 border-purple-500 text-purple-100'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-purple-300 flex items-center justify-between">
                        <span>{f.name}</span>
                        {selectedFeat === f.name && <CheckCircle className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Subclass (if not chosen) */}
          {step === 3 && !character.subclass && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-300">Choose Your Class Archetype / Subclass:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSubclasses.map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setSelectedSubclass(sc)}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedSubclass === sc
                        ? 'bg-amber-950/70 border-amber-500 text-amber-100'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="font-bold text-xs text-amber-200">{sc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-3 bg-stone-900/60 border border-stone-800 p-4 rounded-xl text-xs">
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Level-Up Summary</span>
              </div>

              <div className="space-y-1.5 font-mono text-stone-300 pt-2 border-t border-stone-800">
                <div className="flex justify-between">
                  <span className="text-stone-400">New Level:</span>
                  <strong className="text-amber-300">Level {targetLevel}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Max Hit Points:</span>
                  <strong className="text-emerald-400">{character.hpMax} ➔ {newMaxHp} (+{hpGained})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Hit Dice:</span>
                  <span>{targetLevel}d{hitDieMeta.dieType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Proficiency Bonus:</span>
                  <span>{formatModifier(newProfBonus)}</span>
                </div>
                {isAsiLevel && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Progression Choice:</span>
                    <span className="text-purple-300 font-bold">
                      {progressionChoice === 'asi'
                        ? (selectedAsiType === 'plusTwo' ? `+2 ${asiSingleStat}` : `+1 ${asiDoubleStat1}, +1 ${asiDoubleStat2}`)
                        : `Feat: ${selectedFeat}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-stone-900/90 px-5 py-3 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(Math.max(1, step - 1))}
            className="px-3 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:text-stone-200 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !isAsiLevel && character.subclass) setStep(4);
                else if (step === 1 && isAsiLevel) setStep(2);
                else if (step === 2 && !character.subclass) setStep(3);
                else setStep(4);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-lg transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyLevelUp}
              className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold px-5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition animate-pulse"
            >
              <Crown className="w-4 h-4" />
              <span>Complete Level Up!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
