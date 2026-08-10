export type RuleEdition = '5e' | '3.5e' | 'shadowrun' | 'pathfinder' | 'cthulhu';

export type MadnessState = 'Sane' | 'Short-Term Madness' | 'Long-Term Madness' | 'Indefinite Madness';

export interface SanityData {
  current: number;
  max: number;
  score?: number; // 7th Ability Score option (DMG p.264)
  madnessState?: MadnessState;
  madnessEffect?: string;
  sanityNotes?: string;
}

// Shadowrun Types
export interface ShadowrunQuality {
  id: string;
  name: string;
  type: 'Positive' | 'Negative';
  karmaCost: number; // e.g. 10 or -10
  description: string;
}

export interface ShadowrunCyberware {
  id: string;
  name: string;
  category: 'Cyberware' | 'Bioware' | 'Nanoware';
  essenceCost: number; // e.g. 0.5, 1.2
  rating?: number;
  grade: 'Standard' | 'Alphaware' | 'Betaware' | 'Deltaware' | 'Used';
  description: string;
  equipped?: boolean;
}

export interface ShadowrunSkill {
  id: string;
  name: string;
  category: 'Combat' | 'Matrix' | 'Magic' | 'Physical' | 'Social' | 'Technical' | 'Knowledge' | 'Language';
  rating: number; // 1 to 12
  linkedAttribute: 'BOD' | 'AGI' | 'REA' | 'STR' | 'WIL' | 'LOG' | 'INT' | 'CHA' | 'EDG' | 'MAG' | 'RES';
  specialization?: string;
}

export interface ShadowrunWeapon {
  id: string;
  name: string;
  type: 'Firearm' | 'Melee' | 'Throwable' | 'Special';
  damage: string; // e.g., "9P", "11P"
  armorPenetration: number; // e.g., -2, -1
  mode?: string; // e.g., "SA/BF/FA"
  ammo?: string; // e.g., "15(c)"
  recoilCompensation?: number;
}

export interface ShadowrunMatrixDevice {
  name: string;
  model: string;
  deviceRating: number;
  dataProcessing: number;
  firewall: number;
  attack: number;
  sleaze: number;
  overwatchScore: number;
  programsRunning: string[];
}

export interface ShadowrunVehicle {
  id: string;
  name: string;
  type: 'Car' | 'Bike' | 'Drone' | 'VTOL' | 'Ship';
  handling: string;
  speed: string;
  acceleration: string;
  body: number;
  armor: number;
  pilot: number;
  sensor: number;
  weaponMounts?: string;
  notes?: string;
}

export interface ShadowrunSpellComplexForm {
  id: string;
  name: string;
  type: 'Spell' | 'Complex Form' | 'Adept Power' | 'Ritual';
  category: 'Combat' | 'Detection' | 'Health' | 'Illusion' | 'Manipulation' | 'Matrix' | 'Passives';
  drainValue: string; // e.g. "F - 2", "F + 3" or "2"
  duration: 'Instant' | 'Sustained' | 'Permanent' | 'Passive';
  description: string;
  rating?: number;
}

export interface ShadowrunData {
  // Core Shadowrun Attributes
  bod: number; // Body
  agi: number; // Agility
  rea: number; // Reaction
  str: number; // Strength
  wil: number; // Willpower
  log: number; // Logic
  int: number; // Intuition
  cha: number; // Charisma
  edg: number; // Edge Max
  edgCurrent: number; // Edge Current
  ess: number; // Essence (default 6.00)
  mag: number; // Magic (0 if non-awakened)
  res: number; // Resonance (0 if non-technomancer)

  // Progression & Financial
  nuyen: number; // ¥ Nuyen
  karmaCurrent: number; // Current unspent Karma
  karmaTotal: number; // Lifetime total Karma earned
  streetCred: number;
  notoriety: number;
  publicAwareness: number;

  // Condition Tracks
  physicalBoxesCurrent: number; // Filled Physical damage boxes
  stunBoxesCurrent: number; // Filled Stun damage boxes
  overflowBoxesCurrent: number; // Physical overflow boxes

  // Armor & Combat Defenses
  ballisticArmor: number;
  impactArmor: number;

  // Identity & SIN
  sinType?: 'Corporate' | 'National' | 'Criminal' | 'Fake SIN' | 'Unregistered';
  fakeSinRating?: number;
  lifestyle?: 'Squatter' | 'Low' | 'Middle' | 'High' | 'Luxury';

  // Sub-lists
  qualities: ShadowrunQuality[];
  cyberware: ShadowrunCyberware[];
  srSkills: ShadowrunSkill[];
  weapons?: ShadowrunWeapon[];
  matrixDevice?: ShadowrunMatrixDevice;
  vehicles: ShadowrunVehicle[];
  spellsComplexForms?: ShadowrunSpellComplexForm[];
}

export interface HybridHeritageData {
  enabled: boolean;
  primaryParent: string;
  secondaryParent: string;
  customHybridName?: string;
  primaryTraitName?: string;
  primaryTraitDesc?: string;
  secondaryTraitName?: string;
  secondaryTraitDesc?: string;
  speedFeet?: number;
  sizeCategory?: string;
  hasDarkvision?: boolean;
  isClassicSRD?: boolean;
  classicSRDId?: string;
  dragonVariety?: string;
}

export interface OptionalRulesConfig {
  useVariantEncumbrance?: boolean;   // Variant Encumbrance (STRx5 = Encumbered -10ft speed, STRx10 = Heavy -20ft speed & Disadvantage)
  weightCalculationMode?: 'equipped_only' | 'carried_only' | 'all_items'; // Encumbrance weight mode (Default: carried_only)
  useFlankingRules?: boolean;       // Flanking rules (+2 Attack in 3.5e, Advantage prompt in 5e)
  useMulticlassing?: boolean;       // Secondary Class / Dual-Classing calculations
  secondaryClass?: string;          // Secondary Class Name
  secondaryLevel?: number;          // Secondary Class Level
  secondarySubclass?: string;       // Secondary Class Subclass
  activeClassChoice?: 'primary' | 'secondary'; // Which class is currently Active (earning XP) vs Paused
  primaryXp?: number;               // Allocated XP for Primary Class
  secondaryXp?: number;             // Allocated XP for Secondary Class
  useGrittyRealismResting?: boolean;// Gritty Realism Resting (Short rest = 8h, Long rest = 7 days)
  useVariantCritDamage?: boolean;   // Variant Critical Hit Damage (Max initial die + roll second die)
  useMilestoneXp?: boolean;         // Milestone Level Progression (Hide XP threshold progress)
  useDiagonal5105Rules?: boolean;   // 5/10/5 Diagonal Movement Rule
  useSanityRules?: boolean;         // Sanity & Madness System (DMG p.264 / Call of Cthulhu)
  useGestaltUA72?: boolean;         // Unearthed Arcana p.72: Gestalt Characters (Dual class progression)
  useDefenseBonusUA109?: boolean;   // Unearthed Arcana p.109: Class Defense Bonus by Level
  useArmorAsDRUA109?: boolean;      // Unearthed Arcana p.109/111: Armor as Damage Reduction
  hasPowerfulBuild?: boolean;       // Powerful Build / Little Giant: Counts as 1 size category larger for carrying capacity, push, drag, and lift
  useHalfBreedSystem?: boolean;     // Half-Breed / Hybrid Heritage Ancestry rules (Alpine DM / Homebrew 5e)
  useClassicSRDHalfBreed?: boolean; // Classic SRD Half-Breeds (5e & 3.5e SRD)
}

export type AbilityName = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AbilityScore {
  score: number;
  overrideBonus?: number;
}

export type AbilityScores = Record<AbilityName, AbilityScore>;

export interface Skill {
  id: string;
  name: string;
  ability: AbilityName;
  proficient: boolean; // Used for 5e
  expertise?: boolean; // Used for 5e
  ranks?: number; // Used for 3.5e
  miscMod?: number; // Used for 3.5e
  isClassSkill?: boolean; // Used for 3.5e
}

export interface Attack {
  id: string;
  name: string;
  attackBonus: number;
  damage: string; // e.g. "1d8 + 3"
  damageType: string; // Slashing, Piercing, Fire, etc.
  range: string; // Melee, 150/600 ft, etc.
  notes?: string;
  abilityUsed?: AbilityName;
  isProficient?: boolean;
}

export interface ClassFeature {
  id: string;
  name: string;
  source: string; // e.g. Fighter 1, Action Surge
  description: string;
  usesMax?: number;
  usesRemaining?: number;
  recharge?: 'Short Rest' | 'Long Rest' | 'Special' | 'None';
}

export interface LegendaryAction {
  id: string;
  name: string;
  cost?: number; // 1, 2, or 3 actions (default 1)
  description: string;
  attackId?: string;
}

export interface LairAction {
  id: string;
  name: string;
  description: string;
}

export interface MonsterReaction {
  id: string;
  name: string;
  description: string;
}

export interface Feat {
  id: string;
  name: string;
  source?: string;
  prerequisite?: string;
  description: string;
  hpMaxBonus?: number;
}

export interface GearItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // in lbs
  equipped: boolean;
  stored?: boolean; // stored away in camp/stash (does not contribute to active carried weight)
  attuned?: boolean;
  isMagic?: boolean;
  costGp?: number; // item price / value in Gold Pieces
  notes?: string;
  itemType?: 'Armor' | 'Weapon' | 'Misc';
  armorAc?: number;
  armorType?: 'Heavy' | 'Medium' | 'Light' | 'Shield' | 'Bonus';
  damageReduction?: number; // Damage Reduction (DR) granted by item (e.g., 2, 5)
  resistance?: string; // Damage type resistance granted by item (e.g. Fire, Cold, Slashing, All)
  immunity?: string; // Damage type immunity granted by item (e.g. Poison, Fire, Acid, All)
  stealthDisadvantage?: boolean;
  hpMaxBonus?: number; // Max HP bonus or penalty granted when equipped
  isCursed?: boolean; // Cursed artifact marker with active drawbacks or attunement restrictions
  spellDcBonus?: number; // Spell Save DC bonus (e.g. +1, +2 from Robe of the Archmagi or Rod of the Pact Keeper)
  weaponStats?: {
    attackBonus?: string | number;
    damage?: string;
    damageType?: string;
    range?: string;
    notes?: string;
  };
}

export interface Wealth {
  cp: number; // Copper
  sp: number; // Silver
  ep: number; // Electrum
  gp: number; // Gold
  pp: number; // Platinum
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for Cantrip, 1-9 for spell levels
  school: string;
  castingTime: string;
  range: string;
  components: string; // V, S, M
  duration: string;
  description: string;
  shortDescription?: string;
  prepared: boolean;
  concentration?: boolean;
  ritual?: boolean;
  saveType?: string; // e.g. 'DEX', 'WIS', 'CON'
  damage?: string; // e.g. '3d6', '8d6'
  damageType?: string; // Acid, Cold, Fire, Force, Lightning, Necrotic, Piercing, Poison, Psychic, Radiant, Slashing, Thunder, etc.
  edition?: '5e' | '3.5e' | 'both';
  classLevels?: Record<string, number>; // e.g. { 'Bard': 2, 'Sor/Wiz': 3, 'Cleric': 3 }
  classLevelsStr?: string; // e.g. "Brd 2, Sor/Wiz 3, Clr 3"
}

export interface SpellSlots {
  level: number; // 1-9
  max: number;
  current: number;
}

export interface CharacterData {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  experiencePoints: number;
  playerClassDetails?: string;

  // Rule Edition System
  edition?: RuleEdition; // '5e' | '3.5e' (Defaults to '5e' if undefined)
  portraitUrl?: string; // Character portrait image hyperlink URL

  // HP Calculation Method
  hpCalcMode?: 'Average' | 'Rolled' | 'Max';

  // 3.5e Specific Combat & Saving Throw Parameters
  bab?: number; // Base Attack Bonus for 3.5e
  classBaseSkillPoints?: number; // Base Skill Points per level (e.g. 2, 4, 6, 8 for 3.5e)
  fortSaveBase?: number; // Base Fortitude Save for 3.5e
  refSaveBase?: number; // Base Reflex Save for 3.5e
  willSaveBase?: number; // Base Will Save for 3.5e
  touchAcOverride?: number; // Touch AC adjustment for 3.5e
  flatFootedAcOverride?: number; // Flat-Footed AC adjustment for 3.5e
  spellResist?: number; // Spell Resistance (SR) for 3.5e
  sizeCategory?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal';

  // Merchant / Vendor status
  isVendor?: boolean;
  vendorMargin?: number; // Selling price margin percentage (e.g. 120 = 120%)

  // Monster / Encounter creature status
  isMonster?: boolean;
  challengeRating?: string;
  monsterXpReward?: number; // XP granted to party when defeated

  // Optional D&D Rules & Variant Calculations
  optionalRules?: OptionalRulesConfig;

  // Half-Breed / Hybrid Heritage Data (The Alpine DM System)
  hybridHeritage?: HybridHeritageData;

  // Sanity & Madness System Data (DMG p.264)
  sanity?: SanityData;

  // Shadowrun System Data
  shadowrun?: ShadowrunData;

  // Active Transformation Engine (Wild Shape, Polymorph, Shapechange, Lycanthropy)
  activeTransformation?: ActiveTransformation;

  // Conditions & Status Effects
  conditions?: string[];
  exhaustionLevel?: number; // 0-6

  // Vitals
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  maxHpModifier?: number; // Active temp/conditional Max HP modifier (e.g. +5 Aid spell, -10 Vampire Drain)
  hitDiceTotal: string; // e.g. "5d10"
  hitDiceCurrent: number;
  armorClass: number;
  initiativeBonus: number;
  speed: number; // feet
  inspiration: boolean;

  // Death Saves
  deathSavesSuccesses: number; // 0-3
  deathSavesFailures: number; // 0-3

  // Abilities & Saving Throw Proficiencies
  abilities: AbilityScores;
  savingThrowProficiencies: AbilityName[];

  // Skills
  skills: Skill[];

  // Features & Feats
  classFeatures: ClassFeature[];
  feats: Feat[];

  // Attacks
  attacks: Attack[];

  // Monster Actions & Trait Mechanics
  multiattack?: string;
  legendaryActionsMax?: number;
  legendaryActionsRemaining?: number;
  legendaryActions?: LegendaryAction[];
  lairActions?: LairAction[];
  reactions?: MonsterReaction[];

  // Gear & Wealth
  wealth: Wealth;
  inventory: GearItem[];

  // Spellcasting
  isSpellcaster: boolean;
  spellcastingAbility: AbilityName;
  spellSaveDCOverride?: number;
  spellAttackBonusOverride?: number;
  spellSlots: SpellSlots[];
  spells: Spell[];

  // Description & Notes
  gender?: string;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;

  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  alliesAndOrganizations: string;
  additionalNotes: string;
  partyId?: string;
}

export interface Party {
  id: string;
  name: string;
  description?: string;
  characterIds: string[];
  createdAt?: string;
}

export interface DiceRollResult {
  id: string;
  timestamp: string;
  label: string;
  expression: string;
  diceRolls: number[];
  modifier: number;
  total: number;
  mode?: 'normal' | 'advantage' | 'disadvantage';
  isNat20?: boolean;
  isNat1?: boolean;
}

export type EncounterEnvironment =
  | 'terrestrial'
  | 'underwater'
  | 'volcanic'
  | 'arctic'
  | 'shadowfell'
  | 'aerial'
  | 'lair_active';

export interface TransformationForm {
  id: string;
  name: string;
  type: 'Wild Shape' | 'Polymorph' | 'Shapechange' | 'Lycanthropy' | 'Vampire Form' | 'Custom';
  edition?: '5e' | '3.5e' | 'both';
  sizeCategory?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
  formHpMax: number;
  formHpCurrent: number;
  formAc: number;
  formSpeed: number;
  formAbilities?: { STR: number; DEX: number; CON: number };
  hasHands?: boolean; // If true, form has hands/humanoid anatomy and can equip weapons & gear. If false, equipped items are unequipped/merged.
  naturalWeapons: Attack[];
  specialTraits?: string[];
  portraitUrl?: string;
  notes?: string;
}

export interface ActiveTransformation {
  form: TransformationForm;
  transformedAt: string;
  originalStats: {
    hpMax: number;
    hpCurrent: number;
    hpTemp: number;
    armorClass: number;
    speed: number;
    sizeCategory?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal';
    abilities: AbilityScores;
    attacks: Attack[];
    portraitUrl?: string;
    equippedItemIds?: string[];
  };
}


