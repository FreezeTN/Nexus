import React, { useState } from 'react';
import { CharacterData, AbilityName } from '../../types';
import {
  DND_5E_LEVEL_TABLE,
  getXpProgressDetails,
  getClassHitDie,
  getLevelFromTotalXp,
  getMinXpForLevel,
  getNextLevelXpThreshold
} from '../../data/levelProgressionData';
import { getAbilityModifier, formatModifier, getProficiencyBonus, getCombinedLevel, getActiveClassChoice, getPrimaryXp, getSecondaryXp, getUnallocatedXp } from '../../utils/dndCalculations';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';
import { playLevelUpSound } from '../../utils/diceAudio';
import { syncClassFeaturesForCharacter } from '../../data/srdRulesLibrary';
import {
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  ChevronRight,
  Shield,
  Dices,
  Info,
  ArrowUpRight,
  HelpCircle,
  Star
} from 'lucide-react';

interface LevelProgressionModalProps {
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const LevelProgressionModal: React.FC<LevelProgressionModalProps> = ({
  character,
  onClose,
  onUpdateCharacter
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'wizard' | 'award'>('table');

  const isDualClass = !!(character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass);
  const activeChoiceInRules = getActiveClassChoice(character);
  const [selectedClassKey, setSelectedClassKey] = useState<'primary' | 'secondary'>(activeChoiceInRules);

  const totalGenXp = character.experiencePoints || 0;
  const primaryXp = getPrimaryXp(character);
  const secondaryXp = getSecondaryXp(character);
  const unallocatedXp = getUnallocatedXp(character);

  const activeClassName = selectedClassKey === 'primary'
    ? character.characterClass
    : (character.optionalRules?.secondaryClass || 'Secondary Class');

  const activeClassLevel = selectedClassKey === 'primary'
    ? character.level
    : (character.optionalRules?.secondaryLevel || 1);

  const activeClassXp = selectedClassKey === 'primary'
    ? (isDualClass ? primaryXp : totalGenXp)
    : secondaryXp;

  // XP Progress Calculations for Selected Class
  const xpDetails = getXpProgressDetails(activeClassXp, activeClassLevel);
  const calculatedLevelFromXp = getLevelFromTotalXp(activeClassXp);

  // Wizard State
  const [targetLevel, setTargetLevel] = useState<number>(() => Math.min(20, activeClassLevel + 1));
  const [hpMethod, setHpMethod] = useState<'average' | 'roll'>('average');
  const [rolledHpDie, setRolledHpDie] = useState<number | null>(null);
  const [customHpGain, setCustomHpGain] = useState<number | null>(null);

  // Switch selected class
  const handleSelectClass = (key: 'primary' | 'secondary') => {
    setSelectedClassKey(key);
    const lvl = key === 'primary' ? character.level : (character.optionalRules?.secondaryLevel || 1);
    setTargetLevel(Math.min(20, lvl + 1));
    setRolledHpDie(null);
  };

  const handleToggleActiveClassInRules = (key: 'primary' | 'secondary') => {
    handleSelectClass(key);
    onUpdateCharacter({
      ...character,
      optionalRules: {
        ...character.optionalRules,
        activeClassChoice: key
      }
    });
  };

  // Dual-Class XP Allocation Handlers
  const handleAllocateXp = (targetClass: 'primary' | 'secondary', amount: number) => {
    const currentUnallocated = getUnallocatedXp(character);
    const allocAmount = Math.min(amount, currentUnallocated);
    if (allocAmount <= 0) return;

    if (targetClass === 'primary') {
      const currentPx = getPrimaryXp(character);
      const newPx = currentPx + allocAmount;
      const newLvl = getLevelFromTotalXp(newPx);
      const autoLvlUp = newLvl > character.level;

      onUpdateCharacter({
        ...character,
        optionalRules: {
          ...character.optionalRules,
          primaryXp: newPx,
          secondaryXp: getSecondaryXp(character)
        },
        ...(autoLvlUp ? { level: newLvl } : {})
      });

      if (autoLvlUp) {
        setSelectedClassKey('primary');
        setTargetLevel(newLvl);
        setActiveTab('wizard');
      }
    } else {
      const currentSx = getSecondaryXp(character);
      const newSx = currentSx + allocAmount;
      const secLvl = character.optionalRules?.secondaryLevel || 1;
      const newLvl = getLevelFromTotalXp(newSx);
      const autoLvlUp = newLvl > secLvl;

      onUpdateCharacter({
        ...character,
        optionalRules: {
          ...character.optionalRules,
          primaryXp: getPrimaryXp(character),
          secondaryXp: newSx,
          ...(autoLvlUp ? { secondaryLevel: newLvl } : {})
        }
      });

      if (autoLvlUp) {
        setSelectedClassKey('secondary');
        setTargetLevel(newLvl);
        setActiveTab('wizard');
      }
    }
  };

  const handleSplitUnallocatedEqually = () => {
    const currentUnallocated = getUnallocatedXp(character);
    if (currentUnallocated <= 0) return;
    const half = Math.floor(currentUnallocated / 2);
    const remainder = currentUnallocated - half * 2;

    const currentPx = getPrimaryXp(character);
    const currentSx = getSecondaryXp(character);

    const newPx = currentPx + half + remainder;
    const newSx = currentSx + half;

    const pLvl = getLevelFromTotalXp(newPx);
    const sLvl = getLevelFromTotalXp(newSx);

    onUpdateCharacter({
      ...character,
      optionalRules: {
        ...character.optionalRules,
        primaryXp: newPx,
        secondaryXp: newSx,
        ...(sLvl > (character.optionalRules?.secondaryLevel || 1) ? { secondaryLevel: sLvl } : {})
      },
      ...(pLvl > character.level ? { level: pLvl } : {})
    });
  };

  // ASI State
  const [selectedAsiType, setSelectedAsiType] = useState<'ability' | 'feat'>('ability');
  const [asiBoosts, setAsiBoosts] = useState<Record<AbilityName, number>>({
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0
  });
  const [selectedFeatName, setSelectedFeatName] = useState('');
  const [selectedFeatDesc, setSelectedFeatDesc] = useState('');

  // Quick Award State
  const [awardAmount, setAwardAmount] = useState<number>(500);
  const [awardReason, setAwardReason] = useState<string>('Encounter Victory');

  const hitDieMeta = getClassHitDie(activeClassName);
  const conMod = getAbilityModifier(character.abilities.CON?.score || 10);
  const averageGainPerLevel = Math.max(1, hitDieMeta.averageHp + conMod);

  const isAsiLevel = [4, 8, 12, 16, 19].includes(targetLevel);
  const totalAsiPointsUsed = (Object.values(asiBoosts) as number[]).reduce((acc: number, val: number) => acc + val, 0);

  const handleRollHp = () => {
    const rolled = Math.floor(Math.random() * hitDieMeta.dieType) + 1;
    setRolledHpDie(rolled);
  };

  const getEffectiveHpGain = () => {
    if (customHpGain !== null) return customHpGain;
    if (hpMethod === 'roll' && rolledHpDie !== null) {
      return Math.max(1, rolledHpDie + conMod);
    }
    return averageGainPerLevel;
  };

  const handleApplyLevelUp = () => {
    playLevelUpSound();
    const hpGain = getEffectiveHpGain();
    const newMaxHp = character.hpMax + hpGain;
    const newCurrentHp = character.hpCurrent + hpGain;
    const newHitDiceTotal = `${targetLevel}d${hitDieMeta.dieType}`;

    let updatedAbilities = { ...character.abilities };
    if (isAsiLevel && selectedAsiType === 'ability') {
      (Object.keys(asiBoosts) as AbilityName[]).forEach((ab) => {
        const bonus = asiBoosts[ab];
        if (bonus > 0) {
          updatedAbilities[ab] = {
            ...updatedAbilities[ab],
            score: (updatedAbilities[ab]?.score || 10) + bonus
          };
        }
      });
    }

    let updatedFeats = [...character.feats];
    if (isAsiLevel && selectedAsiType === 'feat' && selectedFeatName.trim()) {
      updatedFeats.push({
        id: 'feat-' + Date.now(),
        name: selectedFeatName.trim(),
        description: selectedFeatDesc.trim() || `Custom feat unlocked at Level ${targetLevel} (${activeClassName})`
      });
    }

    const minXpNeeded = getMinXpForLevel(targetLevel);

    if (selectedClassKey === 'secondary') {
      const currentSecXp = getSecondaryXp(character);
      const newSecXp = Math.max(currentSecXp, minXpNeeded);
      const pXp = getPrimaryXp(character);
      const newGenXp = Math.max(character.experiencePoints || 0, newSecXp + pXp);

      const updatedChar: CharacterData = {
        ...character,
        hpMax: newMaxHp,
        hpCurrent: newCurrentHp,
        hitDiceTotal: newHitDiceTotal,
        abilities: updatedAbilities,
        feats: updatedFeats,
        experiencePoints: newGenXp,
        optionalRules: {
          ...character.optionalRules,
          secondaryLevel: targetLevel,
          secondaryXp: newSecXp,
          primaryXp: pXp
        }
      };

      const syncedChar = syncClassFeaturesForCharacter(updatedChar, activeClassName, targetLevel, character.edition);
      onUpdateCharacter(syncedChar);
      alert(`🎉 Level Up Complete! ${character.name}'s ${activeClassName} is now Level ${targetLevel}! (+${hpGain} Max HP)`);
    } else {
      const currentPriXp = getPrimaryXp(character);
      const newPriXp = Math.max(currentPriXp, minXpNeeded);
      const sXp = isDualClass ? getSecondaryXp(character) : 0;
      const newGenXp = Math.max(character.experiencePoints || 0, newPriXp + sXp);

      const updatedChar: CharacterData = {
        ...character,
        level: targetLevel,
        hpMax: newMaxHp,
        hpCurrent: newCurrentHp,
        hitDiceTotal: newHitDiceTotal,
        hitDiceCurrent: Math.min(targetLevel, character.hitDiceCurrent + 1),
        experiencePoints: newGenXp,
        abilities: updatedAbilities,
        feats: updatedFeats,
        ...(isDualClass ? {
          optionalRules: {
            ...character.optionalRules,
            primaryXp: newPriXp,
            secondaryXp: sXp
          }
        } : {})
      };

      const syncedChar = syncClassFeaturesForCharacter(updatedChar, character.characterClass, targetLevel, character.edition);
      onUpdateCharacter(syncedChar);
      alert(`🎉 Level Up Complete! ${character.name}'s ${activeClassName} is now Level ${targetLevel}! (+${hpGain} Max HP)`);
    }
    onClose();
  };

  const handleAwardXp = (amount: number) => {
    const newTotalGenXp = (character.experiencePoints || 0) + amount;

    if (!isDualClass) {
      const newCalculatedLevel = getLevelFromTotalXp(newTotalGenXp);
      const autoLevelUp = newCalculatedLevel > character.level;

      onUpdateCharacter({
        ...character,
        experiencePoints: newTotalGenXp,
        ...(autoLevelUp ? { level: newCalculatedLevel } : {})
      });

      if (autoLevelUp) {
        setTargetLevel(newCalculatedLevel);
        setActiveTab('wizard');
      }
    } else {
      // General XP for dual classing (unallocated until spent)
      onUpdateCharacter({
        ...character,
        experiencePoints: newTotalGenXp
      });
    }
  };

  const portraitUrl = character.portraitUrl || (character.isMonster ? getMonsterPortraitUrl(character.name, character.id) : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-stone-950 border-b border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={character.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-600/60 flex items-center justify-center text-amber-300 font-serif font-bold text-2xl shrink-0">
                {character.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-serif font-bold text-amber-200">
                  {character.name}
                </h3>
                {isDualClass ? (
                  <span className="text-xs bg-amber-900/80 text-amber-200 border border-amber-400/60 font-mono font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Combined Level {getCombinedLevel(character)}
                  </span>
                ) : (
                  <span className="text-xs bg-amber-950 text-amber-300 border border-amber-600/50 font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Level {character.level} {character.characterClass}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                D&D 5e Character Advancement • Viewing: <strong className="text-amber-300 font-mono">{activeClassName} (Lv. {activeClassLevel})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {xpDetails.canLevelUp && (
              <button
                onClick={() => {
                  setTargetLevel(calculatedLevelFromXp);
                  setActiveTab('wizard');
                }}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>Level Up Available! ({activeClassName} Lv {calculatedLevelFromXp})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-xl border border-stone-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Class XP Pool & Allocator Banner */}
        {isDualClass && (
          <div className="bg-stone-950/95 border-b border-stone-800 p-4 px-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-serif font-bold text-amber-200">Dual Class XP Pool:</span>
                <span className="text-xs font-mono text-stone-300 bg-stone-900 border border-stone-700 px-2 py-0.5 rounded-lg">
                  General XP: <strong className="text-amber-300">{totalGenXp.toLocaleString()} XP</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                  unallocatedXp > 0
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 animate-pulse'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}>
                  Unallocated XP: {unallocatedXp.toLocaleString()} XP
                </span>

                {unallocatedXp > 0 && (
                  <button
                    onClick={handleSplitUnallocatedEqually}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Split 50/50</span>
                  </button>
                )}
              </div>
            </div>

            {/* Class Cards with XP Allocation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Primary Class Card */}
              <div className={`p-3 rounded-xl border transition ${
                selectedClassKey === 'primary' ? 'bg-amber-950/30 border-amber-500/60' : 'bg-stone-900/60 border-stone-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => handleSelectClass('primary')}
                    className="text-xs font-bold font-serif text-amber-300 hover:underline flex items-center gap-1.5"
                  >
                    <span>{character.characterClass} (Lv. {character.level})</span>
                    {selectedClassKey === 'primary' && <span className="text-[10px] bg-amber-500 text-stone-950 font-sans px-1.5 py-0.2 rounded font-extrabold">SELECTED</span>}
                  </button>
                  <span className="text-xs font-mono font-bold text-stone-200">
                    {primaryXp.toLocaleString()} XP Allocated
                  </span>
                </div>

                {unallocatedXp > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-stone-800/80">
                    <span className="text-[10px] text-stone-400 font-mono">Spend XP:</span>
                    {[100, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        disabled={unallocatedXp < amt}
                        onClick={() => handleAllocateXp('primary', amt)}
                        className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40 rounded text-[10px] font-mono font-bold disabled:opacity-30 transition"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      disabled={unallocatedXp <= 0}
                      onClick={() => handleAllocateXp('primary', unallocatedXp)}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded text-[10px] font-mono font-extrabold disabled:opacity-30 transition"
                    >
                      All ({unallocatedXp.toLocaleString()})
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Class Card */}
              <div className={`p-3 rounded-xl border transition ${
                selectedClassKey === 'secondary' ? 'bg-amber-950/30 border-amber-500/60' : 'bg-stone-900/60 border-stone-800'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => handleSelectClass('secondary')}
                    className="text-xs font-bold font-serif text-amber-300 hover:underline flex items-center gap-1.5"
                  >
                    <span>{character.optionalRules?.secondaryClass || 'Secondary'} (Lv. {character.optionalRules?.secondaryLevel || 1})</span>
                    {selectedClassKey === 'secondary' && <span className="text-[10px] bg-amber-500 text-stone-950 font-sans px-1.5 py-0.2 rounded font-extrabold">SELECTED</span>}
                  </button>
                  <span className="text-xs font-mono font-bold text-stone-200">
                    {secondaryXp.toLocaleString()} XP Allocated
                  </span>
                </div>

                {unallocatedXp > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-stone-800/80">
                    <span className="text-[10px] text-stone-400 font-mono">Spend XP:</span>
                    {[100, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        disabled={unallocatedXp < amt}
                        onClick={() => handleAllocateXp('secondary', amt)}
                        className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/40 rounded text-[10px] font-mono font-bold disabled:opacity-30 transition"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      disabled={unallocatedXp <= 0}
                      onClick={() => handleAllocateXp('secondary', unallocatedXp)}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded text-[10px] font-mono font-extrabold disabled:opacity-30 transition"
                    >
                      All ({unallocatedXp.toLocaleString()})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Level XP Quick Progress Bar */}
        <div className="bg-stone-950/90 border-b border-stone-800 p-4 px-6">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-stone-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> {activeClassName} Next Level Threshold (Level {activeClassLevel + 1}):
            </span>
            <span className="text-amber-300 font-bold">
              {activeClassXp.toLocaleString()} / {xpDetails.nextLevelXp ? xpDetails.nextLevelXp.toLocaleString() : 'MAX'} XP
              {xpDetails.nextLevelXp ? ` (${xpDetails.percentage}%)` : ''}
            </span>
          </div>
          <div className="w-full h-3 bg-stone-900 rounded-full border border-stone-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 rounded-full shadow"
              style={{ width: `${xpDetails.percentage}%` }}
            />
          </div>
          {xpDetails.nextLevelXp && (
            <div className="flex justify-between items-center text-[11px] text-stone-400 mt-1 font-mono">
              <span>Current Level Min: {xpDetails.currentMinXp.toLocaleString()} XP</span>
              <span className="text-amber-300 font-semibold">
                {xpDetails.neededForNext > 0 ? `${xpDetails.neededForNext.toLocaleString()} XP remaining for ${activeClassName} level up` : 'Threshold reached!'}
              </span>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-3 font-serif font-bold text-xs transition border-b-2 flex items-center gap-2 ${
              activeTab === 'table'
                ? 'border-amber-500 text-amber-300 bg-stone-900/40 rounded-t-xl'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Advancement Table (1–20)
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-4 py-3 font-serif font-bold text-xs transition border-b-2 flex items-center gap-2 relative ${
              activeTab === 'wizard'
                ? 'border-amber-500 text-amber-300 bg-stone-900/40 rounded-t-xl'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Level Up Wizard
            {xpDetails.canLevelUp && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('award')}
            className={`px-4 py-3 font-serif font-bold text-xs transition border-b-2 flex items-center gap-2 ${
              activeTab === 'award'
                ? 'border-amber-500 text-amber-300 bg-stone-900/40 rounded-t-xl'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            Award XP & Calculator
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: ADVANCEMENT TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800">
                <div>
                  <h4 className="font-serif font-bold text-sm text-stone-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" /> D&D 5e Official Character Advancement Table
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Defines total XP thresholds, step sizes, relative progress percentages, and proficiency bonus scaling.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newXp = getMinXpForLevel(calculatedLevelFromXp);
                      onUpdateCharacter({ ...character, experiencePoints: newXp, level: calculatedLevelFromXp });
                    }}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Sync Level to XP (Lv {calculatedLevelFromXp})</span>
                  </button>
                </div>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto border border-stone-800 rounded-2xl bg-stone-950/60 shadow-inner">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-serif font-bold">
                      <th className="p-3 text-center">Level</th>
                      <th className="p-3">Experience Points</th>
                      <th className="p-3">XP to Next Level</th>
                      <th className="p-3">Relative % Exp. to Progress</th>
                      <th className="p-3 text-center">Proficiency Bonus</th>
                      <th className="p-3">Milestone Features & Benefits</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {DND_5E_LEVEL_TABLE.map((row) => {
                      const isCurrentLevel = row.level === character.level;
                      const isTargetLevel = row.level === calculatedLevelFromXp;

                      return (
                        <tr
                          key={row.level}
                          className={`transition ${
                            isCurrentLevel
                              ? 'bg-amber-950/70 border-l-4 border-l-amber-500 font-bold text-amber-200'
                              : isTargetLevel
                              ? 'bg-emerald-950/40 text-emerald-200'
                              : 'hover:bg-stone-900/60 text-stone-300'
                          }`}
                        >
                          <td className="p-3 text-center font-bold">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                              isCurrentLevel ? 'bg-amber-500 text-stone-950 shadow' : 'bg-stone-800 text-stone-300'
                            }`}>
                              {row.level}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-amber-300">
                            {row.totalXp.toLocaleString()} XP
                          </td>
                          <td className="p-3 text-stone-300">
                            {row.xpToNextLevel ? `${row.xpToNextLevel.toLocaleString()} XP` : 'MAX'}
                          </td>
                          <td className="p-3 text-stone-400">
                            {row.relativePercentageIncrease !== null ? `${row.relativePercentageIncrease.toFixed(1)}%` : '—'}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-400">
                            +{row.proficiencyBonus}
                          </td>
                          <td className="p-3 font-sans text-stone-300 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {row.asiOrFeat && (
                                <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] rounded font-mono font-bold">
                                  ASI / Feat
                                </span>
                              )}
                              <span>{row.notes}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {isCurrentLevel ? (
                              <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded uppercase font-mono shadow">
                                CURRENT
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setTargetLevel(row.level);
                                  setActiveTab('wizard');
                                }}
                                className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 rounded text-[11px] font-sans font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LEVEL UP WIZARD */}
          {activeTab === 'wizard' && (
            <div className="space-y-6">
              <div className="bg-stone-950/90 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" /> Interactive Character Advancement Assistant
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Advance {character.name} from Level {character.level} to Level {targetLevel}.
                    </p>
                  </div>

                  {/* Level Selector */}
                  <div className="flex items-center gap-2 bg-stone-900 p-1.5 rounded-xl border border-stone-800">
                    <span className="text-xs font-serif font-bold text-stone-400 px-2">Target Level:</span>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(parseInt(e.target.value) || character.level + 1)}
                      className="bg-stone-950 text-amber-300 font-mono font-bold text-sm px-3 py-1 rounded-lg border border-amber-600/50"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl} {lvl === character.level ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 1: Hit Points Advancement */}
                <div className="space-y-3 bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif font-bold text-sm text-stone-200 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" /> 1. Hit Point Increase ({character.characterClass} Hit Die: d{hitDieMeta.dieType})
                    </h5>
                    <span className="text-xs font-mono text-amber-300">CON Modifier: {formatModifier(conMod)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Take Average */}
                    <button
                      onClick={() => setHpMethod('average')}
                      className={`p-4 rounded-xl border text-left transition space-y-1 ${
                        hpMethod === 'average'
                          ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/50 text-amber-200'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-serif font-bold text-xs">
                        <span>Take Class Average</span>
                        <span className="font-mono text-amber-300">+{averageGainPerLevel} HP</span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Average ({hitDieMeta.averageHp}) + CON mod ({formatModifier(conMod)}) = +{averageGainPerLevel} Max HP
                      </p>
                    </button>

                    {/* Roll Hit Die */}
                    <div
                      onClick={() => setHpMethod('roll')}
                      className={`p-4 rounded-xl border text-left transition space-y-2 cursor-pointer ${
                        hpMethod === 'roll'
                          ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/50 text-amber-200'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-serif font-bold text-xs">
                        <span className="flex items-center gap-1">
                          <Dices className="w-4 h-4 text-amber-400" /> Roll Hit Die (1d{hitDieMeta.dieType})
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHpMethod('roll');
                            handleRollHp();
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded text-[11px] transition shadow"
                        >
                          Roll 1d{hitDieMeta.dieType}
                        </button>
                      </div>

                      {rolledHpDie !== null ? (
                        <p className="text-xs font-mono text-amber-300 font-bold">
                          Rolled: [{rolledHpDie}] + CON ({formatModifier(conMod)}) = +{Math.max(1, rolledHpDie + conMod)} Max HP
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-400">
                          Click to roll 1d{hitDieMeta.dieType} + CON modifier.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                    <span className="text-stone-400">Calculated HP Gain:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      Current Max: {character.hpMax} HP ➔ New Max: {character.hpMax + getEffectiveHpGain()} HP (+{getEffectiveHpGain()})
                    </span>
                  </div>
                </div>

                {/* Step 2: Proficiency Bonus Updates */}
                <div className="p-4 bg-stone-900/60 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-serif font-bold text-stone-200">2. Proficiency Bonus Scaling</h5>
                    <p className="text-stone-400 mt-0.5">Calculated automatically for Level {targetLevel}</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-stone-400">Level {character.level}: +{getProficiencyBonus(character.level)}</span>
                    <span className="mx-2 text-stone-600">➔</span>
                    <span className="text-amber-300 font-bold text-sm">Level {targetLevel}: +{getProficiencyBonus(targetLevel)}</span>
                  </div>
                </div>

                {/* Step 3: Ability Score Improvement (ASI) or Feat */}
                {isAsiLevel && (
                  <div className="space-y-4 bg-stone-900/80 p-5 rounded-xl border border-amber-500/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-serif font-bold text-sm text-amber-200 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" /> 3. Level {targetLevel} Ability Score Improvement (ASI) / Feat
                        </h5>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Choose either +2 to one ability score (or +1 to two scores), or gain a Feat.
                        </p>
                      </div>

                      {/* Toggle ASI vs Feat */}
                      <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                        <button
                          onClick={() => setSelectedAsiType('ability')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            selectedAsiType === 'ability' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          Ability Scores (+2)
                        </button>
                        <button
                          onClick={() => setSelectedAsiType('feat')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            selectedAsiType === 'feat' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          Select Feat
                        </button>
                      </div>
                    </div>

                    {selectedAsiType === 'ability' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-400">Points Allocated:</span>
                          <span className={`font-bold ${totalAsiPointsUsed === 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {totalAsiPointsUsed} / 2 Points
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map((ab) => {
                            const score = character.abilities[ab]?.score || 10;
                            const bonus = asiBoosts[ab];

                            return (
                              <div key={ab} className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center space-y-2">
                                <span className="text-xs font-serif font-bold text-stone-300 block">{ab}</span>
                                <div className="text-base font-mono font-bold text-amber-300">
                                  {score} {bonus > 0 ? <span className="text-emerald-400">(+{bonus})</span> : ''}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      if (bonus > 0) {
                                        setAsiBoosts(prev => ({ ...prev, [ab]: prev[ab] - 1 }));
                                      }
                                    }}
                                    disabled={bonus <= 0}
                                    className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200 font-bold"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (totalAsiPointsUsed < 2) {
                                        setAsiBoosts(prev => ({ ...prev, [ab]: prev[ab] + 1 }));
                                      }
                                    }}
                                    disabled={totalAsiPointsUsed >= 2 || score + bonus >= 20}
                                    className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-stone-950 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Feat Title</label>
                          <input
                            type="text"
                            placeholder="e.g., War Caster, Great Weapon Master, Sentinel, Sharpshooter..."
                            value={selectedFeatName}
                            onChange={(e) => setSelectedFeatName(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Feat Benefits & Description</label>
                          <textarea
                            rows={2}
                            placeholder="Enter feat mechanical benefits..."
                            value={selectedFeatDesc}
                            onChange={(e) => setSelectedFeatDesc(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Apply Button */}
                <div className="pt-4 border-t border-stone-800 flex justify-end">
                  <button
                    onClick={handleApplyLevelUp}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold rounded-2xl shadow-xl shadow-amber-500/20 text-sm transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm Level Up to Level {targetLevel}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AWARD XP */}
          {activeTab === 'award' && (
            <div className="space-y-6">
              <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div>
                  <h4 className="font-serif font-bold text-base text-amber-200 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" /> Award Experience Points (XP)
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Grant XP earned from combat encounters, quest rewards, roleplay milestones, or DM awards.
                  </p>
                </div>

                {/* Quick Add Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-serif font-bold text-stone-300">Quick XP Presets:</label>
                  <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 1000, 2500, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAwardXp(amt)}
                        className="px-3 py-2 bg-stone-900 hover:bg-amber-600 hover:text-stone-950 border border-stone-700 hover:border-amber-400 text-amber-300 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>+{amt.toLocaleString()} XP</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom XP Award Input */}
                <div className="pt-4 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Custom XP Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={awardAmount}
                      onChange={(e) => setAwardAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-sm"
                    />
                  </div>
                  <div className="self-end">
                    <button
                      onClick={() => handleAwardXp(awardAmount)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Award {awardAmount.toLocaleString()} XP</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
