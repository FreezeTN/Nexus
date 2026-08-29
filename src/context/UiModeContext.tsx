import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UiMode = 'focus' | 'master';

interface UiModeContextType {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  toggleUiMode: () => void;
  isFocusMode: boolean;
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  startTour: () => void;
}

const UiModeContext = createContext<UiModeContextType | undefined>(undefined);

export const UiModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiMode, setUiModeState] = useState<UiMode>(() => {
    const saved = localStorage.getItem('dnd_ui_mode_pref');
    return saved === 'master' ? 'master' : 'focus';
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const setUiMode = (mode: UiMode) => {
    setUiModeState(mode);
    localStorage.setItem('dnd_ui_mode_pref', mode);
  };

  const toggleUiMode = () => {
    const next = uiMode === 'focus' ? 'master' : 'focus';
    setUiMode(next);
  };

  const startTour = () => {
    setIsTourOpen(true);
  };

  return (
    <UiModeContext.Provider
      value={{
        uiMode,
        setUiMode,
        toggleUiMode,
        isFocusMode: uiMode === 'focus',
        isTourOpen,
        setIsTourOpen,
        startTour
      }}
    >
      {children}
    </UiModeContext.Provider>
  );
};

const defaultUiModeContext: UiModeContextType = {
  uiMode: 'focus',
  setUiMode: () => {},
  toggleUiMode: () => {},
  isFocusMode: true,
  isTourOpen: false,
  setIsTourOpen: () => {},
  startTour: () => {}
};

export const useUiMode = (): UiModeContextType => {
  const context = useContext(UiModeContext);
  if (!context) {
    return defaultUiModeContext;
  }
  return context;
};
