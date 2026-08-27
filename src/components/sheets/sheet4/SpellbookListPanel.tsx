import React, { useState } from 'react';
import { CharacterData, Spell } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { PRESET_5E_SPELLS, PRESET_35E_SPELLS } from '../../../data/presetSpells';
import { saveCustomCompendiumEntry } from '../../../data/compendiumData';
import { OFFICIAL_DAMAGE_TYPES, getDamageTypeMeta } from '../../../utils/dndCalculations';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import { checkSpellEligibility, SpellEligibilityResult } from '../../../utils/spellClassUtils';
import { eventBus } from '../../../events/eventBus';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Zap,
  Flame,
  X,
  Target,
  Edit3,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface SpellbookListPanelProps {
  character: CharacterData;
  allCharacters?: CharacterData[];
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  setTargetModalSpell: (spell: any) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const SpellbookListPanel: React.FC<SpellbookListPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  setTargetModalSpell,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const [showAddSpellModal, setShowAddSpellModal] = useState(false);
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Spell Creation State
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState<number>(1);
  const [spellSchool, setSpellSchool] = useState('Evocation');
  const [spellCastingTime, setSpellCastingTime] = useState('1 Action');
  const [spellRange, setSpellRange] = useState('60 ft');
  const [spellComponents, setSpellComponents] = useState('V, S');
  const [spellDuration, setSpellDuration] = useState('Instantaneous');
  const [spellDamage, setSpellDamage] = useState('1d8');
  const [spellDamageType, setSpellDamageType] = useState('Fire');
  const [spellDescription, setSpellDescription] = useState('');
  const [presetSearch, setPresetSearch] = useState('');
  const [filterForMyClass, setFilterForMyClass] = useState(true);
  const [dmBypassMode, setDmBypassMode] = useState(false);

  // Requirement Warning Modal State
  const [pendingSpellConfirm, setPendingSpellConfirm] = useState<{
    preset: Partial<Spell>;
    eligibility: SpellEligibilityResult;
  } | null>(null);

  const handleTogglePrepared = (id: string) => {
    const updated = character.spells.map(s => {
      if (s.id === id) {
        return { ...s, prepared: !s.prepared };
      }
      return s;
    });
    onUpdateCharacter({ ...character, spells: updated });
  };

  const handleDeleteSpell = (id: string) => {
    const updated = character.spells.filter(s => s.id !== id);
    onUpdateCharacter({ ...character, spells: updated });
  };

  const handleAddCustomSpell = () => {
    if (!spellName.trim()) return;

    const newSpell: Spell = {
      id: 'spell-' + Date.now(),
      name: spellName,
      level: spellLevel,
      school: spellSchool,
      castingTime: spellCastingTime,
      range: spellRange,
      components: spellComponents,
      duration: spellDuration,
      damage: spellDamage,
      damageType: spellDamageType,
      prepared: true,
      description: spellDescription
    };

    onUpdateCharacter({
      ...character,
      spells: [...character.spells, newSpell]
    });

    eventBus.emit('SpellLearned', {
      characterId: character.id,
      spellName: newSpell.name,
      level: newSpell.level
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-spell-' + newSpell.id,
        name: newSpell.name,
        category: 'spells',
        edition: character.edition || '5e',
        description: `Level ${newSpell.level} ${newSpell.school} spell. ${newSpell.description}`,
        source: 'Custom Spellbook',
        isCustom: true,
        tags: [character.edition || '5e', `Level ${newSpell.level}`, newSpell.school],
        spellData: newSpell
      });
    } catch (e) {
      console.error('Failed to save spell to compendium', e);
    }

    setSpellName('');
    setSpellDescription('');
    setShowAddSpellModal(false);
  };

  const handleAddPresetSpell = (preset: Partial<Spell>, bypassWarning = false) => {
    const elig = checkSpellEligibility(character, preset);
    if (!bypassWarning && !dmBypassMode && (!elig.isClassMatch || !elig.isLevelMet)) {
      setPendingSpellConfirm({ preset, eligibility: elig });
      return;
    }

    const newSpell: Spell = {
      id: 'spell-preset-' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: preset.name || 'SRD Spell',
      level: preset.level || 0,
      school: preset.school || 'Universal',
      castingTime: preset.castingTime || '1 Action',
      range: preset.range || 'Self',
      components: preset.components || 'V, S',
      duration: preset.duration || 'Instantaneous',
      damage: preset.damage || '',
      damageType: preset.damageType || '',
      prepared: true,
      description: preset.description || '',
      classLevels: preset.classLevels,
      classLevelsStr: preset.classLevelsStr,
      edition: preset.edition
    };

    onUpdateCharacter({
      ...character,
      spells: [...character.spells, newSpell]
    });

    eventBus.emit('SpellLearned', {
      characterId: character.id,
      spellName: newSpell.name,
      level: newSpell.level
    });

    setPendingSpellConfirm(null);
    setShowAddSpellModal(false);
  };

  const filteredSpells = character.spells.filter(spell => {
    if (levelFilter !== 'all' && spell.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = spell.name.toLowerCase().includes(q);
      const matchSchool = (spell.school || '').toLowerCase().includes(q);
      const matchDesc = (spell.description || '').toLowerCase().includes(q);
      if (!matchName && !matchSchool && !matchDesc) return false;
    }
    return true;
  });

  return (
    <CollapsibleBox
      title="Spellbook & Known Spells"
      icon={<Sparkles className="w-5 h-5 text-amber-500" />}
      storageKey="sheet4_spells"
      headerExtra={
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAddSpellModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Spell
        </button>
      }
    >
      <div className="space-y-4 pt-2">
        {/* Search & Level Filters */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spells by name, school, or effect..."
              className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-stone-400 hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                levelFilter === 'all' ? 'bg-amber-600 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              All Levels
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  levelFilter === lvl ? 'bg-amber-600 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl === 0 ? 'Cantrips' : `Lvl ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {/* Spells Grid */}
        {character.spells.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4 text-center">
            No spells added yet. Click &quot;+ Add Spell&quot; to build your spellbook or search official SRD spells!
          </p>
        ) : filteredSpells.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4 text-center">
            No spells match your active filter or search query.
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredSpells.map((spell) => {
              const meta = getDamageTypeMeta(spell.damageType || '');
              const elig = checkSpellEligibility(character, spell);
              return (
                <div
                  key={spell.id}
                  className="bg-stone-950 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleTogglePrepared(spell.id)}
                        className={`p-1 rounded transition ${
                          spell.prepared ? 'text-emerald-400' : 'text-stone-600 hover:text-stone-400'
                        }`}
                        title={spell.prepared ? 'Prepared' : 'Unprepared'}
                      >
                        {spell.prepared ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>

                      <span className="font-serif font-bold text-amber-200 text-sm">{spell.name}</span>

                      <span className="text-[10px] bg-stone-900 text-amber-400 font-mono px-2 py-0.5 rounded border border-stone-800">
                        {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                      </span>

                      {spell.school && (
                        <span className="text-[10px] text-stone-400 font-mono">
                          {spell.school}
                        </span>
                      )}

                      {/* Class Requirement Status Badge */}
                      {!elig.isClassMatch ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900/90 border border-stone-700/60 text-stone-300 flex items-center gap-1" title={elig.statusText}>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Cross-Class</span>
                        </span>
                      ) : !elig.isLevelMet ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 flex items-center gap-1" title={elig.statusText}>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Req {character.characterClass || 'Class'} Lvl {elig.minClassLevelRequired}+</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/90 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Ready for {character.characterClass || 'Class'}</span>
                        </span>
                      )}

                      {spell.classLevelsStr && (
                        <span className="text-[10px] text-amber-300/90 font-mono bg-amber-950/60 border border-amber-700/40 px-2 py-0.5 rounded">
                          Classes: {spell.classLevelsStr}
                        </span>
                      )}

                      {spell.damageType && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                          {spell.damageType}
                        </span>
                      )}
                    </div>

                    <p className="text-stone-400 text-[11px] leading-relaxed line-clamp-2">
                      {spell.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isShapeshiftAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold border border-emerald-600/60 rounded-lg transition flex items-center gap-1 shadow cursor-pointer text-xs"
                        title="Launch Nexus Shapeshift Engine for this spell"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 text-teal-200 font-bold border border-teal-600/60 rounded-lg transition flex items-center gap-1 shadow cursor-pointer text-xs"
                        title="Launch Nexus Companion & Summon Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}

                    <button
                      onClick={() => setTargetModalSpell(spell)}
                      className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-200 rounded-lg font-bold border border-amber-600/50 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Cast
                    </button>

                    {spell.damage && (
                      <button
                        onClick={() => onRollDamage(`Cast ${spell.name} (${spell.damageType || 'Damage'})`, spell.damage || '1d8')}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg font-bold border border-rose-600/50 transition flex items-center gap-1"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" /> Dmg ({spell.damage})
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSpell(spell.id)}
                      className="p-1.5 text-stone-500 hover:text-rose-400 transition"
                      title="Delete Spell"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Add Custom / Preset Spell */}
      {showAddSpellModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Add Spell to Spellbook
            </h3>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Spell Name *</label>
                <input
                  type="text"
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  placeholder="e.g. Fireball, Cure Wounds, Shield"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Spell Level</label>
                  <select
                    value={spellLevel}
                    onChange={(e) => setSpellLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold"
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
                    placeholder="Evocation, Abjuration..."
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage / Healing Formula</label>
                  <input
                    type="text"
                    value={spellDamage}
                    onChange={(e) => setSpellDamage(e.target.value)}
                    placeholder="e.g. 8d6 or 1d8 + 4"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage Type</label>
                  <select
                    value={spellDamageType}
                    onChange={(e) => setSpellDamageType(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  >
                    {OFFICIAL_DAMAGE_TYPES.map(dt => (
                      <option key={dt.name} value={dt.name}>{dt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Description & Effects</label>
                <textarea
                  value={spellDescription}
                  onChange={(e) => setSpellDescription(e.target.value)}
                  rows={3}
                  placeholder="Spell effect description..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              {/* Presets Catalog */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-serif font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span>📜</span>
                    {character.edition === '3.5e' ? '3.5e d20SRD Spells Library' : 'Official SRD Spells Library'}
                  </span>
                  <a
                    href="https://www.d20srd.org/srd/spells/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-mono"
                  >
                    d20srd.org Spells Index ↗
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Search SRD spells library (e.g. Fireball, Heal, Magic Missile)..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterForMyClass(!filterForMyClass)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        filterForMyClass
                          ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{filterForMyClass ? `My Class (${character.characterClass || 'Class'})` : 'All Classes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDmBypassMode(!dmBypassMode)}
                      title="Toggle DM Bypass Mode to freely add cross-class or high-level spells"
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        dmBypassMode
                          ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>👑</span>
                      <span>{dmBypassMode ? 'DM Bypass ON' : 'DM Mode'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                  {(character.edition === '3.5e'
                    ? [...PRESET_35E_SPELLS, ...PRESET_5E_SPELLS]
                    : [...PRESET_5E_SPELLS, ...PRESET_35E_SPELLS]
                  )
                    .map((preset) => {
                      const elig = checkSpellEligibility(character, preset);
                      return { preset, elig };
                    })
                    .filter(({ preset, elig }) => {
                      if (filterForMyClass && !elig.isClassMatch) return false;
                      if (!presetSearch.trim()) return true;
                      const q = presetSearch.toLowerCase();
                      return (
                        preset.name?.toLowerCase().includes(q) ||
                        preset.school?.toLowerCase().includes(q) ||
                        (preset.classLevelsStr || '').toLowerCase().includes(q)
                      );
                    })
                    .map(({ preset, elig }) => (
                      <button
                        key={preset.id || preset.name}
                        onClick={() => handleAddPresetSpell(preset as any)}
                        className="text-left bg-stone-950 hover:bg-stone-800 p-2 rounded-lg border border-stone-800 hover:border-amber-500/50 text-xs flex justify-between items-start gap-2 transition"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-amber-200 truncate">{preset.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {preset.level === 0 ? 'Cantrip' : `Level ${preset.level}`} | {preset.school}
                          </div>
                          {preset.classLevelsStr && (
                            <div className="text-[10px] text-amber-300/80 font-mono truncate">
                              Classes: {preset.classLevelsStr}
                            </div>
                          )}

                          {/* Class / Level Requirement Indicator */}
                          <div className="pt-0.5">
                            {elig.badgeStyle === 'green' ? (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded inline-block">
                                🟢 {elig.statusText}
                              </span>
                            ) : elig.badgeStyle === 'amber' ? (
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-600/60 px-1.5 py-0.5 rounded inline-block">
                                🟡 {elig.statusText}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded inline-block">
                                ⚪ {elig.statusText}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-amber-400 text-xs font-bold shrink-0 mt-1">+ Add</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Warning Confirmation Overlay if selecting a spell with unfulfilled requirement */}
            {pendingSpellConfirm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-stone-900 border border-amber-600/80 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-amber-400 font-serif font-bold text-base border-b border-stone-800 pb-2">
                    <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                    <span>Class & Level Requirement Warning</span>
                  </div>

                  <p className="text-stone-300 text-xs leading-relaxed">
                    You are adding <strong className="text-amber-200">{pendingSpellConfirm.preset.name}</strong> to your spellbook.
                  </p>

                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between text-stone-400 font-mono">
                      <span>Spell Requirement:</span>
                      <span className="text-amber-300 font-bold">{pendingSpellConfirm.eligibility.statusText}</span>
                    </div>
                    {pendingSpellConfirm.preset.classLevelsStr && (
                      <div className="flex justify-between text-stone-400 font-mono">
                        <span>Class Spell Lists:</span>
                        <span className="text-stone-200">{pendingSpellConfirm.preset.classLevelsStr}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-400 font-mono">
                      <span>Your Character:</span>
                      <span className="text-emerald-400 font-bold">Level {character.level} {character.characterClass || 'Adventurer'}</span>
                    </div>
                  </div>

                  <p className="text-stone-400 text-[11px] italic">
                    Note: Rules allow DM custom house rules or magical items to grant cross-class spells. Do you wish to add this spell anyway?
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                    <button
                      onClick={() => setPendingSpellConfirm(null)}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddPresetSpell(pendingSpellConfirm.preset, true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      Add Spell Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddSpellModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleAddCustomSpell}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Custom Spell
              </button>
            </div>
          </div>
        </div>
      )}
    </CollapsibleBox>
  );
};
