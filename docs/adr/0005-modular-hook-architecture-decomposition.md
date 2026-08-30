# [ADR-0005] Modular Custom Hook Architecture Decomposition (App.tsx)

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
As the Nexus platform expanded to support multi-system TRPG character sheets, real-time multiplayer session syncing, cross-window multi-monitor detachment, WebRTC voice chat, and modular plugins, `App.tsx` risked becoming a "God Object" coordinating excessive independent concerns (auth, character state, session syncing, physical/digital dice calculation, and modal lifecycles).

## Decision Drivers
* Decompose monolithic state in `App.tsx` into single-responsibility, reusable custom hooks.
* Prevent performance bottlenecks and unnecessary component re-renders.
* Maintain clean developer velocity and ease of onboarding for new contributors.

## Decision Outcome
Decomposed `App.tsx` into six dedicated hooks under `src/hooks/`:

1. **`useAuthManager`**: Firebase authentication lifecycle, user profiles, and cloud character loading triggers.
2. **`useCharacterManager`**: Dual-layer local/cloud character persistence, history undo/redo stack (`useHistoryState`), AC recalculation, death mechanics, and presence broadcasting.
3. **`useSessionSync`**: Real-time Firestore session room subscriptions, member doc synchronization, and campaign save restorations.
4. **`useSystemManager`**: Active multi-system rulesets (5e, 3.5e, Pathfinder, Shadowrun, Cthulhu), custom CSS data-theme binding, and system cycle hotkeys.
5. **`useDiceEngine`**: Mathematical dice rolling, advantage/disadvantage evaluation, Web Audio event emission, and physical tabletop dice interception.
6. **`useModalCoordinator`**: Consolidated modal visibility states, custom event bus listeners, and upgrade tier limit guards.

### Positive Consequences
* `App.tsx` reduced by over 60% in line count and converted into a clean layout orchestration layer.
* Subsystems are independently testable and isolated from UI layout logic.
* Future feature additions (new modals, new rule systems, or cloud providers) can be added without bloating root components.
