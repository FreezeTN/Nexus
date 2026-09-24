import React, { useState } from 'react';
import { CharacterData, Spell } from '../../types';
import { getEffectiveMaxHp } from '../../utils/dndCalculations';
import { isShapeshiftAbility } from '../../data/transformationData';
import { isCompanionSummonAbility } from '../../data/companionData';
import { findWeatherTriggerForSpell } from '../battlemap/weatherAbilityTriggers';
import { WeatherEffectType } from '../battlemap/battlemapTypes';
import { WEATHER_DEFINITIONS } from '../battlemap/weatherDefinitions';
import { eventBus } from '../../events/eventBus';
import { Wand2, Sparkles, CheckSquare, Square, Shield, X, Users, PawPrint, Flame, ChevronUp, CloudRain } from 'lucide-react';

interface SpellTargetModalProps {
  spell: Spell;
  caster: CharacterData;
  allCharacters: CharacterData[];
  onClose: () => void;
  onConfirmCast: (
    spell: Spell,
    selectedTargetIds: string[],
    conditionName: string,
    slotLevel?: number,
    scaledDamage?: string
  ) => void;
}

// Map common 5e spell names to standard status condition names
export function getAutoConditionForSpell(spellName: string): string {
  const name = spellName.toLowerCase().trim();
  if (name.includes('bless')) return 'Bless';
  if (name.includes('bane')) return 'Bane';
  if (name.includes('shield of faith')) return 'Shield of Faith';
  if (name.includes('shield')) return 'Shield';
  if (name.includes('haste')) return 'Haste';
  if (name.includes('guidance')) return 'Guidance';
  if (name.includes('bardic inspiration')) return 'Bardic Inspiration';
  if (name.includes('faerie fire')) return 'Faerie Fire';
  if (name.includes('heroism')) return 'Heroism';
  if (name.includes('aid')) return 'Aid';
  if (name.includes('hold person') || name.includes('hold monster')) return 'Paralyzed';
  if (name.includes('blindness') || name.includes('deafness')) return 'Blinded';
  if (name.includes('invisibility')) return 'Invisible';
  if (name.includes('ray of sickness') || name.includes('poison spray')) return 'Poisoned';
  if (name.includes('barkskin')) return 'Barkskin';
  if (name.includes('fly')) return 'Fly';
  return spellName;
}

export const SpellTargetModal: React.FC<SpellTargetModalProps> = ({
  spell,
  caster,
  allCharacters,
  onClose,
  onConfirmCast
}) => {
  const defaultCond = getAutoConditionForSpell(spell.name);
  const [conditionName, setConditionName] = useState<string>(defaultCond);

  // RAW Weather Modification Spell Detection
  const weatherTrigger = findWeatherTriggerForSpell(spell.name);
  const [applyWeatherShift, setApplyWeatherShift] = useState<boolean>(Boolean(weatherTrigger));
  const [selectedWeather, setSelectedWeather] = useState<WeatherEffectType>(weatherTrigger?.weatherEffect || 'storm');
  
  const isLeveledSpell = (spell.level || 0) > 0;
  const availableSlotTiers = (caster.spellSlots || [])
    .filter(s => s.level >= (spell.level || 1) && s.max > 0)
    .sort((a, b) => a.level - b.level);

  const defaultSlotLevel = availableSlotTiers.find(s => s.level === spell.level && s.current > 0)?.level
    ?? availableSlotTiers.find(s => s.current > 0)?.level
    ?? spell.level;

  const [selectedSlotLevel, setSelectedSlotLevel] = useState<number>(defaultSlotLevel);

  // Scaled damage calculation for upcasting
  const getScaledDamage = (baseDamage?: string, baseLevel: number = 1, currentSlotLevel: number = 1): string => {
    if (!baseDamage) return '';
    const diff = currentSlotLevel - baseLevel;
    if (diff <= 0) return baseDamage;

    const match = baseDamage.trim().match(/^(\d+)d(\d+)(.*)$/i);
    if (match) {
      const baseDiceCount = parseInt(match[1]);
      const diceSize = match[2];
      const modifierPart = match[3] || '';
      const scaledCount = baseDiceCount + diff;
      return `${scaledCount}d${diceSize}${modifierPart}`;
    }
    return `${baseDamage} (+${diff} lvls)`;
  };

  const scaledDamage = getScaledDamage(spell.damage, spell.level || 1, selectedSlotLevel);
  const isUpcast = isLeveledSpell && selectedSlotLevel > (spell.level || 1);

  // By default, select all non-monster characters if it's a buff, or caster if list is small
  const initialTargetIds = allCharacters
    .filter(c => !c.isMonster && !c.isVendor)
    .map(c => c.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialTargetIds.length > 0 ? initialTargetIds : [caster.id]
  );

  const toggleTarget = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(tId => tId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(allCharacters.map(c => c.id));
  };

  const handleSelectCasterOnly = () => {
    setSelectedIds([caster.id]);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (weatherTrigger && applyWeatherShift) {
      const weatherName = WEATHER_DEFINITIONS[selectedWeather]?.name || selectedWeather;
      eventBus.emit('WeatherChanged', {
        weather: selectedWeather,
        sourceName: caster.name,
        sourceType: 'spell',
        reason: `Cast ${spell.name} (${weatherTrigger.source}): Changed battlemap atmospheric weather to ${weatherName}`
      });
    }

    onConfirmCast(
      spell,
      selectedIds,
      conditionName.trim() || spell.name,
      isLeveledSpell ? selectedSlotLevel : undefined,
      isUpcast ? scaledDamage : spell.damage
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-950 border border-purple-600/50 rounded-xl text-purple-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-lg flex items-center gap-2">
                Cast {spell.name}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {spell.level === 0 ? 'Cantrip' : `Level ${spell.level} Spell`} • Caster: <span className="text-amber-400 font-semibold">{caster.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Shapeshift Engine Banner if spell allows transformation */}
          {isShapeshiftAbility(spell.name, spell.description) && (
            <div className="bg-emerald-950/90 border border-emerald-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-200 shadow">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">Shapeshifting Spell Detected</div>
                  <div className="text-[11px] text-emerald-200/80">
                    Use the <strong>Nexus Shapeshift Engine</strong> on your sheet header or spellbook to transform form stats!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summoning Companion Banner if spell summons familiar or companion */}
          {isCompanionSummonAbility(spell.name, spell.description) && (
            <div className="bg-teal-950/90 border border-teal-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-teal-200 shadow">
              <div className="flex items-center gap-2">
                <span className="text-xl">🦅</span>
                <div>
                  <div className="font-bold text-teal-300">Summon / Companion Spell Detected</div>
                  <div className="text-[11px] text-teal-200/80">
                    Use the <strong>Nexus Companion & Summon Engine</strong> on your sheet header or spellbook to conjure and add your companion directly into your Campaign Roster!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcast & Spell Slot Selector (if leveled spell) */}
          {isLeveledSpell && availableSlotTiers.length > 0 && (
            <div className="bg-stone-950 p-3 rounded-xl border border-purple-800/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Spell Slot Level to Expend:</span>
                </label>
                <span className="text-[10px] font-mono text-stone-400">
                  Base: Level {spell.level}
                </span>
              </div>

              {/* Slot buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {availableSlotTiers.map(slot => {
                  const isSelected = selectedSlotLevel === slot.level;
                  const isBase = slot.level === (spell.level || 1);
                  const isDepleted = slot.current <= 0;

                  return (
                    <button
                      key={slot.level}
                      type="button"
                      onClick={() => setSelectedSlotLevel(slot.level)}
                      className={`p-2 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900/60 border-purple-400 text-purple-100 shadow-md ring-1 ring-purple-500/50'
                          : isDepleted
                          ? 'bg-stone-950/40 border-stone-800/80 text-stone-600 hover:border-stone-700'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-purple-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold font-mono">
                        <span>Lvl {slot.level}</span>
                        {isBase && <span className="text-[9px] text-amber-400">Base</span>}
                        {!isBase && <span className="text-[9px] text-purple-300">+{slot.level - (spell.level || 1)}</span>}
                      </div>
                      <div className="text-[10px] font-mono mt-1 flex items-center justify-between">
                        <span className={slot.current > 0 ? 'text-purple-300' : 'text-rose-400'}>
                          {slot.current}/{slot.max} slots
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Upcast Scaling Preview */}
              {spell.damage && (
                <div className="p-2 bg-stone-900/90 rounded-lg border border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Damage / Healing Output:</span>
                  </span>
                  <div className="font-mono font-bold flex items-center gap-2">
                    {isUpcast ? (
                      <>
                        <span className="text-stone-500 line-through text-[11px]">{spell.damage}</span>
                        <span className="text-amber-300 text-xs px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50">
                          ⚡ {scaledDamage} ({spell.damageType || 'Damage'})
                        </span>
                      </>
                    ) : (
                      <span className="text-stone-200">{spell.damage} {spell.damageType && `(${spell.damageType})`}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RAW Weather Manipulation Card */}
          {weatherTrigger && (
            <div className="bg-gradient-to-r from-sky-950/60 via-stone-900 to-sky-950/60 p-3 rounded-xl border border-sky-600/40 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{weatherTrigger.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-sky-200 flex items-center gap-1.5 font-serif">
                      <span>Atmospheric Weather Shift</span>
                      <span className="text-[9px] bg-sky-900/60 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30 uppercase tracking-wider font-sans font-bold">
                        5e RAW
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">{weatherTrigger.source}</div>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-sky-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyWeatherShift}
                    onChange={(e) => setApplyWeatherShift(e.target.checked)}
                    className="accent-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-sky-300">Shift Weather</span>
                </label>
              </div>

              <p className="text-[11px] text-stone-300 leading-tight">
                {weatherTrigger.description}
              </p>

              {applyWeatherShift && weatherTrigger.isControlWeatherMultiChoice && (
                <div className="space-y-1.5 pt-1 border-t border-sky-900/40">
                  <label className="text-[11px] font-bold text-sky-300">Choose Desired Weather Condition:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'storm', label: '⚡ Thunderstorm & Tempest' },
                      { id: 'rain', label: '🌧️ Steady Torrential Rain' },
                      { id: 'blizzard', label: '❄️ Blizzard & Whiteout' },
                      { id: 'snow', label: '🌨️ Gentle Snow' },
                      { id: 'wind', label: '💨 Strong Gale Wind' },
                      { id: 'none', label: '☀️ Clear Weather' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedWeather(opt.id as WeatherEffectType)}
                        className={`px-2 py-1.5 text-left text-xs rounded-lg border transition flex items-center gap-1.5 ${
                          selectedWeather === opt.id
                            ? 'bg-sky-900 border-sky-400 text-sky-100 font-bold shadow'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {applyWeatherShift && !weatherTrigger.isControlWeatherMultiChoice && (
                <div className="flex items-center gap-2 text-xs bg-sky-950/40 p-2 rounded-lg border border-sky-800/40 text-sky-200">
                  <span className="text-stone-400">Target Atmosphere:</span>
                  <strong className="text-sky-100 flex items-center gap-1 font-bold">
                    {WEATHER_DEFINITIONS[weatherTrigger.weatherEffect]?.icon} {WEATHER_DEFINITIONS[weatherTrigger.weatherEffect]?.name}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Status Condition Field */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <label className="block text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Applied Status Effect / Condition
              </span>
              <span className="text-[10px] text-stone-400 font-mono font-normal">Auto-detected from spell</span>
            </label>
            <input
              type="text"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g. Bless, Haste, Shield, Shield of Faith..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-stone-400 leading-tight">
              Applying <strong className="text-cyan-300">{conditionName || 'this spell'}</strong> will update character status and automatically populate mechanical fields like <strong className="text-amber-300">Extra Attack Bonus</strong> in combat!
            </p>
          </div>

          {/* Target Characters Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Select Targets to Receive Status Effect ({selectedIds.length} selected):
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleSelectCasterOnly}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  Caster Only
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {allCharacters.map(char => {
                const isSelected = selectedIds.includes(char.id);
                const isCaster = char.id === caster.id;
                const activeConds = char.conditions || [];

                return (
                  <div
                    key={char.id}
                    onClick={() => toggleTarget(char.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/80 text-stone-100'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-amber-400">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-stone-600" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-2">
                          <span>{char.name}</span>
                          {isCaster && (
                            <span className="text-[9px] bg-purple-900/80 text-purple-200 border border-purple-500/50 px-1.5 py-0.2 rounded font-mono">
                              Caster
                            </span>
                          )}
                          {char.isMonster && (
                            <span className="text-[9px] bg-rose-900/80 text-rose-200 border border-rose-500/50 px-1.5 py-0.2 rounded font-mono">
                              Monster
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          HP {char.hpCurrent}/{getEffectiveMaxHp(char)} • AC {char.armorClass} • {char.characterClass || 'Adventurer'}
                        </div>
                      </div>
                    </div>

                    {activeConds.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap max-w-[140px] justify-end">
                        {activeConds.slice(0, 2).map((c, idx) => (
                          <span key={idx} className="text-[9px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                            {c}
                          </span>
                        ))}
                        {activeConds.length > 2 && (
                          <span className="text-[9px] text-stone-500 font-mono">+{activeConds.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cast & Apply to {selectedIds.length} Target{selectedIds.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
