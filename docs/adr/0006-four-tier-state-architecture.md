# [ADR-0006] Four-Tier State Separation Architecture (Server -> Domain -> UI -> Transient)

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
In high-concurrency real-time web applications with WebRTC voice, synchronized dice broadcasting, Firestore cloud data, and rich interactive canvas components, blurring different types of state into a single global store causes significant maintenance challenges, race conditions, accidental data overwrites, and poor frame rates.

Treating transient animations (like 3D dice physics in-flight or voice audio speaking levels) the same as domain state (character stat rules) or server state (Firestore document replication) leads to high Firebase write costs, UI jitter, and complex debugging.

## Decision Drivers
* Formally decouple state into four distinct, hierarchically descending layers.
* Prevent transient/high-frequency updates from triggering synchronous database writes.
* Keep domain calculations pure, testable, and independent of React component rendering.
* Improve developer clarity regarding where a piece of state belongs.

## Decision Outcome
Adopted a strict **Four-Tier State Architecture** defined under `src/state/`:

```text
1. Server State   (Durable cloud persistence, Firestore session rooms, remote user profiles)
        ↓
2. Domain State   (TRPG entities, character sheets, inventory, stat calculation graph, combat engines)
        ↓
3. UI State       (View routing, tab selection, modal coordinators, form drafts, theme choices)
        ↓
4. Transient State (High-frequency 3D dice physics, WebRTC audio levels, tooltips, toasts)
```

### Layer Responsibilities

1. **Server State (`src/lib/firebase.ts`, `src/repositories/`, `useSessionSync`)**:
   - Manages asynchronous network boundaries, replication status, conflict resolution, and authentication tokens.
   - Sync target: Cloud Firestore & Firebase Auth.

2. **Domain State (`src/services/`, `src/types.ts`, `src/utils/dndCalculations.ts`)**:
   - Pure business models for tabletop rules (Armor Class calculation, encumbrance, spell slots, condition penalties).
   - Sync target: Local IndexedDB / LocalStorage / Redux/Custom Store.

3. **UI State (`src/context/`, `useModalCoordinator.ts`, `Navigation.tsx`)**:
   - View preferences, active navigation tabs, open modal dialogs, search/filter terms, and uncommitted form drafts.
   - Sync target: In-memory React Context & Local Storage preferences.

4. **Transient State (`src/hooks/useDiceEngine.ts`, `PartyVoiceWidget.tsx`, `GlobalDiceOverlay.tsx`)**:
   - Frame-rate sensitive, ephemeral data (requestAnimationFrame loops, Web Audio volume decibels, particle effects).
   - Sync target: Browser memory & Animation Frames (never directly persisted).

### Positive Consequences
* Clear boundaries prevent accidental expensive Firestore writes from transient events.
* Components can cleanly subscribe only to the tier of state they need.
* Domain rules can be tested independently in pure TypeScript without mocking React or Firebase.
