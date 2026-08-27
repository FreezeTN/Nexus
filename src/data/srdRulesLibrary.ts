import { CharacterData, ClassFeature, Feat, RuleEdition, Skill } from '../types';
import { DEFAULT_SKILLS_LIST, DEFAULT_35E_SKILLS_LIST } from '../utils/dndCalculations';
import { getMonsterPortraitUrl } from './monsterPortraits';

// ==========================================
// OFFICIAL D&D 5E FEATS
// ==========================================
export const OFFICIAL_5E_FEATS: Feat[] = [
  {
    id: 'feat-5e-1',
    name: 'Sharpshooter',
    source: 'Player’s Handbook',
    description: 'Attacking at long range doesn’t impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage.'
  },
  {
    id: 'feat-5e-2',
    name: 'Great Weapon Master',
    source: 'Player’s Handbook',
    description: 'On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action. Before you make a melee attack with a heavy weapon that you are proficient with, you can take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage roll.'
  },
  {
    id: 'feat-5e-3',
    name: 'War Caster',
    source: 'Player’s Handbook',
    description: 'You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage. You can perform the somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature’s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature rather than making an opportunity attack.'
  },
  {
    id: 'feat-5e-4',
    name: 'Actor',
    source: 'Player’s Handbook',
    description: 'Increase your Charisma score by 1, to a maximum of 20. You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person. You can mimic the speech of another person or the sounds made by other creatures that you have heard for at least 1 minute.'
  },
  {
    id: 'feat-5e-5',
    name: 'Alert',
    source: 'Player’s Handbook',
    description: 'You gain a +5 bonus to initiative. You can’t be surprised while you are conscious. Other creatures don’t gain advantage on attack rolls against you as a result of being unseen by you.'
  },
  {
    id: 'feat-5e-6',
    name: 'Sentinel',
    source: 'Player’s Handbook',
    description: 'When you hit a creature with an opportunity attack, the creature’s speed becomes 0 for the rest of the turn. Creatures provoke opportunity attacks from you even if they take the Disengage action. When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn’t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature.'
  },
  {
    id: 'feat-5e-7',
    name: 'Lucky',
    source: 'Player’s Handbook',
    description: 'You have 3 luck points per long rest. Whenever you make an attack roll, ability check, or saving throw, you can spend 1 luck point to roll an additional d20 and choose which d20 to use. You can also spend 1 luck point when an attack roll is made against you to roll a d20 and choose whether the attack uses the attacker’s roll or yours.'
  },
  {
    id: 'feat-5e-8',
    name: 'Mobile',
    source: 'Player’s Handbook',
    description: 'Your speed increases by 10 feet. When you use the Dash action, difficult terrain doesn’t cost you extra movement on that turn. When you make a melee attack against a creature, you don’t provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.'
  },
  {
    id: 'feat-5e-9',
    name: 'Resilient',
    source: 'Player’s Handbook',
    description: 'Choose one ability score. You gain +1 to that ability score and gain proficiency in saving throws using the chosen ability.'
  },
  {
    id: 'feat-5e-10',
    name: 'Polearm Master',
    source: 'Player’s Handbook',
    description: 'When you take the Attack action with a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon (1d4 bludgeoning damage). While wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon.'
  },
  {
    id: 'feat-5e-11',
    name: 'Crossbow Expert',
    source: 'Player’s Handbook',
    description: 'You ignore the loading quality of crossbows with which you are proficient. Being within 5 feet of a hostile creature doesn’t impose disadvantage on your ranged attack rolls. When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding.'
  },
  {
    id: 'feat-5e-12',
    name: 'Tough',
    source: 'Player’s Handbook',
    description: 'Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.'
  },
  {
    id: 'feat-5e-13',
    name: 'Elemental Adept',
    source: 'Player’s Handbook',
    description: 'Choose one damage type: acid, cold, fire, lightning, or thunder. Spells you cast ignore resistance to damage of the chosen type. In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.'
  },
  {
    id: 'feat-5e-14',
    name: 'Fey Touched',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase your Intelligence, Wisdom, or Charisma score by 1. You learn the Misty Step spell and one 1st-level spell of your choice from the Divination or Enchantment school of magic. You can cast each of these spells without expending a spell slot once per long rest.'
  },
  {
    id: 'feat-5e-15',
    name: 'Shadow Touched',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase your Intelligence, Wisdom, or Charisma score by 1. You learn the Invisibility spell and one 1st-level spell of your choice from the Illusion or Necromancy school of magic. You can cast each of these spells without expending a spell slot once per long rest.'
  },
  {
    id: 'feat-5e-16',
    name: 'Spell Sniper',
    source: 'Player’s Handbook',
    description: 'When you cast a spell that requires you to make an attack roll, the spell’s range is doubled. Your ranged spell attacks ignore half cover and three-quarters cover. You learn one cantrip that requires an attack roll.'
  },
  {
    id: 'feat-5e-17',
    name: 'Dual Wielder',
    source: 'Player’s Handbook',
    description: 'You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren’t light. You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one.'
  },
  {
    id: 'feat-5e-18',
    name: 'Heavy Armor Master',
    source: 'Player’s Handbook',
    description: 'Increase your Strength score by 1. While you are wearing heavy armor, nonmagical slashing, piercing, and bludgeoning damage that you take from weapons is reduced by 3.'
  },
  {
    id: 'feat-5e-19',
    name: 'Shield Master',
    source: 'Player’s Handbook',
    description: 'If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield. If you aren’t incapacitated, you can add your shield’s AC bonus to any DEX saving throw you make against a spell or other harmful effect that targets only you. If you are subjected to an effect that allows a DEX saving throw for half damage, you can use your reaction to take no damage on a success.'
  },
  {
    id: 'feat-5e-20',
    name: 'Observant',
    source: 'Player’s Handbook',
    description: 'Increase your Intelligence or Wisdom score by 1. If you can see a creature’s mouth while it is speaking a language you understand, you can interpret what it’s saying by reading its lips. You gain a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores.'
  },
  {
    id: 'feat-5e-21',
    name: 'Powerful Build / Little Giant',
    source: 'Volos Guide / Monsters of the Multiverse',
    description: 'You count as one size category larger when determining your carrying capacity and the weight you can push, drag, or lift.'
  },
  {
    id: 'feat-5e-22',
    name: 'Tavern Brawler',
    source: 'Player’s Handbook',
    description: 'Increase Strength or Constitution score by 1. You are proficient with improvised weapons. Your unarmed strike uses a d4 for damage. When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target.'
  },
  {
    id: 'feat-5e-23',
    name: 'Magic Initiate',
    source: 'Player’s Handbook',
    description: 'Choose a class: Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard. You learn two cantrips of your choice from that class’s spell list, plus one 1st-level spell from the same list which you can cast once per long rest without expending a spell slot.'
  },
  {
    id: 'feat-5e-24',
    name: 'Crusher',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase Strength or Constitution score by 1. Once per turn when you hit a creature with an attack that deals bludgeoning damage, you can move it 5 feet to an unoccupied space. When you score a critical hit with bludgeoning damage, attack rolls against the target have advantage until the start of your next turn.'
  },
  {
    id: 'feat-5e-25',
    name: 'Slasher',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase Strength or Dexterity score by 1. Once per turn when you hit a creature with an attack that deals slashing damage, you can reduce its speed by 10 feet until the start of your next turn. When you score a critical hit with slashing damage, the target has disadvantage on all attack rolls until the start of your next turn.'
  },
  {
    id: 'feat-5e-26',
    name: 'Piercer',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase Strength or Dexterity score by 1. Once per turn when you hit a creature with an attack that deals piercing damage, you can reroll one of the attack’s damage dice. When you score a critical hit with piercing damage, you can roll one additional damage die when determining the extra piercing damage.'
  },
  {
    id: 'feat-5e-27',
    name: 'Metamagic Adept (Subtle Spell)',
    source: 'Tasha’s Cauldron of Everything',
    description: 'You gain 2 sorcery points and learn 2 Metamagic options (such as Subtle Spell). Subtle Spell allows you to cast spells without verbal or somatic components—ideal for casting while in Wild Shape or animal forms without breaking stealth.'
  },
  {
    id: 'feat-5e-28',
    name: 'Telepathic (Wild Shape Communication)',
    source: 'Tasha’s Cauldron of Everything',
    description: 'Increase INT, WIS, or CHA by 1. You can speak telepathically to any creature you can see within 60 feet. This bypasses the normal restriction preventing vocal communication while transformed in Wild Shape or animal forms.'
  },
  {
    id: 'feat-5e-29',
    name: 'Eldritch Adept (Sculptor of Flesh / Mask of Many Faces)',
    source: 'Tasha’s Cauldron of Everything',
    description: 'You learn one Eldritch Invocation of your choice, such as Sculptor of Flesh (cast Polymorph once per long rest) or Mask of Many Faces (cast Disguise Self at will without expending a spell slot).'
  }
];

// ==========================================
// OFFICIAL D&D 3.5E FEATS
// ==========================================
export const OFFICIAL_35E_FEATS: Feat[] = [
  {
    id: 'feat-35e-1',
    name: 'Power Attack',
    source: 'D&D 3.5e SRD',
    description: 'On your action, before making attack rolls for a round, you may choose to subtract a number from all melee attack rolls and add the same number to all melee damage rolls. This number may not exceed your base attack bonus. If you attack with a two-handed weapon, add twice the subtracted number to damage.'
  },
  {
    id: 'feat-35e-2',
    name: 'Cleave',
    source: 'D&D 3.5e SRD',
    description: 'If you deal a creature enough damage to make it drop (below 0 hit points or killed), you get an immediate extra melee attack against another creature in an adjacent square. Prerequisite: STR 13, Power Attack.'
  },
  {
    id: 'feat-35e-3',
    name: 'Great Cleave',
    source: 'D&D 3.5e SRD',
    description: 'This feat works like Cleave, except that there is no limit to the number of extra attacks you can make per round because of Cleave. Prerequisite: STR 13, Power Attack, Cleave, BAB +4.'
  },
  {
    id: 'feat-35e-4',
    name: 'Point-Blank Shot',
    source: 'D&D 3.5e SRD',
    description: 'You get a +1 bonus on attack and damage rolls with ranged weapons at ranges of up to 30 feet.'
  },
  {
    id: 'feat-35e-5',
    name: 'Precise Shot',
    source: 'D&D 3.5e SRD',
    description: 'You can shoot or throw ranged weapons at an opponent engaged in melee without taking the standard -4 penalty on your attack roll. Prerequisite: Point-Blank Shot.'
  },
  {
    id: 'feat-35e-6',
    name: 'Rapid Shot',
    source: 'D&D 3.5e SRD',
    description: 'You can get one extra attack per round with a ranged weapon. The attack is at your highest base attack bonus, but each attack you make in that round (the extra one and the normal ones) takes a -2 penalty. Prerequisite: DEX 13, Point-Blank Shot.'
  },
  {
    id: 'feat-35e-7',
    name: 'Empower Spell [Metamagic]',
    source: 'D&D 3.5e SRD',
    description: 'All variable, numeric effects of an empowered spell are increased by 50%. Saving throws and opposed rolls are not affected. An empowered spell uses up a spell slot two levels higher than the spell’s actual level.'
  },
  {
    id: 'feat-35e-8',
    name: 'Maximize Spell [Metamagic]',
    source: 'D&D 3.5e SRD',
    description: 'All variable, numeric effects of a spell modified by this feat are maximized. Saving throws and opposed rolls are not affected. A maximized spell uses up a spell slot three levels higher than the spell’s actual level.'
  },
  {
    id: 'feat-35e-9',
    name: 'Quicken Spell [Metamagic]',
    source: 'D&D 3.5e SRD',
    description: 'Casting a quickened spell is a swift action. You can perform another action, even casting another spell, in the same turn. A quickened spell uses up a spell slot four levels higher than the spell’s actual level.'
  },
  {
    id: 'feat-35e-10',
    name: 'Dodge',
    source: 'D&D 3.5e SRD',
    description: 'During your action, you designate an opponent and receive a +1 dodge bonus to Armor Class against attacks from that opponent. Prerequisite: DEX 13.'
  },
  {
    id: 'feat-35e-11',
    name: 'Mobility',
    source: 'D&D 3.5e SRD',
    description: 'You get a +4 dodge bonus to Armor Class against attacks of opportunity caused when you move out of or within a threatened area. Prerequisite: DEX 13, Dodge.'
  },
  {
    id: 'feat-35e-12',
    name: 'Spring Attack',
    source: 'D&D 3.5e SRD',
    description: 'When using the attack action with a melee weapon, you can move both before and after the attack, provided that your total distance moved is not greater than your speed. Moving in this way doesn’t provoke an attack of opportunity from the defender you attack. Prerequisite: DEX 13, Dodge, Mobility, BAB +4.'
  },
  {
    id: 'feat-35e-13',
    name: 'Weapon Focus',
    source: 'D&D 3.5e SRD',
    description: 'You gain a +1 bonus on all attack rolls you make using the selected weapon. Prerequisite: Proficiency with selected weapon, BAB +1.'
  },
  {
    id: 'feat-35e-14',
    name: 'Weapon Specialization',
    source: 'D&D 3.5e SRD',
    description: 'You gain a +2 bonus on all damage rolls you make using the selected weapon. Prerequisite: Fighter level 4th, Weapon Focus with selected weapon.'
  },
  {
    id: 'feat-35e-15',
    name: 'Improved Critical',
    source: 'D&D 3.5e SRD',
    description: 'When using the weapon you selected, your threat range is doubled. For example, a longsword threatens a critical hit on 19-20; with this feat it threatens on 17-20. Prerequisite: Proficiency with weapon, BAB +8.'
  },
  {
    id: 'feat-35e-16',
    name: 'Improved Initiative',
    source: 'D&D 3.5e SRD',
    description: 'You get a +4 bonus on initiative checks.'
  },
  {
    id: 'feat-35e-17',
    name: 'Spell Focus',
    source: 'D&D 3.5e SRD',
    description: 'Add +1 to the Difficulty Class for all saving throws against spells from the school of magic you select.'
  },
  {
    id: 'feat-35e-18',
    name: 'Spell Penetration',
    source: 'D&D 3.5e SRD',
    description: 'You get a +2 bonus on caster level checks (1d20 + caster level) made to overcome a creature’s spell resistance.'
  },
  {
    id: 'feat-35e-19',
    name: 'Iron Will',
    source: 'D&D 3.5e SRD',
    description: 'You get a +2 bonus on all Will saving throws.'
  },
  {
    id: 'feat-35e-20',
    name: 'Great Fortitude',
    source: 'D&D 3.5e SRD',
    description: 'You get a +2 bonus on all Fortitude saving throws.'
  },
  {
    id: 'feat-35e-21',
    name: 'Lightning Reflexes',
    source: 'D&D 3.5e SRD',
    description: 'You get a +2 bonus on all Reflex saving throws.'
  },
  {
    id: 'feat-35e-22',
    name: 'Powerful Build (3.5e)',
    source: 'Expanded Psionics Handbook / Races of Stone',
    description: 'Whenever you are subject to a size modifier or special size modifier for Grapple, Bull Rush, Trip, Overrun, Sunder, or Carrying Capacity, you are treated as one size category larger.'
  },
  {
    id: 'feat-35e-23',
    name: 'Toughness',
    source: 'D&D 3.5e SRD',
    description: 'You gain +3 hit points. You may gain this feat multiple times.'
  },
  {
    id: 'feat-35e-24',
    name: 'Improved Grapple',
    source: 'D&D 3.5e SRD',
    description: 'You do not provoke an attack of opportunity when you make a touch attack to start a grapple. You also gain a +4 bonus on all grapple checks. Prerequisite: DEX 13, Improved Unarmed Strike.'
  },
  {
    id: 'feat-35e-25',
    name: 'Improved Unarmed Strike',
    source: 'D&D 3.5e SRD',
    description: 'You are considered to be armed even when unarmed — you do not provoke attacks of opportunity when striking unarmed. Your unarmed strikes deal lethal damage (1d3 for Medium).'
  },
  {
    id: 'feat-35e-26',
    name: 'Natural Spell',
    source: 'Player’s Handbook (p. 98)',
    description: 'You can complete the verbal and somatic components of spells while using Wild Shape. You can also use material components or spell focus items that are melded with your form. Prerequisite: WIS 13, Wild Shape class feature.'
  },
  {
    id: 'feat-35e-27',
    name: 'Fast Wild Shape',
    source: 'Complete Divine (p. 81)',
    description: 'You can assume a Wild Shape form as a Move Action instead of a Standard Action. Prerequisite: DEX 13, Wild Shape class feature.'
  },
  {
    id: 'feat-35e-28',
    name: 'Dragon Wild Shape',
    source: 'Draconomicon (p. 105)',
    description: 'You can use Wild Shape to assume the form of a Small or Medium dragon. You gain all supernatural and extraordinary abilities (breath weapon, flight, elemental immunities) of the dragon form. Prerequisite: WIS 19, Wild Shape (can turn into Huge animal).'
  },
  {
    id: 'feat-35e-29',
    name: 'Exalted Wild Shape',
    source: 'Book of Exalted Deeds (p. 42)',
    description: 'You can use Wild Shape to assume the form of a celestial creature, blink dog, or unicorn, gaining its supernatural qualities and damage resistance. Prerequisite: Wild Shape class feature, Good alignment.'
  },
  {
    id: 'feat-35e-30',
    name: 'Multiattack',
    source: 'Monster Manual / 3.5e SRD',
    description: 'The creature’s secondary attacks with natural weapons take only a -2 penalty instead of -5. Essential for beast and shapeshifting forms with multiple natural attack routines (Bite/Claw/Claw).'
  },
  {
    id: 'feat-35e-31',
    name: 'Frozen Wild Shape',
    source: 'Frostburn (p. 47)',
    description: 'You can use Wild Shape to assume the form of a magical beast with the Cold subtype, such as a Cryohydra or Frost Worm. Prerequisite: Wild Shape class feature.'
  }
];

// ==========================================
// OFFICIAL D&D 5E CLASS FEATURES
// ==========================================
export const OFFICIAL_5E_CLASS_FEATURES: (ClassFeature & { className: string; reqLevel: number })[] = [
  // Fighter
  { id: 'cf5e-fgt-1', className: 'Fighter', reqLevel: 1, name: 'Fighting Style', source: 'Fighter Level 1', description: 'Choose a fighting style: Defense (+1 AC in armor), Great Weapon Fighting (reroll 1s and 2s on damage dice), Dueling (+2 damage with one-handed melee), or Archery (+2 to ranged attack rolls).' },
  { id: 'cf5e-fgt-2', className: 'Fighter', reqLevel: 1, name: 'Second Wind', source: 'Fighter Level 1', description: 'Bonus action to regain 1d10 + Fighter Level hit points. Recharges on a Short or Long Rest.', usesMax: 1, usesRemaining: 1, recharge: 'Short Rest' },
  { id: 'cf5e-fgt-3', className: 'Fighter', reqLevel: 2, name: 'Action Surge', source: 'Fighter Level 2', description: 'On your turn, you can take one additional action on top of your regular action and possible bonus action. Recharges on a Short or Long Rest.', usesMax: 1, usesRemaining: 1, recharge: 'Short Rest' },
  { id: 'cf5e-fgt-4', className: 'Fighter', reqLevel: 5, name: 'Extra Attack', source: 'Fighter Level 5', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
  { id: 'cf5e-fgt-5', className: 'Fighter', reqLevel: 9, name: 'Indomitable', source: 'Fighter Level 9', description: 'You can reroll a saving throw that you fail. You must use the new roll. Recharges on a Long Rest.', usesMax: 1, usesRemaining: 1, recharge: 'Long Rest' },
  { id: 'cf5e-fgt-6', className: 'Fighter', reqLevel: 11, name: 'Extra Attack (2)', source: 'Fighter Level 11', description: 'You can attack three times whenever you take the Attack action on your turn.' },
  { id: 'cf5e-fgt-7', className: 'Fighter', reqLevel: 20, name: 'Extra Attack (3)', source: 'Fighter Level 20', description: 'You can attack four times whenever you take the Attack action on your turn.' },

  // Wizard
  { id: 'cf5e-wiz-1', className: 'Wizard', reqLevel: 1, name: 'Arcane Recovery', source: 'Wizard Level 1', description: 'Once per day when you finish a short rest, you can choose expended spell slots to recover with a combined level equal to or less than half your wizard level (rounded up).', usesMax: 1, usesRemaining: 1, recharge: 'Long Rest' },
  { id: 'cf5e-wiz-2', className: 'Wizard', reqLevel: 1, name: 'Spellbook & Ritual Casting', source: 'Wizard Level 1', description: 'You possess a spellbook containing wizard spells. You can cast any wizard spell in your spellbook as a ritual if that spell has the ritual tag.' },
  { id: 'cf5e-wiz-3', className: 'Wizard', reqLevel: 2, name: 'Sculpt Spells (Evocation)', source: 'Wizard Level 2', description: 'When you cast an evocation spell that affects other creatures you can see, you can choose 1 + spell level creatures to automatically succeed on their saving throws and take 0 damage if they would take half.' },
  { id: 'cf5e-wiz-4', className: 'Wizard', reqLevel: 10, name: 'Empowered Evocation', source: 'Wizard Level 10', description: 'You can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast.' },
  { id: 'cf5e-wiz-5', className: 'Wizard', reqLevel: 14, name: 'Overchannel', source: 'Wizard Level 14', description: 'When you cast a 1st through 5th level evocation spell that deals damage, you can deal maximum damage with that spell.' },
  { id: 'cf5e-wiz-6', className: 'Wizard', reqLevel: 20, name: 'Signature Spells', source: 'Wizard Level 20', description: 'Choose two 3rd-level wizard spells in your spellbook. You always have them prepared and can cast each once per short rest without spending a slot.' },

  // Rogue
  { id: 'cf5e-rog-1', className: 'Rogue', reqLevel: 1, name: 'Sneak Attack', source: 'Rogue Level 1', description: 'Once per turn, you can deal an extra 1d6 damage (scaling with level) to one creature you hit with an attack if you have advantage on the attack roll or if an ally is within 5 feet of the target.' },
  { id: 'cf5e-rog-2', className: 'Rogue', reqLevel: 1, name: 'Thieves’ Cant', source: 'Rogue Level 1', description: 'A secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.' },
  { id: 'cf5e-rog-3', className: 'Rogue', reqLevel: 2, name: 'Cunning Action', source: 'Rogue Level 2', description: 'You can use a bonus action on each of your turns in combat to take the Dash, Disengage, or Hide action.' },
  { id: 'cf5e-rog-4', className: 'Rogue', reqLevel: 5, name: 'Uncanny Dodge', source: 'Rogue Level 5', description: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack’s damage against you.' },
  { id: 'cf5e-rog-5', className: 'Rogue', reqLevel: 7, name: 'Evasion', source: 'Rogue Level 7', description: 'When you are subjected to an effect that allows you to make a DEX saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.' },
  { id: 'cf5e-rog-6', className: 'Rogue', reqLevel: 11, name: 'Reliable Talent', source: 'Rogue Level 11', description: 'Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.' },
  { id: 'cf5e-rog-7', className: 'Rogue', reqLevel: 20, name: 'Stroke of Luck', source: 'Rogue Level 20', description: 'If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20.', usesMax: 1, usesRemaining: 1, recharge: 'Short Rest' },

  // Paladin
  { id: 'cf5e-pal-1', className: 'Paladin', reqLevel: 1, name: 'Divine Sense', source: 'Paladin Level 1', description: 'As an action, you can open your awareness to detect celestial, fiend, or undead within 60 feet. Uses = 1 + CHA mod per long rest.', usesMax: 3, usesRemaining: 3, recharge: 'Long Rest' },
  { id: 'cf5e-pal-2', className: 'Paladin', reqLevel: 1, name: 'Lay on Hands', source: 'Paladin Level 1', description: 'You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your Paladin level × 5.', recharge: 'Long Rest' },
  { id: 'cf5e-pal-3', className: 'Paladin', reqLevel: 2, name: 'Fighting Style (Paladin)', source: 'Paladin Level 2', description: 'Select a Paladin Fighting Style: Blessed Warrior (2 Cleric Cantrips), Defense (+1 AC), Dueling (+2 damage), or Great Weapon Fighting.' },
  { id: 'cf5e-pal-4', className: 'Paladin', reqLevel: 2, name: 'Divine Smite', source: 'Paladin Level 2', description: 'When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target, in addition to the weapon’s damage (2d8 for 1st-level slot + 1d8 per higher level, +1d8 vs Undead/Fiends).' },
  { id: 'cf5e-pal-5', className: 'Paladin', reqLevel: 3, name: 'Divine Health', source: 'Paladin Level 3', description: 'The divine magic flowing through you makes you immune to disease.' },
  { id: 'cf5e-pal-6', className: 'Paladin', reqLevel: 3, name: 'Channel Divinity: Sacred Weapon / Turn Unholy', source: 'Paladin Level 3', description: 'As an action, add your Charisma modifier to attack rolls with a weapon for 1 minute or turn fiends and undead within 30 feet.', usesMax: 1, usesRemaining: 1, recharge: 'Short Rest' },
  { id: 'cf5e-pal-7', className: 'Paladin', reqLevel: 5, name: 'Extra Attack (Paladin)', source: 'Paladin Level 5', description: 'You can attack twice, instead of once, whenever you take the Attack action on your turn.' },
  { id: 'cf5e-pal-8', className: 'Paladin', reqLevel: 6, name: 'Aura of Protection', source: 'Paladin Level 6', description: 'Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier (minimum of +1).' },
  { id: 'cf5e-pal-9', className: 'Paladin', reqLevel: 10, name: 'Aura of Courage', source: 'Paladin Level 10', description: 'You and friendly creatures within 10 feet of you can’t be frightened while you are conscious.' },
  { id: 'cf5e-pal-10', className: 'Paladin', reqLevel: 11, name: 'Improved Divine Smite', source: 'Paladin Level 11', description: 'All your melee weapon strikes are infused with divine energy. Whenever you hit a creature with a melee weapon, the target takes an extra 1d8 radiant damage.' },
  { id: 'cf5e-pal-11', className: 'Paladin', reqLevel: 14, name: 'Cleansing Touch', source: 'Paladin Level 14', description: 'Use your action to end one spell on yourself or on one willing creature that you touch. Uses = Charisma modifier per long rest.', recharge: 'Long Rest' },
  { id: 'cf5e-pal-12', className: 'Paladin', reqLevel: 18, name: 'Aura Expansion', source: 'Paladin Level 18', description: 'The range of your Aura of Protection and Aura of Courage expands from 10 feet out to 30 feet.' },

  // Barbarian
  { id: 'cf5e-bar-1', className: 'Barbarian', reqLevel: 1, name: 'Rage', source: 'Barbarian Level 1', description: 'Bonus action to enter a rage. You have advantage on STR checks/saves, bonus to melee damage (+2 to +4), and resistance to bludgeoning, piercing, and slashing damage.', usesMax: 2, usesRemaining: 2, recharge: 'Long Rest' },
  { id: 'cf5e-bar-2', className: 'Barbarian', reqLevel: 1, name: 'Unarmored Defense (Barbarian)', source: 'Barbarian Level 1', description: 'While you are not wearing armor, your Armor Class equals 10 + DEX modifier + CON modifier. You can use a shield and still gain this benefit.' },
  { id: 'cf5e-bar-3', className: 'Barbarian', reqLevel: 2, name: 'Reckless Attack', source: 'Barbarian Level 2', description: 'When you make your first attack on your turn, you can decide to attack recklessly. Doing so gives you advantage on melee weapon attack rolls using Strength, but attack rolls against you have advantage until your next turn.' },
  { id: 'cf5e-bar-4', className: 'Barbarian', reqLevel: 2, name: 'Danger Sense', source: 'Barbarian Level 2', description: 'You have advantage on DEX saving throws against effects that you can see, such as traps and spells, provided you aren’t blinded, deafened, or incapacitated.' },
  { id: 'cf5e-bar-5', className: 'Barbarian', reqLevel: 5, name: 'Extra Attack & Fast Movement', source: 'Barbarian Level 5', description: 'You can attack twice on your turn. Your speed increases by 10 feet while you aren’t wearing heavy armor.' },
  { id: 'cf5e-bar-6', className: 'Barbarian', reqLevel: 9, name: 'Brutal Critical', source: 'Barbarian Level 9', description: 'You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack.' },
  { id: 'cf5e-bar-7', className: 'Barbarian', reqLevel: 11, name: 'Relentless Rage', source: 'Barbarian Level 11', description: 'If you drop to 0 HP while raging and don’t die outright, pass a DC 10 CON save to drop to 1 HP instead.' },
  { id: 'cf5e-bar-8', className: 'Barbarian', reqLevel: 20, name: 'Primal Champion', source: 'Barbarian Level 20', description: 'Your Strength and Constitution scores increase by 4. Your maximum for those scores is now 24.' },

  // Cleric
  { id: 'cf5e-clr-1', className: 'Cleric', reqLevel: 1, name: 'Divine Domain Feature', source: 'Cleric Level 1', description: 'You gain 1st-level domain features (such as Disciple of Life: +2 + spell level bonus healing for Life Domain, or Warding Flare for Light Domain).' },
  { id: 'cf5e-clr-2', className: 'Cleric', reqLevel: 2, name: 'Channel Divinity: Turn Undead', source: 'Cleric Level 2', description: 'As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead within 30 feet must make a Wisdom saving throw or be turned for 1 minute or until it takes damage.', usesMax: 1, usesRemaining: 1, recharge: 'Short Rest' },
  { id: 'cf5e-clr-3', className: 'Cleric', reqLevel: 2, name: 'Channel Divinity: Domain Feature', source: 'Cleric Level 2', description: 'You gain your domain-specific Channel Divinity option (such as Preserve Life: heal allies within 30ft up to 5 × Cleric level HP).' },
  { id: 'cf5e-clr-4', className: 'Cleric', reqLevel: 5, name: 'Destroy Undead', source: 'Cleric Level 5', description: 'When an undead fails its saving throw against your Turn Undead feature, the creature is instantly destroyed if its challenge rating is at or below the threshold for your Cleric level (CR 1/2 at Lvl 5, CR 1 at Lvl 8, CR 2 at Lvl 11, CR 3 at Lvl 14, CR 4 at Lvl 17).' },
  { id: 'cf5e-clr-5', className: 'Cleric', reqLevel: 8, name: 'Blessed Strikes / Divine Strike', source: 'Cleric Level 8', description: 'Once on each of your turns when you hit a creature with a weapon attack or deal damage with a cantrip, you deal an extra 1d8 radiant damage.' },
  { id: 'cf5e-clr-6', className: 'Cleric', reqLevel: 10, name: 'Divine Intervention', source: 'Cleric Level 10', description: 'As an action, describe the assistance you seek and roll percentile dice (d100). If you roll a number equal to or lower than your cleric level, your deity intervenes.', recharge: 'Long Rest' },
  { id: 'cf5e-clr-7', className: 'Cleric', reqLevel: 17, name: 'Supreme Healing', source: 'Cleric Level 17', description: 'When you would normally roll one or more dice to restore hit points with a spell, you instead use the highest possible number for each die.' },

  // Druid / Shapeshifter
  { id: 'cf5e-dru-1', className: 'Druid', reqLevel: 1, name: 'Druidic Language & Spellcasting', source: 'Druid Level 1', description: 'You know Druidic, the secret language of druids. You cast divine spells drawn from the druid spell list.' },
  { id: 'cf5e-dru-2', className: 'Druid', reqLevel: 2, name: 'Wild Shape (Shapeshift)', source: 'Druid Level 2', description: 'Action to assume the shape of a beast you have seen before. You gain the beast’s hit points, armor class, movement, and physical Strength/Dexterity/Constitution statistics while retaining your mental scores.', usesMax: 2, usesRemaining: 2, recharge: 'Short Rest' },
  { id: 'cf5e-dru-3', className: 'Druid', reqLevel: 2, name: 'Combat Wild Shape (Circle of the Moon)', source: 'Druid Level 2', description: 'You can use Wild Shape as a Bonus Action instead of an Action. While transformed, you can spend a spell slot as a bonus action to regain 1d8 HP per spell slot level.' },
  { id: 'cf5e-dru-4', className: 'Druid', reqLevel: 2, name: 'Circle Forms (Shapeshifter CR Upgrade)', source: 'Druid Level 2', description: 'You can transform into beasts of CR 1 (such as Brown Bear, Dire Wolf, Giant Spider). At 6th level you can transform into CR 2 beasts, and at 9th level CR 3 beasts.' },
  { id: 'cf5e-dru-5', className: 'Druid', reqLevel: 6, name: 'Primal Strike (Magical Beast Attacks)', source: 'Druid Level 6', description: 'Your attacks in beast form count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.' },
  { id: 'cf5e-dru-6', className: 'Druid', reqLevel: 10, name: 'Elemental Wild Shape', source: 'Druid Level 10', description: 'You can expend two uses of Wild Shape at the same time to transform into an Air Elemental, Earth Elemental, Fire Elemental, or Water Elemental.' },
  { id: 'cf5e-dru-7', className: 'Druid', reqLevel: 14, name: 'Thousand Faces (At-Will Shapeshifting)', source: 'Druid Level 14', description: 'You gain the ability to cast Alter Self at will without expending a spell slot to freely change your humanoid form.' },
  { id: 'cf5e-dru-8', className: 'Druid', reqLevel: 18, name: 'Beast Spells', source: 'Druid Level 18', description: 'You can cast many of your druid spells in any shape you assume using Wild Shape (providing verbal and somatic components).' },
  { id: 'cf5e-dru-9', className: 'Druid', reqLevel: 20, name: 'Archdruid (Infinite Wild Shape)', source: 'Druid Level 20', description: 'You can use Wild Shape an unlimited number of times. You ignore verbal and somatic components of druid spells.' },

  // Bard
  { id: 'cf5e-brd-1', className: 'Bard', reqLevel: 1, name: 'Bardic Inspiration', source: 'Bard Level 1', description: 'Bonus action to give a d6 inspiration die to an ally within 60 feet. They can add it to an ability check, attack roll, or saving throw.', usesMax: 3, usesRemaining: 3, recharge: 'Long Rest' },
  { id: 'cf5e-brd-2', className: 'Bard', reqLevel: 2, name: 'Jack of All Trades', source: 'Bard Level 2', description: 'You can add half your proficiency bonus (rounded down) to any ability check you make that doesn’t already include your proficiency bonus.' },
  { id: 'cf5e-brd-3', className: 'Bard', reqLevel: 2, name: 'Song of Rest', source: 'Bard Level 2', description: 'Perform during a short rest to help revitalize wounded allies. Allies regain an extra 1d6 hit points if they spend hit dice.' },
  { id: 'cf5e-brd-4', className: 'Bard', reqLevel: 5, name: 'Font of Inspiration', source: 'Bard Level 5', description: 'You regain all of your expended uses of Bardic Inspiration when you finish a short or long rest.' },
  { id: 'cf5e-brd-5', className: 'Bard', reqLevel: 6, name: 'Countercharm', source: 'Bard Level 6', description: 'As an action, perform to grant yourself and friendly creatures within 30 feet advantage on saving throws against being frightened or charmed.' },
  { id: 'cf5e-brd-6', className: 'Bard', reqLevel: 10, name: 'Magical Secrets', source: 'Bard Level 10', description: 'Choose two spells from any class list (including paladin/ranger/wizard/cleric). A chosen spell counts as a bard spell for you.' },

  // Monk
  { id: 'cf5e-mnk-1', className: 'Monk', reqLevel: 1, name: 'Unarmored Defense (Monk)', source: 'Monk Level 1', description: 'While you are wearing no armor and not wielding a shield, your AC equals 10 + DEX modifier + WIS modifier.' },
  { id: 'cf5e-mnk-2', className: 'Monk', reqLevel: 1, name: 'Martial Arts & Ki', source: 'Monk Level 1', description: 'Use DEX for attack and damage with unarmed strikes and monk weapons. Make an unarmed strike as a bonus action after taking the Attack action.' },
  { id: 'cf5e-mnk-3', className: 'Monk', reqLevel: 2, name: 'Ki Points (Flurry / Patient / Step)', source: 'Monk Level 2', description: 'Spend Ki points to fuel Flurry of Blows (2 bonus unarmed strikes), Patient Defense (Dodge bonus action), or Step of the Wind (Disengage/Dash).', usesMax: 2, usesRemaining: 2, recharge: 'Short Rest' },
  { id: 'cf5e-mnk-4', className: 'Monk', reqLevel: 3, name: 'Deflect Missiles', source: 'Monk Level 3', description: 'Use your reaction to deflect or catch the missile when you are hit by a ranged weapon attack, reducing damage by 1d10 + DEX mod + Monk level.' },
  { id: 'cf5e-mnk-5', className: 'Monk', reqLevel: 5, name: 'Extra Attack & Stunning Strike', source: 'Monk Level 5', description: 'Attack twice. When you hit with a melee weapon attack, spend 1 Ki point to force a CON save or stun the target until the end of your next turn.' },
  { id: 'cf5e-mnk-6', className: 'Monk', reqLevel: 6, name: 'Ki-Empowered Strikes', source: 'Monk Level 6', description: 'Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks.' },
  { id: 'cf5e-mnk-7', className: 'Monk', reqLevel: 7, name: 'Evasion & Stillness of Mind', source: 'Monk Level 7', description: 'Take 0 damage on successful DEX save (half on fail). Use your action to end one effect on yourself that is causing you to be charmed or frightened.' },
  { id: 'cf5e-mnk-8', className: 'Monk', reqLevel: 14, name: 'Diamond Soul', source: 'Monk Level 14', description: 'You gain proficiency in all saving throws. When you fail a saving throw, spend 1 Ki point to reroll it.' },

  // Ranger
  { id: 'cf5e-rng-1', className: 'Ranger', reqLevel: 1, name: 'Favored Enemy & Natural Explorer', source: 'Ranger Level 1', description: 'Advantage on Wisdom (Survival) checks to track chosen favored enemies and Intelligence checks to recall information about them.' },
  { id: 'cf5e-rng-2', className: 'Ranger', reqLevel: 2, name: 'Fighting Style (Ranger)', source: 'Ranger Level 2', description: 'Choose Archery (+2 attack), Defense (+1 AC), Dueling (+2 damage), or Two-Weapon Fighting.' },
  { id: 'cf5e-rng-3', className: 'Ranger', reqLevel: 3, name: 'Primeval Awareness', source: 'Ranger Level 3', description: 'Spend a spell slot to focus your awareness. Sense whether aberrants, celestials, dragons, elemental, fiends, or undead are within 1 mile.' },
  { id: 'cf5e-rng-4', className: 'Ranger', reqLevel: 5, name: 'Extra Attack (Ranger)', source: 'Ranger Level 5', description: 'You can attack twice whenever you take the Attack action on your turn.' },
  { id: 'cf5e-rng-5', className: 'Ranger', reqLevel: 8, name: 'Land’s Stride', source: 'Ranger Level 8', description: 'Moving through nonmagical difficult terrain costs you no extra movement. Pass through nonmagical plants without damage or slow.' },

  // Sorcerer
  { id: 'cf5e-sor-1', className: 'Sorcerer', reqLevel: 1, name: 'Sorcerous Origin', source: 'Sorcerer Level 1', description: 'Your innate magic comes from a sorcerous origin (e.g. Draconic Bloodline: +1 HP/lvl & AC 13 + DEX, Wild Magic: Wild Magic Surge).' },
  { id: 'cf5e-sor-2', className: 'Sorcerer', reqLevel: 2, name: 'Font of Magic & Sorcery Points', source: 'Sorcerer Level 2', description: 'You gain sorcery points equal to your sorcerer level that you can convert into spell slots or use to fuel Metamagic.' },
  { id: 'cf5e-sor-3', className: 'Sorcerer', reqLevel: 3, name: 'Metamagic Options', source: 'Sorcerer Level 3', description: 'Apply Metamagic to spells: Quickened Spell (cast as bonus action), Twinned Spell (target 2 creatures), Empowered Spell (reroll damage dice).' },

  // Warlock
  { id: 'cf5e-war-1', className: 'Warlock', reqLevel: 1, name: 'Otherworldly Patron & Pact Magic', source: 'Warlock Level 1', description: 'You strike a bargain with an otherworldly patron (Fiend, Archfey, Great Old One, Hexblade). Spell slots recharge on a Short Rest.' },
  { id: 'cf5e-war-2', className: 'Warlock', reqLevel: 2, name: 'Eldritch Invocations', source: 'Warlock Level 2', description: 'Choose eldritch invocations (Agonizing Blast: add CHA to Eldritch Blast damage, Devil’s Sight: see in magical darkness).' },
  { id: 'cf5e-war-3', className: 'Warlock', reqLevel: 3, name: 'Pact Boon', source: 'Warlock Level 3', description: 'Your patron grants a pact gift: Pact of the Blade (summon magical weapon), Pact of the Chain (find familiar), or Pact of the Tome (3 cantrips).' },

  // Artificer
  { id: 'cf5e-art-1', className: 'Artificer', reqLevel: 1, name: 'Magical Tinkering & Spellcasting', source: 'Artificer Level 1', description: 'Imbue mundane objects with minor magical properties or light. You cast spells prepared using thieves’ tools or artisan tools.' },
  { id: 'cf5e-art-2', className: 'Artificer', reqLevel: 2, name: 'Infuse Item', source: 'Artificer Level 2', description: 'Gain the ability to produce magic items (Enhanced Weapon +1, Enhanced Defense +1, Replicating Magic Items).' },
  { id: 'cf5e-art-3', className: 'Artificer', reqLevel: 7, name: 'Flash of Genius', source: 'Artificer Level 7', description: 'When you or another creature you see makes an ability check or saving throw, add your Intelligence modifier to the roll.', usesMax: 3, usesRemaining: 3, recharge: 'Long Rest' }
];

// ==========================================
// OFFICIAL D&D 3.5E CLASS FEATURES
// ==========================================
export const OFFICIAL_35E_CLASS_FEATURES: (ClassFeature & { className: string; reqLevel: number })[] = [
  { id: 'cf35-fgt-1', className: 'Fighter', reqLevel: 1, name: 'Fighter Bonus Feat', source: 'Fighter 3.5e', description: 'At 1st level, 2nd level, and every two fighter levels thereafter, a fighter gets a bonus feat in addition to the feat that any character gets.' },
  { id: 'cf35-wiz-1', className: 'Wizard', reqLevel: 1, name: 'Summon Familiar', source: 'Wizard 3.5e', description: 'A wizard can summon a familiar (bat, cat, hawk, lizard, owl, rat, raven, snake, toad, or weasel) to obtain special skill and alertness bonuses.' },
  { id: 'cf35-wiz-2', className: 'Wizard', reqLevel: 1, name: 'Scribe Scroll', source: 'Wizard 3.5e', description: 'A wizard gains Scribe Scroll as a bonus feat at 1st level, allowing creation of magic scrolls from known spells.' },
  { id: 'cf35-rog-1', className: 'Rogue', reqLevel: 1, name: 'Sneak Attack +1d6', source: 'Rogue 3.5e', description: 'If a rogue can catch an opponent when she is unable to defend herself effectively from her attack, she can strike a vital spot for extra damage (+1d6 at 1st lvl, +1d6 every 2 levels).' },
  { id: 'cf35-rog-2', className: 'Rogue', reqLevel: 1, name: 'Trapfinding', source: 'Rogue 3.5e', description: 'Rogues can use the Search skill to locate traps when the task has a Difficulty Class higher than 20, and can use Disable Device to disarm magic traps.' },
  { id: 'cf35-rog-3', className: 'Rogue', reqLevel: 2, name: 'Evasion', source: 'Rogue 3.5e', description: 'If a rogue makes a successful Reflex saving throw against an attack that normally deals half damage on a successful save, she instead takes no damage.' },
  { id: 'cf35-clr-1', className: 'Cleric', reqLevel: 1, name: 'Turn or Rebuke Undead', source: 'Cleric 3.5e', description: 'Good clerics can turn or destroy undead creatures. Evil clerics can rebuke or command such creatures. Uses per day = 3 + Charisma modifier.', recharge: 'Long Rest' },
  { id: 'cf35-bar-1', className: 'Barbarian', reqLevel: 1, name: 'Barbarian Rage', source: 'Barbarian 3.5e', description: 'A barbarian can fly into a rage. Grants +4 Strength, +4 Constitution, +2 morale bonus on Will saves, and a -2 penalty to AC for 3 + CON mod rounds.', recharge: 'Long Rest' },
  { id: 'cf35-pal-1', className: 'Paladin', reqLevel: 2, name: 'Smite Evil', source: 'Paladin 3.5e', description: 'Once per day, a paladin may attempt to smite evil with one normal melee attack. She adds her Charisma bonus to her attack roll and deals 1 extra point of damage per paladin level.' },
  { id: 'cf35-pal-2', className: 'Paladin', reqLevel: 2, name: 'Divine Grace', source: 'Paladin 3.5e', description: 'A paladin gains a bonus equal to her Charisma bonus (if any) on all saving throws (Fortitude, Reflex, Will).' },
  { id: 'cf35-dru-1', className: 'Druid', reqLevel: 1, name: 'Nature Sense & Animal Companion', source: 'Druid 3.5e', description: 'Gain +2 bonus on Knowledge (nature) and Survival checks. Obtain an animal companion (badger, camel, dire rat, dog, eagle, hawk, horse, owl, pony, snake, or wolf).' },
  { id: 'cf35-dru-2', className: 'Druid', reqLevel: 5, name: 'Wild Shape (3.5e)', source: 'Druid 3.5e', description: 'Assume the form of a Small or Medium animal 1/day (increases to 2/day at 6th, 3/day at 7th, 4/day at 10th). You take on physical abilities while keeping mental scores.' },
  { id: 'cf35-dru-3', className: 'Druid', reqLevel: 8, name: 'Wild Shape (Large)', source: 'Druid 3.5e', description: 'Wild shape forms include Large animals (Dire Wolf, Brown Bear, Rhinoceros, Tiger).' },
  { id: 'cf35-dru-4', className: 'Druid', reqLevel: 16, name: 'Wild Shape (Elemental)', source: 'Druid 3.5e', description: 'Assume the form of a Small, Medium, or Large Air, Earth, Fire, or Water Elemental.' }
];

/**
 * Automatically syncs official class features for a character based on their class, level, and edition.
 * Strips previous auto-assigned class features while preserving user custom entries.
 */
export function syncClassFeaturesForCharacter(
  character: CharacterData,
  targetClassName?: string,
  targetLevelNum?: number,
  edition: RuleEdition = '5e'
): CharacterData {
  const activeClass = targetClassName || character.characterClass || 'Fighter';
  const activeLevel = targetLevelNum !== undefined ? targetLevelNum : (character.level || 1);
  const activeEdition = edition || character.edition || '5e';

  const catalog = activeEdition === '3.5e' ? OFFICIAL_35E_CLASS_FEATURES : OFFICIAL_5E_CLASS_FEATURES;

  // Find all matching features for the active class where reqLevel <= activeLevel
  const matchingFeatures = catalog.filter(f => {
    const classMatch = f.className.toLowerCase() === activeClass.toLowerCase() ||
      activeClass.toLowerCase().includes(f.className.toLowerCase()) ||
      f.className.toLowerCase().includes(activeClass.toLowerCase());
    return classMatch && f.reqLevel <= activeLevel;
  });

  // Preserve non-auto features (custom user features or features from other sources/races/forms)
  const nonAutoFeatures = (character.classFeatures || []).filter(f => {
    const isAutoClass = f.source && (f.source.startsWith('AutoClass:') || f.source.includes('Level'));
    const isMatchingOfficialId = catalog.some(catItem => catItem.id === f.id);
    return !isAutoClass && !isMatchingOfficialId;
  });

  // Convert catalog items into character ClassFeatures
  const newClassFeatures: ClassFeature[] = matchingFeatures.map(f => ({
    id: f.id,
    name: f.name,
    source: `AutoClass: ${f.className} Lvl ${f.reqLevel}`,
    description: f.description,
    usesMax: f.usesMax,
    usesRemaining: f.usesRemaining !== undefined ? f.usesRemaining : f.usesMax,
    recharge: f.recharge,
  }));

  // Merge unique features
  const mergedFeaturesMap = new Map<string, ClassFeature>();
  for (const feat of [...nonAutoFeatures, ...newClassFeatures]) {
    mergedFeaturesMap.set(feat.name.toLowerCase(), feat);
  }

  return {
    ...character,
    characterClass: activeClass,
    level: activeLevel,
    classFeatures: Array.from(mergedFeaturesMap.values()),
  };
}


// ==========================================
// BULK OFFICIAL MONSTERS (D&D 5E & 3.5E)
// ==========================================

function make5eSkills(proficientNames: string[] = [], expertiseNames: string[] = []): Skill[] {
  return DEFAULT_SKILLS_LIST.map((s, idx) => ({
    id: `sk-5e-${idx}-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: s.name,
    ability: s.ability,
    proficient: proficientNames.includes(s.name) || expertiseNames.includes(s.name),
    expertise: expertiseNames.includes(s.name)
  }));
}

function make35eSkills(trainedRanks: number = 0, specificRanks: Record<string, number> = {}): Skill[] {
  return DEFAULT_35E_SKILLS_LIST.map((s, idx) => ({
    id: `sk-35e-${idx}-${s.name.toLowerCase().replace(/[\s\(\)]+/g, '-')}`,
    name: s.name,
    ability: s.ability,
    proficient: false,
    ranks: specificRanks[s.name] !== undefined ? specificRanks[s.name] : trainedRanks,
    isClassSkill: true
  }));
}

const DEFAULT_MONSTER_FIELDS: Partial<CharacterData> = {
  race: 'Monster',
  characterClass: 'Monster',
  subclass: 'CR 1/2',
    challengeRating: '1/2',
  level: 1,
  background: 'Monster',
  alignment: 'Neutral',
  experiencePoints: 100,
  edition: '5e',
  hpMax: 10,
  hpCurrent: 10,
  hpTemp: 0,
  hitDiceTotal: '1d8',
  hitDiceCurrent: 1,
  armorClass: 10,
  initiativeBonus: 0,
  speed: 30,
  inspiration: false,
  deathSavesSuccesses: 0,
  deathSavesFailures: 0,
  abilities: {
    STR: { score: 10 },
    DEX: { score: 10 },
    CON: { score: 10 },
    INT: { score: 10 },
    WIS: { score: 10 },
    CHA: { score: 10 },
  },
  savingThrowProficiencies: [],
  skills: [],
  classFeatures: [],
  feats: [],
  attacks: [],
  wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  inventory: [],
  isSpellcaster: false,
  spells: [],
  spellSlots: [],
  isMonster: true,
  monsterXpReward: 100,
};

export const OFFICIAL_BULK_MONSTERS: CharacterData[] = ([
  // ----------------------- 5E MONSTERS -----------------------
  {
    id: 'monster-5e-goblin',
    name: 'Goblin',
    race: 'Goblinoid',
    characterClass: 'Monster',
    subclass: 'CR 1/4',
    challengeRating: '1/4',
    level: 1,
    edition: '5e',
    background: 'Small Humanoid',
    alignment: 'Neutral Evil',
    experiencePoints: 50,
    isMonster: true,
    monsterXpReward: 50,
    hpMax: 7,
    hpCurrent: 7,
    armorClass: 15,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '2d6',
    hitDiceCurrent: 2,
    abilities: {
      STR: { score: 8 },
      DEX: { score: 14 },
      CON: { score: 10 },
      INT: { score: 10 },
      WIS: { score: 8 },
      CHA: { score: 8 }
    },
    savingThrowProficiencies: [],
    skills: make5eSkills(['Stealth']),
    attacks: [
      { id: 'atk-gob-1', name: 'Scimitar', attackBonus: 4, damage: '1d6 + 2', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-gob-2', name: 'Shortbow', attackBonus: 4, damage: '1d6 + 2', damageType: 'Piercing', range: '80/320 ft' }
    ],
    classFeatures: [
      { id: 'trait-gob-1', name: 'Nimble Escape', source: 'Goblin Trait', description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.' }
    ],
    inventory: [{ id: 'i-gob-1', name: 'Scimitar', quantity: 1, weight: 3, equipped: true }, { id: 'i-gob-2', name: 'Leather Armor & Shield', quantity: 1, weight: 15, equipped: true }],
    wealth: { cp: 12, sp: 5, ep: 0, gp: 2, pp: 0 }
  },
  {
    id: 'monster-5e-orc',
    name: 'Orc Warrior',
    race: 'Orc',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 2,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Chaotic Evil',
    experiencePoints: 100,
    isMonster: true,
    monsterXpReward: 100,
    hpMax: 15,
    hpCurrent: 15,
    armorClass: 13,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '2d8+6',
    hitDiceCurrent: 2,
    abilities: {
      STR: { score: 16 },
      DEX: { score: 12 },
      CON: { score: 16 },
      INT: { score: 7 },
      WIS: { score: 11 },
      CHA: { score: 10 }
    },
    savingThrowProficiencies: [],
    skills: make5eSkills(['Intimidation']),
    attacks: [
      { id: 'atk-orc-1', name: 'Greataxe', attackBonus: 5, damage: '1d12 + 3', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-orc-2', name: 'Javelin', attackBonus: 5, damage: '1d6 + 3', damageType: 'Piercing', range: '30/120 ft' }
    ],
    classFeatures: [
      { id: 'trait-orc-1', name: 'Aggressive', source: 'Orc Trait', description: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.' }
    ],
    inventory: [{ id: 'i-orc-1', name: 'Greataxe', quantity: 1, weight: 7, equipped: true }, { id: 'i-orc-2', name: 'Hide Armor', quantity: 1, weight: 12, equipped: true }],
    wealth: { cp: 4, sp: 18, ep: 0, gp: 5, pp: 0 }
  },
  {
    id: 'monster-5e-minotaur',
    name: 'Minotaur',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 6,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Chaotic Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    hpMax: 76,
    hpCurrent: 76,
    armorClass: 14,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '9d10+27',
    hitDiceCurrent: 9,
    abilities: {
      STR: { score: 18 },
      DEX: { score: 11 },
      CON: { score: 16 },
      INT: { score: 6 },
      WIS: { score: 16 },
      CHA: { score: 9 }
    },
    savingThrowProficiencies: [],
    skills: make5eSkills(['Perception']),
    attacks: [
      { id: 'atk-mino-1', name: 'Greataxe', attackBonus: 6, damage: '2d12 + 4', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-mino-2', name: 'Gore (Horns)', attackBonus: 6, damage: '2d8 + 4', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'trait-mino-1', name: 'Charge', source: 'Minotaur Trait', description: 'If the minotaur moves at least 10 feet straight toward a target and hits it with a gore attack, the target takes an extra 2d8 piercing damage and must succeed on a DC 14 STR save or be pushed up to 10 feet away and knocked prone.' },
      { id: 'trait-mino-2', name: 'Labyrinthine Recall', source: 'Minotaur Trait', description: 'The minotaur can perfectly recall any path it has traveled.' }
    ],
    inventory: [{ id: 'i-mino-1', name: 'Greataxe', quantity: 1, weight: 12, equipped: true }],
    wealth: { cp: 0, sp: 80, ep: 0, gp: 35, pp: 0 }
  },
  {
    id: 'monster-5e-red-dragon',
    name: 'Adult Red Dragon',
    race: 'Dragon',
    characterClass: 'Monster',
    subclass: 'CR 17',
    challengeRating: '17',
    level: 17,
    edition: '5e',
    background: 'Huge Dragon',
    alignment: 'Chaotic Evil',
    experiencePoints: 18000,
    isMonster: true,
    monsterXpReward: 18000,
    hpMax: 256,
    hpCurrent: 256,
    armorClass: 19,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '19d12+133',
    hitDiceCurrent: 19,
    abilities: {
      STR: { score: 27 },
      DEX: { score: 10 },
      CON: { score: 25 },
      INT: { score: 16 },
      WIS: { score: 13 },
      CHA: { score: 21 }
    },
    savingThrowProficiencies: ['DEX', 'CON', 'WIS', 'CHA'],
    skills: make5eSkills(['Stealth'], ['Perception']),
    attacks: [
      { id: 'atk-rdrag-1', name: 'Bite', attackBonus: 14, damage: '2d10 + 8 + 2d6', damageType: 'Piercing', range: '10 ft Melee', notes: 'Deals extra 2d6 Fire damage' },
      { id: 'atk-rdrag-2', name: 'Claw', attackBonus: 14, damage: '2d6 + 8', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-rdrag-3', name: 'Fire Breath (DC 21 CON)', attackBonus: 0, damage: '18d6', damageType: 'Fire', range: '60 ft Cone' }
    ],
    multiattack: 'The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-rdrag-1', name: 'Detect', cost: 1, description: 'The dragon makes a Wisdom (Perception) check.' },
      { id: 'leg-rdrag-2', name: 'Tail Attack', cost: 1, description: 'The dragon makes a tail attack (+14 to hit, 2d8+8 bludgeoning damage).' },
      { id: 'leg-rdrag-3', name: 'Wing Attack', cost: 2, description: 'Creatures within 10 ft DC 22 DEX save or take 15 (2d6+8) bludgeoning damage & fall prone. Dragon flies up to half speed.' }
    ],
    lairActions: [
      { id: 'lair-rdrag-1', name: 'Magma Eruption', description: 'Magma erupts at a point on the ground (6d6 fire damage, DC 15 DEX save for half).' },
      { id: 'lair-rdrag-2', name: 'Volcanic Tremor', description: 'A tremor shakes the lair; creatures within 60 ft DC 15 DEX save or fall prone.' },
      { id: 'lair-rdrag-3', name: 'Volcanic Gas', description: 'Volcanic gas fills a 20-foot radius sphere dealing 2d6 poison damage.' }
    ],
    classFeatures: [
      { id: 'trait-rdrag-1', name: 'Legendary Resistance (3/Day)', source: 'Dragon Trait', description: 'If the dragon fails a saving throw, it can choose to succeed instead.', usesMax: 3, usesRemaining: 3, recharge: 'Long Rest' },
      { id: 'trait-rdrag-2', name: 'Frightful Presence', source: 'Dragon Action', description: 'Creatures within 120 feet must succeed on a DC 19 Wisdom save or become Frightened for 1 minute.' }
    ],
    inventory: [{ id: 'i-rdrag-1', name: 'Dragon Hoard Treasures', quantity: 1, weight: 500, equipped: true }],
    wealth: { cp: 12000, sp: 25000, ep: 0, gp: 8500, pp: 320 }
  },

  // ----------------------- 3.5E MONSTERS -----------------------
  {
    id: 'monster-35e-kobold',
    name: 'Kobold Spear Hunter',
    race: 'Reptilian',
    characterClass: 'Monster',
    subclass: 'CR 1/6',
    challengeRating: '1/6',
    level: 1,
    edition: '3.5e',
    background: 'Small Humanoid',
    alignment: 'Lawful Evil',
    experiencePoints: 50,
    isMonster: true,
    monsterXpReward: 50,
    hpMax: 4,
    hpCurrent: 4,
    armorClass: 15,
    initiativeBonus: 1,
    speed: 30,
    fortSaveBase: 2,
    refSaveBase: 1,
    willSaveBase: -1,
    bab: 1,
    hitDiceTotal: '1d8-1',
    hitDiceCurrent: 1,
    abilities: {
      STR: { score: 9 },
      DEX: { score: 13 },
      CON: { score: 10 },
      INT: { score: 10 },
      WIS: { score: 9 },
      CHA: { score: 8 }
    },
    savingThrowProficiencies: [],
    skills: make35eSkills(0, { Hide: 2, Listen: 2 }),
    attacks: [
      { id: 'atk-35kob-1', name: 'Spear', attackBonus: 1, damage: '1d6 - 1', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-35kob-2', name: 'Sling', attackBonus: 3, damage: '1d3 - 1', damageType: 'Bludgeoning', range: '50 ft Ranged' }
    ],
    classFeatures: [
      { id: 'trait-35kob-1', name: 'Light Sensitivity', source: 'Racial Trait', description: 'Kobolds are dazzled in bright sunlight or within the radius of a daylight spell (-1 on attack rolls).' }
    ],
    inventory: [{ id: 'i-35kob-1', name: 'Small Spear', quantity: 1, weight: 3, equipped: true }, { id: 'i-35kob-2', name: 'Leather Armor', quantity: 1, weight: 7, equipped: true }],
    wealth: { cp: 22, sp: 8, ep: 0, gp: 1, pp: 0 }
  },
  {
    id: 'monster-35e-troll',
    name: 'Troll (3.5e)',
    race: 'Giant',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '3.5e',
    background: 'Large Giant',
    alignment: 'Chaotic Evil',
    experiencePoints: 1400,
    isMonster: true,
    monsterXpReward: 1400,
    hpMax: 63,
    hpCurrent: 63,
    armorClass: 16,
    initiativeBonus: 2,
    speed: 30,
    fortSaveBase: 5,
    refSaveBase: 2,
    willSaveBase: 2,
    bab: 4,
    hitDiceTotal: '6d8+36',
    hitDiceCurrent: 6,
    abilities: {
      STR: { score: 21 },
      DEX: { score: 14 },
      CON: { score: 23 },
      INT: { score: 6 },
      WIS: { score: 9 },
      CHA: { score: 6 }
    },
    savingThrowProficiencies: [],
    skills: make35eSkills(),
    attacks: [
      { id: 'atk-35troll-1', name: 'Claw (x2)', attackBonus: 9, damage: '1d6 + 5', damageType: 'Slashing', range: '10 ft Melee' },
      { id: 'atk-35troll-2', name: 'Bite', attackBonus: 4, damage: '1d8 + 2', damageType: 'Piercing', range: '10 ft Melee' }
    ],
    multiattack: 'The troll makes three attacks: one with its bite and two with its claws.',
    classFeatures: [
      { id: 'trait-35troll-1', name: 'Regeneration 5', source: 'Troll Special Ability', description: 'Fire and acid deal normal damage to a troll. All other damage is converted to nonlethal damage and heals at a rate of 5 HP per round.' },
      { id: 'trait-35troll-2', name: 'Rend 2d6+7', source: 'Troll Special Ability', description: 'If a troll hits with both claw attacks, it latches onto the opponent’s body and tears the flesh, dealing an additional 2d6+7 damage.' }
    ],
    inventory: [],
    wealth: { cp: 0, sp: 140, ep: 0, gp: 90, pp: 0 }
  },
  {
    id: 'monster-35e-pit-fiend',
    name: 'Pit Fiend (3.5e)',
    race: 'Baatezu Devil',
    characterClass: 'Monster',
    subclass: 'CR 20',
    challengeRating: '20',
    level: 18,
    edition: '3.5e',
    background: 'Large Outsider (Evil, Lawful)',
    alignment: 'Lawful Evil',
    experiencePoints: 38000,
    isMonster: true,
    monsterXpReward: 38000,
    hpMax: 225,
    hpCurrent: 225,
    armorClass: 40,
    initiativeBonus: 12,
    speed: 40,
    fortSaveBase: 11,
    refSaveBase: 11,
    willSaveBase: 11,
    bab: 18,
    hitDiceTotal: '18d8+144',
    hitDiceCurrent: 18,
    abilities: {
      STR: { score: 37 },
      DEX: { score: 27 },
      CON: { score: 27 },
      INT: { score: 26 },
      WIS: { score: 26 },
      CHA: { score: 26 }
    },
    savingThrowProficiencies: [],
    skills: make35eSkills(18),
    attacks: [
      { id: 'atk-35pit-1', name: '+3 Unholy Heavy Mace', attackBonus: 30, damage: '2d6 + 16', damageType: 'Bludgeoning', range: '10 ft Melee' },
      { id: 'atk-35pit-2', name: 'Bite (Disease)', attackBonus: 25, damage: '2d8 + 6', damageType: 'Piercing', range: '10 ft Melee', notes: 'Inflicts Devil Chill disease' },
      { id: 'atk-35pit-3', name: 'Tail Slap', attackBonus: 25, damage: '2d8 + 6', damageType: 'Bludgeoning', range: '10 ft Melee' }
    ],
    multiattack: 'The pit fiend makes six attacks: one with its mace, one bite, two claws, two wings, and one tail slap.',
    classFeatures: [
      { id: 'trait-35pit-1', name: 'Spell Resistance 32', source: 'Devil Trait', description: 'Casters must succeed on a 1d20 + Caster Level check vs DC 32 to affect the Pit Fiend.' },
      { id: 'trait-35pit-2', name: 'Damage Reduction 15/Good and Silver', source: 'Devil Trait', description: 'Ignores 15 points of damage from weapons unless they are both Good aligned and Silver.' },
      { id: 'trait-35pit-3', name: 'Fear Aura (20 ft)', source: 'Devil Trait', description: 'Creatures within 20 feet must succeed on a DC 27 Will save or be Affected by Fear.' }
    ],
    inventory: [{ id: 'i-35pit-1', name: '+3 Unholy Heavy Mace', quantity: 1, weight: 12, equipped: true }],
    wealth: { cp: 0, sp: 0, ep: 0, gp: 15000, pp: 800 }
  },
  {
    id: 'monster-35e-red-wyrm',
    name: 'Great Wyrm Red Dragon (3.5e Epic)',
    race: 'Dragon (Fire)',
    characterClass: 'Monster',
    subclass: 'CR 26 (Epic)',
    challengeRating: '26 (Epic)',
    level: 40,
    edition: '3.5e',
    background: 'Gargantuan Dragon',
    alignment: 'Chaotic Evil',
    experiencePoints: 120000,
    isMonster: true,
    monsterXpReward: 120000,
    hpMax: 665,
    hpCurrent: 665,
    armorClass: 41,
    initiativeBonus: 4,
    speed: 40,
    fortSaveBase: 22,
    refSaveBase: 22,
    willSaveBase: 22,
    bab: 40,
    hitDiceTotal: '40d12+400',
    hitDiceCurrent: 40,
    abilities: {
      STR: { score: 45 },
      DEX: { score: 10 },
      CON: { score: 31 },
      INT: { score: 26 },
      WIS: { score: 27 },
      CHA: { score: 26 }
    },
    savingThrowProficiencies: [],
    skills: make35eSkills(40),
    attacks: [
      { id: 'atk-35wyrm-1', name: 'Bite', attackBonus: 57, damage: '4d6 + 17', damageType: 'Piercing', range: '20 ft Melee' },
      { id: 'atk-35wyrm-2', name: 'Claw (x2)', attackBonus: 52, damage: '2d8 + 8', damageType: 'Slashing', range: '15 ft Melee' },
      { id: 'atk-35wyrm-3', name: 'Breath Weapon 24d10 Fire (DC 40 Ref)', attackBonus: 0, damage: '24d10', damageType: 'Fire', range: '70 ft Cone' }
    ],
    classFeatures: [
      { id: 'trait-35wyrm-1', name: 'Spell Resistance 32', source: 'Dragon Trait', description: 'Requires Caster Level check vs 32.' },
      { id: 'trait-35wyrm-2', name: 'Damage Reduction 20/Magic', source: 'Dragon Trait', description: 'Ignores 20 points of nonmagical damage.' }
    ],
    inventory: [],
    wealth: { cp: 50000, sp: 80000, ep: 0, gp: 45000, pp: 2200 }
  },
  {
    id: 'monster-5e-ogre',
    name: 'Ogre',
    race: 'Giant',
    characterClass: 'Monster',
    subclass: 'CR 2',
    challengeRating: '2',
    level: 4,
    edition: '5e',
    background: 'Large Giant',
    alignment: 'Chaotic Evil',
    experiencePoints: 450,
    isMonster: true,
    monsterXpReward: 450,
    sizeCategory: 'Large',
    hpMax: 59,
    hpCurrent: 59,
    armorClass: 11,
    initiativeBonus: -1,
    speed: 40,
    hitDiceTotal: '7d10+21',
    hitDiceCurrent: 7,
    abilities: {
      STR: { score: 19 },
      DEX: { score: 8 },
      CON: { score: 16 },
      INT: { score: 5 },
      WIS: { score: 7 },
      CHA: { score: 7 }
    },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-ogre-1', name: 'Greatclub', attackBonus: 6, damage: '2d8 + 4', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-ogre-2', name: 'Javelin', attackBonus: 6, damage: '2d6 + 4', damageType: 'Piercing', range: '30/120 ft Ranged' }
    ],
    classFeatures: [
      { id: 'feat-ogre-1', name: 'Powerful Build / Large Size', source: 'Monster Trait', description: 'Counts as Large with double carrying capacity (x2 multiplier, Push/Drag/Lift up to 1,140 lbs).' }
    ]
  },
  {
    id: 'monster-5e-mind-flayer',
    name: 'Mind Flayer (Illithid)',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 7',
    challengeRating: '7',
    level: 8,
    edition: '5e',
    background: 'Medium Aberration',
    alignment: 'Lawful Evil',
    experiencePoints: 2900,
    isMonster: true,
    monsterXpReward: 2900,
    hpMax: 71,
    hpCurrent: 71,
    armorClass: 15,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '13d8+13',
    hitDiceCurrent: 13,
    abilities: {
      STR: { score: 11 },
      DEX: { score: 12 },
      CON: { score: 12 },
      INT: { score: 19 },
      WIS: { score: 17 },
      CHA: { score: 17 }
    },
    isSpellcaster: true,
    spellcastingAbility: 'INT',
    spellSaveDc: 15,
    attacks: [
      { id: 'atk-ill-1', name: 'Tentacles', attackBonus: 7, damage: '2d10 + 4', damageType: 'Psychic', range: '5 ft Melee', notes: 'Gives grappled & stunned condition on hit (DC 15 INT save)' },
      { id: 'atk-ill-2', name: 'Extract Brain', attackBonus: 7, damage: '10d10', damageType: 'Piercing', range: '5 ft Melee', notes: 'Target must be incapacitated and grappled by the mind flayer' },
      { id: 'atk-ill-3', name: 'Mind Blast (Recharge 5-6)', attackBonus: 0, damage: '4d8 + 4', damageType: 'Psychic', range: '60 ft Cone', notes: 'DC 15 INT save or stunned for 1 minute' }
    ],
    classFeatures: [
      { id: 'feat-ill-1', name: 'Magic Resistance', source: 'Aberration Trait', description: 'Has advantage on saving throws against spells and other magical effects.' },
      { id: 'feat-ill-2', name: 'Innate Spellcasting (Psionics)', source: 'Aberration Trait', description: 'At will: Levitate, Detect Thoughts; 1/day each: Dominate Monster, Plane Shift.' }
    ]
  },
  {
    id: 'monster-5e-beholder',
    name: 'Beholder',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 13',
    challengeRating: '13',
    level: 14,
    edition: '5e',
    background: 'Large Aberration',
    alignment: 'Lawful Evil',
    experiencePoints: 10000,
    isMonster: true,
    monsterXpReward: 10000,
    sizeCategory: 'Large',
    hpMax: 180,
    hpCurrent: 180,
    armorClass: 18,
    initiativeBonus: 2,
    speed: 20,
    hitDiceTotal: '19d10+76',
    hitDiceCurrent: 19,
    abilities: {
      STR: { score: 10 },
      DEX: { score: 14 },
      CON: { score: 18 },
      INT: { score: 17 },
      WIS: { score: 15 },
      CHA: { score: 17 }
    },
    attacks: [
      { id: 'atk-beh-1', name: 'Bite', attackBonus: 5, damage: '4d6', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-beh-2', name: 'Eye Rays (x3 Random)', attackBonus: 0, damage: '5d10 / 8d8 / 10d10', damageType: 'Force / Necrotic / Radiant', range: '120 ft', notes: 'Shoots 3 random eye rays (Charm, Paralyze, Fear, Slow, Enervation, Telekinesis, Sleep, Petrifaction, Disintegration, Death)' }
    ],
    multiattack: 'The beholder makes one Bite attack and uses three random Eye Rays.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-beh-1', name: 'Eye Ray', cost: 1, description: 'The beholder uses one random eye ray.' }
    ],
    lairActions: [
      { id: 'lair-beh-1', name: 'Slime Slick', description: 'A 50-foot square area of ground within 120 feet becomes slick with slime. DC 15 DEX save or fall prone.' },
      { id: 'lair-beh-2', name: 'Grasping Tentacles', description: 'Walls sprout tentacles that grapple a creature within 10 feet (DC 15 STR save).' },
      { id: 'lair-beh-3', name: 'Ghostly Eye', description: 'A ghost eye opens on a solid surface within 60 feet and shoots a random eye ray at a target.' }
    ],
    classFeatures: [
      { id: 'feat-beh-1', name: 'Antimagic Cone (150 ft)', source: 'Beholder Trait', description: 'Central eye creates a 150-foot cone of antimagic. All magic spells and items are suppressed within the area.' }
    ]
  },
  {
    id: 'monster-5e-aboleth',
    name: 'Aboleth',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 10',
    challengeRating: '10',
    level: 10,
    edition: '5e',
    background: 'Large Aberration',
    alignment: 'Lawful Evil',
    experiencePoints: 5900,
    isMonster: true,
    monsterXpReward: 5900,
    sizeCategory: 'Large',
    hpMax: 135,
    hpCurrent: 135,
    armorClass: 17,
    initiativeBonus: -1,
    speed: 10,
    hitDiceTotal: '18d10+36',
    hitDiceCurrent: 18,
    abilities: { STR: { score: 21 }, DEX: { score: 9 }, CON: { score: 15 }, INT: { score: 18 }, WIS: { score: 15 }, CHA: { score: 18 } },
    attacks: [
      { id: 'atk-abo-1', name: 'Tentacle', attackBonus: 9, damage: '2d6 + 5', damageType: 'Bludgeoning', range: '10 ft Melee', notes: 'DC 14 CON save or diseased' },
      { id: 'atk-abo-2', name: 'Tail', attackBonus: 9, damage: '3d6 + 5', damageType: 'Bludgeoning', range: '10 ft Melee' },
      { id: 'atk-abo-3', name: 'Enslave (3/day)', attackBonus: 0, damage: '0', damageType: 'Psychic', range: '30 ft', notes: 'DC 14 WIS save or charmed/controlled' }
    ],
    multiattack: 'The aboleth makes three tentacle attacks.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-abo-1', name: 'Detect', cost: 1, description: 'The aboleth makes a Wisdom (Perception) check.' },
      { id: 'leg-abo-2', name: 'Tail Swipe', cost: 1, description: 'The aboleth makes one tail attack.', attackId: 'atk-abo-2' },
      { id: 'leg-abo-3', name: 'Psychic Drain', cost: 2, description: 'One creature charmed by the aboleth takes 10 (3d6) psychic damage, and the aboleth regains HP equal to damage dealt.' }
    ],
    lairActions: [
      { id: 'lair-abo-1', name: 'Phantasmal Force', description: 'Casts Phantasmal Force on a target it can see within 60 feet (DC 14 INT save).' },
      { id: 'lair-abo-2', name: 'Water Surge', description: 'Water in lair surges in a 60-foot radius, knocking creatures prone (DC 14 STR save).' },
      { id: 'lair-abo-3', name: 'Grasping Tide', description: 'Water forms a conduit, pulling a target up to 60 feet towards water.' }
    ],
    classFeatures: [
      { id: 'feat-abo-1', name: 'Amphibious', source: 'Aberration Trait', description: 'Can breathe air and water.' },
      { id: 'feat-abo-2', name: 'Mucous Cloud', source: 'Aberration Trait', description: 'Under water, surrounded by mucous cloud. DC 14 CON save or unable to breathe outside water for 1d4 hours.' },
      { id: 'feat-abo-3', name: 'Probing Telepathy', source: 'Aberration Trait', description: 'Telepathically learns target greatest desire if target communicates.' }
    ]
  },
  {
    id: 'monster-5e-owlbear',
    name: 'Owlbear',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Large',
    hpMax: 59,
    hpCurrent: 59,
    armorClass: 13,
    initiativeBonus: 1,
    speed: 40,
    hitDiceTotal: '7d10+21',
    hitDiceCurrent: 7,
    abilities: { STR: { score: 20 }, DEX: { score: 12 }, CON: { score: 17 }, INT: { score: 3 }, WIS: { score: 12 }, CHA: { score: 7 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-owl-1', name: 'Beak', attackBonus: 7, damage: '1d10 + 5', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-owl-2', name: 'Claws', attackBonus: 7, damage: '2d8 + 5', damageType: 'Slashing', range: '5 ft Melee' }
    ],
    multiattack: 'The owlbear makes two attacks: one with its beak and one with its claws.',
    classFeatures: [
      { id: 'feat-owl-1', name: 'Keen Sight and Smell', source: 'Monstrosity Trait', description: 'Advantage on Perception checks that rely on sight or smell.' }
    ]
  },
  {
    id: 'monster-5e-gelatinous-cube',
    name: 'Gelatinous Cube',
    race: 'Ooze',
    characterClass: 'Monster',
    subclass: 'CR 2',
    challengeRating: '2',
    level: 4,
    edition: '5e',
    background: 'Large Ooze',
    alignment: 'Unaligned',
    experiencePoints: 450,
    isMonster: true,
    monsterXpReward: 450,
    sizeCategory: 'Large',
    hpMax: 84,
    hpCurrent: 84,
    armorClass: 6,
    initiativeBonus: -2,
    speed: 15,
    hitDiceTotal: '8d10+40',
    hitDiceCurrent: 8,
    abilities: { STR: { score: 14 }, DEX: { score: 3 }, CON: { score: 20 }, INT: { score: 1 }, WIS: { score: 6 }, CHA: { score: 1 } },
    attacks: [
      { id: 'atk-gel-1', name: 'Pseudopod', attackBonus: 4, damage: '3d6', damageType: 'Acid', range: '5 ft Melee' },
      { id: 'atk-gel-2', name: 'Engulf', attackBonus: 0, damage: '6d6', damageType: 'Acid', range: 'Cube Area', notes: 'DC 12 DEX save or engulfed, restrained, and dissolving' }
    ],
    classFeatures: [
      { id: 'feat-gel-1', name: 'Transparent', source: 'Ooze Trait', description: 'DC 15 Perception check required to spot an motionless cube.' },
      { id: 'feat-gel-2', name: 'Ooze Cube Immunities', source: 'Ooze Trait', description: 'Immune to blinded, charmed, deafened, exhaustion, frightened, prone.' }
    ]
  },
  {
    id: 'monster-5e-mimic',
    name: 'Mimic',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 2',
    challengeRating: '2',
    level: 4,
    edition: '5e',
    background: 'Medium Monstrosity (Shapechanger)',
    alignment: 'Neutral',
    experiencePoints: 450,
    isMonster: true,
    monsterXpReward: 450,
    hpMax: 58,
    hpCurrent: 58,
    armorClass: 12,
    initiativeBonus: 1,
    speed: 15,
    hitDiceTotal: '9d8+18',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 17 }, DEX: { score: 12 }, CON: { score: 15 }, INT: { score: 5 }, WIS: { score: 13 }, CHA: { score: 8 } },
    attacks: [
      { id: 'atk-mim-1', name: 'Pseudopod', attackBonus: 5, damage: '1d8 + 3', damageType: 'Bludgeoning', range: '5 ft Melee', notes: 'Adheres to target, target grappled (DC 13 escape)' },
      { id: 'atk-mim-2', name: 'Bite', attackBonus: 5, damage: '1d8 + 3 + 1d8', damageType: 'Piercing + Acid', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'feat-mim-1', name: 'Shapechanger', source: 'Monstrosity Trait', description: 'Can turn into an object (chest, door, barrel). False Appearance renders it indistinguishable from an ordinary object.' },
      { id: 'feat-mim-2', name: 'Adhesive', source: 'Monstrosity Trait', description: 'Adheres to anything that touches it. Huge advantage on grapple checks.' }
    ]
  },
  {
    id: 'monster-5e-tarrasque',
    name: 'Tarrasque',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 30',
    challengeRating: '30',
    level: 30,
    edition: '5e',
    background: 'Gargantuan Monstrosity (Titan)',
    alignment: 'Unaligned',
    experiencePoints: 155000,
    isMonster: true,
    monsterXpReward: 155000,
    sizeCategory: 'Gargantuan',
    hpMax: 676,
    hpCurrent: 676,
    armorClass: 25,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '33d20+330',
    hitDiceCurrent: 33,
    abilities: { STR: { score: 30 }, DEX: { score: 11 }, CON: { score: 30 }, INT: { score: 3 }, WIS: { score: 11 }, CHA: { score: 11 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-tar-1', name: 'Bite', attackBonus: 19, damage: '4d12 + 10', damageType: 'Piercing', range: '10 ft Melee', notes: 'Target is grappled & swallowed on next turn' },
      { id: 'atk-tar-2', name: 'Claw', attackBonus: 19, damage: '4d8 + 10', damageType: 'Slashing', range: '15 ft Melee' },
      { id: 'atk-tar-3', name: 'Horns', attackBonus: 19, damage: '4d10 + 10', damageType: 'Piercing', range: '10 ft Melee' },
      { id: 'atk-tar-4', name: 'Tail', attackBonus: 19, damage: '4d6 + 10', damageType: 'Bludgeoning', range: '20 ft Melee', notes: 'Target knocked prone (DC 20 STR save)' },
      { id: 'atk-tar-5', name: 'Frightful Presence', attackBonus: 0, damage: '0', damageType: 'Psychic', range: '120 ft', notes: 'DC 17 WIS save or frightened for 1 minute' }
    ],
    multiattack: 'The Tarrasque can use its Frightful Presence. It then makes five attacks: one with its bite, two with its claws, one with its horns, and one with its tail.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-tar-1', name: 'Attack', cost: 1, description: 'The Tarrasque makes one claw attack or tail attack.', attackId: 'atk-tar-2' },
      { id: 'leg-tar-2', name: 'Move', cost: 1, description: 'The Tarrasque moves up to half its speed.' },
      { id: 'leg-tar-3', name: 'Chomp', cost: 2, description: 'The Tarrasque makes one bite attack or uses Swallow.', attackId: 'atk-tar-1' }
    ],
    classFeatures: [
      { id: 'feat-tar-1', name: 'Reflective Carapace', source: 'Titan Trait', description: 'Any magic missile, line spell, or ranged attack spell is deflected away on a 1-5, or reflected back at caster on a 6.' },
      { id: 'feat-tar-2', name: 'Legendary Resistance (3/day)', source: 'Titan Trait', description: 'If the tarrasque fails a saving throw, it can choose to succeed instead.' },
      { id: 'feat-tar-3', name: 'Siege Monster', source: 'Titan Trait', description: 'Deals double damage to objects and structures.' }
    ]
  },
  {
    id: 'monster-5e-ancient-red-dragon',
    name: 'Ancient Red Dragon',
    race: 'Dragon',
    characterClass: 'Monster',
    subclass: 'CR 24',
    challengeRating: '24',
    level: 24,
    edition: '5e',
    background: 'Gargantuan Dragon',
    alignment: 'Chaotic Evil',
    experiencePoints: 62000,
    isMonster: true,
    monsterXpReward: 62000,
    sizeCategory: 'Gargantuan',
    hpMax: 546,
    hpCurrent: 546,
    armorClass: 22,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '28d20+252',
    hitDiceCurrent: 28,
    abilities: { STR: { score: 30 }, DEX: { score: 10 }, CON: { score: 29 }, INT: { score: 18 }, WIS: { score: 15 }, CHA: { score: 23 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-ard-1', name: 'Bite', attackBonus: 17, damage: '2d10 + 10 + 2d6', damageType: 'Piercing + Fire', range: '15 ft Melee' },
      { id: 'atk-ard-2', name: 'Claw', attackBonus: 17, damage: '2d6 + 10', damageType: 'Slashing', range: '10 ft Melee' },
      { id: 'atk-ard-3', name: 'Fire Breath (Recharge 5-6)', attackBonus: 0, damage: '26d6', damageType: 'Fire', range: '90 ft Cone', notes: 'DC 24 DEX save for half damage' }
    ],
    multiattack: 'The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-ard-1', name: 'Detect', cost: 1, description: 'The dragon makes a Wisdom (Perception) check.' },
      { id: 'leg-ard-2', name: 'Tail Attack', cost: 1, description: 'The dragon makes a tail attack (+17 to hit, 2d8+10 bludgeoning damage).' },
      { id: 'leg-ard-3', name: 'Wing Attack', cost: 2, description: 'Creatures within 15 ft DC 25 DEX save or take 17 (2d6+10) bludgeoning damage & fall prone. Dragon flies up to half speed.' }
    ],
    lairActions: [
      { id: 'lair-ard-1', name: 'Magma Eruption', description: 'Magma erupts at a point on the ground (6d6 fire damage, DC 15 DEX save for half).' },
      { id: 'lair-ard-2', name: 'Volcanic Tremor', description: 'A tremor shakes the lair; creatures within 60 ft DC 15 DEX save or fall prone.' },
      { id: 'lair-ard-3', name: 'Volcanic Gas', description: 'Volcanic gas fills a 20-foot radius sphere dealing 2d6 poison damage.' }
    ],
    classFeatures: [
      { id: 'feat-ard-1', name: 'Legendary Resistance (3/day)', source: 'Dragon Trait', description: 'Chooses to succeed failed saving throws.' },
      { id: 'feat-ard-2', name: 'Fire Immunity', source: 'Dragon Trait', description: 'Immune to all fire damage.' }
    ]
  },
  {
    id: 'monster-5e-lich',
    name: 'Lich',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 21',
    challengeRating: '21',
    level: 20,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Any Evil',
    experiencePoints: 33000,
    isMonster: true,
    monsterXpReward: 33000,
    hpMax: 135,
    hpCurrent: 135,
    armorClass: 17,
    initiativeBonus: 3,
    speed: 30,
    hitDiceTotal: '18d8+54',
    hitDiceCurrent: 18,
    abilities: { STR: { score: 11 }, DEX: { score: 16 }, CON: { score: 16 }, INT: { score: 20 }, WIS: { score: 14 }, CHA: { score: 16 } },
    isSpellcaster: true,
    spellcastingAbility: 'INT',
    spellSaveDc: 20,
    attacks: [
      { id: 'atk-lich-1', name: 'Paralyzing Touch', attackBonus: 12, damage: '3d6', damageType: 'Cold', range: '5 ft Melee', notes: 'DC 18 CON save or paralyzed for 1 minute' },
      { id: 'atk-lich-2', name: 'Power Word Kill (1st/day)', attackBonus: 0, damage: '100 HP Kill', damageType: 'Force', range: '60 ft', notes: 'Instantly kills target with <= 100 HP' }
    ],
    multiattack: 'The lich can cast a spell or use its Paralyzing Touch.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-lich-1', name: 'Cantrip', cost: 1, description: 'The lich casts a cantrip.' },
      { id: 'leg-lich-2', name: 'Paralyzing Touch', cost: 2, description: 'The lich uses its Paralyzing Touch attack.', attackId: 'atk-lich-1' },
      { id: 'leg-lich-3', name: 'Frightening Gaze', cost: 2, description: 'Target creature within 10 ft DC 18 WIS save or frightened for 1 minute.' },
      { id: 'leg-lich-4', name: 'Disrupt Life', cost: 3, description: 'Each non-undead creature within 20 ft DC 18 CON save or take 21 (6d6) necrotic damage.' }
    ],
    lairActions: [
      { id: 'lair-lich-1', name: 'Spell Slot Recovery', description: 'Rolls 1d8 to regain a spell slot of that level or lower.' },
      { id: 'lair-lich-2', name: 'Necrotic Tether', description: 'Apparition strikes a creature for 15 (3d10) necrotic damage.' },
      { id: 'lair-lich-3', name: 'Negative Energy Surge', description: 'Suppresses all healing within lair until initiative count 20 next round.' }
    ],
    classFeatures: [
      { id: 'feat-lich-1', name: 'Rejuvenation (Phylactery)', source: 'Undead Trait', description: 'Gains a new body in 1d10 days unless its phylactery is destroyed.' },
      { id: 'feat-lich-2', name: 'Turn Resistance', source: 'Undead Trait', description: 'Advantage on saving throws against effects that turn undead.' }
    ]
  },
  {
    id: 'monster-5e-vampire',
    name: 'Vampire',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 13',
    challengeRating: '13',
    level: 13,
    edition: '5e',
    background: 'Medium Undead (Shapechanger)',
    alignment: 'Lawful Evil',
    experiencePoints: 10000,
    isMonster: true,
    monsterXpReward: 10000,
    hpMax: 144,
    hpCurrent: 144,
    armorClass: 16,
    initiativeBonus: 4,
    speed: 30,
    hitDiceTotal: '17d8+68',
    hitDiceCurrent: 17,
    abilities: { STR: { score: 18 }, DEX: { score: 18 }, CON: { score: 18 }, INT: { score: 17 }, WIS: { score: 15 }, CHA: { score: 18 } },
    attacks: [
      { id: 'atk-vamp-1', name: 'Unarmed Strike', attackBonus: 9, damage: '1d8 + 4', damageType: 'Bludgeoning', range: '5 ft Melee', notes: 'Can grapple instead of damage' },
      { id: 'atk-vamp-2', name: 'Bite', attackBonus: 9, damage: '1d6 + 4 + 3d6', damageType: 'Piercing + Necrotic', range: '5 ft Melee', notes: 'Reduces max HP by necrotic damage dealt and heals vampire' },
      { id: 'atk-vamp-3', name: 'Charm', attackBonus: 0, damage: '0', damageType: 'Psychic', range: '30 ft', notes: 'DC 17 WIS save or charmed for 24 hours' }
    ],
    multiattack: 'The vampire makes two attacks, only one of which can be a bite attack.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-vamp-1', name: 'Move', cost: 1, description: 'The vampire moves up to its speed without provoking opportunity attacks.' },
      { id: 'leg-vamp-2', name: 'Unarmed Strike', cost: 1, description: 'The vampire makes one unarmed strike.', attackId: 'atk-vamp-1' },
      { id: 'leg-vamp-3', name: 'Bite', cost: 2, description: 'The vampire makes one bite attack against a willing, grappled, or incapacitated target.', attackId: 'atk-vamp-2' }
    ],
    classFeatures: [
      { id: 'feat-vamp-1', name: 'Regeneration (20 HP/turn)', source: 'Undead Trait', description: 'Regains 20 HP at start of turn unless taking radiant damage or in sunlight.' },
      { id: 'feat-vamp-2', name: 'Misty Escape', source: 'Undead Trait', description: 'Transforms into mist at 0 HP and retreats to coffin.' }
    ]
  },
  {
    id: 'monster-5e-chimera',
    name: 'Chimera',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 6',
    challengeRating: '6',
    level: 7,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Chaotic Evil',
    experiencePoints: 2300,
    isMonster: true,
    monsterXpReward: 2300,
    sizeCategory: 'Large',
    hpMax: 114,
    hpCurrent: 114,
    armorClass: 14,
    initiativeBonus: 0,
    speed: 30,
    hitDiceTotal: '12d10+48',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 19 }, DEX: { score: 11 }, CON: { score: 19 }, INT: { score: 3 }, WIS: { score: 14 }, CHA: { score: 10 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-chi-1', name: 'Bite', attackBonus: 7, damage: '2d6 + 4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-chi-2', name: 'Horns', attackBonus: 7, damage: '1d12 + 4', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-chi-3', name: 'Claws', attackBonus: 7, damage: '2d6 + 4', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-chi-4', name: 'Fire Breath (Recharge 5-6)', attackBonus: 0, damage: '7d8', damageType: 'Fire', range: '15 ft Cone', notes: 'DC 15 DEX save for half damage' }
    ],
    multiattack: 'The chimera makes three attacks: one with its bite, one with its horns, and one with its claws.'
  },
  {
    id: 'monster-5e-hill-giant',
    name: 'Hill Giant',
    race: 'Giant',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 7,
    edition: '5e',
    background: 'Huge Giant',
    alignment: 'Chaotic Evil',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Huge',
    hpMax: 105,
    hpCurrent: 105,
    armorClass: 13,
    initiativeBonus: -1,
    speed: 40,
    hitDiceTotal: '10d12+40',
    hitDiceCurrent: 10,
    abilities: { STR: { score: 21 }, DEX: { score: 8 }, CON: { score: 19 }, INT: { score: 5 }, WIS: { score: 9 }, CHA: { score: 6 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-hg-1', name: 'Greatclub', attackBonus: 8, damage: '3d8 + 5', damageType: 'Bludgeoning', range: '10 ft Melee' },
      { id: 'atk-hg-2', name: 'Rock Throw', attackBonus: 8, damage: '3d10 + 5', damageType: 'Bludgeoning', range: '60/240 ft Ranged' }
    ],
    multiattack: 'The giant makes two greatclub attacks.'
  },
  {
    id: 'monster-5e-fire-giant',
    name: 'Fire Giant',
    race: 'Giant',
    characterClass: 'Monster',
    subclass: 'CR 9',
    challengeRating: '9',
    level: 11,
    edition: '5e',
    background: 'Huge Giant',
    alignment: 'Lawful Evil',
    experiencePoints: 5000,
    isMonster: true,
    monsterXpReward: 5000,
    sizeCategory: 'Huge',
    hpMax: 162,
    hpCurrent: 162,
    armorClass: 18,
    initiativeBonus: -1,
    speed: 30,
    hitDiceTotal: '13d12+78',
    hitDiceCurrent: 13,
    abilities: { STR: { score: 25 }, DEX: { score: 9 }, CON: { score: 23 }, INT: { score: 10 }, WIS: { score: 14 }, CHA: { score: 13 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-fg-1', name: 'Greatsword', attackBonus: 11, damage: '6d6 + 7', damageType: 'Slashing', range: '10 ft Melee' },
      { id: 'atk-fg-2', name: 'Rock Throw', attackBonus: 11, damage: '4d10 + 7', damageType: 'Bludgeoning', range: '60/240 ft Ranged' }
    ],
    multiattack: 'The giant makes two greatsword attacks.'
  },
  {
    id: 'monster-5e-skeleton',
    name: 'Skeleton',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1/4',
    challengeRating: '1/4',
    level: 1,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Lawful Evil',
    experiencePoints: 50,
    isMonster: true,
    monsterXpReward: 50,
    hpMax: 13,
    hpCurrent: 13,
    armorClass: 13,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '2d8+4',
    hitDiceCurrent: 2,
    abilities: { STR: { score: 10 }, DEX: { score: 14 }, CON: { score: 15 }, INT: { score: 6 }, WIS: { score: 8 }, CHA: { score: 5 } },
    attacks: [
      { id: 'atk-ske-1', name: 'Shortsword', attackBonus: 4, damage: '1d6 + 2', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-ske-2', name: 'Shortbow', attackBonus: 4, damage: '1d6 + 2', damageType: 'Piercing', range: '80/320 ft Ranged' }
    ],
    classFeatures: [
      { id: 'feat-ske-1', name: 'Vulnerability to Bludgeoning', source: 'Undead Trait', description: 'Takes double damage from bludgeoning weapons.' }
    ]
  },
  {
    id: 'monster-5e-zombie',
    name: 'Zombie',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1/4',
    challengeRating: '1/4',
    level: 1,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Neutral Evil',
    experiencePoints: 50,
    isMonster: true,
    monsterXpReward: 50,
    hpMax: 22,
    hpCurrent: 22,
    armorClass: 8,
    initiativeBonus: -2,
    speed: 20,
    hitDiceTotal: '3d8+9',
    hitDiceCurrent: 3,
    abilities: { STR: { score: 13 }, DEX: { score: 6 }, CON: { score: 16 }, INT: { score: 3 }, WIS: { score: 6 }, CHA: { score: 5 } },
    attacks: [
      { id: 'atk-zom-1', name: 'Slam', attackBonus: 3, damage: '1d6 + 1', damageType: 'Bludgeoning', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'feat-zom-1', name: 'Undead Fortitude', source: 'Undead Trait', description: 'If damage reduces zombie to 0 HP, CON save (DC 5 + damage) to drop to 1 HP instead unless fire/radiant/critical.' }
    ]
  },
  {
    id: 'monster-5e-ghoul',
    name: 'Ghoul',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1',
    challengeRating: '1',
    level: 2,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Chaotic Evil',
    experiencePoints: 200,
    isMonster: true,
    monsterXpReward: 200,
    hpMax: 22,
    hpCurrent: 22,
    armorClass: 12,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '5d8',
    hitDiceCurrent: 5,
    abilities: { STR: { score: 13 }, DEX: { score: 15 }, CON: { score: 10 }, INT: { score: 7 }, WIS: { score: 10 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-gho-1', name: 'Bite', attackBonus: 2, damage: '2d6 + 2', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-gho-2', name: 'Claws', attackBonus: 4, damage: '2d4 + 2', damageType: 'Slashing', range: '5 ft Melee', notes: 'DC 10 CON save or paralyzed for 1 minute' }
    ],
    multiattack: 'The ghoul makes two attacks: one with its bite and one with its claws.'
  },
  {
    id: 'monster-5e-specter',
    name: 'Specter',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1',
    challengeRating: '1',
    level: 2,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Chaotic Evil',
    experiencePoints: 200,
    isMonster: true,
    monsterXpReward: 200,
    hpMax: 22,
    hpCurrent: 22,
    armorClass: 12,
    initiativeBonus: 2,
    speed: 50,
    hitDiceTotal: '5d8',
    hitDiceCurrent: 5,
    abilities: { STR: { score: 1 }, DEX: { score: 14 }, CON: { score: 11 }, INT: { score: 10 }, WIS: { score: 10 }, CHA: { score: 11 } },
    attacks: [
      { id: 'atk-spc-1', name: 'Life Drain', attackBonus: 4, damage: '3d6', damageType: 'Necrotic', range: '5 ft Melee', notes: 'DC 10 CON save or max HP reduced by damage taken' }
    ],
    classFeatures: [
      { id: 'feat-spc-1', name: 'Incorporeal Movement', source: 'Undead Trait', description: 'Can move through creatures and objects as if they were difficult terrain.' }
    ]
  },
  {
    id: 'monster-5e-wight',
    name: 'Wight',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Neutral Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    hpMax: 45,
    hpCurrent: 45,
    armorClass: 14,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '6d8+18',
    hitDiceCurrent: 6,
    abilities: { STR: { score: 15 }, DEX: { score: 14 }, CON: { score: 16 }, INT: { score: 10 }, WIS: { score: 13 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-wgt-1', name: 'Longsword', attackBonus: 4, damage: '1d8 + 2', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-wgt-2', name: 'Life Drain', attackBonus: 4, damage: '1d6 + 2', damageType: 'Necrotic', range: '5 ft Melee', notes: 'DC 13 CON save or max HP reduced' }
    ],
    multiattack: 'The wight makes two longsword attacks or two longbow attacks. It can replace one attack with Life Drain.'
  },
  {
    id: 'monster-5e-wraith',
    name: 'Wraith',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 7,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Neutral Evil',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    hpMax: 67,
    hpCurrent: 67,
    armorClass: 13,
    initiativeBonus: 3,
    speed: 60,
    hitDiceTotal: '9d8+27',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 6 }, DEX: { score: 16 }, CON: { score: 16 }, INT: { score: 12 }, WIS: { score: 14 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-wra-1', name: 'Life Drain', attackBonus: 6, damage: '4d8 + 3', damageType: 'Necrotic', range: '5 ft Melee', notes: 'DC 14 CON save or max HP reduced. Humanoid killed creates a specter under wraiths control' }
    ],
    classFeatures: [
      { id: 'feat-wra-1', name: 'Sunlight Sensitivity', source: 'Undead Trait', description: 'Disadvantage on attack rolls and Perception checks in direct sunlight.' }
    ]
  },
  {
    id: 'monster-5e-mummy',
    name: 'Mummy',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Lawful Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    hpMax: 58,
    hpCurrent: 58,
    armorClass: 11,
    initiativeBonus: -1,
    speed: 20,
    hitDiceTotal: '9d8+18',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 16 }, DEX: { score: 8 }, CON: { score: 15 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 12 } },
    attacks: [
      { id: 'atk-mum-1', name: 'Rotting Fist', attackBonus: 5, damage: '2d6 + 3 + 3d6', damageType: 'Bludgeoning + Necrotic', range: '5 ft Melee', notes: 'DC 12 CON save or cursed with Mummy Rot' },
      { id: 'atk-mum-2', name: 'Dreadful Glare', attackBonus: 0, damage: '0', damageType: 'Psychic', range: '60 ft', notes: 'DC 11 WIS save or frightened & paralyzed' }
    ]
  },
  {
    id: 'monster-5e-mummy-lord',
    name: 'Mummy Lord',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 15',
    challengeRating: '15',
    level: 15,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Lawful Evil',
    experiencePoints: 13000,
    isMonster: true,
    monsterXpReward: 13000,
    hpMax: 97,
    hpCurrent: 97,
    armorClass: 17,
    initiativeBonus: 0,
    speed: 20,
    hitDiceTotal: '13d8+39',
    hitDiceCurrent: 13,
    abilities: { STR: { score: 18 }, DEX: { score: 10 }, CON: { score: 17 }, INT: { score: 16 }, WIS: { score: 18 }, CHA: { score: 16 } },
    isSpellcaster: true,
    spellcastingAbility: 'WIS',
    spellSaveDc: 17,
    attacks: [
      { id: 'atk-ml-1', name: 'Rotting Fist', attackBonus: 9, damage: '3d6 + 4 + 6d6', damageType: 'Bludgeoning + Necrotic', range: '5 ft Melee', notes: 'DC 16 CON save or cursed with Mummy Rot' },
      { id: 'atk-ml-2', name: 'Dreadful Glare', attackBonus: 0, damage: '0', damageType: 'Psychic', range: '60 ft', notes: 'DC 16 WIS save or frightened & paralyzed' }
    ],
    multiattack: 'The mummy lord can use its Dreadful Glare and makes one attack with its rotting fist.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-ml-1', name: 'Attack', cost: 1, description: 'Makes one Rotting Fist or uses Dreadful Glare.', attackId: 'atk-ml-1' },
      { id: 'leg-ml-2', name: 'Blinding Dust', cost: 2, description: 'Blinding dust swirls within 10 ft (DC 16 CON save or blinded).' },
      { id: 'leg-ml-3', name: 'Blasphemous Word', cost: 2, description: 'Non-mummy within 10 ft DC 16 CON save or stunned.' },
      { id: 'leg-ml-4', name: 'Whirlwind of Sand', cost: 2, description: 'Transforms into sand whirlwind, flies up to 60 ft without opportunity attacks.' }
    ],
    lairActions: [
      { id: 'lair-ml-1', name: 'Sand Surge', description: 'Sand erupts in lair dealing 3d6 slashing damage.' },
      { id: 'lair-ml-2', name: 'Divine Rebuke', description: 'Fiery explosion deals 4d6 fire damage.' }
    ]
  },
  {
    id: 'monster-5e-banshee',
    name: 'Banshee',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 5,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Chaotic Evil',
    experiencePoints: 1100,
    isMonster: true,
    monsterXpReward: 1100,
    hpMax: 58,
    hpCurrent: 58,
    armorClass: 12,
    initiativeBonus: 2,
    speed: 40,
    hitDiceTotal: '13d8',
    hitDiceCurrent: 13,
    abilities: { STR: { score: 1 }, DEX: { score: 14 }, CON: { score: 10 }, INT: { score: 12 }, WIS: { score: 11 }, CHA: { score: 17 } },
    attacks: [
      { id: 'atk-ban-1', name: 'Corrupting Touch', attackBonus: 4, damage: '3d6 + 2', damageType: 'Necrotic', range: '5 ft Melee' },
      { id: 'atk-ban-2', name: 'Wail (1/day)', attackBonus: 0, damage: '3d6', damageType: 'Psychic', range: '30 ft Radius', notes: 'DC 13 CON save or drop to 0 HP instantly (3d6 psychic on success)' }
    ]
  },
  {
    id: 'monster-5e-vampire-spawn',
    name: 'Vampire Spawn',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Neutral Evil',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    hpMax: 82,
    hpCurrent: 82,
    armorClass: 15,
    initiativeBonus: 3,
    speed: 30,
    hitDiceTotal: '11d8+33',
    hitDiceCurrent: 11,
    abilities: { STR: { score: 16 }, DEX: { score: 16 }, CON: { score: 16 }, INT: { score: 11 }, WIS: { score: 10 }, CHA: { score: 12 } },
    attacks: [
      { id: 'atk-vs-1', name: 'Claws', attackBonus: 6, damage: '2d4 + 3', damageType: 'Slashing', range: '5 ft Melee', notes: 'Can grapple instead of damage' },
      { id: 'atk-vs-2', name: 'Bite', attackBonus: 6, damage: '1d6 + 3 + 2d6', damageType: 'Piercing + Necrotic', range: '5 ft Melee', notes: 'Target grappled/incapacitated; heals spawn' }
    ],
    multiattack: 'The vampire spawn makes two attacks, only one of which can be a bite attack.'
  },
  {
    id: 'monster-5e-air-elemental',
    name: 'Air Elemental',
    race: 'Elemental',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Elemental',
    alignment: 'Neutral',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 90,
    hpCurrent: 90,
    armorClass: 15,
    initiativeBonus: 5,
    speed: 90,
    hitDiceTotal: '12d10+24',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 14 }, DEX: { score: 20 }, CON: { score: 14 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-ae-1', name: 'Slam', attackBonus: 8, damage: '2d8 + 5', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-ae-2', name: 'Whirlwind (Recharge 4-6)', attackBonus: 0, damage: '3d8 + 2', damageType: 'Bludgeoning', range: '5 ft Radius', notes: 'DC 13 STR save or flung 20 ft and knocked prone' }
    ],
    multiattack: 'The elemental makes two slam attacks.'
  },
  {
    id: 'monster-5e-earth-elemental',
    name: 'Earth Elemental',
    race: 'Elemental',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Elemental',
    alignment: 'Neutral',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 126,
    hpCurrent: 126,
    armorClass: 17,
    initiativeBonus: -1,
    speed: 30,
    hitDiceTotal: '12d10+60',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 20 }, DEX: { score: 8 }, CON: { score: 20 }, INT: { score: 5 }, WIS: { score: 10 }, CHA: { score: 5 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-ee-1', name: 'Slam', attackBonus: 8, damage: '2d8 + 5', damageType: 'Bludgeoning', range: '10 ft Melee' }
    ],
    multiattack: 'The elemental makes two slam attacks.',
    classFeatures: [
      { id: 'feat-ee-1', name: 'Earth Glide', source: 'Elemental Trait', description: 'Can burrow through nonmagical, unworked earth and stone without disturbing the material.' }
    ]
  },
  {
    id: 'monster-5e-fire-elemental',
    name: 'Fire Elemental',
    race: 'Elemental',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Elemental',
    alignment: 'Neutral',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 102,
    hpCurrent: 102,
    armorClass: 13,
    initiativeBonus: 3,
    speed: 50,
    hitDiceTotal: '12d10+36',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 10 }, DEX: { score: 17 }, CON: { score: 16 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 7 } },
    attacks: [
      { id: 'atk-fe-1', name: 'Touch', attackBonus: 6, damage: '2d6 + 3', damageType: 'Fire', range: '5 ft Melee', notes: 'Target catches fire taking 1d10 fire damage per turn until put out' }
    ],
    multiattack: 'The elemental makes two touch attacks.',
    classFeatures: [
      { id: 'feat-fe-1', name: 'Fire Form', source: 'Elemental Trait', description: 'Can move through a space as narrow as 1 inch wide without squeezing. Takes water susceptibility damage.' }
    ]
  },
  {
    id: 'monster-5e-water-elemental',
    name: 'Water Elemental',
    race: 'Elemental',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Elemental',
    alignment: 'Neutral',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 114,
    hpCurrent: 114,
    armorClass: 14,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '12d10+48',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 18 }, DEX: { score: 14 }, CON: { score: 18 }, INT: { score: 5 }, WIS: { score: 10 }, CHA: { score: 8 } },
    attacks: [
      { id: 'atk-we-1', name: 'Slam', attackBonus: 7, damage: '2d8 + 4', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-we-2', name: 'Whelm (Recharge 4-6)', attackBonus: 0, damage: '2d8 + 4', damageType: 'Bludgeoning', range: '5 ft Radius', notes: 'DC 15 STR save or grappled, unable to breathe, and suffocating' }
    ],
    multiattack: 'The elemental makes two slam attacks.'
  },
  {
    id: 'monster-5e-bandit',
    name: 'Bandit',
    race: 'Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 1/8',
    challengeRating: '1/8',
    level: 1,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Any Non-Good',
    experiencePoints: 25,
    isMonster: true,
    monsterXpReward: 25,
    hpMax: 11,
    hpCurrent: 11,
    armorClass: 12,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '2d8+2',
    hitDiceCurrent: 2,
    abilities: { STR: { score: 11 }, DEX: { score: 12 }, CON: { score: 12 }, INT: { score: 10 }, WIS: { score: 10 }, CHA: { score: 10 } },
    attacks: [
      { id: 'atk-ban-b1', name: 'Scimitar', attackBonus: 3, damage: '1d6 + 1', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-ban-b2', name: 'Light Crossbow', attackBonus: 3, damage: '1d8 + 1', damageType: 'Piercing', range: '80/320 ft Ranged' }
    ]
  },
  {
    id: 'monster-5e-cultist',
    name: 'Cultist',
    race: 'Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 1/8',
    challengeRating: '1/8',
    level: 1,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Any Evil',
    experiencePoints: 25,
    isMonster: true,
    monsterXpReward: 25,
    hpMax: 9,
    hpCurrent: 9,
    armorClass: 12,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '2d8',
    hitDiceCurrent: 2,
    abilities: { STR: { score: 11 }, DEX: { score: 12 }, CON: { score: 10 }, INT: { score: 10 }, WIS: { score: 11 }, CHA: { score: 10 } },
    attacks: [
      { id: 'atk-cul-1', name: 'Scimitar', attackBonus: 3, damage: '1d6 + 1', damageType: 'Slashing', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'feat-cul-1', name: 'Dark Devotion', source: 'Humanoid Trait', description: 'Advantage on saving throws against being charmed or frightened.' }
    ]
  },
  {
    id: 'monster-5e-knight',
    name: 'Knight',
    race: 'Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Any Alignment',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    hpMax: 52,
    hpCurrent: 52,
    armorClass: 18,
    initiativeBonus: 0,
    speed: 30,
    hitDiceTotal: '8d8+16',
    hitDiceCurrent: 8,
    abilities: { STR: { score: 16 }, DEX: { score: 11 }, CON: { score: 14 }, INT: { score: 11 }, WIS: { score: 11 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-knt-1', name: 'Greatsword', attackBonus: 5, damage: '2d6 + 3', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-knt-2', name: 'Heavy Crossbow', attackBonus: 2, damage: '1d10', damageType: 'Piercing', range: '100/400 ft Ranged' }
    ],
    multiattack: 'The knight makes two melee attacks.',
    reactions: [
      { id: 'react-knt-1', name: 'Parry', description: 'The knight adds 2 to its AC against one melee attack that would hit it. To do so, the knight must see the attacker and be wielding a melee weapon.' }
    ],
    classFeatures: [
      { id: 'feat-knt-1', name: 'Brave', source: 'Humanoid Trait', description: 'Advantage on saving throws against being frightened.' },
      { id: 'feat-knt-2', name: 'Leadership (Recharge 6)', source: 'Humanoid Trait', description: 'For 1 minute, can add 1d4 to attack rolls or saving throws of nearby allies.' }
    ]
  },
  {
    id: 'monster-5e-archmage',
    name: 'Archmage',
    race: 'Humanoid',
    characterClass: 'Monster',
    subclass: 'CR 12',
    challengeRating: '12',
    level: 18,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Any Alignment',
    experiencePoints: 8400,
    isMonster: true,
    monsterXpReward: 8400,
    hpMax: 99,
    hpCurrent: 99,
    armorClass: 15,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '18d8+18',
    hitDiceCurrent: 18,
    abilities: { STR: { score: 10 }, DEX: { score: 14 }, CON: { score: 12 }, INT: { score: 20 }, WIS: { score: 15 }, CHA: { score: 16 } },
    isSpellcaster: true,
    spellcastingAbility: 'INT',
    spellSaveDc: 17,
    attacks: [
      { id: 'atk-arch-1', name: 'Dagger', attackBonus: 6, damage: '1d4 + 2', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-arch-2', name: 'Fireball (9th level)', attackBonus: 0, damage: '14d6', damageType: 'Fire', range: '150 ft', notes: 'DC 17 DEX save' },
      { id: 'atk-arch-3', name: 'Time Stop (1/day)', attackBonus: 0, damage: '0', damageType: 'Force', range: 'Self', notes: 'Takes 1d4+1 consecutive turns' }
    ],
    reactions: [
      { id: 'react-arch-1', name: 'Counterspell (3rd level)', description: 'Interrupts a spell being cast within 60 feet.' },
      { id: 'react-arch-2', name: 'Shield', description: 'Gains +5 AC until the start of its next turn when hit by an attack.' }
    ],
    classFeatures: [
      { id: 'feat-arch-1', name: 'Magic Resistance', source: 'Humanoid Trait', description: 'Advantage on saving throws against spells and magical effects.' }
    ]
  },
  {
    id: 'monster-5e-hydra',
    name: 'Hydra',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 8',
    challengeRating: '8',
    level: 8,
    edition: '5e',
    background: 'Huge Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 3900,
    isMonster: true,
    monsterXpReward: 3900,
    sizeCategory: 'Huge',
    hpMax: 172,
    hpCurrent: 172,
    armorClass: 15,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '15d12+75',
    hitDiceCurrent: 15,
    abilities: { STR: { score: 20 }, DEX: { score: 12 }, CON: { score: 20 }, INT: { score: 2 }, WIS: { score: 10 }, CHA: { score: 7 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-hyd-1', name: 'Bite', attackBonus: 8, damage: '1d10 + 5', damageType: 'Piercing', range: '10 ft Melee' }
    ],
    multiattack: 'The hydra makes as many bite attacks as it has heads (starts with 5).',
    classFeatures: [
      { id: 'feat-hyd-1', name: 'Multiple Heads', source: 'Monstrosity Trait', description: 'Gains 1 extra head for each head severed unless fire damage stops regeneration.' },
      { id: 'feat-hyd-2', name: 'Reactive Heads', source: 'Monstrosity Trait', description: 'Gains an extra reaction per turn for each head beyond one, used for opportunity attacks.' }
    ]
  },
  {
    id: 'monster-5e-bulette',
    name: 'Bulette',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 94,
    hpCurrent: 94,
    armorClass: 17,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '9d10+45',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 19 }, DEX: { score: 11 }, CON: { score: 21 }, INT: { score: 2 }, WIS: { score: 10 }, CHA: { score: 5 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-bul-1', name: 'Bite', attackBonus: 7, damage: '4d12 + 4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-bul-2', name: 'Deadly Leap', attackBonus: 0, damage: '3d6 + 4 + 3d6', damageType: 'Bludgeoning + Slashing', range: '15 ft Radius', notes: 'DC 16 STR save or knocked prone & takes 3d6+4 bludgeoning + 3d6 slashing' }
    ],
    classFeatures: [
      { id: 'feat-bul-1', name: 'Standing Leap', source: 'Monstrosity Trait', description: 'Long jump up to 30 feet and high jump up to 15 feet without a running start.' }
    ]
  },
  {
    id: 'monster-5e-manticore',
    name: 'Manticore',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 5,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Lawful Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Large',
    hpMax: 68,
    hpCurrent: 68,
    armorClass: 14,
    initiativeBonus: 3,
    speed: 30,
    hitDiceTotal: '8d10+24',
    hitDiceCurrent: 8,
    abilities: { STR: { score: 17 }, DEX: { score: 16 }, CON: { score: 17 }, INT: { score: 7 }, WIS: { score: 12 }, CHA: { score: 8 } },
    attacks: [
      { id: 'atk-man-1', name: 'Bite', attackBonus: 5, damage: '1d8 + 3', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-man-2', name: 'Claws', attackBonus: 5, damage: '2d4 + 3', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-man-3', name: 'Tail Spike Volley', attackBonus: 5, damage: '1d8 + 3', damageType: 'Piercing', range: '100/200 ft Ranged' }
    ],
    multiattack: 'The manticore makes three attacks: one with its bite and two with its claws, or three tail spikes.'
  },
  {
    id: 'monster-5e-wyvern',
    name: 'Wyvern',
    race: 'Dragon',
    characterClass: 'Monster',
    subclass: 'CR 6',
    challengeRating: '6',
    level: 7,
    edition: '5e',
    background: 'Large Dragon',
    alignment: 'Unaligned',
    experiencePoints: 2300,
    isMonster: true,
    monsterXpReward: 2300,
    sizeCategory: 'Large',
    hpMax: 110,
    hpCurrent: 110,
    armorClass: 13,
    initiativeBonus: 1,
    speed: 20,
    hitDiceTotal: '13d10+39',
    hitDiceCurrent: 13,
    abilities: { STR: { score: 19 }, DEX: { score: 12 }, CON: { score: 16 }, INT: { score: 5 }, WIS: { score: 12 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-wyv-1', name: 'Bite', attackBonus: 7, damage: '2d6 + 4', damageType: 'Piercing', range: '10 ft Melee' },
      { id: 'atk-wyv-2', name: 'Claws', attackBonus: 7, damage: '2d8 + 4', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-wyv-3', name: 'Stinger', attackBonus: 7, damage: '2d6 + 4 + 7d6', damageType: 'Piercing + Poison', range: '10 ft Melee', notes: 'DC 15 CON save or 7d6 poison damage (half on save)' }
    ],
    multiattack: 'The wyvern makes two attacks: one with its bite and one with its stinger or claws.'
  },
  {
    id: 'monster-5e-gorgon',
    name: 'Gorgon',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 114,
    hpCurrent: 114,
    armorClass: 19,
    initiativeBonus: 0,
    speed: 40,
    hitDiceTotal: '12d10+48',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 20 }, DEX: { score: 11 }, CON: { score: 18 }, INT: { score: 2 }, WIS: { score: 12 }, CHA: { score: 7 } },
    attacks: [
      { id: 'atk-gor-1', name: 'Gore', attackBonus: 8, damage: '2d12 + 5', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-gor-2', name: 'Petrifying Breath (Recharge 5-6)', attackBonus: 0, damage: '0', damageType: 'Poison', range: '30 ft Cone', notes: 'DC 13 CON save or petrified into solid stone' }
    ],
    classFeatures: [
      { id: 'feat-gor-1', name: 'Trampling Charge', source: 'Monstrosity Trait', description: 'If moving 20 ft straight toward target and hitting with Gore, target DC 16 STR save or knocked prone and Gorgon makes Hooves bonus attack.' }
    ]
  },
  {
    id: 'monster-5e-basilisk',
    name: 'Basilisk',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '5e',
    background: 'Medium Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    hpMax: 52,
    hpCurrent: 52,
    armorClass: 15,
    initiativeBonus: -1,
    speed: 20,
    hitDiceTotal: '8d8+16',
    hitDiceCurrent: 8,
    abilities: { STR: { score: 16 }, DEX: { score: 8 }, CON: { score: 15 }, INT: { score: 2 }, WIS: { score: 8 }, CHA: { score: 7 } },
    attacks: [
      { id: 'atk-bas-1', name: 'Bite', attackBonus: 5, damage: '2d6 + 3 + 2d6', damageType: 'Piercing + Poison', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'feat-bas-1', name: 'Petrifying Gaze', source: 'Monstrosity Trait', description: 'Creatures starting turn within 30 ft must succeed DC 12 CON save or begin turning to stone (petrified on fail by 5 or more).' }
    ]
  },
  {
    id: 'monster-5e-balor',
    name: 'Balor',
    race: 'Fiend',
    characterClass: 'Monster',
    subclass: 'CR 19',
    challengeRating: '19',
    level: 19,
    edition: '5e',
    background: 'Huge Fiend (Demon)',
    alignment: 'Chaotic Evil',
    experiencePoints: 22000,
    isMonster: true,
    monsterXpReward: 22000,
    sizeCategory: 'Huge',
    hpMax: 262,
    hpCurrent: 262,
    armorClass: 19,
    initiativeBonus: 2,
    speed: 40,
    hitDiceTotal: '21d12+126',
    hitDiceCurrent: 21,
    abilities: { STR: { score: 26 }, DEX: { score: 15 }, CON: { score: 22 }, INT: { score: 20 }, WIS: { score: 16 }, CHA: { score: 22 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-bal-1', name: 'Longsword', attackBonus: 14, damage: '3d8 + 8 + 3d8', damageType: 'Slashing + Lightning', range: '10 ft Melee' },
      { id: 'atk-bal-2', name: 'Whip', attackBonus: 14, damage: '2d6 + 8 + 3d6', damageType: 'Slashing + Fire', range: '30 ft Melee', notes: 'Pulls target up to 25 ft toward balor' }
    ],
    multiattack: 'The balor makes two attacks: one with its longsword and one with its whip.',
    classFeatures: [
      { id: 'feat-bal-1', name: 'Fire Aura', source: 'Fiend Trait', description: 'Creatures touching or hitting within 5 ft take 10 (3d6) fire damage.' },
      { id: 'feat-bal-2', name: 'Death Throes', source: 'Fiend Trait', description: 'When balor dies, it explodes dealing 70 (20d6) fire damage to creatures within 30 ft (DC 20 DEX save for half).' }
    ]
  },
  {
    id: 'monster-5e-green-dragon',
    name: 'Adult Green Dragon',
    race: 'Dragon',
    characterClass: 'Monster',
    subclass: 'CR 15',
    challengeRating: '15',
    level: 15,
    edition: '5e',
    background: 'Huge Dragon',
    alignment: 'Lawful Evil',
    experiencePoints: 13000,
    isMonster: true,
    monsterXpReward: 13000,
    sizeCategory: 'Huge',
    hpMax: 207,
    hpCurrent: 207,
    armorClass: 19,
    initiativeBonus: 1,
    speed: 40,
    hitDiceTotal: '18d12+90',
    hitDiceCurrent: 18,
    abilities: { STR: { score: 23 }, DEX: { score: 12 }, CON: { score: 21 }, INT: { score: 18 }, WIS: { score: 15 }, CHA: { score: 17 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-agd-1', name: 'Bite', attackBonus: 11, damage: '2d10 + 6 + 2d6', damageType: 'Piercing + Poison', range: '10 ft Melee' },
      { id: 'atk-agd-2', name: 'Claw', attackBonus: 11, damage: '2d6 + 6', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-agd-3', name: 'Poison Breath (Recharge 5-6)', attackBonus: 0, damage: '16d6', damageType: 'Poison', range: '60 ft Cone', notes: 'DC 18 CON save for half damage' }
    ],
    multiattack: 'The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.',
    legendaryActionsMax: 3,
    legendaryActionsRemaining: 3,
    legendaryActions: [
      { id: 'leg-agd-1', name: 'Detect', cost: 1, description: 'The dragon makes a Wisdom (Perception) check.' },
      { id: 'leg-agd-2', name: 'Tail Attack', cost: 1, description: 'The dragon makes a tail attack (+11 to hit, 2d8+6 bludgeoning damage).' },
      { id: 'leg-agd-3', name: 'Wing Attack', cost: 2, description: 'Creatures within 10 ft DC 19 DEX save or take 13 (2d6+6) bludgeoning damage & fall prone.' }
    ]
  },
  {
    id: 'monster-5e-bugbear',
    name: 'Bugbear',
    race: 'Goblinoid',
    characterClass: 'Monster',
    subclass: 'CR 1',
    challengeRating: '1',
    level: 2,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Chaotic Evil',
    experiencePoints: 200,
    isMonster: true,
    monsterXpReward: 200,
    hpMax: 27,
    hpCurrent: 27,
    armorClass: 16,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '5d8+5',
    hitDiceCurrent: 5,
    abilities: { STR: { score: 15 }, DEX: { score: 14 }, CON: { score: 13 }, INT: { score: 8 }, WIS: { score: 11 }, CHA: { score: 9 } },
    attacks: [
      { id: 'atk-bug-1', name: 'Morningstar', attackBonus: 4, damage: '2d8 + 2', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-bug-2', name: 'Javelin', attackBonus: 4, damage: '1d6 + 2', damageType: 'Piercing', range: '30/120 ft Ranged' }
    ],
    classFeatures: [
      { id: 'feat-bug-1', name: 'Brute', source: 'Goblinoid Trait', description: 'A melee weapon deals one extra die of its damage when the bugbear hits with it.' },
      { id: 'feat-bug-2', name: 'Surprise Attack', source: 'Goblinoid Trait', description: 'If bugbear surprises a creature, deals extra 2d6 damage on hit in first round.' }
    ]
  },
  {
    id: 'monster-5e-hobgoblin',
    name: 'Hobgoblin Warlord',
    race: 'Goblinoid',
    characterClass: 'Monster',
    subclass: 'CR 6',
    challengeRating: '6',
    level: 7,
    edition: '5e',
    background: 'Medium Humanoid',
    alignment: 'Lawful Evil',
    experiencePoints: 2300,
    isMonster: true,
    monsterXpReward: 2300,
    hpMax: 97,
    hpCurrent: 97,
    armorClass: 20,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '15d8+30',
    hitDiceCurrent: 15,
    abilities: { STR: { score: 16 }, DEX: { score: 14 }, CON: { score: 14 }, INT: { score: 14 }, WIS: { score: 11 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-hob-1', name: 'Longsword', attackBonus: 6, damage: '1d8 + 3', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-hob-2', name: 'Javelin', attackBonus: 6, damage: '1d6 + 3', damageType: 'Piercing', range: '30/120 ft Ranged' }
    ],
    multiattack: 'The hobgoblin warlord makes three melee attacks or two ranged attacks.',
    classFeatures: [
      { id: 'feat-hob-1', name: 'Martial Advantage', source: 'Goblinoid Trait', description: 'Deals an extra 10 (3d6) damage to a target it hits if target is within 5 ft of an ally of the warlord.' },
      { id: 'feat-hob-2', name: 'Leadership (Recharge 6)', source: 'Goblinoid Trait', description: 'For 1 minute, can add 1d4 to attack rolls or saving throws of nearby allies within 30 ft.' }
    ]
  },
  {
    id: 'monster-5e-medusa',
    name: 'Medusa',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 6',
    challengeRating: '6',
    level: 7,
    edition: '5e',
    background: 'Medium Monstrosity',
    alignment: 'Lawful Evil',
    experiencePoints: 2300,
    isMonster: true,
    monsterXpReward: 2300,
    hpMax: 127,
    hpCurrent: 127,
    armorClass: 15,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '17d8+51',
    hitDiceCurrent: 17,
    abilities: { STR: { score: 10 }, DEX: { score: 15 }, CON: { score: 16 }, INT: { score: 12 }, WIS: { score: 13 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-med-1', name: 'Snake Hair', attackBonus: 5, damage: '1d4 + 2 + 4d6', damageType: 'Piercing + Poison', range: '5 ft Melee' },
      { id: 'atk-med-2', name: 'Shortsword', attackBonus: 5, damage: '1d6 + 2', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-med-3', name: 'Longbow', attackBonus: 5, damage: '1d8 + 2 + 2d6', damageType: 'Piercing + Poison', range: '150/600 ft Ranged' }
    ],
    multiattack: 'The medusa makes three melee attacks: one with its snake hair and two with its shortsword, or two ranged attacks with its longbow.',
    classFeatures: [
      { id: 'feat-med-1', name: 'Petrifying Gaze', source: 'Monstrosity Trait', description: 'When a creature starts its turn within 30 ft of Medusa and can see her, Medusa can force DC 14 CON save. Fail by 5+ = immediate Petrified. Otherwise petrified on 2nd fail.' }
    ]
  },
  {
    id: 'monster-5e-remorhaz',
    name: 'Remorhaz',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 11',
    challengeRating: '11',
    level: 11,
    edition: '5e',
    background: 'Huge Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 7200,
    isMonster: true,
    monsterXpReward: 7200,
    sizeCategory: 'Huge',
    hpMax: 195,
    hpCurrent: 195,
    armorClass: 17,
    initiativeBonus: 1,
    speed: 30,
    hitDiceTotal: '17d12+85',
    hitDiceCurrent: 17,
    abilities: { STR: { score: 24 }, DEX: { score: 13 }, CON: { score: 21 }, INT: { score: 4 }, WIS: { score: 10 }, CHA: { score: 5 } },
    optionalRules: { hasPowerfulBuild: true },
    attacks: [
      { id: 'atk-rem-1', name: 'Bite', attackBonus: 11, damage: '6d10 + 7 + 3d6', damageType: 'Piercing + Fire', range: '10 ft Melee', notes: 'Target is grappled (escape DC 17) & Restrained.' }
    ],
    classFeatures: [
      { id: 'feat-rem-1', name: 'Heated Body', source: 'Monstrosity Trait', description: 'A creature that touches the remorhaz or hits it with a melee attack within 5 ft takes 10 (3d6) fire damage.' },
      { id: 'feat-rem-2', name: 'Swallow Whole', source: 'Monstrosity Trait', description: 'Swallows a creature grappled by it. Swallowed target takes 21 (6d6) acid damage at start of Remorhaz turn, blinded/restrained.' }
    ]
  },
  {
    id: 'monster-5e-roper',
    name: 'Roper',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Neutral Evil',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 93,
    hpCurrent: 93,
    armorClass: 20,
    initiativeBonus: -1,
    speed: 10,
    hitDiceTotal: '11d10+33',
    hitDiceCurrent: 11,
    abilities: { STR: { score: 18 }, DEX: { score: 8 }, CON: { score: 17 }, INT: { score: 7 }, WIS: { score: 16 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-rop-1', name: 'Bite', attackBonus: 7, damage: '4d8 + 4', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-rop-2', name: 'Tendril Grapple', attackBonus: 7, damage: '0', damageType: 'Bludgeoning', range: '50 ft Ranged', notes: 'Target is grappled & restrained. Disadvantage on STR checks.' }
    ],
    multiattack: 'The roper makes four tendril attacks, operates reel, and makes one bite attack.',
    classFeatures: [
      { id: 'feat-rop-1', name: 'Reel', source: 'Monstrosity Trait', description: 'Pulls each creature grappled by it up to 25 feet straight toward it.' },
      { id: 'feat-rop-2', name: 'False Appearance', source: 'Monstrosity Trait', description: 'Indistinguishable from an ordinary stalagmite or stalactite while motionless.' }
    ]
  },
  {
    id: 'monster-5e-iron-golem',
    name: 'Iron Golem',
    race: 'Construct',
    characterClass: 'Monster',
    subclass: 'CR 16',
    challengeRating: '16',
    level: 16,
    edition: '5e',
    background: 'Large Construct',
    alignment: 'Unaligned',
    experiencePoints: 15000,
    isMonster: true,
    monsterXpReward: 15000,
    sizeCategory: 'Large',
    hpMax: 210,
    hpCurrent: 210,
    armorClass: 20,
    initiativeBonus: -1,
    speed: 30,
    hitDiceTotal: '20d10+100',
    hitDiceCurrent: 20,
    abilities: { STR: { score: 24 }, DEX: { score: 9 }, CON: { score: 20 }, INT: { score: 3 }, WIS: { score: 11 }, CHA: { score: 1 } },
    attacks: [
      { id: 'atk-iron-1', name: 'Slam', attackBonus: 13, damage: '3d8 + 7', damageType: 'Bludgeoning', range: '5 ft Melee' },
      { id: 'atk-iron-2', name: 'Sword', attackBonus: 13, damage: '3d10 + 7', damageType: 'Slashing', range: '10 ft Melee' },
      { id: 'atk-iron-3', name: 'Poison Breath (Recharge 5-6)', attackBonus: 0, damage: '10d8', damageType: 'Poison', range: '15 ft Cone', notes: 'DC 19 CON save for half damage' }
    ],
    multiattack: 'The iron golem makes two melee attacks.',
    classFeatures: [
      { id: 'feat-iron-1', name: 'Fire Absorption', source: 'Construct Trait', description: 'Subjected to fire damage takes 0 damage and instead regains HP equal to fire damage dealt!' },
      { id: 'feat-iron-2', name: 'Immutable Form & Magic Resistance', source: 'Construct Trait', description: 'Immune to any spell or effect that would alter its form. Advantage on saving throws against spells.' }
    ]
  },
  {
    id: 'monster-5e-rust-monster',
    name: 'Rust Monster',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 2,
    edition: '5e',
    background: 'Medium Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 100,
    isMonster: true,
    monsterXpReward: 100,
    hpMax: 27,
    hpCurrent: 27,
    armorClass: 14,
    initiativeBonus: 1,
    speed: 40,
    hitDiceTotal: '5d8+5',
    hitDiceCurrent: 5,
    abilities: { STR: { score: 13 }, DEX: { score: 12 }, CON: { score: 13 }, INT: { score: 2 }, WIS: { score: 13 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-rust-1', name: 'Bite', attackBonus: 3, damage: '1d8 + 1', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-rust-2', name: 'Antennae Rust Touch', attackBonus: 3, damage: '0', damageType: 'Corrosion', range: '5 ft Melee', notes: 'Nonmagical metal armor/shield/weapon takes -1 AC or damage penalty!' }
    ],
    classFeatures: [
      { id: 'feat-rust-1', name: 'Iron Scent', source: 'Monstrosity Trait', description: 'Pinpoint precise location of ferrous metal within 30 feet.' }
    ]
  },
  {
    id: 'monster-5e-displacer-beast',
    name: 'Displacer Beast',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Lawful Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Large',
    hpMax: 85,
    hpCurrent: 85,
    armorClass: 13,
    initiativeBonus: 2,
    speed: 40,
    hitDiceTotal: '10d10+30',
    hitDiceCurrent: 10,
    abilities: { STR: { score: 18 }, DEX: { score: 15 }, CON: { score: 16 }, INT: { score: 6 }, WIS: { score: 12 }, CHA: { score: 8 } },
    attacks: [
      { id: 'atk-disp-1', name: 'Tentacle', attackBonus: 6, damage: '1d6 + 4 + 1d6', damageType: 'Bludgeoning + Piercing', range: '10 ft Melee' }
    ],
    multiattack: 'The displacer beast makes two tentacle attacks.',
    classFeatures: [
      { id: 'feat-disp-1', name: 'Displacement Illusion', source: 'Monstrosity Trait', description: 'Projects a magical illusion making it appear near its actual location. Attack rolls against it have disadvantage.' },
      { id: 'feat-disp-2', name: 'Avoidance', source: 'Monstrosity Trait', description: 'When subjected to effect allowing DEX save for half damage, takes NO damage on success and half on fail.' }
    ]
  },
  {
    id: 'monster-5e-gibbering-mouther',
    name: 'Gibbering Mouther',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 2',
    challengeRating: '2',
    level: 3,
    edition: '5e',
    background: 'Medium Aberration',
    alignment: 'Neutral Evil',
    experiencePoints: 450,
    isMonster: true,
    monsterXpReward: 450,
    hpMax: 67,
    hpCurrent: 67,
    armorClass: 9,
    initiativeBonus: -1,
    speed: 10,
    hitDiceTotal: '9d8+27',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 10 }, DEX: { score: 8 }, CON: { score: 16 }, INT: { score: 3 }, WIS: { score: 10 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-gib-1', name: 'Bites', attackBonus: 2, damage: '5d6', damageType: 'Piercing', range: '5 ft Melee', notes: 'Target prone DC 10 STR save or swallowed by mouths' },
      { id: 'atk-gib-2', name: 'Blinding Spittle (Recharge 5-6)', attackBonus: 0, damage: '0', damageType: 'Radiant', range: '15 ft Radius', notes: 'DC 10 DEX save or blinded for 1 minute' }
    ],
    multiattack: 'The gibbering mouther makes one bites attack and uses Blinding Spittle if available.',
    classFeatures: [
      { id: 'feat-gib-1', name: 'Gibbering Aura', source: 'Aberration Trait', description: 'Creatures starting turn within 20 ft must succeed DC 10 WIS save or spend turn confused (random action d8 table).' },
      { id: 'feat-gib-2', name: 'Aberrant Ground', source: 'Aberration Trait', description: 'Ground within 10 ft becomes doughlike difficult terrain; DC 10 STR save or speed reduced to 0.' }
    ]
  },
  {
    id: 'monster-5e-cloaker',
    name: 'Cloaker',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 8',
    challengeRating: '8',
    level: 8,
    edition: '5e',
    background: 'Large Aberration',
    alignment: 'Chaotic Evil',
    experiencePoints: 3900,
    isMonster: true,
    monsterXpReward: 3900,
    sizeCategory: 'Large',
    hpMax: 78,
    hpCurrent: 78,
    armorClass: 14,
    initiativeBonus: 2,
    speed: 10,
    hitDiceTotal: '12d10+12',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 17 }, DEX: { score: 15 }, CON: { score: 12 }, INT: { score: 13 }, WIS: { score: 12 }, CHA: { score: 14 } },
    attacks: [
      { id: 'atk-clk-1', name: 'Bite', attackBonus: 6, damage: '2d6 + 3', damageType: 'Piercing', range: '5 ft Melee', notes: 'Attaches to target; cloaker has advantage on bite attacks against attached target' },
      { id: 'atk-clk-2', name: 'Tail', attackBonus: 6, damage: '1d8 + 3', damageType: 'Slashing', range: '10 ft Melee' }
    ],
    multiattack: 'The cloaker makes two attacks: one with its bite and one with its tail.',
    classFeatures: [
      { id: 'feat-clk-1', name: 'Damage Transfer', source: 'Aberration Trait', description: 'While attached to a creature, cloaker takes only half damage and attached target takes the other half!' },
      { id: 'feat-clk-2', name: 'Phantasms (3/Day)', source: 'Aberration Trait', description: 'Magically creates 3 illusory duplicates (Mirror Image effect).' },
      { id: 'feat-clk-3', name: 'Frightful Moan', source: 'Aberration Trait', description: 'Creatures within 60 ft DC 13 WIS save or Frightened for 1 minute.' }
    ]
  },
  {
    id: 'monster-5e-shambling-mound',
    name: 'Shambling Mound',
    race: 'Plant',
    characterClass: 'Monster',
    subclass: 'CR 5',
    challengeRating: '5',
    level: 6,
    edition: '5e',
    background: 'Large Plant',
    alignment: 'Unaligned',
    experiencePoints: 1800,
    isMonster: true,
    monsterXpReward: 1800,
    sizeCategory: 'Large',
    hpMax: 136,
    hpCurrent: 136,
    armorClass: 15,
    initiativeBonus: -1,
    speed: 20,
    hitDiceTotal: '16d10+48',
    hitDiceCurrent: 16,
    abilities: { STR: { score: 18 }, DEX: { score: 8 }, CON: { score: 16 }, INT: { score: 5 }, WIS: { score: 10 }, CHA: { score: 5 } },
    attacks: [
      { id: 'atk-shm-1', name: 'Slam', attackBonus: 7, damage: '2d8 + 4', damageType: 'Bludgeoning', range: '5 ft Melee', notes: 'Target is grappled (escape DC 14)' },
      { id: 'atk-shm-2', name: 'Engulf', attackBonus: 0, damage: '2d8 + 4 + 2d8', damageType: 'Bludgeoning + Suffocation', range: '5 ft Melee', notes: 'Engulfs medium target; target is blinded, restrained & suffocating inside mound' }
    ],
    multiattack: 'The shambling mound makes two slam attacks. If both hit a Medium or smaller target, target is grappled & Engulfed.',
    classFeatures: [
      { id: 'feat-shm-1', name: 'Lightning Absorption', source: 'Plant Trait', description: 'Subjected to lightning damage takes 0 damage and instead regains HP equal to lightning damage dealt!' }
    ]
  },
  {
    id: 'monster-5e-phase-spider',
    name: 'Phase Spider',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '5e',
    background: 'Large Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Large',
    hpMax: 32,
    hpCurrent: 32,
    armorClass: 13,
    initiativeBonus: 2,
    speed: 30,
    hitDiceTotal: '5d10+5',
    hitDiceCurrent: 5,
    abilities: { STR: { score: 15 }, DEX: { score: 15 }, CON: { score: 12 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 6 } },
    attacks: [
      { id: 'atk-psp-1', name: 'Bite', attackBonus: 4, damage: '1d10 + 2 + 4d8', damageType: 'Piercing + Poison', range: '5 ft Melee', notes: 'DC 11 CON save or take 4d8 poison damage (half on save)' }
    ],
    classFeatures: [
      { id: 'feat-psp-1', name: 'Ethereal Jaunt', source: 'Monstrosity Trait', description: 'Bonus Action: Shifts from Material Plane to Ethereal Plane, or vice versa!' },
      { id: 'feat-psp-2', name: 'Spider Climb', source: 'Monstrosity Trait', description: 'Can climb difficult surfaces, including upside down on ceilings, without an ability check.' }
    ]
  },
  {
    id: 'monster-5e-ghost',
    name: 'Ghost',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 5,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Any Alignment',
    experiencePoints: 1100,
    isMonster: true,
    monsterXpReward: 1100,
    sizeCategory: 'Medium',
    hpMax: 45,
    hpCurrent: 45,
    armorClass: 11,
    initiativeBonus: 1,
    speed: 0,
    hitDiceTotal: '10d8',
    hitDiceCurrent: 10,
    abilities: { STR: { score: 7 }, DEX: { score: 13 }, CON: { score: 10 }, INT: { score: 10 }, WIS: { score: 12 }, CHA: { score: 17 } },
    attacks: [
      { id: 'atk-gho-1', name: 'Withering Touch', attackBonus: 5, damage: '4d6 + 3', damageType: 'Necrotic', range: '5 ft Melee', notes: 'Corroding ethereal spectral attack' }
    ],
    classFeatures: [
      { id: 'feat-gho-1', name: 'Ethereal Sight', source: 'Undead Trait', description: 'Can see 60 feet into the Ethereal Plane when on the Material Plane, and vice versa.' },
      { id: 'feat-gho-2', name: 'Etherealness', source: 'Undead Action', description: 'Action: Enters the Border Ethereal from the Material Plane, or vice versa. Invisible on Material Plane unless seen with Ethereal Sight.' },
      { id: 'feat-gho-3', name: 'Incorporeal Movement', source: 'Undead Trait', description: 'Can move through creatures and objects as if difficult terrain. Takes 1d10 force damage if ending turn inside object.' },
      { id: 'feat-gho-4', name: 'Possession', source: 'Undead Action (Recharge 6)', description: 'Target humanoid within 5ft must succeed on DC 13 CHA save or be possessed by ghost.' }
    ]
  },
  {
    id: 'monster-5e-nightmare',
    name: 'Nightmare',
    race: 'Fiend',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '5e',
    background: 'Large Fiend',
    alignment: 'Neutral Evil',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Large',
    hpMax: 68,
    hpCurrent: 68,
    armorClass: 13,
    initiativeBonus: 2,
    speed: 60,
    hitDiceTotal: '8d10+24',
    hitDiceCurrent: 8,
    abilities: { STR: { score: 18 }, DEX: { score: 15 }, CON: { score: 16 }, INT: { score: 10 }, WIS: { score: 13 }, CHA: { score: 15 } },
    attacks: [
      { id: 'atk-nmr-1', name: 'Hooves', attackBonus: 6, damage: '2d8 + 4 + 2d6', damageType: 'Bludgeoning + Fire', range: '5 ft Melee', notes: 'Flaming fiery hooves strike' }
    ],
    classFeatures: [
      { id: 'feat-nmr-1', name: 'Ethereal Stride', source: 'Fiend Action', description: 'Action: Nightmare and up to 3 willing riders touching it magically teleport to the Ethereal Plane or back to the Material Plane!' },
      { id: 'feat-nmr-2', name: 'Confer Fire Resistance', source: 'Fiend Trait', description: 'Grants Fire Resistance to any creature riding the Nightmare.' }
    ]
  },
  {
    id: 'monster-5e-succubus',
    name: 'Succubus / Incubus',
    race: 'Fiend',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 5,
    edition: '5e',
    background: 'Medium Fiend',
    alignment: 'Neutral Evil',
    experiencePoints: 1100,
    isMonster: true,
    monsterXpReward: 1100,
    sizeCategory: 'Medium',
    hpMax: 66,
    hpCurrent: 66,
    armorClass: 15,
    initiativeBonus: 3,
    speed: 30,
    hitDiceTotal: '12d8+12',
    hitDiceCurrent: 12,
    abilities: { STR: { score: 8 }, DEX: { score: 17 }, CON: { score: 13 }, INT: { score: 15 }, WIS: { score: 12 }, CHA: { score: 20 } },
    attacks: [
      { id: 'atk-suc-1', name: 'Claw', attackBonus: 5, damage: '1d6 + 3', damageType: 'Slashing', range: '5 ft Melee' },
      { id: 'atk-suc-2', name: 'Draining Kiss', attackBonus: 5, damage: '5d10 + 5', damageType: 'Psychic', range: '5 ft Melee', notes: 'Target max HP is reduced by damage taken until long rest' }
    ],
    classFeatures: [
      { id: 'feat-suc-1', name: 'Etherealness', source: 'Fiend Action', description: 'Action: Enters the Border Ethereal from the Material Plane, or vice versa.' },
      { id: 'feat-suc-2', name: 'Charm', source: 'Fiend Action', description: 'DC 15 WIS save or charmed for 1 day. Charmed target obeys succubus commands.' }
    ]
  },
  {
    id: 'monster-5e-ethereal-filcher',
    name: 'Ethereal Filcher',
    race: 'Aberration',
    characterClass: 'Monster',
    subclass: 'CR 3',
    challengeRating: '3',
    level: 4,
    edition: '5e',
    background: 'Medium Aberration',
    alignment: 'Chaotic Neutral',
    experiencePoints: 700,
    isMonster: true,
    monsterXpReward: 700,
    sizeCategory: 'Medium',
    hpMax: 39,
    hpCurrent: 39,
    armorClass: 16,
    initiativeBonus: 3,
    speed: 40,
    hitDiceTotal: '6d8+12',
    hitDiceCurrent: 6,
    abilities: { STR: { score: 10 }, DEX: { score: 17 }, CON: { score: 14 }, INT: { score: 7 }, WIS: { score: 12 }, CHA: { score: 10 } },
    attacks: [
      { id: 'atk-efil-1', name: 'Bite', attackBonus: 5, damage: '1d4 + 3', damageType: 'Piercing', range: '5 ft Melee' },
      { id: 'atk-efil-2', name: 'Snatch & Vanish', attackBonus: 5, damage: '0', damageType: 'Utility', range: '5 ft Melee', notes: 'DC 13 Sleight of Hand check to snatch a weapon, magic item, or gold pouch and instantly escape into Ethereal Plane!' }
    ],
    classFeatures: [
      { id: 'feat-efil-1', name: 'Ethereal Jaunt', source: 'Aberration Trait', description: 'Bonus Action: Shifts from Material Plane to Ethereal Plane, or vice versa at will.' }
    ]
  },
  {
    id: 'monster-5e-blink-dog',
    name: 'Blink Dog',
    race: 'Fey',
    characterClass: 'Monster',
    subclass: 'CR 1/4',
    challengeRating: '1/4',
    level: 1,
    edition: '5e',
    background: 'Medium Fey',
    alignment: 'Lawful Good',
    experiencePoints: 50,
    isMonster: true,
    monsterXpReward: 50,
    sizeCategory: 'Medium',
    hpMax: 22,
    hpCurrent: 22,
    armorClass: 13,
    initiativeBonus: 3,
    speed: 40,
    hitDiceTotal: '4d8+4',
    hitDiceCurrent: 4,
    abilities: { STR: { score: 12 }, DEX: { score: 17 }, CON: { score: 12 }, INT: { score: 10 }, WIS: { score: 13 }, CHA: { score: 11 } },
    attacks: [
      { id: 'atk-bdog-1', name: 'Bite', attackBonus: 5, damage: '1d6 + 3', damageType: 'Piercing', range: '5 ft Melee' }
    ],
    classFeatures: [
      { id: 'feat-bdog-1', name: 'Teleport / Blink', source: 'Fey Action', description: 'Bonus Action: Teleports up to 40 ft to an unoccupied space, phasing briefly through the Border Ethereal.' }
    ]
  },
  {
    id: 'monster-5e-flameskull',
    name: 'Flameskull',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 4',
    challengeRating: '4',
    level: 5,
    edition: '5e',
    background: 'Tiny Undead',
    alignment: 'Neutral Evil',
    experiencePoints: 1100,
    isMonster: true,
    monsterXpReward: 1100,
    hpMax: 40,
    hpCurrent: 40,
    armorClass: 13,
    initiativeBonus: 3,
    speed: 0,
    hitDiceTotal: '9d4+18',
    hitDiceCurrent: 9,
    abilities: { STR: { score: 1 }, DEX: { score: 17 }, CON: { score: 14 }, INT: { score: 16 }, WIS: { score: 10 }, CHA: { score: 11 } },
    attacks: [
      { id: 'atk-fsk-1', name: 'Fire Ray', attackBonus: 5, damage: '3d6', damageType: 'Fire', range: '30 ft Ranged' },
      { id: 'atk-fsk-2', name: 'Fireball Spell (1/Day)', attackBonus: 0, damage: '8d6', damageType: 'Fire', range: '150 ft (20ft sphere)', notes: 'DC 13 DEX save for half damage' }
    ],
    multiattack: 'The flameskull makes two fire ray attacks.',
    classFeatures: [
      { id: 'feat-fsk-1', name: 'Rejuvenation', source: 'Undead Trait', description: 'If destroyed, regains all HP in 1 hour unless holy water or Dispel Magic is cast on its remains.' },
      { id: 'feat-fsk-2', name: 'Magic Resistance', source: 'Undead Trait', description: 'Advantage on saving throws against spells and magical effects.' }
    ]
  },
  {
    id: 'monster-5e-shadow',
    name: 'Shadow',
    race: 'Undead',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 2,
    edition: '5e',
    background: 'Medium Undead',
    alignment: 'Chaotic Evil',
    experiencePoints: 100,
    isMonster: true,
    monsterXpReward: 100,
    hpMax: 16,
    hpCurrent: 16,
    armorClass: 12,
    initiativeBonus: 2,
    speed: 40,
    hitDiceTotal: '3d8+3',
    hitDiceCurrent: 3,
    abilities: { STR: { score: 6 }, DEX: { score: 14 }, CON: { score: 13 }, INT: { score: 6 }, WIS: { score: 10 }, CHA: { score: 8 } },
    attacks: [
      { id: 'atk-shd-1', name: 'Strength Drain', attackBonus: 4, damage: '2d6 + 2', damageType: 'Necrotic', range: '5 ft Melee', notes: 'Target STR score reduced by 1d4! Target dies if STR reaches 0.' }
    ],
    classFeatures: [
      { id: 'feat-shd-1', name: 'Strength Drain Mechanic', source: 'Undead Trait', description: 'Reduces target Strength by 1d4. Reduction lasts until target finishes a short/long rest. Target dies if STR is reduced to 0.' },
      { id: 'feat-shd-2', name: 'Shadow Stealth', source: 'Undead Trait', description: 'While in dim light or darkness, can take the Hide action as a bonus action.' }
    ]
  },
  {
    id: 'monster-5e-cockatrice',
    name: 'Cockatrice',
    race: 'Monstrosity',
    characterClass: 'Monster',
    subclass: 'CR 1/2',
    challengeRating: '1/2',
    level: 2,
    edition: '5e',
    background: 'Small Monstrosity',
    alignment: 'Unaligned',
    experiencePoints: 100,
    isMonster: true,
    monsterXpReward: 100,
    hpMax: 27,
    hpCurrent: 27,
    armorClass: 11,
    initiativeBonus: 1,
    speed: 20,
    hitDiceTotal: '6d6+6',
    hitDiceCurrent: 6,
    abilities: { STR: { score: 6 }, DEX: { score: 12 }, CON: { score: 12 }, INT: { score: 2 }, WIS: { score: 13 }, CHA: { score: 5 } },
    attacks: [
      { id: 'atk-cock-1', name: 'Bite', attackBonus: 3, damage: '1d4 + 1', damageType: 'Piercing', range: '5 ft Melee', notes: 'DC 11 CON save or begins turning to stone (Petrified for 24 hours on fail).' }
    ],
    classFeatures: [
      { id: 'feat-cock-1', name: 'Petrifying Touch', source: 'Monstrosity Trait', description: 'Target hit by bite must succeed DC 11 CON save or be Restrained as it turns to stone. Repeated fail = Petrified.' }
    ]
  }
] as Partial<CharacterData>[]).map(m => ({
  ...DEFAULT_MONSTER_FIELDS,
  ...m,
  challengeRating: m.challengeRating || m.subclass?.replace(/^CR\\s*/i, '') || '1',
  portraitUrl: m.portraitUrl || getMonsterPortraitUrl(m.name || 'Monster', m.id)
} as CharacterData));
