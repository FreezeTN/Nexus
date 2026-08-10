# Platform Architecture & Event Bus Specification

The PenPaper TTRPG Platform is architected as an **Operating System for Tabletop Campaigns**, connecting character sheets, rule engines, combat trackers, compendiums, and modular plugins.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       UI / Apps Layer                       │
│  (Character Sheet, Combat Tracker, Compendium, Dashboard)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Event Bus Subscriptions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Central Event Bus (Pub/Sub)               │
│   (DiceRolled, LevelUp, ItemAdded, SpellLearned, World)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Extensible Hooks & Triggers
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Engine Registry                   │
│   (D&D 5e, D&D 3.5e, Pathfinder 2e, Shadowrun 5e, Call of Cthulhu) │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Decoupled Event Flow**: Components emit events to the `eventBus` rather than tightly coupling UI logic to secondary consumers (Combat, Quest tracker, Analytics, Timeline).
2. **Version Compatibility**: Plugins declare explicit `minPlatformVersion` and supported version matrix to prevent breaking changes.
3. **First-Class Plugin Registry**: Rule engines implement standard interfaces (`SystemCharacterEngine`, `SystemCombatEngine`, `SystemSpellEngine`).
4. **Automated Verification**: Automated test suites validate event bus integrity, registry resolution, and roll model calculations.
