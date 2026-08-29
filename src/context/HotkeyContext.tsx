import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HotkeyBinding {
  id: string;
  label: string;
  description: string;
  category: 'navigation' | 'modes' | 'tools';
  key: string; // The primary key (e.g. '1', 't', 'k', 'f', 'escape')
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export interface HotkeyItem extends HotkeyBinding {
  defaultKey: string;
  defaultCtrl?: boolean;
  defaultShift?: boolean;
  defaultAlt?: boolean;
}

export const DEFAULT_HOTKEYS: HotkeyItem[] = [
  // Navigation
  {
    id: 'switchSheet1',
    label: 'Stats & Features Tab',
    description: 'Switch active view to primary character attributes and racial traits',
    category: 'navigation',
    key: '1',
    defaultKey: '1'
  },
  {
    id: 'switchSheet2',
    label: 'Combat Tab',
    description: 'Switch active view to weapons, armor, actions, and combat vitals',
    category: 'navigation',
    key: '2',
    defaultKey: '2'
  },
  {
    id: 'switchSheet3',
    label: 'Gear & Wealth Tab',
    description: 'Switch active view to inventory, currency, weight, and attunements',
    category: 'navigation',
    key: '3',
    defaultKey: '3'
  },
  {
    id: 'switchSheet4',
    label: 'Spells & Magic Tab',
    description: 'Switch active view to spellbook, spell slots, and metamagic',
    category: 'navigation',
    key: '4',
    defaultKey: '4'
  },
  {
    id: 'switchSheet5',
    label: 'Description & Notes Tab',
    description: 'Switch active view to backstory, allies, quest logs, and journal',
    category: 'navigation',
    key: '5',
    defaultKey: '5'
  },
  {
    id: 'switchSheet6',
    label: 'User Guide Tab',
    description: 'Switch active view to system rules guide and manual',
    category: 'navigation',
    key: '6',
    defaultKey: '6'
  },
  {
    id: 'switchSheet7',
    label: 'Compendium Tab',
    description: 'Switch active view to monster manuals, spells, and magic items index',
    category: 'navigation',
    key: '7',
    defaultKey: '7'
  },
  {
    id: 'switchSheetDm',
    label: 'DM Overview Tab',
    description: 'Switch active view to Dungeon Master party monitor and screen',
    category: 'navigation',
    key: '8',
    defaultKey: '8'
  },

  // Modes & Rules
  {
    id: 'cycleSystem',
    label: 'Cycle TRPG Rule System',
    description: 'Cycle between D&D 5e, 3.5e, Pathfinder 2e, Shadowrun, and Call of Cthulhu',
    category: 'modes',
    key: 't',
    defaultKey: 't'
  },
  {
    id: 'toggleFocusMode',
    label: 'Toggle Focus / Master Mode',
    description: 'Toggle between clean streamlined Focus layout and advanced Master mode',
    category: 'modes',
    key: 'f',
    defaultKey: 'f'
  },

  // Quick Tools & Actions
  {
    id: 'commandPalette',
    label: 'Universal Command Palette',
    description: 'Quick-search spells, gear, actions, roll shortcuts, and jump tabs',
    category: 'tools',
    key: 'k',
    ctrlKey: true,
    defaultKey: 'k',
    defaultCtrl: true
  },
  {
    id: 'openTour',
    label: 'Guided Onboarding Tour',
    description: 'Open the 3-step interactive tabletop orientation tour',
    category: 'tools',
    key: 'g',
    defaultKey: 'g'
  },
  {
    id: 'openOptions',
    label: 'Open Options & Settings',
    description: 'Open application settings, audio controls, layout, and hotkey configuration',
    category: 'tools',
    key: 'o',
    defaultKey: 'o'
  }
];

const STORAGE_KEY = 'penpaper_hotkeys_v2';

interface HotkeyContextType {
  hotkeys: HotkeyItem[];
  updateHotkey: (
    id: string,
    binding: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
  ) => void;
  resetHotkey: (id: string) => void;
  resetAllHotkeys: () => void;
  formatHotkeyDisplay: (item: HotkeyItem | HotkeyBinding) => string;
  matchesHotkey: (e: KeyboardEvent, id: string) => boolean;
}

const HotkeyContext = createContext<HotkeyContextType | undefined>(undefined);

export const HotkeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hotkeys, setHotkeys] = useState<HotkeyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Record<string, Partial<HotkeyBinding>> = JSON.parse(saved);
        return DEFAULT_HOTKEYS.map(def => {
          if (parsed[def.id]) {
            return {
              ...def,
              key: parsed[def.id].key || def.defaultKey,
              ctrlKey: parsed[def.id].ctrlKey !== undefined ? parsed[def.id].ctrlKey : def.defaultCtrl,
              shiftKey: parsed[def.id].shiftKey !== undefined ? parsed[def.id].shiftKey : def.defaultShift,
              altKey: parsed[def.id].altKey !== undefined ? parsed[def.id].altKey : def.defaultAlt
            };
          }
          return def;
        });
      }
    } catch (e) {
      console.warn('Failed to load custom hotkeys from storage:', e);
    }
    return DEFAULT_HOTKEYS;
  });

  const saveToStorage = (updatedList: HotkeyItem[]) => {
    try {
      const exportData: Record<string, Partial<HotkeyBinding>> = {};
      updatedList.forEach(item => {
        exportData[item.id] = {
          key: item.key,
          ctrlKey: item.ctrlKey,
          shiftKey: item.shiftKey,
          altKey: item.altKey
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exportData));
    } catch (e) {
      console.warn('Failed to save custom hotkeys:', e);
    }
  };

  const updateHotkey = (
    id: string,
    binding: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
  ) => {
    setHotkeys(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            key: binding.key.toLowerCase(),
            ctrlKey: !!binding.ctrlKey,
            shiftKey: !!binding.shiftKey,
            altKey: !!binding.altKey
          };
        }
        return item;
      });
      saveToStorage(updated);
      return updated;
    });
  };

  const resetHotkey = (id: string) => {
    setHotkeys(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            key: item.defaultKey,
            ctrlKey: item.defaultCtrl,
            shiftKey: item.defaultShift,
            altKey: item.defaultAlt
          };
        }
        return item;
      });
      saveToStorage(updated);
      return updated;
    });
  };

  const resetAllHotkeys = () => {
    setHotkeys(DEFAULT_HOTKEYS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const formatHotkeyDisplay = (item: HotkeyItem | HotkeyBinding): string => {
    const parts: string[] = [];
    if (item.ctrlKey) parts.push('Ctrl');
    if (item.altKey) parts.push('Alt');
    if (item.shiftKey) parts.push('Shift');
    
    let keyLabel = item.key.toUpperCase();
    if (item.key === ' ') keyLabel = 'Space';
    if (item.key === 'escape') keyLabel = 'Esc';
    if (item.key === 'arrowup') keyLabel = '↑';
    if (item.key === 'arrowdown') keyLabel = '↓';
    if (item.key === 'arrowleft') keyLabel = '←';
    if (item.key === 'arrowright') keyLabel = '→';
    
    parts.push(keyLabel);
    return parts.join(' + ');
  };

  const matchesHotkey = (e: KeyboardEvent, id: string): boolean => {
    const item = hotkeys.find(h => h.id === id);
    if (!item) return false;

    // Check modifiers
    const ctrlMatches = item.ctrlKey ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
    const shiftMatches = item.shiftKey ? e.shiftKey : !e.shiftKey;
    const altMatches = item.altKey ? e.altKey : !e.altKey;

    if (!ctrlMatches || !shiftMatches || !altMatches) {
      return false;
    }

    const eventKey = e.key.toLowerCase();
    const bindingKey = item.key.toLowerCase();

    return eventKey === bindingKey;
  };

  return (
    <HotkeyContext.Provider
      value={{
        hotkeys,
        updateHotkey,
        resetHotkey,
        resetAllHotkeys,
        formatHotkeyDisplay,
        matchesHotkey
      }}
    >
      {children}
    </HotkeyContext.Provider>
  );
};

const defaultHotkeyContext: HotkeyContextType = {
  hotkeys: DEFAULT_HOTKEYS,
  updateHotkey: () => {},
  resetHotkey: () => {},
  resetAllHotkeys: () => {},
  formatHotkeyDisplay: (item) => item.key.toUpperCase(),
  matchesHotkey: () => false
};

export const useHotkeys = (): HotkeyContextType => {
  const context = useContext(HotkeyContext);
  if (!context) {
    return defaultHotkeyContext;
  }
  return context;
};
