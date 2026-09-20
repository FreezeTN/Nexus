import { CharacterData, GearItem, Attack } from '../types';

const WEAPON_KEYWORDS = [
  'sword', 'blade', 'dagger', 'axe', 'bow', 'crossbow', 'mace', 'hammer', 'spear',
  'halberd', 'glaive', 'flail', 'rapier', 'scimitar', 'greatsword', 'longsword',
  'shortsword', 'greataxe', 'battleaxe', 'handaxe', 'club', 'quarterstaff', 'staff',
  'sling', 'javelin', 'dart', 'trident', 'warhammer', 'morningstar', 'pike', 'lance',
  'whip', 'scythe', 'sickle', 'katar', 'kama', 'nunchaku', 'shuriken', 'bastard sword'
];

/**
 * Checks whether an inventory gear item is a weapon based on type, stats, or name.
 */
export function isWeaponGearItem(item: GearItem): boolean {
  if (!item) return false;
  if (item.itemType === 'Weapon') return true;
  if (item.weaponStats && typeof item.weaponStats === 'object') return true;
  
  const nameLower = (item.name || '').toLowerCase();
  return WEAPON_KEYWORDS.some(k => nameLower.includes(k));
}

/**
 * Derives a base damage dice string from a weapon's damage or name.
 */
function deriveWeaponDice(item: GearItem): string {
  if (item.weaponStats?.damage) {
    const match = String(item.weaponStats.damage).match(/^([0-9]+d[0-9]+)/i);
    if (match) return match[1];
  }
  const nameLower = (item.name || '').toLowerCase();
  if (nameLower.includes('greatsword') || nameLower.includes('greataxe')) return '2d6';
  if (nameLower.includes('longsword') || nameLower.includes('battleaxe') || nameLower.includes('warhammer') || nameLower.includes('longbow')) return '1d8';
  if (nameLower.includes('heavy crossbow') || nameLower.includes('halberd') || nameLower.includes('glaive')) return '1d10';
  if (nameLower.includes('shortsword') || nameLower.includes('shortbow') || nameLower.includes('scimitar') || nameLower.includes('light crossbow') || nameLower.includes('mace')) return '1d6';
  if (nameLower.includes('dagger') || nameLower.includes('sling') || nameLower.includes('dart') || nameLower.includes('whip') || nameLower.includes('sickle')) return '1d4';
  if (nameLower.includes('club') || nameLower.includes('quarterstaff')) return '1d6';
  return '1d8';
}

/**
 * Derives damage type from weapon stats or name.
 */
function deriveWeaponDamageType(item: GearItem): string {
  if (item.weaponStats?.damageType) return item.weaponStats.damageType;
  const nameLower = (item.name || '').toLowerCase();
  if (nameLower.includes('bow') || nameLower.includes('crossbow') || nameLower.includes('spear') || nameLower.includes('rapier') || nameLower.includes('javelin') || nameLower.includes('dart') || nameLower.includes('pike') || nameLower.includes('lance')) {
    return 'Piercing';
  }
  if (nameLower.includes('mace') || nameLower.includes('hammer') || nameLower.includes('flail') || nameLower.includes('club') || nameLower.includes('staff') || nameLower.includes('sling')) {
    return 'Bludgeoning';
  }
  return 'Slashing';
}

/**
 * Derives range string from weapon stats or name.
 */
function deriveWeaponRange(item: GearItem): string {
  if (item.weaponStats?.range) return item.weaponStats.range;
  const nameLower = (item.name || '').toLowerCase();
  if (nameLower.includes('longbow')) return '100/400 ft';
  if (nameLower.includes('shortbow')) return '60/240 ft';
  if (nameLower.includes('heavy crossbow')) return '120/480 ft';
  if (nameLower.includes('light crossbow')) return '80/320 ft';
  if (nameLower.includes('sling')) return '50/200 ft';
  if (nameLower.includes('javelin') || nameLower.includes('dart') || nameLower.includes('thrown')) return '30/120 ft Thrown';
  if (nameLower.includes('halberd') || nameLower.includes('glaive') || nameLower.includes('pike') || nameLower.includes('lance')) return '10 ft Reach';
  return '5 ft Melee';
}

/**
 * Derives enhancement bonus from item stats or name (e.g. "+1 Longsword").
 */
function deriveEnhancementBonus(item: GearItem): number {
  if (typeof item.enhancementBonus === 'number') return item.enhancementBonus;
  if (typeof item.weaponStats?.enhancementBonus === 'number') return item.weaponStats.enhancementBonus;
  const nameMatch = (item.name || '').match(/\+(\d+)/);
  if (nameMatch) return parseInt(nameMatch[1], 10);
  return 0;
}

/**
 * Synchronizes equipped weapons from inventory to character attacks.
 * - Adds attacks for equipped weapons not yet registered.
 * - Updates grip, damage, range, and enhancement bonuses for linked attacks.
 * - Removes auto-synced attacks ('atk-gear-') for unequipped or removed weapons.
 */
export function syncInventoryWeaponsToAttacks(char: CharacterData): CharacterData {
  if (!char || !char.inventory) return char;

  const equippedWeapons = char.inventory.filter(i => i.equipped && isWeaponGearItem(i));
  const equippedWeaponIds = new Set(equippedWeapons.map(w => w.id));

  let currentAttacks = [...(char.attacks || [])];

  // 1. Remove auto-generated attacks for weapons that are no longer equipped
  currentAttacks = currentAttacks.filter(atk => {
    if (atk.id && atk.id.startsWith('atk-gear-')) {
      const linkedId = atk.inventoryItemId || atk.id.replace('atk-gear-', '');
      return equippedWeaponIds.has(linkedId);
    }
    return true;
  });

  // 2. For each equipped weapon, create or update attack
  equippedWeapons.forEach(weapon => {
    const existingIndex = currentAttacks.findIndex(
      a => a.inventoryItemId === weapon.id || a.id === 'atk-gear-' + weapon.id
    );

    const isTwoHanded = weapon.slot === 'Two-Handed' || weapon.wieldGrip === '2H' || Boolean(weapon.weaponStats?.isTwoHanded);
    const isOffhand = weapon.slot === 'Off Hand' || (weapon.wieldGrip as string) === 'OH';
    const wieldGrip: '1H' | '2H' | 'OH' = isTwoHanded ? '2H' : isOffhand ? 'OH' : '1H';
    const enhancementBonus = deriveEnhancementBonus(weapon);
    const baseDice = deriveWeaponDice(weapon);
    const damageType = deriveWeaponDamageType(weapon);
    const range = deriveWeaponRange(weapon);

    if (existingIndex >= 0) {
      // Update existing attack
      const existing = currentAttacks[existingIndex];
      currentAttacks[existingIndex] = {
        ...existing,
        name: weapon.name,
        inventoryItemId: weapon.id,
        isTwoHanded,
        isOffhand,
        wieldGrip,
        enhancementBonus: existing.enhancementBonus !== undefined ? existing.enhancementBonus : enhancementBonus,
        damageType: existing.damageType || damageType,
        range: existing.range || range,
        baseDamageDice: existing.baseDamageDice || baseDice
      };
    } else {
      // Create new attack synced from this weapon
      const newAtk: Attack = {
        id: 'atk-gear-' + weapon.id,
        name: weapon.name,
        inventoryItemId: weapon.id,
        attackBonus: 0,
        damage: weapon.weaponStats?.damage || baseDice,
        damageType,
        range,
        notes: weapon.notes || weapon.weaponStats?.notes || '',
        baseDamageDice: baseDice,
        isTwoHanded,
        isOffhand,
        wieldGrip,
        enhancementBonus,
        threatRange: weapon.weaponStats?.threatRange || 20,
        critMultiplier: weapon.weaponStats?.critMultiplier || 2,
        isKeen: Boolean(weapon.weaponStats?.isKeen)
      };
      currentAttacks.push(newAtk);
    }
  });

  return {
    ...char,
    attacks: currentAttacks
  };
}
