export interface CombatRule {
  id: string;
  category: 'Action' | 'Bonus Action' | 'Reaction' | 'Maneuver' | 'Condition';
  name: string;
  summary: string;
  description: string;
}

export const COMBAT_CHEAT_SHEET: CombatRule[] = [
  // ACTIONS
  {
    id: 'action-attack',
    category: 'Action',
    name: 'Attack',
    summary: 'Make one melee or ranged attack with a weapon or unarmed strike.',
    description: 'With this action, you make one melee or ranged attack. Certain features, like the Extra Attack feature, allow you to make more than one attack with this action.'
  },
  {
    id: 'action-cast-spell',
    category: 'Action',
    name: 'Cast a Spell',
    summary: 'Cast a spell with a casting time of 1 action.',
    description: 'Each spell has a casting time, which specifies whether the caster must use an action, a reaction, minutes, or hours to cast the spell.'
  },
  {
    id: 'action-dash',
    category: 'Action',
    name: 'Dash',
    summary: 'Gain extra movement for the current turn equal to your speed.',
    description: 'When you take the Dash action, you gain extra movement for the current turn equal to your speed, after applying any modifiers.'
  },
  {
    id: 'action-disengage',
    category: 'Action',
    name: 'Disengage',
    summary: 'Your movement doesn’t provoke opportunity attacks for the rest of turn.',
    description: 'If you take the Disengage action, your movement doesn’t provoke opportunity attacks for the rest of the turn.'
  },
  {
    id: 'action-dodge',
    category: 'Action',
    name: 'Dodge',
    summary: 'Attacks against you have disadvantage if you can see attacker.',
    description: 'Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make DEX saving throws with advantage. You lose this benefit if you are incapacitated or your speed drops to 0.'
  },
  {
    id: 'action-help',
    category: 'Action',
    name: 'Help',
    summary: 'Give an ally advantage on an ability check or attack roll.',
    description: 'You lend your aid to another creature in the completion of a task, giving them advantage on the next ability check or attack roll before your next turn.'
  },
  {
    id: 'action-hide',
    category: 'Action',
    name: 'Hide',
    summary: 'Make a Stealth check to become hidden from enemies.',
    description: 'When you take the Hide action, you make a DEX (Stealth) check in an attempt to hide, following the rules for hiding.'
  },
  {
    id: 'action-ready',
    category: 'Action',
    name: 'Ready',
    summary: 'Choose a trigger and a response to act out as a Reaction.',
    description: 'You decide what perceivable circumstance will trigger your reaction. Then, you choose the action you will take in response to that trigger.'
  },
  {
    id: 'action-search',
    category: 'Action',
    name: 'Search',
    summary: 'Devote your attention to finding something (Perception / Investigation).',
    description: 'Depending on what you are searching for, the DM might have you make a Wisdom (Perception) check or an Intelligence (Investigation) check.'
  },
  {
    id: 'action-use-object',
    category: 'Action',
    name: 'Use an Object',
    summary: 'Interact with a second object or complex item during combat.',
    description: 'You normally interact with an object for free during your turn (drawing a sword). When an object requires your action for its use, you take the Use an Object action.'
  },
  {
    id: 'action-grapple',
    category: 'Action',
    name: 'Grapple (Special Attack)',
    summary: 'STR (Athletics) vs STR (Athletics) or DEX (Acrobatics) to grab a target.',
    description: 'When you want to grab a creature or wrestle with it, you can use the Attack action to make a special melee attack: a grapple.'
  },
  {
    id: 'action-shove',
    category: 'Action',
    name: 'Shove (Special Attack)',
    summary: 'Knock a creature prone or push it 5 feet away.',
    description: 'Using the Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it 5 feet away from you.'
  },

  // BONUS ACTIONS
  {
    id: 'bonus-offhand',
    category: 'Bonus Action',
    name: 'Two-Weapon Fighting',
    summary: 'When holding two light weapons, strike with offhand weapon as a bonus action.',
    description: 'When you take the Attack action and attack with a light melee weapon, you can use a bonus action to attack with a different light melee weapon in your other hand. Do not add ability modifier to damage unless negative.'
  },
  {
    id: 'bonus-spell',
    category: 'Bonus Action',
    name: 'Cast Bonus Action Spell',
    summary: 'Cast a spell with a casting time of 1 bonus action (e.g. Healing Word).',
    description: 'You can’t cast another spell on the same turn, except for a cantrip with a casting time of 1 action.'
  },

  // REACTIONS
  {
    id: 'reaction-opportunity',
    category: 'Reaction',
    name: 'Opportunity Attack',
    summary: 'Melee strike when a hostile creature leaves your reach.',
    description: 'You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature.'
  },

  // MANEUVERS
  {
    id: 'maneuver-riposte',
    category: 'Maneuver',
    name: 'Riposte',
    summary: 'When a creature misses you with melee attack, use reaction to attack them.',
    description: 'When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. On hit, add the superiority die to the attack’s damage roll.'
  },
  {
    id: 'maneuver-trip',
    category: 'Maneuver',
    name: 'Trip Attack',
    summary: 'Add superiority die to weapon hit and force STR save or fall Prone.',
    description: 'When you hit a creature with a weapon attack, you can expend one superiority die to add it to the damage roll. If the target is Large or smaller, it must make a STR save or be knocked Prone.'
  },
  {
    id: 'maneuver-precision',
    category: 'Maneuver',
    name: 'Precision Attack',
    summary: 'Add superiority die to your weapon attack roll before or after rolling.',
    description: 'When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll.'
  },
  {
    id: 'maneuver-menacing',
    category: 'Maneuver',
    name: 'Menacing Attack',
    summary: 'Add superiority die to damage and force WIS save or be Frightened.',
    description: 'When you hit a creature with a weapon attack, you can expend one superiority die to add it to damage. Target must make a WIS save or be Frightened of you until the end of your next turn.'
  },
  {
    id: 'maneuver-feinting',
    category: 'Maneuver',
    name: 'Feinting Attack',
    summary: 'Bonus action to feint against a creature within 5 ft to gain Advantage.',
    description: 'Choose a creature within 5 feet. Gain advantage on your next attack roll against that creature this turn, and add superiority die to damage.'
  },
  {
    id: 'maneuver-disarming',
    category: 'Maneuver',
    name: 'Disarming Attack',
    summary: 'Add superiority die to damage and force STR save or drop held object.',
    description: 'When you hit a creature with a weapon attack, expend one superiority die to attempt to disarm the target. Target makes a STR save or drops one object it is holding of your choice.'
  },
  {
    id: 'maneuver-parry',
    category: 'Maneuver',
    name: 'Parry',
    summary: 'When damaged by melee attack, reduce damage by Superiority Die + DEX mod.',
    description: 'When another creature damages you with a melee attack, you can use your reaction and expend one superiority die to reduce the damage by the die roll + your DEX modifier.'
  },

  // CONDITIONS
  {
    id: 'cond-blinded',
    category: 'Condition',
    name: 'Blinded',
    summary: 'Auto-fail sight checks. Attacks against have Advantage; your attacks have Disadvantage.',
    description: 'A blinded creature can’t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage.'
  },
  {
    id: 'cond-charmed',
    category: 'Condition',
    name: 'Charmed',
    summary: 'Can’t attack the charmer. Charmer has advantage on social checks against you.',
    description: 'A charmed creature can’t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.'
  },
  {
    id: 'cond-frightened',
    category: 'Condition',
    name: 'Frightened',
    summary: 'Disadvantage on ability checks/attacks while source is in line of sight. Can’t move closer.',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can’t willingly move closer to the source of its fear.'
  },
  {
    id: 'cond-grappled',
    category: 'Condition',
    name: 'Grappled',
    summary: 'Speed becomes 0 and cannot benefit from any speed bonuses.',
    description: 'A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or moved out of reach.'
  },
  {
    id: 'cond-incapacitated',
    category: 'Condition',
    name: 'Incapacitated',
    summary: 'Cannot take Actions or Reactions.',
    description: 'An incapacitated creature can’t take actions or reactions.'
  },
  {
    id: 'cond-invisible',
    category: 'Condition',
    name: 'Invisible',
    summary: 'Impossible to see without magic. Attacks against have Disadvantage; your attacks have Advantage.',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. Attack rolls against the creature have disadvantage, and the creature’s attack rolls have advantage.'
  },
  {
    id: 'cond-paralyzed',
    category: 'Condition',
    name: 'Paralyzed',
    summary: 'Incapacitated, can’t move or speak. Auto-fail STR/DEX saves. Melee hits within 5ft are Crit!',
    description: 'A paralyzed creature is incapacitated and can’t move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage, and any attack that hits the creature is a critical hit if the attacker is within 5 feet.'
  },
  {
    id: 'cond-poisoned',
    category: 'Condition',
    name: 'Poisoned',
    summary: 'Disadvantage on attack rolls and ability checks.',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.'
  },
  {
    id: 'cond-prone',
    category: 'Condition',
    name: 'Prone',
    summary: 'Can only crawl. Disadvantage on your attacks. Melee attacks against have Advantage, Ranged Disadvantage.',
    description: 'A prone creature’s only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet. Otherwise, the attack roll has disadvantage.'
  },
  {
    id: 'cond-stunned',
    category: 'Condition',
    name: 'Stunned',
    summary: 'Incapacitated, can’t move, speak falteringly. Auto-fail STR/DEX saves. Attacks against have Advantage.',
    description: 'A stunned creature is incapacitated, can’t move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.'
  },
  {
    id: 'cond-unconscious',
    category: 'Condition',
    name: 'Unconscious',
    summary: 'Incapacitated, drops held items, falls Prone. Auto-fail STR/DEX saves. Melee hits within 5ft are Crit.',
    description: 'An unconscious creature is incapacitated, can’t move or speak, and is unaware of its surroundings. The creature drops whatever it’s holding and falls prone. Automatically fails Strength and Dexterity saves. Hits within 5ft are critical hits.'
  }
];
