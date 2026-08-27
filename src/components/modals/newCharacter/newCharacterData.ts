import { RuleEdition } from '../../../types';
import { systemRegistry } from '../../../systems';

export function getRacesForSystem(edition: RuleEdition): string[] {
  const plugin = systemRegistry.getSystem(edition);
  if (plugin?.data?.races && plugin.data.races.length > 0) {
    return plugin.data.races;
  }
  return RACE_OPTIONS_BY_SYSTEM[edition] || RACE_OPTIONS_BY_SYSTEM['5e'];
}

export function getClassesForSystem(edition: RuleEdition): string[] {
  const plugin = systemRegistry.getSystem(edition);
  if (plugin?.data?.classes && plugin.data.classes.length > 0) {
    return plugin.data.classes;
  }
  return CLASS_OPTIONS_BY_SYSTEM[edition] || CLASS_OPTIONS_BY_SYSTEM['5e'];
}

export function getSubclassesForSystemClass(edition: RuleEdition, clsName: string): string[] {
  const map = SUBCLASS_MAP_BY_SYSTEM[edition] || SUBCLASS_MAP_BY_SYSTEM['5e'];
  return map[clsName] || ['General'];
}

export const RACE_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
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

export const CLASS_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
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

export const SUBCLASS_MAP_BY_SYSTEM: Record<RuleEdition, Record<string, string[]>> = {
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

export const ALIGNMENT_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
  '5e': [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'
  ],
  '3.5e': [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'
  ],
  'pathfinder': [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'
  ],
  'shadowrun': [
    'Professional (Honor Code)',
    'Anti-Corp Rebel (Street Punk)',
    'Mercenary (Highest Nuyen Bidder)',
    'Robin Hood (Protector of SINless)',
    'Corporate Loyalist / Double Agent',
    'Shadow Fixer / Pragmatist',
    'Survivalist (Look Out For #1)'
  ],
  'cthulhu': [
    'Rational Skeptic & Empiricist',
    'Academic Scholar & Purist',
    'Occult Researcher & Believer',
    'Devout & Religious',
    'Nihilistic Pragmatist',
    'Humanitarian & Protector',
    'Patriotic Federal Agent',
    'Artistic Visionary'
  ]
};

export const ALIGNMENT_OPTIONS = ALIGNMENT_OPTIONS_BY_SYSTEM['5e'];

export const HERO_NAMES_BY_SYSTEM: Record<RuleEdition, string[]> = {
  '5e': [
    'Sir Gareth the Bold', 'Lyra Bloodmoon', 'Thorin Ironshield', 'Eldrin Sunstrider',
    'Kaelen Drake', 'Vespera Shadowheart', 'Garrick Stonehammer', 'Astraea Moonfall',
    'Zephyr Ironwing', 'Morgana Vane', 'Theron Darkwood', 'Varian Skycaller',
    'Balthazar Grim', 'Cassandra Frost', 'Darin Heavyaxe', 'Sylvia Swiftfoot',
    'Valerius Silverhand', 'Niamh O’Connor', 'Ragnar Thunderbeard', 'Xander Vance'
  ],
  '3.5e': [
    'Regdar (Fighter)', 'Mialee (Wizard)', 'Lidda (Rogue)', 'Jozan (Cleric)',
    'Krusk (Barbarian)', 'Hennet (Sorcerer)', 'Nebin (Illusionist)', 'Ember (Monk)',
    'Soveliss (Ranger)', 'Vadania (Druid)', 'Gimble (Bard)', 'Alhandra (Paladin)'
  ],
  'pathfinder': [
    'Valeros the Fighter', 'Seoni the Sorceress', 'Merisiel the Rogue', 'Kyra the Cleric',
    'Ezren the Wizard', 'Amiri the Barbarian', 'Lem the Bard', 'Harsk the Ranger',
    'Sajan the Monk', 'Fumbus the Alchemist', 'Jirelle the Swashbuckler', 'Feiya the Witch'
  ],
  'shadowrun': [
    'Ghost_Zero', 'Chrome_Viper', 'Null_Pointer', 'Neon_Spectre',
    'Razor_Jack', 'Hex_Gunslinger', 'Valkyrie_Corpo', 'Wirehead_Sam',
    'Glitch_Operative', 'Troll_Bouncer', 'Matrix_Phantom', 'Spitfire_Rigger'
  ],
  'cthulhu': [
    'Dr. Arthur Pendleton', 'Evelyn Reed', 'Prof. Walter Gilmour', 'Inspector Thomas Blackwood',
    'Constance Holloway', 'Capt. Lawrence Vance', 'Beatrice Winthrop', 'Father Jerome O’Malley',
    'Harvey Montgomery', 'Lillian Delacroix', 'Jonathan Harker-Vane', 'Eleanor Vance'
  ]
};

export const HERO_NAMES = HERO_NAMES_BY_SYSTEM['5e'];

export const BACKGROUND_OPTIONS_BY_SYSTEM: Record<RuleEdition, string[]> = {
  '5e': [
    'Folk Hero', 'Soldier', 'Criminal', 'Sage', 'Acolyte', 'Outlander',
    'Noble', 'Gladiator', 'Guild Artisan', 'Hermit', 'Urchin', 'Knight', 'Mercenary Veteran'
  ],
  '3.5e': [
    'Folk Hero', 'Soldier', 'Criminal', 'Sage', 'Acolyte', 'Outlander',
    'Noble', 'Gladiator', 'Guild Artisan', 'Hermit', 'Urchin', 'Knight', 'Mercenary Veteran'
  ],
  'pathfinder': [
    'Field Medic', 'Street Urchin', 'Scholar', 'Warrior', 'Criminal', 'Nomad',
    'Noble', 'Emissary', 'Farmhand', 'Laborer', 'Tinker', 'Bounty Hunter', 'Gladiator'
  ],
  'shadowrun': [
    'Street Runner', 'Ex-Corpo Security Asset', 'SINless Hacker', 'Military Veteran',
    'Barrens Scavenger', 'Drone Jockey', 'Smuggler', 'Underground Pit Fighter', 'Bounty Tracker'
  ],
  'cthulhu': [
    'Miskatonic University Faculty', 'Arkham Asylum Alienist', 'Boston High Society',
    'Police Academy Graduate', 'Expedition Veteran', 'Wealthy Heir / Heiress',
    'Foreign War Correspondent', 'Occult Bookshop Proprietor', 'Federal Bureau Agent'
  ]
};

export const BACKGROUND_OPTIONS = BACKGROUND_OPTIONS_BY_SYSTEM['5e'];

export function getAlignmentsForSystem(edition: RuleEdition): string[] {
  return ALIGNMENT_OPTIONS_BY_SYSTEM[edition] || ALIGNMENT_OPTIONS_BY_SYSTEM['5e'];
}

export function getBackgroundsForSystem(edition: RuleEdition): string[] {
  return BACKGROUND_OPTIONS_BY_SYSTEM[edition] || BACKGROUND_OPTIONS_BY_SYSTEM['5e'];
}

export function getHeroNamesForSystem(edition: RuleEdition): string[] {
  return HERO_NAMES_BY_SYSTEM[edition] || HERO_NAMES_BY_SYSTEM['5e'];
}

export function getNamePlaceholderForSystem(edition: RuleEdition): string {
  switch (edition) {
    case 'shadowrun':
      return 'e.g. Ghost_Zero, Chrome_Viper, Null_Pointer';
    case 'cthulhu':
      return 'e.g. Dr. Arthur Pendleton, Evelyn Reed';
    case 'pathfinder':
      return 'e.g. Valeros the Fighter, Seoni, Merisiel';
    case '3.5e':
      return 'e.g. Regdar, Mialee, Lidda';
    default:
      return 'e.g. Sir Gareth, Lyra Bloodmoon';
  }
}

export const MONSTER_NAMES = [
  'Ancient Red Dragon', 'Goblin Warchief', 'Beholder Eye Tyrant', 'Mind Flayer Arcanist',
  'Owlbear Apex', 'Bugbear Chieftain', 'Lich Lord Netheril', 'Young Green Dragon',
  'Kobold Trapmaster', 'Minotaur Berserker', 'Gelatinous Cube', 'Frost Giant Jarl',
  'Vampire Lord Dracula', 'Hobgoblin Captain', 'Hydra of the Marsh', 'Skeleton Commander',
  'Gargoyle Guardian', 'Redcap Stalker', 'Shadow Demon', 'Manticore Hunter'
];

