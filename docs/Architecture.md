# Pen & Paper Platform Architecture

## Overview
The Pen & Paper Platform is designed as an extensible, multi-system Tabletop Role-Playing Game (TRPG) workstation. It transitions tabletop applications from rigid single-system digital sheets into a modular, plugin-driven platform.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Application (App.tsx)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│   SystemRegistry   │   │  Domain EventBus   │   │  Command Palette   │
│ (System Plugins)   │   │ (Pub/Sub Stream)   │   │ (Universal Index)  │
└──────────┬─────────┘   └──────────┬─────────┘   └──────────┬─────────┘
           │                        │                        │
  ┌────────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
  │ 5e, 3.5e, PF2e, │      │ Character, DM,  │      │ Monsters, Spells│
  │ Shadowrun, CoC  │      │ Dice & Quests   │      │ Items, Actions  │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Core Architectural Layers

### 1. Plugin Registry (`/src/systems/registry.ts`)
Decouples ruleset logic (abilities, skills, combat formulas, spell slots, gear catalogs) from presentation logic.
- Systems register via `systemRegistry.registerSystem(plugin)`.
- UI views query active or requested system plugins via `systemRegistry.getSystem(edition)`.

### 2. Central Domain Event Bus (`/src/events/eventBus.ts`)
A strongly-typed, low-latency event streamer (`eventBus.emit`, `eventBus.on`).
- Components publish events without knowing who listens (`CharacterLevelUp`, `QuestCompleted`, `DiceRolled`, `SystemPluginToggled`).
- Enables analytics, logs, sound effects, and cross-plugin extensions.

### 3. State Management & Undo/Redo (`/src/utils/useHistoryState.ts`)
- Preserves deep state history across characters, inventory, and world state.
- Supports keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`) with atomic snapshot rollbacks.

### 4. Universal Indexing & Command Palette (`/src/components/common/CommandPaletteModal.tsx`)
- Provides instant `Ctrl+K` omnibox searching across compendium monsters, SRD spells, gear items, party characters, quests, and system settings.

### 5. Workspace Customization & Widget Pinning
- Allows users to customize their active workspace by pinning widgets (Initiative, Notes, Active Quest, Dice Tray) directly to a quick workspace bar.
