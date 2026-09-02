import { CharacterData, Attack, ClassFeature, RuleEdition, Skill } from '../../types';
import { ImportResult, createCleanCharacterData } from './types';
import { DEFAULT_SKILLS_LIST } from '../../utils/dndCalculations';

export class MarkdownStatblockParser {
  public static isMarkdownOrTextStatblock(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();

    // Check key markers of statblocks
    const hasAc = lower.includes('armor class') || lower.includes('**ac**') || lower.includes('ac:');
    const hasHp = lower.includes('hit points') || lower.includes('**hp**') || lower.includes('hp:');
    const hasAbilities = (lower.includes('str') && lower.includes('dex') && lower.includes('con'));

    return (hasAc && hasHp) || (hasHp && hasAbilities) || (hasAc && hasAbilities);
  }

  public static parse(text: string, edition: RuleEdition = '5e'): ImportResult {
    const warnings: string[] = [];

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      // 1. Extract Name (First heading or first non-empty line)
      let name = 'Imported Statblock Entity';
      for (const line of lines) {
        if (line.startsWith('# ')) {
          name = line.replace(/^#+\s*/, '').trim();
          break;
        } else if (line.startsWith('**') && line.endsWith('**') && !line.includes(':')) {
          name = line.replace(/\*\*/g, '').trim();
          break;
        }
      }
      if (name === 'Imported Statblock Entity' && lines.length > 0) {
        const firstLine = lines[0].replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
        if (firstLine.length > 0 && firstLine.length < 50) {
          name = firstLine;
        }
      }

      // 2. Extract Race / Type / Alignment
      let race = 'Humanoid';
      let alignment = 'Neutral';
      const typeLine = lines.find(l => /^\*[a-zA-Z\s,()]+\*$/.test(l) || /^(small|medium|large|huge|gargantuan|tiny)\s+/i.test(l));
      if (typeLine) {
        const cleanType = typeLine.replace(/\*/g, '').trim();
        const parts = cleanType.split(',');
        race = parts[0]?.trim() || 'Humanoid';
        if (parts[1]) alignment = parts[1].trim();
      }

      // 3. Extract Armor Class
      let armorClass = 10;
      const acMatch = text.match(/(?:armor class|\*\*ac\*\*|ac:)\s*[:\*]*\s*([0-9]+)/i);
      if (acMatch) {
        armorClass = parseInt(acMatch[1], 10);
      }

      // 4. Extract Hit Points & Formula
      let hpMax = 10;
      let hitDice = '1d8';
      const hpMatch = text.match(/(?:hit points|\*\*hp\*\*|hp:)\s*[:\*]*\s*([0-9]+)(?:\s*\(([^)]+)\))?/i);
      if (hpMatch) {
        hpMax = parseInt(hpMatch[1], 10);
        if (hpMatch[2]) {
          hitDice = hpMatch[2].trim();
        }
      }

      // 5. Extract Speed
      let speed = 30;
      const speedMatch = text.match(/speed\s*[:\*]*\s*([0-9]+)\s*ft/i);
      if (speedMatch) {
        speed = parseInt(speedMatch[1], 10);
      }

      // 6. Extract Ability Scores
      const parseAbility = (label: string): number => {
        // Matches table row e.g. "| 14 (+2) |" or standard "STR 14 (+2)" or "STR: 14"
        const regex1 = new RegExp(`${label}[^0-9]*([0-9]+)`, 'i');
        const m1 = text.match(regex1);
        if (m1) return parseInt(m1[1], 10);
        return 10;
      };

      const str = parseAbility('STR');
      const dex = parseAbility('DEX');
      const con = parseAbility('CON');
      const int = parseAbility('INT');
      const wis = parseAbility('WIS');
      const cha = parseAbility('CHA');

      // 7. Extract Challenge Rating / Level
      let cr = '1';
      let level = 1;
      const crMatch = text.match(/challenge(?:\s*rating)?\s*[:\*]*\s*([0-9\/]+)/i);
      if (crMatch) {
        cr = crMatch[1];
        const evaluatedCr = cr.includes('/') ? parseFloat(String(eval(cr))) : parseFloat(cr);
        level = Math.max(1, Math.min(20, Math.round(evaluatedCr) || 1));
      }

      // 8. Extract Actions and Attacks
      const attacks: Attack[] = [];
      const classFeatures: ClassFeature[] = [];

      // Regex to search for action blocks: e.g. **Action Name.** Description
      const actionRegex = /\*\*([a-zA-Z0-9\s'-]+)\.\*\*\s*([^\n\r*]+)/g;
      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = actionRegex.exec(text)) !== null) {
        count++;
        const actName = match[1].trim();
        const actDesc = match[2].trim();

        // Skip standard stat block fields if matched as bold
        const ignoreList = ['armor class', 'hit points', 'speed', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'saving throws', 'skills', 'senses', 'languages', 'challenge'];
        if (ignoreList.includes(actName.toLowerCase())) {
          continue;
        }

        const hitM = actDesc.match(/\+([0-9]+)\s+to\s+hit/i);
        const dmgM = actDesc.match(/([0-9]+d[0-9]+(?:\s*[\+\-]\s*[0-9]+)?)\s*([a-zA-Z]+)?\s*damage/i);
        const rangeM = actDesc.match(/(reach\s+[0-9]+\s*ft|range\s+[0-9]+(?:\/[0-9]+)?\s*ft)/i);

        if (hitM || dmgM) {
          attacks.push({
            id: `md-atk-${Date.now()}-${count}`,
            name: actName,
            attackBonus: hitM ? parseInt(hitM[1], 10) : 0,
            damage: dmgM ? dmgM[1] : '1d6',
            damageType: dmgM && dmgM[2] ? dmgM[2].toLowerCase() : 'slashing',
            range: rangeM ? rangeM[1] : '5 ft'
          });
        }

        classFeatures.push({
          id: `md-feat-${Date.now()}-${count}`,
          name: actName,
          source: 'Statblock Feature',
          description: actDesc
        });
      }

      const isMonster = text.toLowerCase().includes('challenge') || text.toLowerCase().includes('monster') || text.toLowerCase().includes('creature');
      const uniqueId = 'md-' + (name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'statblock') + '-' + Date.now().toString(36);

      // Skills parsing
      const skillMatch = text.match(/(?:skills|skills:)\s*([^\n\r]+)/i);
      const skillStr = skillMatch ? skillMatch[1].toLowerCase() : '';
      const skills: Skill[] = DEFAULT_SKILLS_LIST.map((def, idx) => {
        const hasSkill = skillStr.includes(def.name.toLowerCase());
        return {
          id: `skill-${idx}-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: def.name,
          ability: def.ability,
          proficient: hasSkill,
          expertise: false
        };
      });

      const character: CharacterData = createCleanCharacterData({
        id: uniqueId,
        name,
        edition,
        race,
        characterClass: isMonster ? `${race} (CR ${cr})` : 'Adventurer',
        subclass: isMonster ? 'Monster' : 'Custom',
        level,
        background: 'Statblock Import',
        alignment,
        experiencePoints: 0,
        hpMax,
        hpCurrent: hpMax,
        hpTemp: 0,
        hitDiceCurrent: level,
        hitDiceTotal: hitDice,
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
        savingThrowProficiencies: [],
        skills,
        attacks,
        classFeatures,
        inventory: [],
        spells: [],
        conditions: [],
        isMonster,
        isSpellcaster: false,
        wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
      });

      return {
        success: true,
        characters: [character],
        detectedFormat: 'markdown_statblock',
        warnings,
        metadata: {
          formatLabel: 'Markdown & Plaintext Statblock Parser',
          entityCount: 1,
          detectedFields: ['name', 'armorClass', 'hitPoints', 'speed', 'abilities', 'actions']
        }
      };
    } catch (err: any) {
      return {
        success: false,
        characters: [],
        detectedFormat: 'markdown_statblock',
        warnings: [err?.message || 'Failed to parse text statblock'],
        metadata: {
          formatLabel: 'Markdown & Plaintext Statblock Parser',
          entityCount: 0,
          detectedFields: []
        },
        error: err?.message
      };
    }
  }
}
