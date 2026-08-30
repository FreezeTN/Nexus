import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, getUserProfile, UserProfile, loadUserCharactersFromCloud } from '../lib/firebase';
import { CharacterData } from '../types';

interface UseAuthManagerProps {
  onCloudCharactersLoaded?: (cloudChars: CharacterData[]) => void;
}

export function useAuthManager({ onCloudCharactersLoaded }: UseAuthManagerProps = {}) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setCurrentUser(profile);

        if (onCloudCharactersLoaded) {
          try {
            const cloudChars = await loadUserCharactersFromCloud(firebaseUser.uid);
            if (cloudChars && cloudChars.length > 0) {
              onCloudCharactersLoaded(cloudChars);
            }
          } catch (err) {
            console.error('Failed to load user cloud characters:', err);
          }
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [onCloudCharactersLoaded]);

  return {
    currentUser,
    setCurrentUser
  };
}
