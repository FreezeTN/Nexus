import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserProfile, 
  SubscriptionTier,
  subscribeToCustomHomebrew, 
  loadCustomHomebrewFromCloud, 
  syncAllLocalHomebrewToCloud, 
  isUserEligibleForHomebrewSync 
} from '../lib/firebase';
import { 
  loadCustomCompendiumEntries, 
  mergeCloudHomebrewIntoLocal, 
  CompendiumItem 
} from '../data/compendiumData';
import { eventBus } from '../events/eventBus';

export type HomebrewSyncStatus = 'synced' | 'syncing' | 'local_cache' | 'offline';

export interface UseHomebrewSyncResult {
  syncStatus: HomebrewSyncStatus;
  isCloudSynced: boolean;
  isSubscribedUser: boolean;
  itemCount: number;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}

/**
 * Hook that manages the conditional synchronization of custom homebrew compendium entries.
 * - Subscribed users ('hero', 'guild', 'developer', 'tester'): automatically synchronizes with Firestore database across devices.
 * - Unsubscribed / Free users: strictly retains custom homebrew inside the browser local cache without syncing to the database.
 */
export function useHomebrewSync(
  currentUser: UserProfile | null,
  userTier?: SubscriptionTier
): UseHomebrewSyncResult {
  const [syncStatus, setSyncStatus] = useState<HomebrewSyncStatus>('local_cache');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [itemCount, setItemCount] = useState<number>(() => loadCustomCompendiumEntries().length);
  const initialSyncAttemptedRef = useRef(false);

  const isSubscribedUser = isUserEligibleForHomebrewSync(currentUser);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    if (!currentUser || !isSubscribedUser) {
      setSyncStatus('local_cache');
      setItemCount(loadCustomCompendiumEntries().length);
      return;
    }

    setSyncStatus('syncing');
    try {
      // 1. Fetch cloud entries
      const cloudItems = await loadCustomHomebrewFromCloud(currentUser.uid, userTier, currentUser);
      
      // 2. Fetch local items
      const localItems = loadCustomCompendiumEntries();

      // 3. Upload any local items not yet present in the cloud
      const cloudIds = new Set(cloudItems.map(i => i.id));
      const unSyncedLocal = localItems.filter(i => !cloudIds.has(i.id));
      if (unSyncedLocal.length > 0) {
        await syncAllLocalHomebrewToCloud(currentUser.uid, unSyncedLocal, userTier, currentUser);
      }

      // 4. Merge all and update local cache
      const merged = mergeCloudHomebrewIntoLocal(cloudItems);
      setItemCount(merged.length);
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
      eventBus.emit('CompendiumUpdated', {});
    } catch (err) {
      console.warn('Manual homebrew cloud sync error:', err);
      setSyncStatus('local_cache');
    }
  }, [currentUser, isSubscribedUser, userTier]);

  // Real-time listener for subscribed users
  useEffect(() => {
    if (!currentUser || !currentUser.uid || !isSubscribedUser) {
      setSyncStatus('local_cache');
      setItemCount(loadCustomCompendiumEntries().length);
      initialSyncAttemptedRef.current = false;
      return;
    }

    setSyncStatus('syncing');

    // Subscribe to Firestore changes
    const unsubscribe = subscribeToCustomHomebrew(
      currentUser.uid,
      (cloudItems) => {
        if (Array.isArray(cloudItems)) {
          const merged = mergeCloudHomebrewIntoLocal(cloudItems);
          setItemCount(merged.length);
          setLastSyncedAt(new Date());
          setSyncStatus('synced');
          eventBus.emit('CompendiumUpdated', {});
        }
      },
      userTier,
      currentUser
    );

    // Initial sync of existing local items to cloud if this is the first login as subscribed user
    if (!initialSyncAttemptedRef.current) {
      initialSyncAttemptedRef.current = true;
      const localItems = loadCustomCompendiumEntries();
      if (localItems.length > 0) {
        syncAllLocalHomebrewToCloud(currentUser.uid, localItems, userTier, currentUser)
          .then(() => {
            setLastSyncedAt(new Date());
            setSyncStatus('synced');
          })
          .catch((err) => {
            console.warn('Initial local-to-cloud homebrew sync notice:', err);
          });
      } else {
        setSyncStatus('synced');
      }
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser, isSubscribedUser, userTier]);

  // Update count when local compendium updates
  useEffect(() => {
    const handleCompendiumUpdate = () => {
      setItemCount(loadCustomCompendiumEntries().length);
    };
    eventBus.on('CompendiumUpdated', handleCompendiumUpdate);
    return () => {
      eventBus.off('CompendiumUpdated', handleCompendiumUpdate);
    };
  }, []);

  return {
    syncStatus: isSubscribedUser ? syncStatus : 'local_cache',
    isCloudSynced: isSubscribedUser && syncStatus === 'synced',
    isSubscribedUser,
    itemCount,
    lastSyncedAt,
    syncNow
  };
}
