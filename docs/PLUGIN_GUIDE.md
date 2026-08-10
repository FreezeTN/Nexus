# Developer SDK & Plugin Authoring Guide

Welcome to the Tabletop Campaign Operating System Plugin Architecture.

## 1. Plugin Packaging Structure

Every plugin follows a standard package structure:

```
my-custom-plugin/
├── manifest.json      # Metadata, version compatibility, and capabilities
├── plugin.ts          # Main TypeScript code implementing GameSystemPlugin
├── README.md          # Plugin documentation and setup instructions
└── icon.png           # Optional 64x64 icon asset
```

## 2. Manifest Schema (`manifest.json`)

```json
{
  "id": "my-custom-system",
  "name": "My Custom Rule System",
  "shortName": "Custom 1.0",
  "version": "1.0.0",
  "minPlatformVersion": "1.5.0",
  "supports": ["1.5.0", "1.6.0"],
  "author": "Guild Master",
  "category": "fantasy",
  "description": "Custom TRPG system with modular stat engines.",
  "dependencies": []
}
```

## 3. Event Bus Decoupled Architecture

Plugins communicate decoupled state across the platform using the global `eventBus`.

### Common Event Topics
- `DiceRolled` -> `{ formula, total, isNat20, isNat1, rollerName }`
- `CharacterLevelUp` -> `{ characterId, characterName, oldLevel, newLevel }`
- `ItemAdded` -> `{ characterId, itemName, quantity }`
- `SpellLearned` -> `{ characterId, spellName, level }`
- `CombatStarted` -> `{ encounterName, participantsCount }`
- `WorldChanged` -> `{ worldId, worldName }`

### Subscribing to Events in Plugins
```typescript
import { eventBus } from '../events/eventBus';

eventBus.on('DiceRolled', (event) => {
  console.log(`[Plugin Log] ${event.rollerName} rolled ${event.formula} = ${event.total}`);
});
```

## 4. Registering Your Plugin

```typescript
import { systemRegistry } from './systems/registry';
import { myCustomPlugin } from './myCustomPlugin';

systemRegistry.register(myCustomPlugin);
```
