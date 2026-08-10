# Central Domain Event Bus

## Overview
The Event Bus (`/src/events/eventBus.ts`) provides a decoupled Publish/Subscribe messaging backbone across the entire Pen & Paper platform.

## Event Payload Contract (`EventPayloadMap`)

```typescript
export interface EventPayloadMap {
  CharacterCreated: { character: CharacterData };
  CharacterUpdated: { character: CharacterData };
  CharacterLevelUp: { characterId: string; characterName: string; oldLevel: number; newLevel: number };
  QuestCompleted: { questId: string; questTitle: string; xpReward?: number };
  NPCUpdated: { npcId: string; name: string; role?: string };
  CombatStarted: { encounterName?: string; participantsCount: number };
  ItemAdded: { characterId: string; itemName: string; quantity?: number };
  SpellLearned: { characterId: string; spellName: string; level?: number };
  SessionStarted: { sessionId: string; sessionTitle: string };
  WorldChanged: { worldId: string; worldName: string };
  SystemPluginToggled: { pluginId: RuleEdition; enabled: boolean };
  DiceRolled: { formula: string; total: number; isNat20?: boolean; isNat1?: boolean; rollerName?: string };
}
```

## Emitting & Subscribing

### Emitting an Event
```typescript
import { eventBus } from '../events/eventBus';

eventBus.emit('CharacterLevelUp', {
  characterId: 'char-101',
  characterName: 'Valeros',
  oldLevel: 4,
  newLevel: 5
});
```

### Subscribing in React Components
```typescript
import { useEventListener, useEventHistory } from '../events/eventBus';

useEventListener('DiceRolled', (payload, log) => {
  console.log(`Roll triggered: ${payload.formula} = ${payload.total}`);
});

// Reactively access full session event stream
const history = useEventHistory();
```
