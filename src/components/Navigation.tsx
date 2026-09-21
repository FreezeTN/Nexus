import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Package, Wand2, ScrollText, BookOpen, Sparkles, Cpu, Zap, Library, ChevronLeft, ChevronRight, Crown, ExternalLink, MapPin, User, Sliders, GripVertical, RotateCcw } from 'lucide-react';
import { RuleEdition } from '../types';
import { UserProfile, GameSession } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { useUiMode } from '../context/UiModeContext';
import {
  useLayoutCustomization,
  getCustomTabOrder,
  saveCustomTabOrder,
  resetCustomTabOrder,
  sortTabsByCustomOrder,
  EVENT_NAV_TAB_ORDER_CHANGED
} from '../utils/layoutCustomization';

export type TabId = 'menu' | 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4' | 'sheet5' | 'sheet6' | 'sheet7' | 'sheetDm' | 'battlemap';

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
  const { workspaceRole } = useUiMode();
  const { isVisible } = useLayoutCustomization();
  const isShadowrun = edition === 'shadowrun';
  const isPathfinder = edition === 'pathfinder';
  const isCthulhu = edition === 'cthulhu';

  // If role is player and currently on DM tab, redirect to sheet1
  useEffect(() => {
    if (workspaceRole === 'player' && activeTab === 'sheetDm') {
      onTabChange('sheet1');
    }
  }, [workspaceRole, activeTab, onTabChange]);

  // Tab order customization & drag-and-drop alignment
  const [tabOrder, setTabOrder] = useState<string[] | null>(() => getCustomTabOrder(workspaceRole));
  const [draggedTabId, setDraggedTabId] = useState<TabId | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<TabId | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setTabOrder(getCustomTabOrder(workspaceRole));
  }, [workspaceRole]);

  useEffect(() => {
    const handleOrderChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ role: string; order: string[] | null }>;
      if (customEvent.detail && customEvent.detail.role === workspaceRole) {
        setTabOrder(customEvent.detail.order);
      }
    };
    window.addEventListener(EVENT_NAV_TAB_ORDER_CHANGED, handleOrderChange);
    return () => window.removeEventListener(EVENT_NAV_TAB_ORDER_CHANGED, handleOrderChange);
  }, [workspaceRole]);

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

  // Base tabs definitions
  const tabStats = {
    id: 'sheet1' as TabId,
    title: isShadowrun
      ? t('nav.sr.attributes', 'Attributes & Augs')
      : isPathfinder
      ? t('nav.pf.stats', 'Stats & Feats')
      : isCthulhu
      ? t('nav.coc.stats', 'Investigator Stats')
      : workspaceRole === 'gm'
      ? t('nav.statsNpc', 'Stats & Features')
      : t('nav.stats', 'Stats & Features'),
    description: isShadowrun
      ? t('nav.sr.attributesSub', 'Attributes, Condition Tracks, Cyberware & Qualities')
      : isPathfinder
      ? t('nav.pf.statsSub', 'Stats, Skills, Ancestry & Class Feats')
      : isCthulhu
      ? t('nav.coc.statsSub', 'Characteristics, Skill Percentiles & Half/Fifth Values')
      : t('nav.statsSub', 'Stats, Skills, Feats, Features'),
    icon: isShadowrun ? Cpu : ShieldAlert
  };

  const tabCombat = {
    id: 'sheet2' as TabId,
    title: isShadowrun
      ? t('nav.sr.combat', 'Tactical Combat')
      : isPathfinder
      ? t('nav.pf.combat', '3-Action Combat')
      : isCthulhu
      ? t('nav.coc.combat', 'Combat & Sanity')
      : workspaceRole === 'gm'
      ? t('nav.combatEncounters', 'Encounters & Combat')
      : t('nav.combat', 'Combat'),
    description: isShadowrun
      ? t('nav.sr.combatSub', 'Initiative, Firearms, Armor & Actions Cheat Sheet')
      : isPathfinder
      ? t('nav.pf.combatSub', 'Attacks, 3-Action Economy & Combat Tactics')
      : isCthulhu
      ? t('nav.coc.combatSub', 'Sanity Monitor, Firearms, Brawling & Insanity')
      : t('nav.combatSub', 'Attacks, Actions & Tactics'),
    icon: Crosshair
  };

  const tabDmOverview = {
    id: 'sheetDm' as TabId,
    title: t('nav.dmOverview', 'DM Overview'),
    description: t('nav.dmOverviewSub', 'Party Monitor, Base Stats & Live DM Overrides'),
    icon: Crown,
    badge: 'DM Live'
  };

  const tabGear = {
    id: 'sheet3' as TabId,
    title: isShadowrun
      ? t('nav.sr.matrix', 'Matrix & Nuyen')
      : isPathfinder
      ? t('nav.pf.gear', 'Inventory & Coins')
      : isCthulhu
      ? t('nav.coc.gear', 'Possessions & Cash')
      : workspaceRole === 'gm'
      ? t('nav.gearLoot', 'Loot & Gear')
      : t('nav.gear', 'Gear & Wealth'),
    description: isShadowrun
      ? t('nav.sr.matrixSub', 'Nuyen Vault, Credsticks, Cyberdecks, Drones & Vehicles')
      : isPathfinder
      ? t('nav.pf.gearSub', 'Gear, Platinum/Gold, Bulk & Magic Items')
      : isCthulhu
      ? t('nav.coc.gearSub', 'Investigator Equipment, Cash, Assets & Property')
      : t('nav.gearSub', 'Inventory, Coins, Attunement, Encumbrance'),
    icon: Package
  };

  const tabSpells = {
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
  };

  const tabNotes = {
    id: 'sheet5' as TabId,
    title: isShadowrun
      ? t('nav.sr.notes', 'Runner Profile')
      : isPathfinder
      ? t('nav.pf.notes', 'Background & Notes')
      : isCthulhu
      ? t('nav.coc.notes', 'Backstory & Traumas')
      : workspaceRole === 'gm'
      ? t('nav.campaignNotes', 'Campaign Notes')
      : t('nav.notes', 'Description & Notes'),
    description: isShadowrun
      ? t('nav.sr.notesSub', 'Street Reputation, SINs, Backstory, Lifestyle & Notes')
      : isPathfinder
      ? t('nav.pf.notesSub', 'Ancestry, Background, Traits & Campaign Journal')
      : isCthulhu
      ? t('nav.coc.notesSub', 'Personal Description, Ideology, Phobias & Traumas')
      : t('nav.notesSub', 'Background, Appearance, Allies & Notes'),
    icon: ScrollText
  };

  const tabCompendium = {
    id: 'sheet7' as TabId,
    title: t('nav.compendium', 'Bestiary & SRD'),
    description: t('nav.compendiumSub', 'Monsters, Spells & Magic Items'),
    icon: Library,
    badge: 'SRD'
  };

  const tabGuide = {
    id: 'sheet6' as TabId,
    title: t('nav.guide', 'Rules & Guide'),
    description: t('nav.guideSub', 'User Manual & Reference'),
    icon: BookOpen
  };

  interface NavTabItem {
    id: TabId;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  // Determine active tabs according to workspaceRole
  let allTabs: NavTabItem[];
  if (workspaceRole === 'player') {
    // Player: Optimized for character sheets, dice, spells & inventory. No DM overview tab.
    allTabs = [tabStats, tabCombat, tabGear, tabSpells, tabNotes];
  } else if (workspaceRole === 'gm') {
    // GM: DM Overview is prominent and always accessible, along with Combat/Encounters, Bestiary/Compendium, and Campaign Notes
    allTabs = [tabDmOverview, tabCombat, tabCompendium, tabNotes, tabStats, tabGear, tabSpells];
  } else {
    // Unified: Shows all character and campaign tabs without filtering
    allTabs = [tabStats, tabCombat, tabDmOverview, tabGear, tabSpells, tabNotes, tabCompendium, tabGuide];
  }

  // Apply custom user tab alignment order
  const sortedAllTabs = sortTabsByCustomOrder(allTabs, tabOrder);

  // Drag and drop handlers for sheet tab re-alignment
  const handleDragStart = (e: React.DragEvent, id: TabId) => {
    isDraggingRef.current = true;
    setDraggedTabId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: TabId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedTabId || draggedTabId === id) {
      if (dragOverTabId !== null) setDragOverTabId(null);
      if (dropPosition !== null) setDropPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isRightHalf = e.clientX > (rect.left + rect.width / 2);
    const pos = isRightHalf ? 'after' : 'before';
    if (dragOverTabId !== id || dropPosition !== pos) {
      setDragOverTabId(id);
      setDropPosition(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverTabId(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: TabId) => {
    e.preventDefault();
    const sourceId = (e.dataTransfer.getData('text/plain') as TabId) || draggedTabId;
    if (sourceId && sourceId !== targetId) {
      const allIds = sortedAllTabs.map(t => t.id);
      const withoutSource = allIds.filter(id => id !== sourceId);
      const targetIndex = withoutSource.indexOf(targetId);
      if (targetIndex !== -1) {
        const insertIndex = dropPosition === 'after' ? targetIndex + 1 : targetIndex;
        withoutSource.splice(insertIndex, 0, sourceId);
        setTabOrder(withoutSource);
        saveCustomTabOrder(withoutSource, workspaceRole);
      }
    }
    setDraggedTabId(null);
    setDragOverTabId(null);
    setDropPosition(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
    setDropPosition(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  const handleResetOrder = () => {
    resetCustomTabOrder(workspaceRole);
    setTabOrder(null);
  };

  // Filter tabs: respect user layout toggles, role restrictions, and active character state
  const tabs = sortedAllTabs.filter(t => {
    // Check user layout preferences for this tab
    const layoutKey = `nav_${t.id}`;
    if (!isVisible(layoutKey)) {
      return false;
    }

    if (!hasActiveCharacter) {
      if (workspaceRole === 'gm' && (t.id === 'sheetDm' || t.id === 'sheet7')) {
        return true;
      }
      const characterSheets = ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5'];
      if (characterSheets.includes(t.id)) return false;
    }
    return true;
  });

  if (tabs.length === 0) return null;

  return (
    <nav aria-label="Character Sheet Views" className={`bg-stone-950 border-b border-stone-800 ${currentUser ? 'sticky top-[108px] z-30 shadow-md' : 'relative z-10'}`}>
      <div className="w-full mx-auto px-2 sm:px-4 relative flex items-center">
        {/* Left Scroll Button */}
        <button
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          title="Scroll Left"
          aria-label="Scroll sheet tabs left"
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
          role="tablist"
          aria-label="Character and DM sheets"
          className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-amber-800/40 scrollbar-track-stone-900 gap-1.5 sm:gap-2 py-2 px-0.5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <div
                key={tab.id}
                role="none"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragOver={(e) => handleDragOver(e, tab.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tab.id)}
                onDragEnd={handleDragEnd}
                data-active={isActive ? "true" : "false"}
                title={t('nav.dragReorder', 'Drag to re-align sheet tabs, or click to view')}
                className={`group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition whitespace-nowrap text-left shrink-0 select-none cursor-grab active:cursor-grabbing ${
                  draggedTabId === tab.id
                    ? 'opacity-40 border-dashed border-amber-500 scale-95'
                    : isActive
                    ? 'bg-theme-dark border-theme-strong text-theme-text shadow-md font-medium shadow-theme-glow ring-1 ring-amber-500/30'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                {/* Drop indicator lines */}
                {dragOverTabId === tab.id && dropPosition === 'before' && (
                  <div className="absolute -left-1 sm:-left-1.5 top-0.5 bottom-0.5 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.95)] z-30 pointer-events-none animate-pulse" />
                )}
                {dragOverTabId === tab.id && dropPosition === 'after' && (
                  <div className="absolute -right-1 sm:-right-1.5 top-0.5 bottom-0.5 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.95)] z-30 pointer-events-none animate-pulse" />
                )}

                {/* Drag Handle */}
                <div
                  className="text-stone-600 group-hover:text-amber-400/80 transition-colors p-0.5 -mr-0.5 cursor-grab active:cursor-grabbing"
                  title={t('nav.dragHandle', 'Drag to re-align sheet')}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                <button
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={(e) => {
                    if (isDraggingRef.current) {
                      e.preventDefault();
                      return;
                    }
                    onTabChange(tab.id);
                  }}
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
                    aria-label={`Detach ${tab.title} to new window`}
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

        {/* Reset Alignment Button (Shown when tabs are customized) */}
        {tabOrder && (
          <button
            onClick={handleResetOrder}
            title={t('nav.resetAlignment', 'Reset sheet tabs to default alignment')}
            aria-label="Reset sheet tabs to default alignment"
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 ml-1 text-[11px] rounded-lg border border-amber-600/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:text-amber-200 transition shrink-0 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline font-mono text-[10px]">Reset Order</span>
          </button>
        )}

        {/* Right Scroll Button */}
        <button
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          title="Scroll Right"
          aria-label="Scroll sheet tabs right"
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
