import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Package, Wand2, ScrollText, BookOpen, Sparkles, Cpu, Zap, Library, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { RuleEdition } from '../types';
import { UserProfile, GameSession } from '../lib/firebase';

export type TabId = 'menu' | 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4' | 'sheet5' | 'sheet6' | 'sheet7' | 'sheetDm';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isSpellcaster: boolean;
  edition?: RuleEdition;
  currentUser?: UserProfile | null;
  hasActiveCharacter?: boolean;
  isDm?: boolean;
  activeSession?: GameSession | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isSpellcaster,
  edition = '5e',
  currentUser,
  hasActiveCharacter = true,
  isDm = false,
  activeSession = null
}) => {
  const isShadowrun = edition === 'shadowrun';
  const isPathfinder = edition === 'pathfinder';
  const isCthulhu = edition === 'cthulhu';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    checkScroll();
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 260;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!scrollRef.current) return;
    const value = parseFloat(e.target.value);
    const { scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    scrollRef.current.scrollLeft = (value / 100) * maxScroll;
    setScrollProgress(value);
  };

  const allTabs = [
    {
      id: 'menu' as TabId,
      title: 'Main Menu',
      description: 'System Selection & Campaign Hub',
      icon: Sparkles,
      badge: 'Hub'
    },
    {
      id: 'sheet1' as TabId,
      title: isShadowrun
        ? 'Attributes & Augs'
        : isPathfinder
        ? 'Stats & Feats'
        : isCthulhu
        ? 'Investigator Stats'
        : 'Stats & Features',
      description: isShadowrun
        ? 'Attributes, Condition Tracks, Cyberware & Qualities'
        : isPathfinder
        ? 'Stats, Skills, Ancestry & Class Feats'
        : isCthulhu
        ? 'Characteristics, Skill Percentiles & Half/Fifth Values'
        : 'Stats, Skills, Feats, Features',
      icon: isShadowrun ? Cpu : ShieldAlert
    },
    {
      id: 'sheet2' as TabId,
      title: isShadowrun
        ? 'Tactical Combat'
        : isPathfinder
        ? '3-Action Combat'
        : isCthulhu
        ? 'Combat & Sanity'
        : 'Combat',
      description: isShadowrun
        ? 'Initiative, Firearms, Armor & Actions Cheat Sheet'
        : isPathfinder
        ? 'Attacks, 3-Action Economy & Combat Tactics'
        : isCthulhu
        ? 'Sanity Monitor, Firearms, Brawling & Insanity'
        : 'Attacks, Combat Quick View, Actions & Maneuvers Cheat Sheet',
      icon: Crosshair
    },
    ...(isDm && activeSession ? [{
      id: 'sheetDm' as TabId,
      title: 'DM Overview',
      description: 'Party Monitor, Base Stats & Live DM Overrides',
      icon: Crown,
      badge: 'DM Only'
    }] : []),
    {
      id: 'sheet3' as TabId,
      title: isShadowrun
        ? 'Matrix & Nuyen'
        : isPathfinder
        ? 'Inventory & Coins'
        : isCthulhu
        ? 'Possessions & Cash'
        : 'Gear & Wealth',
      description: isShadowrun
        ? 'Nuyen Vault, Credsticks, Cyberdecks, Drones & Vehicles'
        : isPathfinder
        ? 'Gear, Platinum/Gold, Bulk & Magic Items'
        : isCthulhu
        ? 'Investigator Equipment, Cash, Assets & Property'
        : 'Inventory, Coins, Attunement, Encumbrance',
      icon: Package
    },
    {
      id: 'sheet4' as TabId,
      title: isShadowrun
        ? 'Sorcery & Matrix'
        : isPathfinder
        ? 'Spell Repertoire'
        : isCthulhu
        ? 'Occult & Tomes'
        : 'Spells & Casting',
      description: isShadowrun
        ? 'Spells, Adept Powers, Drain & Complex Forms'
        : isPathfinder
        ? 'Spell Slots, Focus Spells & Cantrips'
        : isCthulhu
        ? 'Tomes, Spells, Myths & Rituals'
        : 'Spell Slots, DC, Spellbook & Cantrips',
      icon: isShadowrun ? Zap : Wand2,
      badge: (isSpellcaster || isShadowrun) ? 'Active' : undefined
    },
    {
      id: 'sheet5' as TabId,
      title: isShadowrun
        ? 'Runner Profile'
        : isPathfinder
        ? 'Background & Notes'
        : isCthulhu
        ? 'Backstory & Traumas'
        : 'Description & Notes',
      description: isShadowrun
        ? 'Street Reputation, SINs, Backstory, Lifestyle & Notes'
        : isPathfinder
        ? 'Ancestry, Background, Traits & Campaign Journal'
        : isCthulhu
        ? 'Personal Description, Ideology, Phobias & Traumas'
        : 'Appearance, Backstory, Traits, Notes',
      icon: ScrollText
    },
    {
      id: 'sheet6' as TabId,
      title: isShadowrun
        ? 'Shadowrun Guide'
        : isPathfinder
        ? 'Pathfinder Guide'
        : isCthulhu
        ? 'Cthulhu Guide'
        : 'User Guide',
      description: isShadowrun
        ? 'Shadowrun 5e Mechanics, Dice Pools & Rules'
        : isPathfinder
        ? 'Pathfinder 2e System Reference'
        : isCthulhu
        ? 'Call of Cthulhu 7e Rulebook'
        : 'User Manual, Audio Options & Release Changelog',
      icon: BookOpen
    },
    {
      id: 'sheet7' as TabId,
      title: 'Compendium',
      description: 'Dynamic SRD & Custom Library for Monsters, Spells, Items, Classes, Feats & Features',
      icon: Library,
      badge: 'SRD'
    }
  ];

  // Filter tabs: if not logged in, only menu & guide; if no active character selected, hide character sheet tabs
  const tabs = allTabs.filter(t => {
    if (!currentUser) {
      return t.id === 'menu' || t.id === 'sheet6';
    }
    if (!hasActiveCharacter) {
      // Hide character sheets (sheet1 - sheet5) when no character is selected
      const characterSheets = ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5'];
      if (characterSheets.includes(t.id)) return false;
    }
    return true;
  });

  return (
    <nav className={`bg-stone-950 border-b border-stone-800 ${currentUser ? 'sticky top-[108px] z-30 shadow-md' : 'relative z-10'}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center">
        {/* Left Scroll Button */}
        <button
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          title="Scroll Left"
          className={`hidden sm:flex items-center justify-center p-1.5 mr-1 rounded-lg border transition shrink-0 ${
            canScrollLeft
              ? 'bg-stone-900 border-amber-500/40 text-amber-300 hover:bg-stone-800 hover:text-amber-200 shadow-sm cursor-pointer'
              : 'bg-stone-950/50 border-stone-800/50 text-stone-700 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-amber-800/40 scrollbar-track-stone-900 gap-1.5 sm:gap-2 py-2 px-0.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                data-active={isActive ? "true" : "false"}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition whitespace-nowrap text-left shrink-0 ${
                  isActive
                    ? 'bg-theme-dark border-theme-strong text-theme-text shadow-md font-medium shadow-theme-glow ring-1 ring-amber-500/30'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-theme-accent text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-serif font-bold leading-tight">
                    {tab.title}
                  </span>
                  {tab.badge && (
                    <span className="text-[9px] bg-purple-900/80 text-purple-200 px-1 py-0.2 rounded font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          title="Scroll Right"
          className={`hidden sm:flex items-center justify-center p-1.5 ml-1 rounded-lg border transition shrink-0 ${
            canScrollRight
              ? 'bg-stone-900 border-amber-500/40 text-amber-300 hover:bg-stone-800 hover:text-amber-200 shadow-sm cursor-pointer'
              : 'bg-stone-950/50 border-stone-800/50 text-stone-700 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Sheet Slider Bar */}
      <div className="max-w-7xl mx-auto px-4 pb-1.5 pt-0.5 flex items-center gap-2 text-[10px] text-stone-500 border-t border-stone-900/80">
        <span className="font-mono text-stone-400 shrink-0 select-none flex items-center gap-1">
          <ChevronLeft className="w-3 h-3 text-amber-500/70" /> Slide Sheets <ChevronRight className="w-3 h-3 text-amber-500/70" />
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={scrollProgress}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-none"
          title="Slide across character sheets"
        />
        <span className="font-mono text-stone-400 shrink-0 text-[10px]">
          {Math.round(scrollProgress)}%
        </span>
      </div>
    </nav>
  );
};
