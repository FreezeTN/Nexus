import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CharacterData, OptionalRulesConfig } from '../types';

export type UserRole = 'Player' | 'DM';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if provided
function initDb() {
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  } catch (e) {
    console.warn('Failed to initialize custom databaseId, falling back to default database:', e);
  }
  return getFirestore(app);
}

export const db = initDb();

// Suppress non-fatal Firestore network warning logs
try {
  setLogLevel('error');
} catch (e) {
  // Ignore if setLogLevel is unhandled
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errObj = error as any;
  const errMsg = errObj?.message || String(error);
  const errCode = errObj?.code || '';

  // Suppress loud errors if client is offline or connection unavailable
  if (
    errCode === 'unavailable' ||
    errCode === 'failed-precondition' ||
    errMsg.includes('offline') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('Could not reach Cloud Firestore')
  ) {
    console.info(`Firestore operation [${operationType}] at [${path || 'unknown'}] operating in offline fallback mode.`);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

function getGoogleProvider(): GoogleAuthProvider {
  return new GoogleAuthProvider();
}

/**
 * Fetch user profile from Firestore users collection
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or update user profile document
 */
export async function createOrUpdateUserProfile(
  user: User, 
  role: UserRole = 'Player', 
  customDisplayName?: string
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  const existing = await getUserProfile(user.uid);
  
  const displayName = customDisplayName || user.displayName || user.email?.split('@')[0] || 'Adventurer';
  
  const profileData: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    role: existing?.role || role,
    photoURL: user.photoURL || undefined,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(userDocRef, profileData, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
  }
  return profileData;
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  if (!uid || uid.startsWith('guest_')) {
    return;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not sync user role to cloud:', err);
  }
}

/**
 * Helper to clean up raw Firebase error messages for display
 */
function parseAuthError(err: any, providerName: string = 'Email'): Error {
  const code = err?.code || '';
  const msg = err?.message || '';
  
  if (
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/operation-not-allowed' ||
    msg.includes('admin-restricted-operation') ||
    msg.includes('operation-not-allowed')
  ) {
    return new Error(`${providerName} authentication is not enabled or restricted in this project. Please use Guest Mode!`);
  }
  
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return new Error('Invalid email or password.');
  }

  if (code === 'auth/email-already-in-use') {
    return new Error('An account with this email address already exists.');
  }

  if (code === 'auth/weak-password') {
    return new Error('Password should be at least 6 characters.');
  }

  return new Error(msg.replace(/^Firebase:\s*/, '') || `${providerName} sign-in failed.`);
}

/**
 * Sign up with Email/Password
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string, role: UserRole): Promise<UserProfile> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName });
    const profile = await createOrUpdateUserProfile(userCredential.user, role, displayName);
    return profile;
  } catch (err: any) {
    throw parseAuthError(err, 'Email');
  }
}

/**
 * Sign in with Email/Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    let profile = await getUserProfile(userCredential.user.uid);
    if (!profile) {
      profile = await createOrUpdateUserProfile(userCredential.user, 'Player');
    }
    return profile;
  } catch (err: any) {
    throw parseAuthError(err, 'Email');
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(roleIfNew: UserRole = 'Player'): Promise<UserProfile> {
  try {
    const provider = getGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    let profile = await getUserProfile(result.user.uid);
    if (!profile) {
      profile = await createOrUpdateUserProfile(result.user, roleIfNew);
    }
    return profile;
  } catch (err: any) {
    throw parseAuthError(err, 'Google');
  }
}

/**
 * Sign in Anonymously (Guest with fallback for restricted operations)
 */
export async function signInAsGuest(role: UserRole = 'Player', displayName: string = 'Guest Adventurer'): Promise<UserProfile> {
  try {
    const userCredential = await signInAnonymously(auth);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      const profile = await createOrUpdateUserProfile(userCredential.user, role, displayName);
      return profile;
    }
  } catch (err: any) {
    console.warn('Firebase Anonymous Auth unavailable or restricted. Falling back to local guest profile:', err);
  }

  // Unconditional fallback for guest mode so it never errors
  const localGuestProfile: UserProfile = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 9),
    email: null,
    displayName: displayName || 'Guest Adventurer',
    role: role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return localGuestProfile;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Error during sign out:', err);
  }
}

/**
 * Cloud Characters helper functions
 */
export async function saveCharacterToCloud(userId: string, character: CharacterData): Promise<void> {
  if (!character || !character.id) return;
  try {
    const charDocRef = doc(db, 'characters', character.id);
    await setDoc(charDocRef, {
      id: character.id,
      ownerId: userId || 'session_user',
      name: character.name,
      edition: character.edition || '5e',
      level: character.level || 1,
      characterClass: character.characterClass || 'Adventurer',
      race: character.race || 'Human',
      data: character,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save character to cloud:', err);
  }
}

export function subscribeToCharacterDoc(
  characterId: string,
  onUpdate: (charData: CharacterData) => void
): () => void {
  if (!characterId) return () => {};
  try {
    const docRef = doc(db, 'characters', characterId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.data) {
            onUpdate(data.data as CharacterData);
          }
        }
      },
      (err) => {
        console.info('Character doc listener info:', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to character doc:', err);
    return () => {};
  }
}

export async function loadUserCharactersFromCloud(userId: string): Promise<CharacterData[]> {
  if (!userId || userId.startsWith('guest_')) return [];
  try {
    const q = query(collection(db, 'characters'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    const characters: CharacterData[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.data) {
        characters.push(data.data as CharacterData);
      }
    });
    return characters;
  } catch (err) {
    console.warn('Error fetching user characters from cloud:', err);
    return [];
  }
}

export async function deleteCharacterFromCloud(characterId: string): Promise<void> {
  if (!characterId) return;
  try {
    await deleteDoc(doc(db, 'characters', characterId));
  } catch (err) {
    console.warn('Error deleting character from cloud:', err);
  }
}

/**
 * Character Presence & Active Session Management
 */
export interface CharacterPresence {
  characterId: string;
  activeUserId?: string;
  activeUserName?: string;
  activeUserRole?: UserRole;
  dmActive?: boolean;
  dmUserId?: string;
  dmUserName?: string;
  updatedAt?: string;
}

const PRESENCE_STORAGE_KEY = 'dnd_character_presence_v2';
const PRESENCE_STALE_MS = 3 * 60 * 1000; // 3 minutes staleness threshold

export function sanitizePresenceMap(map: Record<string, CharacterPresence>): Record<string, CharacterPresence> {
  const sanitized: Record<string, CharacterPresence> = {};
  const now = Date.now();

  Object.entries(map).forEach(([id, entry]) => {
    if (!entry) return;
    const updatedMs = entry.updatedAt ? new Date(entry.updatedAt).getTime() : 0;
    const isStale = !entry.updatedAt || (now - updatedMs > PRESENCE_STALE_MS);

    const copy = { ...entry };

    if (isStale || copy.dmUserId === 'guest_player') {
      copy.dmActive = false;
      copy.dmUserId = undefined;
      copy.dmUserName = undefined;
    }

    if (isStale) {
      copy.activeUserId = undefined;
      copy.activeUserName = undefined;
      copy.activeUserRole = undefined;
    }

    // Ensure DM active user presence does not leave activeUserId set on player slot
    if (copy.activeUserId && copy.dmUserId && copy.activeUserId === copy.dmUserId) {
      copy.activeUserId = undefined;
      copy.activeUserName = undefined;
      copy.activeUserRole = undefined;
    }
    if (copy.activeUserRole === 'DM') {
      copy.activeUserId = undefined;
      copy.activeUserName = undefined;
      copy.activeUserRole = undefined;
    }

    sanitized[id] = copy;
  });

  return sanitized;
}

let presenceBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const BC = (window as any).BroadcastChannel;
    if (typeof BC === 'function') {
      presenceBroadcastChannel = new BC('dnd_character_presence_channel');
    }
  } catch {
    presenceBroadcastChannel = null;
  }
}

/**
 * Subscribe to character presence changes (Firestore + Local Tab Channel)
 */
export function subscribeToCharacterPresence(
  onUpdate: (presenceMap: Record<string, CharacterPresence>) => void
): () => void {
  let firestoreUnsub: (() => void) | null = null;
  let currentMap: Record<string, CharacterPresence> = {};

  const getLocalMap = (): Record<string, CharacterPresence> => {
    try {
      const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  currentMap = sanitizePresenceMap(getLocalMap());
  onUpdate(currentMap);

  // Firestore Snapshot listener
  try {
    firestoreUnsub = onSnapshot(
      collection(db, 'presence'),
      (snapshot) => {
        const cloudMap: Record<string, CharacterPresence> = {};
        snapshot.forEach((doc) => {
          cloudMap[doc.id] = doc.data() as CharacterPresence;
        });
        currentMap = sanitizePresenceMap({ ...currentMap, ...cloudMap });
        onUpdate({ ...currentMap });
      },
      (error) => {
        console.warn('Firestore presence subscription info:', error?.message || error);
      }
    );
  } catch (err) {
    console.warn('Could not start Firestore presence listener:', err);
  }

  // Local Broadcast listener
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'PRESENCE_UPDATE' && event.data?.presenceMap) {
      currentMap = sanitizePresenceMap({ ...currentMap, ...event.data.presenceMap });
      onUpdate({ ...currentMap });
    }
  };

  if (presenceBroadcastChannel) {
    presenceBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === PRESENCE_STORAGE_KEY) {
      currentMap = sanitizePresenceMap(getLocalMap());
      onUpdate({ ...currentMap });
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (firestoreUnsub) firestoreUnsub();
    if (presenceBroadcastChannel) {
      presenceBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Update active character presence for a user (Player or DM)
 */
export async function updateCharacterPresence(
  characterId: string,
  user: { uid: string; displayName: string; role: UserRole },
  previousCharacterId?: string
): Promise<void> {
  if (!characterId) return;

  const timestamp = new Date().toISOString();
  let localMap: Record<string, CharacterPresence> = {};

  try {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    if (raw) localMap = JSON.parse(raw);
  } catch {}

  // Clear DM or Player presence on all other characters in localMap for this user
  Object.keys(localMap).forEach((cId) => {
    if (cId !== characterId) {
      const entry = { ...(localMap[cId] || { characterId: cId }) };
      let changed = false;

      if (user.role === 'DM') {
        if (entry.dmActive || entry.dmUserId === user.uid || entry.dmUserId === 'guest_player') {
          entry.dmActive = false;
          entry.dmUserId = undefined;
          entry.dmUserName = undefined;
          changed = true;
        }
      } else {
        if (entry.activeUserId === user.uid || entry.activeUserId === 'guest_player') {
          entry.activeUserId = undefined;
          entry.activeUserName = undefined;
          entry.activeUserRole = undefined;
          changed = true;
        }
      }

      if (changed) {
        entry.updatedAt = timestamp;
        localMap[cId] = entry;
        try {
          setDoc(doc(db, 'presence', cId), entry, { merge: true });
        } catch {}
      }
    }
  });

  // Handle previousCharacterId explicitly if provided
  if (previousCharacterId && previousCharacterId !== characterId) {
    const prevEntry = { ...(localMap[previousCharacterId] || { characterId: previousCharacterId }) };
    if (user.role === 'DM') {
      prevEntry.dmActive = false;
      prevEntry.dmUserId = undefined;
      prevEntry.dmUserName = undefined;
    } else {
      if (prevEntry.activeUserId === user.uid || prevEntry.activeUserId === 'guest_player') {
        prevEntry.activeUserId = undefined;
        prevEntry.activeUserName = undefined;
        prevEntry.activeUserRole = undefined;
      }
    }
    prevEntry.updatedAt = timestamp;
    localMap[previousCharacterId] = prevEntry;

    try {
      await setDoc(doc(db, 'presence', previousCharacterId), prevEntry, { merge: true });
    } catch {}
  }

  // Update target character entry
  const newEntry = { ...(localMap[characterId] || { characterId }) };
  if (user.role === 'DM') {
    newEntry.dmActive = true;
    newEntry.dmUserId = user.uid;
    newEntry.dmUserName = user.displayName;

    // Clear activeUserId if it belonged to the DM so that it does not block players from selecting the character
    if (newEntry.activeUserId === user.uid || newEntry.activeUserRole === 'DM' || (newEntry.dmUserId && newEntry.activeUserId === newEntry.dmUserId)) {
      newEntry.activeUserId = undefined;
      newEntry.activeUserName = undefined;
      newEntry.activeUserRole = undefined;
    }
  } else {
    newEntry.activeUserId = user.uid;
    newEntry.activeUserName = user.displayName;
    newEntry.activeUserRole = 'Player';

    // Clear DM active status if current user is not DM or if DM session was set by this user / guest_player / stale
    if (
      !newEntry.dmUserId ||
      newEntry.dmUserId === user.uid ||
      newEntry.dmUserId === 'guest_player' ||
      user.uid === 'guest_player' ||
      !newEntry.updatedAt ||
      Date.now() - new Date(newEntry.updatedAt).getTime() > PRESENCE_STALE_MS
    ) {
      newEntry.dmActive = false;
      newEntry.dmUserId = undefined;
      newEntry.dmUserName = undefined;
    }
  }
  newEntry.updatedAt = timestamp;
  localMap[characterId] = newEntry;

  // Persist locally
  try {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(localMap));
  } catch {}

  // Broadcast locally
  if (presenceBroadcastChannel) {
    presenceBroadcastChannel.postMessage({ type: 'PRESENCE_UPDATE', presenceMap: localMap });
  }

  // Sync to Firestore
  try {
    await setDoc(doc(db, 'presence', characterId), newEntry, { merge: true });
  } catch (err) {
    console.warn('Could not sync character presence to Firestore:', err);
  }
}

// ==========================================
// GAME SESSION & LOBBY CODE MANAGEMENT
// ==========================================

export interface SessionMember {
  uid: string;
  displayName: string;
  role: UserRole;
  characterId?: string;
  characterName?: string;
  joinedAt: string;
  isUnassignedParticipant?: boolean;
}

export interface GameSession {
  id: string;
  code: string; // 6-digit room code, e.g. "DRAGON" or "7K9M3P"
  name: string; // Session / Campaign Title
  dmUid: string;
  dmName: string;
  status: 'active' | 'closed';
  members: SessionMember[];
  activeCharacterIds: string[];
  optionalRules?: OptionalRulesConfig; // DM-enforced campaign optional rules for all participants
  createdAt: string;
  updatedAt: string;
}

const ROOM_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude 0, O, 1, I to avoid confusion

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length));
  }
  return code;
}

/**
 * Create a new multiplayer session lobby with a unique 6-digit room code
 */
export async function createGameSession(
  user: { uid: string; displayName: string },
  sessionName: string,
  optionalRules?: OptionalRulesConfig,
  initialParticipantCharacters: { id: string; name: string }[] = []
): Promise<GameSession> {
  const code = generateRoomCode();
  const timestamp = new Date().toISOString();

  const dmMember: SessionMember = {
    uid: user.uid,
    displayName: user.displayName,
    role: 'DM',
    joinedAt: timestamp
  };

  const participantMembers: SessionMember[] = initialParticipantCharacters.map(c => ({
    uid: `npc_char_${c.id}`,
    displayName: `${c.name} (NPC / PC Participant)`,
    role: 'Player',
    characterId: c.id,
    characterName: c.name,
    joinedAt: timestamp,
    isUnassignedParticipant: true
  }));

  const members = [dmMember, ...participantMembers];
  const activeCharacterIds = Array.from(
    new Set(members.map(m => m.characterId).filter(Boolean) as string[])
  );

  const newSession: GameSession = {
    id: code,
    code: code,
    name: sessionName.trim() || 'D&D Adventure Session',
    dmUid: user.uid,
    dmName: user.displayName,
    status: 'active',
    members,
    activeCharacterIds,
    optionalRules: optionalRules || {},
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    await setDoc(doc(db, 'sessions', code), newSession);
  } catch (e) {
    console.error('Error creating session:', e);
    handleFirestoreError(e, OperationType.WRITE, `sessions/${code}`);
    throw e;
  }

  return newSession;
}

/**
 * Update DM-enforced optional rules for a session
 */
export async function updateSessionOptionalRules(
  sessionCode: string,
  optionalRules: OptionalRulesConfig
): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  await updateDoc(sessionRef, {
    optionalRules,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Join an existing session by 6-digit room code
 */
export async function joinGameSessionByCode(
  code: string,
  user: { uid: string; displayName: string; role: UserRole },
  character?: { id: string; name: string }
): Promise<GameSession> {
  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode.length < 4) {
    throw new Error('Please enter a valid Room Code.');
  }

  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) {
    throw new Error(`No active session found with code "${normalizedCode}". Double check with your DM!`);
  }

  const session = snap.data() as GameSession;
  if (session.status === 'closed') {
    throw new Error('This campaign session has been closed by the DM.');
  }

  const timestamp = new Date().toISOString();
  let updatedMembers = [...(session.members || [])];
  const existingIndex = updatedMembers.findIndex(m => m.uid === user.uid);

  const memberData: SessionMember = {
    uid: user.uid,
    displayName: user.displayName,
    role: user.role,
    characterId: character?.id || (existingIndex >= 0 ? updatedMembers[existingIndex].characterId : undefined),
    characterName: character?.name || (existingIndex >= 0 ? updatedMembers[existingIndex].characterName : undefined),
    joinedAt: existingIndex >= 0 ? updatedMembers[existingIndex].joinedAt : timestamp
  };

  if (existingIndex >= 0) {
    updatedMembers[existingIndex] = memberData;
  } else {
    updatedMembers.push(memberData);
  }

  // Recalculate active character IDs
  const activeCharacterIds = Array.from(
    new Set(updatedMembers.map(m => m.characterId).filter(Boolean) as string[])
  );

  const updatedSession: GameSession = {
    ...session,
    members: updatedMembers,
    activeCharacterIds,
    updatedAt: timestamp
  };

  await setDoc(sessionRef, updatedSession, { merge: true });
  return updatedSession;
}

/**
 * Subscribe to real-time session changes for a given room code
 */
export function subscribeToGameSession(
  sessionCode: string,
  onUpdate: (session: GameSession | null) => void
): () => void {
  if (!sessionCode) {
    onUpdate(null);
    return () => {};
  }

  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);

  return onSnapshot(sessionRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as GameSession);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('Session snapshot error:', err);
    onUpdate(null);
  });
}

/**
 * Update member character in an active session
 */
export async function updateSessionMemberCharacter(
  sessionCode: string,
  uid: string,
  character: { id: string; name: string }
): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return;
  const session = snap.data() as GameSession;

  const updatedMembers = session.members.map(m => {
    if (m.uid === uid) {
      return {
        ...m,
        characterId: character.id,
        characterName: character.name
      };
    }
    return m;
  });

  const activeCharacterIds = Array.from(
    new Set(updatedMembers.map(m => m.characterId).filter(Boolean) as string[])
  );

  await updateDoc(sessionRef, {
    members: updatedMembers,
    activeCharacterIds,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Leave a game session
 */
export async function leaveGameSession(sessionCode: string, uid: string): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return;
  const session = snap.data() as GameSession;

  const updatedMembers = session.members.filter(m => m.uid !== uid);
  const activeCharacterIds = Array.from(
    new Set(updatedMembers.map(m => m.characterId).filter(Boolean) as string[])
  );

  await updateDoc(sessionRef, {
    members: updatedMembers,
    activeCharacterIds,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Close a game session (DM only)
 */
export async function closeGameSession(sessionCode: string, dmUid: string): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return;
  const session = snap.data() as GameSession;

  if (session.dmUid !== dmUid) {
    throw new Error('Only the DM who created this session can close it.');
  }

  await updateDoc(sessionRef, {
    status: 'closed',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Add an unassigned existing player character or NPC to a session as a participant (DM function)
 */
export async function addParticipantCharacterToSession(
  sessionCode: string,
  character: { id: string; name: string }
): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return;
  const session = snap.data() as GameSession;

  const timestamp = new Date().toISOString();
  const participantUid = `npc_char_${character.id}`;

  let updatedMembers = [...(session.members || [])];
  const existingIndex = updatedMembers.findIndex(
    m => m.characterId === character.id || m.uid === participantUid
  );

  const participantMember: SessionMember = {
    uid: participantUid,
    displayName: `${character.name} (Participant)`,
    role: 'Player',
    characterId: character.id,
    characterName: character.name,
    joinedAt: timestamp,
    isUnassignedParticipant: true
  };

  if (existingIndex >= 0) {
    updatedMembers[existingIndex] = participantMember;
  } else {
    updatedMembers.push(participantMember);
  }

  const activeCharacterIds = Array.from(
    new Set(updatedMembers.map(m => m.characterId).filter(Boolean) as string[])
  );

  await updateDoc(sessionRef, {
    members: updatedMembers,
    activeCharacterIds,
    updatedAt: timestamp
  });
}

/**
 * Remove a participant character from a session
 */
export async function removeParticipantCharacterFromSession(
  sessionCode: string,
  characterIdOrUid: string
): Promise<void> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  const sessionRef = doc(db, 'sessions', normalizedCode);
  const snap = await getDoc(sessionRef);

  if (!snap.exists()) return;
  const session = snap.data() as GameSession;

  const updatedMembers = (session.members || []).filter(
    m => m.uid !== characterIdOrUid && m.characterId !== characterIdOrUid
  );

  const activeCharacterIds = Array.from(
    new Set(updatedMembers.map(m => m.characterId).filter(Boolean) as string[])
  );

  await updateDoc(sessionRef, {
    members: updatedMembers,
    activeCharacterIds,
    updatedAt: new Date().toISOString()
  });
}

