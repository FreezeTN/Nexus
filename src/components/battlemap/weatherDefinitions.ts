export type WeatherEffectType =
  | 'none'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'blizzard'
  | 'hail'
  | 'wind'
  | 'sandstorm'
  | 'mist'
  | 'embers'
  | 'ashfall'
  | 'acid_rain'
  | 'blood_rain'
  | 'arcane'
  | 'sunbeams';

export interface WeatherDefinition {
  id: WeatherEffectType;
  name: string;
  icon: string;
  category: 'Atmospheric' | 'Precipitation' | 'Severe Storm' | 'Planar & Supernatural';
  tagline: string;
  tacticalRules: string;
  disadvantageRangedAttacks?: boolean;
  disadvantageHearingPerception?: boolean;
  extinguishesFlames?: boolean;
  heavyPrecipitation?: boolean;
  extremeCold?: boolean;
  extremeHeat?: boolean;
  difficultTerrainGround?: boolean;
  forcesFlyLandingOrDC?: boolean;
  concentrationDC?: string;
  maxVisibilityFeet?: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const WEATHER_DEFINITIONS: Record<WeatherEffectType, WeatherDefinition> = {
  none: {
    id: 'none',
    name: 'Clear Weather',
    icon: '☀️',
    category: 'Atmospheric',
    tagline: 'Calm, clear atmospheric conditions.',
    tacticalRules: 'Standard visibility, ranged attacks, and movement rules apply.',
    color: '#f59e0b',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-700/50',
    badgeText: 'text-amber-300'
  },
  rain: {
    id: 'rain',
    name: 'Steady Rain',
    icon: '🌧️',
    category: 'Precipitation',
    tagline: 'Moderate rainfall with light surface slickness.',
    tacticalRules: 'Light obscurement beyond 60 ft. Open exposed torches have disadvantage to remain ignited during continuous showers.',
    maxVisibilityFeet: 120,
    color: '#38bdf8',
    badgeBg: 'bg-sky-950/60',
    badgeBorder: 'border-sky-500/50',
    badgeText: 'text-sky-300'
  },
  storm: {
    id: 'storm',
    name: 'Thunderstorm & Tempest',
    icon: '⛈️',
    category: 'Severe Storm',
    tagline: 'Heavy driving precipitation, gale gusts, and crackling lightning.',
    tacticalRules: '5e RAW: Heavy precipitation & gale. Disadvantage on ranged weapon attacks and Wisdom (Perception) checks relying on hearing or sight. Automatically extinguishes open flames (torches, campfires). Visibility capped at 60 ft.',
    disadvantageRangedAttacks: true,
    disadvantageHearingPerception: true,
    extinguishesFlames: true,
    heavyPrecipitation: true,
    maxVisibilityFeet: 60,
    color: '#818cf8',
    badgeBg: 'bg-indigo-950/80',
    badgeBorder: 'border-indigo-500/60',
    badgeText: 'text-indigo-200'
  },
  snow: {
    id: 'snow',
    name: 'Gentle Snowfall',
    icon: '🌨️',
    category: 'Precipitation',
    tagline: 'Soft, silent snowfall dusting the battlefield.',
    tacticalRules: 'Fresh tracks remain clearly visible. Unprotected creatures face cold climate exposure rules without cold weather clothing.',
    color: '#e0e7ff',
    badgeBg: 'bg-slate-900/70',
    badgeBorder: 'border-slate-500/50',
    badgeText: 'text-slate-200'
  },
  blizzard: {
    id: 'blizzard',
    name: 'Blizzard & Whiteout',
    icon: '❄️',
    category: 'Severe Storm',
    tagline: 'Fierce sub-zero gale howling with blinding snow squalls.',
    tacticalRules: '5e RAW: Extreme Cold & High Wind. Visibility capped at 30 ft (whiteout heavy obscurement beyond). Disadvantage on ranged weapon attacks and hearing Perception checks. Open flames blown out immediately. DC 10 Constitution saving throw each hour or suffer Exhaustion without cold gear. Tracks erased in 1d4 rounds.',
    disadvantageRangedAttacks: true,
    disadvantageHearingPerception: true,
    extinguishesFlames: true,
    extremeCold: true,
    maxVisibilityFeet: 30,
    color: '#67e8f9',
    badgeBg: 'bg-cyan-950/90',
    badgeBorder: 'border-cyan-400/60',
    badgeText: 'text-cyan-200'
  },
  hail: {
    id: 'hail',
    name: 'Hail & Sleet Storm',
    icon: '🧊',
    category: 'Severe Storm',
    tagline: 'Pelting ice stones and razor-sharp sleet needles.',
    tacticalRules: '5e RAW: The ground turns to slippery difficult terrain. Disadvantage on ranged weapon attacks and hearing Perception checks. Extinguishes open flames. Spellcasters concentrating or casting must succeed on a DC 10 Constitution check.',
    disadvantageRangedAttacks: true,
    disadvantageHearingPerception: true,
    extinguishesFlames: true,
    difficultTerrainGround: true,
    concentrationDC: 'DC 10',
    color: '#a5f3fc',
    badgeBg: 'bg-teal-950/80',
    badgeBorder: 'border-teal-500/60',
    badgeText: 'text-teal-200'
  },
  wind: {
    id: 'wind',
    name: 'Strong Gale Wind',
    icon: '💨',
    category: 'Atmospheric',
    tagline: 'Powerful gale winds roaring across the grid (20+ mph).',
    tacticalRules: '5e RAW: Disadvantage on ranged weapon attacks and hearing-based Perception checks. Extinguishes torches and open flames. Immediately disperses fog, clouds, and vapors. Flying creatures must land at end of turn or succeed on a DC 10 Strength check to move against the wind.',
    disadvantageRangedAttacks: true,
    disadvantageHearingPerception: true,
    extinguishesFlames: true,
    forcesFlyLandingOrDC: true,
    color: '#cbd5e1',
    badgeBg: 'bg-stone-900/80',
    badgeBorder: 'border-stone-500/50',
    badgeText: 'text-stone-200'
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Desert Sandstorm',
    icon: '🌪️',
    category: 'Severe Storm',
    tagline: 'Blinding desert gale churning choking grit and amber dust.',
    tacticalRules: '5e/3.5e RAW: Visibility capped at 30 ft (heavy obscurement beyond). Disadvantage on Perception checks and ranged attacks. Extinguishes open flames. Unprotected eyes risk temporary blindness without goggles or wraps.',
    disadvantageRangedAttacks: true,
    disadvantageHearingPerception: true,
    extinguishesFlames: true,
    maxVisibilityFeet: 30,
    color: '#f59e0b',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-600/60',
    badgeText: 'text-amber-200'
  },
  mist: {
    id: 'mist',
    name: 'Creeping Mist & Fog',
    icon: '🌫️',
    category: 'Atmospheric',
    tagline: 'Dense, supernatural fog clinging low to the floor.',
    tacticalRules: '5e RAW: Light to heavy obscurement. Visibility capped at 35 ft. Ranged attacks beyond 30 ft suffer disadvantage due to reduced visibility. Can be cleared by moderate or strong wind.',
    maxVisibilityFeet: 35,
    color: '#e7e5e4',
    badgeBg: 'bg-stone-900/80',
    badgeBorder: 'border-stone-600/50',
    badgeText: 'text-stone-300'
  },
  embers: {
    id: 'embers',
    name: 'Volcanic Embers',
    icon: '🔥',
    category: 'Planar & Supernatural',
    tagline: 'Rising superheated sparks, magma cinder drafts, and smoke.',
    tacticalRules: 'Extreme Heat & Thermal Hazard: Heavy armor wearers face Constitution saves vs Exhaustion after prolonged exposure. Flammable objects risk catching fire upon prolonged ground contact.',
    extremeHeat: true,
    color: '#fb923c',
    badgeBg: 'bg-orange-950/80',
    badgeBorder: 'border-orange-500/60',
    badgeText: 'text-orange-200'
  },
  ashfall: {
    id: 'ashfall',
    name: 'Choking Ashfall',
    icon: '🌋',
    category: 'Planar & Supernatural',
    tagline: 'Silent, heavy shower of volcanic ash and dark soot.',
    tacticalRules: 'Heavily obscured sky. Visibility capped at 40 ft by falling ash. Breathing without wet cloth protection requires DC 10 Constitution saves or suffer coughing and choking. Ground is dusted in slick gray ash.',
    maxVisibilityFeet: 40,
    color: '#a8a29e',
    badgeBg: 'bg-stone-950/90',
    badgeBorder: 'border-stone-700/60',
    badgeText: 'text-stone-300'
  },
  acid_rain: {
    id: 'acid_rain',
    name: 'Caustic Acid Rain',
    icon: '🧪',
    category: 'Planar & Supernatural',
    tagline: 'Sizzling chartreuse droplets hissing upon impact.',
    tacticalRules: 'Planar Hazard: Exposed nonmagical leather and iron slowly corrode. Spellcasters unsheltered must make a DC 10 Constitution check at the start of their turn to maintain concentration.',
    concentrationDC: 'DC 10',
    color: '#84cc16',
    badgeBg: 'bg-lime-950/80',
    badgeBorder: 'border-lime-500/60',
    badgeText: 'text-lime-200'
  },
  blood_rain: {
    id: 'blood_rain',
    name: 'Crimson Blood Rain',
    icon: '🩸',
    category: 'Planar & Supernatural',
    tagline: 'Dread downpour of thick, warm crimson blood and miasma.',
    tacticalRules: 'Domain of Dread Hazard: Necrotic energies swell while radiant spells suffer -1 healing per die. Non-undead creatures exposed must make a DC 10 Wisdom saving throw or succumb to dread.',
    color: '#f43f5e',
    badgeBg: 'bg-rose-950/90',
    badgeBorder: 'border-rose-600/60',
    badgeText: 'text-rose-200'
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane Ley-Line Surge',
    icon: '🔮',
    category: 'Planar & Supernatural',
    tagline: 'Drifting prismatic orbs and glowing ethereal mana sparks.',
    tacticalRules: 'Wild Magic Flux: Natural magical aura. Whenever a spell attack roll results in a natural 1, roll on the Wild Magic Surge table.',
    color: '#c084fc',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-500/60',
    badgeText: 'text-purple-200'
  },
  sunbeams: {
    id: 'sunbeams',
    name: 'Radiant Sunbeams',
    icon: '✨',
    category: 'Atmospheric',
    tagline: 'Piercing golden sun shafts and sparkling celestial dust.',
    tacticalRules: 'Blessed Sunlight: Counted as natural daylight. Automatically dispels magical darkness created by 2nd-level spells or lower. Triggers Sunlight Hypersensitivity on vampires, drow, and wraiths.',
    color: '#fde047',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-yellow-500/60',
    badgeText: 'text-yellow-200'
  }
};
