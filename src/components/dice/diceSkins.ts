import React, { ReactNode } from 'react';
import { Sparkles, Flame, Shield, Dices, Layers, Crown, Zap, Moon } from 'lucide-react';

export interface DiceSkin {
  id: string;
  name: string;
  requiredTier: 'free' | 'hero' | 'guild';
  previewBg: string;
  textColor: string;
  ambientGlow: string;
  badgeClass: string;
  cardClass: string;
  numberClass: string;
  particleEffect?: boolean;
  iconName?: string;
}

export const DICE_SKINS: DiceSkin[] = [
  {
    id: 'standard',
    name: 'Classic Oak',
    requiredTier: 'free',
    previewBg: 'from-amber-900 to-stone-900',
    textColor: 'text-amber-200',
    ambientGlow: 'bg-gradient-to-r from-amber-900/20 to-stone-900/30',
    badgeClass: 'bg-stone-800 text-stone-300 border-stone-700',
    cardClass: 'bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 border-2 border-amber-700/60 text-amber-100 shadow-amber-950/60',
    numberClass: 'text-amber-100',
    iconName: 'oak'
  },
  {
    id: 'gold',
    name: 'Gilded Amber',
    requiredTier: 'free',
    previewBg: 'from-amber-600 to-yellow-600',
    textColor: 'text-yellow-100',
    ambientGlow: 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-600/60',
    cardClass: 'bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-800 border-2 border-yellow-300/80 text-stone-950 font-extrabold shadow-yellow-600/50',
    numberClass: 'text-stone-950',
    iconName: 'gold'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Shadow',
    requiredTier: 'hero',
    previewBg: 'from-stone-900 via-stone-950 to-black',
    textColor: 'text-rose-300',
    ambientGlow: 'bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-stone-950/50',
    badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-600/60',
    cardClass: 'bg-gradient-to-br from-stone-900 via-stone-950 to-black border-2 border-rose-500/80 text-rose-300 shadow-rose-950/80 ring-1 ring-rose-500/30',
    numberClass: 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    particleEffect: true,
    iconName: 'obsidian'
  },
  {
    id: 'molten',
    name: 'Molten Inferno',
    requiredTier: 'hero',
    previewBg: 'from-red-600 via-orange-600 to-amber-700',
    textColor: 'text-amber-100',
    ambientGlow: 'bg-gradient-to-r from-red-600/40 via-orange-600/40 to-amber-600/40',
    badgeClass: 'bg-orange-950 text-orange-300 border-orange-500/80',
    cardClass: 'bg-gradient-to-br from-red-600 via-orange-600 to-amber-800 border-2 border-amber-300 text-amber-50 shadow-orange-600/70 ring-2 ring-orange-400/50',
    numberClass: 'text-amber-100 drop-shadow-[0_0_10px_rgba(251,146,60,0.9)]',
    particleEffect: true,
    iconName: 'molten'
  },
  {
    id: 'astral',
    name: 'Astral Void',
    requiredTier: 'guild',
    previewBg: 'from-indigo-900 via-purple-900 to-cyan-900',
    textColor: 'text-cyan-200',
    ambientGlow: 'bg-gradient-to-r from-indigo-900/40 via-purple-900/50 to-cyan-800/40',
    badgeClass: 'bg-purple-950 text-cyan-200 border-cyan-400/80',
    cardClass: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-cyan-950 border-2 border-cyan-400 text-cyan-200 shadow-cyan-900/80 ring-2 ring-purple-500/60',
    numberClass: 'text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]',
    particleEffect: true,
    iconName: 'astral'
  }
];
