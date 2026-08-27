import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Package, Wand2, ScrollText, BookOpen, Sparkles, Cpu, Zap, Library, ChevronLeft, ChevronRight, Crown, ExternalLink } from 'lucide-react';
import { RuleEdition } from '../types';
import { UserProfile, GameSession } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';

export type TabId = 'menu' | 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4' | 'sheet5' | 'sheet6' | 'sheet7' | 'sheetDm';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onDetachTab?: (tab: TabId) => void;
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
  onDetachTab,
  isSpellcaster,
  edition = '5e',
  currentUser,
  hasActiveCharacter = true,
  isDm = false,
  activeSession = null
}) => {
  const { t } = useLanguage();
  const isShadowrun = edition === 'shadowrun';
  const isPathfinder = edition === 'pathfinder';
  const isCthulhu = edition === 'cthulhu';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
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

  const allTabs = [
    {
      id: 'sheet1' as TabId,
      title: isShadowrun
        ? t('nav.sr.attributes', 'Attributes & Augs')
        : isPathfinder
        ? t('nav.pf.stats', 'Stats & Feats')
        : isCthulhu
        ? t('nav.coc.stats', 'Investigator Stats')
        : t('nav.stats', 'Stats & Features'),
      description: isShadowrun
        ? t('nav.sr.attributesSub', 'Attributes, Condition Tracks, Cyberware & Qualities')
        : isPathfinder
        ? t('nav.pf.statsSub', 'Stats, Skills, Ancestry & Class Feats')
        : isCthulhu
        ? t('nav.coc.statsSub', 'Characteristics, Skill Percentiles & Half/Fifth Values')
        : t('nav.statsSub', 'Stats, Skills, Feats, Features'),
      icon: isShadowrun ? Cpu : ShieldAlert
    },
    {
      id: 'sheet2' as TabId,
      title: isShadowrun
        ? t('nav.sr.combat', 'Tactical Combat')
        : isPathfinder
        ? t('nav.pf.combat', '3-Action Combat')
        : isCthulhu
        ? t('nav.coc.combat', 'Combat & Sanity')
        : t('nav.combat', 'Combat'),
      description: isShadowrun
        ? t('nav.sr.combatSub', 'Initiative, Firearms, Armor & Actions Cheat Sheet')
        : isPathfinder
        ? t('nav.pf.combatSub', 'Attacks, 3-Action Economy & Combat Tactics')
        : isCthulhu
        ? t('nav.coc.combatSub', 'Sanity Monitor, Firearms, Brawling & Insanity')
        : t('nav.combatSub', 'Attacks, Actions & Tactics'),
      icon: Crosshair
    },
    ...(isDm && activeSession ? [{
      id: 'sheetDm' as TabId,
      title: t('nav.dmOverview', 'DM Overview'),
      description: t('nav.dmOverviewSub', 'Party Monitor, Base Stats & Live DM Overrides'),
      icon: Crown,
      badge: 'DM Only'
    }] : []),
    {
      id: 'sheet3' as TabId,
      title: isShadowrun
        ? t('nav.sr.matrix', 'Matrix & Nuyen')
        : isPathfinder
        ? t('nav.pf.gear', 'Inventory & Coins')
        : isCthulhu
        ? t('nav.coc.gear', 'Possessions & Cash')
        : t('nav.gear', 'Gear & Wealth'),
      description: isShadowrun
        ? t('nav.sr.matrixSub', 'Nuyen Vault, Credsticks, Cyberdecks, Drones & Vehicles')
        : isPathfinder
        ? t('nav.pf.gearSub', 'Gear, Platinum/Gold, Bulk & Magic Items')
        : isCthulhu
        ? t('nav.coc.gearSub', 'Investigator Equipment, Cash, Assets & Property')
        : t('nav.gearSub', 'Inventory, Coins, Attunement, Encumbrance'),
      icon: Package
    },
    {
      id: 'sheet4' as TabId,
      title: isShadowrun
        ? t('nav.sr.magic', 'Sorcery & Matrix')
        : isPathfinder
        ? t('nav.pf.spells', 'Spell Repertoire')
        : isCthulhu
        ? t('nav.coc.spells', 'Occult & Tomes')
        : t('nav.spells', 'Spells & Casting'),
      description: isShadowrun
        ? t('nav.sr.magicSub', 'Spells, Adept Powers, Drain & Complex Forms')
        : isPathfinder
        ? t('nav.pf.spellsSub', 'Spell Slots, Focus Spells & Cantrips')
        : isCthulhu
        ? t('nav.coc.spellsSub', 'Tomes, Spells, Myths & Rituals')
        : t('nav.spellsSub', 'Spell Slots, DC, Spellbook & Cantrips'),
      icon: isShadowrun ? Zap : Wand2,
      badge: (isSpellcaster || isShadowrun) ? 'Active' : undefined
    },
    {
      id: 'sheet5' as TabId,
      title: isShadowrun
        ? t('nav.sr.notes', 'Runner Profile')
        : isPathfinder
        ? t('nav.pf.notes', 'Background & Notes')
        : isCthulhu
        ? t('nav.coc.notes', 'Backstory & Traumas')
        : t('nav.notes', 'Description & Notes'),
      description: isShadowrun
        ? t('nav.sr.notesSub', 'Street Reputation, SINs, Backstory, Lifestyle & Notes')
        : isPathfinder
        ? t('nav.pf.notesSub', 'Ancestry, Background, Traits & Campaign Journal')
        : isCthulhu
        ? t('nav.coc.notesSub', 'Personal Description, Ideology, Phobias & Traumas')
        : t('nav.notesSub', 'Background, Appearance, Allies & Notes'),
      icon: ScrollText
    }
  ];

  // Filter tabs: if no active character selected, hide character sheet tabs
  const tabs = allTabs.filter(t => {
    if (!hasActiveCharacter) {
      const characterSheets = ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5', 'sheetDm'];
      if (characterSheets.includes(t.id)) return false;
    }
    return true;
  });

  if (tabs.length === 0) return null;

  return (
    <nav className={`bg-stone-950 border-b border-stone-800 ${currentUser ? 'sticky top-[108px] z-30 shadow-md' : 'relative z-10'}`}>
      <div className="w-full mx-auto px-2 sm:px-4 relative flex items-center">
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
              <div
                key={tab.id}
                data-active={isActive ? "true" : "false"}
                className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition whitespace-nowrap text-left shrink-0 ${
                  isActive
                    ? 'bg-theme-dark border-theme-strong text-theme-text shadow-md font-medium shadow-theme-glow ring-1 ring-amber-500/30'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <button
                  onClick={() => onTabChange(tab.id)}
                  className="flex items-center gap-2 cursor-pointer focus:outline-none"
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

                {onDetachTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetachTab(tab.id);
                    }}
                    title={`Detach ${tab.title} to popup window / secondary screen`}
                    className={`p-1 rounded-md transition hover:scale-110 ${
                      isActive
                        ? 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/20'
                        : 'text-stone-500 opacity-60 hover:opacity-100 hover:text-amber-300 hover:bg-stone-800'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <div className="w-4 shrink-0 h-1" />
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
    </nav>
  );
};
