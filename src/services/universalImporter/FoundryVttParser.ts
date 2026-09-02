import { CharacterData, Attack, ClassFeature, Spell, GearItem, RuleEdition, AbilityName, Skill } from '../../types';
import { ImportResult, createCleanCharacterData } from './types';
import { DEFAULT_SKILLS_LIST } from '../../utils/dndCalculations';

export class FoundryVttParser {
  public static isFoundryData(json: any): boolean {
    if (!json || typeof json !== 'object') return false;

    // Foundry Actor standard markers
    if (json.name && (json.type === 'character' || json.type === 'npc' || json.type === 'creature')) {
      if (json.system || json.data || json.flags?.exportSource || json.prototypeToken) {
        return true;
      }
    }

    if (json.system?.abilities && (json.system.abilities.str || json.system.abilities.dex)) {
      return true;
    }

    return false;
  }

  public static parse(raw: any, edition: RuleEdition = '5e'): ImportResult {
    const warnings: string[] = [];
    const characters: CharacterData[] = [];

    const rawList: any[] = Array.isArray(raw) ? raw : [raw];

    for (const entry of rawList) {
      try {
        const char = this.convertFoundryActor(entry, edition, warnings);
        if (char) {
          characters.push(char);
        }
      } catch (err: any) {
        warnings.push(`Failed to parse Foundry actor "${entry?.name || 'Unknown'}": ${err?.message}`);
      }
    }

    return {
      success: characters.length > 0,
      characters,
      detectedFormat: 'foundry_vtt_actor',
      warnings,
      metadata: {
        formatLabel: 'Foundry VTT Actor Document Schema (v10/v11/v12)',
        entityCount: characters.length,
        detectedFields: ['abilities', 'attributes.hp', 'attributes.ac', 'items (weapons/spells/gear)', 'currency'],
        sourceVersion: raw.flags?.exportSource?.world || raw._stats?.systemVersion || 'Foundry VTT'
      }
    };
  }

  private static convertFoundryActor(entry: any, edition: RuleEdition, warnings: string[]): CharacterData {
    const sys = entry.system || entry.data || {};
    const name = entry.name || 'Foundry Adventurer';
    const isMonster = entry.type === 'npc' || entry.type === 'creature';

    // Extract abilities
    const abilitiesSys = sys.abilities || {};
    const getScore = (key: string) => {
      const a = abilitiesSys[key.toLowerCase()] || abilitiesSys[key.toUpperCase()] || {};
      if (typeof a === 'number') return a;
      return Number(a.value ?? a.score ?? 10);
    };

    const str = getScore('str');
    const dex = getScore('dex');
    const con = getScore('con');
    const int = getScore('int');
    const wis = getScore('wis');
    const cha = getScore('cha');

    // Extract AC & HP
    const attr = sys.attributes || {};
    const hpData = attr.hp || {};
    const hpMax = Number(hpData.max ?? hpData.value ?? 10);
    const hpCurrent = Number(hpData.value ?? hpMax);
    const hpTemp = Number(hpData.temp ?? 0);

    const acData = attr.ac || {};
    let armorClass = 10;
    if (typeof acData === 'number') armorClass = acData;
    else if (acData.value !== undefined) armorClass = Number(acData.value);
    else if (acData.flat !== undefined) armorClass = Number(acData.flat);

    // Speed & Movement
    let speed = 30;
    const movement = attr.movement || {};
    if (typeof movement.walk === 'number') speed = movement.walk;
    else if (typeof movement.walk === 'string') speed = parseInt(movement.walk, 10) || 30;

    // Race & Class & Level details
    const details = sys.details || {};
    let race = details.race || (isMonster ? 'Monster' : 'Human');
    let characterClass = details.class || (isMonster ? 'Creature' : 'Fighter');
    let level = Number(details.level ?? (details.cr ? Math.max(1, Math.round(Number(details.cr))) : 1));
    let alignment = details.alignment || 'Neutral';
    let background = details.background || (isMonster ? 'Monster' : 'Adventurer');

    // Items parsing (weapons, spells, features, gear)
    const items = Array.isArray(entry.items) ? entry.items : [];
    const attacks: Attack[] = [];
    const classFeatures: ClassFeature[] = [];
    const inventory: GearItem[] = [];
    const spells: Spell[] = [];

    items.forEach((it: any, idx: number) => {
      const itemSys = it.system || it.data || {};
      const itName = it.name || `Item ${idx + 1}`;
      const itType = it.type;

      if (itType === 'weapon') {
        const dmgParts = itemSys.damage?.parts || [];
        const firstDmg = Array.isArray(dmgParts[0]) ? dmgParts[0] : ['1d8', 'slashing'];
        attacks.push({
          id: `foundry-atk-${it._id || idx}`,
          name: itName,
          attackBonus: Number(itemSys.attackBonus || itemSys.bonus || 0),
          damage: firstDmg[0] || '1d8',
          damageType: firstDmg[1] || 'slashing',
          range: itemSys.range?.value ? `${itemSys.range.value} ${itemSys.range.units || 'ft'}` : '5 ft'
        });
        inventory.push({
          id: `foundry-item-${it._id || idx}`,
          name: itName,
          quantity: Number(itemSys.quantity || 1),
          weight: Number(itemSys.weight || 2),
          equipped: Boolean(itemSys.equipped),
          itemType: 'Weapon',
          weaponStats: {
            damage: firstDmg[0] || '1d8',
            damageType: firstDmg[1] || 'slashing'
          }
        });
      } else if (itType === 'spell') {
        spells.push({
          id: `foundry-spell-${it._id || idx}`,
          name: itName,
          level: Number(itemSys.level || 0),
          school: itemSys.school || 'Evocation',
          castingTime: itemSys.activation?.type || '1 action',
          range: itemSys.range?.value ? `${itemSys.range.value} ${itemSys.range.units || 'ft'}` : 'Self',
          components: 'V, S',
          duration: itemSys.duration?.value ? `${itemSys.duration.value} ${itemSys.duration.units || ''}` : 'Instantaneous',
          description: (itemSys.description?.value || '').replace(/<[^>]+>/g, ''),
          prepared: Boolean(itemSys.preparation?.prepared ?? true)
        });
      } else if (itType === 'feat' || itType === 'feature' || itType === 'trait') {
        classFeatures.push({
          id: `foundry-feat-${it._id || idx}`,
          name: itName,
          source: itType.toUpperCase(),
          description: (itemSys.description?.value || '').replace(/<[^>]+>/g, '')
        });
      } else if (itType === 'equipment' || itType === 'loot' || itType === 'consumable') {
        inventory.push({
          id: `foundry-gear-${it._id || idx}`,
          name: itName,
          quantity: Number(itemSys.quantity || 1),
          weight: Number(itemSys.weight || 0.1),
          costGp: Number(itemSys.price?.value || 0),
          equipped: Boolean(itemSys.equipped),
          notes: (itemSys.description?.value || '').replace(/<[^>]+>/g, '')
        });
      } else if (itType === 'class') {
        characterClass = itName;
        if (itemSys.levels) level = Number(itemSys.levels);
      }
    });

    // Wealth currency
    const currency = sys.currency || {};
    const wealth = {
      cp: Number(currency.cp || 0),
      sp: Number(currency.sp || 0),
      ep: Number(currency.ep || 0),
      gp: Number(currency.gp || 0),
      pp: Number(currency.pp || 0)
    };

    // Saving throws
    const VALID_ABILITIES: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const savingThrowProficiencies: AbilityName[] = [];
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
      const a = abilitiesSys[ab];
      const upper = ab.toUpperCase() as AbilityName;
      if (a && (a.proficient === 1 || a.proficient === true || a.saveProficient) && VALID_ABILITIES.includes(upper)) {
        savingThrowProficiencies.push(upper);
      }
    });

    // Skills
    const skillsSys = (sys.skills || {}) as Record<string, any>;
    const skills: Skill[] = DEFAULT_SKILLS_LIST.map((def, idx) => {
      const shortKey = def.name.toLowerCase().slice(0, 3);
      const fSkill = skillsSys[shortKey] || skillsSys[def.name.toLowerCase()] || {};
      const profVal = fSkill.value ?? fSkill.proficient ?? 0;
      return {
        id: `skill-${idx}-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: def.name,
        ability: def.ability,
        proficient: profVal >= 1,
        expertise: profVal >= 2
      };
    });

    const uniqueId = 'foundry-' + (name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'char') + '-' + Date.now().toString(36);

    const character: CharacterData = createCleanCharacterData({
      id: uniqueId,
      name,
      edition,
      race,
      characterClass,
      subclass: isMonster ? 'Monster' : 'Archetype',
      level,
      background,
      alignment,
      experiencePoints: Number(details.xp?.value || 0),
      hpMax,
      hpCurrent,
      hpTemp,
      hitDiceCurrent: level,
      hitDiceTotal: `${level}d8`,
      armorClass,
      speed,
      initiativeBonus: 0,
      abilities: {
        STR: { score: str },
        DEX: { score: dex },
        CON: { score: con },
        INT: { score: int },
        WIS: { score: wis },
        CHA: { score: cha }
      },
      savingThrowProficiencies,
      skills,
      attacks,
      classFeatures,
      inventory,
      spells,
      conditions: [],
      isMonster,
      isSpellcaster: spells.length > 0,
      wealth
    });

    return character;
  }
}
