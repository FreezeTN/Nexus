import React, { useState } from 'react';
import { CharacterData, RuleEdition, Skill } from '../../types';
import { DEFAULT_SKILLS_LIST, DEFAULT_35E_SKILLS_LIST } from '../../utils/dndCalculations';
import { UserPlus, Sparkles, X, Store, Layers, Skull, Dices, Shuffle, Settings, Zap, Crosshair, Scale, Swords } from 'lucide-react';
import { getMonsterPortraitUrl } from '../../data/monsterPortraits';

interface NewCharacterModalProps {
  onClose: () => void;
  onCreate: (newChar: CharacterData) => void;
  initialEdition?: RuleEdition;
  initialIsMonster?: boolean;
  initialIsVendor?: boolean;
  enabledSystems?: RuleEdition[];
}

// System-tailored Races / Metatypes / Ancestries / Origins
const RACE_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
  '5e': [
    'Human', 'Elf', 'High Elf', 'Wood Elf', 'Dark Elf (Drow)', 'Dwarf', 'Hill Dwarf', 'Mountain Dwarf',
    'Halfling', 'Lightfoot Halfling', 'Stout Halfling', 'Dragonborn', 'Gnome', 'Rock Gnome', 'Forest Gnome',
    'Half-Elf', 'Half-Orc', 'Tiefling', 'Aasimar', 'Genasi', 'Goliath', 'Tabaxi', 'Warforged', 'Orc', 'Goblin', 'Kobold'
  ],
  '3.5e': [
    'Human', 'High Elf', 'Wood Elf', 'Hill Dwarf', 'Mountain Dwarf', 'Lightfoot Halfling', 'Rock Gnome', 'Half-Elf', 'Half-Orc'
  ],
  'shadowrun': [
    'Human', 'Elf', 'Dwarf', 'Ork', 'Troll', 'Nightling', 'Dryad', 'Fomorian', 'Minotaur', 'Cyclops', 'Nartaki'
  ],
  'pathfinder': [
    'Human', 'Elf', 'Dwarf', 'Gnome', 'Goblin', 'Halfling', 'Orc', 'Leshy', 'Kobold', 'Tengu',
    'Catfolk', 'Ratfolk', 'Android', 'Skeleton', 'Tiefling', 'Aasimar'
  ],
  'cthulhu': [
    'American (New England)', 'British', 'Continental European', 'Egyptian', 'Japanese',
    'Chinese', 'Latin American', 'Australian', 'Expedition Explorer', 'Native Heritage'
  ]
};

// System-tailored Classes / Archetypes / Occupations
const CLASS_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
  '5e': [
    'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock', 'Artificer'
  ],
  '3.5e': [
    'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer'
  ],
  'shadowrun': [
    'Street Samurai', 'Decker', 'Rigger', 'Physical Adept', 'Spellcasting Mage', 'Shaman', 'Face', 'Technomancer', 'Weapons Specialist', 'Bounty Hunter', 'Corporate Agent'
  ],
  'pathfinder': [
    'Fighter', 'Wizard', 'Rogue', 'Cleric', 'Champion (Paladin)', 'Ranger', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Investigator', 'Alchemist', 'Swashbuckler', 'Inventor', 'Thaumaturge', 'Psychic', 'Gunslinger', 'Kineticist'
  ],
  'cthulhu': [
    'Private Investigator', 'Dilettante', 'Professor / Academic', 'Journalist', 'Doctor / Physician', 'Antiquarian', 'Police Detective', 'Author', 'Clergyman', 'Engineer', 'Parapsychologist', 'Federal Agent', 'Bootlegger', 'Pilot', 'Stage Performer', 'Expedition Specialist', 'Occultist'
  ]
};

// Subclass options mapped by System & Class
const SUBCLASS_MAP_BY_SYSTEM: Record<RuleEdition, Record<string, string[]>> = {
  '5e': {
    Fighter: ['Champion', 'Battle Master', 'Eldritch Knight', 'Arcane Archer', 'Cavalier', 'Samurai', 'Rune Knight', 'Psi Warrior'],
    Wizard: ['School of Evocation', 'School of Abjuration', 'School of Conjuration', 'School of Divination', 'School of Enchantment', 'School of Illusion', 'School of Necromancy', 'School of Transmutation', 'Bladesinging', 'War Magic'],
    Rogue: ['Thief', 'Assassin', 'Arcane Trickster', 'Swashbuckler', 'Inquisitive', 'Mastermind', 'Phantom', 'Soulknife'],
    Cleric: ['Life Domain', 'Light Domain', 'Trickery Domain', 'War Domain', 'Tempest Domain', 'Nature Domain', 'Knowledge Domain', 'Forge Domain', 'Order Domain', 'Peace Domain', 'Twilight Domain', 'Death Domain'],
    Paladin: ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance', 'Oath of Conquest', 'Oath of Redemption', 'Oath of Glory', 'Oathbreaker'],
    Ranger: ['Hunter', 'Beast Master', 'Gloom Stalker', 'Horizon Walker', 'Monster Slayer', 'Fey Wanderer', 'Swarmkeeper'],
    Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior', 'Path of the Ancestral Guardian', 'Path of the Storm Herald', 'Path of Zealot', 'Path of Wild Magic', 'Path of the Beast'],
    Bard: ['College of Lore', 'College of Valor', 'College of Glamour', 'College of Swords', 'College of Whispers', 'College of Eloquence', 'College of Creation'],
    Druid: ['Circle of the Land', 'Circle of the Moon', 'Circle of Dreams', 'Circle of the Shepherd', 'Circle of Spores', 'Circle of Stars', 'Circle of Wildfire'],
    Monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements', 'Way of Kensei', 'Way of the Long Death', 'Way of Sun Soul', 'Way of Mercy', 'Way of Astral Self'],
    Sorcerer: ['Draconic Bloodline', 'Wild Magic', 'Divine Soul', 'Shadow Magic', 'Storm Sorcery', 'Aberrant Mind', 'Clockwork Soul'],
    Warlock: ['The Fiend', 'The Archfey', 'The Great Old One', 'The Celestial', 'The Hexblade', 'The Fathomless', 'The Genie'],
    Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith']
  },
  '3.5e': {
    Fighter: ['Weapon Master', 'Eldritch Knight', 'Dungeoneer', 'Armor Specialist', 'Duelist'],
    Wizard: ['Specialist Abjurer', 'Specialist Conjurer', 'Specialist Diviner', 'Specialist Enchanter', 'Specialist Evoker', 'Specialist Illusionist', 'Specialist Necromancer', 'Specialist Transmuter', 'Archmage'],
    Rogue: ['Shadowdancer', 'Assassin', 'Thief-Acrobat', 'Master Infiltrator'],
    Cleric: ['Radiant Servant', 'War Priest', 'Divine Champion', 'Hierophant'],
    Paladin: ['Defender of the Faith', 'Sacred Exorcist', 'Knight Hospitaler'],
    Ranger: ['Arcane Archer', 'Deepwarden', 'Horizon Walker'],
    Barbarian: ['Frenzied Berserker', 'Bear Warrior', 'Eye of Gruumsh'],
    Bard: ['Virtuoso', 'Fochlucan Lyrist', 'Sublime Chord'],
    Druid: ['Master of Many Forms', 'Hierophant', 'Planar Shepherd'],
    Monk: ['Sacred Fist', 'Tattooed Monk', 'Drunken Master'],
    Sorcerer: ['Dragon Disciple', 'Elemental Savant', 'Archmage']
  },
  'shadowrun': {
    'Street Samurai': ['Cyberware Muscle', 'Bioware Reflexes', 'Blade Master', 'Tank Samurai', 'Dual Pistoleer'],
    'Decker': ['Cyberdeck Specialist', 'Matrix Infiltrator', 'VR Combat Decker', 'Agent Operator'],
    'Rigger': ['Drone Master', 'Combat Aviator', 'Ground Transport Specialist', 'Vehicle Specialist'],
    'Physical Adept': ['Way of the Warrior', 'Way of the Invisible Voice', 'Way of the Open Hand', 'Elemental Strike'],
    'Spellcasting Mage': ['Combat Mage', 'Hermetic Researcher', 'Illusionist', 'Abjurer Mage'],
    'Shaman': ['Bear Totem', 'Raven Totem', 'Wolf Totem', 'Eagle Totem', 'Coyote Totem', 'Cat Totem'],
    'Face': ['Social Engineer', 'Corporate Infiltrator', 'Con Artist', 'Fixer-in-Training'],
    'Technomancer': ['Resonance Weaver', 'Complex Form Specialist', 'Sprite Master'],
    'Weapons Specialist': ['Heavy Weapons Gunner', 'Sniper', 'Explosives Expert'],
    'Bounty Hunter': ['Tracker', 'Capture Specialist', 'Cyber-Hound'],
    'Corporate Agent': ['Security Specialist', 'Covert Asset', 'Intelligence Analyst']
  },
  'pathfinder': {
    Fighter: ['Shield Specialist', 'Free-Hand Duelist', 'Two-Handed Crusher', 'Archer'],
    Wizard: ['School of Battle Magic', 'School of Mentalism', 'School of Unified Magical Theory', 'School of Protean Form'],
    Rogue: ['Thief Racket', 'Ruffian Racket', 'Scoundrel Racket', 'Mastermind Racket', 'Eldritch Trickster Racket'],
    Cleric: ['Cloistered Cleric Doctrine', 'Warpriest Doctrine'],
    'Champion (Paladin)': ['Cause of Justice (Paladin)', 'Cause of Redemption (Redeemer)', 'Cause of Liberator', 'Cause of Desecrator (Evil)', 'Cause of Tyrant'],
    Ranger: ['Flurry Hunter Edge', 'Precision Hunter Edge', 'Outwit Hunter Edge'],
    Barbarian: ['Dragon Instinct', 'Animal Instinct', 'Giant Instinct', 'Spirit Instinct', 'Fury Instinct', 'Superstition Instinct'],
    Bard: ['Maestro Muse', 'Enigma Muse', 'Polymath Muse', 'Warrior Muse'],
    Druid: ['Animal Order', 'Leaf Order', 'Storm Order', 'Wild Order', 'Flame Order'],
    Monk: ['Crane Stance', 'Dragon Stance', 'Mountain Stance', 'Wolf Stance', 'Tiger Stance', 'Monastic Archer'],
    Sorcerer: ['Imperial Bloodline', 'Draconic Bloodline', 'Angelic Bloodline', 'Demonic Bloodline', 'Aberrant Bloodline', 'Fey Bloodline'],
    Investigator: ['Empiricism Methodology', 'Forensic Medicine Methodology', 'Interrogation Methodology', 'Alchemical Sciences'],
    Alchemist: ['Bomber Research Field', 'Chirurgeon Research Field', 'Mutagenist Research Field', 'Toxicologist Research Field'],
    Swashbuckler: ['Battledancer Style', 'Braggart Style', 'Fencer Style', 'Gymnast Style', 'Wit Style'],
    Inventor: ['Armor Innovation', 'Weapon Innovation', 'Construct Innovation'],
    Thaumaturge: ['Amulet Implement', 'Chalice Implement', 'Lantern Implement', 'Regalia Implement', 'Weapon Implement'],
    Psychic: ['The Distant Whisper', 'The Infinite Eye', 'The Silent Whisper', 'The Tangible Dream'],
    Gunslinger: ['Way of the Sniper', 'Way of the Pistolero', 'Way of the Vanguard', 'Way of the Drifter'],
    Kineticist: ['Fire Elementalist', 'Water Elementalist', 'Earth Elementalist', 'Air Elementalist', 'Wood Elementalist', 'Metal Elementalist']
  },
  'cthulhu': {
    'Private Investigator': ['Missing Persons Specialist', 'Homicide Investigator', 'Industrial Spy'],
    'Dilettante': ['Thrill Seeker', 'Collector of Arcana', 'Philanthropist', 'High Society Patron'],
    'Professor / Academic': ['Archaeology & History', 'Linguistics & Cryptography', 'Physical Sciences', 'Folklore & Mythos'],
    'Journalist': ['Muckraker', 'Crime Reporter', 'Foreign Correspondent', 'Tabloid Sensationalist'],
    'Doctor / Physician': ['General Practitioner', 'Alienist (Psychiatrist)', 'Surgeon', 'Pathologist'],
    'Antiquarian': ['Rare Book Dealer', 'Relic Restorer', 'Museum Curator', 'Art Appraiser'],
    'Police Detective': ['Homicide Division', 'Vice & Gang Squad', 'Missing Persons', 'Forensic Specialist'],
    'Author': ['Horror / Weird Fiction Writer', 'Historical Biographer', 'Travel Writer', 'Investigative Journalist'],
    'Clergyman': ['Parish Priest', 'Exorcist', 'Theological Scholar', 'Missionary'],
    'Engineer': ['Mechanical Engineer', 'Electrical Specialist', 'Demolition Consultant', 'Locomotive Operator'],
    'Parapsychologist': ['Psychical Researcher', 'Medium', 'Séance Specialist', 'Hypnotist'],
    'Federal Agent': ['Prohibition Agent', 'Treasury Agent', 'Secret Service', 'Bureau of Investigation (BOI)'],
    'Bootlegger': ['Rum Runner', 'Speakeasy Owner', 'Getaway Driver', 'Mob Enforcer'],
    'Pilot': ['Barnstormer', 'Mail Aviator', 'Expedition Pilot', 'Military Veteran'],
    'Stage Performer': ['Illusionist & Escapologist', 'Mentalist', 'Dramatic Actor', 'Acrobat'],
    'Expedition Specialist': ['Wilderness Guide', 'Deep Sea Diver', 'Polar Explorer', 'Mountain Climber'],
    'Occultist': ['Hermetic Practitioner', 'Ritualist', 'Secret Society Member', 'Esoteric Bookseller']
  }
};

const ALIGNMENT_OPTIONS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned'
];

const HERO_NAMES = [
  'Sir Gareth the Bold', 'Lyra Bloodmoon', 'Thorin Ironshield', 'Eldrin Sunstrider',
  'Kaelen Drake', 'Vespera Shadowheart', 'Garrick Stonehammer', 'Astraea Moonfall',
  'Zephyr Ironwing', 'Morgana Vane', 'Theron Darkwood', 'Varian Skycaller',
  'Balthazar Grim', 'Cassandra Frost', 'Darin Heavyaxe', 'Sylvia Swiftfoot',
  'Valerius Silverhand', 'Niamh O’Connor', 'Ragnar Thunderbeard', 'Xander Vance'
];

const MONSTER_NAMES = [
  'Ancient Red Dragon', 'Goblin Warchief', 'Beholder Eye Tyrant', 'Mind Flayer Arcanist',
  'Owlbear Apex', 'Bugbear Chieftain', 'Lich Lord Netheril', 'Young Green Dragon',
  'Kobold Trapmaster', 'Minotaur Berserker', 'Gelatinous Cube', 'Frost Giant Jarl',
  'Vampire Lord Dracula', 'Hobgoblin Captain', 'Hydra of the Marsh', 'Skeleton Commander',
  'Gargoyle Guardian', 'Redcap Stalker', 'Shadow Demon', 'Manticore Hunter'
];

const BACKGROUND_OPTIONS = [
  'Folk Hero', 'Soldier', 'Criminal', 'Sage', 'Acolyte', 'Outlander',
  'Noble', 'Gladiator', 'Guild Artisan', 'Hermit', 'Urchin', 'Knight', 'Mercenary Veteran'
];

export const NewCharacterModal: React.FC<NewCharacterModalProps> = ({
  onClose,
  onCreate,
  initialEdition = '5e',
  initialIsMonster = false,
  initialIsVendor = false,
  enabledSystems
}) => {
  const startEdition = (enabledSystems && enabledSystems.length > 0 && !enabledSystems.includes(initialEdition))
    ? enabledSystems[0]
    : initialEdition;

  const [edition, setEdition] = useState<RuleEdition>(startEdition);
  const initialRaces = RACE_OPTIONS_BY_SYSTEM[initialEdition] || RACE_OPTIONS_BY_SYSTEM['5e'];
  const initialClasses = CLASS_OPTIONS_BY_SYSTEM[initialEdition] || CLASS_OPTIONS_BY_SYSTEM['5e'];
  const initialClass = initialClasses[0];
  const initialSubclasses = (SUBCLASS_MAP_BY_SYSTEM[initialEdition] && SUBCLASS_MAP_BY_SYSTEM[initialEdition][initialClass]) || ['General'];

  const [name, setName] = useState('');
  const [race, setRace] = useState(initialRaces[0]);
  const [characterClass, setCharacterClass] = useState(initialClass);
  const [subclass, setSubclass] = useState(initialSubclasses[0]);
  const [level, setLevel] = useState<number>(1);
  const [background, setBackground] = useState('Folk Hero');
  const [alignment, setAlignment] = useState('Neutral Good');
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
  const [useGestaltUA72, setUseGestaltUA72] = useState(false);
  const [useDefenseBonusUA109, setUseDefenseBonusUA109] = useState(false);
  const [useArmorAsDRUA109, setUseArmorAsDRUA109] = useState(false);

  // Portrait URL & HP Calculation Mode
  const [portraitUrl, setPortraitUrl] = useState('');
  const [hpCalcMode, setHpCalcMode] = useState<'Average' | 'Rolled' | 'Max'>('Average');

  // System switch handler - auto updates race, class, and subclass options
  const handleSystemChange = (newEd: RuleEdition) => {
    setEdition(newEd);
    const races = RACE_OPTIONS_BY_SYSTEM[newEd] || RACE_OPTIONS_BY_SYSTEM['5e'];
    const classes = CLASS_OPTIONS_BY_SYSTEM[newEd] || CLASS_OPTIONS_BY_SYSTEM['5e'];
    const newRace = races[0];
    const newClass = classes[0];
    const subMap = SUBCLASS_MAP_BY_SYSTEM[newEd] || SUBCLASS_MAP_BY_SYSTEM['5e'];
    const newSubclass = (subMap[newClass] || ['General'])[0];

    setRace(newRace);
    setCharacterClass(newClass);
    setSubclass(newSubclass);
  };

  // Handle class change & auto update subclass options for current system
  const handleClassChange = (newClass: string) => {
    setCharacterClass(newClass);
    const subMap = SUBCLASS_MAP_BY_SYSTEM[edition] || SUBCLASS_MAP_BY_SYSTEM['5e'];
    const availableSubclasses = subMap[newClass] || ['General'];
    if (availableSubclasses.length > 0) {
      setSubclass(availableSubclasses[0]);
    }
  };

  // Ability Scores
  const [str, setStr] = useState(15);
  const [dex, setDex] = useState(14);
  const [con, setCon] = useState(13);
  const [int, setInt] = useState(12);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(8);

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
    const racesList = RACE_OPTIONS_BY_SYSTEM[edition] || RACE_OPTIONS_BY_SYSTEM['5e'];
    const classesList = CLASS_OPTIONS_BY_SYSTEM[edition] || CLASS_OPTIONS_BY_SYSTEM['5e'];
    const randClass = classesList[Math.floor(Math.random() * classesList.length)];
    const subMap = SUBCLASS_MAP_BY_SYSTEM[edition] || SUBCLASS_MAP_BY_SYSTEM['5e'];
    const availableSubclasses = subMap[randClass] || ['General'];
    const randSubclass = availableSubclasses[Math.floor(Math.random() * availableSubclasses.length)];
    const randRace = racesList[Math.floor(Math.random() * racesList.length)];
    const randBg = BACKGROUND_OPTIONS[Math.floor(Math.random() * BACKGROUND_OPTIONS.length)];
    const randAlign = ALIGNMENT_OPTIONS[Math.floor(Math.random() * ALIGNMENT_OPTIONS.length)];
    const randLvl = Math.floor(Math.random() * 10) + 1;
    const randHpMode = (['Average', 'Rolled', 'Max'] as const)[Math.floor(Math.random() * 3)];

    const namesList = isMonster ? MONSTER_NAMES : HERO_NAMES;
    const randName = namesList[Math.floor(Math.random() * namesList.length)];
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

    setStr(roll4d6DropLowest());
    setDex(roll4d6DropLowest());
    setCon(roll4d6DropLowest());
    setInt(roll4d6DropLowest());
    setWis(roll4d6DropLowest());
    setCha(roll4d6DropLowest());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Hit points calculation based on selected hpCalcMode and CON mod
    const conMod = Math.floor((con - 10) / 2);
    const hitDieValue = characterClass === 'Barbarian' ? 12 : ['Fighter', 'Paladin', 'Ranger'].includes(characterClass) ? 10 : ['Sorcerer', 'Wizard'].includes(characterClass) ? 6 : 8;

    let hpMax = 10;
    if (hpCalcMode === 'Max') {
      hpMax = Math.max(1, level * (hitDieValue + conMod));
    } else if (hpCalcMode === 'Rolled') {
      // 1st level max + simulated rolled average (or average hit die roll rounded)
      const baseHp = hitDieValue + conMod;
      const additionalHp = (level - 1) * (Math.floor(hitDieValue * 0.6) + conMod);
      hpMax = Math.max(1, baseHp + additionalHp);
    } else {
      // Standard Average mode
      const baseHp = hitDieValue + conMod;
      const additionalHp = (level - 1) * (Math.floor(hitDieValue / 2) + 1 + conMod);
      hpMax = Math.max(1, baseHp + additionalHp);
    }

    const isCaster = ['Wizard', 'Sorcerer', 'Cleric', 'Druid', 'Bard', 'Warlock', 'Paladin', 'Ranger'].includes(characterClass);

    const newChar: CharacterData = {
      id: 'char-' + Date.now(),
      name: name.trim(),
      race,
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
        useGestaltUA72,
        useDefenseBonusUA109,
        useArmorAsDRUA109,
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
      armorClass: 10 + Math.floor((dex - 10) / 2),
      initiativeBonus: Math.floor((dex - 10) / 2),
      speed: race === 'Halfling' || race === 'Dwarf' || race === 'Gnome' ? 20 : 30,
      inspiration: false,

      deathSavesSuccesses: 0,
      deathSavesFailures: 0,

      abilities: {
        STR: { score: str },
        DEX: { score: dex },
        CON: { score: con },
        INT: { score: int },
        WIS: { score: wis },
        CHA: { score: cha },
      },

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
            proficient: false
          })),

      classFeatures: [
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
          name: 'Basic Strike',
          attackBonus: 2 + Math.floor((str - 10) / 2),
          damage: `1d6 ${Math.floor((str - 10) / 2) >= 0 ? '+' + Math.floor((str - 10) / 2) : Math.floor((str - 10) / 2)}`,
          damageType: 'Bludgeoning',
          range: '5 ft Melee'
        }
      ],

      wealth: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 15,
        pp: 0
      },

      inventory: [
        { id: 'inv-1', name: "Explorer's Pack", quantity: 1, weight: 10, equipped: true },
        { id: 'inv-2', name: 'Traveler’s Clothes', quantity: 1, weight: 4, equipped: true }
      ],

      isSpellcaster: isCaster,
      spellcastingAbility: ['Wizard', 'Artificer'].includes(characterClass) ? 'INT' : ['Cleric', 'Druid', 'Ranger'].includes(characterClass) ? 'WIS' : 'CHA',
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

      shadowrun: {
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

    onCreate(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-serif font-bold text-amber-300 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" /> Create New D&D Entry
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
          {/* Ruleset System & Theme Selection */}
          <div className="bg-stone-950 p-3.5 rounded-xl border border-theme-accent">
            <label className="block text-theme-accent font-bold mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-theme-accent" />
                Select TRPG System & Ruleset *
              </span>
              <span className="text-[11px] text-theme-light font-mono">Theme updates dynamically</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: '5e' as RuleEdition,
                  name: 'D&D 5th Edition (5e)',
                  desc: 'Proficiency Bonus, Advantage/Disadvantage, Gold Theme.',
                  color: 'border-amber-500 bg-amber-950/60 text-amber-200'
                },
                {
                  id: '3.5e' as RuleEdition,
                  name: 'D&D 3.5 Edition (3.5e)',
                  desc: 'BAB, Fort/Ref/Will Saves, Skill Ranks, Crimson Theme.',
                  color: 'border-rose-500 bg-rose-950/60 text-rose-200'
                },
                {
                  id: 'shadowrun' as RuleEdition,
                  name: 'Shadowrun',
                  desc: 'Cyberware, Decking, Rigging, Cyberpunk Neon Cyan Theme.',
                  color: 'border-cyan-500 bg-cyan-950/60 text-cyan-200'
                },
                {
                  id: 'pathfinder' as RuleEdition,
                  name: 'Pathfinder 2e',
                  desc: '3-Action System, Proficiency Tiers, Royal Purple Theme.',
                  color: 'border-purple-500 bg-purple-950/60 text-purple-200'
                },
                {
                  id: 'cthulhu' as RuleEdition,
                  name: 'Call of Cthulhu',
                  desc: 'Sanity Tracking, d100 Skills, Eldritch Emerald Theme.',
                  color: 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                },
              ].filter(sys => !enabledSystems || enabledSystems.includes(sys.id)).map((sys) => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleSystemChange(sys.id)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    edition === sys.id
                      ? `${sys.color} shadow-md ring-1 ring-current`
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <div>
                    <div className="font-serif font-bold text-xs">{sys.name}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{sys.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-400 mb-1">Character Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sir Gareth, Lyra Bloodmoon"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">
                {edition === 'shadowrun' ? 'Metatype (Race)' : edition === 'pathfinder' ? 'Ancestry (Race)' : edition === 'cthulhu' ? 'Origin / Heritage' : 'Race'}
              </label>
              <select
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
              >
                {(RACE_OPTIONS_BY_SYSTEM[edition] || RACE_OPTIONS_BY_SYSTEM['5e']).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
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
                  {(CLASS_OPTIONS_BY_SYSTEM[edition] || CLASS_OPTIONS_BY_SYSTEM['5e']).map(c => (
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
                  {((SUBCLASS_MAP_BY_SYSTEM[edition] && SUBCLASS_MAP_BY_SYSTEM[edition][characterClass]) || ['General']).map(sc => (
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
              <label className="block text-stone-400 mb-1">Background</label>
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="e.g. Soldier, Criminal, Sage"
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
              />
            </div>

            <div>
              <label className="block text-stone-400 mb-1">Alignment</label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100"
              >
                {ALIGNMENT_OPTIONS.map(a => (
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

          {/* Optional D&D Rules & Calculation Toggles */}
          <div className="bg-stone-950 border border-amber-900/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Optional D&D Rules & Calculation Toggles</span>
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

              {/* Flanking Rules */}
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
                          {['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Ranger', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock', 'Artificer'].map(c => (
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
              <label className="flex items-start gap-2 bg-stone-900 border border-stone-800 p-2.5 rounded-lg cursor-pointer hover:border-amber-600/40 transition sm:col-span-2">
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
            </div>
          </div>

          {/* Ability Scores Grid */}
          <div className="border-t border-stone-800 pt-3">
            <div className="text-amber-300 font-serif font-bold text-sm mb-2">Ability Scores</div>
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
