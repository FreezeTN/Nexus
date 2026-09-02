import { CharacterData, RuleEdition } from '../../types';
import { ImportFormat, DetectionResult, ImportResult } from './types';
import { FiveEToolsParser } from './FiveEToolsParser';
import { FoundryVttParser } from './FoundryVttParser';
import { DndBeyondParser } from './DndBeyondParser';
import { MarkdownStatblockParser } from './MarkdownStatblockParser';
import { NexusJsonParser } from './NexusJsonParser';

export class UniversalImporter {
  /**
   * Intelligently detects the data format and returns confidence and preview metadata.
   */
  public static detect(input: string | object): DetectionResult {
    let json: any = null;
    let isJson = false;

    if (typeof input === 'object' && input !== null) {
      json = input;
      isJson = true;
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          json = JSON.parse(trimmed);
          isJson = true;
        } catch {
          isJson = false;
        }
      }
    }

    // 1. Check Native Nexus Format
    if (isJson && NexusJsonParser.isNexusData(json)) {
      const isArray = Array.isArray(json) || (json.characters && Array.isArray(json.characters));
      const first = Array.isArray(json) ? json[0] : (json.characters?.[0] || json);
      return {
        format: isArray ? 'nexus_party' : 'nexus_character',
        confidence: 0.99,
        label: isArray ? 'Nexus Party Backup (.json)' : 'Nexus TRPG Native Character (.json)',
        summary: {
          name: first.name,
          entityType: first.isMonster ? 'monster' : 'character',
          levelOrCr: first.level,
          raceClass: `${first.race || ''} ${first.characterClass || ''}`.trim(),
          abilityPreview: {
            STR: first.abilities?.STR?.score ?? 10,
            DEX: first.abilities?.DEX?.score ?? 10,
            CON: first.abilities?.CON?.score ?? 10,
            INT: first.abilities?.INT?.score ?? 10,
            WIS: first.abilities?.WIS?.score ?? 10,
            CHA: first.abilities?.CHA?.score ?? 10
          }
        }
      };
    }

    // 2. Check Foundry VTT Actor JSON
    if (isJson && FoundryVttParser.isFoundryData(json)) {
      const sys = json.system || json.data || {};
      const abilities = sys.abilities || {};
      return {
        format: 'foundry_vtt_actor',
        confidence: 0.95,
        label: 'Foundry VTT Actor Document (.json)',
        summary: {
          name: json.name,
          entityType: json.type === 'character' ? 'character' : 'monster',
          levelOrCr: sys.details?.level || sys.details?.cr || 1,
          raceClass: `${sys.details?.race || ''} ${sys.details?.class || ''}`.trim(),
          abilityPreview: {
            STR: abilities.str?.value ?? 10,
            DEX: abilities.dex?.value ?? 10,
            CON: abilities.con?.value ?? 10,
            INT: abilities.int?.value ?? 10,
            WIS: abilities.wis?.value ?? 10,
            CHA: abilities.cha?.value ?? 10
          }
        }
      };
    }

    // 3. Check 5eTools Creature / Bestiary / Character
    if (isJson && FiveEToolsParser.is5eToolsData(json)) {
      const item = Array.isArray(json.monster) ? json.monster[0] : (Array.isArray(json) ? json[0] : json);
      return {
        format: '5etools_creature',
        confidence: 0.94,
        label: '5eTools Bestiary & Creature Schema (.json)',
        summary: {
          name: item.name,
          entityType: 'monster',
          levelOrCr: item.cr || '1',
          raceClass: `${typeof item.type === 'string' ? item.type : item.type?.type || 'Monster'}`,
          abilityPreview: {
            STR: item.str ?? 10,
            DEX: item.dex ?? 10,
            CON: item.con ?? 10,
            INT: item.int ?? 10,
            WIS: item.wis ?? 10,
            CHA: item.cha ?? 10
          }
        }
      };
    }

    // 4. Check D&D Beyond Character JSON
    if (isJson && DndBeyondParser.isDndBeyondData(json)) {
      const char = json.character || json;
      return {
        format: 'dndbeyond_character',
        confidence: 0.96,
        label: 'D&D Beyond Character JSON Export',
        summary: {
          name: char.name,
          entityType: 'character',
          levelOrCr: char.classes?.[0]?.level || 1,
          raceClass: `${char.race?.fullName || ''} ${char.classes?.[0]?.definition?.name || ''}`.trim(),
          abilityPreview: {
            STR: char.stats?.[0]?.value ?? 10,
            DEX: char.stats?.[1]?.value ?? 10,
            CON: char.stats?.[2]?.value ?? 10,
            INT: char.stats?.[3]?.value ?? 10,
            WIS: char.stats?.[4]?.value ?? 10,
            CHA: char.stats?.[5]?.value ?? 10
          }
        }
      };
    }

    // 5. Check Markdown or Plain Text Statblock
    if (typeof input === 'string' && MarkdownStatblockParser.isMarkdownOrTextStatblock(input)) {
      return {
        format: 'markdown_statblock',
        confidence: 0.88,
        label: 'Markdown / Plaintext Statblock (.md / .txt)',
        sourcePreview: input.slice(0, 120) + '...'
      };
    }

    return {
      format: 'auto',
      confidence: 0,
      label: 'Unrecognized / Generic Text',
      sourcePreview: typeof input === 'string' ? input.slice(0, 100) : JSON.stringify(input).slice(0, 100)
    };
  }

  /**
   * Universal Parse method that routes input to the best-matching parser or chosen format override.
   */
  public static parse(input: string | object, formatHint: ImportFormat = 'auto', edition: RuleEdition = '5e'): ImportResult {
    let json: any = null;
    let isJson = false;

    if (typeof input === 'object' && input !== null) {
      json = input;
      isJson = true;
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          json = JSON.parse(trimmed);
          isJson = true;
        } catch {
          isJson = false;
        }
      }
    }

    // Determine target format
    let targetFormat = formatHint;
    if (targetFormat === 'auto') {
      const detection = this.detect(input);
      targetFormat = detection.format;
    }

    switch (targetFormat) {
      case 'nexus_character':
      case 'nexus_party':
        if (isJson) return NexusJsonParser.parse(json, edition);
        break;

      case '5etools_creature':
      case '5etools_character':
        if (isJson) return FiveEToolsParser.parse(json, edition);
        break;

      case 'foundry_vtt_actor':
        if (isJson) return FoundryVttParser.parse(json, edition);
        break;

      case 'dndbeyond_character':
        if (isJson) return DndBeyondParser.parse(json, edition);
        break;

      case 'markdown_statblock':
      case 'plaintext_statblock':
        return MarkdownStatblockParser.parse(typeof input === 'string' ? input : JSON.stringify(input, null, 2), edition);

      default:
        // Fallback: try markdown / text parser if raw string
        if (typeof input === 'string') {
          return MarkdownStatblockParser.parse(input, edition);
        }
        if (isJson) {
          if (NexusJsonParser.isNexusData(json)) return NexusJsonParser.parse(json, edition);
          if (FoundryVttParser.isFoundryData(json)) return FoundryVttParser.parse(json, edition);
          if (FiveEToolsParser.is5eToolsData(json)) return FiveEToolsParser.parse(json, edition);
          if (DndBeyondParser.isDndBeyondData(json)) return DndBeyondParser.parse(json, edition);
        }
        break;
    }

    return {
      success: false,
      characters: [],
      detectedFormat: 'auto',
      warnings: ['Unable to parse content into character data. Please verify the JSON structure or statblock syntax.'],
      metadata: {
        formatLabel: 'Unknown Format',
        entityCount: 0,
        detectedFields: []
      },
      error: 'Unrecognized format'
    };
  }
}
