import React, { useState, useMemo } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { CharacterData, GearItem } from '../../../types';
import { SupportedEdition, FANTASY_DAMAGE_TYPES } from './ForgeTypes';
import { Sword, Save, Shield, Wand2, Package, Sparkles, Plus, Trash2, Backpack } from 'lucide-react';
import { validateHomebrewItem, ValidationResult } from '../../../utils/homebrewValidator';
import { recalculateCharacterAC } from '../../../utils/dndCalculations';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

interface ItemStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (updated: CharacterData) => void;
}

export const ItemStudio: React.FC<ItemStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose,
  activeCharacter,
  onUpdateCharacter
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addToInventory, setAddToInventory] = useState(!!activeCharacter);

  // Fantasy Item fields
  const [itemType, setItemType] = useState<'weapon' | 'armor' | 'shield' | 'potion' | 'ring' | 'scroll' | 'wand' | 'gear'>('weapon');
  const [rarity, setRarity] = useState('Uncommon');
  const [cost, setCost] = useState('250 gp');
  const [weight, setWeight] = useState(3);
  const [requiresAttunement, setRequiresAttunement] = useState(false);
  const [damageFormula, setDamageFormula] = useState('1d8 + 1');
  const [damageType, setDamageType] = useState('Slashing');
  const [acBonus, setAcBonus] = useState(1);
  const [propertiesText, setPropertiesText] = useState('Finesse, Versatile (1d10)');

  // Shadowrun Gear / Cyberware / Weapons fields
  const [srCategory, setSrCategory] = useState<'Firearm' | 'Melee Weapon' | 'Cyberware' | 'Bioware' | 'Cyberdeck' | 'Drone / Vehicle' | 'Armor' | 'Arcane Focus' | 'Street Gear'>('Firearm');
  const [srNuyenCost, setSrNuyenCost] = useState('12,500 ¥');
  const [srAvailability, setSrAvailability] = useState('8R');
  const [srConceal, setSrConceal] = useState('Rating 3');
  const [srWeaponDmg, setSrWeaponDmg] = useState('9P');
  const [srAp, setSrAp] = useState(-2);
  const [srMode, setSrMode] = useState('SA/BF');
  const [srAmmo, setSrAmmo] = useState('30(c)');
  const [srRc, setSrRc] = useState(2);
  const [srArmorVal, setSrArmorVal] = useState(12);
  const [srEssenceCost, setSrEssenceCost] = useState(0.5);
  const [srCyberGrade, setSrCyberGrade] = useState<'Standard' | 'Alphaware' | 'Betaware' | 'Deltaware' | 'Used'>('Standard');
  const [srDeckStats, setSrDeckStats] = useState('DR 4, Attack 5, Sleaze 6, DP 4, Firewall 5');

  // Call of Cthulhu Item / Tome / Relic fields
  const [cocCategory, setCocCategory] = useState<'Firearm / Weapon' | 'Eldritch Tome' | 'Alien Relic / Artifact' | '1920s Gear' | 'Occult Talisman'>('Firearm / Weapon');
  const [cocItemCost, setCocItemCost] = useState('$25 (1920s)');
  const [cocWeaponSkill, setCocWeaponSkill] = useState('Firearms (Handgun) 20%');
  const [cocWeaponDmg, setCocWeaponDmg] = useState('1d10');
  const [cocWeaponMalf, setCocWeaponMalf] = useState('98-100');
  const [cocWeaponAttacks, setCocWeaponAttacks] = useState('1 (3)');
  const [cocWeaponAmmo, setCocWeaponAmmo] = useState('6 rounds (.38)');
  const [cocWeaponRange, setCocWeaponRange] = useState('15 yards');
  // CoC Tomes
  const [cocTomeLanguage, setCocTomeLanguage] = useState('Latin (Translated 1642)');
  const [cocTomeSanLoss, setCocTomeSanLoss] = useState('1d4 / 2d8 Sanity');
  const [cocTomeMythosGain, setCocTomeMythosGain] = useState('+6% Cthulhu Mythos');
  const [cocTomeStudyTime, setCocTomeStudyTime] = useState('12 weeks');
  const [cocTomeSpells, setCocTomeSpells] = useState('Summon Byakhee, Voorish Sign, Seal of Isis');
  // CoC Relics
  const [cocRelicSanCost, setCocRelicSanCost] = useState('1d6 Sanity per activation');
  const [cocRelicMpCost, setCocRelicMpCost] = useState('3 MP');

  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Live Item Validation
  const validation = useMemo(() => {
    return validateHomebrewItem({
      name,
      itemType,
      rarity,
      cost,
      weight,
      requiresAttunement,
      damageFormula,
      damageType,
      acBonus: (itemType === 'armor' || itemType === 'shield') ? acBonus : undefined,
      description,
      edition
    });
  }, [name, itemType, rarity, cost, weight, requiresAttunement, damageFormula, damageType, acBonus, description, edition]);

  const executeSave = () => {
    let itemDataPayload: any = {};
    let descSummary = description.trim();
    let itemTags: string[] = ['items', edition, 'Homebrew'];

    if (edition === 'shadowrun') {
      itemTags.push(srCategory, `Avail ${srAvailability}`);
      itemDataPayload = {
        type: (srCategory === 'Firearm' || srCategory === 'Melee Weapon') ? 'weapon' : srCategory === 'Armor' ? 'armor' : 'gear',
        cost: srNuyenCost,
        damage: (srCategory === 'Firearm' || srCategory === 'Melee Weapon') ? `${srWeaponDmg} (AP ${srAp})` : undefined,
        damageType: srCategory === 'Firearm' ? `Mode: ${srMode}, Ammo: ${srAmmo}` : undefined,
        armorClass: srCategory === 'Armor' ? srArmorVal : undefined,
        rarity: `Avail ${srAvailability}`,
        properties: [
          srCategory,
          `Cost: ${srNuyenCost}`,
          `Avail: ${srAvailability}`,
          srCategory === 'Cyberware' ? `Essence: ${srEssenceCost} (${srCyberGrade})` : '',
          srCategory === 'Cyberdeck' ? srDeckStats : ''
        ].filter(Boolean)
      };

      if (!descSummary) {
        if (srCategory === 'Firearm' || srCategory === 'Melee Weapon') {
          descSummary = `${srCategory}. Damage: ${srWeaponDmg}, AP: ${srAp}, Modes: ${srMode}, Ammo: ${srAmmo}, RC: ${srRc}. Cost: ${srNuyenCost}, Avail: ${srAvailability}.`;
        } else if (srCategory === 'Armor') {
          descSummary = `Armor Rating: ${srArmorVal}. Cost: ${srNuyenCost}, Avail: ${srAvailability}.`;
        } else if (srCategory === 'Cyberware' || srCategory === 'Bioware') {
          descSummary = `${srCategory} (${srCyberGrade}). Essence: ${srEssenceCost}. Cost: ${srNuyenCost}, Avail: ${srAvailability}.`;
        } else if (srCategory === 'Cyberdeck') {
          descSummary = `Cyberdeck [${srDeckStats}]. Cost: ${srNuyenCost}, Avail: ${srAvailability}.`;
        } else {
          descSummary = `${srCategory}. Cost: ${srNuyenCost}, Avail: ${srAvailability}.`;
        }
      }
    } else if (edition === 'cthulhu') {
      itemTags.push(cocCategory, 'Call of Cthulhu');
      itemDataPayload = {
        type: cocCategory === 'Firearm / Weapon' ? 'weapon' : 'gear',
        cost: cocItemCost,
        damage: cocCategory === 'Firearm / Weapon' ? cocWeaponDmg : undefined,
        damageType: cocCategory === 'Firearm / Weapon' ? `Skill: ${cocWeaponSkill}` : undefined,
        rarity: cocCategory,
        properties: [
          cocCategory,
          `Cost: ${cocItemCost}`,
          cocCategory === 'Firearm / Weapon' ? `Malf: ${cocWeaponMalf}, Ammo: ${cocWeaponAmmo}, Range: ${cocWeaponRange}` : '',
          cocCategory === 'Eldritch Tome' ? `SAN Loss: ${cocTomeSanLoss}, Mythos: ${cocTomeMythosGain}` : '',
          cocCategory === 'Alien Relic / Artifact' ? `Activation: ${cocRelicSanCost}, ${cocRelicMpCost}` : ''
        ].filter(Boolean)
      };

      if (!descSummary) {
        if (cocCategory === 'Firearm / Weapon') {
          descSummary = `Firearm. Base Skill: ${cocWeaponSkill}, Damage: ${cocWeaponDmg}, Malfunction: ${cocWeaponMalf}, Attacks: ${cocWeaponAttacks}, Range: ${cocWeaponRange}, Ammo: ${cocWeaponAmmo}.`;
        } else if (cocCategory === 'Eldritch Tome') {
          descSummary = `Occult Grimoire. Language: ${cocTomeLanguage}. Study: ${cocTomeStudyTime}, SAN Loss: ${cocTomeSanLoss}, Mythos: ${cocTomeMythosGain}. Spells: ${cocTomeSpells}.`;
        } else if (cocCategory === 'Alien Relic / Artifact') {
          descSummary = `Extraterrestrial Artifact. Activation: ${cocRelicSanCost}, ${cocRelicMpCost}.`;
        } else {
          descSummary = `${cocCategory}. Cost: ${cocItemCost}.`;
        }
      }
    } else {
      // Fantasy 5e / 3.5e / PF2e
      itemTags.push(itemType, rarity);
      if (requiresAttunement) itemTags.push('Attunement');
      itemDataPayload = {
        type: itemType,
        cost,
        weight,
        rarity,
        attunement: requiresAttunement,
        damage: (itemType === 'weapon') ? damageFormula : undefined,
        damageType: (itemType === 'weapon') ? damageType : undefined,
        armorClass: (itemType === 'armor' || itemType === 'shield') ? acBonus : undefined,
        properties: propertiesText.split(',').map(p => p.trim()).filter(Boolean)
      };

      if (!descSummary) {
        descSummary = `${rarity} ${itemType}.${requiresAttunement ? ' (Requires Attunement)' : ''} Value: ${cost}, Weight: ${weight} lbs.${itemType === 'weapon' ? ` Damage: ${damageFormula} ${damageType}.` : ''}${itemType === 'armor' ? ` AC Bonus: +${acBonus}.` : ''}`;
      }
    }

    const newItem: CompendiumItem = {
      id: `custom-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category: 'items',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: descSummary,
      isCustom: true,
      tags: itemTags,
      itemData: itemDataPayload
    };

    onSave(newItem);

    // If opted into adding directly to active character
    if (addToInventory && activeCharacter && onUpdateCharacter) {
      const isWeapon = itemType === 'weapon' || !!itemDataPayload.damage;
      const isArmor = itemType === 'armor' || itemType === 'shield' || itemDataPayload.armorClass !== undefined;
      const costVal = typeof itemDataPayload.costGp === 'number' ? itemDataPayload.costGp : (parseFloat(itemDataPayload.cost || '0') || 0);

      const newGearItem: GearItem = {
        id: 'gear-forged-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: newItem.name,
        quantity: 1,
        weight: typeof itemDataPayload.weight === 'number' ? itemDataPayload.weight : (parseFloat(itemDataPayload.weight || '1') || 1),
        costGp: costVal,
        equipped: false,
        stored: false,
        notes: newItem.description,
        itemType: isWeapon ? 'Weapon' : isArmor ? 'Armor' : 'Misc',
        armorAc: isArmor ? (itemDataPayload.armorClass ?? acBonus) : undefined,
        armorType: isArmor ? 'Light' : undefined,
        acBonus: isArmor ? acBonus : undefined,
        isMagic: !!itemDataPayload.rarity || itemTags.includes('Magic'),
        requiresAttunement: requiresAttunement,
        weaponStats: isWeapon ? {
          damage: damageFormula,
          damageType: damageType,
          range: 'Melee',
          notes: propertiesText
        } : undefined
      };

      const currentInv = Array.isArray(activeCharacter.inventory) ? activeCharacter.inventory : [];
      const updatedChar = recalculateCharacterAC({
        ...activeCharacter,
        inventory: [...currentInv, newGearItem]
      });

      onUpdateCharacter(updatedChar);
    }

    setName('');
    setDescription('');
    setShowOverrideModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (validation.hasCritical) {
      setShowOverrideModal(true);
      return;
    }

    executeSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {/* SHADOWRUN WEAPONS, DECKS & CYBERWARE */}
      {edition === 'shadowrun' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-cyan-300 font-bold mb-1">
                Gear / Cyberware / Weapon Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ares Predator V, Novatech Navigator Cyberdeck, Wired Reflexes 2"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-cyan-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Category</label>
              <select
                value={srCategory}
                onChange={(e) => setSrCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Firearm">Firearm / Heavy Weapon</option>
                <option value="Melee Weapon">Melee Weapon</option>
                <option value="Cyberware">Cyberware Implant</option>
                <option value="Bioware">Bioware Implant</option>
                <option value="Cyberdeck">Cyberdeck / Commlink</option>
                <option value="Drone / Vehicle">Drone / Vehicle</option>
                <option value="Armor">Armor / Armor Jacket</option>
                <option value="Arcane Focus">Arcane Focus / Foci</option>
                <option value="Street Gear">Street Tactical Gear</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Cost (Nuyen ¥)</label>
              <input
                type="text"
                value={srNuyenCost}
                onChange={(e) => setSrNuyenCost(e.target.value)}
                placeholder="12,500 ¥"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Availability & Legality</label>
              <input
                type="text"
                value={srAvailability}
                onChange={(e) => setSrAvailability(e.target.value)}
                placeholder="e.g. 8R (Restricted), 12F (Forbidden)"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            {(srCategory === 'Firearm' || srCategory === 'Melee Weapon') && (
              <>
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Damage Code & AP</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={srWeaponDmg}
                      onChange={(e) => setSrWeaponDmg(e.target.value)}
                      placeholder="9P"
                      className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-rose-300 font-mono font-bold text-xs text-center"
                    />
                    <input
                      type="number"
                      value={srAp}
                      onChange={(e) => setSrAp(parseInt(e.target.value, 10) || 0)}
                      placeholder="AP -2"
                      className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Firing Modes & Ammo</label>
                  <input
                    type="text"
                    value={srMode}
                    onChange={(e) => setSrMode(e.target.value)}
                    placeholder="SA/BF/FA (30 clip)"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                  />
                </div>
              </>
            )}

            {(srCategory === 'Cyberware' || srCategory === 'Bioware') && (
              <>
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Essence Cost</label>
                  <input
                    type="number"
                    step="0.1"
                    value={srEssenceCost}
                    onChange={(e) => setSrEssenceCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-rose-300 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Cyberware Grade</label>
                  <select
                    value={srCyberGrade}
                    onChange={(e) => setSrCyberGrade(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Alphaware">Alphaware (0.8x ESS)</option>
                    <option value="Betaware">Betaware (0.7x ESS)</option>
                    <option value="Deltaware">Deltaware (0.5x ESS)</option>
                    <option value="Used">Used (1.2x ESS)</option>
                  </select>
                </div>
              </>
            )}

            {srCategory === 'Armor' && (
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor Rating</label>
                <input
                  type="number"
                  value={srArmorVal}
                  onChange={(e) => setSrArmorVal(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs"
                />
              </div>
            )}
          </div>

          {srCategory === 'Cyberdeck' && (
            <div>
              <label className="block text-xs font-mono text-cyan-300 mb-1">Matrix ASDF Configuration</label>
              <input
                type="text"
                value={srDeckStats}
                onChange={(e) => setSrDeckStats(e.target.value)}
                placeholder="Device Rating 4, Attack 5, Sleaze 6, Data Processing 4, Firewall 5"
                className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>
      )}

      {/* CALL OF CTHULHU WEAPONS, TOMES & RELICS */}
      {edition === 'cthulhu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-emerald-400 font-bold mb-1">
                Item / Weapon / Tome Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. .45 Automatic Colt, Necronomicon (Latin), Elder Sign Pendant"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-emerald-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Artifact Type</label>
              <select
                value={cocCategory}
                onChange={(e) => setCocCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
              >
                <option value="Firearm / Weapon">Firearm / Melee Weapon</option>
                <option value="Eldritch Tome">Eldritch Tome / Occult Book</option>
                <option value="Alien Relic / Artifact">Alien Relic / Mythos Artifact</option>
                <option value="Occult Talisman">Occult Talisman / Ward</option>
                <option value="1920s Gear">1920s Investigation Gear</option>
              </select>
            </div>
          </div>

          {cocCategory === 'Firearm / Weapon' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Skill Test</label>
                <input
                  type="text"
                  value={cocWeaponSkill}
                  onChange={(e) => setCocWeaponSkill(e.target.value)}
                  placeholder="Firearms (Handgun) 20%"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Damage</label>
                <input
                  type="text"
                  value={cocWeaponDmg}
                  onChange={(e) => setCocWeaponDmg(e.target.value)}
                  placeholder="1d10, 1d6+DB"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-rose-300 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Malf / Range</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={cocWeaponMalf}
                    onChange={(e) => setCocWeaponMalf(e.target.value)}
                    placeholder="98-100"
                    className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 font-mono text-xs text-center"
                  />
                  <input
                    type="text"
                    value={cocWeaponRange}
                    onChange={(e) => setCocWeaponRange(e.target.value)}
                    placeholder="15 yds"
                    className="w-1/2 px-2 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Cost</label>
                <input
                  type="text"
                  value={cocItemCost}
                  onChange={(e) => setCocItemCost(e.target.value)}
                  placeholder="$25 (1920s)"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                />
              </div>
            </div>
          )}

          {cocCategory === 'Eldritch Tome' && (
            <div className="space-y-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Language</label>
                  <input
                    type="text"
                    value={cocTomeLanguage}
                    onChange={(e) => setCocTomeLanguage(e.target.value)}
                    placeholder="Latin, Ancient Greek, Aklo"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Sanity Loss Upon Reading</label>
                  <input
                    type="text"
                    value={cocTomeSanLoss}
                    onChange={(e) => setCocTomeSanLoss(e.target.value)}
                    placeholder="1d4 / 2d8 SAN"
                    className="w-full px-3 py-2 bg-stone-950 border border-rose-500/40 rounded-xl text-rose-300 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-stone-400 mb-1">Cthulhu Mythos Skill Gain</label>
                  <input
                    type="text"
                    value={cocTomeMythosGain}
                    onChange={(e) => setCocTomeMythosGain(e.target.value)}
                    placeholder="+6% Cthulhu Mythos"
                    className="w-full px-3 py-2 bg-stone-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Spells Contained in Tome</label>
                <input
                  type="text"
                  value={cocTomeSpells}
                  onChange={(e) => setCocTomeSpells(e.target.value)}
                  placeholder="Summon Byakhee, Voorish Sign, Call Yog-Sothoth"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                />
              </div>
            </div>
          )}

          {cocCategory === 'Alien Relic / Artifact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Sanity Cost on Activation</label>
                <input
                  type="text"
                  value={cocRelicSanCost}
                  onChange={(e) => setCocRelicSanCost(e.target.value)}
                  placeholder="1d6 SAN"
                  className="w-full px-3 py-2 bg-stone-950 border border-rose-500/40 rounded-xl text-rose-300 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Magic Point Drain</label>
                <input
                  type="text"
                  value={cocRelicMpCost}
                  onChange={(e) => setCocRelicMpCost(e.target.value)}
                  placeholder="3 MP per use"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* FANTASY 5E / 3.5E / PF2E ITEMS */}
      {(edition === '5e' || edition === '3.5e' || edition === 'pathfinder') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunblade, Cloak of Elvenkind, Ring of Spell Turning"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Item Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              >
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="shield">Shield</option>
                <option value="potion">Potion / Elixir</option>
                <option value="ring">Magic Ring</option>
                <option value="wand">Wand / Rod / Staff</option>
                <option value="scroll">Scroll</option>
                <option value="gear">Wondrous Item / Gear</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Rarity</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Common">Common</option>
                <option value="Uncommon">Uncommon</option>
                <option value="Rare">Rare</option>
                <option value="Very Rare">Very Rare</option>
                <option value="Legendary">Legendary</option>
                <option value="Artifact">Artifact</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Market Cost</label>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="500 gp"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Weight (lbs)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-stone-300">
                <input
                  type="checkbox"
                  checked={requiresAttunement}
                  onChange={(e) => setRequiresAttunement(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Attunement Required</span>
              </label>
            </div>
          </div>

          {itemType === 'weapon' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Damage Formula</label>
                <input
                  type="text"
                  value={damageFormula}
                  onChange={(e) => setDamageFormula(e.target.value)}
                  placeholder="1d8 + 1"
                  className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Damage Type</label>
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                >
                  {FANTASY_DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Weapon Properties</label>
                <input
                  type="text"
                  value={propertiesText}
                  onChange={(e) => setPropertiesText(e.target.value)}
                  placeholder="Finesse, Versatile (1d10), Light"
                  className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
                />
              </div>
            </div>
          )}

          {(itemType === 'armor' || itemType === 'shield') && (
            <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Armor Class (AC Bonus)</label>
              <input
                type="number"
                value={acBonus}
                onChange={(e) => setAcBonus(parseInt(e.target.value, 10) || 0)}
                className="w-full sm:w-48 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-mono text-stone-300 font-bold mb-1">
          Item Lore & Magic Properties Description *
        </label>
        <textarea
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detail all activation triggers, passive bonuses, charges, curses, and background lore..."
          className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
        />
      </div>

      {/* Validation & Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Homebrew Item" />

      {/* Direct Add to Character Inventory Option */}
      {activeCharacter && (
        <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400 shrink-0">
              <Backpack className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold font-serif text-stone-200 truncate">
                Add directly to <span className="text-amber-400 font-bold">{activeCharacter.name || 'Active Character'}</span>'s Inventory
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Item will be forged into compendium and immediately placed in active equipment gear
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={addToInventory}
              onChange={(e) => setAddToInventory(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold font-mono transition border border-stone-800 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{addToInventory && activeCharacter ? 'Forge & Add to Character' : 'Save Item to Compendium'}</span>
        </button>
      </div>

      {/* Game-Breaking Warning Confirmation Modal */}
      <ValidationConfirmModal
        isOpen={showOverrideModal}
        entryName={name}
        category="Item"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
