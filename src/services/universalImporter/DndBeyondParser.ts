import { CharacterData, Attack, ClassFeature, Spell, GearItem, RuleEdition, Skill } from '../../types';
import { ImportResult, createCleanCharacterData } from './types';
import { DEFAULT_SKILLS_LIST } from '../../utils/dndCalculations';

export class DndBeyondParser {
  public static isDndBeyondData(json: any): boolean {
    if (!json || typeof json !== 'object') return false;

    // D&D Beyond top-level wrapper or direct character object
    const char = json.character || json;

    if (char && char.name && Array.isArray(char.stats) && Array.isArray(char.classes)) {
      return true;
    }

    if (char && char.baseHitPoints !== undefined && char.decorations && char.preferences) {
      return true;
    }

    return false;
  }

  public static parse(raw: any, edition: RuleEdition = '5e'): ImportResult {
    const warnings: string[] = [];
    const charObj = raw.character || raw;

    try {
      const name = charObj.name || 'D&D Beyond Hero';

      // 1. Calculate Abilities (1=STR, 2=DEX, 3=CON, 4=INT, 5=WIS, 6=CHA)
      const statsMap: Record<number, number> = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };
      if (Array.isArray(charObj.stats)) {
        charObj.stats.forEach((s: any) => {
          if (s && s.id && s.value !== undefined) {
            statsMap[s.id] = Number(s.value);
          }
        });
      }

      // Add bonus stats or racial bonuses if present
      if (Array.isArray(charObj.bonusStats)) {
        charObj.bonusStats.forEach((s: any) => {
          if (s && s.id && s.value !== undefined) {
            statsMap[s.id] = (statsMap[s.id] || 10) + Number(s.value);
          }
        });
      }

      // Override stats if present
      if (Array.isArray(charObj.overrideStats)) {
        charObj.overrideStats.forEach((s: any) => {
          if (s && s.id && s.value !== null && s.value !== undefined) {
            statsMap[s.id] = Number(s.value);
          }
        });
      }

      const str = statsMap[1] || 10;
      const dex = statsMap[2] || 10;
      const con = statsMap[3] || 10;
      const int = statsMap[4] || 10;
      const wis = statsMap[5] || 10;
      const cha = statsMap[6] || 10;

      // 2. Classes and Level
      const classesArr = Array.isArray(charObj.classes) ? charObj.classes : [];
      let characterClass = 'Adventurer';
      let subclass = 'Standard';
      let totalLevel = 0;
      let hitDieStr = '1d8';

      if (classesArr.length > 0) {
        characterClass = classesArr[0].definition?.name || 'Fighter';
        subclass = classesArr[0].subclassDefinition?.name || 'Champion';
        hitDieStr = `1d${classesArr[0].definition?.hitDice || 8}`;
        totalLevel = classesArr.reduce((sum: number, c: any) => sum + Number(c.level || 1), 0);
      }
      if (totalLevel <= 0) totalLevel = 1;

      // 3. Race & Background & Alignment
      const race = charObj.race?.fullName || charObj.race?.baseName || 'Human';
      const background = charObj.background?.definition?.name || charObj.background?.customBackground?.name || 'Folk Hero';
      
      const alignmentIds: Record<number, string> = {
        1: 'Lawful Good', 2: 'Neutral Good', 3: 'Chaotic Good',
        4: 'Lawful Neutral', 5: 'True Neutral', 6: 'Chaotic Neutral',
        7: 'Lawful Evil', 8: 'Neutral Evil', 9: 'Chaotic Evil'
      };
      const alignment = alignmentIds[charObj.alignmentId] || 'Neutral';

      // 4. Hit Points
      const baseHp = Number(charObj.baseHitPoints || 10);
      const bonusHp = Number(charObj.bonusHitPoints || 0);
      const conMod = Math.floor((con - 10) / 2);
      const hpMax = baseHp + bonusHp + (conMod * totalLevel);
      const hpCurrent = Number(charObj.currentHitPoints ?? hpMax);
      const hpTemp = Number(charObj.temporaryHitPoints ?? 0);

      // 5. Speed
      const speed = Number(charObj.race?.weightSpeeds?.normal?.walk ?? 30);

      // 6. Inventory & Weapons
      const inventory: GearItem[] = [];
      const attacks: Attack[] = [];

      if (Array.isArray(charObj.inventory)) {
        charObj.inventory.forEach((inv: any, idx: number) => {
          const def = inv.definition || {};
          const itName = def.name || `Item ${idx + 1}`;
          const isEquipped = Boolean(inv.equipped);
          const isWeapon = def.filterType === 'Weapon' || def.attackType !== undefined;

          inventory.push({
            id: `dndb-inv-${inv.id || idx}`,
            name: itName,
            quantity: Number(inv.quantity || 1),
            weight: Number(def.weight || 0),
            equipped: isEquipped,
            costGp: Number(def.cost || 0),
            notes: (def.description || '').replace(/<[^>]+>/g, '')
          });

          if (isWeapon) {
            const diceStr = def.damage?.diceString || '1d6';
            const dmgType = def.damageType?.toLowerCase() || 'slashing';
            attacks.push({
              id: `dndb-atk-${inv.id || idx}`,
              name: itName,
              attackBonus: 0, // Will be computed dynamically by character engine
              damage: diceStr,
              damageType: dmgType,
              range: def.range ? `${def.range} ft` : '5 ft'
            });
          }
        });
      }

      // 7. Spells
      const spells: Spell[] = [];
      const spellsObj = charObj.spells || {};
      const allSpellsList: any[] = [
        ...(Array.isArray(spellsObj.class) ? spellsObj.class : []),
        ...(Array.isArray(spellsObj.race) ? spellsObj.race : []),
        ...(Array.isArray(spellsObj.feat) ? spellsObj.feat : []),
        ...(Array.isArray(spellsObj.item) ? spellsObj.item : [])
      ];

      allSpellsList.forEach((sp: any, idx: number) => {
        const def = sp.definition || {};
        if (def.name) {
          spells.push({
            id: `dndb-spell-${sp.id || idx}`,
            name: def.name,
            level: Number(def.level || 0),
            school: def.school || 'Evocation',
            castingTime: def.activation?.activationType === 1 ? '1 Action' : 'Bonus Action',
            range: def.range?.rangeValue ? `${def.range.rangeValue} ft` : 'Self',
            components: 'V, S',
            duration: def.duration?.durationInterval ? `${def.duration.durationInterval} rounds` : 'Instantaneous',
            description: (def.description || '').replace(/<[^>]+>/g, ''),
            prepared: Boolean(sp.prepared ?? true)
          });
        }
      });

      // 8. Currency
      const curr = charObj.currencies || {};
      const wealth = {
        cp: Number(curr.cp || 0),
        sp: Number(curr.sp || 0),
        ep: Number(curr.ep || 0),
        gp: Number(curr.gp || 0),
        pp: Number(curr.pp || 0)
      };

      // 9. Class Features
      const classFeatures: ClassFeature[] = [];
      if (Array.isArray(charObj.classes)) {
        charObj.classes.forEach((c: any) => {
          if (Array.isArray(c.classFeatures)) {
            c.classFeatures.forEach((cf: any, i: number) => {
              const def = cf.definition || {};
              if (def.name) {
                classFeatures.push({
                  id: `dndb-feat-${cf.id || i}`,
                  name: def.name,
                  source: c.definition?.name || 'Class',
                  description: (def.description || '').replace(/<[^>]+>/g, '')
                });
              }
            });
          }
        });
      }

      // Base AC Calculation (10 + DEX)
      const dexMod = Math.floor((dex - 10) / 2);
      const armorClass = 10 + dexMod;

      const uniqueId = 'dndb-' + (name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'char') + '-' + Date.now().toString(36);

      const skills: Skill[] = DEFAULT_SKILLS_LIST.map((def, idx) => ({
        id: `skill-${idx}-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: def.name,
        ability: def.ability,
        proficient: false,
        expertise: false
      }));

      const character: CharacterData = createCleanCharacterData({
        id: uniqueId,
        name,
        edition,
        race,
        characterClass,
        subclass,
        level: totalLevel,
        background,
        alignment,
        experiencePoints: Number(charObj.currentXp || 0),
        hpMax,
        hpCurrent,
        hpTemp,
        hitDiceCurrent: totalLevel,
        hitDiceTotal: `${totalLevel}${hitDieStr}`,
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
        inventory,
        spells,
        conditions: [],
        isMonster: false,
        isSpellcaster: spells.length > 0,
        wealth
      });

      return {
        success: true,
        characters: [character],
        detectedFormat: 'dndbeyond_character',
        warnings,
        metadata: {
          formatLabel: 'D&D Beyond Character JSON Schema',
          entityCount: 1,
          detectedFields: ['stats', 'classes', 'inventory', 'spells', 'currencies', 'background', 'race'],
          sourceVersion: 'D&D Beyond'
        }
      };
    } catch (err: any) {
      return {
        success: false,
        characters: [],
        detectedFormat: 'dndbeyond_character',
        warnings: [err?.message || 'Failed to parse D&D Beyond character'],
        metadata: {
          formatLabel: 'D&D Beyond Character JSON Schema',
          entityCount: 0,
          detectedFields: []
        },
        error: err?.message
      };
    }
  }
}
