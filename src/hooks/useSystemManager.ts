import { useState, useEffect } from 'react';
import { RuleEdition, CharacterData } from '../types';
import { eventBus } from '../events/eventBus';

const STORAGE_KEY_ENABLED_SYSTEMS = 'dnd_app_enabled_systems_v2';

interface UseSystemManagerProps {
  characters: CharacterData[];
  activeCharacter: CharacterData | null;
  onSelectCharacterId?: (id: string) => void;
}

export function useSystemManager({
  characters,
  activeCharacter,
  onSelectCharacterId
}: UseSystemManagerProps) {
  const [enabledSystems, setEnabledSystems] = useState<RuleEdition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENABLED_SYSTEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load enabled TRPG systems from localStorage', e);
    }
    return ['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu'];
  });

  const [hasConfiguredSystems, setHasConfiguredSystems] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ENABLED_SYSTEMS) !== null;
    } catch (e) {
      return false;
    }
  });

  const [previewTheme, setPreviewTheme] = useState<RuleEdition | null>(null);

  const currentSystemTheme: RuleEdition = previewTheme || activeCharacter?.edition || '5e';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentSystemTheme);
  }, [currentSystemTheme]);

  useEffect(() => {
    document.title = 'Nexus';
  }, []);

  const handleSaveTRPGSystems = (selected: RuleEdition[]) => {
    setEnabledSystems(selected);
    setHasConfiguredSystems(true);

    selected.forEach(sysId => {
      eventBus.emit('SystemPluginToggled', { pluginId: sysId, enabled: true });
    });

    try {
      localStorage.setItem(STORAGE_KEY_ENABLED_SYSTEMS, JSON.stringify(selected));
    } catch (e) {
      console.error('Failed to save enabled systems to localStorage', e);
    }

    if (!selected.includes(currentSystemTheme)) {
      setPreviewTheme(selected[0]);
    }
    if (activeCharacter && !selected.includes(activeCharacter.edition || '5e')) {
      const firstMatchingChar = characters.find(c => selected.includes(c.edition || '5e'));
      if (firstMatchingChar && onSelectCharacterId) {
        onSelectCharacterId(firstMatchingChar.id);
      }
    }
  };

  const handleSystemChange = (newSystem: RuleEdition) => {
    setPreviewTheme(newSystem);
    const matching = characters.find(c => (c.edition || '5e') === newSystem);
    if (matching && onSelectCharacterId) {
      onSelectCharacterId(matching.id);
    }
  };

  return {
    enabledSystems,
    setEnabledSystems,
    hasConfiguredSystems,
    previewTheme,
    setPreviewTheme,
    currentSystemTheme,
    handleSaveTRPGSystems,
    handleSystemChange
  };
}
