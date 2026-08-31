import React, { useState, useMemo, useEffect } from 'react';
import {
  CharacterData,
  RuleEdition,
  Attack,
  Spell
} from '../../types';
import {
  Shield,
  Zap,
  Sparkles,
  Heart,
  HeartPulse,
  Flame,
  Moon,
  Swords,
  Wand2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  RotateCcw,
  Sliders,
  ChevronRight,
  Maximize2,
  Minimize2,
  Dices,
  AlertCircle,
  Eye,
  Brain,
  Award,
  Activity,
  FileText,
  Clock,
  Radio,
  Search,
  Check,
  X,
  ExternalLink,
  Crown,
  Coffee,
  Skull
} from 'lucide-react';
import {
  getEffectiveMaxHp,
  getArmorClassBreakdown,
  getEffectiveSpeed,
  getProficiencyBonus,
  getPassivePerception,
  formatModifier,
  getAbilityModifier,
  getSkillBonus,
  getEffectiveAbilities,
  isCharacterDead,
  getSpellSaveDC,
  getSpellAttackBonus
} from '../../utils/dndCalculations';
import { DND_CONDITIONS } from '../../data/conditionsData';
import { RestModal } from '../combat/RestModal';
import { HpOrb, getHpColorClass } from '../HpOrb';
import { useLanguage } from '../../i18n/LanguageContext';

export interface TableCustomResource {
  id: string;
  name: string;
  current: number;
  max: number;
  resetOn: 'short' | 'long';
}

interface TableModeHudProps {
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  onRollInitiative: () => void;
  onExitTableMode: () => void;
  onOpenCombatTracker?: () => void;
  onOpenCopilot?: () => void;
  onOpenCampaignAtlas?: () => void;
  onOpenAudioSettings?: () => void;
}

type TableTab = 'attacks' | 'spells' | 'powers' | 'conditions' | 'skills' | 'notes';

export const TableModeHud: React.FC<TableModeHudProps> = ({
  character,
  edition = '5e',
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  onRollInitiative,
  onExitTableMode,
  onOpenCombatTracker,
  onOpenCopilot,
  onOpenCampaignAtlas,
  onOpenAudioSettings
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TableTab>('attacks');
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [hpDelta, setHpDelta] = useState<string>('');
  const [showRestModal, setShowRestModal] = useState<'short' | 'long' | null>(null);
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [spellSearch, setSpellSearch] = useState<string>('');
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number | 'all'>('all');
  const [showAddAttack, setShowAddAttack] = useState<boolean>(false);
  const [showAddResource, setShowAddResource] = useState<boolean>(false);

  // New attack local inputs
  const [newAtkName, setNewAtkName] = useState('');
  const [newAtkBonus, setNewAtkBonus] = useState(5);
  const [newAtkDamage, setNewAtkDamage] = useState('1d8 + 3');
  const [newAtkType, setNewAtkType] = useState('Slashing');
  const [newAtkRange, setNewAtkRange] = useState('5 ft Melee');

  // New resource input
  const [newResName, setNewResName] = useState('');
  const [newResMax, setNewResMax] = useState(3);
  const [newResReset, setNewResReset] = useState<'short' | 'long'>('long');

  // Calculations
  const effectiveMaxHp = getEffectiveMaxHp(character);
  const effectiveAbilities = getEffectiveAbilities(character);
  const profBonus = getProficiencyBonus(character.level);
  const passivePerception = getPassivePerception(character);
  const passiveInsight = useMemo(() => {
    const insightSkill = character.skills?.find(s => s.name?.toLowerCase().includes('insight'));
    const wisScore = effectiveAbilities.WIS?.score ?? 10;
    const wisMod = getAbilityModifier(wisScore);
    const bonus = insightSkill?.expertise ? profBonus * 2 : insightSkill?.proficient ? profBonus : 0;
    return 10 + wisMod + bonus;
  }, [character.skills, effectiveAbilities, profBonus]);
  const speedInfo = getEffectiveSpeed(character);
  const spellSaveDC = getSpellSaveDC(character);
  const spellAtkBonus = getSpellAttackBonus(character);

  const hpPercent = Math.max(0, Math.min(100, Math.round((character.hpCurrent / Math.max(1, effectiveMaxHp)) * 100)));

  // HP Adjustments
  const handleApplyHpChange = (mode: 'heal' | 'damage') => {
    const val = parseInt(hpDelta, 10);
    if (isNaN(val) || val <= 0) return;
    let newHp = character.hpCurrent;
    let newTemp = character.hpTemp || 0;

    if (mode === 'heal') {
      newHp = Math.min(effectiveMaxHp, newHp + val);
    } else {
      if (newTemp > 0) {
        if (val <= newTemp) {
          newTemp -= val;
        } else {
          const remaining = val - newTemp;
          newTemp = 0;
          newHp = Math.max(0, newHp - remaining);
        }
      } else {
        newHp = Math.max(0, newHp - val);
      }
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      hpTemp: newTemp
    });
    setHpDelta('');
  };

  const handleQuickDelta = (delta: number) => {
    if (delta > 0) {
      const newHp = Math.min(effectiveMaxHp, character.hpCurrent + delta);
      onUpdateCharacter({ ...character, hpCurrent: newHp });
    } else {
      const damage = Math.abs(delta);
      let newHp = character.hpCurrent;
      let newTemp = character.hpTemp || 0;
      if (newTemp > 0) {
        if (damage <= newTemp) {
          newTemp -= damage;
        } else {
          const remaining = damage - newTemp;
          newTemp = 0;
          newHp = Math.max(0, newHp - remaining);
        }
      } else {
        newHp = Math.max(0, newHp - damage);
      }
      onUpdateCharacter({ ...character, hpCurrent: newHp, hpTemp: newTemp });
    }
  };

  // Death Saves
  const deathSavesSuccesses = character.deathSavesSuccesses || 0;
  const deathSavesFailures = character.deathSavesFailures || 0;

  const handleToggleDeathSave = (type: 'success' | 'failure', index: number) => {
    if (type === 'success') {
      const next = (index + 1 === deathSavesSuccesses) ? deathSavesSuccesses - 1 : index + 1;
      onUpdateCharacter({
        ...character,
        deathSavesSuccesses: next
      });
    } else {
      const next = (index + 1 === deathSavesFailures) ? deathSavesFailures - 1 : index + 1;
      onUpdateCharacter({
        ...character,
        deathSavesFailures: next
      });
    }
  };

  const handleRollDeathSave = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    let s = deathSavesSuccesses;
    let f = deathSavesFailures;
    let newHp = character.hpCurrent;

    let msg = `💀 Death Saving Throw: Rolled ${roll}`;
    if (roll === 20) {
      newHp = 1;
      s = 0;
      f = 0;
      msg += ' (NATURAL 20! Regained 1 HP, consciousness restored!)';
    } else if (roll === 1) {
      f = Math.min(3, f + 2);
      msg += ' (NATURAL 1! 2 Failures recorded!)';
    } else if (roll >= 10) {
      s = Math.min(3, s + 1);
      msg += ' (Success!)';
    } else {
      f = Math.min(3, f + 1);
      msg += ' (Failure!)';
    }

    onRollDamage(msg, '1d20');
    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      deathSavesSuccesses: s,
      deathSavesFailures: f
    });
  };

  // Hit Dice Spend
  const handleSpendHitDie = () => {
    if ((character.hitDiceCurrent || 0) <= 0) {
      alert('No Hit Dice remaining! Take a Long Rest to recover Hit Dice.');
      return;
    }
    const hitDieMatch = (character.hitDiceTotal || '1d8').match(/(\d+)d(\d+)/i);
    const dieSides = hitDieMatch ? parseInt(hitDieMatch[2], 10) : 8;
    const conMod = getAbilityModifier(effectiveAbilities.CON?.score ?? 10);
    const roll = Math.floor(Math.random() * dieSides) + 1;
    const healed = Math.max(1, roll + conMod);
    const newHp = Math.min(effectiveMaxHp, character.hpCurrent + healed);
    const newHd = Math.max(0, (character.hitDiceCurrent || 1) - 1);

    onRoll(`Spend Hit Die (1d${dieSides} + ${conMod})`, dieSides, 1, conMod, 'normal');
    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      hitDiceCurrent: newHd
    });
  };

  // Conditions
  const activeConditions = character.conditions || [];
  const handleToggleCondition = (condName: string) => {
    const isPresent = activeConditions.includes(condName);
    const updated = isPresent
      ? activeConditions.filter(c => c !== condName)
      : [...activeConditions, condName];
    onUpdateCharacter({
      ...character,
      conditions: updated
    });
  };

  // Inspiration
  const handleToggleInspiration = () => {
    onUpdateCharacter({
      ...character,
      inspiration: !character.inspiration
    });
  };

  // Spell slot toggle
  const handleToggleSpellSlot = (level: number, slotIndex: number) => {
    const slots = [...(character.spellSlots || [])];
    const targetSlot = slots.find(s => s.level === level);
    if (!targetSlot) return;

    // slotIndex is 0-based index of available slots
    // if clicking on an active slot, decrement current. If clicking used slot, increment.
    const isCurrentlyUsed = slotIndex >= targetSlot.current;
    let nextCurrent = targetSlot.current;
    if (isCurrentlyUsed) {
      nextCurrent = Math.min(targetSlot.max, targetSlot.current + 1);
    } else {
      nextCurrent = Math.max(0, targetSlot.current - 1);
    }

    const updatedSlots = slots.map(s => s.level === level ? { ...s, current: nextCurrent } : s);
    onUpdateCharacter({
      ...character,
      spellSlots: updatedSlots
    });
  };

  // Cast Spell
  const handleCastSpell = (spell: Spell) => {
    if (spell.level > 0) {
      const slots = [...(character.spellSlots || [])];
      const slot = slots.find(s => s.level === spell.level);
      if (slot && slot.current > 0) {
        slot.current -= 1;
        onUpdateCharacter({
          ...character,
          spellSlots: slots
        });
      }
    }

    if (spell.damage) {
      onRollDamage(`✨ Cast ${spell.name} (${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})`, spell.damage);
    } else {
      onRollDamage(`✨ Cast ${spell.name} (${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`})`, '1d20');
    }
  };

  // Custom Resources
  const [customResources, setCustomResources] = useState<TableCustomResource[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_table_res_${character.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { id: 'res-rage', name: 'Rage / Powers', current: 2, max: 2, resetOn: 'long' as const },
      { id: 'res-surge', name: 'Action Surge / Flourish', current: 1, max: 1, resetOn: 'short' as const }
    ];
  });

  const handleUpdateResource = (id: string, delta: number) => {
    setCustomResources(prev => {
      const next = prev.map(r => {
        if (r.id === id) {
          return { ...r, current: Math.max(0, Math.min(r.max, r.current + delta)) };
        }
        return r;
      });
      try {
        localStorage.setItem(`nexus_table_res_${character.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddCustomResource = () => {
    if (!newResName.trim()) return;
    const newRes: TableCustomResource = {
      id: 'res-' + Date.now(),
      name: newResName.trim(),
      current: newResMax,
      max: newResMax,
      resetOn: newResReset
    };
    setCustomResources(prev => {
      const next = [...prev, newRes];
      try {
        localStorage.setItem(`nexus_table_res_${character.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    setNewResName('');
    setShowAddResource(false);
  };

  const handleAddAttack = () => {
    if (!newAtkName.trim()) return;
    const newAttack: Attack = {
      id: 'atk-' + Date.now(),
      name: newAtkName.trim(),
      attackBonus: newAtkBonus,
      damage: newAtkDamage || '1d8 + 3',
      damageType: newAtkType || 'Slashing',
      range: newAtkRange || '5 ft Melee'
    };
    onUpdateCharacter({
      ...character,
      attacks: [...(character.attacks || []), newAttack]
    });
    setNewAtkName('');
    setShowAddAttack(false);
  };

  const abilitiesList = [
    { key: 'STR', name: 'Strength', short: 'STR', score: effectiveAbilities.STR?.score ?? 10 },
    { key: 'DEX', name: 'Dexterity', short: 'DEX', score: effectiveAbilities.DEX?.score ?? 10 },
    { key: 'CON', name: 'Constitution', short: 'CON', score: effectiveAbilities.CON?.score ?? 10 },
    { key: 'INT', name: 'Intelligence', short: 'INT', score: effectiveAbilities.INT?.score ?? 10 },
    { key: 'WIS', name: 'Wisdom', short: 'WIS', score: effectiveAbilities.WIS?.score ?? 10 },
    { key: 'CHA', name: 'Charisma', short: 'CHA', score: effectiveAbilities.CHA?.score ?? 10 }
  ];

  // Filtered Spells
  const filteredSpells = useMemo(() => {
    return (character.spells || []).filter(s => {
      const matchName = s.name.toLowerCase().includes(spellSearch.toLowerCase()) ||
                        (s.school && s.school.toLowerCase().includes(spellSearch.toLowerCase()));
      const matchLevel = selectedSpellLevel === 'all' || s.level === selectedSpellLevel;
      return matchName && matchLevel;
    });
  }, [character.spells, spellSearch, selectedSpellLevel]);

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return (character.skills || []).filter(s => {
      return s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
             s.ability.toLowerCase().includes(skillSearch.toLowerCase());
    });
  }, [character.skills, skillSearch]);

  return (
    <div id="table-mode-hud" className="w-full max-w-[1600px] mx-auto pb-16 space-y-4">
      {/* Top Banner / Tabletop Command Bar */}
      <header className="bg-stone-950/90 border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Character Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {character.portraitUrl ? (
              <img
                src={character.portraitUrl}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/60 shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-950 border-2 border-amber-500/60 flex items-center justify-center text-amber-300 font-bold font-mono text-lg shadow">
                {character.name.charAt(0)}
              </div>
            )}
            {character.inspiration && (
              <span
                className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-950 rounded-full p-0.5 shadow-md animate-pulse"
                title="Inspiration Active!"
              >
                <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-amber-100 font-sans truncate">
                {character.name}
              </h1>
              <span className="bg-stone-900 border border-stone-700 text-amber-300 text-[11px] px-2 py-0.5 rounded-md font-mono font-bold">
                Level {character.level} {character.characterClass}
              </span>
              {character.race && (
                <span className="text-stone-400 text-xs hidden md:inline">
                  • {character.race}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-stone-200">AC {character.armorClass}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-stone-200">Init {formatModifier(character.initiativeBonus || 0)}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-stone-200">{speedInfo.effectiveSpeed} ft</strong>
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Prof <strong className="text-stone-200">+{profBonus}</strong></span>
              </span>
              {character.isSpellcaster && (
                <span className="flex items-center gap-1 text-purple-300 font-mono text-[11px]">
                  <span>DC <strong className="text-purple-200">{spellSaveDC}</strong></span>
                  <span>/</span>
                  <span>Atk <strong className="text-purple-200">+{spellAtkBonus}</strong></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Table Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Inspiration Toggle */}
          <button
            type="button"
            onClick={handleToggleInspiration}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              character.inspiration
                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-amber-500/20 font-black'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-amber-300 hover:border-stone-700'
            }`}
            title="Toggle Heroic Inspiration (Advantage on any roll)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${character.inspiration ? 'fill-stone-950' : ''}`} />
            <span>Inspiration</span>
          </button>

          {/* Quick Short Rest */}
          <button
            type="button"
            onClick={() => setShowRestModal('short')}
            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Take a Short Rest (Spend Hit Dice)"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Short Rest</span>
          </button>

          {/* Quick Long Rest */}
          <button
            type="button"
            onClick={() => setShowRestModal('long')}
            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-purple-500/40 text-stone-300 hover:text-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Take a Long Rest (Full Recovery)"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Long Rest</span>
          </button>

          {/* Combat / Encounter Tracker Quick Jump */}
          {onOpenCombatTracker && (
            <button
              type="button"
              onClick={onOpenCombatTracker}
              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Combat & Initiative Encounter Tracker"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Encounter Tracker</span>
            </button>
          )}

          {/* Live Co-Pilot HUD Drawer */}
          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="px-2.5 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Live Tabletop AI Co-Pilot Drawer"
            >
              <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="hidden md:inline">AI Co-Pilot</span>
            </button>
          )}

          {/* Exit Table Mode Button */}
          <button
            type="button"
            onClick={onExitTableMode}
            className="px-3 py-1.5 bg-amber-950/90 hover:bg-amber-900 text-amber-200 hover:text-amber-100 border border-amber-500/70 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Return to full workspace editor (Alt+T)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Exit Table Mode</span>
          </button>
        </div>
      </header>

      {/* Vitality & Core Combat HUD Card */}
      <section aria-label="Vitality and Core Stats" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 cols: Hit Points, Health Bar, Quick Actions & Death Saves */}
        <div className="lg:col-span-7 bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <HpOrb
                hpCurrent={character.hpCurrent}
                hpMax={effectiveMaxHp}
                size="md"
                showLabel={false}
              />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                  {t('stats.hitPoints', 'Hit Points')}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black font-mono ${getHpColorClass(hpPercent)}`}>
                    {character.hpCurrent}
                  </span>
                  <span className="text-stone-500 text-sm">/</span>
                  <span className="text-stone-300 font-mono text-base font-bold">
                    {effectiveMaxHp}
                  </span>
                  {(character.hpTemp || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold rounded-lg shadow-sm">
                      +{character.hpTemp} Temp
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick +/- Delta Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {[-10, -5, -1, 1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickDelta(delta)}
                  className={`px-2 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer border ${
                    delta < 0
                      ? 'bg-rose-950/70 hover:bg-rose-900 border-rose-700/50 text-rose-300'
                      : 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-700/50 text-emerald-300'
                  }`}
                  title={`${delta < 0 ? 'Take' : 'Heal'} ${Math.abs(delta)} HP`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Health Bar Graphic */}
          <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden border border-stone-800 relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                hpPercent > 50
                  ? 'bg-emerald-500 shadow-emerald-500/50'
                  : hpPercent > 20
                  ? 'bg-amber-500 shadow-amber-500/50'
                  : 'bg-rose-600 shadow-rose-600/50 animate-pulse'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, hpPercent))}%` }}
            />
          </div>

          {/* Custom Damage/Heal Form & Hit Dice */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-stone-800/80 text-xs">
            {/* Custom HP input */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Amt"
                value={hpDelta}
                onChange={(e) => setHpDelta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyHpChange('damage');
                }}
                className="w-16 px-2 py-1 bg-stone-900 border border-stone-700 rounded-lg text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleApplyHpChange('damage')}
                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-200 font-bold rounded-lg transition cursor-pointer"
              >
                Dmg
              </button>
              <button
                type="button"
                onClick={() => handleApplyHpChange('heal')}
                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 font-bold rounded-lg transition cursor-pointer"
              >
                Heal
              </button>
            </div>

            {/* Hit Dice Spend Button */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-mono">
                Hit Dice: <strong className="text-stone-200">{character.hitDiceCurrent ?? character.level}/{character.level}</strong> ({character.hitDiceTotal || '1d8'})
              </span>
              <button
                type="button"
                onClick={handleSpendHitDie}
                disabled={(character.hitDiceCurrent || 0) <= 0}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-700 text-amber-300 font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Spend 1 Hit Die to heal (Rolls die + CON mod)"
              >
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Spend 1 HD</span>
              </button>
            </div>
          </div>

          {/* Death Saves (Shown when HP === 0 or manually expandable) */}
          {(character.hpCurrent <= 0 || deathSavesSuccesses > 0 || deathSavesFailures > 0) && (
            <div className="p-3 bg-stone-900/90 border border-rose-600/50 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-rose-400 animate-pulse" />
                  Death Saving Throws
                </span>
                <button
                  type="button"
                  onClick={handleRollDeathSave}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-stone-950 font-mono text-xs font-black rounded-lg transition cursor-pointer shadow flex items-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Roll Death Save (d20)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Successes */}
                <div className="flex items-center gap-2 bg-stone-950/60 p-2 rounded-lg border border-emerald-900/40">
                  <span className="text-emerald-400 font-bold font-mono">Successes:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleDeathSave('success', idx)}
                        className={`w-5 h-5 rounded-full border transition flex items-center justify-center cursor-pointer ${
                          deathSavesSuccesses > idx
                            ? 'bg-emerald-500 border-emerald-400 text-stone-950 shadow-sm'
                            : 'bg-stone-900 border-stone-700 text-transparent hover:border-emerald-500'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Failures */}
                <div className="flex items-center gap-2 bg-stone-950/60 p-2 rounded-lg border border-rose-900/40">
                  <span className="text-rose-400 font-bold font-mono">Failures:</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleDeathSave('failure', idx)}
                        className={`w-5 h-5 rounded-full border transition flex items-center justify-center cursor-pointer ${
                          deathSavesFailures > idx
                            ? 'bg-rose-600 border-rose-500 text-stone-950 shadow-sm'
                            : 'bg-stone-900 border-stone-700 text-transparent hover:border-rose-500'
                        }`}
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 cols: Vitals Matrix & Instant Actions */}
        <div className="lg:col-span-5 bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* AC */}
            <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-stone-400">Armor Class</div>
              <div className="text-xl font-black font-mono text-amber-200 mt-0.5 flex items-center justify-center gap-1">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>{character.armorClass}</span>
              </div>
            </div>

            {/* Initiative */}
            <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-stone-400">Initiative</div>
              <button
                type="button"
                onClick={onRollInitiative}
                className="w-full text-xl font-black font-mono text-amber-300 hover:text-amber-100 hover:underline mt-0.5 flex items-center justify-center gap-1 cursor-pointer"
                title="Click to roll Initiative!"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{formatModifier(character.initiativeBonus || 0)}</span>
              </button>
            </div>

            {/* Speed */}
            <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-stone-400">Speed</div>
              <div className="text-xl font-black font-mono text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                <span>{speedInfo.effectiveSpeed}</span>
                <span className="text-xs text-stone-500 font-sans">ft</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-stone-900/60 border border-stone-800/80 p-2 rounded-xl flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-stone-400" />
                <span>Passive Perception</span>
              </span>
              <strong className="text-stone-200 font-mono text-sm">{passivePerception}</strong>
            </div>

            <div className="bg-stone-900/60 border border-stone-800/80 p-2 rounded-xl flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-stone-400" />
                <span>Passive Insight</span>
              </span>
              <strong className="text-stone-200 font-mono text-sm">{passiveInsight}</strong>
            </div>
          </div>

          {/* Roll Advantage Mode Selector */}
          <div className="bg-stone-900/80 border border-stone-800 p-2 rounded-xl flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-400 pl-1">Roll Mode:</span>
            <div className="flex items-center gap-1">
              {(['normal', 'advantage', 'disadvantage'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRollMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    rollMode === mode
                      ? mode === 'advantage'
                        ? 'bg-emerald-500 text-stone-950 shadow-sm'
                        : mode === 'disadvantage'
                        ? 'bg-rose-500 text-stone-950 shadow-sm'
                        : 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Ability Scores & Saving Throws Grid */}
      <section aria-label="Ability Scores and Saving Throws" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {abilitiesList.map((ab) => {
          const mod = getAbilityModifier(ab.score);
          const isSaveProf = !!(character.savingThrowProficiencies && character.savingThrowProficiencies[ab.key]);
          const saveMod = mod + (isSaveProf ? profBonus : 0);

          return (
            <div
              key={ab.key}
              className="bg-stone-950/90 border border-stone-800 hover:border-amber-500/40 rounded-xl p-2.5 shadow transition flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono tracking-wider text-amber-300 group-hover:text-amber-200">
                  {ab.short}
                </span>
                <span className="text-xs font-mono text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                  {ab.score}
                </span>
              </div>

              {/* Big Ability Mod Check Button */}
              <button
                type="button"
                onClick={() => onRoll(`${ab.name} Check`, 20, 1, mod, rollMode)}
                className="w-full py-2 bg-stone-900 hover:bg-amber-950/80 border border-stone-800 hover:border-amber-500/50 rounded-lg text-center transition cursor-pointer"
                title={`Roll ${ab.name} Ability Check (${formatModifier(mod)})`}
              >
                <div className="text-lg font-black font-mono text-amber-100">
                  {formatModifier(mod)}
                </div>
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Check
                </div>
              </button>

              {/* Saving Throw Button */}
              <button
                type="button"
                onClick={() => onRoll(`${ab.name} Save`, 20, 1, saveMod, rollMode)}
                className={`w-full py-1 px-2 rounded-lg border text-xs font-bold font-mono flex items-center justify-between transition cursor-pointer ${
                  isSaveProf
                    ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900/70'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
                title={`Roll ${ab.name} Saving Throw (${formatModifier(saveMod)})${isSaveProf ? ' [Proficient]' : ''}`}
              >
                <span className="text-[10px] uppercase font-sans font-semibold">Save</span>
                <div className="flex items-center gap-1">
                  {isSaveProf && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  <span>{formatModifier(saveMod)}</span>
                </div>
              </button>
            </div>
          );
        })}
      </section>

      {/* Action Center Tabs Strip */}
      <nav aria-label="Tabletop Action Views" className="bg-stone-950/90 border border-stone-800 rounded-2xl p-2 shadow-lg flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('attacks')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'attacks'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Attacks & Weapons ({character.attacks?.length || 0})</span>
        </button>

        {character.isSpellcaster && (
          <button
            type="button"
            onClick={() => setActiveTab('spells')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'spells'
                ? 'bg-purple-500 text-stone-950 font-black shadow-md'
                : 'bg-stone-900/80 text-stone-400 hover:text-purple-300 hover:bg-stone-850'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Spells & Slots ({character.spells?.length || 0})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('powers')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'powers'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Class Powers ({customResources.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conditions')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'conditions'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Conditions ({activeConditions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'skills'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Skills ({character.skills?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'bg-stone-900/80 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Table Scratchpad</span>
        </button>
      </nav>

      {/* Tab Panels */}
      <main className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-xl min-h-[380px]">
        {/* TAB 1: ATTACKS & WEAPONS */}
        {activeTab === 'attacks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Equipped Weapons & Weapon Strikes
                </h3>
                <p className="text-xs text-stone-400">
                  Click 'Attack' to roll d20 + bonus. Click 'Damage' to roll damage dice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAttack(prev => !prev)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-amber-500/50 text-amber-300 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Strike</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddAttack && (
              <div className="p-3 bg-stone-900/90 border border-amber-500/40 rounded-xl space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Weapon Name (e.g. Longsword)"
                    value={newAtkName}
                    onChange={(e) => setNewAtkName(e.target.value)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100"
                  />
                  <input
                    type="number"
                    placeholder="Atk Bonus (+5)"
                    value={newAtkBonus}
                    onChange={(e) => setNewAtkBonus(parseInt(e.target.value, 10) || 0)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Damage (e.g. 1d8+3)"
                    value={newAtkDamage}
                    onChange={(e) => setNewAtkDamage(e.target.value)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Damage Type (e.g. Slashing)"
                    value={newAtkType}
                    onChange={(e) => setNewAtkType(e.target.value)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100"
                  />
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddAttack(false)}
                    className="px-3 py-1 bg-stone-800 text-stone-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddAttack}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg"
                  >
                    Save Strike
                  </button>
                </div>
              </div>
            )}

            {/* Attacks List */}
            {(!character.attacks || character.attacks.length === 0) ? (
              <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-xl">
                No weapons or attack strikes configured. Click '+ Add Strike' above to add your primary weapons.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {character.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 p-3.5 rounded-xl shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-amber-100">{atk.name}</h4>
                        <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                          <span>{atk.range || '5 ft'}</span>
                          <span>•</span>
                          <span className="text-amber-300/80">{atk.damageType || 'Physical'}</span>
                        </div>
                      </div>
                      <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800 font-mono text-xs font-bold text-amber-400">
                        {formatModifier(atk.attackBonus)} To Hit
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onRoll(`Attack: ${atk.name}`, 20, 1, atk.attackBonus, rollMode)}
                        className="py-1.5 px-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span>Roll Attack</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRollDamage(`Damage: ${atk.name} (${atk.damageType || 'Physical'})`, atk.damage)}
                        className="py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>{atk.damage} Dmg</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPELLS & SPELL SLOTS */}
        {activeTab === 'spells' && character.isSpellcaster && (
          <div className="space-y-4">
            {/* Spell Slots Bubble Strip */}
            <div className="p-3 bg-stone-900/90 border border-purple-900/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Spell Slots Matrix (Click bubble to expend/restore)
                </span>
                <span className="text-stone-400 font-mono">
                  DC <strong className="text-purple-300">{spellSaveDC}</strong> • Atk <strong className="text-purple-300">+{spellAtkBonus}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {(character.spellSlots || []).map((slot) => (
                  <div
                    key={slot.level}
                    className="bg-stone-950/80 border border-stone-800 p-2 rounded-lg text-center space-y-1"
                  >
                    <div className="text-[10px] uppercase font-bold text-purple-300">
                      {slot.level === 1 ? '1st' : slot.level === 2 ? '2nd' : slot.level === 3 ? '3rd' : `${slot.level}th`}
                    </div>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {Array.from({ length: slot.max }).map((_, idx) => {
                        const isAvailable = idx < slot.current;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleSpellSlot(slot.level, idx)}
                            className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer ${
                              isAvailable
                                ? 'bg-purple-500 border-purple-300 shadow-sm shadow-purple-500/50'
                                : 'bg-stone-900 border-stone-700 hover:border-purple-500'
                            }`}
                            title={`Level ${slot.level} Slot #${idx + 1} (${isAvailable ? 'Available - Click to expend' : 'Used - Click to restore'})`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400">
                      {slot.current}/{slot.max}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search spells or school..."
                  value={spellSearch}
                  onChange={(e) => setSpellSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedSpellLevel('all')}
                  className={`px-2 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                    selectedSpellLevel === 'all'
                      ? 'bg-purple-600 text-stone-950'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  All
                </button>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedSpellLevel(lvl)}
                    className={`px-2 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                      selectedSpellLevel === lvl
                        ? 'bg-purple-600 text-stone-950'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {lvl === 0 ? 'Cantrip' : `L${lvl}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Spells Grid */}
            {filteredSpells.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-xl">
                No matching spells found. Check your spellbook or adjust search filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSpells.map((spell) => (
                  <div
                    key={spell.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-purple-500/40 p-3 rounded-xl shadow transition flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-purple-200">{spell.name}</h4>
                        <span className="px-1.5 py-0.5 bg-purple-950 border border-purple-600/40 text-purple-300 font-mono text-[10px] font-bold rounded shrink-0">
                          {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        {spell.school && <span>{spell.school}</span>}
                        {spell.castingTime && <span>• {spell.castingTime}</span>}
                        {spell.range && <span>• {spell.range}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCastSpell(spell)}
                      className="w-full py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50 text-purple-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Cast Spell {spell.damage ? `(${spell.damage})` : ''}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLASS POWERS & CUSTOM RESOURCES */}
        {activeTab === 'powers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Class Powers & Trackable Resource Pools
                </h3>
                <p className="text-xs text-stone-400">
                  Track Rages, Ki Points, Bardic Inspiration, Channel Divinity, Sorcery Points, etc.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddResource(prev => !prev)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-amber-500/50 text-amber-300 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pool</span>
              </button>
            </div>

            {/* Quick Add Resource Form */}
            {showAddResource && (
              <div className="p-3 bg-stone-900/90 border border-amber-500/40 rounded-xl space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Pool Name (e.g. Ki Points)"
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100"
                  />
                  <input
                    type="number"
                    placeholder="Max Quantity"
                    value={newResMax}
                    onChange={(e) => setNewResMax(parseInt(e.target.value, 10) || 1)}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100 font-mono"
                  />
                  <select
                    value={newResReset}
                    onChange={(e) => setNewResReset(e.target.value as 'short' | 'long')}
                    className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-100"
                  >
                    <option value="long">Reset on Long Rest</option>
                    <option value="short">Reset on Short Rest</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddResource(false)}
                    className="px-3 py-1 bg-stone-800 text-stone-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomResource}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg"
                  >
                    Save Pool
                  </button>
                </div>
              </div>
            )}

            {/* Resources Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {customResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 p-3.5 rounded-xl shadow flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-100">{res.name}</h4>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                      {res.resetOn === 'short' ? 'Short Rest' : 'Long Rest'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xl font-black font-mono text-amber-300">
                      {res.current} <span className="text-stone-500 text-sm">/ {res.max}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateResource(res.id, -1)}
                        disabled={res.current <= 0}
                        className="w-7 h-7 bg-stone-950 hover:bg-rose-950 border border-stone-700 hover:border-rose-600 disabled:opacity-30 rounded-lg flex items-center justify-center text-rose-300 font-bold cursor-pointer"
                        title="Spend 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateResource(res.id, 1)}
                        disabled={res.current >= res.max}
                        className="w-7 h-7 bg-stone-950 hover:bg-emerald-950 border border-stone-700 hover:border-emerald-600 disabled:opacity-30 rounded-lg flex items-center justify-center text-emerald-300 font-bold cursor-pointer"
                        title="Restore 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONDITIONS & ACTIVE BUFFS */}
        {activeTab === 'conditions' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                Active Conditions & Status Aura Matrix
              </h3>
              <p className="text-xs text-stone-400">
                Click any condition to toggle it on or off for this session.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {DND_CONDITIONS.map((cond) => {
                const isActive = activeConditions.includes(cond.name);
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => handleToggleCondition(cond.name)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-900/30'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{cond.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] line-clamp-2 text-stone-400 leading-tight">
                      {cond.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: SKILLS MATRIX */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Skills & Proficiency Quick-Checks
                </h3>
                <p className="text-xs text-stone-400">
                  Click any skill to instantly roll d20 + skill bonus.
                </p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-amber-100 text-xs placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredSkills.map((skill) => {
                const bonus = getSkillBonus(skill, effectiveAbilities, character.level);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onRoll(`${skill.name} Check (${skill.ability})`, 20, 1, bonus, rollMode)}
                    className="p-2.5 bg-stone-900/70 hover:bg-amber-950/70 border border-stone-800 hover:border-amber-500/40 rounded-xl transition flex items-center justify-between cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${skill.expertise ? 'bg-amber-400 ring-2 ring-amber-500/50' : skill.proficient ? 'bg-amber-400' : 'bg-stone-700'}`} />
                      <div className="text-left">
                        <span className="text-xs font-bold text-stone-200 group-hover:text-amber-200">
                          {skill.name}
                        </span>
                        <span className="text-[10px] text-stone-500 block font-mono">
                          {skill.ability} {skill.expertise ? '• Expertise' : skill.proficient ? '• Proficient' : ''}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-bold font-mono text-amber-300 group-hover:text-amber-100 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {formatModifier(bonus)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: TABLE SCRATCHPAD */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Live Tabletop Scratchpad
                </h3>
                <p className="text-xs text-stone-400">
                  Instant scratchpad notes synced directly with your character's session notes.
                </p>
              </div>
            </div>

            <textarea
              rows={12}
              value={character.additionalNotes || ''}
              onChange={(e) => {
                onUpdateCharacter({
                  ...character,
                  additionalNotes: e.target.value
                });
              }}
              placeholder="Write loot, monster clues, NPC names, marching order, or tactical plans here during your live session..."
              className="w-full p-3 bg-stone-900/90 border border-stone-800 rounded-xl text-stone-200 font-sans text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-amber-500/80 resize-y"
            />
          </div>
        )}
      </main>

      {/* Rest Modal */}
      {showRestModal && (
        <RestModal
          character={character}
          initialRestType={showRestModal}
          onClose={() => setShowRestModal(null)}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}
    </div>
  );
};
