export interface DiceSkin {
  id: string;
  name: string;
  category: 'crystalline' | 'resin' | 'gothic' | 'elemental' | 'classic';
  requiredTier: 'free' | 'hero' | 'guild';
  description: string;
  previewBg: string;
  textColor: string;
  ambientGlow: string;
  badgeClass: string;
  cardClass: string;
  numberClass: string;
  particleEffect?: boolean;
  specialNat20Icon?: 'moon' | 'lightning' | 'crown' | 'sparkle';
  specialNat1Icon?: 'skull' | 'fumble';
  filigreeOverlay?: 'silver_crystal' | 'gothic_cage' | 'chrome_prism' | 'none';
  materialType?: 'resin_swirl' | 'crystalline_glow' | 'stardust_nebula' | 'marble_noir' | 'metallic' | 'elemental';
}

export const DICE_SKINS: DiceSkin[] = [
  {
    id: 'lunar_prism',
    name: 'Celestial Moonstone',
    category: 'crystalline',
    requiredTier: 'free',
    description: 'Crystalline azure facets in silver filigree with a glowing crescent moon crest on Nat 20.',
    previewBg: 'from-cyan-950 via-teal-900 to-slate-950 border-cyan-400/80',
    textColor: 'text-cyan-100',
    ambientGlow: 'bg-gradient-to-r from-cyan-500/30 via-teal-400/30 to-blue-600/30',
    badgeClass: 'bg-cyan-950 text-cyan-200 border-cyan-400/70',
    cardClass: 'bg-gradient-to-br from-cyan-950 via-teal-950 to-slate-950 border-2 border-cyan-400 text-cyan-100 shadow-cyan-950/80 ring-1 ring-cyan-400/50',
    numberClass: 'text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]',
    particleEffect: true,
    specialNat20Icon: 'moon',
    filigreeOverlay: 'silver_crystal',
    materialType: 'crystalline_glow'
  },
  {
    id: 'oceanic_resin',
    name: 'Oceanic Abyss',
    category: 'resin',
    requiredTier: 'free',
    description: 'Translucent sea-glass cyan and deep sapphire swirl with etched gold foil numbering.',
    previewBg: 'from-sky-700 via-teal-700 to-blue-900 border-teal-300/80',
    textColor: 'text-yellow-100',
    ambientGlow: 'bg-gradient-to-r from-teal-500/30 via-sky-500/30 to-blue-600/30',
    badgeClass: 'bg-teal-950 text-amber-200 border-amber-400/70',
    cardClass: 'bg-gradient-to-br from-sky-800 via-teal-800 to-blue-950 border-2 border-amber-300/80 text-yellow-100 shadow-teal-950/80',
    numberClass: 'text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-black',
    particleEffect: true,
    materialType: 'resin_swirl'
  },
  {
    id: 'neon_noir',
    name: 'Marble & Neon Pink',
    category: 'resin',
    requiredTier: 'free',
    description: 'Monochrome white and black marble swirl with vibrant electric neon pink numerals.',
    previewBg: 'from-stone-900 via-stone-200 to-stone-950 border-pink-500/80',
    textColor: 'text-pink-400',
    ambientGlow: 'bg-gradient-to-r from-pink-500/30 via-stone-500/20 to-pink-600/30',
    badgeClass: 'bg-stone-950 text-pink-300 border-pink-500/70',
    cardClass: 'bg-gradient-to-br from-stone-900 via-stone-800 to-black border-2 border-pink-500 text-pink-300 shadow-pink-950/70 ring-1 ring-pink-500/40',
    numberClass: 'text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.95)]',
    particleEffect: true,
    materialType: 'marble_noir'
  },
  {
    id: 'nebula_swirl',
    name: 'Pearlescent Violet & Teal',
    category: 'resin',
    requiredTier: 'hero',
    description: 'Swirled metallic teal and vivid magenta pearl resin with shimmering gold foil engraving.',
    previewBg: 'from-teal-600 via-purple-700 to-fuchsia-800 border-amber-400/80',
    textColor: 'text-amber-200',
    ambientGlow: 'bg-gradient-to-r from-teal-500/30 via-purple-600/30 to-fuchsia-600/30',
    badgeClass: 'bg-purple-950 text-amber-200 border-amber-400/70',
    cardClass: 'bg-gradient-to-br from-teal-800 via-purple-900 to-fuchsia-950 border-2 border-amber-400/90 text-amber-100 shadow-purple-950/80',
    numberClass: 'text-amber-200 drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)]',
    particleEffect: true,
    materialType: 'resin_swirl'
  },
  {
    id: 'storm_crystal',
    name: 'Radiant Storm Prism',
    category: 'crystalline',
    requiredTier: 'hero',
    description: 'Prismatic chrome facets with refraction rays and a divine lightning wrath crest on Nat 20.',
    previewBg: 'from-slate-700 via-cyan-600 to-blue-800 border-cyan-300',
    textColor: 'text-cyan-100',
    ambientGlow: 'bg-gradient-to-r from-cyan-400/40 via-sky-300/40 to-blue-500/40',
    badgeClass: 'bg-cyan-950 text-cyan-200 border-cyan-300',
    cardClass: 'bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 border-2 border-cyan-300 text-white shadow-cyan-900/80 ring-2 ring-cyan-400/50',
    numberClass: 'text-white drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]',
    particleEffect: true,
    specialNat20Icon: 'lightning',
    filigreeOverlay: 'chrome_prism',
    materialType: 'crystalline_glow'
  },
  {
    id: 'cosmic_galaxy',
    name: 'Cosmic Stardust',
    category: 'crystalline',
    requiredTier: 'guild',
    description: 'Deep celestial nebula galaxy with glittering starfields and glowing rainbow wireframe edges.',
    previewBg: 'from-indigo-950 via-purple-900 to-pink-900 border-purple-400',
    textColor: 'text-pink-200',
    ambientGlow: 'bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40',
    badgeClass: 'bg-purple-950 text-pink-200 border-purple-400/80',
    cardClass: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 border-2 border-pink-400 text-pink-200 shadow-purple-950/90 ring-2 ring-purple-400/60',
    numberClass: 'text-pink-100 drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]',
    particleEffect: true,
    materialType: 'stardust_nebula'
  },
  {
    id: 'eldritch_blood',
    name: 'Eldritch Blood & Silver',
    category: 'gothic',
    requiredTier: 'guild',
    description: 'Gothic silver cage over blood-veined white marble with a skull fumble icon on Nat 1.',
    previewBg: 'from-stone-900 via-red-950 to-stone-950 border-red-500/80',
    textColor: 'text-rose-100',
    ambientGlow: 'bg-gradient-to-r from-red-600/40 via-stone-900/50 to-rose-950/40',
    badgeClass: 'bg-red-950 text-rose-200 border-red-500/70',
    cardClass: 'bg-gradient-to-br from-stone-950 via-red-950 to-black border-2 border-red-500/90 text-rose-100 shadow-red-950/90 ring-1 ring-red-500/50',
    numberClass: 'text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]',
    particleEffect: true,
    specialNat1Icon: 'skull',
    filigreeOverlay: 'gothic_cage',
    materialType: 'metallic'
  },
  {
    id: 'standard',
    name: 'Classic Oak & Brass',
    category: 'classic',
    requiredTier: 'free',
    description: 'Hand-carved polished woodgrain with warm brass edges and antiqued numerals.',
    previewBg: 'from-amber-900 to-stone-900 border-amber-700/60',
    textColor: 'text-amber-200',
    ambientGlow: 'bg-gradient-to-r from-amber-900/20 to-stone-900/30',
    badgeClass: 'bg-stone-800 text-stone-300 border-stone-700',
    cardClass: 'bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 border-2 border-amber-700/60 text-amber-100 shadow-amber-950/60',
    numberClass: 'text-amber-100 font-serif',
    materialType: 'metallic'
  },
  {
    id: 'gold',
    name: 'Gilded Amber',
    category: 'classic',
    requiredTier: 'free',
    description: 'Solid burnished golden alloy with sunburst highlights and deep-relief inking.',
    previewBg: 'from-amber-500 to-yellow-600 border-yellow-300',
    textColor: 'text-stone-950',
    ambientGlow: 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-600/60',
    cardClass: 'bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-800 border-2 border-yellow-300/80 text-stone-950 font-extrabold shadow-yellow-600/50',
    numberClass: 'text-stone-950 font-black',
    specialNat20Icon: 'crown',
    materialType: 'metallic'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Shadow',
    category: 'elemental',
    requiredTier: 'hero',
    description: 'Polished volcanic black glass with glowing crimson fractures and fiery edge glow.',
    previewBg: 'from-stone-900 via-stone-950 to-black border-rose-500/80',
    textColor: 'text-rose-300',
    ambientGlow: 'bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-stone-950/50',
    badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-600/60',
    cardClass: 'bg-gradient-to-br from-stone-900 via-stone-950 to-black border-2 border-rose-500/80 text-rose-300 shadow-rose-950/80 ring-1 ring-rose-500/30',
    numberClass: 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    particleEffect: true,
    materialType: 'metallic'
  },
  {
    id: 'molten',
    name: 'Molten Inferno',
    category: 'elemental',
    requiredTier: 'hero',
    description: 'Scorched brimstone core with radiant fiery lava veins and incandescent core heat.',
    previewBg: 'from-red-600 via-orange-600 to-amber-700 border-amber-400',
    textColor: 'text-amber-100',
    ambientGlow: 'bg-gradient-to-r from-red-600/40 via-orange-600/40 to-amber-600/40',
    badgeClass: 'bg-orange-950 text-orange-300 border-orange-500/80',
    cardClass: 'bg-gradient-to-br from-red-600 via-orange-600 to-amber-800 border-2 border-amber-300 text-amber-50 shadow-orange-600/70 ring-2 ring-orange-400/50',
    numberClass: 'text-amber-100 drop-shadow-[0_0_10px_rgba(251,146,60,0.9)]',
    particleEffect: true,
    materialType: 'elemental'
  }
];
