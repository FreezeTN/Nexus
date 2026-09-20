import React, { useState, useMemo } from 'react';
import {
  Target,
  Circle,
  Triangle,
  Square,
  Crosshair,
  Check,
  X,
  Sparkles,
  BookOpen,
  User,
  Sliders
} from 'lucide-react';
import { ActiveSpellTargetingState } from './battlemapTypes';
import { Combatant } from '../combat/encounter/encounterTypes';
import { CharacterData, Spell } from '../../types';

export interface SpellTargetingPaletteProps {
  activeTargeting: ActiveSpellTargetingState | null;
  activeCombatant: Combatant;
  onUpdateTargeting: (state: ActiveSpellTargetingState | null) => void;
  caughtTargets: Combatant[];
  targetCombatant?: Combatant | null;
  cursorDistanceFeet?: number;
  character?: CharacterData;
  selectedCharacter?: CharacterData | null;
  allCharacters?: CharacterData[];
  onConfirmCast?: (options?: {
    spellName: string;
    targets: Combatant[];
    damageDice?: string;
    damageType?: string;
    saveType?: string;
    saveDc?: number;
  }) => void;
  onClose: () => void;
}

/**
 * Returns an appropriate thematic emoji/icon for a given spell.
 */
export function getSpellIcon(spell: Spell): string {
  const name = spell.name.toLowerCase();
  const school = (spell.school || '').toLowerCase();
  const damageType = (spell.damageType || '').toLowerCase();

  if (damageType.includes('fire') || name.includes('fire') || name.includes('flame') || name.includes('burn')) return '🔥';
  if (damageType.includes('cold') || damageType.includes('ice') || name.includes('frost') || name.includes('ice') || name.includes('chill')) return '❄️';
  if (damageType.includes('lightning') || name.includes('lightning') || name.includes('shock') || damageType.includes('thunder') || name.includes('thunder')) return '⚡';
  if (damageType.includes('acid')) return '🧪';
  if (damageType.includes('poison')) return '☠️';
  if (damageType.includes('radiant') || name.includes('sacred') || name.includes('holy') || name.includes('guiding') || name.includes('bless')) return '✨';
  if (damageType.includes('necrotic') || name.includes('death') || name.includes('toll') || name.includes('chill touch')) return '💀';
  if (damageType.includes('force') || name.includes('missile') || name.includes('blast') || name.includes('spiritual weapon')) return '💥';
  if (damageType.includes('psychic') || name.includes('mind') || name.includes('dissonant')) return '🧠';
  if (name.includes('heal') || name.includes('cure') || name.includes('wound') || name.includes('reviv') || name.includes('prayer')) return '💚';
  if (school.includes('abjur') || name.includes('shield') || name.includes('armor') || name.includes('ward') || name.includes('sanctuary')) return '🛡️';
  if (school.includes('divin') || name.includes('detect') || name.includes('see') || name.includes('identify')) return '👁️';
  if (school.includes('conjur') || name.includes('step') || name.includes('teleport') || name.includes('dimension') || name.includes('fog')) return '🌀';
  if (school.includes('enchant') || name.includes('charm') || name.includes('hold') || name.includes('sleep') || name.includes('command')) return '💫';
  if (school.includes('illus') || name.includes('invis') || name.includes('mirror') || name.includes('major image')) return '🎭';
  if (school.includes('transmut') || name.includes('fly') || name.includes('haste') || name.includes('slow')) return '✨';
  return '🪄';
}

/**
 * Parses range, target shape, AoE size, damage dice, damage type, and save DC from a character's Spell object.
 */
export function parseSpellToTargeting(
  spell: Spell,
  casterCombatant: Combatant,
  character?: CharacterData | null
): ActiveSpellTargetingState {
  // 1. Range Parsing
  let rangeFeet = 30; // default safe fallback
  const rangeStr = (spell.range || '').toLowerCase();
  if (rangeStr.includes('touch')) {
    rangeFeet = 5;
  } else if (rangeStr.includes('self')) {
    rangeFeet = 5;
  } else if (rangeStr.includes('sight')) {
    rangeFeet = 300;
  } else if (rangeStr.includes('unlimited')) {
    rangeFeet = 1000;
  } else {
    const match = rangeStr.match(/(\d+)\s*(?:ft|feet|foot)/i);
    if (match) {
      rangeFeet = parseInt(match[1], 10);
    }
  }

  // 2. Shape & AoE Size Parsing
  const fullText = `${spell.description || ''} ${spell.range || ''}`.toLowerCase();
  let shape: 'single_target' | 'sphere' | 'cone' | 'line' | 'cube' = 'single_target';
  let areaSizeFeet: number | undefined = undefined;

  if (fullText.includes('cone')) {
    shape = 'cone';
    const coneMatch = fullText.match(/(\d+)[-\s]foot cone/);
    areaSizeFeet = coneMatch ? parseInt(coneMatch[1], 10) : 15;
    if (rangeStr.includes('self')) {
      rangeFeet = areaSizeFeet;
    }
  } else if (fullText.includes('sphere') || fullText.includes('radius')) {
    shape = 'sphere';
    const radiusMatch = fullText.match(/(\d+)[-\s]foot(?:-radius|\s+radius|\s+sphere)/);
    areaSizeFeet = radiusMatch ? parseInt(radiusMatch[1], 10) : 20;
  } else if (fullText.includes('line')) {
    shape = 'line';
    const lineMatch = fullText.match(/(\d+)[-\s]foot(?:-long|\s+line)/);
    areaSizeFeet = lineMatch ? parseInt(lineMatch[1], 10) : 30;
  } else if (fullText.includes('cube')) {
    shape = 'cube';
    const cubeMatch = fullText.match(/(\d+)[-\s]foot cube/);
    areaSizeFeet = cubeMatch ? parseInt(cubeMatch[1], 10) : 20;
  }

  // 3. Damage Dice Parsing
  let damageDice = spell.damage;
  if (!damageDice) {
    const dmgMatch = (spell.description || '').match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)/i);
    if (dmgMatch) {
      damageDice = dmgMatch[1];
    }
  }

  // 4. Damage Type Parsing
  let damageType = spell.damageType;
  if (!damageType) {
    const standardTypes = ['fire', 'cold', 'lightning', 'thunder', 'acid', 'poison', 'necrotic', 'radiant', 'force', 'psychic'];
    for (const t of standardTypes) {
      if (fullText.includes(t)) {
        damageType = t;
        break;
      }
    }
  }

  // 5. Save Type Parsing
  let saveType = spell.saveType;
  if (!saveType) {
    const saves = ['DEX', 'CON', 'WIS', 'STR', 'INT', 'CHA'];
    for (const s of saves) {
      if (new RegExp(`${s}(?:terity|stitution|dom|ength|elligence|risma)?\\s+sav`, 'i').test(fullText)) {
        saveType = s;
        break;
      }
    }
  }

  // 6. Save DC Calculation
  let saveDc = 14;
  if (character?.spellSaveDCOverride) {
    saveDc = character.spellSaveDCOverride;
  } else if (character) {
    const ability = character.spellcastingAbility || 'INT';
    const score = character.abilities?.[ability]?.score ?? 10;
    const mod = Math.floor((score - 10) / 2);
    const prof = Math.floor(((character.level || 1) - 1) / 4) + 2;
    saveDc = 8 + prof + mod;
  }

  return {
    sourceCombatantId: casterCombatant.id,
    sourceCombatantName: casterCombatant.name,
    spellName: spell.name,
    rangeFeet,
    shape,
    areaSizeFeet,
    damageDice,
    damageType,
    saveType,
    saveDc,
    description: spell.description
  };
}

export const SpellTargetingPalette: React.FC<SpellTargetingPaletteProps> = ({
  activeTargeting,
  activeCombatant,
  onUpdateTargeting,
  caughtTargets,
  targetCombatant,
  cursorDistanceFeet = 0,
  character,
  selectedCharacter,
  allCharacters = [],
  onConfirmCast,
  onClose
}) => {
  // Determine available character profiles for switching if needed
  // (e.g. active token might be an enemy or non-caster, while player character has spells)
  const tokenCharacter = useMemo<CharacterData | null>(() => {
    if (selectedCharacter) return selectedCharacter;
    if (activeCombatant.isPlayerChar && character) return character;
    if (character && character.id === activeCombatant.id) return character;

    // Search in allCharacters
    const cleanId = activeCombatant.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '').replace(/-\d+$/, '');
    const cleanName = activeCombatant.name.toLowerCase().replace(/\s+#\d+$/, '');
    const found = allCharacters.find(
      (c) =>
        c.id === activeCombatant.id ||
        c.id.replace(/^(player-|party-|ally-|enemy-|comb-)/, '') === cleanId ||
        c.name.toLowerCase() === cleanName ||
        c.name.toLowerCase() === activeCombatant.name.toLowerCase()
    );
    return found || null;
  }, [selectedCharacter, activeCombatant, character, allCharacters]);

  // Determine whether to view the token's character spells or the player's primary character spells
  const [activeSourceMode, setActiveSourceMode] = useState<'token' | 'player'>(() => {
    // If token has spells, default to token; otherwise if player character has spells, default to player
    if (tokenCharacter && tokenCharacter.spells && tokenCharacter.spells.length > 0) {
      return 'token';
    }
    if (character && character.spells && character.spells.length > 0) {
      return 'player';
    }
    return 'token';
  });

  const effectiveCharacter = activeSourceMode === 'player' && character ? character : (tokenCharacter || character || null);
  const characterSpells = useMemo<Spell[]>(() => {
    return effectiveCharacter?.spells || [];
  }, [effectiveCharacter]);

  // Selected spell state
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(() => {
    if (activeTargeting?.spellName) {
      const match = characterSpells.find((s) => s.name.toLowerCase() === activeTargeting.spellName.toLowerCase());
      return match ? match.id : null;
    }
    return characterSpells[0]?.id || null;
  });

  // Level filter state for spell lists with multiple spell levels
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [customRange, setCustomRange] = useState<number>(activeTargeting?.rangeFeet || 60);
  const [customAreaSize, setCustomAreaSize] = useState<number>(activeTargeting?.areaSizeFeet || 20);
  const [saveDcInput, setSaveDcInput] = useState<number>(activeTargeting?.saveDc || 14);

  // Available spell levels in this character's spells
  const availableLevels = useMemo(() => {
    const levels = new Set<number>();
    characterSpells.forEach((s) => levels.add(s.level));
    return Array.from(levels).sort((a, b) => a - b);
  }, [characterSpells]);

  const filteredSpells = useMemo(() => {
    if (selectedLevelFilter === 'all') return characterSpells;
    return characterSpells.filter((s) => s.level === selectedLevelFilter);
  }, [characterSpells, selectedLevelFilter]);

  const currentShape = activeTargeting?.shape || 'single_target';
  const currentRange = activeTargeting?.rangeFeet || customRange;
  const isOutOfRange = cursorDistanceFeet > currentRange;

  const handleSelectSpell = (spell: Spell) => {
    setSelectedSpellId(spell.id);
    const parsed = parseSpellToTargeting(spell, activeCombatant, effectiveCharacter);
    setCustomRange(parsed.rangeFeet);
    if (parsed.areaSizeFeet) setCustomAreaSize(parsed.areaSizeFeet);
    if (parsed.saveDc) setSaveDcInput(parsed.saveDc);
    onUpdateTargeting(parsed);
  };

  const handleShapeChange = (shape: 'single_target' | 'sphere' | 'cone' | 'line' | 'cube') => {
    onUpdateTargeting({
      sourceCombatantId: activeCombatant.id,
      sourceCombatantName: activeCombatant.name,
      spellName: activeTargeting?.spellName || 'Custom Spell',
      rangeFeet: currentRange,
      shape,
      areaSizeFeet: shape === 'single_target' ? undefined : (activeTargeting?.areaSizeFeet || customAreaSize),
      damageDice: activeTargeting?.damageDice,
      damageType: activeTargeting?.damageType,
      saveType: activeTargeting?.saveType,
      saveDc: activeTargeting?.saveDc || saveDcInput,
      description: activeTargeting?.description
    });
  };

  const handleCustomRangeChange = (val: number) => {
    const feet = Math.max(5, Math.min(1000, val));
    setCustomRange(feet);
    onUpdateTargeting({
      sourceCombatantId: activeCombatant.id,
      sourceCombatantName: activeCombatant.name,
      spellName: activeTargeting?.spellName || 'Custom Spell',
      rangeFeet: feet,
      shape: currentShape,
      areaSizeFeet: activeTargeting?.areaSizeFeet,
      damageDice: activeTargeting?.damageDice,
      damageType: activeTargeting?.damageType,
      saveType: activeTargeting?.saveType,
      saveDc: activeTargeting?.saveDc || saveDcInput,
      description: activeTargeting?.description
    });
  };

  const handleCustomAreaSizeChange = (val: number) => {
    const feet = Math.max(5, Math.min(300, val));
    setCustomAreaSize(feet);
    onUpdateTargeting({
      sourceCombatantId: activeCombatant.id,
      sourceCombatantName: activeCombatant.name,
      spellName: activeTargeting?.spellName || 'Custom Spell',
      rangeFeet: currentRange,
      shape: currentShape,
      areaSizeFeet: feet,
      damageDice: activeTargeting?.damageDice,
      damageType: activeTargeting?.damageType,
      saveType: activeTargeting?.saveType,
      saveDc: activeTargeting?.saveDc || saveDcInput,
      description: activeTargeting?.description
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-red-950/95 border-b border-amber-800/80 p-3 flex flex-col gap-2.5 text-xs animate-fadeIn z-30 shadow-2xl backdrop-blur-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-serif font-bold text-amber-300">
            <Target className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Spell & Attack Targeting HUD</span>
          </div>

          <span className="bg-amber-900/80 text-amber-200 border border-amber-600/60 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1">
            <span>Caster:</span>
            <span className="text-white">{activeCombatant.name}</span>
          </span>

          {/* Spellbook Source Indicator & Switcher (if token is different from player character) */}
          {character && character.name !== activeCombatant.name && (
            <div className="flex items-center bg-stone-950 border border-amber-800/60 rounded-full p-0.5 text-[10px] font-sans">
              <button
                type="button"
                onClick={() => setActiveSourceMode('token')}
                className={`px-2 py-0.5 rounded-full transition ${
                  activeSourceMode === 'token'
                    ? 'bg-amber-800 text-amber-100 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`Use spells from selected token: ${tokenCharacter?.name || activeCombatant.name}`}
              >
                Token ({tokenCharacter?.spells?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceMode('player')}
                className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                  activeSourceMode === 'player'
                    ? 'bg-amber-800 text-amber-100 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`Use spells from player character: ${character.name}`}
              >
                <User className="w-2.5 h-2.5" />
                <span>{character.name} ({character.spells?.length || 0})</span>
              </button>
            </div>
          )}

          <span className="bg-stone-950 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full text-[11px] font-mono">
            {activeTargeting?.spellName || 'Custom Spell'} ({currentRange} ft)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onConfirmCast && (
            <button
              type="button"
              onClick={() => {
                const effectiveTargets = currentShape === 'single_target'
                  ? (targetCombatant ? [targetCombatant] : [])
                  : caughtTargets;

                onConfirmCast({
                  spellName: activeTargeting?.spellName || 'Custom Spell',
                  targets: effectiveTargets,
                  damageDice: activeTargeting?.damageDice,
                  damageType: activeTargeting?.damageType,
                  saveType: activeTargeting?.saveType,
                  saveDc: activeTargeting?.saveDc || saveDcInput
                });
              }}
              disabled={isOutOfRange || (currentShape === 'single_target' && !targetCombatant) || (currentShape !== 'single_target' && caughtTargets.length === 0)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold shadow transition ${
                isOutOfRange || (currentShape === 'single_target' && !targetCombatant) || (currentShape !== 'single_target' && caughtTargets.length === 0)
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-stone-950 font-extrabold shadow-red-900/50'
              }`}
              title="Confirm and execute spell targeting"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confirm Cast</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-lg transition"
            title="Cancel Spell Targeting"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Spells of Selected Character Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono uppercase shrink-0">
          <BookOpen className="w-3 h-3" />
          <span>{effectiveCharacter?.name || activeCombatant.name}'s Spells:</span>
        </div>

        {/* Level Filters if multiple spell levels exist */}
        {availableLevels.length > 1 && (
          <div className="flex items-center gap-1 shrink-0 bg-stone-950 border border-stone-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setSelectedLevelFilter('all')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                selectedLevelFilter === 'all'
                  ? 'bg-amber-900 text-amber-200 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All
            </button>
            {availableLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                  selectedLevelFilter === lvl
                    ? 'bg-amber-900 text-amber-200 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl === 0 ? 'Cantrip' : `Lv ${lvl}`}
              </button>
            ))}
          </div>
        )}

        {/* Character's Spell Buttons */}
        {filteredSpells.map((spell) => {
          const isSelected = selectedSpellId === spell.id || activeTargeting?.spellName.toLowerCase() === spell.name.toLowerCase();
          const icon = getSpellIcon(spell);

          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => handleSelectSpell(spell)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition shadow-sm ${
                isSelected
                  ? 'bg-amber-900/90 text-amber-100 border-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-700 hover:bg-amber-950/40'
              }`}
              title={`${spell.name} (Level ${spell.level === 0 ? 'Cantrip' : spell.level}): ${spell.range} • ${spell.damage ? `${spell.damage} ${spell.damageType || ''}` : ''}`}
            >
              <span>{icon}</span>
              <span>{spell.name}</span>
              <span className="text-[10px] bg-amber-950/90 px-1.5 py-0.5 rounded text-amber-300 border border-amber-700/50">
                {spell.range || '30 ft'}
              </span>
              {spell.level === 0 ? (
                <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-1 rounded">
                  Cantrip
                </span>
              ) : (
                <span className="text-[9px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 px-1 rounded">
                  Lv {spell.level}
                </span>
              )}
              {spell.damage && (
                <span className="text-[9px] text-amber-400 font-normal">
                  {spell.damage}
                </span>
              )}
            </button>
          );
        })}

        {/* Empty State when character has no spells */}
        {characterSpells.length === 0 && (
          <div className="flex items-center gap-2 text-stone-400 italic text-[11px] bg-stone-950/80 px-2.5 py-1 rounded-xl border border-stone-800 shrink-0">
            <span>No spells in {effectiveCharacter?.name || activeCombatant.name}'s spellbook.</span>
            {character && character.spells && character.spells.length > 0 && activeSourceMode !== 'player' && (
              <button
                type="button"
                onClick={() => setActiveSourceMode('player')}
                className="text-amber-300 hover:underline font-bold not-italic flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Use {character.name}'s Spells ({character.spells.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Custom Range Input */}
        <div className="flex items-center gap-1.5 bg-stone-950 border border-amber-800/60 rounded-xl px-2.5 py-1 shrink-0">
          <span className="text-[11px] text-stone-400 font-sans">Range:</span>
          <input
            type="number"
            min={5}
            max={1000}
            step={5}
            value={currentRange}
            onChange={(e) => handleCustomRangeChange(parseInt(e.target.value, 10) || 5)}
            className="w-16 bg-stone-900 border border-stone-700 text-amber-200 font-mono text-xs px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-amber-400"
          />
          <span className="text-[11px] text-amber-300 font-mono">ft</span>
        </div>

        {/* AoE Size Input (if an AoE shape is selected) */}
        {currentShape !== 'single_target' && (
          <div className="flex items-center gap-1.5 bg-stone-950 border border-amber-800/60 rounded-xl px-2.5 py-1 shrink-0">
            <span className="text-[11px] text-stone-400 font-sans">AoE Size:</span>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={activeTargeting?.areaSizeFeet || customAreaSize}
              onChange={(e) => handleCustomAreaSizeChange(parseInt(e.target.value, 10) || 5)}
              className="w-16 bg-stone-900 border border-stone-700 text-amber-200 font-mono text-xs px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-amber-300 font-mono">ft</span>
          </div>
        )}
      </div>

      {/* Target Shapes & Target Status */}
      <div className="bg-stone-950/90 border border-amber-900/60 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-stone-300 gap-2 flex-wrap">
        {/* Shape Selectors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-stone-400 uppercase">Target Shape:</span>
          <button
            type="button"
            onClick={() => handleShapeChange('single_target')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition ${
              currentShape === 'single_target'
                ? 'bg-amber-800/80 text-amber-100 border-amber-400 font-bold'
                : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Single Token</span>
          </button>
          <button
            type="button"
            onClick={() => handleShapeChange('sphere')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition ${
              currentShape === 'sphere'
                ? 'bg-amber-800/80 text-amber-100 border-amber-400 font-bold'
                : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            <Circle className="w-3 h-3" />
            <span>Sphere</span>
          </button>
          <button
            type="button"
            onClick={() => handleShapeChange('cone')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition ${
              currentShape === 'cone'
                ? 'bg-amber-800/80 text-amber-100 border-amber-400 font-bold'
                : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            <Triangle className="w-3 h-3" />
            <span>Cone</span>
          </button>
          <button
            type="button"
            onClick={() => handleShapeChange('line')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition ${
              currentShape === 'line'
                ? 'bg-amber-800/80 text-amber-100 border-amber-400 font-bold'
                : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            <span className="font-bold">―</span>
            <span>Line</span>
          </button>
          <button
            type="button"
            onClick={() => handleShapeChange('cube')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition ${
              currentShape === 'cube'
                ? 'bg-amber-800/80 text-amber-100 border-amber-400 font-bold'
                : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            <Square className="w-3 h-3" />
            <span>Cube</span>
          </button>
        </div>

        {/* Real-time Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {cursorDistanceFeet > 0 && (
            <span className={`font-mono font-bold ${isOutOfRange ? 'text-rose-400' : 'text-stone-300'}`}>
              Distance: {cursorDistanceFeet} ft / {currentRange} ft {isOutOfRange && '(Out of Range!)'}
            </span>
          )}

          {currentShape === 'single_target' ? (
            targetCombatant ? (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Targeting: {targetCombatant.name} (AC {targetCombatant.armorClass})
              </span>
            ) : (
              <span className="text-amber-400/80 italic">
                Click any enemy or ally token on the map to target them.
              </span>
            )
          ) : (
            <span className="text-amber-300 font-bold">
              {caughtTargets.length > 0 ? (
                <span>Caught ({caughtTargets.length}): {caughtTargets.map((c) => c.name).join(', ')}</span>
              ) : (
                <span className="text-stone-400 italic">Position AoE area over tokens on the map.</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
