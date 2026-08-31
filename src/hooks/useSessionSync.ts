import { useState, useEffect } from 'react';
import { GameSession, subscribeToGameSession, subscribeToCharacterDoc, restoreGameSessionFromSave, UserProfile } from '../lib/firebase';
import { CharacterData, CampaignSaveFile } from '../types';

interface UseSessionSyncProps {
  currentUser: UserProfile | null;
  activeSessionCode?: string | null;
  setActiveSessionCode?: React.Dispatch<React.SetStateAction<string | null>>;
  setCharacters: React.Dispatch<React.SetStateAction<CharacterData[]>>;
  onSelectCharacter?: (id: string) => void;
  onSetPreviewTheme?: (theme: any) => void;
}

export function useSessionSync({
  currentUser,
  activeSessionCode: externalSessionCode,
  setActiveSessionCode: setExternalSessionCode,
  setCharacters,
  onSelectCharacter,
  onSetPreviewTheme
}: UseSessionSyncProps) {
  // Session Lobby & Room Code State
  const [internalSessionCode, setInternalSessionCode] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionFromUrl = urlParams.get('session');
      if (sessionFromUrl) return sessionFromUrl.toUpperCase();
      return localStorage.getItem('dnd_app_session_code_v1') || null;
    } catch (e) {
      return null;
    }
  });

  const activeSessionCode = externalSessionCode !== undefined ? externalSessionCode : internalSessionCode;
  const setActiveSessionCode = setExternalSessionCode || setInternalSessionCode;

  const [activeSession, setActiveSession] = useState<GameSession | null>(null);

  const [showSessionModal, setShowSessionModal] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('session');
    } catch (e) {
      return false;
    }
  });

  // Subscribe to real-time session changes
  useEffect(() => {
    if (!activeSessionCode) {
      setActiveSession(null);
      localStorage.removeItem('dnd_app_session_code_v1');
      return;
    }

    localStorage.setItem('dnd_app_session_code_v1', activeSessionCode);
    const unsubscribe = subscribeToGameSession(activeSessionCode, (session) => {
      if (!session || session.status === 'closed') {
        setActiveSession(null);
        setActiveSessionCode(null);
        localStorage.removeItem('dnd_app_session_code_v1');
      } else {
        setActiveSession(session);
      }
    });

    return () => unsubscribe();
  }, [activeSessionCode]);

  // Realtime Firestore character subscription for active session members
  useEffect(() => {
    if (!activeSession || !activeSession.members || activeSession.members.length === 0) return;

    const charIds = Array.from(
      new Set(activeSession.members.map(m => m.characterId).filter(Boolean) as string[])
    );

    if (charIds.length === 0) return;

    const unsubs = charIds.map(id => {
      return subscribeToCharacterDoc(id, (updatedCloudChar) => {
        setCharacters(prev => {
          const index = prev.findIndex(c => c.id === updatedCloudChar.id);
          if (index >= 0) {
            const existing = prev[index];
            if (JSON.stringify(existing) === JSON.stringify(updatedCloudChar)) {
              return prev;
            }
            // Protect against reverting newer local character edits with older cloud snapshots
            if (existing && existing.updatedAt && updatedCloudChar.updatedAt) {
              const localTime = new Date(existing.updatedAt).getTime();
              const cloudTime = new Date(updatedCloudChar.updatedAt).getTime();
              if (localTime >= cloudTime) {
                return prev;
              }
            }
            const copy = [...prev];
            copy[index] = updatedCloudChar;
            return copy;
          } else {
            return [updatedCloudChar, ...prev];
          }
        });
      });
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [activeSession, setCharacters]);

  const isDm = Boolean(currentUser && activeSession && activeSession.dmUid === currentUser.uid);

  const handleLoadCampaignSave = async (save: CampaignSaveFile) => {
    if (!save || !save.characters) return;

    setCharacters((prev: CharacterData[]) => {
      const charMap = new Map<string, CharacterData>();
      prev.forEach(c => charMap.set(c.id, c));
      save.characters.forEach(sc => charMap.set(sc.id, sc));
      const updated = Array.from(charMap.values());
      try {
        localStorage.setItem('dnd_app_characters_v5', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (save.edition && onSetPreviewTheme) {
      onSetPreviewTheme(save.edition);
    }

    if (save.characters.length > 0 && onSelectCharacter) {
      onSelectCharacter(save.characters[0].id);
    }

    // Restore multiplayer session state
    try {
      const restored = await restoreGameSessionFromSave(
        save,
        currentUser ? { uid: currentUser.uid, displayName: currentUser.displayName } : null
      );
      setActiveSession(restored);
      setActiveSessionCode(restored.code);
    } catch (e) {
      console.warn('Could not restore session to Firestore, setting code:', e);
      if (save.sessionCode) {
        setActiveSessionCode(save.sessionCode);
      }
    }
  };

  return {
    activeSessionCode,
    setActiveSessionCode,
    activeSession,
    setActiveSession,
    showSessionModal,
    setShowSessionModal,
    isDm,
    handleLoadCampaignSave
  };
}
