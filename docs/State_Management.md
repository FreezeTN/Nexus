# State Management & History Engine

## Overview
Pen & Paper Platform uses a hybrid reactive state management strategy combining React state, localStorage caching, Firebase Firestore cloud sync, and an atomic Undo/Redo history stack.

## Undo / Redo History Stack (`useHistoryState`)

The `useHistoryState` hook manages an immutable timeline of state snapshots.

```typescript
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}
```

### Features
- **Max Snapshot Buffer**: Caps historical depth (default: 30 snapshots) to preserve memory while providing full session rollbacks.
- **Global Keyboard Bindings**: `Ctrl+Z` (Undo) and `Ctrl+Y` / `Cmd+Shift+Z` (Redo).
- **Scope**: Applied to character changes, inventory edits, quest updates, and world modifications.

## Storage Persistence Layers

1. **Local Key-Value Storage**:
   - `dnd_sheet_characters_v2`: Active PC list & stats.
   - `dnd_sheet_active_char_id`: Selected active character.
   - `penpaper_enabled_systems_v3`: Active TRPG plugins.
   - `penpaper_pinned_widgets_v1`: Pinned workspace layout widgets.

2. **Cloud Database (Firebase Firestore)**:
   - Synchronizes multiplayer campaign sessions, live party initiative order, shared party inventory, and DM campaign notes.
