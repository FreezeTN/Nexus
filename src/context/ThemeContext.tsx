import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SheetTheme {
  id: string;
  name: string;
  description: string;
  category: 'fantasy' | 'dark' | 'elemental' | 'scifi' | 'parchment';
  requiredTier?: 'free' | 'hero' | 'guild';
  previewColors: string[];
  bgClass: string;
  cardClass: string;
  borderClass: string;
  accentClass: string;
  badgeClass: string;
  headerGradient: string;
  highlightClass: string;
  statBoxClass: string;
}

export const SHEET_THEMES: SheetTheme[] = [
  {
    id: 'tavern-amber',
    name: 'Tavern Amber',
    description: 'Classic warm fantasy tavern aesthetic with rich amber, burnished gold, and walnut accents.',
    category: 'fantasy',
    requiredTier: 'free',
    previewColors: ['#78350f', '#d97706', '#fbbf24'],
    bgClass: 'bg-stone-950',
    cardClass: 'bg-stone-900/90 border-amber-600/30 text-stone-100',
    borderClass: 'border-amber-600/40',
    accentClass: 'text-amber-400',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
    headerGradient: 'from-stone-950 via-amber-950/40 to-stone-950',
    highlightClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    statBoxClass: 'bg-stone-950/80 border-amber-600/30 text-amber-200'
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    description: 'Pitch-black obsidian canvas accented with deep blood-crimson and gothic dark steel.',
    category: 'dark',
    requiredTier: 'free',
    previewColors: ['#09090b', '#881337', '#e11d48'],
    bgClass: 'bg-zinc-950',
    cardClass: 'bg-zinc-900/95 border-rose-600/30 text-zinc-100',
    borderClass: 'border-rose-600/40',
    accentClass: 'text-rose-400',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/50',
    headerGradient: 'from-zinc-950 via-rose-950/40 to-zinc-950',
    highlightClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    statBoxClass: 'bg-zinc-950/90 border-rose-600/30 text-rose-200'
  },
  {
    id: 'emerald-glade',
    name: 'Emerald Glade',
    description: 'Verdant ancient forest palette with deep forest greens, moss tones, and spring jade.',
    category: 'elemental',
    requiredTier: 'free',
    previewColors: ['#022c22', '#059669', '#34d399'],
    bgClass: 'bg-stone-950',
    cardClass: 'bg-emerald-950/30 border-emerald-600/30 text-stone-100',
    borderClass: 'border-emerald-600/40',
    accentClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
    headerGradient: 'from-stone-950 via-emerald-950/40 to-stone-950',
    highlightClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    statBoxClass: 'bg-stone-950/80 border-emerald-600/30 text-emerald-200'
  },
  {
    id: 'arcane-void',
    name: 'Arcane Void',
    description: 'Mystic wizard academy aesthetics with astral purples, cosmic indigo, and ethereal cyan.',
    category: 'fantasy',
    requiredTier: 'hero',
    previewColors: ['#1e1b4b', '#7c3aed', '#22d3ee'],
    bgClass: 'bg-slate-950',
    cardClass: 'bg-slate-900/90 border-purple-500/40 text-slate-100',
    borderClass: 'border-purple-500/50',
    accentClass: 'text-purple-400',
    badgeClass: 'bg-purple-950/80 text-cyan-300 border-purple-500/60',
    headerGradient: 'from-slate-950 via-purple-950/40 to-slate-950',
    highlightClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    statBoxClass: 'bg-slate-950/90 border-purple-500/40 text-cyan-200'
  },
  {
    id: 'molten-forge',
    name: 'Molten Forge',
    description: 'Dwarven forge glowing with blazing magma orange, charcoal slate, and incandescent gold.',
    category: 'elemental',
    requiredTier: 'hero',
    previewColors: ['#431407', '#ea580c', '#f59e0b'],
    bgClass: 'bg-stone-950',
    cardClass: 'bg-stone-900/90 border-orange-600/40 text-stone-100',
    borderClass: 'border-orange-500/50',
    accentClass: 'text-orange-400',
    badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-500/60',
    headerGradient: 'from-stone-950 via-orange-950/40 to-stone-950',
    highlightClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    statBoxClass: 'bg-stone-950/90 border-orange-600/30 text-amber-200'
  },
  {
    id: 'ancient-parchment',
    name: 'Ancient Parchment',
    description: 'High-contrast sepia weathered manuscript with brown ink lines and leather grain.',
    category: 'parchment',
    requiredTier: 'guild',
    previewColors: ['#292524', '#78350f', '#d97706'],
    bgClass: 'bg-[#0f0d0b]',
    cardClass: 'bg-[#1a1612] border-amber-700/40 text-amber-50',
    borderClass: 'border-amber-700/50',
    accentClass: 'text-amber-300',
    badgeClass: 'bg-[#261f18] text-amber-200 border-amber-600/40',
    headerGradient: 'from-[#0f0d0b] via-[#241a12] to-[#0f0d0b]',
    highlightClass: 'bg-amber-900/30 text-amber-200 border-amber-600/40',
    statBoxClass: 'bg-[#14100c] border-amber-800/40 text-amber-200'
  }
];

interface ThemeContextType {
  currentTheme: SheetTheme;
  setTheme: (themeId: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_sheet_theme') || 'tavern-amber';
    } catch {
      return 'tavern-amber';
    }
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_sheet_accent') || '#f59e0b';
    } catch {
      return '#f59e0b';
    }
  });

  const currentTheme = SHEET_THEMES.find(t => t.id === themeId) || SHEET_THEMES[0];

  const setTheme = (id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem('nexus_sheet_theme', id);
      document.documentElement.setAttribute('data-sheet-theme', id);
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-sheet-theme', themeId);
      document.documentElement.style.setProperty('--primary-accent', accentColor);
    } catch {}
  }, [themeId, accentColor]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSheetTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useSheetTheme must be used within a ThemeProvider');
  }
  return context;
};
