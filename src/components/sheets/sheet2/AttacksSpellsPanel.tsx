import React, { useState } from 'react';
import { Attack, CharacterData } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { COMBAT_CHEAT_SHEET } from '../../../data/dndRulesData';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import {
  formatModifier,
  OFFICIAL_DAMAGE_TYPES,
  getDamageTypeMeta,
  isHealingItem,
  isHealingSpell,
  getHealingExpression,
  rollHealing,
  isCharacterDead,
  isReviveSpell,
  getEffectiveMaxHp
} from '../../../utils/dndCalculations';
import {
  Swords,
  Plus,
  Trash2,
  Dices,
  BookMarked,
  Search,
  Crosshair,
  Flame,
  Pencil,
  Sparkles
} from 'lucide-react';
import { useLayoutCustomization } from '../../../utils/layoutCustomization';

interface AttacksSpellsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage: (label: string, expression: string) => void;
  setTargetModalSpell: (spell: any) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const AttacksSpellsPanel: React.FC<AttacksSpellsPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll,
  onRollDamage,
  setTargetModalSpell,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const [cheatCategory, setCheatCategory] = useState<'All' | 'Action' | 'Bonus Action' | 'Reaction' | 'Maneuver' | 'Condition'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showAddAttackModal, setShowAddAttackModal] = useState(false);

  // New Attack Form
  const [attackName, setAttackName] = useState('');
  const [attackBonus, setAttackBonus] = useState<number>(5);
  const [attackDamage, setAttackDamage] = useState('1d8 + 3');
  const [attackDamageType, setAttackDamageType] = useState('Slashing');
  const [attackRange, setAttackRange] = useState('5 ft Melee');
  const [attackNotes, setAttackNotes] = useState('');

  const effectiveMaxHp = getEffectiveMaxHp(character);

  const handleAddAttack = () => {
    if (!attackName.trim()) {
      alert('Please enter a Weapon / Spell Name before saving.');
      return;
    }
    const finalType = attackDamageType === 'Custom' ? 'Slashing' : (attackDamageType || 'Slashing');
    const newAttack: Attack = {
      id: 'atk-' + Date.now(),
      name: attackName,
      attackBonus: attackBonus,
      damage: attackDamage || '1d8',
      damageType: finalType,
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

  const handleUseHealingItem = (item: any) => {
    if (item.stored) {
      alert(`"${item.name}" is Stored Away in your stash! Un-store it from inventory before using.`);
      return;
    }
    if (isCharacterDead(character)) {
      alert(`${character.name} is Dead! Items and potions cannot bring a dead character back to life. Only revives or manual HP modification can restore life.`);
      return;
    }

    const expr = getHealingExpression(item);
    const { totalHeal, breakdown } = rollHealing(expr);
    const newHp = Math.min(effectiveMaxHp, character.hpCurrent + totalHeal);
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

    if (isReviveSpell(spell)) {
      const expr = spell.damage || getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal } = rollHealing(expr);
      const reviveHp = Math.min(effectiveMaxHp, Math.max(1, totalHeal || 1));
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
        alert(`${character.name} is Dead! Standard healing spells cannot bring a dead character back to life.`);
        return;
      }

      const expr = getHealingExpression(spell) || '1d8 + 3';
      const { totalHeal, breakdown } = rollHealing(expr);
      const newHp = Math.min(effectiveMaxHp, character.hpCurrent + totalHeal);
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

    setTargetModalSpell(spell);
  };

  const { isVisible } = useLayoutCustomization();

  const showAttacks = isVisible('s2_attacksWeapons');
  const showCombatSpells = isVisible('s2_combatSpellsPotions');

  return (
    <div className="space-y-6">
      {/* Weapons & Attacks Panel */}
      {showAttacks && (
        <CollapsibleBox
          title="Weapons, Spell Attacks & Maneuvers"
          icon={<Swords className="w-5 h-5 text-amber-500" />}
          storageKey="sheet2_attacks"
          headerExtra={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCheatSheet(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600/50 text-amber-300 rounded-lg text-xs font-bold transition shadow"
              >
                <BookMarked className="w-3.5 h-3.5 text-amber-400" /> Actions & Rules
              </button>
              <button
                onClick={() => setShowAddAttackModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Attack
              </button>
            </div>
          }
        >
          <div className="space-y-3 pt-2">
            {character.attacks.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No attacks added yet. Click &quot;Add Attack&quot; to configure weapons or spell attacks.</p>
            ) : (
              character.attacks.map((atk) => {
                const meta = getDamageTypeMeta(atk.damageType);
                return (
                  <div
                    key={atk.id}
                    className="bg-stone-950 border border-stone-800 hover:border-amber-600/50 rounded-xl p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-amber-200 text-sm">{atk.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                          {atk.damageType}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {atk.range}
                        </span>
                      </div>

                      <p className="text-stone-400 text-[11px] leading-relaxed">
                        {atk.notes || 'Standard weapon or spell attack.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onRoll(`${atk.name} Attack Roll`, 20, 1, atk.attackBonus, 'normal')}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-amber-600/80 text-amber-200 hover:text-white rounded-lg font-mono font-bold transition border border-stone-700 flex items-center gap-1"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Attack ({formatModifier(atk.attackBonus)})</span>
                      </button>

                      <button
                        onClick={() => onRollDamage(`${atk.name} Damage (${atk.damageType})`, atk.damage)}
                        className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg font-mono font-bold transition border border-rose-600/50 flex items-center gap-1"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Dmg ({atk.damage})</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAttack(atk.id)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition"
                        title="Delete Attack"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleBox>
      )}

      {/* Combat Spells & Consumables Quick Bar */}
      {showCombatSpells && (
        <CollapsibleBox
          title="Combat Spells & Potions Quick Bar"
          icon={<Sparkles className="w-5 h-5 text-amber-500" />}
          storageKey="sheet2_combat_spells"
        >
        <div className="space-y-4 pt-2 text-xs">
          {/* Healing Potions & Items */}
          <div>
            <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
              Consumable Potions & Items (Inventory)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {character.inventory.filter(i => isHealingItem(i)).map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-emerald-300">{item.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">Qty: {item.quantity}</div>
                  </div>
                  <button
                    onClick={() => handleUseHealingItem(item)}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/50 rounded-lg font-bold transition shrink-0"
                  >
                    Drink / Heal
                  </button>
                </div>
              ))}
              {character.inventory.filter(i => isHealingItem(i)).length === 0 && (
                <p className="text-stone-500 italic text-[11px] col-span-full">
                  No potions or healing items in inventory.
                </p>
              )}
            </div>
          </div>

          {/* Quick Cast Combat Spells */}
          <div>
            <span className="font-serif font-bold text-amber-300 text-xs block mb-2 font-sans">
              Prepared Spells (Click to Cast & Track Slots)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {character.spells.filter(s => s.prepared !== false).map((spell) => (
                <div
                  key={spell.id}
                  className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="font-bold text-amber-200 truncate">{spell.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isShapeshiftAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Shapeshift Engine"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(spell.name, spell.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-2 py-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Animal Companion & Familiar Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCastCombatSpell(spell)}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-600/50 rounded-lg font-bold transition"
                    >
                      Cast
                    </button>
                  </div>
                </div>
              ))}
              {character.spells.filter(s => s.prepared !== false).length === 0 && (
                <p className="text-stone-500 italic text-[11px] col-span-full">
                  No prepared spells found in spellbook.
                </p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleBox>
      )}

      {/* MODAL: Add Attack */}
      {showAddAttackModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 space-y-4">
            <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Swords className="w-5 h-5 text-amber-500" /> Configure New Weapon / Attack
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Attack / Weapon Name *</label>
                <input
                  type="text"
                  value={attackName}
                  onChange={(e) => setAttackName(e.target.value)}
                  placeholder="e.g. Longsword, Fire Bolt, Bite"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Attack Bonus Modifier</label>
                  <input
                    type="number"
                    value={attackBonus}
                    onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage Formula</label>
                  <input
                    type="text"
                    value={attackDamage}
                    onChange={(e) => setAttackDamage(e.target.value)}
                    placeholder="e.g. 1d8 + 3"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Damage Type</label>
                  <select
                    value={attackDamageType}
                    onChange={(e) => setAttackDamageType(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  >
                    {OFFICIAL_DAMAGE_TYPES.map(dt => (
                      <option key={dt.name} value={dt.name}>{dt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Range / Reach</label>
                  <input
                    type="text"
                    value={attackRange}
                    onChange={(e) => setAttackRange(e.target.value)}
                    placeholder="e.g. 5 ft Melee or 60 ft Ranged"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Notes / Special Effects</label>
                <textarea
                  value={attackNotes}
                  onChange={(e) => setAttackNotes(e.target.value)}
                  placeholder="e.g. Versatile (1d10), Finesse, Reach..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
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

      {/* MODAL: Actions & Combat Cheat Sheet */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-500" /> D&D Combat Actions Reference
              </h3>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(['All', 'Action', 'Bonus Action', 'Reaction', 'Condition'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCheatCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    cheatCategory === cat ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search combat rules, Grapple, Dodge, Opportunity Attacks..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {COMBAT_CHEAT_SHEET.filter(rule => {
                const matchCat = cheatCategory === 'All' || rule.category === cheatCategory;
                const matchSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || rule.description.toLowerCase().includes(searchQuery.toLowerCase());
                return matchCat && matchSearch;
              }).map(rule => (
                <div key={rule.id} className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-amber-200 text-sm">{rule.name}</span>
                    <span className="text-[10px] font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-400">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-stone-300 text-xs leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
