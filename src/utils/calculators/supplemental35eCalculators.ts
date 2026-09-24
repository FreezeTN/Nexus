/**
 * D&D 3.5e Supplemental Subsystems & Engines Calculators
 * Comprehensive rules engines for:
 * 1. Warlock & Dragonfire Adept (Invocations, Eldritch Blast, Breath Weapons)
 * 2. Factotum (Inspiration Points, Cunning tactical spends, Arcane Dilettante)
 * 3. Tome of Battle: The Book of Nine Swords (Initiator level, Maneuvers, Stances, Steely Resolve)
 * 4. Artificer (Craft Reserve, Item Creation Feats, Infusions)
 * 5. Binder (Pact Magic, Vestiges catalog, Binding checks, Signs & Cooldowns)
 * 6. Magic of Incarnum (Essentia pool, Essentia capacity, Soulmelds, Chakra Binds)
 * 7. Auras & Ki (Dragon Shaman Draconic Auras, Marshal Auras, Ninja Ki pool)
 */

// =========================================================================
// 1. WARLOCK & DRAGONFIRE ADEPT
// =========================================================================

export function getWarlockBlastDice(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 9;
  if (lvl >= 17) return 8;
  if (lvl >= 14) return 7;
  if (lvl >= 11) return 6;
  if (lvl >= 9) return 5;
  if (lvl >= 7) return 4;
  if (lvl >= 5) return 3;
  if (lvl >= 3) return 2;
  return 1;
}

export function getDragonfireBreathDice(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 9;
  if (lvl >= 17) return 8;
  if (lvl >= 14) return 7;
  if (lvl >= 11) return 6;
  if (lvl >= 9) return 5;
  if (lvl >= 7) return 4;
  if (lvl >= 5) return 3;
  if (lvl >= 3) return 2;
  return 1;
}

export interface InvocationDefinition {
  name: string;
  grade: 'Least' | 'Lesser' | 'Greater' | 'Dark';
  type: 'Blast Shape' | 'Eldritch Essence' | 'Other' | 'Breath Effect';
  equivalentSpellLevel: number;
  description: string;
}

export const DND35E_WARLOCK_INVOCATIONS: InvocationDefinition[] = [
  // Least (Complete Arcane)
  { name: 'Eldritch Spear', grade: 'Least', type: 'Blast Shape', equivalentSpellLevel: 2, description: 'Increases the range of Eldritch Blast from 60 ft to 250 ft with no range increment.' },
  { name: 'Hideous Blow', grade: 'Least', type: 'Blast Shape', equivalentSpellLevel: 1, description: 'Channels your Eldritch Blast as part of a melee weapon attack on a single target.' },
  { name: 'Brimstone Blast', grade: 'Least', type: 'Eldritch Essence', equivalentSpellLevel: 3, description: 'Changes blast to Fire damage; target caught on fire (1d6 fire/round) on failed Reflex save.' },
  { name: 'Frightful Blast', grade: 'Least', type: 'Eldritch Essence', equivalentSpellLevel: 2, description: 'Target becomes shaken for 1 minute on a failed Will save.' },
  { name: 'Sickening Blast', grade: 'Least', type: 'Eldritch Essence', equivalentSpellLevel: 2, description: 'Target becomes sickened for 1 minute on a failed Fortitude save.' },
  { name: 'All-Seeing Eyes', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Gain Comprehend Languages (written) and +6 bonus on Search and Spot checks for 24 hours.' },
  { name: 'Baleful Utterance', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Speak a word of the Dark Speech to shatter crystalline, metal, or brittle objects as the Shatter spell.' },
  { name: 'Beguiling Influence', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Gain a +6 bonus on Bluff, Diplomacy, and Intimidate checks for 24 hours.' },
  { name: 'Dark One’s Own Luck', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Add your Charisma modifier as a luck bonus to one saving throw type for 24 hours.' },
  { name: 'Darkness', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Use Darkness at will with a 20-foot radius.' },
  { name: 'Devil’s Sight', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'See normally in darkness and magical darkness up to 30 feet.' },
  { name: 'Earthen Grasp', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'An earthen arm erupts from the ground to grapple opponents.' },
  { name: 'Entropic Warding', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Chaotic winds deflect incoming ranged missile attacks with a 20% miss chance and leave no trail.' },
  { name: 'Leaps and Bounds', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Gain a +6 bonus on Balance, Jump, and Tumble checks for 24 hours.' },
  { name: 'See the Unseen', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Gain darkvision 60 ft and see invisible creatures and objects as See Invisibility for 24 hours.' },
  { name: 'Spiderwalk', grade: 'Least', type: 'Other', equivalentSpellLevel: 2, description: 'Gain Spider Climb and immunity to web effects for 24 hours.' },

  // Lesser
  { name: 'Eldritch Chain', grade: 'Lesser', type: 'Blast Shape', equivalentSpellLevel: 4, description: 'Blast arcs to additional secondary targets (1 extra target per 5 caster levels) dealing half damage.' },
  { name: 'Hellrime Blast', grade: 'Lesser', type: 'Eldritch Essence', equivalentSpellLevel: 4, description: 'Changes blast to Cold damage; targets suffer -2 Dexterity penalty on failed Fortitude save.' },
  { name: 'Beshadowed Blast', grade: 'Lesser', type: 'Eldritch Essence', equivalentSpellLevel: 4, description: 'Blinds target for 1 round on a failed Fortitude save.' },
  { name: 'Charm', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Charm Monster at will with a single target.' },
  { name: 'Curse of Despair', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Bestow Curse by touch or bestow -1 attack/save penalties on a failed Will save.' },
  { name: 'Fell Flight', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 3, description: 'Fly at your base land speed with good maneuverability for 24 hours.' },
  { name: 'The Dead Walk', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Animate Dead at will (requires 25 gp black onyx for permanent undead, or temporary without component).' },
  { name: 'Voracious Dispelling', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Dispel Magic at will, dealing 1 point of damage per spell level dispelled to the spell caster or item holder.' },
  { name: 'Walk in Shadows', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Invisibility for 24 hours, breaks on attack; also gain +5 on Hide and Move Silently.' },
  { name: 'Wall of Gloom', grade: 'Lesser', type: 'Other', equivalentSpellLevel: 4, description: 'Summon an ominous barrier of impenetrable shadow that halts movement.' },

  // Greater
  { name: 'Eldritch Cone', grade: 'Greater', type: 'Blast Shape', equivalentSpellLevel: 5, description: 'Blast forms a 30-foot cone dealing blast damage to all creatures within (Reflex half).' },
  { name: 'Bewitching Blast', grade: 'Greater', type: 'Eldritch Essence', equivalentSpellLevel: 5, description: 'Confuses target for 1 round on a failed Will save.' },
  { name: 'Vitriolic Blast', grade: 'Greater', type: 'Eldritch Essence', equivalentSpellLevel: 6, description: 'Changes blast to Acid damage, bypasses Spell Resistance entirely, and deals continuous acid damage for 2 rounds!' },
  { name: 'Chilling Tentacles', grade: 'Greater', type: 'Other', equivalentSpellLevel: 5, description: 'Evard’s Black Tentacles that also deal 2d6 cold damage each round to everyone within.' },
  { name: 'Devour Magic', grade: 'Greater', type: 'Other', equivalentSpellLevel: 6, description: 'Targeted Greater Dispel Magic; gain 5 temporary HP per spell level dispelled.' },
  { name: 'Enervating Shadow', grade: 'Greater', type: 'Other', equivalentSpellLevel: 5, description: 'Surround self in darkness that grants total concealment and imposes a -4 Strength penalty to adjacent foes.' },
  { name: 'Tenacious Plague', grade: 'Greater', type: 'Other', equivalentSpellLevel: 6, description: 'Summon two swarms of magical biting locusts.' },
  { name: 'Wall of Perilous Flame', grade: 'Greater', type: 'Other', equivalentSpellLevel: 5, description: 'Curtain of fire dealing 2d6+CL fire damage; half damage is pure supernatural eldritch energy bypassing fire resistance.' },

  // Dark
  { name: 'Eldritch Doom', grade: 'Dark', type: 'Blast Shape', equivalentSpellLevel: 8, description: 'Blast detonates in a 20-foot radius burst centered on you, dealing blast damage to all foes (Reflex half).' },
  { name: 'Utterdark Blast', grade: 'Dark', type: 'Eldritch Essence', equivalentSpellLevel: 8, description: 'Infuses blast with negative energy; target gains 2 negative levels on a failed Fortitude save.' },
  { name: 'Dark Foresight', grade: 'Dark', type: 'Other', equivalentSpellLevel: 9, description: 'Foresight as the 9th-level spell for 24 hours, communicating telepathically with a chosen ally.' },
  { name: 'Retributive Phantasm', grade: 'Dark', type: 'Other', equivalentSpellLevel: 8, description: 'Create an illusory duplicate that detonates into pure sonic stun upon being struck.' },
  { name: 'Word of Changing', grade: 'Dark', type: 'Other', equivalentSpellLevel: 9, description: 'Baleful Polymorph at will, transforming a creature into a harmless animal permanently.' }
];

// =========================================================================
// 2. FACTOTUM (DUNGEONSCAPE)
// =========================================================================

export function getFactotumMaxInspiration(level: number, fontOfInspirationFeats: number = 0): number {
  const lvl = Math.max(1, level || 1);
  // Base progression: 3 at 1st-2nd, 4 at 3rd-5th, 5 at 6th-8th, 6 at 9th-11th, 7 at 12th-14th, 8 at 15th-17th, 9 at 18th-19th, 10 at 20th
  let base = 3;
  if (lvl >= 20) base = 10;
  else if (lvl >= 18) base = 9;
  else if (lvl >= 15) base = 8;
  else if (lvl >= 12) base = 7;
  else if (lvl >= 9) base = 6;
  else if (lvl >= 6) base = 5;
  else if (lvl >= 3) base = 4;

  // Font of Inspiration feat grants triangular scaling: 1st grants 1 pt, 2nd grants +2, 3rd grants +3, etc.
  const n = Math.max(0, fontOfInspirationFeats || 0);
  const featPoints = (n * (n + 1)) / 2;
  return base + featPoints;
}

export function getFactotumDilettanteProgression(level: number): { slots: number; maxSpellLevel: number } {
  const lvl = Math.max(1, level || 1);
  // Table 1-1: Factotum Arcane Dilettante
  if (lvl >= 20) return { slots: 8, maxSpellLevel: 7 };
  if (lvl >= 18) return { slots: 7, maxSpellLevel: 6 };
  if (lvl >= 15) return { slots: 6, maxSpellLevel: 5 };
  if (lvl >= 12) return { slots: 5, maxSpellLevel: 4 };
  if (lvl >= 9) return { slots: 4, maxSpellLevel: 3 };
  if (lvl >= 7) return { slots: 3, maxSpellLevel: 2 };
  if (lvl >= 4) return { slots: 2, maxSpellLevel: 1 };
  if (lvl >= 2) return { slots: 1, maxSpellLevel: 0 };
  return { slots: 0, maxSpellLevel: 0 };
}

// =========================================================================
// 3. TOME OF BATTLE: THE BOOK OF NINE SWORDS
// =========================================================================

export type MartialDiscipline =
  | 'Desert Wind'
  | 'Devoted Spirit'
  | 'Diamond Mind'
  | 'Iron Heart'
  | 'Setting Sun'
  | 'Shadow Hand'
  | 'Stone Dragon'
  | 'Tiger Claw'
  | 'White Raven';

export interface MartialManeuverDefinition {
  name: string;
  discipline: MartialDiscipline;
  level: number;
  type: 'Strike' | 'Boost' | 'Counter' | 'Stance';
  initiationAction: 'Standard action' | 'Swift action' | 'Immediate action' | 'Full-round action';
  range: string;
  targetOrArea: string;
  duration: string;
  description: string;
}

export function getInitiatorLevel(classLevel: number, otherLevels: number = 0): number {
  return Math.max(1, Math.floor(classLevel + otherLevels * 0.5));
}

export function getCrusaderSteelyResolve(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 30;
  if (lvl >= 16) return 25;
  if (lvl >= 12) return 20;
  if (lvl >= 8) return 15;
  if (lvl >= 4) return 10;
  return 5;
}

export function getCrusaderFuriousCounterstrikeBonus(damageInPool: number): number {
  if (damageInPool >= 30) return 6;
  if (damageInPool >= 25) return 5;
  if (damageInPool >= 20) return 4;
  if (damageInPool >= 15) return 3;
  if (damageInPool >= 10) return 2;
  if (damageInPool >= 1) return 1;
  return 0;
}

export const DND35E_TOME_OF_BATTLE_MANEUVERS: MartialManeuverDefinition[] = [
  // Devoted Spirit (Crusader)
  { name: 'Crusader’s Strike', discipline: 'Devoted Spirit', level: 1, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Make a melee attack; if it hits, you or an ally within 10 ft heals 1d6 + 1/initiator level (max +5) hit points.' },
  { name: 'Martial Spirit', discipline: 'Devoted Spirit', level: 1, type: 'Stance', initiationAction: 'Swift action', range: 'Personal', targetOrArea: 'You', duration: 'Stance', description: 'Whenever you or an ally within 30 ft hit an opponent in melee, you or an ally within 30 ft heal 2 hit points.' },
  { name: 'Shield Block', discipline: 'Devoted Spirit', level: 2, type: 'Counter', initiationAction: 'Immediate action', range: 'Touch', targetOrArea: 'Adjacent ally', duration: 'Instantaneous', description: 'Grant an adjacent ally your shield AC bonus + 4 against one melee attack.' },
  { name: 'Revitalizing Strike', discipline: 'Devoted Spirit', level: 3, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Successful melee attack heals you or an ally within 10 ft for 3d6 + 1/initiator level (max +10) hit points.' },
  { name: 'Divine Surge', discipline: 'Devoted Spirit', level: 4, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Melee strike dealing an additional +8d8 damage with an accurate blow.' },
  { name: 'Thicket of Blades', discipline: 'Devoted Spirit', level: 3, type: 'Stance', initiationAction: 'Swift action', range: 'Personal', targetOrArea: 'You', duration: 'Stance', description: 'Any 5-foot step or movement made by opponents within your threatened area provokes an attack of opportunity.' },
  { name: 'Rallying Strike', discipline: 'Devoted Spirit', level: 6, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Attack deals +4d6 damage; all allies within 30 ft heal 3d6 + 1/initiator level (max +15) HP.' },
  { name: 'Immortal Fortitude', discipline: 'Devoted Spirit', level: 8, type: 'Stance', initiationAction: 'Swift action', range: 'Personal', targetOrArea: 'You', duration: 'Stance', description: 'You cannot die from hit point damage or gain negative hit points while this stance remains active (Fortitude save DC = damage dealt).' },
  { name: 'Strike of Righteous Vitality', discipline: 'Devoted Spirit', level: 9, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Attack hits for +4d6 damage and grants a Heal spell (10 HP/level, status cured) to yourself or an ally within 10 ft!' },

  // Iron Heart (Warblade)
  { name: 'Steely Strike', discipline: 'Iron Heart', level: 1, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'One creature', duration: 'Instantaneous', description: 'Gain a +4 bonus on melee attack roll, but all other enemies gain +4 to hit you for 1 round.' },
  { name: 'Steel Wind', discipline: 'Iron Heart', level: 1, type: 'Strike', initiationAction: 'Standard action', range: 'Melee attack', targetOrArea: 'Two creatures', duration: 'Instantaneous', description: 'Make a single melee attack against two different opponents you threaten.' },
  { name: 'Punishing Stance', discipline: 'Iron Heart', level: 1, type: 'Stance', initiationAction: 'Swift action', range: 'Personal', targetOrArea: 'You', duration: 'Stance', description: 'Melee strikes deal an extra +1d6 damage, but you take a -2 penalty to AC.' },
  { name: 'Wall of Blades', discipline: 'Iron Heart', level: 2, type: 'Counter', initiationAction: 'Immediate action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Make an attack roll in response to an incoming attack; your attack roll result replaces your AC if higher!' },
  { name: 'Iron Heart Surge', discipline: 'Iron Heart', level: 3, type: 'Boost', initiationAction: 'Standard action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Immediately end any one condition, spell, or harmful effect affecting you, and gain +2 morale bonus on attacks for 1 round!' },
  { name: 'Lightning Recovery', discipline: 'Iron Heart', level: 4, type: 'Counter', initiationAction: 'Immediate action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Reroll a missed melee attack with a +2 bonus.' },
  { name: 'Dancing Mongoose', discipline: 'Tiger Claw', level: 8, type: 'Boost', initiationAction: 'Swift action', range: 'Personal', targetOrArea: 'You', duration: 'End of turn', description: 'Make two extra melee attacks with each weapon wielded during a full attack at your highest attack bonus.' },
  { name: 'Time Stands Still', discipline: 'Diamond Mind', level: 9, type: 'Strike', initiationAction: 'Full-round action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Take two full attack actions back-to-back in a single turn!' },

  // Diamond Mind & White Raven
  { name: 'Moment of Perfect Mind', discipline: 'Diamond Mind', level: 1, type: 'Counter', initiationAction: 'Immediate action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Substitute a Concentration check result for a Will saving throw.' },
  { name: 'Action Before Thought', discipline: 'Diamond Mind', level: 2, type: 'Counter', initiationAction: 'Immediate action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Substitute a Concentration check result for a Reflex saving throw.' },
  { name: 'Mind Over Body', discipline: 'Diamond Mind', level: 3, type: 'Counter', initiationAction: 'Immediate action', range: 'Personal', targetOrArea: 'You', duration: 'Instantaneous', description: 'Substitute a Concentration check result for a Fortitude saving throw.' },
  { name: 'Leading the Charge', discipline: 'White Raven', level: 1, type: 'Stance', initiationAction: 'Swift action', range: '60-ft aura', targetOrArea: 'You and allies', duration: 'Stance', description: 'You and all allies within 60 ft gain bonus damage on charge attacks equal to your initiator level.' },
  { name: 'White Raven Tactics', discipline: 'White Raven', level: 3, type: 'Boost', initiationAction: 'Swift action', range: '10 ft', targetOrArea: 'One ally', duration: 'Instantaneous', description: 'An ally’s initiative count changes immediately to act right after your turn!' }
];

// =========================================================================
// 4. ARTIFICER (EBERRON)
// =========================================================================

export function getArtificerCraftReserve(level: number): number {
  const lvl = Math.max(1, level || 1);
  const reserveByLevel: Record<number, number> = {
    1: 20,
    2: 40,
    3: 100,
    4: 150,
    5: 300,
    6: 450,
    7: 700,
    8: 900,
    9: 1200,
    10: 1500,
    11: 2000,
    12: 2500,
    13: 3000,
    14: 3600,
    15: 4300,
    16: 5000,
    17: 6000,
    18: 7000,
    19: 8500,
    20: 10000
  };
  return reserveByLevel[lvl] || 20;
}

export interface ArtificerBonusFeatStatus {
  featName: string;
  unlockedLevel: number;
  isUnlocked: boolean;
}

export function getArtificerBonusFeats(level: number): ArtificerBonusFeatStatus[] {
  const lvl = Math.max(1, level || 1);
  return [
    { featName: 'Scribe Scroll', unlockedLevel: 1, isUnlocked: lvl >= 1 },
    { featName: 'Brew Potion', unlockedLevel: 2, isUnlocked: lvl >= 2 },
    { featName: 'Craft Wondrous Item', unlockedLevel: 3, isUnlocked: lvl >= 3 },
    { featName: 'Craft Homunculus', unlockedLevel: 4, isUnlocked: lvl >= 4 },
    { featName: 'Craft Magic Arms & Armor', unlockedLevel: 5, isUnlocked: lvl >= 5 },
    { featName: 'Craft Wand', unlockedLevel: 7, isUnlocked: lvl >= 7 },
    { featName: 'Craft Rod', unlockedLevel: 9, isUnlocked: lvl >= 9 },
    { featName: 'Craft Staff', unlockedLevel: 12, isUnlocked: lvl >= 12 },
    { featName: 'Forge Ring', unlockedLevel: 14, isUnlocked: lvl >= 14 }
  ];
}

// =========================================================================
// 5. BINDER (TOME OF MAGIC)
// =========================================================================

export function getBinderMaxVestiges(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 4;
  if (lvl >= 14) return 3;
  if (lvl >= 8) return 2;
  return 1;
}

export interface VestigeDefinition {
  name: string;
  title: string;
  level: number;
  bindingDc: number;
  specialRequirement?: string;
  sign: string;
  influence: string;
  grantedAbilities: string[];
}

export const DND35E_VESTIGES_COMPENDIUM: VestigeDefinition[] = [
  {
    name: 'Amon',
    title: 'The Void Before the Altar',
    level: 1,
    bindingDc: 15,
    sign: 'Two ram horns curl from your forehead.',
    influence: 'Despises priests and altars; you must refuse clerical blessings or desecrate altars you encounter.',
    grantedAbilities: ['Fire Breath (1d6/level, 5-round cooldown)', 'Ram Attack (1d6 gore attack)', 'Darkvision 60 ft']
  },
  {
    name: 'Aym',
    title: 'Queen of the Golden Fling',
    level: 1,
    bindingDc: 15,
    sign: 'A third eye opens on your brow and your fingers turn gold.',
    influence: 'Deep avarice; you demand the lion’s share of treasure and refuse to give gold to beggars.',
    grantedAbilities: ['Halo of Fire (1d6 fire aura)', 'Ruinous Blows (Double damage against objects & structures)', 'Gold Touch', 'Resistance to Fire 10']
  },
  {
    name: 'Naberius',
    title: 'The Grinning Hound',
    level: 1,
    bindingDc: 15,
    sign: 'Your voice is raspy and hound-like, and you sprout a canine tail.',
    influence: 'Loquacious; you cannot resist engaging in witty banter and mock serious individuals.',
    grantedAbilities: ['Naberius’s Skills (Untrained checks + trained benefits)', 'Silver Tongue (Take 10 on Bluff and Diplomacy as standard actions)', 'Faster Ability Healing (Heal 1 point of ability damage every round!)']
  },
  {
    name: 'Ronove',
    title: 'The Iron Maiden',
    level: 1,
    bindingDc: 15,
    sign: 'Skin appears bruised, and you cannot walk without a quiet metallic clanking sound.',
    influence: 'Dislikes physical contact; you strictly refrain from touching others or being touched.',
    grantedAbilities: ['Cold Sun (Light with chilling touch)', 'Ronove’s Fists (Unarmed damage as a monk)', 'Sprint (Fast movement +10 ft)', 'Feather Fall', 'Far Hand (Telekinesis 10 lbs)']
  },
  {
    name: 'Focalor',
    title: 'Prince of Tears',
    level: 3,
    bindingDc: 20,
    sign: 'Grief pours from your eyes in continuous tears; you are damp and smell of seawater.',
    influence: 'Gloomy and pessimistic; you groan and lament doom whenever danger is near.',
    grantedAbilities: ['Lightning Strike (3d6 electricity damage, 5-round cooldown)', 'Aura of Sadness (-2 on attacks, saves, and checks to adjacent foes)', 'Water Breathing', 'Puff of Breath (Gust of wind)']
  },
  {
    name: 'Malphas',
    title: 'The Turnfeather',
    level: 2,
    bindingDc: 16,
    sign: 'Tongue turns black and feathers sprout from your shoulders and chest.',
    influence: 'Paranoia; you refuse to drink or eat anything not prepared in front of you.',
    grantedAbilities: ['Bird’s Eye Aerial Scout (Summon raven scout and see through its eyes)', 'Sneak Attack (+Xd6 precision damage)', 'Invisibility at will', 'Poison Use']
  },
  {
    name: 'Savnok',
    title: 'The Instigator of Scion',
    level: 2,
    bindingDc: 20,
    sign: 'You appear clad in ornate spectral full plate; a gaping bullet hole pierces your breastplate.',
    influence: 'Defiant stubborness; you refuse to yield territory or withdraw from any duel.',
    grantedAbilities: ['Savnok’s Armor (Summon masterwork full plate at will)', 'Move Armor (Damage reduction 1/piercing to 5/piercing)', 'Savnok’s Swap (Swap places with an ally as a standard action)']
  }
];

// =========================================================================
// 6. MAGIC OF INCARNUM
// =========================================================================

export function getEssentiaCapacityCap(characterLevel: number): number {
  const lvl = Math.max(1, characterLevel || 1);
  if (lvl >= 18) return 4;
  if (lvl >= 12) return 3;
  if (lvl >= 6) return 2;
  return 1;
}

export function getBaseEssentiaPool(className: string, classLevel: number): number {
  const lvl = Math.max(1, classLevel || 1);
  const cls = (className || '').toLowerCase();
  if (cls.includes('incarnate')) {
    // Incarnate Essentia table: 1 at 1st, 2 at 2nd, 3 at 3rd, scaling up to 20 at 20th
    return lvl;
  }
  if (cls.includes('totemist')) {
    // Totemist Essentia: 1 at 1st, 2 at 2nd, 3 at 3rd, scaling to 20 at 20th
    return lvl;
  }
  if (cls.includes('soulborn')) {
    // Soulborn Essentia: starts at lvl 6
    if (lvl < 6) return 0;
    return Math.floor((lvl - 4) * 0.75);
  }
  return 0;
}

export const INCARNUM_CHAKRA_SLOTS = [
  'Crown',
  'Feet',
  'Hands',
  'Arms',
  'Brow',
  'Shoulders',
  'Throat',
  'Waist',
  'Heart',
  'Soul'
] as const;

// =========================================================================
// 7. AURAS & KI (DRAGON SHAMAN, MARSHAL, NINJA)
// =========================================================================

export function getDragonShamanAuraBonus(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 5;
  if (lvl >= 15) return 4;
  if (lvl >= 10) return 3;
  if (lvl >= 5) return 2;
  return 1;
}

export function getMarshalMajorAuraBonus(level: number): number {
  const lvl = Math.max(1, level || 1);
  if (lvl >= 20) return 4;
  if (lvl >= 14) return 3;
  if (lvl >= 7) return 2;
  if (lvl >= 2) return 1;
  return 0;
}

export function getNinjaMaxKiPoints(level: number, wisModifier: number): number {
  const lvl = Math.max(1, level || 1);
  const halfLvl = Math.floor(lvl / 2);
  return Math.max(1, halfLvl + Math.max(0, wisModifier));
}

export const DRAGON_SHAMAN_AURAS = [
  { name: 'Energy Shield', effect: 'Any foe striking an ally in melee takes 2x aura bonus elemental damage.' },
  { name: 'Power', effect: 'Allies gain aura bonus on melee damage rolls and bonus on rolls to confirm critical hits.' },
  { name: 'Presence', effect: 'Allies gain aura bonus on Bluff, Diplomacy, and Intimidate checks.' },
  { name: 'Resistance', effect: 'Allies gain energy resistance 5x aura bonus to their dragon totem energy type.' },
  { name: 'Senses', effect: 'Allies gain aura bonus on Listen, Spot, and Initiative checks.' },
  { name: 'Toughness', effect: 'Allies gain Damage Reduction equal to aura bonus / magic (DR 1/magic to 5/magic).' },
  { name: 'Vigor', effect: 'Allies gain Fast Healing equal to aura bonus (up to half of their maximum hit points).' }
];

export const MARSHAL_MINOR_AURAS = [
  { name: 'Accurate Strike', stat: 'CHA', effect: 'Add Charisma bonus to allies’ rolls made to confirm critical hits.' },
  { name: 'Art of War', stat: 'CHA', effect: 'Add Charisma bonus to allies’ Trip, Disarm, Sunder, and Bull Rush checks.' },
  { name: 'Demand Fortitude', stat: 'CHA', effect: 'Add Charisma bonus to allies’ Fortitude saving throws.' },
  { name: 'Force of Will', stat: 'CHA', effect: 'Add Charisma bonus to allies’ Will saving throws.' },
  { name: 'Master of Tactics', stat: 'CHA', effect: 'Add Charisma bonus to allies’ melee damage rolls when flanking.' },
  { name: 'Motivate Dexterity', stat: 'CHA', effect: 'Add Charisma bonus to allies’ Dexterity checks and Initiative rolls.' },
  { name: 'Over the Top', stat: 'CHA', effect: 'Add Charisma bonus to allies’ melee damage rolls on charges.' },
  { name: 'Watchful Eye', stat: 'CHA', effect: 'Add Charisma bonus to allies’ Reflex saving throws.' }
];
