import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UiMode = 'focus' | 'master';
export type WorkspaceRole = 'player' | 'gm' | 'unified';
export type ComplexityLevel = 'streamlined' | 'power';

interface UiModeContextType {
  uiMode: UiMode;
  setUiMode: (mode: UiMode) => void;
  toggleUiMode: () => void;
  isFocusMode: boolean;
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  startTour: () => void;
  // Phase A: Progressive Disclosure & Workspace Personalization
  workspaceRole: WorkspaceRole;
  setWorkspaceRole: (role: WorkspaceRole) => void;
  complexityLevel: ComplexityLevel;
  setComplexityLevel: (level: ComplexityLevel) => void;
  isStreamlined: boolean;
  showFirstUseLauncher: boolean;
  setShowFirstUseLauncher: (show: boolean) => void;
}

const UiModeContext = createContext<UiModeContextType | undefined>(undefined);

export const UiModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiMode, setUiModeState] = useState<UiMode>(() => {
    const saved = localStorage.getItem('dnd_ui_mode_pref');
    return saved === 'master' ? 'master' : 'focus';
  });

  const [workspaceRole, setWorkspaceRoleState] = useState<WorkspaceRole>(() => {
    const saved = localStorage.getItem('nexus_workspace_role_v1');
    if (saved === 'gm' || saved === 'player' || saved === 'unified') return saved;
    return 'unified';
  });

  const [complexityLevel, setComplexityLevelState] = useState<ComplexityLevel>(() => {
    const saved = localStorage.getItem('nexus_complexity_level_v1');
    if (saved === 'streamlined' || saved === 'power') return saved;
    return 'streamlined';
  });

  const [showFirstUseLauncher, setShowFirstUseLauncherState] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_hide_first_use_v1');
    return saved !== 'true';
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const setUiMode = (mode: UiMode) => {
    setUiModeState(mode);
    localStorage.setItem('dnd_ui_mode_pref', mode);
  };

  const setWorkspaceRole = (role: WorkspaceRole) => {
    setWorkspaceRoleState(role);
    localStorage.setItem('nexus_workspace_role_v1', role);
  };

  const setComplexityLevel = (level: ComplexityLevel) => {
    setComplexityLevelState(level);
    localStorage.setItem('nexus_complexity_level_v1', level);
  };

  const setShowFirstUseLauncher = (show: boolean) => {
    setShowFirstUseLauncherState(show);
    localStorage.setItem('nexus_hide_first_use_v1', show ? 'false' : 'true');
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
        startTour,
        workspaceRole,
        setWorkspaceRole,
        complexityLevel,
        setComplexityLevel,
        isStreamlined: complexityLevel === 'streamlined',
        showFirstUseLauncher,
        setShowFirstUseLauncher
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
  startTour: () => {},
  workspaceRole: 'unified',
  setWorkspaceRole: () => {},
  complexityLevel: 'streamlined',
  setComplexityLevel: () => {},
  isStreamlined: true,
  showFirstUseLauncher: true,
  setShowFirstUseLauncher: () => {}
};

export const useUiMode = (): UiModeContextType => {
  const context = useContext(UiModeContext);
  if (!context) {
    return defaultUiModeContext;
  }
  return context;
};
