import React, { useState } from 'react';
import { Attack, CharacterData, Party } from '../../types';
import { ShadowrunCombatPanel } from '../shadowrun/ShadowrunCombatPanel';
import { COMBAT_CHEAT_SHEET, CombatRule } from '../../data/dndRulesData';
import { formatModifier, getAbilityModifier, get35eTouchAC, get35eFlatFootedAC, get35eGrapple, getEffectiveSpeed, OFFICIAL_DAMAGE_TYPES, getDamageTypeMeta, getArmorClassBreakdown, isHealingItem, isHealingSpell, getHealingExpression, rollHealing, isCharacterDead, isReviveSpell } from '../../utils/dndCalculations';
import { HpOrb } from '../HpOrb';
import { ConditionsPanel } from '../combat/ConditionsPanel';
import { RestModal } from '../combat/RestModal';
import { EncounterTracker } from '../combat/EncounterTracker';
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Footprints,
  Plus,
  Trash2,
  Dices,
  Skull,
  BookMarked,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Crosshair,
  Scale,
  Flame,
  Moon
} from 'lucide-react';

interface Sheet2Props {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  onOpenPartyManager?: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
}

export const Sheet2Combat: React.FC<Sheet2Props> = ({
  character,
  allCharacters = [],
  parties = [],
  onOpenPartyManager,
  onUpdateCharacter,
  onRoll,
  onRollDamage
}) => {
  const [cheatCategory, setCheatCategory] = useState<'All' | 'Action' | 'Bonus Action' | 'Reaction' | 'Maneuver' | 'Condition'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAttackModal, setShowAddAttackModal] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);

  // Optional Rules Combat State
  const [isFlankingActive, setIsFlankingActive] = useState(false);

  const speedInfo = getEffectiveSpeed(character);

  // New Attack Form
  const [attackName, setAttackName] = useState('');
  const [attackBonus, setAttackBonus] = useState<number>(5);
  const [attackDamage, setAttackDamage] = useState('1d8 + 3');
  const [attackDamageType, setAttackDamageType] = useState('Slashing');
  const [attackRange, setAttackRange] = useState('5 ft Melee');
  const [attackNotes, setAttackNotes] = useState('');

  // Death Save Toggle Handlers
  const handleToggleDeathSuccess = (index: number) => {
    const current = character.deathSavesSuccesses;
    const next = current === index + 1 ? index : index + 1;
    onUpdateCharacter({ ...character, deathSavesSuccesses: next });
  };

  const handleToggleDeathFailure = (index: number) => {
    const current = character.deathSavesFailures;
    const next = current === index + 1 ? index : index + 1;
    const isNowDead = next >= 3;
    const conds = character.conditions || [];

    onUpdateCharacter({
      ...character,
      hpCurrent: isNowDead ? 0 : character.hpCurrent,
      deathSavesFailures: next,
      conditions: isNowDead
        ? (conds.includes('Dead') ? conds : [...conds, 'Dead'])
        : conds
    });
  };

  const handleRollDeathSave = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    let label = `Death Save Roll (${d20})`;
    let updatedSuccesses = character.deathSavesSuccesses;
    let updatedFailures = character.deathSavesFailures;
    let updatedHpCurrent = character.hpCurrent;

    if (d20 === 20) {
      label += ' - NAT 20! Regain 1 HP!';
      updatedHpCurrent = Math.max(1, updatedHpCurrent);
      updatedSuccesses = 0;
      updatedFailures = 0;
    } else if (d20 === 1) {
      label += ' - NAT 1! 2 Failures!';
      updatedFailures = Math.min(3, updatedFailures + 2);
    } else if (d20 >= 10) {
      label += ' - Success!';
      updatedSuccesses = Math.min(3, updatedSuccesses + 1);
    } else {
      label += ' - Failure!';
      updatedFailures = Math.min(3, updatedFailures + 1);
    }

    const isNowDead = updatedFailures >= 3;
    const conds = character.conditions || [];

    if (isNowDead) {
      updatedHpCurrent = 0;
      label += ' 💀 3 Failures - CHARACTER DIED!';
    }

    onUpdateCharacter({
      ...character,
      hpCurrent: updatedHpCurrent,
      deathSavesSuccesses: updatedSuccesses,
      deathSavesFailures: updatedFailures,
      conditions: isNowDead
        ? (conds.includes('Dead') ? conds : [...conds, 'Dead'])
        : conds
    });

    onRoll(label, 20, 1, 0, 'normal');
  };

  // Add Attack Handler
  const handleAddAttack = () => {
    if (!attackName.trim()) return;
    const newAttack: Attack = {
      id: 'atk-' + Date.now(),
      name: attackName,
      attackBonus: attackBonus,
      damage: attackDamage,
      damageType: attackDamageType,
      range: attackRange,
      notes: attackNotes
    };
    onUpdateCharacter({
      ...character,
      attacks: [...character.attacks, newAttack]
    });
    setAttackName('');
    setAttackDamage('1d8 + 3');
    setAttackDamageType('Slashing');
    setAttackRange('5 ft Melee');
    setAttackNotes('');
    setShowAddAttackModal(false);
  };

  const handleDeleteAttack = (id: string) => {
    onUpdateCharacter({
      ...character,
      attacks: character.attacks.filter(a => a.id !== id)
    });
  };

  // Consume Healing Potion/Item in Combat
  const handleUseHealingItem = (item: any) => {
    if (item.stored) {
      alert(`"${item.name}" is Stored Away in your stash! Un-store it from inventory before using.`);
      return;
    }
    if (isCharacterDead(character)) {
      alert(`${character.name} is Dead! Items and potions cannot bring a dead character back to life. Only revives (e.g. Revivify, Resurrection) or manual HP modification can restore life.`);
      return;
    }

    const expr = getHealingExpression(item);
    const { totalHeal, breakdown } = rollHealing(expr);
    const newHp = Math.min(character.hpMax, character.hpCurrent + totalHeal);
    const hpGained = newHp - character.hpCurrent;

    const updatedInventory = character.inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, quantity: i.quantity - 1 };
      }
      return i;
    }).filter(i => i.quantity > 0);

    onUpdateCharacter({
      ...character,
      hpCurrent: newHp,
      inventory: updatedInventory
    });

    onRollDamage(`Consumed ${item.name} (${breakdown}) - Restored +${hpGained} HP!`, expr);
  };

  // Cast Spell in Combat
  const handleCastCombatSpell = (spell: any) => {
    if (spell.level > 0 && spell.prepared === false) {
      alert(`"${spell.name}" is not prepared! Prepare it in your spellbook first.`);
      return;
    }

    if (spell.level > 0) {
      const slot = character.spellSlots.find(s => s.level === spell.level);
      if (!slot || slot.current <= 0) {
        alert(`No Level ${spell.level} spell slots remaining!`);
        return;
      }
    }

    // Revive spell check
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

      onRollDamage(`✨ Cast ${spell.name} (Revive) - ${character.name} has been returned to life with ${reviveHp} HP!`, '1d20');
      return;
    }

    const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';

    if (isHealing) {
      if (isCharacterDead(character)) {
        alert(`${character.name} is Dead! Standard healing spells cannot bring a dead character back to life. Only Revivify, Resurrection, or manual HP modification can restore life.`);
        return;
      }

      const expr = getHealingExpression(spell) || '1d8 + 3';
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

      onRollDamage(`Cast ${spell.name} (Heal ${breakdown}) - Restored +${gained} HP!`, expr);
      return;
    }

    // Non-healing spell slot deduction
    if (spell.level > 0) {
      onUpdateCharacter({
        ...character,
        spellSlots: character.spellSlots.map(s => s.level === spell.level ? { ...s, current: Math.max(0, s.current - 1) } : s)
      });
    }

    if (spell.damage) {
      onRollDamage(`Cast ${spell.name} Damage`, spell.damage);
    } else {
      onRollDamage(`Cast ${spell.name}`, '1d20');
    }
  };

  // Class Feature Activation / Roll Handler
  const handleUseClassFeature = (feature: any) => {
    const nameLower = feature.name.toLowerCase();
    const descLower = feature.description.toLowerCase();

    // Check if it's Turn Undead / Destroy Undead
    if (nameLower.includes('turn undead') || nameLower.includes('destroy undead') || descLower.includes('turn undead')) {
      const wisScore = character.abilities?.WIS?.score ?? 10;
      const wisMod = Math.floor((wisScore - 10) / 2);
      const profBonus = character.proficiencyBonus ?? (Math.floor((character.level - 1) / 4) + 2);
      const saveDc = 8 + profBonus + wisMod;

      let destroyCrText = 'None (Turn Undead only)';
      if (character.level >= 17) destroyCrText = 'CR 4 or lower';
      else if (character.level >= 14) destroyCrText = 'CR 3 or lower';
      else if (character.level >= 11) destroyCrText = 'CR 2 or lower';
      else if (character.level >= 8) destroyCrText = 'CR 1 or lower';
      else if (character.level >= 5) destroyCrText = 'CR 1/2 or lower';

      onRollDamage(
        `Channel Divinity: Turn / Destroy Undead (WIS Save DC ${saveDc}) | Undead ${destroyCrText} destroyed instantly on failed save!`,
        '1d20'
      );

      // Decrement feature uses if usesRemaining exists
      if (feature.usesRemaining !== undefined || feature.usesMax !== undefined) {
        const max = feature.usesMax ?? 1;
        const rem = feature.usesRemaining ?? max;
        const updatedFeatures = character.classFeatures.map(f =>
          f.id === feature.id ? { ...f, usesRemaining: Math.max(0, rem - 1) } : f
        );
        onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
      }
      return;
    }

    // Check if it's Second Wind or a healing ability
    if (nameLower.includes('second wind') || descLower.includes('regain 1d10')) {
      const expr = `1d10 + ${character.level}`;
      const { totalHeal, breakdown } = rollHealing(expr);
      const newHp = Math.min(character.hpMax, character.hpCurrent + totalHeal);
      const hpGained = newHp - character.hpCurrent;

      const updatedFeatures = character.classFeatures.map(f => {
        if (f.id === feature.id) {
          const max = f.usesMax ?? 1;
          const rem = f.usesRemaining ?? max;
          return { ...f, usesRemaining: Math.max(0, rem - 1) };
        }
        return f;
      });

      onUpdateCharacter({
        ...character,
        hpCurrent: newHp,
        classFeatures: updatedFeatures
      });

      onRollDamage(`Used ${feature.name} (${breakdown}) - Restored +${hpGained} HP!`, expr);
      return;
    }

    // Check if description contains dice expression (e.g. 1d8, 1d6, 2d6, 4d8)
    const diceMatch = feature.description.match(/\b(\d+d\d+(?:\s*[\+\-]\s*\d+)?)\b/i);
    if (diceMatch) {
      onRollDamage(`Rolled ${feature.name} (${diceMatch[1]})`, diceMatch[1]);
    } else {
      onRollDamage(`Activated ${feature.name}`, '1d20');
    }

    // Decrement feature uses if usesMax / usesRemaining exists
    if (feature.usesRemaining !== undefined || feature.usesMax !== undefined) {
      const max = feature.usesMax ?? 1;
      const rem = feature.usesRemaining ?? max;
      const updatedFeatures = character.classFeatures.map(f =>
        f.id === feature.id ? { ...f, usesRemaining: Math.max(0, rem - 1) } : f
      );
      onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
    }
  };

  // Filter Cheat Sheet
  const filteredCheatRules = COMBAT_CHEAT_SHEET.filter(rule => {
    const matchesCategory = cheatCategory === 'All' || rule.category === cheatCategory;
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (character.edition === 'shadowrun') {
    return (
      <div className="space-y-6 pb-12">
        <ShadowrunCombatPanel
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onRollPool={(label, poolSize) => onRoll(label, 6, poolSize, 0, 'normal')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Quick View Combat Stats */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl text-stone-100 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
          <h2 className="text-xl font-serif font-bold text-amber-200 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Quick View: Combat Stats</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRestModal(true)}
              className="flex items-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 px-3 py-1.5 rounded-xl font-bold text-xs transition"
              title="Open Short / Long Rest Recovery Engine"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Rest & Recovery</span>
            </button>
            <span className="text-xs text-stone-400 font-mono hidden sm:inline">Real-Time Battle Dashboard</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Armor Class */}
          {(() => {
            const acBreakdown = getArmorClassBreakdown(character);
            return (
              <div className="bg-stone-950 p-3 rounded-xl border border-amber-600/30 text-center flex flex-col justify-between" title={acBreakdown.explanation}>
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-500" /> Armor Class
                  </div>
                  <div className="text-2xl font-serif font-extrabold text-amber-200">{character.armorClass}</div>
                </div>
                <div className="text-[9px] text-stone-400 font-mono mt-1 truncate px-1 opacity-90">
                  {acBreakdown.explanation}
                </div>
              </div>
            );
          })()}

          {/* 3.5e Touch AC */}
          {character.edition === '3.5e' && (
            <div className="bg-stone-950 p-3 rounded-xl border border-sky-500/30 text-center">
              <div className="text-[10px] uppercase font-bold text-sky-400 mb-1 flex items-center justify-center gap-1">
                Touch AC
              </div>
              <div className="text-2xl font-serif font-extrabold text-sky-200">{get35eTouchAC(character)}</div>
            </div>
          )}

          {/* 3.5e Flat-Footed AC */}
          {character.edition === '3.5e' && (
            <div className="bg-stone-950 p-3 rounded-xl border border-amber-700/30 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center justify-center gap-1">
                Flat-Footed AC
              </div>
              <div className="text-2xl font-serif font-extrabold text-amber-200">{get35eFlatFootedAC(character)}</div>
            </div>
          )}

          {/* Initiative */}
          <button
            onClick={() => onRoll('Initiative Roll', 20, 1, character.initiativeBonus, 'normal')}
            className="bg-stone-950 hover:bg-stone-800 p-3 rounded-xl border border-yellow-500/30 text-center transition group cursor-pointer"
          >
            <div className="text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center justify-center gap-1 group-hover:text-yellow-300">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Initiative
            </div>
            <div className="text-2xl font-serif font-extrabold text-yellow-300">
              {formatModifier(character.initiativeBonus)}
            </div>
          </button>

          {/* Speed */}
          <div className={`p-3 rounded-xl border text-center transition ${
            speedInfo.isModified
              ? 'bg-amber-950/80 border-amber-600/70'
              : 'bg-stone-950 border-stone-800'
          }`}>
            <div className="text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center justify-center gap-1">
              <Footprints className={`w-3.5 h-3.5 ${speedInfo.isModified ? 'text-amber-400' : 'text-blue-400'}`} /> Speed
            </div>
            <div className={`text-2xl font-serif font-extrabold ${speedInfo.isModified ? 'text-amber-300' : 'text-stone-200'}`}>
              {speedInfo.effectiveSpeed} ft
            </div>
            {speedInfo.isModified ? (
              <div className="text-[10px] font-mono text-amber-400 font-bold mt-0.5">
                Base: {speedInfo.baseSpeed}ft (-{speedInfo.speedPenalty}ft {speedInfo.status})
              </div>
            ) : (
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">Base Walking Speed</div>
            )}
          </div>

          {/* 3.5e Base Attack Bonus (BAB) */}
          {character.edition === '3.5e' && (
            <div className="bg-stone-950 p-3 rounded-xl border border-emerald-500/30 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-0.5">Base Attack (BAB)</div>
              <div className="flex items-center gap-1">
                <span className="text-stone-500 font-mono font-bold">+</span>
                <input
                  type="number"
                  min="0"
                  value={character.bab ?? Math.floor(character.level * 0.75)}
                  onChange={(e) => onUpdateCharacter({ ...character, bab: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-12 bg-stone-900 border border-stone-700 rounded text-center text-emerald-300 font-serif font-extrabold text-xl focus:outline-none p-0.5"
                />
              </div>
            </div>
          )}

          {/* 3.5e Grapple Check */}
          {character.edition === '3.5e' && (
            <button
              onClick={() => onRoll('Grapple Check (3.5e)', 20, 1, get35eGrapple(character), 'normal')}
              className="bg-stone-950 hover:bg-stone-800 p-3 rounded-xl border border-purple-500/30 text-center transition group cursor-pointer"
            >
              <div className="text-[10px] uppercase font-bold text-purple-400 mb-1 flex items-center justify-center gap-1 group-hover:text-purple-300">
                <Swords className="w-3.5 h-3.5 text-purple-400" /> Grapple Mod
              </div>
              <div className="text-2xl font-serif font-extrabold text-purple-300">
                {formatModifier(get35eGrapple(character))}
              </div>
            </button>
          )}

          {/* HP Bar, Color Coded Text & Animated HP Orb */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center col-span-2 flex items-center justify-between px-4">
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Current HP / Max HP
              </div>
              <div className="text-2xl font-serif font-extrabold flex items-center gap-1">
                <span
                  className={
                    (character.hpCurrent / Math.max(1, character.hpMax)) >= 0.75
                      ? 'text-emerald-400 font-mono font-extrabold'
                      : (character.hpCurrent / Math.max(1, character.hpMax)) >= 0.49
                      ? 'text-amber-400 font-mono font-extrabold'
                      : 'text-rose-500 font-mono font-extrabold animate-pulse'
                  }
                >
                  {character.hpCurrent}
                </span>
                <span className="text-stone-600 text-sm font-sans">/</span>
                <span className="text-stone-200">{character.hpMax}</span>
                {character.hpTemp > 0 && (
                  <span className="text-cyan-400 text-xs font-sans"> (+{character.hpTemp} Temp)</span>
                )}
              </div>
            </div>

            {/* Visual Animated HP Orb */}
            <div className="shrink-0">
              <HpOrb hpCurrent={character.hpCurrent} hpMax={character.hpMax} size="md" showLabel={false} />
            </div>
          </div>

          {/* Hit Dice */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
            <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Hit Dice</div>
            <div className="text-lg font-serif font-extrabold text-amber-300">
              {character.hitDiceCurrent} / {character.hitDiceTotal}
            </div>
          </div>
        </div>

        {/* Death Saves Section */}
        <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
          isCharacterDead(character)
            ? 'bg-rose-950/60 border-rose-600/80 shadow-inner'
            : 'bg-stone-950/80 border-stone-800'
        }`}>
          <div className="flex items-center gap-2">
            <Skull className={`w-5 h-5 ${isCharacterDead(character) ? 'text-rose-400 animate-pulse' : 'text-rose-500'}`} />
            <div>
              <div className="text-xs font-serif font-bold text-stone-200 flex items-center gap-2">
                <span>Death Saving Throws</span>
                {isCharacterDead(character) && (
                  <span className="text-[10px] bg-rose-600 text-stone-950 font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider animate-bounce">
                    DEAD
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400">
                {isCharacterDead(character)
                  ? 'Character has permanently died (3 Failures). Locked at 0 HP. Cannot heal via items or rests. Revive spell or manual HP edit required.'
                  : 'Track 3 Successes vs 3 Failures'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            {/* Successes */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-400 font-mono">Successes:</span>
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleToggleDeathSuccess(idx)}
                  className="p-0.5 rounded focus:outline-none"
                >
                  {idx < character.deathSavesSuccesses ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone-700 bg-stone-900" />
                  )}
                </button>
              ))}
            </div>

            {/* Failures */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-rose-400 font-mono">Failures:</span>
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleToggleDeathFailure(idx)}
                  className="p-0.5 rounded focus:outline-none"
                >
                  {idx < character.deathSavesFailures ? (
                    <XCircle className="w-5 h-5 text-rose-500 fill-rose-950" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone-700 bg-stone-900" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleRollDeathSave}
              className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/40 text-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              <Dices className="w-3.5 h-3.5" /> Roll Death Save
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1.5: Conditions & Status Effects */}
      <ConditionsPanel character={character} onUpdateCharacter={onUpdateCharacter} />

      {/* SECTION 1.6: Initiative & Encounter Combat Turn Tracker */}
      <EncounterTracker
        character={character}
        allCharacters={allCharacters}
        parties={parties}
        onOpenPartyManager={onOpenPartyManager}
        onRoll={onRoll}
        onUpdateCharacter={onUpdateCharacter}
      />

      {/* SECTION 2: Attacks & Cantrip Actions */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2 gap-2">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
            <Swords className="w-5 h-5 text-amber-500" />
            <span>Attacks & Spellcasting Weaponry</span>
          </div>

          <div className="flex items-center gap-2">
            {character.optionalRules?.useFlankingRules && (
              <button
                onClick={() => setIsFlankingActive(!isFlankingActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isFlankingActive
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-900/40'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-amber-200'
                }`}
                title="Tactical Flanking Rule: Adds Advantage (5e) or +2 Attack (3.5e) when positioning with an ally"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Flanking: {isFlankingActive ? 'ACTIVE (+2/Adv)' : 'OFF'}</span>
              </button>
            )}

            <button
              onClick={() => setShowAddAttackModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Attack
            </button>
          </div>
        </div>

        {character.attacks.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-3 text-center">
            No attack weapons added yet. Click "+ Add Attack" to add longswords, bows, or spell strikes!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {character.attacks.map((atk) => {
              const effectiveAttackBonus = isFlankingActive && character.edition === '3.5e'
                ? atk.attackBonus + 2
                : atk.attackBonus;
              const attackRollMode = isFlankingActive && character.edition === '5e' ? 'advantage' : 'normal';
              const dmgMeta = getDamageTypeMeta(atk.damageType);

              // Check if corresponding item exists in inventory and is unequipped or stored
              const matchedInventoryItem = character.inventory.find(
                i => i.id === atk.id.replace('atk-', '') || i.name.toLowerCase() === atk.name.toLowerCase()
              );
              const isEquipped = matchedInventoryItem ? (matchedInventoryItem.equipped === true && !matchedInventoryItem.stored) : true;

              return (
                <div
                  key={atk.id}
                  className={`bg-stone-950 border rounded-xl p-4 text-xs flex flex-col justify-between gap-3 shadow-md transition ${
                    !isEquipped ? 'border-rose-900/60 opacity-75' : 'border-stone-800 hover:border-amber-600/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-amber-200 text-base truncate">{atk.name}</span>
                        {!isEquipped && (
                          <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                            ❌ Unequipped in Gear
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${dmgMeta.badgeBg} ${dmgMeta.badgeText} ${dmgMeta.badgeBorder}`}>
                          <span>{dmgMeta.icon}</span>
                          <span>{dmgMeta.name}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteAttack(atk.id)}
                          className="text-stone-500 hover:text-rose-400 p-1 transition"
                          title="Delete Attack"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-stone-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                      <span><strong>Range:</strong> {atk.range}</span>
                    </div>

                    {atk.notes && (
                      <p className="text-stone-400 text-[11px] mt-1.5 italic bg-stone-900 p-1.5 rounded border border-stone-800">
                        {atk.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-800 gap-2">
                    <div className="font-mono text-stone-300 font-semibold">
                      <span className="text-amber-400 font-bold">{formatModifier(effectiveAttackBonus)}</span> Hit
                      {isFlankingActive && (
                        <span className="text-[10px] text-amber-400 font-bold ml-1">
                          ({character.edition === '3.5e' ? '+2 Flank' : 'Flank Adv'})
                        </span>
                      )}{' '}
                      | <span className="text-amber-200">{atk.damage}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRoll(
                          `${atk.name} Attack Roll${isFlankingActive ? ' (Flanking)' : ''}`,
                          20,
                          1,
                          effectiveAttackBonus,
                          attackRollMode
                        )}
                        disabled={!isEquipped}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                          !isEquipped
                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                            : 'bg-amber-700 hover:bg-amber-600 text-white'
                        }`}
                        title={!isEquipped ? 'Equip this weapon in Gear tab to use it in combat.' : 'Roll Attack d20'}
                      >
                        <Dices className="w-3.5 h-3.5" /> Attack
                      </button>

                      <button
                        onClick={() => onRollDamage(`${atk.name} Damage`, atk.damage)}
                        disabled={!isEquipped}
                        className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${
                          !isEquipped
                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                            : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                        }`}
                        title={!isEquipped ? 'Equip this weapon in Gear tab to roll damage.' : 'Roll Standard Damage'}
                      >
                        Damage
                      </button>

                      {character.optionalRules?.useVariantCritDamage && (
                        <button
                          onClick={() => onRollDamage(`${atk.name} Critical Damage (Variant Max+Roll)`, `${atk.damage} + ${atk.damage.split('+')[0].trim()}`)}
                          disabled={!isEquipped}
                          className={`px-2 py-1.5 border rounded-lg font-bold flex items-center gap-1 transition text-[11px] ${
                            !isEquipped
                              ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
                              : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-700/60'
                          }`}
                          title={!isEquipped ? 'Equip weapon first' : 'Variant Crit: Maximize initial die + roll second die'}
                        >
                          <Crosshair className="w-3 h-3 text-rose-400" /> Crit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2.5: Combat Spells & Healing Actions */}
      {((character.spells && character.spells.length > 0) || character.inventory.some(i => isHealingItem(i))) && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
            <h3 className="text-lg font-serif font-bold text-amber-200 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/30" />
              <span>Combat Spells & Healing Actions</span>
            </h3>
            <span className="text-xs text-stone-400 font-mono">Quick Combat Magic & Potions</span>
          </div>

          {/* Quick Healing Items */}
          {character.inventory.filter(i => isHealingItem(i)).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" /> Available Healing Potions & Consumables:
              </div>
              <div className="flex flex-wrap gap-2">
                {character.inventory.filter(i => isHealingItem(i)).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleUseHealingItem(item)}
                    disabled={item.stored}
                    className={`px-3 py-2 border rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                      item.stored
                        ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
                        : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border-emerald-600/60'
                    }`}
                    title={item.stored ? 'Item stored away in stash. Un-store in inventory to use.' : `Drink ${item.name}`}
                  >
                    <Heart className="w-4 h-4 fill-rose-300 text-emerald-300" />
                    <span>Drink {item.name}</span>
                    {item.stored ? (
                      <span className="bg-stone-950 text-stone-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-stone-700">
                        STORED
                      </span>
                    ) : (
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-emerald-700">
                        Qty: {item.quantity}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Combat Spells List */}
          {character.spells && character.spells.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" /> Prepared Spells & Combat Magic:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {character.spells.map(spell => {
                  const isCantrip = spell.level === 0;
                  const slotObj = character.spellSlots?.find(s => s.level === spell.level);
                  const hasSlot = isCantrip || (slotObj ? slotObj.current > 0 : false);
                  const isPrepared = isCantrip || spell.prepared !== false;
                  const canCast = isPrepared && hasSlot;
                  const isHealing = isHealingSpell(spell) || spell.damageType === 'Healing';

                  return (
                    <div
                      key={spell.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        !canCast
                          ? 'bg-stone-950/70 border-stone-800/80 opacity-60'
                          : isHealing
                          ? 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/80'
                          : 'bg-stone-950 border-stone-800 hover:border-purple-600/50'
                      }`}
                    >
                      <div>
                        <div className="font-serif font-bold text-stone-100 text-sm flex items-center gap-2 flex-wrap">
                          <span>{spell.name}</span>
                          <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">
                            {isCantrip ? 'Cantrip' : `Lvl ${spell.level}`}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                          {!isPrepared ? (
                            <span className="text-rose-400 font-bold">❌ Not Prepared</span>
                          ) : !hasSlot ? (
                            <span className="text-rose-400 font-bold">❌ 0 Lvl {spell.level} Slots Left</span>
                          ) : (
                            <span className="text-stone-400">{spell.range} • {spell.castingTime}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCastCombatSpell(spell)}
                        disabled={!canCast}
                        className={`px-3 py-1.5 font-bold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 ${
                          !canCast
                            ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                            : isHealing
                            ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/50'
                            : 'bg-purple-800 hover:bg-purple-700 text-purple-100 border border-purple-500/50'
                        }`}
                        title={!isPrepared ? 'Spell is not prepared' : !hasSlot ? 'No spell slots remaining' : 'Cast spell'}
                      >
                        {isHealing ? (
                          <>
                            <Heart className="w-3.5 h-3.5 fill-rose-300 text-emerald-200" /> Cast & Heal
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-purple-300" /> Cast Spell
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2.7: Class Features & Active Combat Abilities */}
      {character.classFeatures && character.classFeatures.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 flex-wrap gap-2">
            <h3 className="text-lg font-serif font-bold text-amber-200 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <span>Class Features & Active Combat Abilities</span>
            </h3>
            <span className="text-xs text-stone-400 font-mono">Special Powers, Maneuvers & Passive Buffs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.classFeatures.map((feature) => {
              const nameLower = feature.name.toLowerCase();
              const descLower = feature.description.toLowerCase();

              const isDefenseStyle = nameLower.includes('defense') || descLower.includes('+1 bonus to ac');
              const isExtraAttack = nameLower.includes('extra attack') || descLower.includes('attack twice');
              const isActionSurge = nameLower.includes('action surge');
              const isSecondWind = nameLower.includes('second wind');
              const isSuperiority = nameLower.includes('superiority') || descLower.includes('superiority dice');

              const usesMax = feature.usesMax ?? (isActionSurge || isSecondWind ? 1 : undefined);
              const usesRem = feature.usesRemaining ?? usesMax;
              const hasUsesTracked = usesMax !== undefined;
              const isDepleted = hasUsesTracked && usesRem !== undefined && usesRem <= 0;

              // Check if feature has dice to roll
              const diceMatch = feature.description.match(/\b(\d+d\d+(?:\s*[\+\-]\s*\d+)?)\b/i);

              return (
                <div
                  key={feature.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 text-xs transition ${
                    isDepleted
                      ? 'bg-stone-950/70 border-stone-800/80 opacity-60'
                      : 'bg-stone-950 border-stone-800 hover:border-amber-600/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-amber-200 text-sm">{feature.name}</span>
                        {feature.source && (
                          <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded border border-stone-700">
                            {feature.source}
                          </span>
                        )}
                      </div>

                      {hasUsesTracked && (
                        <div className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                          <span>Uses: {usesRem} / {usesMax}</span>
                          {feature.recharge && <span className="text-stone-400">({feature.recharge})</span>}
                        </div>
                      )}
                    </div>

                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Passive Buff or Active Stat Badges */}
                    {isDefenseStyle && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-lg text-[11px] font-bold">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Active AC Effect: +1 Armor Class applied to AC</span>
                      </div>
                    )}

                    {isExtraAttack && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded-lg text-[11px] font-bold">
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span>Combat Multi-Attack: Make 2 attacks per Attack action</span>
                      </div>
                    )}
                  </div>

                  {/* Feature Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 gap-2 flex-wrap">
                    <div className="text-[10px] font-mono text-stone-500">
                      {feature.recharge ? `Resets on ${feature.recharge}` : 'Passive / Ability'}
                    </div>

                    <div className="flex items-center gap-2">
                      {isSecondWind && (
                        <button
                          onClick={() => handleUseClassFeature(feature)}
                          disabled={isDepleted}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                            isDepleted
                              ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                              : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/50 shadow-md'
                          }`}
                          title="Roll 1d10 + Level and restore HP"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-300 text-emerald-200" />
                          <span>Use Second Wind (Heal)</span>
                        </button>
                      )}

                      {!isSecondWind && (diceMatch || isActionSurge || isSuperiority || hasUsesTracked) && (
                        <button
                          onClick={() => handleUseClassFeature(feature)}
                          disabled={isDepleted}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                            isDepleted
                              ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                              : 'bg-amber-700 hover:bg-amber-600 text-white shadow-md'
                          }`}
                          title={diceMatch ? `Roll ${diceMatch[1]}` : 'Trigger ability use'}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-200" />
                          <span>
                            {diceMatch ? `Roll (${diceMatch[1]})` : isActionSurge ? 'Use Action Surge' : 'Use Feature'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: Cheat Sheet: Maneuvers & Actions */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
            <BookMarked className="w-5 h-5 text-amber-500" />
            <span>Cheat Sheet: Combat Actions & Maneuvers</span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, maneuvers..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 text-xs">
          {(['All', 'Action', 'Bonus Action', 'Reaction', 'Maneuver', 'Condition'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCheatCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                cheatCategory === cat
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat}s
            </button>
          ))}
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredCheatRules.length === 0 ? (
            <div className="col-span-full text-center text-stone-500 py-6 text-xs italic">
              No combat rules or maneuvers found matching search.
            </div>
          ) : (
            filteredCheatRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-amber-200">{rule.name}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      rule.category === 'Action'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : rule.category === 'Bonus Action'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : rule.category === 'Reaction'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : rule.category === 'Maneuver'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {rule.category}
                  </span>
                </div>
                <div className="text-stone-300 font-medium">{rule.summary}</div>
                <div className="text-stone-400 text-[11px] leading-relaxed pt-1 border-t border-stone-900">
                  {rule.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Add Attack */}
      {showAddAttackModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-500" /> Add Attack
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Weapon / Spell Name *</label>
                <input
                  type="text"
                  value={attackName}
                  onChange={(e) => setAttackName(e.target.value)}
                  placeholder="e.g. Greatsword +1 or Fire Bolt"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Attack Bonus (+)</label>
                  <input
                    type="number"
                    value={attackBonus}
                    onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Damage (e.g. 2d6 + 4)</label>
                  <input
                    type="text"
                    value={attackDamage}
                    onChange={(e) => setAttackDamage(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Damage Type / Element</label>
                  <select
                    value={OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === attackDamageType.toLowerCase()) ? OFFICIAL_DAMAGE_TYPES.find(d => d.name.toLowerCase() === attackDamageType.toLowerCase())?.name : 'Custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'Custom') {
                        setAttackDamageType(e.target.value);
                      }
                    }}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium"
                  >
                    {OFFICIAL_DAMAGE_TYPES.map(d => (
                      <option key={d.name} value={d.name}>
                        {d.icon} {d.name}
                      </option>
                    ))}
                    <option value="Custom">✨ Custom / Other...</option>
                  </select>

                  {(!OFFICIAL_DAMAGE_TYPES.some(d => d.name.toLowerCase() === attackDamageType.toLowerCase()) || attackDamageType === 'Custom') && (
                    <input
                      type="text"
                      value={attackDamageType === 'Custom' ? '' : attackDamageType}
                      onChange={(e) => setAttackDamageType(e.target.value)}
                      placeholder="Type custom damage element..."
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-100 mt-1"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Range</label>
                  <input
                    type="text"
                    value={attackRange}
                    onChange={(e) => setAttackRange(e.target.value)}
                    placeholder="e.g. 5 ft Melee, 120 ft"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Special Properties / Notes</label>
                <textarea
                  value={attackNotes}
                  onChange={(e) => setAttackNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Versatile, Finesse, Ignites objects..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddAttackModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttack}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Save Attack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest & Recovery Modal */}
      {showRestModal && (
        <RestModal
          character={character}
          onClose={() => setShowRestModal(false)}
          onUpdateCharacter={onUpdateCharacter}
          onRoll={onRoll}
        />
      )}
    </div>
  );
};
