import { BattlemapLayout } from '../components/battlemap/battlemapTypes';
import { PRESET_BATTLEMAP_LAYOUTS } from '../components/battlemap/battlemapPresets';
import { db, auth, sanitizeForFirestore } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'dnd_saved_battlemap_layouts_v1';

/**
 * Loads all local layouts stored in browser localStorage.
 */
export function getLocalLayouts(): BattlemapLayout[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((l) => l && typeof l.name === 'string' && l.config && l.terrainMap);
    }
  } catch (err) {
    console.warn('Failed to parse local battlemap layouts:', err);
  }
  return [];
}

/**
 * Persists layout array to browser localStorage.
 */
export function setLocalLayouts(layouts: BattlemapLayout[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layouts));
  } catch (err) {
    console.warn('Failed to write to localStorage for battlemap layouts:', err);
  }
}

/**
 * Fetches all custom layouts for the current user, merging LocalStorage and Firestore.
 */
export async function fetchAllCustomLayouts(userId?: string): Promise<BattlemapLayout[]> {
  const localList = getLocalLayouts();
  const mapById = new Map<string, BattlemapLayout>();

  localList.forEach((l) => mapById.set(l.id, l));

  // If user is authenticated in Firestore, query remote layouts
  const effectiveUid = userId || auth.currentUser?.uid;
  if (effectiveUid) {
    try {
      const q = query(
        collection(db, 'battlemap_layouts'),
        where('authorId', '==', effectiveUid)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.name && data.config) {
          const layout: BattlemapLayout = {
            id: docSnap.id,
            name: data.name,
            description: data.description || '',
            category: data.category || 'custom',
            authorId: data.authorId || effectiveUid,
            authorName: data.authorName || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            isBuiltin: false,
            isPublic: Boolean(data.isPublic),
            config: data.config,
            terrainMap: data.terrainMap || {},
            doors: data.doors || {},
            fogOfWar: data.fogOfWar || {},
            useFogOfWar: Boolean(data.useFogOfWar),
            activeAoE: data.activeAoE || null,
            tokens: data.tokens || []
          };
          mapById.set(layout.id, layout);
        }
      });
    } catch (err) {
      console.warn('Could not fetch remote battlemap layouts (using local fallback):', err);
    }
  }

  const merged = Array.from(mapById.values()).sort((a, b) => {
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  // Keep localStorage in sync with merged list
  setLocalLayouts(merged);
  return merged;
}

/**
 * Saves or updates a battlemap layout to LocalStorage and Firestore.
 */
export async function saveBattlemapLayout(layout: BattlemapLayout): Promise<BattlemapLayout> {
  const currentList = getLocalLayouts();
  const now = new Date().toISOString();
  const updatedLayout: BattlemapLayout = {
    ...layout,
    updatedAt: now,
    createdAt: layout.createdAt || now
  };

  const existingIndex = currentList.findIndex((l) => l.id === updatedLayout.id);
  if (existingIndex >= 0) {
    currentList[existingIndex] = updatedLayout;
  } else {
    currentList.unshift(updatedLayout);
  }
  setLocalLayouts(currentList);

  // Firestore sync
  const effectiveUid = layout.authorId || auth.currentUser?.uid;
  if (effectiveUid) {
    try {
      const docRef = doc(db, 'battlemap_layouts', updatedLayout.id);
      const payload = sanitizeForFirestore({
        id: updatedLayout.id,
        authorId: effectiveUid,
        authorName: updatedLayout.authorName || auth.currentUser?.displayName || 'DM',
        name: updatedLayout.name,
        description: updatedLayout.description || '',
        category: updatedLayout.category || 'custom',
        isPublic: Boolean(updatedLayout.isPublic),
        createdAt: updatedLayout.createdAt,
        updatedAt: updatedLayout.updatedAt,
        config: updatedLayout.config,
        terrainMap: updatedLayout.terrainMap,
        doors: updatedLayout.doors,
        fogOfWar: updatedLayout.fogOfWar,
        useFogOfWar: Boolean(updatedLayout.useFogOfWar),
        activeAoE: updatedLayout.activeAoE || null,
        tokens: updatedLayout.tokens || []
      });
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn('Failed to sync battlemap layout to Firestore (persisted locally):', err);
    }
  }

  return updatedLayout;
}

/**
 * Deletes a battlemap layout from LocalStorage and Firestore.
 */
export async function deleteBattlemapLayout(layoutId: string): Promise<void> {
  const currentList = getLocalLayouts().filter((l) => l.id !== layoutId);
  setLocalLayouts(currentList);

  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, 'battlemap_layouts', layoutId));
    } catch (err) {
      console.warn('Failed to delete battlemap layout from Firestore:', err);
    }
  }
}

/**
 * Triggers a browser file download for a single layout as a JSON file.
 */
export function exportLayoutToJson(layout: BattlemapLayout): void {
  const cleanFilename = `${layout.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_map.json`;
  const exportData = {
    schemaVersion: '1.0',
    type: 'dnd_battlemap_layout',
    exportedAt: new Date().toISOString(),
    layout
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser file download for all custom layouts.
 */
export function exportAllLayoutsToJson(layouts: BattlemapLayout[]): void {
  const cleanFilename = `all_battlemap_layouts_${new Date().toISOString().slice(0, 10)}.json`;
  const exportData = {
    schemaVersion: '1.0',
    type: 'dnd_battlemap_layouts_bundle',
    exportedAt: new Date().toISOString(),
    count: layouts.length,
    layouts
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports a layout from JSON text.
 */
export function parseLayoutFromJson(rawText: string): BattlemapLayout[] {
  const parsed = JSON.parse(rawText);

  // Check if it's a bundle
  if (parsed.type === 'dnd_battlemap_layouts_bundle' && Array.isArray(parsed.layouts)) {
    return parsed.layouts.map(normalizeImportedLayout);
  }

  // Check if it's a wrapped single layout
  if (parsed.layout && typeof parsed.layout.name === 'string') {
    return [normalizeImportedLayout(parsed.layout)];
  }

  // Check if it's a direct layout object
  if (typeof parsed.name === 'string' && parsed.config && parsed.terrainMap) {
    return [normalizeImportedLayout(parsed)];
  }

  throw new Error('Unrecognized battlemap layout file format. Missing required layout fields.');
}

function normalizeImportedLayout(raw: any): BattlemapLayout {
  const uniqueId = `layout_imported_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: uniqueId,
    name: String(raw.name || 'Imported Battlemap'),
    description: raw.description ? String(raw.description) : 'Imported battlemap layout',
    category: raw.category || 'custom',
    authorId: auth.currentUser?.uid,
    authorName: auth.currentUser?.displayName || 'DM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isBuiltin: false,
    config: {
      id: raw.config?.id || uniqueId,
      title: raw.config?.title || raw.name || 'Battlemap',
      gridColumns: Math.max(10, Math.min(60, Number(raw.config?.gridColumns) || 24)),
      gridRows: Math.max(10, Math.min(60, Number(raw.config?.gridRows) || 16)),
      feetPerSquare: Number(raw.config?.feetPerSquare) || 5,
      gridType: raw.config?.gridType || 'square',
      theme: raw.config?.theme || 'dungeon',
      diagonalRule: raw.config?.diagonalRule || 'standard5e',
      showCoordinates: Boolean(raw.config?.showCoordinates ?? raw.config?.showGridNumbers ?? true),
      showMovementRings: Boolean(raw.config?.showMovementRings ?? true),
      showReachableGrid: Boolean(raw.config?.showReachableGrid ?? true),
      snapToGrid: Boolean(raw.config?.snapToGrid ?? true),
      backgroundImageUrl: raw.config?.backgroundImageUrl || undefined
    },
    terrainMap: typeof raw.terrainMap === 'object' && raw.terrainMap ? raw.terrainMap : {},
    doors: typeof raw.doors === 'object' && raw.doors ? raw.doors : {},
    fogOfWar: typeof raw.fogOfWar === 'object' && raw.fogOfWar ? raw.fogOfWar : {},
    useFogOfWar: Boolean(raw.useFogOfWar),
    activeAoE: raw.activeAoE || null,
    tokens: Array.isArray(raw.tokens) ? raw.tokens : []
  };
}
