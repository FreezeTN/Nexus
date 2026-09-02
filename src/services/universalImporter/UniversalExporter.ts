import { CharacterData } from '../../types';
import { ExportFormat } from './types';
import { getAbilityModifier, formatModifier, getProficiencyBonus, getPassivePerception } from '../../utils/dndCalculations';

export class UniversalExporter {
  public static export(character: CharacterData, format: ExportFormat): { content: string; filename: string; mimeType: string } {
    const safeName = (character.name || 'character').toLowerCase().replace(/[^a-z0-9]/g, '_');

    switch (format) {
      case 'nexus_json':
        return {
          content: JSON.stringify(character, null, 2),
          filename: `${safeName}_nexus_sheet.json`,
          mimeType: 'application/json'
        };

      case 'foundry_vtt':
        return {
          content: JSON.stringify(this.toFoundryVtt(character), null, 2),
          filename: `fvtt-Actor-${safeName}.json`,
          mimeType: 'application/json'
        };

      case '5etools':
        return {
          content: JSON.stringify(this.to5eTools(character), null, 2),
          filename: `5etools-${safeName}.json`,
          mimeType: 'application/json'
        };

      case 'markdown':
        return {
          content: this.toMarkdown(character),
          filename: `${safeName}_statblock.md`,
          mimeType: 'text/markdown'
        };

      case 'plaintext':
      default:
        return {
          content: this.toPlainText(character),
          filename: `${safeName}_statblock.txt`,
          mimeType: 'text/plain'
        };
    }
  }

  public static exportParty(characters: CharacterData[]): { content: string; filename: string; mimeType: string } {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entityCount: characters.length,
      characters
    };
    return {
      content: JSON.stringify(payload, null, 2),
      filename: `nexus_party_backup_${Date.now()}.json`,
      mimeType: 'application/json'
    };
  }

  private static toFoundryVtt(char: CharacterData): any {
    const profBonus = getProficiencyBonus(char.level);
    const isNpc = Boolean(char.isMonster);

    return {
      name: char.name,
      type: isNpc ? 'npc' : 'character',
      system: {
        abilities: {
          str: { value: char.abilities.STR.score, proficient: char.savingThrowProficiencies?.includes('STR') ? 1 : 0 },
          dex: { value: char.abilities.DEX.score, proficient: char.savingThrowProficiencies?.includes('DEX') ? 1 : 0 },
          con: { value: char.abilities.CON.score, proficient: char.savingThrowProficiencies?.includes('CON') ? 1 : 0 },
          int: { value: char.abilities.INT.score, proficient: char.savingThrowProficiencies?.includes('INT') ? 1 : 0 },
          wis: { value: char.abilities.WIS.score, proficient: char.savingThrowProficiencies?.includes('WIS') ? 1 : 0 },
          cha: { value: char.abilities.CHA.score, proficient: char.savingThrowProficiencies?.includes('CHA') ? 1 : 0 }
        },
        attributes: {
          hp: {
            value: char.hpCurrent,
            max: char.hpMax,
            temp: char.hpTemp || 0
          },
          ac: {
            value: char.armorClass
          },
          movement: {
            walk: char.speed || 30
          }
        },
        details: {
          race: char.race,
          class: char.characterClass,
          level: char.level,
          alignment: char.alignment || 'Neutral',
          background: char.background || 'Custom'
        },
        currency: {
          cp: char.wealth?.cp || 0,
          sp: char.wealth?.sp || 0,
          ep: char.wealth?.ep || 0,
          gp: char.wealth?.gp || 0,
          pp: char.wealth?.pp || 0
        }
      },
      items: [
        ...(char.attacks || []).map((atk, idx) => ({
          _id: `atk-${idx}`,
          name: atk.name,
          type: 'weapon',
          system: {
            attackBonus: atk.attackBonus,
            damage: {
              parts: [[atk.damage, atk.damageType]]
            },
            range: {
              value: parseInt(atk.range || '5', 10) || 5,
              units: 'ft'
            }
          }
        })),
        ...(char.spells || []).map((sp, idx) => ({
          _id: `sp-${idx}`,
          name: sp.name,
          type: 'spell',
          system: {
            level: sp.level,
            school: sp.school,
            description: { value: sp.description }
          }
        })),
        ...(char.inventory || []).map((item, idx) => ({
          _id: `inv-${idx}`,
          name: item.name,
          type: item.itemType === 'Weapon' ? 'weapon' : 'equipment',
          system: {
            quantity: item.quantity || 1,
            weight: item.weight || 0,
            equipped: item.equipped || false
          }
        }))
      ],
      flags: {
        exportSource: {
          world: 'Nexus TRPG',
          system: 'dnd5e',
          coreVersion: '11.315'
        }
      }
    };
  }

  private static to5eTools(char: CharacterData): any {
    return {
      name: char.name,
      source: 'NexusTRPG',
      page: 1,
      size: ['M'],
      type: char.race.toLowerCase(),
      alignment: char.alignment ? char.alignment.split(' ').map(s => s[0].toUpperCase()) : ['N'],
      ac: [char.armorClass],
      hp: {
        average: char.hpMax,
        formula: char.hitDiceTotal || `${char.level}d8`
      },
      speed: {
        walk: char.speed || 30
      },
      str: char.abilities.STR.score,
      dex: char.abilities.DEX.score,
      con: char.abilities.CON.score,
      int: char.abilities.INT.score,
      wis: char.abilities.WIS.score,
      cha: char.abilities.CHA.score,
      save: (char.savingThrowProficiencies || []).reduce((acc: any, curr) => {
        acc[curr.toLowerCase()] = `+${getProficiencyBonus(char.level)}`;
        return acc;
      }, {}),
      action: (char.attacks || []).map(atk => ({
        name: atk.name,
        entries: [
          `{@atk mw} {@hit ${atk.attackBonus}} to hit, reach 5 ft., one target. {@h}({@damage ${atk.damage}}) ${atk.damageType} damage.`
        ]
      })),
      trait: (char.classFeatures || []).map(feat => ({
        name: feat.name,
        entries: [feat.description]
      }))
    };
  }

  private static toMarkdown(char: CharacterData): string {
    const profBonus = getProficiencyBonus(char.level);
    const passivePerception = getPassivePerception(char);

    return `
# ${char.name}
*${char.race} ${char.characterClass}, Level ${char.level}*

___
- **Armor Class:** ${char.armorClass}
- **Hit Points:** ${char.hpCurrent} / ${char.hpMax} (Temp: ${char.hpTemp || 0})
- **Speed:** ${char.speed} ft.
- **Proficiency Bonus:** +${profBonus} | **Passive Perception:** ${passivePerception}
- **Alignment:** ${char.alignment || 'Neutral'} | **Background:** ${char.background || 'Custom'}

___
| STR | DEX | CON | INT | WIS | CHA |
|:---:|:---:|:---:|:---:|:---:|:---:|
| ${char.abilities.STR.score} (${formatModifier(getAbilityModifier(char.abilities.STR.score))}) | ${char.abilities.DEX.score} (${formatModifier(getAbilityModifier(char.abilities.DEX.score))}) | ${char.abilities.CON.score} (${formatModifier(getAbilityModifier(char.abilities.CON.score))}) | ${char.abilities.INT.score} (${formatModifier(getAbilityModifier(char.abilities.INT.score))}) | ${char.abilities.WIS.score} (${formatModifier(getAbilityModifier(char.abilities.WIS.score))}) | ${char.abilities.CHA.score} (${formatModifier(getAbilityModifier(char.abilities.CHA.score))}) |

___
### Actions & Attacks
${(char.attacks || []).map(a => `- **${a.name}.** *Attack:* +${a.attackBonus} to hit, range ${a.range}. *Hit:* ${a.damage} ${a.damageType} damage.`).join('\n')}

### Features & Traits
${(char.classFeatures || []).map(f => `- **${f.name}** (${f.source}): ${f.description}`).join('\n')}

### Inventory & Coinage
- **Coinage:** CP: ${char.wealth?.cp || 0}, SP: ${char.wealth?.sp || 0}, EP: ${char.wealth?.ep || 0}, GP: ${char.wealth?.gp || 0}, PP: ${char.wealth?.pp || 0}
- **Gear:** ${(char.inventory || []).map(i => `${i.name} (x${i.quantity || 1})`).join(', ') || 'None'}
`.trim();
  }

  private static toPlainText(char: CharacterData): string {
    const profBonus = getProficiencyBonus(char.level);
    return `
${char.name.toUpperCase()}
Level ${char.level} ${char.race} ${char.characterClass}
Alignment: ${char.alignment || 'Neutral'} | Background: ${char.background || 'Custom'}
--------------------------------------------------
Armor Class: ${char.armorClass}
Hit Points: ${char.hpCurrent} / ${char.hpMax} (HD: ${char.hitDiceTotal || `${char.level}d8`})
Speed: ${char.speed} ft.
Proficiency Bonus: +${profBonus}
--------------------------------------------------
STR: ${char.abilities.STR.score} (${formatModifier(getAbilityModifier(char.abilities.STR.score))})
DEX: ${char.abilities.DEX.score} (${formatModifier(getAbilityModifier(char.abilities.DEX.score))})
CON: ${char.abilities.CON.score} (${formatModifier(getAbilityModifier(char.abilities.CON.score))})
INT: ${char.abilities.INT.score} (${formatModifier(getAbilityModifier(char.abilities.INT.score))})
WIS: ${char.abilities.WIS.score} (${formatModifier(getAbilityModifier(char.abilities.WIS.score))})
CHA: ${char.abilities.CHA.score} (${formatModifier(getAbilityModifier(char.abilities.CHA.score))})
--------------------------------------------------
ACTIONS:
${(char.attacks || []).map(a => `* ${a.name}: +${a.attackBonus} to hit, ${a.damage} ${a.damageType} (${a.range})`).join('\n') || 'None'}

FEATURES:
${(char.classFeatures || []).map(f => `* ${f.name} [${f.source}]: ${f.description}`).join('\n') || 'None'}

EQUIPMENT:
${(char.inventory || []).map(i => `* ${i.name} (x${i.quantity || 1})`).join('\n') || 'None'}
`.trim();
  }
}
