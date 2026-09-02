import { CharacterData, Attack, ClassFeature, Spell, RuleEdition, AbilityName, Skill } from '../../types';
import { ImportResult, createCleanCharacterData } from './types';
import { DEFAULT_SKILLS_LIST } from '../../utils/dndCalculations';

// Helper to strip 5eTools formatting tags like {@atk mw}, {@damage 1d6 + 2}, {@h}
export function strip5eToolsTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{@atk\s+[^}]+\}/gi, '')
    .replace(/\{@hit\s+([^}]+)\}/gi, '+$1')
    .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
    .replace(/\{@dice\s+([^}]+)\}/gi, '$1')
    .replace(/\{@h\}/gi, 'Hit: ')
    .replace(/\{@spell\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@creature\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@item\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@condition\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@skill\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@sense\s+([^}|]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@b\s+([^}]+)\}/gi, '$1')
    .replace(/\{@i\s+([^}]+)\}/gi, '$1')
    .replace(/\{@d20\s+([^}]+)\}/gi, '$1')
    .replace(/\{@[a-z0-9]+\s+([^}]+)\}/gi, '$1');
}

export class FiveEToolsParser {
  public static is5eToolsData(json: any): boolean {
    if (!json || typeof json !== 'object') return false;
    
    // Creature / Monster object check
    if (json.name && (json.str !== undefined || json.dex !== undefined) && (json.ac !== undefined || json.hp !== undefined || json.cr !== undefined)) {
      return true;
    }

    // Bestiary file (array of monsters or { monster: [...] })
    if (Array.isArray(json.monster) && json.monster.length > 0 && json.monster[0].name && json.monster[0].str !== undefined) {
      return true;
    }

    // 5eTools Character Sheet format
    if (json.character && json.character.name && json.character.stats) {
      return true;
    }

    return false;
  }

  public static parse(raw: any, edition: RuleEdition = '5e'): ImportResult {
    const warnings: string[] = [];
    const characters: CharacterData[] = [];

    const rawList: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.monster)
      ? raw.monster
      : [raw];

    for (const item of rawList) {
      try {
        const char = this.convertSingleEntity(item, edition, warnings);
        if (char) {
          characters.push(char);
        }
      } catch (err: any) {
        warnings.push(`Failed to parse entity "${item?.name || 'Unknown'}": ${err?.message}`);
      }
    }

    return {
      success: characters.length > 0,
      characters,
      detectedFormat: '5etools_creature',
      warnings,
      metadata: {
        formatLabel: '5eTools Bestiary & Creature Schema',
        entityCount: characters.length,
        detectedFields: ['abilities', 'armorClass', 'hitPoints', 'actions', 'traits', 'speed', 'challengeRating'],
        sourceVersion: raw._meta?.sources?.[0]?.source || '5eTools JSON'
      }
    };
  }

  private static convertSingleEntity(entry: any, edition: RuleEdition, warnings: string[]): CharacterData {
    const name = entry.name || 'Unknown Creature';
    const isMonster = true;

    // Parse AC
    let armorClass = 10;
    if (typeof entry.ac === 'number') {
      armorClass = entry.ac;
    } else if (Array.isArray(entry.ac) && entry.ac.length > 0) {
      const firstAc = entry.ac[0];
      if (typeof firstAc === 'number') armorClass = firstAc;
      else if (typeof firstAc === 'object' && typeof firstAc.ac === 'number') armorClass = firstAc.ac;
    }

    // Parse HP
    let hpMax = 10;
    let hitDice = '1d8';
    if (typeof entry.hp === 'number') {
      hpMax = entry.hp;
    } else if (entry.hp && typeof entry.hp === 'object') {
      hpMax = entry.hp.average || 10;
      hitDice = entry.hp.formula || '1d8';
    }

    // Parse Speed
    let speed = 30;
    if (typeof entry.speed === 'number') {
      speed = entry.speed;
    } else if (entry.speed && typeof entry.speed === 'object') {
      if (typeof entry.speed.walk === 'number') speed = entry.speed.walk;
      else if (typeof entry.speed.walk === 'string') speed = parseInt(entry.speed.walk, 10) || 30;
    }

    // Parse Ability Scores
    const str = Number(entry.str) || 10;
    const dex = Number(entry.dex) || 10;
    const con = Number(entry.con) || 10;
    const int = Number(entry.int) || 10;
    const wis = Number(entry.wis) || 10;
    const cha = Number(entry.cha) || 10;

    // Parse Type & Race
    let raceType = 'Monstrosity';
    if (typeof entry.type === 'string') {
      raceType = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
    } else if (entry.type && typeof entry.type === 'object' && entry.type.type) {
      raceType = entry.type.type.charAt(0).toUpperCase() + entry.type.type.slice(1);
    }

    // Parse Alignment
    let alignment = 'Unaligned';
    if (Array.isArray(entry.alignment)) {
      const alignMap: Record<string, string> = {
        'L': 'Lawful', 'N': 'Neutral', 'C': 'Chaotic',
        'G': 'Good', 'E': 'Evil', 'U': 'Unaligned', 'A': 'Any'
      };
      alignment = entry.alignment.map((a: string) => alignMap[a] || a).join(' ');
    }

    // Parse CR & Level
    let crStr = '1';
    let level = 1;
    if (entry.cr !== undefined) {
      if (typeof entry.cr === 'string') crStr = entry.cr;
      else if (typeof entry.cr === 'number') crStr = String(entry.cr);
      else if (entry.cr && typeof entry.cr === 'object' && entry.cr.cr) crStr = String(entry.cr.cr);

      const parsedCr = parseFloat(crStr.includes('/') ? String(eval(crStr)) : crStr);
      level = Math.max(1, Math.min(20, Math.round(parsedCr) || 1));
    }

    // Parse Actions & Attacks
    const attacks: Attack[] = [];
    const classFeatures: ClassFeature[] = [];

    if (Array.isArray(entry.action)) {
      for (let i = 0; i < entry.action.length; i++) {
        const act = entry.action[i];
        const actName = act.name || `Action ${i + 1}`;
        const rawEntries = Array.isArray(act.entries) ? act.entries.join(' ') : String(act.entries || '');
        const cleanDesc = strip5eToolsTags(rawEntries);

        // Attempt attack detection
        const hitMatch = cleanDesc.match(/\+([0-9]+)\s+to\s+hit/i);
        const dmgMatch = cleanDesc.match(/([0-9]+d[0-9]+(?:\s*[\+\-]\s*[0-9]+)?)\s*([a-zA-Z]+)?\s*damage/i);
        const rangeMatch = cleanDesc.match(/(reach\s+[0-9]+\s*ft|range\s+[0-9]+(?:\/[0-9]+)?\s*ft)/i);

        if (hitMatch || dmgMatch) {
          attacks.push({
            id: `5e-atk-${Date.now()}-${i}`,
            name: actName,
            attackBonus: hitMatch ? parseInt(hitMatch[1], 10) : 0,
            damage: dmgMatch ? dmgMatch[1] : '1d6',
            damageType: dmgMatch && dmgMatch[2] ? dmgMatch[2].toLowerCase() : 'slashing',
            range: rangeMatch ? rangeMatch[1] : '5 ft'
          });
        }

        classFeatures.push({
          id: `5e-feat-${Date.now()}-${i}`,
          name: actName,
          source: 'Monster Action',
          description: cleanDesc
        });
      }
    }

    // Parse Traits
    if (Array.isArray(entry.trait)) {
      for (let i = 0; i < entry.trait.length; i++) {
        const tr = entry.trait[i];
        const rawEntries = Array.isArray(tr.entries) ? tr.entries.join(' ') : String(tr.entries || '');
        classFeatures.push({
          id: `5e-trait-${Date.now()}-${i}`,
          name: tr.name || `Trait ${i + 1}`,
          source: 'Special Trait',
          description: strip5eToolsTags(rawEntries)
        });
      }
    }

    // Spellcasting extraction if present
    const spells: Spell[] = [];
    if (Array.isArray(entry.spellcasting)) {
      for (const sc of entry.spellcasting) {
        if (sc.spells) {
          for (const [levelKey, spellGroup] of Object.entries(sc.spells)) {
            const spellList = (spellGroup as any)?.spells || [];
            const spellLevel = parseInt(levelKey, 10) || 0;
            for (const spStr of spellList) {
              const cleanSpellName = strip5eToolsTags(String(spStr));
              spells.push({
                id: `5e-sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: cleanSpellName,
                level: spellLevel,
                school: 'Evocation',
                castingTime: '1 action',
                range: '60 feet',
                components: 'V, S',
                duration: 'Instantaneous',
                description: `Imported from 5eTools ${entry.name} spellcasting block.`,
                prepared: true
              });
            }
          }
        }
      }
    }

    // Saving throws
    const VALID_ABILITIES: AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const savingThrows: AbilityName[] = [];
    if (entry.save) {
      for (const k of Object.keys(entry.save)) {
        const upper = k.toUpperCase() as AbilityName;
        if (VALID_ABILITIES.includes(upper)) {
          savingThrows.push(upper);
        }
      }
    }

    // Skills
    const skills: Skill[] = DEFAULT_SKILLS_LIST.map((def, idx) => {
      const skillKey = def.name.toLowerCase().replace(/[\s-]/g, '');
      let proficient = false;
      let expertise = false;
      if (entry.skill) {
        for (const [sName, sVal] of Object.entries(entry.skill)) {
          const cleanKey = sName.toLowerCase().replace(/[\s-]/g, '');
          if (cleanKey === skillKey || def.name.toLowerCase().includes(sName.toLowerCase())) {
            proficient = true;
            // If value has high bonus or explicit string indication
            if (typeof sVal === 'string' && sVal.includes('*')) {
              expertise = true;
            }
            break;
          }
        }
      }
      return {
        id: `skill-${idx}-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: def.name,
        ability: def.ability,
        proficient,
        expertise
      };
    });

    const uniqueId = '5etools-' + (entry.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'entity') + '-' + Date.now().toString(36);

    const character: CharacterData = createCleanCharacterData({
      id: uniqueId,
      name,
      edition,
      race: raceType,
      characterClass: isMonster ? `${raceType} (CR ${crStr})` : 'Adventurer',
      subclass: isMonster ? 'Monster' : 'Standard',
      level,
      background: 'Monster Manual',
      alignment,
      experiencePoints: 0,
      hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDiceCurrent: level,
      hitDiceTotal: hitDice || `${level}d8`,
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
      savingThrowProficiencies: savingThrows,
      skills,
      attacks,
      classFeatures,
      inventory: [],
      spells,
      conditions: [],
      isMonster,
      isSpellcaster: spells.length > 0,
      wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
    });

    return character;
  }
}
