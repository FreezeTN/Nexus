import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type HighContrastMode = 'off' | 'increased' | 'maximum';
export type FontSizeScale = 'standard' | 'large' | 'extra-large';

export interface AccessibilitySettings {
  highContrast: HighContrastMode;
  fontSizeScale: FontSizeScale;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  dyslexicFont: boolean;
  focusRingsEnhanced: boolean;
  soundCueVisualFlash: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: 'off',
  fontSizeScale: 'standard',
  reducedMotion: false,
  screenReaderOptimized: false,
  dyslexicFont: false,
  focusRingsEnhanced: true,
  soundCueVisualFlash: false,
};

const STORAGE_KEY = 'nexus_a11y_settings_v1';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetAccessibility: () => void;
  announceLiveMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  liveMessage: { text: string; priority: 'polite' | 'assertive'; id: number } | null;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }

    // Detect system prefers-reduced-motion
    let initialReducedMotion = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      initialReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    return {
      ...DEFAULT_SETTINGS,
      reducedMotion: initialReducedMotion,
    };
  });

  const [liveMessage, setLiveMessage] = useState<{ text: string; priority: 'polite' | 'assertive'; id: number } | null>(null);

  const announceLiveMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setLiveMessage({
      text: message,
      priority,
      id: Date.now() + Math.random(),
    });
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const resetAccessibility = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Synchronize CSS attributes on root document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.setAttribute('data-a11y-contrast', settings.highContrast);
    root.setAttribute('data-a11y-font-scale', settings.fontSizeScale);
    root.setAttribute('data-a11y-reduced-motion', settings.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-a11y-dyslexic-font', settings.dyslexicFont ? 'true' : 'false');
    root.setAttribute('data-a11y-focus-rings', settings.focusRingsEnhanced ? 'true' : 'false');
    root.setAttribute('data-a11y-screen-reader', settings.screenReaderOptimized ? 'true' : 'false');
  }, [settings]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetAccessibility,
        announceLiveMessage,
        liveMessage,
      }}
    >
      {children}
      {/* Live Region for Screen Readers */}
      <div
        id="nexus-a11y-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only pointer-events-none fixed inset-0 overflow-hidden"
      >
        {liveMessage?.priority === 'polite' ? liveMessage.text : ''}
      </div>
      <div
        id="nexus-a11y-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only pointer-events-none fixed inset-0 overflow-hidden"
      >
        {liveMessage?.priority === 'assertive' ? liveMessage.text : ''}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
