import React from 'react';
import { ShieldAlert, Crosshair, Package, Wand2, ScrollText, BookOpen, Sparkles, Cpu, Zap, Radio } from 'lucide-react';
import { RuleEdition } from '../types';

export type TabId = 'menu' | 'sheet1' | 'sheet2' | 'sheet3' | 'sheet4' | 'sheet5' | 'sheet6';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isSpellcaster: boolean;
  edition?: RuleEdition;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isSpellcaster,
  edition = '5e'
}) => {
  const isShadowrun = edition === 'shadowrun';
  const isPathfinder = edition === 'pathfinder';
  const isCthulhu = edition === 'cthulhu';

  const tabs = [
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
        : 'App Functions & Interactive Help',
      icon: BookOpen
    }
  ];

  return (
    <nav className="bg-stone-950 border-b border-stone-800 sticky top-[108px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between sm:justify-start overflow-x-auto scrollbar-none gap-1.5 sm:gap-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition whitespace-nowrap text-left shrink-0 ${
                isActive
                  ? 'bg-theme-dark border-theme-strong text-theme-text shadow-md font-medium shadow-theme-glow'
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
    </nav>
  );
};
