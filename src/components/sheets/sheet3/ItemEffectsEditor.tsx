import React, { useState } from 'react';
import { GearItem, AbilityName, WeaponDamageRow } from '../../../types';
import {
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
  Swords,
  Heart,
  Eye,
  Footprints,
  Flame,
  Plus,
  Trash2,
  Skull,
  Award,
  Layers,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DAMAGE_TYPES = [
  'Acid',
  'Bludgeoning',
  'Cold',
  'Fire',
  'Force',
  'Lightning',
  'Necrotic',
  'Piercing',
  'Poison',
  'Psychic',
  'Radiant',
  'Slashing',
  'Thunder',
  'All'
];

export const CONDITIONS_LIST = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious'
];

export const ALL_SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival'
];

export const ITEM_CATEGORIES = [
  { value: 'Misc', label: 'Misc / Gear' },
  { value: 'Ring', label: 'Magic Ring' },
  { value: 'Amulet', label: 'Amulet / Talisman / Necklace' },
  { value: 'Cloak', label: 'Cloak / Cape / Robe' },
  { value: 'Boots', label: 'Boots / Footwear' },
  { value: 'Headwear', label: 'Helm / Circlet / Headwear' },
  { value: 'Gloves', label: 'Gloves / Gauntlets / Bracers' },
  { value: 'Belt', label: 'Belt / Girdle' },
  { value: 'Wondrous Item', label: 'Wondrous Item / Relic' },
  { value: 'Armor', label: 'Armor / Shield' },
  { value: 'Weapon', label: 'Weapon' },
  { value: 'Potion', label: 'Potion / Consumable' },
  { value: 'Scroll', label: 'Scroll / Tome' },
  { value: 'Wand', label: 'Wand / Rod / Staff' }
];

export const ITEM_SLOTS = [
  { value: '', label: 'None / Carried' },
  { value: 'Ring', label: 'Ring' },
  { value: 'Amulet', label: 'Neck / Amulet' },
  { value: 'Cloak', label: 'Shoulders / Cloak' },
  { value: 'Boots', label: 'Feet / Boots' },
  { value: 'Headwear', label: 'Head / Helm' },
  { value: 'Gloves', label: 'Hands / Gloves / Bracers' },
  { value: 'Belt', label: 'Waist / Belt' },
  { value: 'Armor', label: 'Body / Armor' },
  { value: 'Shield', label: 'Off-Hand / Shield' },
  { value: 'Main Hand', label: 'Main Hand' },
  { value: 'Two-Handed', label: 'Two-Handed' },
  { value: 'Wondrous', label: 'Wondrous / Accessory' }
];

export const ITEM_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
  'Legendary',
  'Artifact',
  'Unique'
];

interface ItemEffectsEditorProps {
  item: GearItem;
  onChange: (updated: GearItem) => void;
  edition?: string;
}

export const ItemEffectsEditor: React.FC<ItemEffectsEditorProps> = ({
  item,
  onChange,
  edition = '5e'
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    defenses: true,
    abilitiesSaves: true,
    skillsSenses: false,
    combatMagic: false,
    speedsCharges: false,
    weaponStats: item.itemType === 'Weapon' || !!item.weaponStats
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleTag = (field: 'resistance' | 'immunity' | 'conditionImmunities', tag: string) => {
    const currentVal = item[field] || '';
    const currentTags = currentVal
      .split(/[,/]/)
      .map(s => s.trim())
      .filter(Boolean);

    const exists = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
    let newTags: string[];
    if (exists) {
      newTags = currentTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
    } else {
      newTags = [...currentTags, tag];
    }

    onChange({
      ...item,
      [field]: newTags.length > 0 ? newTags.join(', ') : undefined
    });
  };

  const handleAbilitySetterChange = (ability: AbilityName, val: string) => {
    const current = { ...(item.abilitySetters || {}) };
    if (val === '' || isNaN(Number(val))) {
      delete current[ability];
    } else {
      current[ability] = parseInt(val, 10);
    }
    onChange({
      ...item,
      abilitySetters: Object.keys(current).length > 0 ? current : undefined
    });
  };

  const handleAbilityBonusChange = (ability: AbilityName, val: string) => {
    const current = { ...(item.abilityBonuses || {}) };
    if (val === '' || isNaN(Number(val))) {
      delete current[ability];
    } else {
      current[ability] = parseInt(val, 10);
    }
    onChange({
      ...item,
      abilityBonuses: Object.keys(current).length > 0 ? current : undefined
    });
  };

  const handleSpecificSaveChange = (ability: AbilityName, val: string) => {
    const current = { ...(item.savingThrowSpecificBonuses || {}) };
    if (val === '' || isNaN(Number(val))) {
      delete current[ability];
    } else {
      current[ability] = parseInt(val, 10);
    }
    onChange({
      ...item,
      savingThrowSpecificBonuses: Object.keys(current).length > 0 ? current : undefined
    });
  };

  const handleSkillBonusChange = (skillName: string, val: string) => {
    const current = { ...(item.skillBonuses || {}) };
    if (val === '' || isNaN(Number(val))) {
      delete current[skillName];
    } else {
      current[skillName] = parseInt(val, 10);
    }
    onChange({
      ...item,
      skillBonuses: Object.keys(current).length > 0 ? current : undefined
    });
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Top Classification: Slot, Rarity, Attunement, Magic/Cursed */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-amber-300 font-bold flex items-center gap-1.5 font-serif text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Properties & Attunement</span>
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-purple-300 cursor-pointer font-sans select-none">
              <input
                type="checkbox"
                checked={item.isMagic || false}
                onChange={(e) => onChange({ ...item, isMagic: e.target.checked })}
                className="rounded text-purple-600 bg-stone-800 border-stone-700"
              />
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Magical</span>
            </label>
            <label className="flex items-center gap-1.5 text-rose-400 cursor-pointer font-sans select-none">
              <input
                type="checkbox"
                checked={item.isCursed || false}
                onChange={(e) => onChange({ ...item, isCursed: e.target.checked })}
                className="rounded text-rose-600 bg-stone-800 border-stone-700"
              />
              <Skull className="w-3 h-3 text-rose-400" />
              <span>Cursed</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono items-end">
          <div>
            <label className="block text-stone-400 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Equipment Slot">Equipment Slot</label>
            <select
              value={item.slot || ''}
              onChange={(e) => onChange({ ...item, slot: e.target.value || undefined })}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-sans text-xs"
            >
              {ITEM_SLOTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-stone-400 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Rarity">Rarity</label>
            <select
              value={item.rarity || 'Common'}
              onChange={(e) => onChange({ ...item, rarity: e.target.value })}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-sans text-xs"
            >
              {ITEM_RARITIES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {(edition === '5e' || !edition) && (
            <>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-1.5 text-cyan-300 cursor-pointer font-sans select-none pb-2 text-xs">
                  <input
                    type="checkbox"
                    checked={item.requiresAttunement || false}
                    onChange={(e) => onChange({ ...item, requiresAttunement: e.target.checked })}
                    className="rounded text-cyan-600 bg-stone-800 border-stone-700"
                  />
                  <span className="whitespace-nowrap truncate">Req. Attunement</span>
                </label>
              </div>

              <div className="flex flex-col justify-end">
                <label className={`flex items-center gap-1.5 text-emerald-300 font-sans select-none pb-2 text-xs ${!item.requiresAttunement ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={!item.requiresAttunement}
                    checked={item.attuned || false}
                    onChange={(e) => onChange({ ...item, attuned: e.target.checked })}
                    className="rounded text-emerald-600 bg-stone-800 border-stone-700"
                  />
                  <span className="whitespace-nowrap truncate">Attuned</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 1: Armor Class, DR, Damage Resistances & Immunities */}
      <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('defenses')}
          className="w-full p-2.5 flex items-center justify-between bg-stone-900/50 hover:bg-stone-900 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-serif font-bold text-amber-300">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Armor Class, DR & Resistances / Immunities</span>
          </div>
          {openSections.defenses ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {openSections.defenses && (
          <div className="p-3 space-y-3 border-t border-stone-800/80">
            {/* AC & DR Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono items-end">
              <div>
                <label className="block text-blue-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="AC Bonus (+)">AC Bonus (+)</label>
                <input
                  type="number"
                  value={item.acBonus ?? ''}
                  onChange={(e) => onChange({ ...item, acBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="e.g. +1, +2"
                  className="w-full bg-stone-800 border border-blue-700/50 rounded-lg p-1.5 text-blue-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-amber-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Damage Reduction (DR)">Damage Reduction (DR)</label>
                <input
                  type="number"
                  min="0"
                  value={item.damageReduction !== undefined ? Math.abs(item.damageReduction) : ''}
                  onChange={(e) => onChange({ ...item, damageReduction: e.target.value === '' ? undefined : Math.abs(parseInt(e.target.value, 10)) })}
                  placeholder="e.g. 2, 5"
                  className="w-full bg-stone-800 border border-amber-600/50 rounded-lg p-1.5 text-amber-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Base Armor AC">Base Armor AC</label>
                <input
                  type="number"
                  value={item.armorAc ?? ''}
                  onChange={(e) => onChange({ ...item, armorAc: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="e.g. 14, 18"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Max DEX Mod Cap">Max DEX Mod Cap</label>
                <input
                  type="number"
                  value={item.maxDexBonus ?? ''}
                  onChange={(e) => onChange({ ...item, maxDexBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="e.g. 2"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 text-xs"
                />
              </div>
            </div>

            {/* 3.5e Specific Defensive Metrics */}
            {edition === '3.5e' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800 font-mono items-end">
                <div>
                  <label className="block text-cyan-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Deflection AC">Deflection AC</label>
                  <input
                    type="number"
                    value={item.deflectionBonus ?? ''}
                    onChange={(e) => onChange({ ...item, deflectionBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                    placeholder="+1 Ring"
                    className="w-full bg-stone-800 border border-cyan-800/60 rounded p-1.5 text-cyan-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-emerald-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Natural Armor">Natural Armor</label>
                  <input
                    type="number"
                    value={item.naturalArmorBonus ?? ''}
                    onChange={(e) => onChange({ ...item, naturalArmorBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                    placeholder="+2 Amulet"
                    className="w-full bg-stone-800 border border-emerald-800/60 rounded p-1.5 text-emerald-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-yellow-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Dodge AC">Dodge AC</label>
                  <input
                    type="number"
                    value={item.dodgeBonus ?? ''}
                    onChange={(e) => onChange({ ...item, dodgeBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                    placeholder="+1 Boots"
                    className="w-full bg-stone-800 border border-yellow-800/60 rounded p-1.5 text-yellow-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-rose-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Armor Check Penalty">Armor Check Penalty</label>
                  <input
                    type="number"
                    value={item.armorCheckPenalty ?? ''}
                    onChange={(e) => onChange({ ...item, armorCheckPenalty: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                    placeholder="-4"
                    className="w-full bg-stone-800 border border-rose-800/60 rounded p-1.5 text-rose-200 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Damage Resistances */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-orange-300 text-[11px] font-semibold flex items-center gap-1 font-sans">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                  <span>Damage Resistances (Half Damage)</span>
                </label>
              </div>
              <input
                type="text"
                value={item.resistance || ''}
                onChange={(e) => onChange({ ...item, resistance: e.target.value || undefined })}
                placeholder="Click quick tags below or type (e.g. Fire, Cold, Slashing)"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-100 text-xs"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {DAMAGE_TYPES.map(type => {
                  const active = (item.resistance || '').toLowerCase().includes(type.toLowerCase());
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleToggleTag('resistance', type)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                        active
                          ? 'bg-orange-950 text-orange-200 border-orange-600 font-bold shadow-sm'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      {active ? `✓ ${type}` : `+ ${type}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Damage Immunities */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-emerald-300 text-[11px] font-semibold flex items-center gap-1 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Damage Immunities (0 Damage)</span>
                </label>
              </div>
              <input
                type="text"
                value={item.immunity || ''}
                onChange={(e) => onChange({ ...item, immunity: e.target.value || undefined })}
                placeholder="Click quick tags below or type (e.g. Poison, Necrotic)"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-100 text-xs"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {DAMAGE_TYPES.map(type => {
                  const active = (item.immunity || '').toLowerCase().includes(type.toLowerCase());
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleToggleTag('immunity', type)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                        active
                          ? 'bg-emerald-950 text-emerald-200 border-emerald-600 font-bold shadow-sm'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      {active ? `✓ ${type}` : `+ ${type}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Immunities */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-purple-300 text-[11px] font-semibold flex items-center gap-1 font-sans">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Condition Immunities</span>
                </label>
              </div>
              <input
                type="text"
                value={item.conditionImmunities || ''}
                onChange={(e) => onChange({ ...item, conditionImmunities: e.target.value || undefined })}
                placeholder="Click quick tags below or type (e.g. Charmed, Frightened, Paralyzed)"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-100 text-xs"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {CONDITIONS_LIST.map(cond => {
                  const active = (item.conditionImmunities || '').toLowerCase().includes(cond.toLowerCase());
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleToggleTag('conditionImmunities', cond)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${
                        active
                          ? 'bg-purple-950 text-purple-200 border-purple-600 font-bold shadow-sm'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      {active ? `✓ ${cond}` : `+ ${cond}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Saving Throws & Ability Score Enhancements */}
      <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('abilitiesSaves')}
          className="w-full p-2.5 flex items-center justify-between bg-stone-900/50 hover:bg-stone-900 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-serif font-bold text-indigo-300">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Saving Throws & Ability Score Enhancements</span>
          </div>
          {openSections.abilitiesSaves ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {openSections.abilitiesSaves && (
          <div className="p-3 space-y-3 border-t border-stone-800/80">
            {/* Global Saving Throw Bonus (Ring/Cloak of Protection) */}
            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-indigo-200 font-semibold block text-xs">All Saving Throws Bonus</span>
                <span className="text-stone-400 text-[10px] block">Grants +X to all 6 saving throws (e.g. +1 from Ring of Protection)</span>
              </div>
              <input
                type="number"
                value={item.savingThrowBonus ?? ''}
                onChange={(e) => onChange({ ...item, savingThrowBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                placeholder="+1"
                className="w-20 bg-stone-800 border border-indigo-600/50 rounded-lg p-1.5 text-indigo-200 font-mono font-bold text-center"
              />
            </div>

            {/* Individual Ability Saving Throw Adjustments */}
            <div className="space-y-1">
              <span className="text-stone-300 font-semibold block text-[11px]">Individual Saving Throw Bonuses</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(ab => (
                  <div key={ab} className="bg-stone-900 border border-stone-800 rounded p-1 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">{ab} Save</span>
                    <input
                      type="number"
                      value={item.savingThrowSpecificBonuses?.[ab] ?? ''}
                      onChange={(e) => handleSpecificSaveChange(ab, e.target.value)}
                      placeholder="+0"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-center text-stone-200 font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Ability Score Setters (Gauntlets of Ogre Power = 19, Belts of Giant Strength) */}
            <div className="space-y-1 pt-1 border-t border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-semibold block text-[11px]">Set Ability Score to Fixed Value</span>
                <span className="text-stone-400 text-[10px]">Overrides score if higher (e.g. Gauntlets = 19, Amulet = 19)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(ab => (
                  <div key={ab} className="bg-stone-900 border border-stone-800 rounded p-1 text-center">
                    <span className="text-[10px] text-amber-400 font-bold block">{ab} Set</span>
                    <input
                      type="number"
                      value={item.abilitySetters?.[ab] ?? ''}
                      onChange={(e) => handleAbilitySetterChange(ab, e.target.value)}
                      placeholder="e.g. 19"
                      className="w-full bg-stone-800 border border-amber-800/50 rounded p-1 text-center text-amber-200 font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ability Score Flat Bonuses (Tome of Understanding = +2, Manuals) */}
            <div className="space-y-1 pt-1 border-t border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-semibold block text-[11px]">Add Bonus to Ability Score</span>
                <span className="text-stone-400 text-[10px]">Adds flat bonus to stat score (e.g. +2 from Tomes)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-mono">
                {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as AbilityName[]).map(ab => (
                  <div key={ab} className="bg-stone-900 border border-stone-800 rounded p-1 text-center">
                    <span className="text-[10px] text-emerald-400 font-bold block">{ab} +</span>
                    <input
                      type="number"
                      value={item.abilityBonuses?.[ab] ?? ''}
                      onChange={(e) => handleAbilityBonusChange(ab, e.target.value)}
                      placeholder="+2"
                      className="w-full bg-stone-800 border border-emerald-800/50 rounded p-1 text-center text-emerald-200 font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Skills, Senses & Passive Perception */}
      <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('skillsSenses')}
          className="w-full p-2.5 flex items-center justify-between bg-stone-900/50 hover:bg-stone-900 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-serif font-bold text-teal-300">
            <Eye className="w-4 h-4 text-teal-400" />
            <span>Skills, Senses & Passive Perception</span>
          </div>
          {openSections.skillsSenses ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {openSections.skillsSenses && (
          <div className="p-3 space-y-3 border-t border-stone-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono items-end">
              <div>
                <label className="block text-teal-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="All Ability Checks (+)">All Ability Checks (+)</label>
                <input
                  type="number"
                  value={item.checkBonus ?? ''}
                  onChange={(e) => onChange({ ...item, checkBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+1 (Luckstone)"
                  className="w-full bg-stone-800 border border-teal-700/50 rounded-lg p-1.5 text-teal-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Passive Perception (+)">Passive Perception (+)</label>
                <input
                  type="number"
                  value={item.passivePerceptionBonus ?? ''}
                  onChange={(e) => onChange({ ...item, passivePerceptionBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+5 (Sentinel Shield)"
                  className="w-full bg-stone-800 border border-cyan-700/50 rounded-lg p-1.5 text-cyan-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Darkvision (ft)">Darkvision (ft)</label>
                <input
                  type="number"
                  value={item.darkvision ?? ''}
                  onChange={(e) => onChange({ ...item, darkvision: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="60 ft (Goggles)"
                  className="w-full bg-stone-800 border border-purple-700/50 rounded-lg p-1.5 text-purple-200 font-bold text-xs"
                />
              </div>
            </div>

            {/* Specific Skill Bonuses Grid */}
            <div className="space-y-1.5 pt-1 border-t border-stone-800/60">
              <span className="text-stone-300 font-semibold block text-[11px]">Specific Skill Bonuses (e.g. Stealth +5, Perception +5)</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 font-mono">
                {ALL_SKILLS.map(skill => (
                  <div key={skill} className="bg-stone-900 border border-stone-800 rounded p-1 text-center">
                    <span className="text-[9px] text-stone-400 font-bold block truncate" title={skill}>{skill}</span>
                    <input
                      type="number"
                      value={item.skillBonuses?.[skill] ?? ''}
                      onChange={(e) => handleSkillBonusChange(skill, e.target.value)}
                      placeholder="+0"
                      className="w-full bg-stone-800 border border-stone-700 rounded p-1 text-center text-teal-200 font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Combat, HP, Spells & Spell DC */}
      <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('combatMagic')}
          className="w-full p-2.5 flex items-center justify-between bg-stone-900/50 hover:bg-stone-900 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-serif font-bold text-rose-300">
            <Swords className="w-4 h-4 text-rose-400" />
            <span>Combat, Max HP, Initiative & Spellcasting</span>
          </div>
          {openSections.combatMagic ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {openSections.combatMagic && (
          <div className="p-3 space-y-3 border-t border-stone-800/80">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono items-end">
              <div>
                <label className="block text-red-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Max HP Mod">Max HP Mod</label>
                <input
                  type="number"
                  value={item.hpMaxBonus ?? ''}
                  onChange={(e) => onChange({ ...item, hpMaxBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+10"
                  className="w-full bg-stone-800 border border-red-700/50 rounded-lg p-1.5 text-red-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-yellow-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Initiative (+)">Initiative (+)</label>
                <input
                  type="number"
                  value={item.initiativeBonus ?? ''}
                  onChange={(e) => onChange({ ...item, initiativeBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+2"
                  className="w-full bg-stone-800 border border-yellow-700/50 rounded-lg p-1.5 text-yellow-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-indigo-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Spell DC (+)">Spell DC (+)</label>
                <input
                  type="number"
                  value={item.spellDcBonus ?? ''}
                  onChange={(e) => onChange({ ...item, spellDcBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+1, +2"
                  className="w-full bg-stone-800 border border-indigo-700/50 rounded-lg p-1.5 text-indigo-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-purple-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Spell Attack (+)">Spell Attack (+)</label>
                <input
                  type="number"
                  value={item.spellAttackBonus ?? ''}
                  onChange={(e) => onChange({ ...item, spellAttackBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+1, +2"
                  className="w-full bg-stone-800 border border-purple-700/50 rounded-lg p-1.5 text-purple-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-rose-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Attack Roll (+)">Attack Roll (+)</label>
                <input
                  type="number"
                  value={item.attackBonus ?? ''}
                  onChange={(e) => onChange({ ...item, attackBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+1"
                  className="w-full bg-stone-800 border border-rose-700/50 rounded-lg p-1.5 text-rose-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-orange-300 text-[10px] font-sans mb-1 font-semibold whitespace-nowrap truncate" title="Damage Roll (+)">Damage Roll (+)</label>
                <input
                  type="number"
                  value={item.damageBonus ?? ''}
                  onChange={(e) => onChange({ ...item, damageBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+2"
                  className="w-full bg-stone-800 border border-orange-700/50 rounded-lg p-1.5 text-orange-200 font-bold text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 5: Speeds, Charges & Active Spells Granted */}
      <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('speedsCharges')}
          className="w-full p-2.5 flex items-center justify-between bg-stone-900/50 hover:bg-stone-900 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-serif font-bold text-sky-300">
            <Footprints className="w-4 h-4 text-sky-400" />
            <span>Movement Speeds, Item Charges & Granted Spells</span>
          </div>
          {openSections.speedsCharges ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {openSections.speedsCharges && (
          <div className="p-3 space-y-3 border-t border-stone-800/80">
            {/* Speeds Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono items-end">
              <div>
                <label className="block text-sky-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Walking Speed Bonus">Walk Speed (+)</label>
                <input
                  type="number"
                  value={item.speedBonus ?? ''}
                  onChange={(e) => onChange({ ...item, speedBonus: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="+10 ft"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-sky-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-cyan-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Fly Speed (ft)">Fly Speed (ft)</label>
                <input
                  type="number"
                  value={item.flySpeed ?? ''}
                  onChange={(e) => onChange({ ...item, flySpeed: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="60 ft"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-cyan-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-blue-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Swim Speed (ft)">Swim Speed (ft)</label>
                <input
                  type="number"
                  value={item.swimSpeed ?? ''}
                  onChange={(e) => onChange({ ...item, swimSpeed: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="40 ft"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-blue-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-emerald-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Climb Speed (ft)">Climb Speed (ft)</label>
                <input
                  type="number"
                  value={item.climbSpeed ?? ''}
                  onChange={(e) => onChange({ ...item, climbSpeed: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                  placeholder="30 ft"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-emerald-200 text-xs"
                />
              </div>
            </div>

            {/* Charges Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800 font-mono items-end">
              <div>
                <label className="block text-amber-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Current Charges">Current Charges</label>
                <input
                  type="number"
                  value={item.charges?.current ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    if (val === undefined && !item.charges?.max && !item.charges?.recharge) {
                      onChange({ ...item, charges: undefined });
                    } else {
                      onChange({
                        ...item,
                        charges: {
                          current: val ?? 0,
                          max: item.charges?.max ?? val ?? 0,
                          recharge: item.charges?.recharge
                        }
                      });
                    }
                  }}
                  placeholder="10"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-amber-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-amber-300 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Max Charges">Max Charges</label>
                <input
                  type="number"
                  value={item.charges?.max ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    if (val === undefined && !item.charges?.current && !item.charges?.recharge) {
                      onChange({ ...item, charges: undefined });
                    } else {
                      onChange({
                        ...item,
                        charges: {
                          current: item.charges?.current ?? val ?? 0,
                          max: val ?? 0,
                          recharge: item.charges?.recharge
                        }
                      });
                    }
                  }}
                  placeholder="10"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-amber-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-[10px] font-sans mb-1 whitespace-nowrap truncate" title="Recharge Rate">Recharge Rate</label>
                <input
                  type="text"
                  value={item.charges?.recharge || ''}
                  onChange={(e) => {
                    const val = e.target.value.trim() || undefined;
                    if (!val && !item.charges?.max && !item.charges?.current) {
                      onChange({ ...item, charges: undefined });
                    } else {
                      onChange({
                        ...item,
                        charges: {
                          current: item.charges?.current ?? 0,
                          max: item.charges?.max ?? 0,
                          recharge: val
                        }
                      });
                    }
                  }}
                  placeholder="e.g. 1d6+1 daily at dawn"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-sans text-xs"
                />
              </div>
            </div>

            {/* Spells or Activated Powers Granted */}
            <div className="space-y-1 pt-2 border-t border-stone-800">
              <label className="block text-purple-300 text-[10px] font-sans font-semibold">Spells & Activated Abilities Granted</label>
              <input
                type="text"
                value={item.spellsGranted || ''}
                onChange={(e) => onChange({ ...item, spellsGranted: e.target.value || undefined })}
                placeholder="e.g. Misty Step (2 charges), Shield (1/day), Detect Magic (At will)"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-1.5 text-stone-200 font-sans text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
