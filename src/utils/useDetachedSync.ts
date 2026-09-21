import { useEffect } from 'react';
import { CharacterData, Party } from '../types';

export interface DetachedSyncMessage {
  type: 'SYNC_STATE' | 'CHARACTER_UPDATE' | 'ACTIVE_CHAR_CHANGE' | 'ROLL_EVENT';
  characters?: CharacterData[];
  activeCharacterId?: string;
  parties?: Party[];
  timestamp?: number;
}

const CHANNEL_NAME = 'penpaper_detached_sync_v1';

export function getDetachedParams(): { detachedTab: string | null; initialCharId: string | null; sessionCode: string | null } {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      detachedTab: urlParams.get('detached') || urlParams.get('detachedTab'),
      initialCharId: urlParams.get('charId') || urlParams.get('initialCharId'),
      sessionCode: urlParams.get('session')
    };
  } catch (e) {
    return { detachedTab: null, initialCharId: null, sessionCode: null };
  }
}

export function openDetachedWindow(tabId: string, activeCharId?: string, sessionCode?: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set('detached', tabId);
  url.searchParams.set('detachedTab', tabId);
  if (activeCharId) {
    url.searchParams.set('charId', activeCharId);
    url.searchParams.set('initialCharId', activeCharId);
  }
  if (sessionCode) url.searchParams.set('session', sessionCode);

  const isMap = tabId === 'battlemap';
  const width = isMap
    ? Math.min(1600, Math.round(window.screen.width * 0.95))
    : Math.min(1280, Math.round(window.screen.width * 0.85));
  const height = isMap
    ? Math.min(1000, Math.round(window.screen.height * 0.95))
    : Math.min(850, Math.round(window.screen.height * 0.85));
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const features = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`;
  
  const popWin = window.open(url.toString(), `detached_${tabId}`, features);
  
  if (!popWin || popWin.closed || typeof popWin.closed === 'undefined') {
    // If popup was blocked by browser policies, fallback to opening in new tab
    window.open(url.toString(), '_blank');
  } else {
    popWin.focus();
  }
  return popWin;
}

export const ENCOUNTER_SYNC_CHANNEL_NAME = 'penpaper_encounter_sync_v1';

export interface EncounterSyncMessage {
  type: 'ENCOUNTER_SYNC';
  charKey: string;
  encounterData: any;
  instanceId: string;
  timestamp: number;
}

export function broadcastEncounterState(charKey: string, encounterData: any, instanceId: string) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(ENCOUNTER_SYNC_CHANNEL_NAME);
      channel.postMessage({
        type: 'ENCOUNTER_SYNC',
        charKey,
        encounterData,
        instanceId,
        timestamp: Date.now()
      });
      channel.close();
    }
  } catch (e) {
    // ignore
  }
}

export function broadcastStateUpdate(characters: CharacterData[], activeCharacterId: string, parties?: Party[]) {
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({
        type: 'SYNC_STATE',
        characters,
        activeCharacterId,
        parties,
        timestamp: Date.now()
      });
      channel.close();
    }
  } catch (e) {
    console.warn('BroadcastChannel sync unavailable:', e);
  }
}

export function useDetachedSyncListener(
  onStateReceived: (characters: CharacterData[], activeId: string, parties?: Party[]) => void
) {
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<DetachedSyncMessage>) => {
        if (event.data && event.data.type === 'SYNC_STATE' && event.data.characters) {
          onStateReceived(
            event.data.characters,
            event.data.activeCharacterId || '',
            event.data.parties
          );
        }
      };
    }

    // Fallback storage event listener for cross-window localStorage sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dnd_app_characters_v5' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const activeId = localStorage.getItem('dnd_app_active_id_v4') || '';
            onStateReceived(parsed, activeId);
          }
        } catch (err) {
          console.error('Error parsing storage sync:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onStateReceived]);
}
