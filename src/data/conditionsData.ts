export interface ConditionInfo {
  id: string;
  name: string;
  summary: string;
  description: string;
  colorClass: string;
  badgeClass: string;
}

export const DND_CONDITIONS: ConditionInfo[] = [
  {
    id: 'blinded',
    name: 'Blinded',
    summary: 'Auto-fail sight checks. Attack rolls against you have advantage; your attack rolls have disadvantage.',
    description: 'A blinded creature can’t see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage.',
    colorClass: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
    badgeClass: 'bg-amber-900/80 text-amber-200 border-amber-600/50'
  },
  {
    id: 'charmed',
    name: 'Charmed',
    summary: 'Can’t attack charmer. Charmer has advantage on social ability checks against you.',
    description: 'A charmed creature can’t attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.',
    colorClass: 'border-pink-500/50 bg-pink-950/30 text-pink-300',
    badgeClass: 'bg-pink-900/80 text-pink-200 border-pink-600/50'
  },
  {
    id: 'deafened',
    name: 'Deafened',
    summary: 'Auto-fail hearing checks.',
    description: 'A deafened creature can’t hear and automatically fails any ability check that requires hearing.',
    colorClass: 'border-stone-500/50 bg-stone-900/40 text-stone-300',
    badgeClass: 'bg-stone-800 text-stone-200 border-stone-600/50'
  },
  {
    id: 'frightened',
    name: 'Frightened',
    summary: 'Disadvantage on ability checks & attacks while source of fear is in line of sight. Can’t move closer.',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can’t willingly move closer to the source of its fear.',
    colorClass: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
    badgeClass: 'bg-purple-900/80 text-purple-200 border-purple-600/50'
  },
  {
    id: 'grappled',
    name: 'Grappled',
    summary: 'Speed becomes 0, can’t benefit from speed bonuses.',
    description: 'A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from reach.',
    colorClass: 'border-orange-500/50 bg-orange-950/30 text-orange-300',
    badgeClass: 'bg-orange-900/80 text-orange-200 border-orange-600/50'
  },
  {
    id: 'incapacitated',
    name: 'Incapacitated',
    summary: 'Can’t take actions or reactions.',
    description: 'An incapacitated creature can’t take actions or reactions.',
    colorClass: 'border-rose-600/60 bg-rose-950/30 text-rose-300',
    badgeClass: 'bg-rose-900/80 text-rose-200 border-rose-600/50'
  },
  {
    id: 'invisible',
    name: 'Invisible',
    summary: 'Impossible to see without magic/special senses. Your attacks have advantage; enemy attacks have disadvantage.',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense. Attack rolls against the creature have disadvantage, and the creature’s attack rolls have advantage.',
    colorClass: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300',
    badgeClass: 'bg-cyan-900/80 text-cyan-200 border-cyan-600/50'
  },
  {
    id: 'paralyzed',
    name: 'Paralyzed',
    summary: 'Incapacitated, can’t move/speak. Auto-fail STR/DEX saves. Attacks against you have advantage; melee crits automatically.',
    description: 'A paralyzed creature is incapacitated and can’t move or speak. Automatically fails STR and DEX saving throws. Attack rolls against the creature have advantage, and any attack that hits within 5 feet is a critical hit.',
    colorClass: 'border-red-600/60 bg-red-950/40 text-red-300',
    badgeClass: 'bg-red-900/80 text-red-200 border-red-600/50'
  },
  {
    id: 'petrified',
    name: 'Petrified',
    summary: 'Transformed into solid stone. Incapacitated, unaware, weight × 10. Resistance to all damage.',
    description: 'A petrified creature is transformed, along with nonmagical objects worn, into solid inanimate substance. Incapacitated, unaware of surroundings, resistance to all damage, immune to poison/disease.',
    colorClass: 'border-stone-600 bg-stone-950 text-stone-300',
    badgeClass: 'bg-stone-800 text-stone-100 border-stone-500'
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    summary: 'Disadvantage on attack rolls and ability checks.',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
    colorClass: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
    badgeClass: 'bg-emerald-900/80 text-emerald-200 border-emerald-600/50'
  },
  {
    id: 'prone',
    name: 'Prone',
    summary: 'Movement costs double. Disadvantage on your attack rolls. Attacks against you within 5ft have advantage, ranged have disadvantage.',
    description: 'A prone creature’s only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. Attack rolls against the creature have advantage if the attacker is within 5 feet, otherwise disadvantage.',
    colorClass: 'border-amber-600/50 bg-amber-950/30 text-amber-200',
    badgeClass: 'bg-amber-900/80 text-amber-200 border-amber-600/50'
  },
  {
    id: 'restrained',
    name: 'Restrained',
    summary: 'Speed 0. Attack rolls against you have advantage; your attacks have disadvantage. Disadvantage on DEX saves.',
    description: 'A restrained creature’s speed becomes 0. Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage. The creature has disadvantage on DEX saving throws.',
    colorClass: 'border-yellow-600/50 bg-yellow-950/30 text-yellow-200',
    badgeClass: 'bg-yellow-900/80 text-yellow-200 border-yellow-600/50'
  },
  {
    id: 'stunned',
    name: 'Stunned',
    summary: 'Incapacitated, can’t move, speak falteringly. Auto-fail STR/DEX saves. Enemy attacks have advantage.',
    description: 'A stunned creature is incapacitated, can’t move, and can speak only falteringly. Automatically fails STR and DEX saving throws. Attack rolls against the creature have advantage.',
    colorClass: 'border-blue-600/60 bg-blue-950/40 text-blue-300',
    badgeClass: 'bg-blue-900/80 text-blue-200 border-blue-600/50'
  },
  {
    id: 'unconscious',
    name: 'Unconscious',
    summary: 'Incapacitated, drops held items, falls prone, auto-fail STR/DEX saves. Attacks have advantage, melee hits within 5ft are CRITS.',
    description: 'An unconscious creature is incapacitated, can’t move or speak, and is unaware of surroundings. Drops held items and falls prone. Auto-fails STR and DEX saves. Attacks against it have advantage, and hits within 5 ft are critical hits.',
    colorClass: 'border-red-700 bg-red-950 text-red-200',
    badgeClass: 'bg-red-950 text-red-200 border-red-500 font-bold'
  }
];

export const EXHAUSTION_LEVELS = [
  { level: 0, effect: 'Normal (No Exhaustion penalty)' },
  { level: 1, effect: 'Disadvantage on Ability Checks' },
  { level: 2, effect: 'Speed halved' },
  { level: 3, effect: 'Disadvantage on Attack rolls and Saving Throws' },
  { level: 4, effect: 'Hit point maximum halved' },
  { level: 5, effect: 'Speed reduced to 0' },
  { level: 6, effect: 'Death' }
];
