import React, { useState } from 'react';
import { AbilityName, CharacterData, Spell } from '../../types';
import { ShadowrunSpellsComplexForms } from '../shadowrun/ShadowrunSpellsComplexForms';
import { getSpellSaveDC, getSpellAttackBonus, getAbilityModifier, formatModifier, OFFICIAL_DAMAGE_TYPES, getDamageTypeMeta, isHealingSpell, getHealingExpression, rollHealing, isCharacterDead, isReviveSpell } from '../../utils/dndCalculations';
import { PRESET_5E_SPELLS } from '../../data/presetSpells';
import {
  Wand2,
  Sparkles,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  BookOpen,
  Zap,
  Shield,
  Search,
  Heart,
  AlertCircle,
  ArrowUpDown,
  Layers,
  Edit3,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sun,
  Filter
} from 'lucide-react';

interface Sheet4Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
}

export const getSpellShortSummary = (spell: Spell): string => {
  if (spell.shortDescription && spell.shortDescription.trim()) {
    return spell.shortDescription.trim();
  }
  if (!spell.description || !spell.description.trim()) {
    return 'No description provided.';
  }

  // Clean extra white spaces / line breaks
  const cleaned = spell.description.replace(/[\r\n]+/g, ' ').trim();
  // Try to find end of first sentence
  const sentenceEndIndex = cleaned.search(/[.!?](\s|$)/);
  if (sentenceEndIndex !== -1 && sentenceEndIndex <= 130) {
    return cleaned.substring(0, sentenceEndIndex + 1);
  }
  if (cleaned.length > 115) {
    return cleaned.substring(0, 112) + '...';
  }
  return cleaned;
};

export const getRecommendedPreparedSpellsCount = (character: CharacterData): number => {
  const level = character.level || 1;
  const abilityMod = getAbilityModifier(character.abilities[character.spellcastingAbility || 'INT']?.score || 10);
  const cls = (character.characterClass || '').toLowerCase();

  if (cls.includes('wizard') || cls.includes('cleric') || cls.includes('druid')) {
    return Math.max(1, level + abilityMod);
  }
  if (cls.includes('paladin') || cls.includes('artificer')) {
    return Math.max(1, Math.floor(level / 2) + abilityMod);
  }
  // Bards, Sorcerers, Warlocks, Rangers have fixed known spells
  const knownLevelSpells = (character.spells || []).filter(s => s.level > 0);
  return Math.max(1, knownLevelSpells.length);
};

export const Sheet4Spells: React.FC<Sheet4Props> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage
}) => {
  // Main Navigation Tabs: 'spellbook' (Full Library) vs 'daily' (Spells per Day)
  const [activeTab, setActiveTab] = useState<'spellbook' | 'daily'>('daily');

  // Filter & Sorting states
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'level' | 'name' | 'school' | 'prepared'>('level');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupByLevel, setGroupByLevel] = useState<boolean>(true);

  // Section Collapse State for Level Groups
  const [collapsedLevels, setCollapsedLevels] = useState<Record<number, boolean>>({});

  // Add & Edit Spell Modal
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);

  // Form Fields
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState<number>(1);
  const [spellSchool, setSpellSchool] = useState('Evocation');
  const [spellCastingTime, setSpellCastingTime] = useState('1 Action');
  const [spellRange, setSpellRange] = useState('60 ft');
  const [spellComponents, setSpellComponents] = useState('V, S');
  const [spellDuration, setSpellDuration] = useState('Instantaneous');
  const [spellDamageType, setSpellDamageType] = useState('Fire');
  const [spellDamage, setSpellDamage] = useState('');
  const [spellSaveType, setSpellSaveType] = useState('');
  const [spellDesc, setSpellDesc] = useState('');
  const [spellShortDesc, setSpellShortDesc] = useState('');
  const [spellConcentration, setSpellConcentration] = useState(false);
  const [spellRitual, setSpellRitual] = useState(false);

  const saveDC = getSpellSaveDC(character);
  const attackBonus = getSpellAttackBonus(character);
  const castingAbilityMod = getAbilityModifier(character.abilities[character.spellcastingAbility]?.score || 10);
  const recommendedPreparedMax = getRecommendedPreparedSpellsCount(character);

  const preparedSpellsCount = character.spells.filter(s => s.level > 0 && s.prepared).length;

  // Toggle Spellcaster status
  const handleToggleSpellcaster = () => {
    onUpdateCharacter({
      ...character,
      isSpellcaster: !character.isSpellcaster
    });
  };

  const handleChangeCastingAbility = (ability: AbilityName) => {
    onUpdateCharacter({
      ...character,
      spellcastingAbility: ability
    });
  };

  // Spell Slot Handlers
  const handleSlotChange = (level: number, type: 'current' | 'max', delta: number) => {
    const updatedSlots = character.spellSlots.map(slot => {
      if (slot.level === level) {
        if (type === 'current') {
          const nextVal = Math.max(0, Math.min(slot.max, slot.current + delta));
          return { ...slot, current: nextVal };
        } else {
          const nextMax = Math.max(0, slot.max + delta);
          return { ...slot, max: nextMax, current: Math.min(nextMax, slot.current) };
        }
      }
      return slot;
    });

    // Ensure slot exists if adding max slot to empty slot level
    let finalSlots = updatedSlots;
    if (!finalSlots.some(s => s.level === level)) {
      finalSlots = [...finalSlots, { level, max: Math.max(0, delta), current: Math.max(0, delta) }];
    }

    onUpdateCharacter({ ...character, spellSlots: finalSlots });
  };

  // Toggle Spell Prepared (Daily List inclusion)
  const handleTogglePrepared = (spellId: string) => {
    const updated = character.spells.map(s =>
      s.id === spellId ? { ...s, prepared: !s.prepared } : s
    );
    onUpdateCharacter({ ...character, spells: updated });
  };

  // Generator: Sync / Auto-Prepare Spells per Day
  const handleSyncPreparedSpells = () => {
    // If no spells are marked prepared, mark all cantrips & level 1+ up to max limit as prepared
    let updatedSpells = [...character.spells];
    const nonCantrips = updatedSpells.filter(s => s.level > 0);
    const anyPrepared = nonCantrips.some(s => s.prepared);

    if (!anyPrepared && nonCantrips.length > 0) {
      // Auto select top N spells
      let count = 0;
      updatedSpells = updatedSpells.map(s => {
        if (s.level === 0) return { ...s, prepared: true };
        if (count < recommendedPreparedMax) {
          count++;
          return { ...s, prepared: true };
        }
        return { ...s, prepared: false };
      });
    }

    onUpdateCharacter({ ...character, spells: updatedSpells });
  };

  const handleClearDailyPrepared = () => {
    const updated = character.spells.map(s => ({
      ...s,
      prepared: s.level === 0 ? true : false
    }));
    onUpdateCharacter({ ...character, spells: updated });
  };

  // Cast Spell Handler
  const handleCastSpell = (spell: Spell) => {
    if (spell.level > 0 && spell.prepared === false) {
      alert(`"${spell.name}" is not prepared in your daily list! Prepare it before casting.`);
      return;
    }

    if (spell.level > 0) {
      const slot = character.spellSlots.find(s => s.level === spell.level);
      if (!slot || slot.current <= 0) {
        alert(`No Level ${spell.level} spell slots remaining! Take a rest or restore slots to cast.`);
        return;
      }
    }

    // Check Revive Spells (e.g., Revivify, Raise Dead, Resurrection, True Resurrection)
    if (isReviveSpell(spell)) {
      const expr = spell.damage || getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal } = rollHealing(expr);
      const reviveHp = Math.min(character.hpMax, Math.max(1, totalHeal || 1));
      const cleanedConditions = (character.conditions || []).filter(c => c !== 'Dead');

      onUpdateCharacter({
        ...character,
        hpCurrent: reviveHp,
        deathSavesFailures: 0,
        deathSavesSuccesses: 0,
        conditions: cleanedConditions,
        spellSlots: spell.level > 0
          ? character.spellSlots.map(s => s.level === spell.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
          : character.spellSlots
      });

      if (onRollDamage) {
        onRollDamage(`✨ Cast ${spell.name} (Revive) - ${character.name} has been returned to life with ${reviveHp} HP!`, '1d20');
      } else {
        alert(`Cast "${spell.name}"! ${character.name} returned to life with ${reviveHp} HP!`);
      }
      return;
    }

    // Check standard Healing Spells
    const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';
    if (isHealing) {
      if (isCharacterDead(character)) {
        alert(`${character.name} is Dead! Standard healing spells cannot bring a dead character back to life. Only Revivify, Resurrection, or manual HP modification can restore life.`);
        return;
      }

      const expr = spell.damage || getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal, breakdown } = rollHealing(expr);
      const newHp = Math.min(character.hpMax, character.hpCurrent + totalHeal);
      const gained = newHp - character.hpCurrent;

      onUpdateCharacter({
        ...character,
        hpCurrent: newHp,
        spellSlots: spell.level > 0
          ? character.spellSlots.map(s => s.level === spell.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
          : character.spellSlots
      });

      if (onRollDamage) {
        onRollDamage(`Cast ${spell.name} (Heal ${breakdown}) - Restored +${gained} HP!`, expr);
      } else {
        alert(`Cast "${spell.name}"! Healed ${totalHeal} HP (${breakdown}). Current HP: ${newHp}/${character.hpMax}`);
      }
      return;
    }

    // Non-healing spell slot deduction
    if (spell.level > 0) {
      handleSlotChange(spell.level, 'current', -1);
    }

    if (spell.damage) {
      onRollDamage?.(`Cast ${spell.name} Damage (${spell.damageType || 'Magical'})`, spell.damage);
    } else {
      alert(`Cast "${spell.name}"! ${spell.level > 0 ? `Expended Level ${spell.level} spell slot.` : 'Cantrip cast.'}`);
    }
  };

  const handleDeleteSpell = (spellId: string) => {
    onUpdateCharacter({
      ...character,
      spells: character.spells.filter(s => s.id !== spellId)
    });
  };

  const handleOpenAddModal = () => {
    setEditingSpellId(null);
    setSpellName('');
    setSpellLevel(1);
    setSpellSchool('Evocation');
    setSpellCastingTime('1 Action');
    setSpellRange('60 ft');
    setSpellComponents('V, S');
    setSpellDuration('Instantaneous');
    setSpellDamageType('Fire');
    setSpellDamage('');
    setSpellSaveType('');
    setSpellDesc('');
    setSpellShortDesc('');
    setSpellConcentration(false);
    setSpellRitual(false);
    setShowSpellModal(true);
  };

  const handleOpenEditModal = (spell: Spell) => {
    setEditingSpellId(spell.id);
    setSpellName(spell.name);
    setSpellLevel(spell.level);
    setSpellSchool(spell.school || 'Evocation');
    setSpellCastingTime(spell.castingTime || '1 Action');
    setSpellRange(spell.range || '60 ft');
    setSpellComponents(spell.components || 'V, S');
    setSpellDuration(spell.duration || 'Instantaneous');
    setSpellDamageType(spell.damageType || 'None');
    setSpellDamage(spell.damage || '');
    setSpellSaveType(spell.saveType || '');
    setSpellDesc(spell.description || '');
    setSpellShortDesc(spell.shortDescription || '');
    setSpellConcentration(!!spell.concentration);
    setSpellRitual(!!spell.ritual);
    setShowSpellModal(true);
  };

  const handleSaveSpell = () => {
    if (!spellName.trim()) return;

    if (editingSpellId) {
      const updatedSpells = character.spells.map(s => {
        if (s.id === editingSpellId) {
          return {
            ...s,
            name: spellName,
            level: spellLevel,
            school: spellSchool,
            castingTime: spellCastingTime,
            range: spellRange,
            components: spellComponents,
            duration: spellDuration,
            damageType: spellDamageType !== 'None' ? spellDamageType : undefined,
            damage: spellDamage.trim() || undefined,
            saveType: spellSaveType.trim() || undefined,
            description: spellDesc,
            shortDescription: spellShortDesc.trim() || undefined,
            concentration: spellConcentration,
            ritual: spellRitual
          };
        }
        return s;
      });
      onUpdateCharacter({ ...character, spells: updatedSpells });
    } else {
      const newSpell: Spell = {
        id: 'sp-' + Date.now(),
        name: spellName,
        level: spellLevel,
        school: spellSchool,
        castingTime: spellCastingTime,
        range: spellRange,
        components: spellComponents,
        duration: spellDuration,
        damageType: spellDamageType !== 'None' ? spellDamageType : undefined,
        damage: spellDamage.trim() || undefined,
        saveType: spellSaveType.trim() || undefined,
        description: spellDesc,
        shortDescription: spellShortDesc.trim() || undefined,
        prepared: true,
        concentration: spellConcentration,
        ritual: spellRitual
      };
      onUpdateCharacter({
        ...character,
        spells: [...character.spells, newSpell]
      });
    }

    setShowSpellModal(false);
  };

  const toggleLevelCollapse = (lvl: number) => {
    setCollapsedLevels(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  // Filter & Sort Logic
  const getProcessedSpells = (isDailyMode: boolean) => {
    return character.spells.filter(s => {
      if (isDailyMode && s.level > 0 && !s.prepared) {
        return false; // In daily list, show prepared spells and cantrips
      }
      const matchesLevel = selectedLevelFilter === 'all' || s.level === selectedLevelFilter;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.shortDescription && s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesLevel && matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'level') {
        comparison = a.level - b.level || a.name.localeCompare(b.name);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'school') {
        comparison = a.school.localeCompare(b.school) || a.level - b.level;
      } else if (sortBy === 'prepared') {
        comparison = (b.prepared ? 1 : 0) - (a.prepared ? 1 : 0) || a.level - b.level;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const processedSpells = getProcessedSpells(activeTab === 'daily');

  // Group spells by level if needed
  const spellsByLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => ({
    level: lvl,
    label: lvl === 0 ? 'Cantrips (Level 0)' : `Level ${lvl} Spells`,
    spells: processedSpells.filter(s => s.level === lvl)
  })).filter(group => group.spells.length > 0);

  if (character.edition === 'shadowrun') {
    return (
      <div className="space-y-6 pb-12">
        <ShadowrunSpellsComplexForms
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Casting Stats & Quick Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <span>Spells & Spellcasting Stats</span>
          </div>

          <button
            onClick={handleToggleSpellcaster}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition ${
              character.isSpellcaster
                ? 'bg-purple-950 border-purple-500 text-purple-200'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
          >
            Spellcaster Mode: {character.isSpellcaster ? 'ACTIVE' : 'INACTIVE'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Casting Ability Selector */}
          <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl text-center flex flex-col items-center justify-between">
            <div className="text-xs uppercase font-mono font-bold text-stone-400 mb-1">
              Spellcasting Ability
            </div>
            <select
              value={character.spellcastingAbility}
              onChange={(e) => handleChangeCastingAbility(e.target.value as AbilityName)}
              className="w-full max-w-full bg-stone-900 border border-amber-500/50 text-amber-200 font-serif font-bold text-sm sm:text-base rounded-lg px-2 py-1.5 focus:outline-none text-center truncate cursor-pointer"
            >
              <option value="INT">INT (Wizard, Artificer)</option>
              <option value="WIS">WIS (Cleric, Druid, Ranger)</option>
              <option value="CHA">CHA (Bard, Sorcerer, Warlock, Paladin)</option>
              <option value="STR">STR (Custom)</option>
              <option value="DEX">DEX (Custom)</option>
              <option value="CON">CON (Genasi/Custom)</option>
            </select>
            <div className="text-[11px] font-mono text-stone-400 mt-1">
              Mod: <span className="text-amber-300 font-bold">{formatModifier(castingAbilityMod)}</span>
            </div>
          </div>

          {/* Spell Save DC */}
          <div className="bg-stone-950 border border-purple-600/40 p-4 rounded-xl text-center shadow-md">
            <div className="text-xs uppercase font-mono font-bold text-purple-300 mb-1 flex items-center justify-center gap-1">
              <Shield className="w-4 h-4 text-purple-400" /> Spell Save DC
            </div>
            <div className="text-3xl font-serif font-extrabold text-purple-200">{saveDC}</div>
            <div className="text-[10px] text-stone-500 font-mono mt-1">8 + Prof + Ability Mod</div>
          </div>

          {/* Spell Attack Bonus */}
          <div className="bg-stone-950 border border-amber-600/40 p-4 rounded-xl text-center shadow-md">
            <div className="text-xs uppercase font-mono font-bold text-amber-300 mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" /> Spell Attack Bonus
            </div>
            <button
              onClick={() => onRoll('Spell Attack Roll', 20, 1, attackBonus, 'normal')}
              className="text-3xl font-serif font-extrabold text-amber-200 hover:text-amber-100 transition cursor-pointer"
              title="Click to Roll Spell Attack"
            >
              {formatModifier(attackBonus)}
            </button>
            <div className="text-[10px] text-stone-500 font-mono mt-1">Prof + Ability Mod (Click to Roll)</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Spell Slots Tracker (Levels 1 to 9) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Spell Slot Tracker (Levels 1 - 9)</span>
          </div>
          <div className="text-xs text-stone-400 font-mono">
            Track remaining slots per level
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
            const slot = character.spellSlots.find(s => s.level === lvl) || { level: lvl, max: 0, current: 0 };

            return (
              <div
                key={lvl}
                className={`p-2 rounded-xl border text-center transition ${
                  slot.max > 0 ? 'bg-stone-950 border-purple-500/40' : 'bg-stone-950/40 border-stone-800 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-purple-300">Lvl {lvl}</div>
                <div className="text-lg font-serif font-extrabold text-amber-100 my-0.5">
                  {slot.current} / {slot.max}
                </div>

                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => handleSlotChange(lvl, 'current', -1)}
                    className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-bold text-xs"
                    title="Expend 1 Slot"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleSlotChange(lvl, 'current', 1)}
                    className="w-5 h-5 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded font-bold text-xs"
                    title="Recover 1 Slot"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleSlotChange(lvl, 'max', -1)}
                    className="w-4.5 h-4.5 px-1 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[10px] font-mono rounded transition"
                    title="Decrease Max Slots"
                  >
                    M-
                  </button>
                  <button
                    onClick={() => handleSlotChange(lvl, 'max', 1)}
                    className="w-4.5 h-4.5 px-1 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[10px] font-mono rounded transition"
                    title="Increase Max Slots"
                  >
                    M+
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Main Spell System (Tabbed Views: Spells per Day vs Full Spellbook) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'daily'
                  ? 'bg-amber-600 text-stone-950 shadow-lg font-extrabold'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Spells per Day (Daily Prepared)</span>
            </button>

            <button
              onClick={() => setActiveTab('spellbook')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'spellbook'
                  ? 'bg-purple-700 text-white shadow-lg font-extrabold'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span>Full Spellbook ({character.spells.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" /> Add New Spell
          </button>
        </div>

        {/* MODE 1: SPELLS PER DAY GENERATOR & LIST */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {/* Generator Header Bar */}
            <div className="bg-stone-950 border border-amber-600/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div>
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <Zap className="w-4 h-4 text-amber-400" /> Daily Spell Preparation Tracker
                </div>
                <div className="text-sm font-serif font-bold text-stone-100 mt-0.5">
                  Prepared Level 1+ Spells: <span className="text-amber-300 font-extrabold">{preparedSpellsCount}</span> / <span className="text-stone-300">{recommendedPreparedMax}</span>
                  <span className="text-stone-500 font-sans text-xs ml-2 font-normal">(Base: Level + Casting Ability Mod)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncPreparedSpells}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 rounded-lg text-xs font-bold transition shadow"
                  title="Generate/Sync prepared spells list directly from your spellbook"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sync / Auto-Prepare</span>
                </button>
                <button
                  onClick={handleClearDailyPrepared}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold transition"
                >
                  Clear Daily List
                </button>
              </div>
            </div>

            {/* Quick Filters for Daily List */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <span className="text-stone-500 font-mono text-[11px] font-bold">Filter:</span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    selectedLevelFilter === 'all' ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  All Daily
                </button>
                <button
                  onClick={() => setSelectedLevelFilter(0)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    selectedLevelFilter === 0 ? 'bg-amber-600 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  Cantrips (0)
                </button>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      selectedLevelFilter === lvl ? 'bg-purple-700 text-white font-bold' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    Lvl {lvl}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search daily spells..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1 text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                />
              </div>
            </div>

            {/* DAILY SPELLS LIST WITH VALUES + SHORT DESCRIPTION */}
            {processedSpells.length === 0 ? (
              <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-8 text-center space-y-3">
                <p className="text-stone-400 text-xs">
                  No prepared spells found for today! Click <strong>"Sync / Auto-Prepare"</strong> or visit your <strong>Full Spellbook</strong> tab to checkmark spells for your daily list.
                </p>
                <button
                  onClick={handleSyncPreparedSpells}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition shadow-lg"
                >
                  ⚡ Auto-Prepare Spells for Today
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {processedSpells.map(spell => {
                  const detectedType = spell.damageType || OFFICIAL_DAMAGE_TYPES.find(d => new RegExp(`\\b${d.name}\\b`, 'i').test(spell.description))?.name;
                  const dmgMeta = detectedType ? getDamageTypeMeta(detectedType) : null;
                  const shortSummary = getSpellShortSummary(spell);

                  const isCantrip = spell.level === 0;
                  const slotObj = character.spellSlots.find(s => s.level === spell.level);
                  const hasSlot = isCantrip || (slotObj ? slotObj.current > 0 : false);
                  const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';

                  return (
                    <div
                      key={spell.id}
                      className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-3 transition shadow-md ${
                        hasSlot || isCantrip
                          ? 'bg-stone-950 border-amber-600/30 hover:border-amber-500/60'
                          : 'bg-stone-950/60 border-rose-900/40 opacity-75'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-extrabold text-amber-200 text-base">
                              {spell.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              spell.level === 0
                                ? 'bg-amber-950 border-amber-700 text-amber-300'
                                : 'bg-purple-950 border-purple-700 text-purple-200'
                            }`}>
                              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                            </span>
                            <button
                              onClick={() => handleOpenEditModal(spell)}
                              className="text-stone-500 hover:text-amber-300 p-1 transition"
                              title="Edit spell details & short description"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* VALUES & KEY COMBAT STATS ROW */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* Casting Time */}
                          <span className="inline-flex items-center gap-1 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-[10px] font-mono text-stone-300">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{spell.castingTime}</span>
                          </span>

                          {/* Range */}
                          <span className="inline-flex items-center gap-1 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-[10px] font-mono text-stone-300">
                            <Target className="w-3 h-3 text-blue-400" />
                            <span>{spell.range}</span>
                          </span>

                          {/* Save DC / Attack Mod */}
                          {spell.saveType ? (
                            <span className="inline-flex items-center gap-1 bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-purple-200 font-bold">
                              <Shield className="w-3 h-3 text-purple-400" />
                              <span>DC {saveDC} {spell.saveType}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onRoll('Spell Attack Roll', 20, 1, attackBonus, 'normal')}
                              className="inline-flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-700 px-2 py-0.5 rounded text-[10px] font-mono text-amber-200 font-bold transition"
                              title="Click to Roll Ranged/Melee Spell Attack"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Attack {formatModifier(attackBonus)}</span>
                            </button>
                          )}

                          {/* Damage / Heal Expression */}
                          {spell.damage && (
                            <button
                              onClick={() => onRollDamage?.(`Cast ${spell.name}`, spell.damage || '1d8')}
                              className="inline-flex items-center gap-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 font-bold transition"
                              title="Click to roll damage dice"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>{spell.damage}</span>
                            </button>
                          )}

                          {/* Damage Type Badge */}
                          {dmgMeta && (
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dmgMeta.badgeBg} ${dmgMeta.badgeText} ${dmgMeta.badgeBorder}`}>
                              <span>{dmgMeta.icon}</span>
                              <span>{dmgMeta.name}</span>
                            </span>
                          )}

                          {/* Concentration / Ritual */}
                          {spell.concentration && (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                              Conc.
                            </span>
                          )}
                          {spell.ritual && (
                            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.5 rounded">
                              Ritual
                            </span>
                          )}
                        </div>

                        {/* SHORT DESCRIPTION / QUICK SUMMARY */}
                        <div className="mt-2.5 bg-stone-900/90 p-2.5 rounded-lg border border-stone-800 text-stone-200 text-xs leading-relaxed">
                          <span className="text-amber-400/90 font-semibold font-serif mr-1">Effect:</span>
                          {shortSummary}
                        </div>
                      </div>

                      {/* Cast Action Control */}
                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                        <div className="text-[10px] font-mono text-stone-400">
                          {spell.level > 0 ? (
                            <span>Slots: <strong className={hasSlot ? 'text-purple-300' : 'text-rose-400 font-extrabold'}>
                              {slotObj ? `${slotObj.current}/${slotObj.max}` : '0'}
                            </strong></span>
                          ) : (
                            <span className="text-amber-400">Unlimited Cantrip</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleCastSpell(spell)}
                          disabled={!hasSlot && !isCantrip}
                          className={`px-3 py-1.5 font-bold rounded-lg shadow transition flex items-center gap-1.5 text-xs ${
                            !hasSlot && !isCantrip
                              ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                              : isHealing
                              ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/50'
                              : 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold'
                          }`}
                        >
                          {isHealing ? (
                            <>
                              <Heart className="w-3.5 h-3.5 fill-rose-300 text-emerald-200" /> Cast & Heal HP
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" /> Cast Spell
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: FULL SPELLBOOK LIBRARY WITH SORTING & DETAILED DESCRIPTIONS */}
        {activeTab === 'spellbook' && (
          <div className="space-y-4">
            {/* Sorting & Grouping Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-stone-400 font-mono font-bold">
                  <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sort By:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-stone-200 font-semibold focus:outline-none"
                >
                  <option value="level">Spell Level (0 to 9)</option>
                  <option value="name">Spell Name (A-Z)</option>
                  <option value="school">School of Magic</option>
                  <option value="prepared">Prepared Status</option>
                </select>

                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 bg-stone-900 border border-stone-700 text-amber-300 font-mono text-[11px] font-bold rounded-lg hover:bg-stone-800 transition"
                >
                  {sortOrder.toUpperCase()}
                </button>

                {sortBy === 'level' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 font-mono text-[11px] ml-2">
                    <input
                      type="checkbox"
                      checked={groupByLevel}
                      onChange={(e) => setGroupByLevel(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span>Group by Level Sections</span>
                  </label>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spellbook..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1 text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Level Filter Chips */}
            <div className="flex overflow-x-auto gap-1.5 pb-1 text-xs">
              <button
                onClick={() => setSelectedLevelFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedLevelFilter === 'all'
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                All Spells
              </button>
              <button
                onClick={() => setSelectedLevelFilter(0)}
                className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedLevelFilter === 0
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Cantrips (0)
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevelFilter(lvl)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                    selectedLevelFilter === lvl
                      ? 'bg-purple-700 text-white font-bold shadow'
                      : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Lvl {lvl}
                </button>
              ))}
            </div>

            {/* SPELLBOOK LISTING */}
            {processedSpells.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-8 text-center">
                No spells found in your spellbook matching the filters. Click <strong>"+ Add New Spell"</strong> to expand your spellbook!
              </p>
            ) : sortBy === 'level' && groupByLevel ? (
              // GROUPED BY LEVEL SECTIONS
              <div className="space-y-4">
                {spellsByLevel.map(group => {
                  const isCollapsed = collapsedLevels[group.level];

                  return (
                    <div key={group.level} className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleLevelCollapse(group.level)}
                        className="w-full bg-stone-900 hover:bg-stone-800/80 px-4 py-2.5 flex items-center justify-between text-left transition border-b border-stone-800"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <span className="font-serif font-bold text-amber-300 text-sm">{group.label}</span>
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700">
                            {group.spells.length} {group.spells.length === 1 ? 'spell' : 'spells'}
                          </span>
                        </div>

                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-stone-400" />
                        )}
                      </button>

                      {/* Spell Cards in Group */}
                      {!isCollapsed && (
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {group.spells.map(spell => (
                            <SpellbookCard
                              key={spell.id}
                              spell={spell}
                              character={character}
                              onTogglePrepared={handleTogglePrepared}
                              onOpenEdit={handleOpenEditModal}
                              onDelete={handleDeleteSpell}
                              onCast={handleCastSpell}
                              onRoll={onRoll}
                              saveDC={saveDC}
                              attackBonus={attackBonus}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // UNGROUPED SPELL LIST
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedSpells.map(spell => (
                  <SpellbookCard
                    key={spell.id}
                    spell={spell}
                    character={character}
                    onTogglePrepared={handleTogglePrepared}
                    onOpenEdit={handleOpenEditModal}
                    onDelete={handleDeleteSpell}
                    onCast={handleCastSpell}
                    onRoll={onRoll}
                    saveDC={saveDC}
                    attackBonus={attackBonus}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Spell */}
      {showSpellModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                {editingSpellId ? 'Edit Spell Details' : 'Add Spell to Spellbook'}
              </span>
              <button
                onClick={() => setShowSpellModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-mono"
              >
                ✕ Close
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              {!editingSpellId && (
                <div className="bg-purple-950/40 border border-purple-500/40 p-2.5 rounded-xl space-y-1">
                  <label className="block text-purple-300 font-bold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select from Official D&D 5e Preset Spells:</span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const preset = PRESET_5E_SPELLS.find(p => p.id === selectedId);
                      if (preset) {
                        setSpellName(preset.name);
                        setSpellLevel(preset.level);
                        setSpellSchool(preset.school);
                        setSpellCastingTime(preset.castingTime);
                        setSpellRange(preset.range);
                        setSpellComponents(preset.components);
                        setSpellDuration(preset.duration);
                        setSpellDamageType(preset.damageType || 'None');
                        setSpellDamage(preset.damage || '');
                        setSpellSaveType(preset.saveType || '');
                        setSpellDesc(preset.description);
                        setSpellShortDesc(preset.shortDescription || '');
                        setSpellConcentration(!!preset.concentration);
                        setSpellRitual(!!preset.ritual);
                      }
                    }}
                    className="w-full bg-stone-900 border border-purple-500/50 text-amber-200 rounded-lg p-2 text-xs font-serif font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Choose an Official 5e Preset Spell (Wish, Revivify, Fireball...) --</option>
                    {PRESET_5E_SPELLS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.level === 0 ? 'Cantrip' : `Lvl ${p.level}`} - {p.school})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Spell Name *</label>
                <input
                  type="text"
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  placeholder="e.g. Fireball, Healing Word, Shield"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Spell Level</label>
                  <select
                    value={spellLevel}
                    onChange={(e) => setSpellLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  >
                    <option value={0}>Cantrip (Level 0)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">School of Magic</label>
                  <input
                    type="text"
                    value={spellSchool}
                    onChange={(e) => setSpellSchool(e.target.value)}
                    placeholder="e.g. Evocation, Abjuration"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Casting Time</label>
                  <input
                    type="text"
                    value={spellCastingTime}
                    onChange={(e) => setSpellCastingTime(e.target.value)}
                    placeholder="e.g. 1 Action, 1 Bonus Action"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Range</label>
                  <input
                    type="text"
                    value={spellRange}
                    onChange={(e) => setSpellRange(e.target.value)}
                    placeholder="e.g. 60 ft, Self, Touch"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Components (V, S, M)</label>
                  <input
                    type="text"
                    value={spellComponents}
                    onChange={(e) => setSpellComponents(e.target.value)}
                    placeholder="e.g. V, S, M (a tiny ball of bat guano)"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Duration</label>
                  <input
                    type="text"
                    value={spellDuration}
                    onChange={(e) => setSpellDuration(e.target.value)}
                    placeholder="e.g. Instantaneous, 1 Minute"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage / Healing Roll</label>
                  <input
                    type="text"
                    value={spellDamage}
                    onChange={(e) => setSpellDamage(e.target.value)}
                    placeholder="e.g. 8d6, 1d8 + 4"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Save Requirement</label>
                  <input
                    type="text"
                    value={spellSaveType}
                    onChange={(e) => setSpellSaveType(e.target.value)}
                    placeholder="e.g. DEX, WIS, CON"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Damage Type / Element</label>
                <select
                  value={spellDamageType}
                  onChange={(e) => setSpellDamageType(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium"
                >
                  <option value="None">🛡️ None / Utility / Healing</option>
                  {OFFICIAL_DAMAGE_TYPES.map(d => (
                    <option key={d.name} value={d.name}>
                      {d.icon} {d.name} — {d.description}
                    </option>
                  ))}
                  <option value="Custom">✨ Custom / Mixed...</option>
                </select>
              </div>

              <div className="flex items-center gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={spellConcentration}
                    onChange={(e) => setSpellConcentration(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Concentration</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={spellRitual}
                    onChange={(e) => setSpellRitual(e.target.checked)}
                    className="accent-teal-500 rounded"
                  />
                  <span>Ritual</span>
                </label>
              </div>

              {/* DETAILED DESCRIPTION FIELD */}
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Detailed Description / Rules Text *</label>
                <textarea
                  value={spellDesc}
                  onChange={(e) => setSpellDesc(e.target.value)}
                  rows={3}
                  placeholder="Full rulebook text, saving throw results, higher-level scaling..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              {/* SHORT DESCRIPTION FIELD */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-amber-300 font-semibold">
                    Short Description / Daily Summary (Used in Spells/Day view)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (spellDesc) setSpellShortDesc(getSpellShortSummary({ description: spellDesc } as any));
                    }}
                    className="text-[10px] font-mono text-amber-400 hover:underline"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={spellShortDesc}
                  onChange={(e) => setSpellShortDesc(e.target.value)}
                  placeholder="1-sentence quick summary for fast combat reference..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowSpellModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSpell}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                {editingSpellId ? 'Save Changes' : 'Save Spell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// DETAILED SPELLBOOK CARD COMPONENT
interface SpellbookCardProps {
  spell: Spell;
  character: CharacterData;
  onTogglePrepared: (id: string) => void;
  onOpenEdit: (spell: Spell) => void;
  onDelete: (id: string) => void;
  onCast: (spell: Spell) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  saveDC: number;
  attackBonus: number;
}

const SpellbookCard: React.FC<SpellbookCardProps> = ({
  spell,
  character,
  onTogglePrepared,
  onOpenEdit,
  onDelete,
  onCast,
  onRoll,
  saveDC,
  attackBonus
}) => {
  const detectedType = spell.damageType || OFFICIAL_DAMAGE_TYPES.find(d => new RegExp(`\\b${d.name}\\b`, 'i').test(spell.description))?.name;
  const dmgMeta = detectedType ? getDamageTypeMeta(detectedType) : null;

  const isCantrip = spell.level === 0;
  const slotObj = character.spellSlots.find(s => s.level === spell.level);
  const hasSlot = isCantrip || (slotObj ? slotObj.current > 0 : false);
  const isPrepared = isCantrip || spell.prepared !== false;
  const canCast = isPrepared && hasSlot;
  const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';

  return (
    <div
      className={`p-4 rounded-xl border text-xs flex flex-col justify-between gap-3 transition shadow-md ${
        spell.prepared
          ? 'bg-stone-950 border-purple-500/40'
          : 'bg-stone-950/60 border-stone-800 opacity-80'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePrepared(spell.id)}
              className="text-stone-400 hover:text-purple-300 transition"
              title="Toggle Daily Preparation"
            >
              {spell.prepared ? (
                <CheckSquare className="w-4 h-4 text-purple-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span className="font-serif font-bold text-amber-200 text-base">{spell.name}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {dmgMeta && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dmgMeta.badgeBg} ${dmgMeta.badgeText} ${dmgMeta.badgeBorder}`}>
                <span>{dmgMeta.icon}</span>
                <span>{dmgMeta.name}</span>
              </span>
            )}
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              spell.level === 0 ? 'bg-amber-950 border-amber-700 text-amber-300' : 'bg-purple-950 border-purple-700 text-purple-200'
            }`}>
              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
            </span>
            <button
              onClick={() => onOpenEdit(spell)}
              className="text-stone-500 hover:text-amber-300 p-1 transition"
              title="Edit Spell"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(spell.id)}
              className="text-stone-500 hover:text-rose-400 p-1 transition"
              title="Delete Spell"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Detailed Stats Header */}
        <div className="text-[11px] text-stone-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono">
          <span><strong>School:</strong> {spell.school}</span>
          <span><strong>Time:</strong> {spell.castingTime}</span>
          <span><strong>Range:</strong> {spell.range}</span>
          <span><strong>Comp:</strong> {spell.components}</span>
          {spell.duration && <span><strong>Duration:</strong> {spell.duration}</span>}
        </div>

        {/* FULL DETAILED DESCRIPTION */}
        <p className="text-stone-300 text-xs mt-2.5 leading-relaxed bg-stone-900/90 p-2.5 rounded border border-stone-800">
          {spell.description}
        </p>

        {spell.shortDescription && (
          <div className="mt-1.5 text-[11px] text-amber-300/80 italic font-mono">
            <strong>Daily Short Note:</strong> {spell.shortDescription}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800 gap-2 flex-wrap">
        <div className="flex gap-2 text-[10px] font-mono text-stone-400 items-center flex-wrap">
          {spell.concentration && <span className="text-amber-400 font-bold">[C] Conc.</span>}
          {spell.ritual && <span className="text-teal-400 font-bold">[R] Ritual</span>}
          {!isPrepared && (
            <span className="text-rose-400 font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" /> Not Prepared
            </span>
          )}
        </div>

        <button
          onClick={() => onCast(spell)}
          disabled={!canCast}
          className={`px-3 py-1.5 font-bold rounded-lg shadow transition flex items-center gap-1.5 text-xs ${
            !canCast
              ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              : isHealing
              ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/50'
              : 'bg-purple-700 hover:bg-purple-600 text-white'
          }`}
        >
          {isHealing ? (
            <>
              <Heart className="w-3.5 h-3.5 fill-rose-300 text-emerald-200" /> Cast & Heal HP
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" /> Cast Spell
            </>
          )}
        </button>
      </div>
    </div>
  );
};
