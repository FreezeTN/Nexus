import React from 'react';
import { ExternalLink, RefreshCw, Monitor, X, Layers, Shield, Crown, User } from 'lucide-react';
import { TabId } from '../Navigation';
import { CharacterData } from '../../types';

interface DetachedHeaderBannerProps {
  detachedTab: TabId;
  onTabChange: (tab: TabId) => void;
  activeCharacter: CharacterData | null;
  characters: CharacterData[];
  onSelectCharacter: (id: string) => void;
  isDm?: boolean;
  sessionCode?: string | null;
}

export const DetachedHeaderBanner: React.FC<DetachedHeaderBannerProps> = ({
  detachedTab,
  onTabChange,
  activeCharacter,
  characters,
  onSelectCharacter,
  isDm = false,
  sessionCode
}) => {
  const getTabLabel = (tab: TabId) => {
    switch (tab) {
      case 'sheetDm': return 'DM Overview & Party Monitor';
      case 'sheet1': return 'Stats, Features & Attributes';
      case 'sheet2': return 'Combat & Turn Order';
      case 'sheet3': return 'Gear, Wealth & Inventory';
      case 'sheet4': return 'Spells & Magic Reference';
      case 'sheet5': return 'Description, Traumas & Notes';
      case 'sheet6': return 'TRPG Rule Guide';
      case 'sheet7': return 'Monster & Item Compendium';
      default: return 'Detached View';
    }
  };

  const handleClosePopup = () => {
    window.close();
  };

  return (
    <header className="bg-stone-950 border-b border-amber-600/40 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-stone-200 sticky top-0 z-50 shadow-xl">
      {/* Left: Window Status Badge & Sheet Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono text-xs shadow-inner">
          <Monitor className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold tracking-wide">DETACHED MONITOR VIEW</span>
        </div>

        <div className="h-4 w-[1px] bg-stone-800 hidden sm:block" />

        <h1 className="text-sm sm:text-base font-serif font-bold text-amber-100 flex items-center gap-2">
          {detachedTab === 'sheetDm' && <Crown className="w-4 h-4 text-purple-400" />}
          <span>{getTabLabel(detachedTab)}</span>
        </h1>
      </div>

      {/* Middle: Active Character Selector & Tab Quick Switcher */}
      <div className="flex items-center gap-2">
        {activeCharacter && detachedTab !== 'sheetDm' && (
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={activeCharacter.id}
              onChange={(e) => onSelectCharacter(e.target.value)}
              className="bg-transparent text-amber-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {characters.map(c => (
                <option key={c.id} value={c.id} className="bg-stone-900 text-stone-200">
                  {c.name} ({c.race} {c.characterClass})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Switcher in Popup */}
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onTabChange('sheet1')}
            className={`px-2 py-1 rounded transition ${detachedTab === 'sheet1' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
            title="Stats & Features"
          >
            Stats
          </button>
          <button
            onClick={() => onTabChange('sheet2')}
            className={`px-2 py-1 rounded transition ${detachedTab === 'sheet2' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
            title="Combat"
          >
            Combat
          </button>
          <button
            onClick={() => onTabChange('sheet4')}
            className={`px-2 py-1 rounded transition ${detachedTab === 'sheet4' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
            title="Spells"
          >
            Spells
          </button>
          <button
            onClick={() => onTabChange('sheet7')}
            className={`px-2 py-1 rounded transition ${detachedTab === 'sheet7' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
            title="Compendium"
          >
            Compendium
          </button>
          {isDm && (
            <button
              onClick={() => onTabChange('sheetDm')}
              className={`px-2 py-1 rounded transition ${detachedTab === 'sheetDm' ? 'bg-purple-900/40 text-purple-300 font-bold' : 'text-stone-400 hover:text-purple-300'}`}
              title="DM Overview"
            >
              DM
            </button>
          )}
        </div>
      </div>

      {/* Right: Sync Status & Window Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE SYNCED</span>
        </div>

        {sessionCode && (
          <span className="hidden md:inline-block text-[10px] font-mono bg-stone-900 text-amber-400 border border-amber-600/30 px-1.5 py-0.5 rounded">
            ROOM: {sessionCode}
          </span>
        )}

        <button
          onClick={handleClosePopup}
          className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 hover:bg-stone-800 transition"
          title="Close Popup Window"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
