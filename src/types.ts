declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

export type CharacterId = Brand<string, 'CharacterId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type QuestId = Brand<string, 'QuestId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type SpellId = Brand<string, 'SpellId'>;
export type UserId = Brand<string, 'UserId'>;

export const toCharacterId = (id: string): CharacterId => id as CharacterId;
export const toCampaignId = (id: string): CampaignId => id as CampaignId;
export const toQuestId = (id: string): QuestId => id as QuestId;
export const toItemId = (id: string): ItemId => id as ItemId;
export const toSpellId = (id: string): SpellId => id as SpellId;
export const toUserId = (id: string): UserId => id as UserId;

export type RuleEdition = '5e' | '3.5e' | 'shadowrun' | 'pathfinder' | 'cthulhu';

export type MadnessState = 'Sane' | 'Short-Term Madness' | 'Long-Term Madness' | 'Indefinite Madness';

export interface SanityData {
  current: number;
  max: number;
  score?: number; // 7th Ability Score option (DMG p.264)
  madnessState?: MadnessState;
  madnessEffect?: string;
  sanityNotes?: string;
  isTempMad?: boolean;
  isIndefMad?: boolean;
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

  // 3.5e Half-Breed Template System (Base Creature + Template inheritance)
  isTemplateMode?: boolean;
  templateId?: string;
  templateName?: string;
  baseRaceId?: string;
  baseRaceName?: string;
  levelAdjustment?: number;
  conflictsResolved?: Record<string, 'base' | 'template' | 'suppress'>;
  retainedBaseTraits?: string[];
  gainedTemplateTraits?: string[];
  skillPointsRuleNotice?: string;
  precedenceSummary?: string[];
}

export interface GestaltTrackClass {
  id: string;
  className: string;
  subclass?: string;
  level: number;
  isPaused?: boolean;
}

export interface GestaltTrack {
  id: string; // e.g. 'track-1', 'track-2', 'track-3', 'track-4'
  name: string; // e.g. 'Track 1', 'Track 2'
  classes: GestaltTrackClass[]; // classes taken on this track (active class is not paused)
}

export interface OptionalRulesConfig {
  useVariantEncumbrance?: boolean;   // Variant Encumbrance (STRx5 = Encumbered -10ft speed, STRx10 = Heavy -20ft speed & Disadvantage)
  trackEncumbrance?: boolean;        // Carrying capacity & encumbrance rules enabled. When false/unselected, all weight tracking, calculations & displays are hidden.
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
  useGestaltUA72?: boolean;         // Unearthed Arcana p.72: Gestalt Characters (Up to 4 simultaneous classes with independent multiclassing)
  gestaltTrackCount?: number;       // Number of simultaneous Gestalt tracks (2, 3, or 4; defaults to 2)
  gestaltTracks?: GestaltTrack[];   // Detailed Gestalt multi-track progression
  useDefenseBonusUA109?: boolean;   // Unearthed Arcana p.109: Class Defense Bonus by Level
  useArmorAsDRUA109?: boolean;      // Unearthed Arcana p.109/111: Armor as Damage Reduction
  hasPowerfulBuild?: boolean;       // Powerful Build / Little Giant: Counts as 1 size category larger for carrying capacity, push, drag, and lift
  useHalfBreedSystem?: boolean;     // Half-Breed / Hybrid Heritage Ancestry rules (Alpine DM / Homebrew 5e)
  useClassicSRDHalfBreed?: boolean; // Classic SRD Half-Breeds (5e & 3.5e SRD)
  useHalfBreedTemplate35e?: boolean;// 3.5e Half-Breed Template System (Base Creature + Template Inheritance)
  usePhysicalDiceMode?: boolean;    // Physical Dice Mode: Prompts to input physical dice roll results rather than virtual rolling
  disableAutoXpGain?: boolean;      // Disable Automatic EXP Gain (For groups using manual EXP systems, physical paper logs, or external campaign tracking)
  useManualXpMode?: boolean;        // Manual Tabletop EXP Mode (Turns off automated encounter XP distribution to character sheets)
  includeCoinWeight?: boolean;      // D&D 5e Standard Coin Weight (50 coins = 1 lb). When enabled/true, currency coins contribute to encumbrance.
  useContainerManagement?: boolean; // Container & Bag system (Backpack, Bag of Holding, Handy Haversack, etc.)
  // Shadowrun rules
  strictEssenceCap?: boolean;
  glitchRules?: boolean;
  directMatrixDamage?: boolean;
  streetLevelMode?: boolean;
  // Call of Cthulhu rules
  majorWounds?: boolean;
  boutsOfMadness?: boolean;
  pushedRolls?: boolean;
  pulpCthulhuMode?: boolean;
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

export type RacialSkillBonusType = 'specific' | 'ability' | 'conditional';

export interface RacialSkillBonus {
  id: string;
  type: RacialSkillBonusType; // 'specific' = single skill, 'ability' = all skills for an ability, 'conditional' = skill under circumstance
  skillName?: string; // e.g. 'Spot', 'Listen', 'Jump', 'Swim' (for 'specific' or 'conditional')
  ability?: AbilityName; // e.g. 'DEX' (for 'ability' affiliated bonuses, e.g. +2 to all DEX-based skills)
  bonus: number; // e.g. 2, 4, 5, 8
  condition?: string; // Specific circumstance text (e.g. 'at night', 'underwater', 'in rocky terrain', 'related to stone or metal')
  source?: string; // e.g. 'Elf Keen Senses', 'Racial Trait', 'Homebrew Heritage'
}

export interface WeaponDamageRow {
  id?: string;
  damage: string; // e.g. "1d8+1", "2d6", "1d4"
  damageType: string; // e.g. "Fire", "Slashing", "Radiant", "Necrotic"
  label?: string; // Optional label/condition e.g. "vs Fiends", "On Hit", "Crit Bonus"
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
  isTwoHanded?: boolean;
  isOffhand?: boolean;
  additionalDamageRows?: WeaponDamageRow[];
  threatRange?: number; // Minimum d20 roll for critical threat (e.g. 18, 19, 20). Default 20.
  critMultiplier?: number; // Critical damage multiplier (e.g. 2, 3, 4). Default 2 (x2).
  isKeen?: boolean; // Keen / Improved Critical (doubles threat range: 20 -> 19-20, 19-20 -> 17-20, 18-20 -> 15-20)
  bypassMaterial?: 'normal' | 'magic' | 'silver' | 'cold_iron' | 'adamantine'; // Material for 3.5e DR bypass
  alignmentBypass?: 'none' | 'good' | 'evil' | 'lawful' | 'chaotic'; // Alignment bypass for 3.5e DR
  weaponSize?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal'; // Weapon size category (3.5e PHB p. 113)
  enhancementBonus?: number; // e.g. +1, +2 magic weapon bonus
  miscBonus?: number; // e.g. Weapon Focus +1
  miscBonusDamage?: number; // e.g. Weapon Specialization +2
  baseDamageDice?: string; // e.g. "1d6", "1d8"
  useManualBonus?: boolean; // If true, uses attackBonus/damage directly without auto BAB/ability scaling
  twoHandedMultiplier?: number; // STR factor for 2-handed wielding (default 1.5, e.g. 2.0 with special feats/features)
  offhandMultiplier?: number; // STR factor for off-hand wielding (default 0.5, e.g. 1.0 with Double Slice)
  wieldGrip?: '1H' | '2H' | 'OH'; // Explicit grip state: One-Handed, Two-Handed, Off-Hand
  inventoryItemId?: string; // ID of linked gear item from inventory
  isNatural?: boolean; // Natural attack (e.g. bite, claw, slam, gore)
  isSecondaryNatural?: boolean; // Secondary natural attack (-5 to attack, 0.5x STR; -2 with Multiattack)
  isSoleNaturalAttack?: boolean; // Single natural attack gains 1.5x STR
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
  category?: string;
  prerequisite?: string;
  actionType?: string;
  description: string;
  statBonus?: string; // Half-feat or ASI bonus (e.g. "+2 Constitution", "+1 Strength")
  abilityBonuses?: Partial<Record<AbilityName, number>>;
  hpMaxBonus?: number; // Flat Max HP bonus (e.g. +10, or 3.5e Toughness +3)
  hpPerLevel?: number; // Scaling Max HP bonus per level (e.g. Tough +2/lvl, or homebrew +3/lvl)
}

export type ContainerType = 
  | 'backpack' 
  | 'bag_of_holding' 
  | 'handy_haversack' 
  | 'pouch' 
  | 'chest' 
  | 'portable_hole' 
  | 'quiver' 
  | 'custom';

export interface ItemContainer {
  id: string;
  name: string;
  type: ContainerType;
  capacityLbs: number;
  isExtradimensional?: boolean; // If true, contents weight 0 lbs to carrying encumbrance!
  fixedWeightLbs: number; // The physical weight of the bag itself on the bearer
  notes?: string;
}

export interface GearItem {
  id: string;
  name: string;
  quantity: number;
  weight: number; // in lbs
  equipped: boolean;
  stored?: boolean; // stored away in camp/stash (does not contribute to active carried weight)
  containerId?: string; // ID of container item or virtual container (e.g. 'container-bag-of-holding')
  isContainer?: boolean;
  containerType?: ContainerType;
  containerCapacityLbs?: number;
  isExtradimensional?: boolean;
  attuned?: boolean;
  requiresAttunement?: boolean;
  isMagic?: boolean;
  costGp?: number; // item price / value in Gold Pieces
  notes?: string;
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact' | 'Unique' | string;
  slot?: 'Ring' | 'Amulet' | 'Cloak' | 'Boots' | 'Headwear' | 'Gloves' | 'Belt' | 'Armor' | 'Shield' | 'Main Hand' | 'Off Hand' | 'Two-Handed' | 'Wondrous' | 'Inventory' | string;
  wieldGrip?: '1H' | '2H'; // Player choice of wielding grip: '1H' (one-handed, 1 hand used) or '2H' (two-handed, 2 hands used)
  isCustom?: boolean; // True if item is a custom homebrew item
  itemType?: 'Armor' | 'Weapon' | 'Ring' | 'Amulet' | 'Cloak' | 'Boots' | 'Headwear' | 'Gloves' | 'Belt' | 'Wondrous Item' | 'Potion' | 'Scroll' | 'Wand' | 'Misc' | string;
  subCategory?: string;
  armorAc?: number;
  acBonus?: number;
  initiativeBonus?: number;
  armorType?: 'Heavy' | 'Medium' | 'Light' | 'Shield' | 'Bonus';
  strengthRequirement?: number; // Minimum STR required to wear without -10ft speed penalty (e.g. 13 for Chain Mail, 15 for Plate)
  maxDexBonus?: number; // Optional maximum DEX modifier cap (e.g. 2 for Medium, 3 for Medium Armor Master, or custom)
  naturalArmorBonus?: number; // Natural armor bonus granted by item (e.g. Amulet of Natural Armor +1..+5)
  deflectionBonus?: number; // Deflection bonus to AC (e.g. Ring of Protection +1..+5)
  dodgeBonus?: number; // Dodge bonus to AC (e.g. Boots of Speed)
  armorCheckPenalty?: number; // 3.5e Armor Check Penalty (e.g. -6 for Full Plate)
  arcaneSpellFailure?: number; // 3.5e Arcane Spell Failure % (e.g. 35% for Full Plate)
  damageReduction?: number; // Damage Reduction (DR) granted by item (e.g., 2, 5)
  resistance?: string; // Damage type resistance granted by item (e.g. Fire, Cold, Slashing, All)
  immunity?: string; // Damage type immunity granted by item (e.g. Poison, Fire, Acid, All)
  conditionImmunities?: string; // Condition immunities granted (e.g. Charmed, Frightened, Paralyzed, Poisoned)
  stealthDisadvantage?: boolean;
  hpMaxBonus?: number; // Max HP bonus or penalty granted when equipped
  isCursed?: boolean; // Cursed artifact marker with active drawbacks or attunement restrictions
  spellDcBonus?: number; // Spell Save DC bonus (e.g. +1, +2 from Robe of the Archmagi or Rod of the Pact Keeper)
  spellAttackBonus?: number; // Spell Attack bonus (e.g. +1, +2 from Wand of the War Mage)
  attackBonus?: number; // General attack roll bonus granted by item (e.g. +1 to all attack rolls)
  damageBonus?: number; // General damage roll bonus granted by item (e.g. +2 from Bracers of Archery or Ring of Might)
  savingThrowBonus?: number; // Flat bonus to ALL saving throws (e.g. +1 from Ring of Protection, Cloak of Protection, Luckstone)
  savingThrowSpecificBonuses?: Partial<Record<AbilityName, number>>; // Individual saving throw bonuses (e.g. { DEX: 1, CON: 2 })
  checkBonus?: number; // Flat bonus to ALL ability checks / skill checks (e.g. +1 from Stone of Good Luck / Luckstone)
  skillBonuses?: Record<string, number>; // Specific skill bonuses (e.g. { 'Stealth': 5, 'Perception': 5, 'Athletics': 2 })
  passivePerceptionBonus?: number; // Bonus to Passive Perception (e.g. +5 from Sentinel Shield or Eyes of the Eagle)
  darkvision?: number; // Darkvision range in feet (e.g. 60 from Goggles of Night)
  speedBonus?: number; // Walking speed bonus in feet (e.g. +10 from Boots of Striding & Springing)
  flySpeed?: number; // Fly speed in feet (e.g. 60 from Winged Boots or Cloak of the Bat)
  swimSpeed?: number; // Swim speed in feet (e.g. 40 from Ring of Swimming)
  climbSpeed?: number; // Climb speed in feet (e.g. 30 from Slippers of Spider Climbing)
  charges?: { current: number; max: number; recharge?: string }; // Item charge tracker (e.g. Staff of Power, Ring of the Ram)
  spellsGranted?: string; // Spells or activated abilities granted by item (e.g. "Misty Step (2/day), Shield (1/day)")
  abilitySetters?: Partial<Record<AbilityName, number>>; // Sets ability score to fixed value (e.g. { STR: 19 } for Gauntlets of Ogre Power, { INT: 19 } for Headband of Intellect)
  abilityBonuses?: Partial<Record<AbilityName, number>>; // Adds bonus to ability score (e.g. { WIS: 2 })
  attunementSlotsGranted?: number; // Increases max attunement slots
  weaponStats?: {
    attackBonus?: string | number;
    damage?: string;
    damageType?: string;
    range?: string;
    notes?: string;
    isFinesse?: boolean;
    isVersatile?: boolean;
    versatileDamage?: string; // e.g. "1d10"
    isRanged?: boolean;
    isThrown?: boolean;
    isTwoHanded?: boolean;
    isLight?: boolean;
    isHeavy?: boolean;
    isReach?: boolean;
    abilityOverride?: AbilityName;
    attackBonusModifier?: number;
    damageBonusModifier?: number;
    enhancementBonus?: number;
    threatRange?: number;
    critMultiplier?: number;
    isKeen?: boolean;
    additionalDamageRows?: WeaponDamageRow[];
  };
  enhancementBonus?: number;
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
  higherLevel?: string; // At Higher Levels upcasting text (5e/PF2e)
  edition?: '5e' | '3.5e' | 'both';
  classLevels?: Record<string, number>; // e.g. { 'Bard': 2, 'Sor/Wiz': 3, 'Cleric': 3 }
  classLevelsStr?: string; // e.g. "Brd 2, Sor/Wiz 3, Clr 3"
  metamagicAdjustments?: {
    empower?: boolean; // +2 levels (+50% variable damage/effect)
    maximize?: boolean; // +3 levels (maximized variable damage/effect)
    quicken?: boolean; // +4 levels (cast as swift action)
    extend?: boolean; // +1 level (doubled duration)
    enlarge?: boolean; // +1 level (doubled range)
    widen?: boolean; // +3 levels (doubled area)
    silent?: boolean; // +1 level (no verbal component)
    still?: boolean; // +1 level (no somatic component, ignores ASF)
  };
  originalLevel?: number; // Base spell level prior to metamagic adjustment
}

export interface SpellSlots {
  level: number; // 1-9
  max: number;
  current: number;
}

export interface ActiveConcentration {
  spellId?: string;
  spellName: string;
  castLevel?: number;
  duration?: string;
  castTimestamp?: number;
}

export interface OwnedMount {
  id: string;
  name: string;
  type: string; // e.g. "Heavy Warhorse", "Riding Horse", "Warpony", "Camel", "Riding Dog", "Griffon"
  costGp: number;
  size: 'Small' | 'Medium' | 'Large' | 'Huge';
  speed: string; // e.g. "50 ft."
  ac: number;
  hp: number;
  hpMax: number;
  carryingCapacityLbs: {
    light: number;
    medium: number;
    heavy: number;
  };
  saddle?: 'none' | 'pack' | 'riding' | 'military' | 'exotic_riding' | 'exotic_military';
  barding?: 'none' | 'padded' | 'leather' | 'studded_leather' | 'chain_shirt' | 'scale_mail' | 'chainmail' | 'banded_mail' | 'full_plate';
  hasBitAndBridle?: boolean;
  hasSaddlebags?: boolean;
  saddlebagItems?: string[];
  isWarTrained?: boolean;
  attacks?: Array<{ name: string; bonus: number; damage: string; type: string }>;
  notes?: string;
}

export interface CharacterData {
  id: string;
  name: string;
  updatedAt?: string;
  race: string;
  characterClass: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  deity?: string; // Patron deity (Cleric, Paladin, etc.) or Otherworldly Patron (Warlock)
  experiencePoints: number;
  playerClassDetails?: string;

  // Rule Edition System
  edition?: RuleEdition; // '5e' | '3.5e' (Defaults to '5e' if undefined)
  portraitUrl?: string; // Character portrait image hyperlink URL

  // HP Calculation Method
  hpCalcMode?: 'Average' | 'Rolled' | 'Max';

  // 3.5e Specific Combat & Saving Throw Parameters
  bab?: number; // Base Attack Bonus for 3.5e
  baseAttackBonus?: number; // Alias for Base Attack Bonus (BAB) in 3.5e
  isStabilized35e?: boolean; // 3.5e Dying & Stabilization state
  nonlethalDamage?: number; // 3.5e Nonlethal Damage accumulation
  classBaseSkillPoints?: number; // Base Skill Points per level (e.g. 2, 4, 6, 8 for 3.5e)
  fortSaveBase?: number; // Base Fortitude Save for 3.5e
  refSaveBase?: number; // Base Reflex Save for 3.5e
  willSaveBase?: number; // Base Will Save for 3.5e
  fortSaveMagic?: number; // Magic/Resistance bonus to Fortitude (e.g. Cloak of Resistance)
  refSaveMagic?: number; // Magic/Resistance bonus to Reflex
  willSaveMagic?: number; // Magic/Resistance bonus to Will
  fortSaveMisc?: number; // Feats/Misc bonus to Fortitude (e.g. Great Fortitude)
  refSaveMisc?: number; // Feats/Misc bonus to Reflex (e.g. Lightning Reflexes)
  willSaveMisc?: number; // Feats/Misc bonus to Will (e.g. Iron Will)
  divineGraceActive?: boolean; // Paladin Divine Grace: Add Charisma modifier to all saving throws
  saveConditionalModifiers?: string; // Situational save notes (e.g. "+2 vs enchantments, +4 vs poison")
  touchAcOverride?: number; // Touch AC adjustment for 3.5e
  acOverride?: number;
  initiativeOverride?: number;
  flatFootedAcOverride?: number; // Flat-Footed AC adjustment for 3.5e
  spellResist?: number; // Spell Resistance (SR) for 3.5e
  sizeCategory?: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal';
  reachType?: 'Tall' | 'Long'; // 3.5e Stance / Reach type: Tall (bipedal) vs Long (quadrupedal / serpentine)
  spaceOverrideFt?: number; // 3.5e Combat space override in feet
  naturalReachOverrideFt?: number; // 3.5e Natural reach override in feet
  sizeAcBonus?: number; // Size bonus/penalty to AC override
  senses?: string; // Senses e.g. "Darkvision 60 ft., Low-Light Vision"
  naturalArmorBonus?: number; // 3.5e Natural Armor bonus to AC (e.g. from race, monstrous features, spells)
  deflectionBonus?: number; // 3.5e Deflection bonus to AC
  dodgeBonus?: number; // 3.5e Dodge bonus to AC (lost when flat-footed, stacks)
  miscAcBonus?: number; // 3.5e Misc bonus to AC (Insight, Sacred, Morale, Luck, etc.)
  maxDexBonusOverride?: number; // Manual override for max DEX bonus to AC
  armorCheckPenaltyOverride?: number; // Manual override for total Armor Check Penalty (ACP)

  // 3.5e Damage Reduction (DR) & Energy Resistances
  damageReductionValue?: number; // Value of DR (e.g. 5, 10, 15)
  damageReductionBypass?: string; // Bypass material/type (e.g. 'magic', 'silver', 'cold iron', 'adamantine', 'bludgeoning', 'piercing', 'slashing', 'good', 'evil', '-')
  energyResistances?: Record<string, number>; // e.g. { fire: 10, cold: 5, electricity: 0, acid: 0, sonic: 0 }
  customAttacks?: Array<{ id: string; name: string; attackBonus: number; damageDice: string; damageType: string; range: string; notes?: string; }>;
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];

  // Racial Skill Bonuses (D&D 3.5e & 5e mechanics)
  racialSkillBonuses?: RacialSkillBonus[]; // Racial skill bonuses (specific, ability-affiliated, or conditional; non-stacking)
  appliedRacialAbilityBonuses?: Record<string, number>; // Exact racial ability score adjustments applied to character.abilities
  isHalfBreedTemplate?: boolean; // True if character heritage is a Half-Breed / Inherited Template
  templateBaseRace?: string; // Parent/base race if created or modified via Half-Breed Template

  // 3.5e Special Combat Maneuvers & Stability
  isQuadruped?: boolean; // 4+ legs (stability +4 vs trip/bull rush, higher carrying capacity)
  stabilityBonus?: number; // Stability bonus to resist Trip/Bull Rush (e.g. +4 for Dwarves)
  improvedManeuvers?: {
    improvedGrapple?: boolean; // +4 to grapple checks, no AoO
    improvedTrip?: boolean; // +4 to trip checks, no AoO, immediate free melee attack on trip
    improvedDisarm?: boolean; // +4 to disarm checks, no AoO
    improvedSunder?: boolean; // +4 to sunder checks, no AoO
    improvedBullRush?: boolean; // +4 to bull rush checks, no AoO
    improvedOverrun?: boolean; // +4 to overrun checks, no AoO
  };

  // 3.5e Spellcasting & Turn Undead Parameters
  casterLevelOverride?: number; // 3.5e Caster Level override
  spellPenetration?: 'none' | 'spell_penetration' | 'greater'; // Spell Penetration feat (+2) / Greater Spell Penetration (+4)
  arcaneSpellFailureOverride?: number; // Override for total Arcane Spell Failure %
  turnUndeadUsesMax?: number; // Max Turn/Rebuke Undead uses per day (defaults to 3 + CHA mod)
  turnUndeadUsesRemaining?: number; // Remaining Turn/Rebuke Undead uses
  turnUndeadVariant?: 'turn' | 'rebuke'; // Good/Neutral cleric: Turn; Evil cleric: Rebuke
  turnUndeadLevelOverride?: number; // Override effective Turning level (default Cleric lvl, Paladin lvl - 3)
  hasExtraTurning?: boolean; // Extra Turning feat (+4 uses/day)

  // 3.5e Attacks of Opportunity (AoO) & Combat Reflexes
  aooRemaining?: number; // Current remaining AoO pool this combat round
  hasCombatReflexes?: boolean; // Combat Reflexes feat (1 + DEX mod AoOs, make AoOs while flat-footed)
  aooMaxOverride?: number; // Override max AoOs per round
  threatReachFt?: number; // Threatened reach in feet (default 5ft, or 10ft for reach weapons / large creatures)

  // 3.5e Two-Weapon Fighting (TWF) Feats
  hasTwoWeaponFighting?: boolean; // Two-Weapon Fighting feat (reduces penalties to -2/-2 with light offhand)
  hasImprovedTwoWeaponFighting?: boolean; // Improved TWF (grants 2nd offhand attack at -5 when BAB >= 6)
  hasGreaterTwoWeaponFighting?: boolean; // Greater TWF (grants 3rd offhand attack at -10 when BAB >= 11)
  hasTwoWeaponDefense?: boolean; // Two-Weapon Defense feat (+1 shield bonus to AC while dual wielding)

  // 3.5e Ability Damage vs. Ability Drain
  abilityDamage?: Partial<Record<AbilityName, number>>; // Temporary ability damage (1/day heal or Lesser Restoration)
  abilityDrain?: Partial<Record<AbilityName, number>>; // Permanent ability drain (requires Restoration)
  activePoisonsDiseases?: Array<{
    id: string;
    name: string;
    type: 'poison' | 'disease';
    source?: string;
    dc: number;
    saveType: 'Fortitude' | 'Reflex' | 'Will';
    primaryEffect: string; // e.g. "1d4 CON damage"
    secondaryEffect: string; // e.g. "1d6 CON damage"
    incubationRoundsRemaining: number; // e.g. 10 rounds for 1 minute poison incubation
    roundsElapsed: number;
    primarySavePassed?: boolean;
    secondarySavePassed?: boolean;
    isResolved?: boolean;
    notes?: string;
  }>;

  // 3.5e XP-to-Craft & Spell XP Ledger
  craftingPoolXp?: number; // Craft reserve XP (Artificer or bonus pool)
  totalXpSpentOnSpells?: number; // Running total of XP consumed by spells
  totalXpSpentOnCrafting?: number; // Running total of XP consumed by item creation
  xpLedger?: Array<{
    id: string;
    date: string;
    type: 'spell' | 'craft' | 'award' | 'loss';
    description: string;
    xpAmount: number; // negative when spent, positive when awarded
    goldCost?: number;
  }>;

  // 3.5e Negative Levels & Energy Drain
  negativeLevels?: number; // Active negative levels (each gives -1 to attacks/saves/checks/CL, -5 Max HP, loss of highest spell slot)
  negativeLevelsHistory?: Array<{
    id: string;
    source: string; // e.g. "Wight", "Enervation", "Spectre", "Vampire"
    dc: number; // Fortitude save DC after 24 hours
    timestamp: string;
    notes?: string;
  }>;

  // 3.5e Action Economy: Swift & Immediate Actions
  swiftActionUsed?: boolean; // Swift action consumed this turn
  immediateActionUsed?: boolean; // Immediate action consumed, which locks swift action next turn
  actionEconomy?: {
    standardActionUsed?: boolean;
    moveActionUsed?: boolean;
    swiftActionUsed?: boolean;
    immediateActionUsed?: boolean;
    fiveFootStepTaken?: boolean;
    actionUsed5e?: boolean;
    bonusActionUsed5e?: boolean;
    reactionUsed5e?: boolean;
  };

  // 3.5e Tactical Battlefield Positioning & Cover
  activeCover?: 'none' | 'soft' | 'standard' | 'improved' | 'total'; // Soft (+4 AC vs ranged), Standard (+4 AC, +2 Reflex), Improved (+8 AC, +4 Reflex), Total Cover
  hasHigherGround?: boolean; // +1 melee attack bonus when elevated

  // 3.5e & 5e Mounted Combat & Stables System
  isMounted?: boolean;
  hasMountedCombatFeat?: boolean; // Feat: Negate hit on mount once per round with opposed Ride check
  hasRideByAttackFeat?: boolean;
  hasSpiritedChargeFeat?: boolean; // Double damage with melee weapon on mounted charge, or triple with a lance
  mountInfo?: {
    name: string;
    ac: number;
    hp: number;
    hpMax: number;
    speed: string;
    saddle?: string;
    barding?: string;
    notes?: string;
  };
  ownedMounts?: OwnedMount[]; // Stabled and owned steeds/mounts
  activeMountId?: string; // Currently mounted or selected steed ID

  // 3.5e Wild Shape & Polymorph (Physical Ability Overrides)
  wildShapeActive?: boolean;
  wildShapeForm?: {
    name: string;
    size: 'Fine' | 'Diminutive' | 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan' | 'Colossal';
    str: number;
    dex: number;
    con: number;
    naturalArmorBonus: number;
    speed: string; // e.g. "40 ft., fly 60 ft. (average)"
    naturalAttacks: Array<{ name: string; damage: string; attackBonus: number; type: string }>;
    specialAbilities?: string[];
  };

  // 3.5e Environmental & Endurance Hazards
  environmentalHazards?: {
    forcedMarchHours?: number; // Hours marched beyond 8 in current day
    extremeTempType?: 'none' | 'cold' | 'extreme_cold' | 'heat' | 'extreme_heat';
    roundsHoldingBreath?: number; // Rounds spent holding breath
    isSuffocating?: boolean;
    daysWithoutWater?: number;
    daysWithoutFood?: number;
  };

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

  // Sanity & Madness System Data (DMG p.264 / Call of Cthulhu)
  sanity?: SanityData;
  luck?: { current: number; max: number };

  // Pathfinder 2e Focus Pool
  focusPointsCurrent?: number;
  focusPointsMax?: number;

  // Shadowrun System Data
  shadowrun?: ShadowrunData;

  // Call of Cthulhu System Data
  cthulhu?: {
    occupation?: string;
    archetype?: string;
    luck?: number;
    magicPointsCurrent?: number;
    magicPointsMax?: number;
    majorWound?: boolean;
    dying?: boolean;
    cashOnHand?: number;
    spendingLevel?: number;
    assets?: number;
    assetNotes?: string;
  };

  // Active Transformation Engine (Wild Shape, Polymorph, Shapechange, Lycanthropy)
  activeTransformation?: ActiveTransformation;

  // Conditions & Status Effects
  conditions?: string[];
  conditionDurations?: Record<string, number>; // Maps condition name to remaining rounds (e.g. { 'Stunned': 1, 'Poisoned': 3 })
  exhaustionLevel?: number; // 0-6
  activeConcentration?: ActiveConcentration;

  // Vitals
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  maxHpModifier?: number; // Active temp/conditional Max HP modifier (e.g. +5 Aid spell, -10 Vampire Drain)
  hitDiceTotal: string; // e.g. "5d10"
  hitDiceCurrent: number;
  armorClass: number;
  initiativeBonus: number;
  speed: number; // feet (walking speed)
  speedFly?: number; // Fly speed in feet
  speedSwim?: number; // Swim speed in feet
  speedClimb?: number; // Climb speed in feet
  speedBurrow?: number; // Burrow speed in feet
  baseRacialSpeed?: number; // Racial base speed before manual modifications
  speedOverridden?: boolean; // Indicates user has manually adjusted speed
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
  containers?: ItemContainer[]; // Registered containers (e.g. Backpack, Bag of Holding, Handy Haversack)

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

  // Versioning, Campaign Affiliation & Session Sync (Base vs Session Characters)
  baseCharacterId?: string; // Links this character to its base character (for versions/duplicates)
  isBaseCharacter?: boolean; // Marks whether this character is the root base character template
  campaignName?: string; // Campaign affiliation or session tag (e.g. "Curse of Strahd")
  versionTag?: string; // Version label (e.g. "v1.0", "Main", "One-Shot Level 5")
  lastSyncedFromSessionAt?: string; // Timestamp of the last sync of permanent traits from session to base
  sessionState?: {
    sessionCode?: string;
    hpCurrent?: number;
    hpTemp?: number;
    conditions?: string[];
    conditionDurations?: Record<string, number>;
    deathSavesSuccesses?: number;
    deathSavesFailures?: number;
    spellSlotsCurrent?: Array<{ level: number; current: number }>;
  };

  // Lost Limbs & Lingering Permanent Injuries
  handsCountOverride?: number; // Override available hand slots (e.g. 1 hand for amputated/lost arm)
  lingeringInjuries?: string[]; // Permanent injuries (e.g. "Lost Left Arm", "Lost Eye", "Severed Leg")
}

export interface Party {
  id: string;
  name: string;
  description?: string;
  characterIds: string[];
  createdAt?: string;
}

export interface DieRollDetail {
  die: number;
  value: number;
  discarded?: boolean;
}

export interface DiePoolItem {
  die: number;
  count: number;
}

export interface DiceRollResult {
  id: string;
  timestamp: string;
  label: string;
  expression: string;
  diceRolls: number[];
  diceDetails?: DieRollDetail[];
  modifier: number;
  total: number;
  mode?: 'normal' | 'advantage' | 'disadvantage';
  isNat20?: boolean;
  isNat1?: boolean;
  isSecret?: boolean;
  isWhisperToDm?: boolean;
  rollerUid?: string;
  rollerName?: string;
  characterName?: string;
  targetUid?: string;
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

export interface CampaignSaveMemberSummary {
  uid: string;
  displayName: string;
  role: 'Player' | 'DM' | 'Tester';
  characterId?: string;
  characterName?: string;
  isUnassignedParticipant?: boolean;
}

export interface CampaignSaveFile {
  id: string; // e.g. "save_KUCTEF_1740000000"
  name: string; // e.g. "Curse of Strahd - Castle Ravenloft Checkpoint"
  sessionCode: string; // 6-digit room code
  hostUid: string; // DM's UID
  hostName: string; // DM's display name
  savedAt: string; // ISO date timestamp
  edition: RuleEdition;
  notes?: string;
  session: {
    name: string;
    code: string;
    optionalRules?: OptionalRulesConfig;
    members: CampaignSaveMemberSummary[];
    activeCharacterIds: string[];
  };
  characters: CharacterData[]; // Full snapshot of all characters with updated HP, spell slots, inventory, etc.
  parties?: Party[];
  campaignEntities?: any[];
}

export interface ActiveAmbienceState {
  streamId?: string;
  title?: string;
  url?: string;
  sourceType?: 'youtube' | 'spotify' | 'audio_url';
  embedUrl?: string;
  trackId?: string; // backwards-compatible optional field
  isPlaying: boolean;
  category?: string;
  intensity?: 'calm' | 'medium' | 'high';
  presetName?: string;
  changedBy?: string;
  updatedAt?: string;
}



