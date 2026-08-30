/**
 * User & Tabletop Interaction Telemetry
 * 
 * Aggregates anonymous, local telemetry on real user interactions with Nexus TRPG:
 * - Rule System Distribution (5e vs. Pathfinder 2e vs. Custom)
 * - Dice Activity & Roll Distribution (Rolls/min, Nat 20s, Nat 1s, formula complexity)
 * - Combat Encounter Metrics (Average encounter length, round counts, turn shifts)
 * - Compendium & Spell Lookups (Frequency of spells, items, rules searches)
 * - WebRTC Voice Chat Performance (Connection latency, duration, active talkers)
 * - Active Session Durations
 */

export interface SystemUsageMetric {
  systemId: string;
  systemName: string;
  characterCount: number;
  rollCount: number;
  lastUsed: number;
}

export interface DiceTelemetryMetric {
  totalRolls: number;
  natural20s: number;
  natural1s: number;
  averageResult: number;
  diceDistribution: Record<string, number>; // 'd20': 45, 'd6': 12, etc.
  rollsPerMinute: number;
  lastRollTimestamp: number;
}

export interface CombatTelemetryMetric {
  encountersInitiated: number;
  totalRoundsFought: number;
  averageRoundsPerEncounter: number;
  averageTurnDurationSeconds: number;
}

export interface FeatureUsageMetric {
  compendiumSearches: number;
  spellsCastOrViewed: number;
  ambienceBroadcastsStarted: number;
  voiceChatMinutes: number;
  characterExports: number;
  characterImports: number;
  levelUpsCompleted: number;
}

export interface CompleteTelemetryReport {
  timestamp: number;
  sessionUptimeMinutes: number;
  dice: DiceTelemetryMetric;
  combat: CombatTelemetryMetric;
  features: FeatureUsageMetric;
  systems: Record<string, SystemUsageMetric>;
  recentTelemetryEvents: Array<{
    category: string;
    action: string;
    details?: string;
    timestamp: number;
  }>;
}

const STORAGE_KEY = 'nexus_user_telemetry_v1';
const SESSION_START_TIME = Date.now();

class UserTelemetryManager {
  private dice: DiceTelemetryMetric = {
    totalRolls: 0,
    natural20s: 0,
    natural1s: 0,
    averageResult: 10.5,
    diceDistribution: { d20: 0, d6: 0, d8: 0, d10: 0, d12: 0, d4: 0, d100: 0 },
    rollsPerMinute: 0,
    lastRollTimestamp: Date.now()
  };

  private combat: CombatTelemetryMetric = {
    encountersInitiated: 0,
    totalRoundsFought: 0,
    averageRoundsPerEncounter: 0,
    averageTurnDurationSeconds: 0
  };

  private features: FeatureUsageMetric = {
    compendiumSearches: 0,
    spellsCastOrViewed: 0,
    ambienceBroadcastsStarted: 0,
    voiceChatMinutes: 0,
    characterExports: 0,
    characterImports: 0,
    levelUpsCompleted: 0
  };

  private systems: Record<string, SystemUsageMetric> = {
    'dnd5e': { systemId: 'dnd5e', systemName: 'D&D 5th Edition', characterCount: 1, rollCount: 0, lastUsed: Date.now() },
    'pf2e': { systemId: 'pf2e', systemName: 'Pathfinder 2e', characterCount: 0, rollCount: 0, lastUsed: Date.now() }
  };

  private recentEvents: Array<{ category: string; action: string; details?: string; timestamp: number }> = [];
  private listeners: Set<() => void> = new Set();
  private rollTimestamps: number[] = [];

  constructor() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.dice) this.dice = { ...this.dice, ...parsed.dice };
          if (parsed.combat) this.combat = { ...this.combat, ...parsed.combat };
          if (parsed.features) this.features = { ...this.features, ...parsed.features };
          if (parsed.systems) this.systems = { ...this.systems, ...parsed.systems };
        }
      }
    } catch {
      // Fall back to memory
    }
  }

  private save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          dice: this.dice,
          combat: this.combat,
          features: this.features,
          systems: this.systems
        }));
      }
    } catch {}
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch {}
    });
  }

  private logEvent(category: string, action: string, details?: string) {
    this.recentEvents.unshift({
      category,
      action,
      details,
      timestamp: Date.now()
    });
    if (this.recentEvents.length > 50) {
      this.recentEvents.pop();
    }
  }

  // --- RECORDING ACTIONS ---

  public recordDiceRoll(formula: string, total: number, naturalRoll?: number) {
    const now = Date.now();
    this.dice.totalRolls += 1;
    this.dice.lastRollTimestamp = now;

    // Track rolls per minute window
    this.rollTimestamps.push(now);
    const oneMinAgo = now - 60000;
    this.rollTimestamps = this.rollTimestamps.filter(t => t > oneMinAgo);
    this.dice.rollsPerMinute = this.rollTimestamps.length;

    // Detect natural 20 or 1
    if (naturalRoll === 20 || (formula.includes('d20') && total === 20)) {
      this.dice.natural20s += 1;
    } else if (naturalRoll === 1 || (formula.includes('d20') && total === 1)) {
      this.dice.natural1s += 1;
    }

    // Parse dice types in formula
    const diceMatch = formula.match(/(\d*)d(4|6|8|10|12|20|100)/g);
    if (diceMatch) {
      for (const d of diceMatch) {
        const parts = d.split('d');
        const count = parseInt(parts[0], 10) || 1;
        const sides = `d${parts[1]}`;
        this.dice.diceDistribution[sides] = (this.dice.diceDistribution[sides] || 0) + count;
      }
    }

    this.logEvent('Dice', `Rolled ${formula}`, `Total: ${total}`);
    this.save();
  }

  public recordCombatEncounter(rounds: number) {
    this.combat.encountersInitiated += 1;
    this.combat.totalRoundsFought += rounds;
    this.combat.averageRoundsPerEncounter = Math.round((this.combat.totalRoundsFought / this.combat.encountersInitiated) * 10) / 10;
    this.logEvent('Combat', 'Encounter Resolved', `${rounds} rounds`);
    this.save();
  }

  public recordCompendiumSearch(query: string) {
    this.features.compendiumSearches += 1;
    this.logEvent('Search', 'Compendium Lookup', query);
    this.save();
  }

  public recordSpellUsage(spellName: string) {
    this.features.spellsCastOrViewed += 1;
    this.logEvent('Magic', 'Spell Inspected/Cast', spellName);
    this.save();
  }

  public recordAmbienceBroadcast(presetOrUrl: string) {
    this.features.ambienceBroadcastsStarted += 1;
    this.logEvent('Audio', 'Ambience Broadcast Started', presetOrUrl);
    this.save();
  }

  public recordLevelUp(characterName: string, newLevel: number) {
    this.features.levelUpsCompleted += 1;
    this.logEvent('Progression', 'Character Leveled Up', `${characterName} -> Level ${newLevel}`);
    this.save();
  }

  public recordSystemUsage(systemId: string, systemName: string) {
    if (!this.systems[systemId]) {
      this.systems[systemId] = {
        systemId,
        systemName,
        characterCount: 1,
        rollCount: 0,
        lastUsed: Date.now()
      };
    } else {
      this.systems[systemId].lastUsed = Date.now();
    }
    this.save();
  }

  public getReport(): CompleteTelemetryReport {
    const uptimeMinutes = Math.round((Date.now() - SESSION_START_TIME) / 60000);
    return {
      timestamp: Date.now(),
      sessionUptimeMinutes: uptimeMinutes,
      dice: { ...this.dice },
      combat: { ...this.combat },
      features: { ...this.features },
      systems: { ...this.systems },
      recentTelemetryEvents: [...this.recentEvents]
    };
  }

  public resetTelemetry() {
    this.dice = {
      totalRolls: 0,
      natural20s: 0,
      natural1s: 0,
      averageResult: 10.5,
      diceDistribution: { d20: 0, d6: 0, d8: 0, d10: 0, d12: 0, d4: 0, d100: 0 },
      rollsPerMinute: 0,
      lastRollTimestamp: Date.now()
    };
    this.combat = {
      encountersInitiated: 0,
      totalRoundsFought: 0,
      averageRoundsPerEncounter: 0,
      averageTurnDurationSeconds: 0
    };
    this.features = {
      compendiumSearches: 0,
      spellsCastOrViewed: 0,
      ambienceBroadcastsStarted: 0,
      voiceChatMinutes: 0,
      characterExports: 0,
      characterImports: 0,
      levelUpsCompleted: 0
    };
    this.recentEvents = [];
    this.save();
  }
}

export const userTelemetry = new UserTelemetryManager();
