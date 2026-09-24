import { WeatherEffectType } from './battlemapTypes';
import { Combatant } from '../combat/encounter/encounterTypes';

export type WeatherTriggerType = 'spell' | 'monster_regional' | 'monster_lair' | 'item' | 'legendary';

export interface WeatherTrigger {
  id: string;
  name: string;
  type: WeatherTriggerType;
  weatherEffect: WeatherEffectType;
  description: string;
  source: string;
  icon: string;
  suggestedDuration?: string;
  isControlWeatherMultiChoice?: boolean;
}

export const WEATHER_ABILITY_TRIGGERS: WeatherTrigger[] = [
  // --- RAW SPELLS (5e PHB / XGtE) ---
  {
    id: 'spell-control-weather',
    name: 'Control Weather',
    type: 'spell',
    weatherEffect: 'storm',
    description: 'You take control of the weather within 5 miles for up to 8 hours, shifting precipitation, temperature, and wind to your chosen climate (5e PHB p. 228).',
    source: '5e PHB p. 228 (8th Level Transmutation)',
    icon: '🌪️',
    isControlWeatherMultiChoice: true,
    suggestedDuration: '8 Hours'
  },
  {
    id: 'spell-call-lightning',
    name: 'Call Lightning',
    type: 'spell',
    weatherEffect: 'storm',
    description: 'A storm cloud forms in a 60-foot radius. If cast outdoors in an existing storm, damage increases by +1d10! (5e PHB p. 220).',
    source: '5e PHB p. 220 (3rd Level Conjuration)',
    icon: '⚡',
    suggestedDuration: '10 Minutes'
  },
  {
    id: 'spell-storm-of-vengeance',
    name: 'Storm of Vengeance',
    type: 'spell',
    weatherEffect: 'acid_rain',
    description: 'An apocalyptic churning cloud forms across a 360-foot radius, raining acid, lightning, hailstones, and freezing blizzards across subsequent rounds (5e PHB p. 279).',
    source: '5e PHB p. 279 (9th Level Conjuration)',
    icon: '🌩️',
    suggestedDuration: '1 Minute'
  },
  {
    id: 'spell-sleet-storm',
    name: 'Sleet Storm',
    type: 'spell',
    weatherEffect: 'hail',
    description: 'Freezing rain, sleet, and howling winds fall in a 40-foot-tall cylinder with a 40-foot radius, heavily obscuring sight and extinguishing open flames (5e PHB p. 276).',
    source: '5e PHB p. 276 (3rd Level Conjuration)',
    icon: '🌨️',
    suggestedDuration: '1 Minute'
  },
  {
    id: 'spell-fog-cloud',
    name: 'Fog Cloud',
    type: 'spell',
    weatherEffect: 'mist',
    description: 'Creates a 20-foot-radius sphere of dense, rolling fog that heavily obscures the area beyond 5 feet (5e PHB p. 243).',
    source: '5e PHB p. 243 (1st Level Conjuration)',
    icon: '🌫️',
    suggestedDuration: '1 Hour'
  },
  {
    id: 'spell-incendiary-cloud',
    name: 'Incendiary Cloud',
    type: 'spell',
    weatherEffect: 'ashfall',
    description: 'A swirling cloud of white-hot embers, thick black smoke, and burning ash heavily obscures vision and inflicts massive fire damage (5e PHB p. 253).',
    source: '5e PHB p. 253 (8th Level Conjuration)',
    icon: '🌋',
    suggestedDuration: '1 Minute'
  },
  {
    id: 'spell-whirlwind',
    name: 'Whirlwind',
    type: 'spell',
    weatherEffect: 'sandstorm',
    description: 'A howling cyclone of dust, grit, and violent gale winds sweeps across the battlefield, blinding creatures and flinging debris (5e XGtE p. 171).',
    source: '5e XGtE p. 171 (7th Level Evocation)',
    icon: '🏜️',
    suggestedDuration: '1 Minute'
  },
  {
    id: 'spell-gust-of-wind',
    name: 'Gust of Wind',
    type: 'spell',
    weatherEffect: 'wind',
    description: 'A line of strong wind blasts forth, snuffing unprotected torches, dispersing vapor, and impeding movement (5e PHB p. 248).',
    source: '5e PHB p. 248 (2nd Level Evocation)',
    icon: '💨',
    suggestedDuration: '1 Minute'
  },
  {
    id: 'spell-dawn',
    name: 'Dawn',
    type: 'spell',
    weatherEffect: 'sunbeams',
    description: 'A cylinder of gleaming golden radiant sunlight pierces through clouds and mist, illuminating the area with dawn radiance (5e XGtE p. 153).',
    source: '5e XGtE p. 153 (5th Level Evocation)',
    icon: '☀️',
    suggestedDuration: '1 Minute'
  },

  // --- RAW MONSTER REGIONAL EFFECTS & LAIR ACTIONS (5e MM) ---
  {
    id: 'monster-blue-dragon-storm',
    name: 'Blue Dragon: Tempest Lair Surge',
    type: 'monster_regional',
    weatherEffect: 'storm',
    description: 'Thunderstorms rage incessantly within 6 miles of the adult or ancient blue dragon lair, crackling with atmospheric ozone and lightning (5e MM p. 91).',
    source: '5e MM p. 91 (Regional Effect)',
    icon: '⚡'
  },
  {
    id: 'monster-blue-dragon-sandstorm',
    name: 'Blue Dragon: Desert Dust Devil',
    type: 'monster_lair',
    weatherEffect: 'sandstorm',
    description: 'If nested in arid wastelands or badlands, the blue dragon stirs fierce sandstorms that obscure vision and choke sight beyond 30 ft (5e MM p. 91).',
    source: '5e MM p. 91 (Lair Action)',
    icon: '🏜️'
  },
  {
    id: 'monster-white-dragon-blizzard',
    name: 'White Dragon: Glacial Whiteout',
    type: 'monster_regional',
    weatherEffect: 'blizzard',
    description: 'Freezing fog and driving blizzards rage within 6 miles of the white dragon lair, bringing biting subzero cold and 30-foot visibility caps (5e MM p. 100).',
    source: '5e MM p. 100 (Regional Effect)',
    icon: '❄️'
  },
  {
    id: 'monster-red-dragon-ashfall',
    name: 'Red Dragon: Volcanic Ash Plume',
    type: 'monster_regional',
    weatherEffect: 'ashfall',
    description: 'Small tremors shake the ground and sulfurous clouds of choking ash and glowing cinders drift through the sky within 6 miles of the red dragon lair (5e MM p. 97).',
    source: '5e MM p. 97 (Regional Effect)',
    icon: '🌋'
  },
  {
    id: 'monster-green-dragon-mist',
    name: 'Green Dragon: Verdant Shroud',
    type: 'monster_regional',
    weatherEffect: 'mist',
    description: 'Thick, unnatural fog clings to the forest floor and canopy within 1 mile of the green dragon lair, masking predators and baffling compasses (5e MM p. 94).',
    source: '5e MM p. 94 (Regional Effect)',
    icon: '🌲'
  },
  {
    id: 'monster-mummy-lord-sandstorm',
    name: 'Mummy Lord: Tomb Sandstorm',
    type: 'monster_lair',
    weatherEffect: 'sandstorm',
    description: 'A swirling sandstorm erupts through the pyramid or burial complex as a lair action, scouring intruders with blinding grit (5e MM p. 229).',
    source: '5e MM p. 229 (Lair Action)',
    icon: '🏺'
  },
  {
    id: 'monster-vampire-creeping-fog',
    name: 'Vampire: Creeping Fog',
    type: 'monster_regional',
    weatherEffect: 'mist',
    description: 'A heavy, clinging fog hangs perpetually over the grounds within 1 mile of the vampire castle or crypt, blocking natural sunlight (5e MM p. 297).',
    source: '5e MM p. 297 (Regional Effect)',
    icon: '🦇'
  },
  {
    id: 'monster-storm-giant-tempest',
    name: 'Storm Giant: Tempest Dominance',
    type: 'legendary',
    weatherEffect: 'storm',
    description: 'The giant commands the troposphere, summoning gale winds, torrential rains, and lightning strikes as an innate command over the elements (5e MM p. 156).',
    source: '5e MM p. 156 (Innate Weather Magic)',
    icon: '🌩️'
  }
];

/**
 * Searches for an automated weather trigger given a spell name.
 */
export function findWeatherTriggerForSpell(spellName: string): WeatherTrigger | null {
  if (!spellName) return null;
  const lower = spellName.toLowerCase().trim();

  if (lower.includes('control weather')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-control-weather') || null;
  }
  if (lower.includes('call lightning')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-call-lightning') || null;
  }
  if (lower.includes('storm of vengeance')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-storm-of-vengeance') || null;
  }
  if (lower.includes('sleet storm')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-sleet-storm') || null;
  }
  if (lower.includes('fog cloud')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-fog-cloud') || null;
  }
  if (lower.includes('incendiary cloud')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-incendiary-cloud') || null;
  }
  if (lower.includes('whirlwind')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-whirlwind') || null;
  }
  if (lower.includes('gust of wind') || lower.includes('wind wall')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-gust-of-wind') || null;
  }
  if (lower.includes('dawn') || lower.includes('sunbeam') || lower.includes('sunburst')) {
    return WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'spell-dawn') || null;
  }

  return null;
}

/**
 * Checks combatants in encounter to determine which monster lair / regional triggers apply.
 */
export function getMonsterWeatherTriggers(combatants: Combatant[]): WeatherTrigger[] {
  if (!combatants || combatants.length === 0) return [];
  const triggers: WeatherTrigger[] = [];
  const names = combatants.map(c => (c.name || '').toLowerCase());

  const hasName = (q: string) => names.some(n => n.includes(q));

  if (hasName('blue dragon')) {
    const t1 = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-blue-dragon-storm');
    const t2 = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-blue-dragon-sandstorm');
    if (t1) triggers.push(t1);
    if (t2) triggers.push(t2);
  }

  if (hasName('white dragon')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-white-dragon-blizzard');
    if (t) triggers.push(t);
  }

  if (hasName('red dragon')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-red-dragon-ashfall');
    if (t) triggers.push(t);
  }

  if (hasName('green dragon')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-green-dragon-mist');
    if (t) triggers.push(t);
  }

  if (hasName('mummy lord') || hasName('mummy')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-mummy-lord-sandstorm');
    if (t) triggers.push(t);
  }

  if (hasName('vampire')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-vampire-creeping-fog');
    if (t) triggers.push(t);
  }

  if (hasName('storm giant')) {
    const t = WEATHER_ABILITY_TRIGGERS.find(t => t.id === 'monster-storm-giant-tempest');
    if (t) triggers.push(t);
  }

  return triggers;
}
