import React, { useState } from 'react';
import { CharacterData, ClassFeature, RuleEdition, Skill } from '../../types';
import { DEFAULT_SKILLS_LIST, DEFAULT_35E_SKILLS_LIST } from '../../utils/dndCalculations';
import { UserPlus, Sparkles, X, Store, Layers, Skull, Dices, Shuffle, Settings, Zap, Crosshair, Scale, Swords, Dna } from 'lucide-react';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';
import { PARENT_RACE_CATALOG, getHybridName, buildHybridFeature, CLASSIC_SRD_HALF_BREEDS, getClassicSRDHalfBreedsForEdition, buildClassicSRDFeature, ClassicSRDHalfBreed, DRAGON_VARIETIES_35E, DRAGON_VARIETIES_5E } from '../../data/halfBreedData';
import { syncClassFeaturesForCharacter } from '../../data/srdRulesLibrary';
import {
  RACE_OPTIONS_BY_SYSTEM,
  CLASS_OPTIONS_BY_SYSTEM,
  SUBCLASS_MAP_BY_SYSTEM,
  getRacesForSystem,
  getClassesForSystem,
  getSubclassesForSystemClass,
  ALIGNMENT_OPTIONS,
  ALIGNMENT_OPTIONS_BY_SYSTEM,
  getAlignmentsForSystem,
  getBackgroundsForSystem,
  getHeroNamesForSystem,
  getNamePlaceholderForSystem,
  HERO_NAMES,
  MONSTER_NAMES,
  BACKGROUND_OPTIONS
} from './newCharacter/newCharacterData';
import { systemRegistry } from '../../systems';

interface NewCharacterModalProps {
  onClose: () => void;
  onCreate: (newChar: CharacterData) => void;
  initialEdition?: RuleEdition;
  initialIsMonster?: boolean;
  initialIsVendor?: boolean;
  enabledSystems?: RuleEdition[];
}

export const NewCharacterModal: React.FC<NewCharacterModalProps> = ({
  onClose,
  onCreate,
  initialEdition = '5e',
  initialIsMonster = false,
  initialIsVendor = false,
  enabledSystems
}) => {
  const edition: RuleEdition = (enabledSystems && enabledSystems.length > 0 && !enabledSystems.includes(initialEdition))
    ? enabledSystems[0]
    : initialEdition;

  const initialRaces = getRacesForSystem(edition);
  const initialClasses = getClassesForSystem(edition);
  const initialClass = initialClasses[0] || 'Fighter';
  const initialSubclasses = getSubclassesForSystemClass(edition, initialClass);
  const initialBackgrounds = getBackgroundsForSystem(edition);
  const initialAlignments = getAlignmentsForSystem(edition);

  const initialSrdList = getClassicSRDHalfBreedsForEdition(edition);
  const initialSrdId = initialSrdList.length > 0 ? initialSrdList[0].id : 'srd-5e-half-elf';

  const [name, setName] = useState('');
  const [race, setRace] = useState(initialRaces[0] || 'Human');
  const [characterClass, setCharacterClass] = useState(initialClass);
  const [subclass, setSubclass] = useState(initialSubclasses[0] || 'General');
  const [level, setLevel] = useState<number>(1);
  const [background, setBackground] = useState(initialBackgrounds[0] || 'Folk Hero');
  const [alignment, setAlignment] = useState(initialAlignments[0] || 'Neutral Good');
  const [isVendor, setIsVendor] = useState(initialIsVendor);
  const [vendorMargin, setVendorMargin] = useState<number>(120);
  const [isMonster, setIsMonster] = useState(initialIsMonster);
  const [monsterXpReward, setMonsterXpReward] = useState<number>(450);

  // Optional Rules & Calculation Toggles
  const [useVariantEncumbrance, setUseVariantEncumbrance] = useState(false);
  const [useFlankingRules, setUseFlankingRules] = useState(false);
  const [useMulticlassing, setUseMulticlassing] = useState(false);
  const [secondaryClass, setSecondaryClass] = useState('Rogue');
  const [secondaryLevel, setSecondaryLevel] = useState<number>(1);
  const [secondarySubclass, setSecondarySubclass] = useState('Thief');
  const [useGrittyRealismResting, setUseGrittyRealismResting] = useState(false);
  const [useVariantCritDamage, setUseVariantCritDamage] = useState(false);
  const [useMilestoneXp, setUseMilestoneXp] = useState(false);
  const [disableAutoXpGain, setDisableAutoXpGain] = useState(false);
  const [useGestaltUA72, setUseGestaltUA72] = useState(false);
  const [useDefenseBonusUA109, setUseDefenseBonusUA109] = useState(false);
  const [useArmorAsDRUA109, setUseArmorAsDRUA109] = useState(false);

  // Shadowrun specific toggles
  const [strictEssenceCap, setStrictEssenceCap] = useState(true);
  const [glitchRules, setGlitchRules] = useState(true);
  const [directMatrixDamage, setDirectMatrixDamage] = useState(true);
  const [streetLevelMode, setStreetLevelMode] = useState(false);

  // Call of Cthulhu specific toggles
  const [majorWounds, setMajorWounds] = useState(true);
  const [boutsOfMadness, setBoutsOfMadness] = useState(true);
  const [pushedRolls, setPushedRolls] = useState(true);
  const [pulpCthulhuMode, setPulpCthulhuMode] = useState(false);

  // Half-Breed System State (The Alpine DM Rules & Classic SRD Half-Breeds)
  const [useHalfBreedSystem, setUseHalfBreedSystem] = useState(false);
  const [primaryParent, setPrimaryParent] = useState('Elf');
  const [secondaryParent, setSecondaryParent] = useState('Dwarf');
  const [customHybridName, setCustomHybridName] = useState('');

  const [useClassicSRDHalfBreed, setUseClassicSRDHalfBreed] = useState(false);
  const [selectedClassicSRDId, setSelectedClassicSRDId] = useState<string>(initialSrdId);
  const [dragonVariety, setDragonVariety] = useState<string>('Red');

  // Portrait URL & HP Calculation Mode
  const [portraitUrl, setPortraitUrl] = useState('');
  const [hpCalcMode, setHpCalcMode] = useState<'Average' | 'Rolled' | 'Max'>('Average');

  // Ability Scores (d20)
  const [str, setStr] = useState(15);
  const [dex, setDex] = useState(14);
  const [con, setCon] = useState(13);
  const [int, setInt] = useState(12);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(8);

  // Shadowrun 5e Attributes (Ratings 1-6+)
  const [bod, setBod] = useState(5);
  const [agi, setAgi] = useState(5);
  const [rea, setRea] = useState(4);
  const [strSR, setStrSR] = useState(4);
  const [wil, setWil] = useState(4);
  const [log, setLog] = useState(3);
  const [intSR, setIntSR] = useState(4);
  const [chaSR, setChaSR] = useState(3);
  const [edg, setEdg] = useState(3);
  const [ess, setEss] = useState(6.0);
  const [mag, setMag] = useState(0);
  const [res, setRes] = useState(0);

  // Call of Cthulhu 7e Characteristics (Percentile 1-99)
  const [strCoC, setStrCoC] = useState(50);
  const [conCoC, setConCoC] = useState(55);
  const [sizCoC, setSizCoC] = useState(60);
  const [dexCoC, setDexCoC] = useState(50);
  const [appCoC, setAppCoC] = useState(50);
  const [intCoC, setIntCoC] = useState(65);
  const [powCoC, setPowCoC] = useState(60);
  const [eduCoC, setEduCoC] = useState(70);
  const [sanCoC, setSanCoC] = useState(60);
  const [luckCoC, setLuckCoC] = useState(50);

  const getSystemTitle = (ed: RuleEdition): string => {
    switch (ed) {
      case '5e':
        return 'D&D 5e';
      case '3.5e':
        return 'D&D 3.5e';
      case 'pathfinder':
        return 'Pathfinder 2e';
      case 'shadowrun':
        return 'Shadowrun';
      case 'cthulhu':
        return 'Call of Cthulhu';
      default:
        return systemRegistry.getSystem(ed)?.shortName || systemRegistry.getSystem(ed)?.name || 'TRPG';
    }
  };

  // Handle class change & auto update subclass options for current system
  const handleClassChange = (newClass: string) => {
    setCharacterClass(newClass);
    const availableSubclasses = getSubclassesForSystemClass(edition, newClass);
    if (availableSubclasses.length > 0) {
      setSubclass(availableSubclasses[0]);
    }
  };

  // 4d6 Drop Lowest Random Stat generator
  const roll4d6DropLowest = (): number => {
    const rolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ].sort((a, b) => a - b);
    return rolls[1] + rolls[2] + rolls[3];
  };

  // Full Character / Monster Randomizer tailored to current system
  const handleRandomize = () => {
    const racesList = getRacesForSystem(edition);
    const classesList = getClassesForSystem(edition);
    const randClass = classesList[Math.floor(Math.random() * classesList.length)] || 'Fighter';
    const availableSubclasses = getSubclassesForSystemClass(edition, randClass);
    const randSubclass = availableSubclasses[Math.floor(Math.random() * availableSubclasses.length)] || 'General';
    const randRace = racesList[Math.floor(Math.random() * racesList.length)] || 'Human';
    const bgList = getBackgroundsForSystem(edition);
    const randBg = bgList[Math.floor(Math.random() * bgList.length)] || 'Street Runner';
    const alignList = getAlignmentsForSystem(edition);
    const randAlign = alignList[Math.floor(Math.random() * alignList.length)] || 'Professional';
    const randLvl = Math.floor(Math.random() * 10) + 1;
    const randHpMode = (['Average', 'Rolled', 'Max'] as const)[Math.floor(Math.random() * 3)];

    const namesList = isMonster ? MONSTER_NAMES : getHeroNamesForSystem(edition);
    const randName = namesList[Math.floor(Math.random() * namesList.length)] || 'Operative';
    const randMonsterXp = [100, 200, 450, 700, 1100, 1800, 2300, 3900, 5000, 7200][Math.floor(Math.random() * 10)];

    setName(randName);
    setRace(randRace);
    setCharacterClass(randClass);
    setSubclass(randSubclass);
    setLevel(randLvl);
    setBackground(randBg);
    setAlignment(randAlign);
    setHpCalcMode(randHpMode);
    setMonsterXpReward(randMonsterXp);

    if (edition === 'shadowrun') {
      setBod(3 + Math.floor(Math.random() * 4));
      setAgi(3 + Math.floor(Math.random() * 4));
      setRea(2 + Math.floor(Math.random() * 4));
      setStrSR(3 + Math.floor(Math.random() * 4));
      setWil(3 + Math.floor(Math.random() * 4));
      setLog(2 + Math.floor(Math.random() * 4));
      setIntSR(3 + Math.floor(Math.random() * 4));
      setChaSR(2 + Math.floor(Math.random() * 4));
      setEdg(2 + Math.floor(Math.random() * 3));
    } else if (edition === 'cthulhu') {
      const rollCoC = () => (Math.floor(Math.random() * 8) + 8) * 5;
      const s = rollCoC();
      const c = rollCoC();
      const sz = (Math.floor(Math.random() * 7) + 9) * 5;
      const d = rollCoC();
      const a = rollCoC();
      const i = (Math.floor(Math.random() * 8) + 10) * 5;
      const p = rollCoC();
      const ed = (Math.floor(Math.random() * 8) + 10) * 5;
      setStrCoC(s);
      setConCoC(c);
      setSizCoC(sz);
      setDexCoC(d);
      setAppCoC(a);
      setIntCoC(i);
      setPowCoC(p);
      setEduCoC(ed);
      setSanCoC(p);
      setLuckCoC((Math.floor(Math.random() * 9) + 7) * 5);
    } else {
      setStr(roll4d6DropLowest());
      setDex(roll4d6DropLowest());
      setCon(roll4d6DropLowest());
      setInt(roll4d6DropLowest());
      setWis(roll4d6DropLowest());
      setCha(roll4d6DropLowest());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Hit points calculation based on system and HP mode
    let hpMax = 10;
    let hitDieValue = 8;
    let conMod = 0;

    if (edition === 'shadowrun') {
      hpMax = 8 + Math.ceil(bod / 2);
    } else if (edition === 'cthulhu') {
      hpMax = pulpCthulhuMode ? Math.floor((conCoC + sizCoC) / 5) : Math.floor((conCoC + sizCoC) / 10);
    } else {
      conMod = Math.floor((con - 10) / 2);
      hitDieValue = characterClass === 'Barbarian' ? 12 : ['Fighter', 'Paladin', 'Ranger'].includes(characterClass) ? 10 : ['Sorcerer', 'Wizard'].includes(characterClass) ? 6 : 8;
      if (hpCalcMode === 'Max') {
        hpMax = Math.max(1, level * (hitDieValue + conMod));
      } else if (hpCalcMode === 'Rolled') {
        const baseHp = hitDieValue + conMod;
        const additionalHp = (level - 1) * (Math.floor(hitDieValue * 0.6) + conMod);
        hpMax = Math.max(1, baseHp + additionalHp);
      } else {
        const baseHp = hitDieValue + conMod;
        const additionalHp = (level - 1) * (Math.floor(hitDieValue / 2) + 1 + conMod);
        hpMax = Math.max(1, baseHp + additionalHp);
      }
    }

    const isCaster = ['Wizard', 'Sorcerer', 'Cleric', 'Druid', 'Bard', 'Warlock', 'Paladin', 'Ranger', 'Shaman', 'Mage', 'Occultist'].includes(characterClass);

    const primaryData = PARENT_RACE_CATALOG.find(p => p.name === primaryParent) || PARENT_RACE_CATALOG[0];
    const secondaryData = PARENT_RACE_CATALOG.find(s => s.name === secondaryParent) || PARENT_RACE_CATALOG[1];

    const availableSRDHalfBreeds = getClassicSRDHalfBreedsForEdition(edition);
    const selectedSRD = availableSRDHalfBreeds.find(hb => hb.id === selectedClassicSRDId) || availableSRDHalfBreeds[0];

    let finalRaceName = race;
    let hybridFeature: ClassFeature | null = null;
    let charSpeed = 30;

    if (edition === '5e' || edition === '3.5e') {
      charSpeed = race === 'Halfling' || race === 'Dwarf' || race === 'Gnome' ? 20 : 30;
      if (useHalfBreedSystem) {
        finalRaceName = getHybridName(primaryParent, secondaryParent, customHybridName);
        hybridFeature = buildHybridFeature(
          finalRaceName,
          primaryData,
          secondaryData,
          primaryData.size,
          primaryData.speed,
          primaryData.hasDarkvision || secondaryData.hasDarkvision
        );
        charSpeed = primaryData.speed;
      } else if (useClassicSRDHalfBreed && selectedSRD) {
        if (selectedSRD.id.includes('half-dragon')) {
          finalRaceName = edition === '3.5e' ? `Half-${dragonVariety} Dragon (3.5e SRD)` : `Half-${dragonVariety} Dragon (5e SRD)`;
        } else {
          finalRaceName = selectedSRD.name;
        }
        hybridFeature = buildClassicSRDFeature(selectedSRD, dragonVariety);
        charSpeed = selectedSRD.speed;
      }
    } else if (edition === 'shadowrun') {
      charSpeed = agi * 2 + 10;
    } else if (edition === 'cthulhu') {
      charSpeed = dexCoC >= 50 && sizCoC >= 50 ? 8 : 7;
    }

    const calculatedAbilities = edition === 'shadowrun'
      ? {
          STR: { score: strSR },
          DEX: { score: agi },
          CON: { score: bod },
          INT: { score: log },
          WIS: { score: intSR },
          CHA: { score: chaSR },
        }
      : edition === 'cthulhu'
      ? {
          STR: { score: strCoC },
          DEX: { score: dexCoC },
          CON: { score: conCoC },
          INT: { score: intCoC },
          WIS: { score: powCoC },
          CHA: { score: appCoC },
        }
      : {
          STR: { score: str },
          DEX: { score: dex },
          CON: { score: con },
          INT: { score: int },
          WIS: { score: wis },
          CHA: { score: cha },
        };

    const newChar: CharacterData = {
      id: 'char-' + Date.now(),
      name: name.trim(),
      race: finalRaceName,
      characterClass,
      subclass,
      level,
      background,
      alignment,
      experiencePoints: 0,
      edition,
      portraitUrl: portraitUrl.trim() || (isMonster ? getMonsterPortraitUrl(name.trim()) : undefined),
      hpCalcMode,
      isVendor,
      vendorMargin: isVendor ? vendorMargin : 100,
      isMonster,
      monsterXpReward: isMonster ? monsterXpReward : undefined,

      hybridHeritage: (edition === '5e' || edition === '3.5e') && useHalfBreedSystem ? {
        enabled: true,
        isClassicSRD: false,
        primaryParent,
        secondaryParent,
        customHybridName: finalRaceName,
        primaryTraitName: primaryData.primaryTraitName,
        primaryTraitDesc: primaryData.primaryTraitDesc,
        secondaryTraitName: secondaryData.secondaryTraitName,
        secondaryTraitDesc: secondaryData.secondaryTraitDesc,
        speedFeet: primaryData.speed,
        sizeCategory: primaryData.size,
        hasDarkvision: primaryData.hasDarkvision || secondaryData.secondaryTraitDesc.includes('Darkvision')
      } : ((edition === '5e' || edition === '3.5e') && useClassicSRDHalfBreed && selectedSRD) ? {
        enabled: true,
        isClassicSRD: true,
        classicSRDId: selectedSRD.id,
        dragonVariety: selectedSRD.id.includes('half-dragon') ? dragonVariety : undefined,
        primaryParent: finalRaceName,
        secondaryParent: 'SRD Classic',
        customHybridName: finalRaceName,
        speedFeet: selectedSRD.speed,
        sizeCategory: selectedSRD.size,
        hasDarkvision: selectedSRD.hasDarkvision
      } : undefined,

      optionalRules: {
        useVariantEncumbrance,
        useFlankingRules,
        useMulticlassing: useGestaltUA72 ? true : useMulticlassing,
        secondaryClass: (useGestaltUA72 || useMulticlassing) ? secondaryClass : undefined,
        secondaryLevel: useGestaltUA72 ? level : (useMulticlassing ? secondaryLevel : undefined),
        secondarySubclass: (useGestaltUA72 || useMulticlassing) ? secondarySubclass : undefined,
        useGrittyRealismResting,
        useVariantCritDamage,
        useMilestoneXp,
        disableAutoXpGain,
        useManualXpMode: disableAutoXpGain,
        useGestaltUA72,
        useDefenseBonusUA109,
        useArmorAsDRUA109,
        useHalfBreedSystem: (edition === '5e' || edition === '3.5e') && useHalfBreedSystem,
        useClassicSRDHalfBreed: (edition === '5e' || edition === '3.5e') && useClassicSRDHalfBreed,
        strictEssenceCap,
        glitchRules,
        directMatrixDamage,
        streetLevelMode,
        majorWounds,
        boutsOfMadness,
        pushedRolls,
        pulpCthulhuMode,
      },

      // 3.5e initial stats
      bab: edition === '3.5e' ? (['Fighter', 'Paladin', 'Ranger', 'Barbarian'].includes(characterClass) ? level : Math.floor(level * 0.75)) : undefined,
      fortSaveBase: edition === '3.5e' ? (['Fighter', 'Paladin', 'Barbarian', 'Cleric'].includes(characterClass) ? Math.floor(level / 2) + 2 : Math.floor(level / 3)) : undefined,
      refSaveBase: edition === '3.5e' ? (['Rogue', 'Ranger', 'Monk', 'Bard'].includes(characterClass) ? Math.floor(level / 2) + 2 : Math.floor(level / 3)) : undefined,
      willSaveBase: edition === '3.5e' ? (['Wizard', 'Cleric', 'Druid', 'Sorcerer', 'Monk', 'Bard'].includes(characterClass) ? Math.floor(level / 2) + 2 : Math.floor(level / 3)) : undefined,

      hpMax: hpMax,
      hpCurrent: hpMax,
      hpTemp: 0,
      hitDiceTotal: `${level}d${hitDieValue}`,
      hitDiceCurrent: level,
      armorClass: edition === 'shadowrun' ? 12 : edition === 'cthulhu' ? 0 : 10 + Math.floor((dex - 10) / 2),
      initiativeBonus: edition === 'shadowrun' ? rea + intSR : Math.floor((dex - 10) / 2),
      speed: charSpeed,
      inspiration: false,

      deathSavesSuccesses: 0,
      deathSavesFailures: 0,

      abilities: calculatedAbilities,

      savingThrowProficiencies: characterClass === 'Fighter' ? ['STR', 'CON'] : characterClass === 'Wizard' ? ['INT', 'WIS'] : ['DEX', 'INT'],

      skills: edition === '3.5e'
        ? DEFAULT_35E_SKILLS_LIST.map(s => ({
            id: 'sk-35-' + s.name.replace(/\s+/g, '-'),
            name: s.name,
            ability: s.ability,
            proficient: false,
            ranks: 0,
            miscMod: 0,
            isClassSkill: true
          }))
        : DEFAULT_SKILLS_LIST.map(s => ({
            id: s.name,
            name: s.name,
            ability: s.ability,
            proficient: (useHalfBreedSystem && (primaryParent === 'Elf' || secondaryParent === 'Elf')) && s.name === 'Perception' ? true : false
          })),

      classFeatures: [
        ...(hybridFeature ? [hybridFeature] : []),
        {
          id: 'cf-base-1',
          name: `${characterClass} Level ${level} Features`,
          source: characterClass,
          description: `Primary features for ${characterClass} level ${level}.`
        }
      ],

      feats: [],

      attacks: [
        {
          id: 'atk-base-1',
          name: edition === 'shadowrun' ? 'Ares Predator Heavy Pistol' : edition === 'cthulhu' ? '.38 Revolver' : 'Basic Strike',
          attackBonus: edition === 'shadowrun' ? agi + 2 : 2 + Math.floor((str - 10) / 2),
          damage: edition === 'shadowrun' ? '8P (AP -1)' : edition === 'cthulhu' ? '1d10' : `1d6 ${Math.floor((str - 10) / 2) >= 0 ? '+' + Math.floor((str - 10) / 2) : Math.floor((str - 10) / 2)}`,
          damageType: edition === 'shadowrun' ? 'Physical' : 'Piercing',
          range: edition === 'shadowrun' ? '15m' : '5 ft Melee'
        }
      ],

      wealth: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: edition === 'shadowrun' ? 0 : 15,
        pp: 0
      },

      inventory: [
        { id: 'inv-1', name: edition === 'shadowrun' ? "Runner's Kit" : "Explorer's Pack", quantity: 1, weight: 10, equipped: true },
        { id: 'inv-2', name: edition === 'shadowrun' ? 'Armored Jacket' : 'Traveler’s Clothes', quantity: 1, weight: 4, equipped: true }
      ],

      isSpellcaster: isCaster,
      spellcastingAbility: ['Wizard', 'Artificer'].includes(characterClass) ? 'INT' : ['Cleric', 'Druid', 'Ranger', 'Occultist'].includes(characterClass) ? 'WIS' : 'CHA',
      spellSlots: isCaster ? [
        { level: 1, max: level >= 3 ? 4 : 2, current: level >= 3 ? 4 : 2 },
        { level: 2, max: level >= 3 ? 2 : 0, current: level >= 3 ? 2 : 0 }
      ] : [],
      spells: [],

      gender: '',
      age: '',
      height: '',
      weight: '',
      eyes: '',
      hair: '',
      skin: '',

      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstory: '',
      alliesAndOrganizations: '',
      additionalNotes: '',

      shadowrun: edition === 'shadowrun' ? {
        bod,
        agi,
        rea,
        str: strSR,
        wil,
        log,
        int: intSR,
        cha: chaSR,
        edg,
        edgCurrent: edg,
        ess,
        mag,
        res,
        nuyen: streetLevelMode ? 5000 : 25000,
        karmaCurrent: streetLevelMode ? 5 : 10,
        karmaTotal: 50,
        streetCred: 2,
        notoriety: 1,
        publicAwareness: 0,
        physicalBoxesCurrent: 0,
        stunBoxesCurrent: 0,
        overflowBoxesCurrent: 0,
        ballisticArmor: 12,
        impactArmor: 10,
        qualities: [
          { id: 'q-1', name: 'High Pain Tolerance', type: 'Positive', karmaCost: 7, description: 'Ignores -1 wound modifier penalty.' }
        ],
        cyberware: [],
        srSkills: [],
        vehicles: []
      } : {
        bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 3, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 0, res: 0,
        nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 2, notoriety: 1, publicAwareness: 0,
        physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
        qualities: [
          { id: 'q-1', name: 'High Pain Tolerance', type: 'Positive', karmaCost: 7, description: 'Ignores -1 wound modifier penalty.' }
        ],
        cyberware: [],
        srSkills: [],
        vehicles: []
      }
    };

    const syncedChar = syncClassFeaturesForCharacter(newChar, characterClass, level, edition);
    onCreate(syncedChar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-serif font-bold text-amber-300 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" /> Create New {getSystemTitle(edition)} {isMonster ? 'Monster / NPC' : isVendor ? 'Vendor' : 'Entry'}
            </h3>
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/50 text-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Randomize all stats, name, race, class, alignment and HP"
            >
              <Dices className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
              <span>🎲 Randomize All</span>
            </button>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">Character Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={getNamePlaceholderForSystem(edition)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="block text-stone-400 text-xs font-bold">
                  {edition === 'shadowrun' ? 'Metatype (Race)' : edition === 'pathfinder' ? 'Ancestry (Race)' : edition === 'cthulhu' ? 'Origin / Heritage' : 'Race'}
                </label>
                {(edition === '5e' || edition === '3.5e') && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer text-amber-400 hover:text-amber-300 font-mono text-[10px] font-bold bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-md transition">
                      <input
                        type="checkbox"
                        checked={useHalfBreedSystem}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseHalfBreedSystem(checked);
                          if (checked) setUseClassicSRDHalfBreed(false);
                        }}
                        className="accent-amber-500 w-3.5 h-3.5 rounded"
                      />
                      <Dna className="w-3 h-3 text-amber-400" />
                      <span>The Alpine DM System</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-amber-200 font-mono text-[10px] font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md transition">
                      <input
                        type="checkbox"
                        checked={useClassicSRDHalfBreed}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseClassicSRDHalfBreed(checked);
                          if (checked) {
                            setUseHalfBreedSystem(false);
                            const srdList = getClassicSRDHalfBreedsForEdition(edition);
                            if (srdList.length > 0) setSelectedClassicSRDId(srdList[0].id);
                          }
                        }}
                        className="accent-amber-500 w-3.5 h-3.5 rounded"
                      />
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Classic Half-Breeds (SRD)</span>
                    </label>
                  </div>
                )}
              </div>

              {(!useHalfBreedSystem && !useClassicSRDHalfBreed) || (edition !== '5e' && edition !== '3.5e') ? (
                <select
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
                >
                  {getRacesForSystem(edition).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : null}

              {/* The Alpine DM System UI */}
              {useHalfBreedSystem && (
                <div className="bg-stone-900/95 border border-amber-600/50 p-3 rounded-xl space-y-3 shadow-lg">
                  <div className="text-xs text-amber-300 font-serif font-bold flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-amber-400 animate-pulse" />
                      Hybrid Ancestry Builder (The Alpine DM System)
                    </span>
                    <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                      DUAL HERITAGE ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-stone-300 font-bold mb-1">Primary Parent Ancestry *</label>
                      <select
                        value={primaryParent}
                        onChange={(e) => setPrimaryParent(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                      >
                        {PARENT_RACE_CATALOG.map(pr => (
                          <option key={pr.id} value={pr.name}>{pr.name} ({pr.size}, {pr.speed}ft)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-bold mb-1">Secondary Parent Ancestry *</label>
                      <select
                        value={secondaryParent}
                        onChange={(e) => setSecondaryParent(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                      >
                        {PARENT_RACE_CATALOG.map(pr => (
                          <option key={pr.id} value={pr.name}>{pr.name} ({pr.size}, {pr.speed}ft)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold text-xs mb-1">
                      Custom Hybrid Race Title (Optional / Auto-Generated)
                    </label>
                    <input
                      type="text"
                      value={customHybridName}
                      onChange={(e) => setCustomHybridName(e.target.value)}
                      placeholder={`e.g. ${getHybridName(primaryParent, secondaryParent)}`}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-amber-200 font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Calculated Race Name: <strong className="text-amber-300 font-serif">{getHybridName(primaryParent, secondaryParent, customHybridName)}</strong>
                    </p>
                  </div>

                  {/* Live Ancestral Traits Preview */}
                  {(() => {
                    const pData = PARENT_RACE_CATALOG.find(p => p.name === primaryParent) || PARENT_RACE_CATALOG[0];
                    const sData = PARENT_RACE_CATALOG.find(s => s.name === secondaryParent) || PARENT_RACE_CATALOG[1];
                    const hasDV = pData.hasDarkvision || sData.hasDarkvision;

                    return (
                      <div className="bg-stone-950 border border-amber-900/40 p-2.5 rounded-lg space-y-1.5 text-[11px] text-stone-300">
                        <div className="font-bold text-amber-200 flex items-center justify-between border-b border-stone-800 pb-1">
                          <span>Inherited Ancestral Traits</span>
                          <span className="font-mono text-[10px] text-amber-400/80">
                            Size: {pData.size} | Speed: {pData.speed}ft | Darkvision: {hasDV ? '60ft' : 'None'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          <div>
                            <span className="text-amber-400 font-semibold">🧬 Primary Ancestry ({pData.name}):</span>{' '}
                            <strong className="text-stone-100">{pData.primaryTraitName}</strong> — <span className="text-stone-400">{pData.primaryTraitDesc}</span>
                          </div>
                          <div>
                            <span className="text-amber-400 font-semibold">⚡ Secondary Ancestry ({sData.name}):</span>{' '}
                            <strong className="text-stone-100">{sData.secondaryTraitName}</strong> — <span className="text-stone-400">{sData.secondaryTraitDesc}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Classic SRD Half-Breeds UI */}
              {useClassicSRDHalfBreed && (
                <div className="bg-stone-900/95 border border-amber-600/50 p-3 rounded-xl space-y-3 shadow-lg">
                  <div className="text-xs text-amber-300 font-serif font-bold flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      Classic SRD Half-Breed Rules ({edition.toUpperCase()})
                    </span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                      {edition.toUpperCase()} SRD COMPLIANT
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold text-xs mb-1">Select SRD Half-Breed Race ({edition}) *</label>
                    <select
                      value={selectedClassicSRDId}
                      onChange={(e) => setSelectedClassicSRDId(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded p-2 text-stone-100 font-bold focus:outline-none focus:border-amber-500 text-xs"
                    >
                      {getClassicSRDHalfBreedsForEdition(edition).map(hb => (
                        <option key={hb.id} value={hb.id}>
                          {hb.name} ({hb.size}, {hb.speed}ft {hb.flySpeed ? `/ Fly ${hb.flySpeed}ft` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClassicSRDId.includes('half-dragon') && (
                    <div className="bg-stone-950 border border-amber-600/40 p-2.5 rounded-lg space-y-1.5">
                      <label className="block text-amber-300 font-bold text-xs">
                        🐉 Select Dragon Ancestry / Variety ({edition.toUpperCase()}) *
                      </label>
                      <select
                        value={dragonVariety}
                        onChange={(e) => setDragonVariety(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-100 font-bold text-xs focus:outline-none focus:border-amber-500"
                      >
                        {(edition === '3.5e' ? DRAGON_VARIETIES_35E : DRAGON_VARIETIES_5E).map(dv => (
                          <option key={dv.variety} value={dv.variety}>
                            {dv.variety} Dragon — {dv.immunityOrResistance} | Breath: {dv.breathWeapon}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400 italic">
                        Determines breath weapon area/damage type and elemental energy immunity/resistance.
                      </p>
                    </div>
                  )}

                  {(() => {
                    const srdList = getClassicSRDHalfBreedsForEdition(edition);
                    const srdHB = srdList.find(hb => hb.id === selectedClassicSRDId) || srdList[0];
                    if (!srdHB) return null;

                    const dynamicFeature = buildClassicSRDFeature(srdHB, dragonVariety);
                    const isDragon = srdHB.id.includes('half-dragon');
                    const displayName = isDragon ? (edition === '3.5e' ? `Half-${dragonVariety} Dragon (3.5e SRD)` : `Half-${dragonVariety} Dragon (5e SRD)`) : srdHB.name;

                    return (
                      <div className="bg-stone-950 border border-amber-900/50 p-3 rounded-lg space-y-2 text-[11px] text-stone-300">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                          <span className="font-bold text-amber-200 text-xs">{displayName}</span>
                          <span className="font-mono text-[10px] bg-amber-950 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded font-bold">
                            Size: {srdHB.size} | Speed: {srdHB.speed}ft {srdHB.flySpeed ? `(Fly ${srdHB.flySpeed}ft)` : ''} | {srdHB.hasDarkvision ? 'Darkvision 60ft' : srdHB.hasLowLightVision ? 'Low-Light Vision' : 'Normal Vision'}
                          </span>
                        </div>

                        <p className="text-stone-400 italic text-[11px]">{srdHB.description}</p>

                        <div className="bg-stone-900/80 p-2 rounded border border-amber-900/40 text-amber-300 font-mono text-[11px]">
                          <strong>Stat Adjustments:</strong> {srdHB.statBonusText}
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-amber-400 font-bold block text-[11px]">Racial Traits ({srdHB.source}):</span>
                          <div className="bg-stone-900/60 p-2 rounded border border-stone-800 whitespace-pre-wrap text-[11px] text-stone-300 leading-relaxed font-sans">
                            {dynamicFeature.description.split('\n\nRacial Traits:\n')[1] || dynamicFeature.description}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {!isMonster ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-400 mb-1">
                  {edition === 'shadowrun' ? 'Archetype / Role' : edition === 'cthulhu' ? 'Occupation' : 'Class'}
                </label>
                <select
                  value={characterClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
                >
                  {getClassesForSystem(edition).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">
                  {edition === 'shadowrun' ? 'Specialization' : edition === 'pathfinder' ? 'Subclass / Doctrine' : edition === 'cthulhu' ? 'Specialist Focus' : 'Subclass'}
                </label>
                <select
                  value={subclass}
                  onChange={(e) => setSubclass(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
                >
                  {getSubclassesForSystemClass(edition, characterClass).map(sc => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Level</label>
                <input
                  type="number"
                  min="1"
                  value={level}
                  onChange={(e) => setLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-stone-400 mb-1">Challenge Rating / Level</label>
                <input
                  type="number"
                  min="1"
                  value={level}
                  onChange={(e) => setLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">
                {edition === 'shadowrun' ? 'Background / Prior Career' : edition === 'cthulhu' ? 'Background / Origin' : 'Background'}
              </label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
              >
                {getBackgroundsForSystem(edition).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-400 mb-1">
                {edition === 'shadowrun' ? 'Disposition / Allegiance' : edition === 'cthulhu' ? 'Mental Disposition / Temperament' : 'Alignment'}
              </label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
              >
                {getAlignmentsForSystem(edition).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Character Portrait Hyperlink & HP Calculation Method */}
          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-3">
            <div>
              <label className="block text-stone-300 font-bold mb-1">Character Portrait Image (Hyperlink URL)</label>
              <input
                type="url"
                value={portraitUrl}
                onChange={(e) => setPortraitUrl(e.target.value)}
                placeholder="https://example.com/my-character-portrait.png"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-stone-500 mt-1">Paste a direct image link to display your character avatar sheet portrait.</p>
            </div>

            {(edition === '5e' || edition === '3.5e' || edition === 'pathfinder') && (
              <div className="pt-2 border-t border-stone-800">
                <label className="block text-stone-300 font-bold mb-1.5">Max HP Calculation Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHpCalcMode('Average')}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      hpCalcMode === 'Average'
                        ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Average HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setHpCalcMode('Rolled')}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      hpCalcMode === 'Rolled'
                        ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Rolled HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setHpCalcMode('Max')}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      hpCalcMode === 'Max'
                        ? 'bg-amber-600 border-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Max Value HP
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  {hpCalcMode === 'Average' && 'Calculates HP using fixed class hit die average per level + CON mod.'}
                  {hpCalcMode === 'Rolled' && 'Simulates rolled hit die value per level + CON mod (e.g. 5e HP calculator mode).'}
                  {hpCalcMode === 'Max' && 'Calculates HP as maximum roll on hit die for every level + CON mod.'}
                </p>
              </div>
            )}
          </div>

          {/* Merchant / Vendor Settings */}
          <div className="bg-stone-950 border border-amber-800/40 p-3 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-amber-200 font-serif font-bold">
                <input
                  type="checkbox"
                  checked={isVendor}
                  onChange={(e) => setIsVendor(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
                <Store className="w-4 h-4 text-amber-400" />
                <span>Mark Character as Merchant / Vendor</span>
              </label>

              {isVendor && (
                <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded font-mono font-bold border border-amber-600/40">
                  VENDOR ACTIVE
                </span>
              )}
            </div>

            {isVendor && (
              <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                <div className="flex-1">
                  <label className="block text-stone-300 font-medium mb-1">
                    Selling Margin (%)
                  </label>
                  <p className="text-[11px] text-stone-400">
                    Determines markup price for items sold by this vendor (e.g. 120% = +20% price markup).
                  </p>
                </div>
                <div className="w-32 flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-lg p-1.5">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={vendorMargin}
                    onChange={(e) => setVendorMargin(Math.max(1, parseInt(e.target.value) || 100))}
                    className="w-full bg-transparent text-center font-mono font-bold text-amber-300 focus:outline-none"
                  />
                  <span className="text-amber-400 font-bold font-mono">%</span>
                </div>
              </div>
            )}
          </div>

          {/* Monster / Encounter Creature Settings */}
          <div className="bg-stone-950 border border-red-900/40 p-3 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-red-200 font-serif font-bold">
                <input
                  type="checkbox"
                  checked={isMonster}
                  onChange={(e) => setIsMonster(e.target.checked)}
                  className="accent-red-500 w-4 h-4 rounded"
                />
                <Skull className="w-4 h-4 text-red-400" />
                <span>Mark as Monster / Encounter Creature (DM Session Planning)</span>
              </label>

              {isMonster && (
                <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-mono font-bold border border-red-600/50 flex items-center gap-1">
                  <Skull className="w-3 h-3 text-red-400" />
                  MONSTER / CREATURE
                </span>
              )}
            </div>

            {isMonster && (
              <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                <div className="flex-1">
                  <label className="block text-red-300 font-medium mb-1">
                    Defeat XP Reward (Party XP)
                  </label>
                  <p className="text-[11px] text-stone-400">
                    Specify the total Experience Points (XP) awarded to the adventuring party upon defeating this monster.
                  </p>
                </div>
                <div className="w-36 flex items-center gap-1 bg-stone-900 border border-stone-700 rounded-lg p-1.5">
                  <input
                    type="number"
                    min="0"
                    max="500000"
                    step="50"
                    value={monsterXpReward}
                    onChange={(e) => setMonsterXpReward(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-transparent text-center font-mono font-bold text-red-300 focus:outline-none"
                  />
                  <span className="text-red-400 font-bold font-mono text-[10px]">XP</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-stone-400 pl-6">
              Allows DMs to plan encounters and flag enemies, monsters, and bosses in their roster before session play.
            </p>
          </div>

          {/* System-Specific Optional Rules & Calculation Toggles */}
          {(edition === '5e' || edition === '3.5e') && (
            <div className="bg-stone-950 border border-amber-900/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Optional {getSystemTitle(edition)} Rules & Calculation Toggles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Variant Encumbrance */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useVariantEncumbrance}
                    onChange={(e) => setUseVariantEncumbrance(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Variant Encumbrance
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Encumbered at STR×5 lbs (-10ft speed), Heavily Encumbered at STR×10 lbs (-20ft speed & Disadvantage).
                    </p>
                  </div>
                </label>

                {/* Tactical Flanking */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useFlankingRules}
                    onChange={(e) => setUseFlankingRules(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Swords className="w-3.5 h-3.5 text-amber-400" /> Tactical Flanking
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Adds Advantage prompt (5e) or +2 Attack bonus (3.5e) when positioned with an ally.
                    </p>
                  </div>
                </label>

                {/* Half-Breed / Hybrid Heritage Ancestry */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useHalfBreedSystem}
                    onChange={(e) => setUseHalfBreedSystem(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Dna className="w-3.5 h-3.5 text-amber-400" /> Half-Breed System (The Alpine DM)
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Enables dual parent ancestry heritage, custom hybrid race names & combined traits.
                    </p>
                  </div>
                </label>

                {/* Dual Classing / Multiclassing */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={useMulticlassing}
                    onChange={(e) => setUseMulticlassing(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" /> Dual Classing / Multiclassing
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Calculates combined level, combined spell slots, and multiclass Hit Dice pools.
                    </p>

                    {useMulticlassing && (
                      <div className="mt-2.5 pt-2 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-amber-300 font-bold mb-0.5">Secondary Class</label>
                          <select
                            value={secondaryClass}
                            onChange={(e) => setSecondaryClass(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2 py-1 text-xs"
                          >
                            {getClassesForSystem(edition).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-amber-300 font-bold mb-0.5">Secondary Level</label>
                          <input
                            type="number"
                            min="1"
                            value={secondaryLevel}
                            onChange={(e) => setSecondaryLevel(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-stone-950 border border-stone-700 font-mono font-bold text-stone-200 rounded px-2 py-1 text-xs text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-amber-300 font-bold mb-0.5">Secondary Subclass</label>
                          <input
                            type="text"
                            value={secondarySubclass}
                            onChange={(e) => setSecondarySubclass(e.target.value)}
                            placeholder="e.g. Assassin"
                            className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* Gritty Realism Resting */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useGrittyRealismResting}
                    onChange={(e) => setUseGrittyRealismResting(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Gritty Realism Resting
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Short Rest takes 8 Hours (overnight), Long Rest takes 7 Days (sanctuary).
                    </p>
                  </div>
                </label>

                {/* Variant Critical Damage */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useVariantCritDamage}
                    onChange={(e) => setUseVariantCritDamage(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" /> Variant Critical Damage
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Maximize initial weapon die + roll second die (e.g. 8 + 1d8 + STR).
                    </p>
                  </div>
                </label>

                {/* Milestone XP Mode */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={useMilestoneXp}
                    onChange={(e) => setUseMilestoneXp(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Milestone Advancement Mode
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Hides numerical XP progress bars in favor of story/DM milestone level-ups.
                    </p>
                  </div>
                </label>

                {/* Manual Tabletop EXP Mode */}
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition">
                  <input
                    type="checkbox"
                    checked={disableAutoXpGain}
                    onChange={(e) => setDisableAutoXpGain(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Manual / Tabletop EXP System
                    </span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
                      Disables automatic combat kill EXP distribution to the character sheet.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Shadowrun Optional Rules */}
          {edition === 'shadowrun' && (
            <div className="bg-stone-950 border border-emerald-900/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-sm">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Shadowrun 5e Rules & Simulation Toggles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-emerald-600/40 transition">
                  <input
                    type="checkbox"
                    checked={strictEssenceCap}
                    onChange={(e) => setStrictEssenceCap(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Strict Essence Limit (6.0 Cap)</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Essence loss strictly limits cyberware and reduces Magic / Resonance ratings.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-emerald-600/40 transition">
                  <input
                    type="checkbox"
                    checked={glitchRules}
                    onChange={(e) => setGlitchRules(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Glitch & Critical Glitch System</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Triggers complications when more than half of dice rolled show 1s.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-emerald-600/40 transition">
                  <input
                    type="checkbox"
                    checked={directMatrixDamage}
                    onChange={(e) => setDirectMatrixDamage(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Biofeedback & Matrix Damage</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Hot-sim dumpshock inflicts physical biofeedback damage.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-emerald-600/40 transition">
                  <input
                    type="checkbox"
                    checked={streetLevelMode}
                    onChange={(e) => setStreetLevelMode(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Street-Level Runner Mode</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Starts with reduced starting Nuyen (5,000¥) and low resources.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Call of Cthulhu Optional Rules */}
          {edition === 'cthulhu' && (
            <div className="bg-stone-950 border border-teal-900/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-teal-300 font-serif font-bold text-sm">
                <Settings className="w-4 h-4 text-teal-400" />
                <span>Call of Cthulhu 7e Horror & Sanity Toggles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-teal-600/40 transition">
                  <input
                    type="checkbox"
                    checked={majorWounds}
                    onChange={(e) => setMajorWounds(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Major Wound Mechanics</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Single hits dealing ≥ half Max HP trigger Major Wounds and unconsciousness risk.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-teal-600/40 transition">
                  <input
                    type="checkbox"
                    checked={boutsOfMadness}
                    onChange={(e) => setBoutsOfMadness(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Bouts of Madness & Phobias</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Losing ≥ 5 SAN in a single roll triggers temporary insanity bouts.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-teal-600/40 transition">
                  <input
                    type="checkbox"
                    checked={pushedRolls}
                    onChange={(e) => setPushedRolls(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Pushed Skill Rolls</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Allow players to re-roll failed skill checks with heightened dire consequences.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-teal-600/40 transition">
                  <input
                    type="checkbox"
                    checked={pulpCthulhuMode}
                    onChange={(e) => setPulpCthulhuMode(e.target.checked)}
                    className="accent-teal-500 w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-stone-200">Pulp Cthulhu Mode (Double HP)</span>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5">Doubles standard investigator HP and enables heroic Luck spending.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* System Attributes Grid */}
          <div className="border-t border-stone-800 pt-3">
            <div className="text-amber-300 font-serif font-bold text-sm mb-2">
              {edition === 'shadowrun' ? 'Shadowrun Attributes (Ratings 1-6+)' : edition === 'cthulhu' ? 'Investigator Characteristics (Percentile 1-99%)' : 'Ability Scores'}
            </div>

            {edition === 'shadowrun' ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center font-mono text-xs">
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">BOD</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={bod}
                    onChange={(e) => setBod(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">AGI</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={agi}
                    onChange={(e) => setAgi(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">REA</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={rea}
                    onChange={(e) => setRea(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">STR</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={strSR}
                    onChange={(e) => setStrSR(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">WIL</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={wil}
                    onChange={(e) => setWil(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">LOG</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={log}
                    onChange={(e) => setLog(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">INT</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={intSR}
                    onChange={(e) => setIntSR(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5 font-bold">CHA</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={chaSR}
                    onChange={(e) => setChaSR(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-[10px] mb-0.5 font-bold">EDG</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={edg}
                    onChange={(e) => setEdg(parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 text-[10px] mb-0.5 font-bold">ESS</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    step="0.1"
                    value={ess}
                    onChange={(e) => setEss(parseFloat(e.target.value) || 6.0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-purple-400 text-[10px] mb-0.5 font-bold">MAG</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={mag}
                    onChange={(e) => setMag(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">RES</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={res}
                    onChange={(e) => setRes(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-300"
                  />
                </div>
              </div>
            ) : edition === 'cthulhu' ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">STR%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={strCoC}
                    onChange={(e) => setStrCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">CON%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={conCoC}
                    onChange={(e) => setConCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">SIZ%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={sizCoC}
                    onChange={(e) => setSizCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">DEX%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={dexCoC}
                    onChange={(e) => setDexCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">APP%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={appCoC}
                    onChange={(e) => setAppCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">INT%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={intCoC}
                    onChange={(e) => setIntCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">POW%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={powCoC}
                    onChange={(e) => setPowCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-teal-400 text-[10px] mb-0.5 font-bold">EDU%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={eduCoC}
                    onChange={(e) => setEduCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-purple-400 text-[10px] mb-0.5 font-bold">SAN%</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={sanCoC}
                    onChange={(e) => setSanCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-[10px] mb-0.5 font-bold">LUCK%</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={luckCoC}
                    onChange={(e) => setLuckCoC(parseInt(e.target.value) || 50)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1 text-center font-bold text-amber-300"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">STR</label>
                  <input
                    type="number"
                    value={str}
                    onChange={(e) => setStr(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">DEX</label>
                  <input
                    type="number"
                    value={dex}
                    onChange={(e) => setDex(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">CON</label>
                  <input
                    type="number"
                    value={con}
                    onChange={(e) => setCon(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">INT</label>
                  <input
                    type="number"
                    value={int}
                    onChange={(e) => setInt(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">WIS</label>
                  <input
                    type="number"
                    value={wis}
                    onChange={(e) => setWis(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 text-[10px] mb-1">CHA</label>
                  <input
                    type="number"
                    value={cha}
                    onChange={(e) => setCha(parseInt(e.target.value) || 10)}
                    className="w-full bg-stone-950 border border-stone-700 rounded p-1.5 text-center font-bold text-amber-200"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> Create Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
