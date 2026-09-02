import { CharacterData, RuleEdition } from '../../types';
import { ImportResult } from './types';

export class NexusJsonParser {
  public static isNexusData(json: any): boolean {
    if (!json || typeof json !== 'object') return false;

    // Single Nexus Character
    if (json.name && json.abilities && json.abilities.STR && json.hpMax !== undefined) {
      return true;
    }

    // Party / Multiple Nexus Characters Array
    if (Array.isArray(json) && json.length > 0 && json[0].name && json[0].abilities?.STR) {
      return true;
    }

    // Nexus Backup Container
    if (json.version && (json.characters || json.character)) {
      return true;
    }

    return false;
  }

  public static parse(raw: any, defaultEdition: RuleEdition = '5e'): ImportResult {
    const warnings: string[] = [];
    const characters: CharacterData[] = [];

    const rawList: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.characters)
      ? raw.characters
      : [raw.character || raw];

    for (const item of rawList) {
      if (item && item.name && item.abilities) {
        const validated: CharacterData = {
          ...item,
          id: item.id || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          edition: item.edition || defaultEdition,
          hpCurrent: item.hpCurrent !== undefined ? item.hpCurrent : item.hpMax || 10,
          hpMax: item.hpMax || 10,
          hpTemp: item.hpTemp || 0,
          armorClass: item.armorClass || 10,
          speed: item.speed || 30,
          attacks: Array.isArray(item.attacks) ? item.attacks : [],
          classFeatures: Array.isArray(item.classFeatures) ? item.classFeatures : [],
          inventory: Array.isArray(item.inventory) ? item.inventory : [],
          spells: Array.isArray(item.spells) ? item.spells : [],
          conditions: Array.isArray(item.conditions) ? item.conditions : [],
          wealth: item.wealth || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
        };
        characters.push(validated);
      } else {
        warnings.push(`Skipped invalid character entry: ${item?.name || 'Unknown'}`);
      }
    }

    return {
      success: characters.length > 0,
      characters,
      detectedFormat: characters.length > 1 ? 'nexus_party' : 'nexus_character',
      warnings,
      metadata: {
        formatLabel: 'Nexus Native TRPG Character Schema (v1.0+)',
        entityCount: characters.length,
        detectedFields: ['id', 'name', 'abilities', 'hpMax', 'armorClass', 'inventory', 'spells', 'classFeatures'],
        sourceVersion: 'Nexus TRPG v1.0'
      }
    };
  }
}
