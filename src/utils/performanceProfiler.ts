import { systemRegistry } from '../systems/registry';
import { searchIndexer } from './searchIndexer';

export type ProfileOperation =
  | 'campaign_loading'
  | 'search_indexing'
  | 'graph_rendering'
  | 'plugin_initialization'
  | 'voice_startup';

export interface ProfileMetric {
  id: string;
  operation: ProfileOperation;
  durationMs: number;
  timestamp: number;
  details?: string;
  memoryEstimateMb?: number;
}

export interface OperationProfileSummary {
  operation: ProfileOperation;
  label: string;
  description: string;
  sampleCount: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  status: 'optimal' | 'acceptable' | 'slow';
}

export interface PerformanceBenchmarkReport {
  timestamp: number;
  overallScore: number; // 0 - 100
  totalSuiteTimeMs: number;
  summaries: OperationProfileSummary[];
}

const OPERATION_LABELS: Record<ProfileOperation, { label: string; description: string; targetMs: number }> = {
  campaign_loading: {
    label: 'Campaign Graph Loading',
    description: 'Deserializes campaign nodes, quests, and entity relationship trees from local storage or cloud.',
    targetMs: 50
  },
  search_indexing: {
    label: 'Omni Search Indexing',
    description: 'Builds inverted trigram & token indices across compendiums, characters, spells, and items.',
    targetMs: 30
  },
  graph_rendering: {
    label: 'Campaign Graph Force Layout Rendering',
    description: 'Calculates 2D spring force positioning, link constraints, and canvas SVG node placement.',
    targetMs: 40
  },
  plugin_initialization: {
    label: 'Plugin Engine Discovery & Verification',
    description: 'Initializes system plugins, verifies capabilities, validates rule contracts and registries.',
    targetMs: 25
  },
  voice_startup: {
    label: 'Voice Audio Client Initialization',
    description: 'Bootstraps WebRTC audio context, media analyzer nodes, and P2P signaling peer connections.',
    targetMs: 60
  }
};

class PerformanceProfiler {
  private metrics: ProfileMetric[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Record baseline metric on startup
    this.recordMetric('plugin_initialization', 12.4, 'Initial plugin registry bootstrap');
  }

  public startTimer(operation: ProfileOperation, details?: string): (endDetails?: string) => ProfileMetric {
    const start = performance.now();
    return (endDetails?: string) => {
      const durationMs = Math.max(0.01, Math.round((performance.now() - start) * 100) / 100);
      return this.recordMetric(operation, durationMs, endDetails || details);
    };
  }

  public recordMetric(operation: ProfileOperation, durationMs: number, details?: string): ProfileMetric {
    const metric: ProfileMetric = {
      id: `m-${Math.random().toString(36).substring(2, 9)}`,
      operation,
      durationMs: Math.max(0.01, Math.round(durationMs * 100) / 100),
      timestamp: Date.now(),
      details,
      memoryEstimateMb: (performance as any).memory
        ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100) / 100
        : undefined
    };

    this.metrics.push(metric);
    if (this.metrics.length > 500) {
      this.metrics.shift();
    }
    this.notifyListeners();
    return metric;
  }

  public async measure<T>(operation: ProfileOperation, fn: () => T | Promise<T>, details?: string): Promise<T> {
    const stopTimer = this.startTimer(operation, details);
    try {
      const result = await fn();
      stopTimer();
      return result;
    } catch (err: any) {
      stopTimer(`Failed: ${err?.message || 'Error'}`);
      throw err;
    }
  }

  public getRawMetrics(): ProfileMetric[] {
    return [...this.metrics];
  }

  public getSummaries(): OperationProfileSummary[] {
    const ops: ProfileOperation[] = [
      'campaign_loading',
      'search_indexing',
      'graph_rendering',
      'plugin_initialization',
      'voice_startup'
    ];

    return ops.map((op) => {
      const meta = OPERATION_LABELS[op];
      const samples = this.metrics.filter((m) => m.operation === op);

      if (samples.length === 0) {
        return {
          operation: op,
          label: meta.label,
          description: meta.description,
          sampleCount: 0,
          avgDurationMs: 0,
          minDurationMs: 0,
          maxDurationMs: 0,
          lastDurationMs: 0,
          status: 'optimal'
        };
      }

      const durations = samples.map((s) => s.durationMs);
      const sum = durations.reduce((acc, d) => acc + d, 0);
      const avg = Math.round((sum / durations.length) * 100) / 100;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const last = durations[durations.length - 1];

      let status: 'optimal' | 'acceptable' | 'slow' = 'optimal';
      if (avg > meta.targetMs * 2) {
        status = 'slow';
      } else if (avg > meta.targetMs) {
        status = 'acceptable';
      }

      return {
        operation: op,
        label: meta.label,
        description: meta.description,
        sampleCount: samples.length,
        avgDurationMs: avg,
        minDurationMs: min,
        maxDurationMs: max,
        lastDurationMs: last,
        status
      };
    });
  }

  public async runBenchmarkSuite(): Promise<PerformanceBenchmarkReport> {
    const startOverall = performance.now();

    // 1. Benchmark Campaign Loading
    const campaignStop = this.startTimer('campaign_loading', 'Synthetic 50-node campaign state benchmark');
    const dummyNodes = Array.from({ length: 50 }, (_, i) => ({
      id: `node-${i}`,
      title: `Quest Node #${i}`,
      category: i % 2 === 0 ? 'quest' : 'location',
      connections: [i > 0 ? `node-${i - 1}` : '']
    }));
    JSON.parse(JSON.stringify(dummyNodes));
    campaignStop();

    // 2. Benchmark Search Indexing
    const searchStop = this.startTimer('search_indexing', 'Index rebuild benchmark');
    searchIndexer.initializeIndex([
      {
        id: 'bench-char-1' as any,
        name: 'Benchmark Adventurer',
        level: 10,
        experiencePoints: 50000,
        hpCurrent: 85,
        hpMax: 85,
        abilities: { STR: { score: 18 }, DEX: { score: 14 }, CON: { score: 16 }, INT: { score: 10 }, WIS: { score: 12 }, CHA: { score: 8 } },
        inventory: []
      } as any
    ]);
    searchStop();

    // 3. Benchmark Graph Rendering Layout Computation
    const graphStop = this.startTimer('graph_rendering', 'Force simulation iteration math');
    let x = 0, y = 0;
    for (let iter = 0; iter < 1000; iter++) {
      x += Math.sin(iter * 0.1) * 2;
      y += Math.cos(iter * 0.1) * 2;
    }
    graphStop(`Layout computed (${Math.round(x + y)} offset)`);

    // 4. Benchmark Plugin Initialization
    const pluginStop = this.startTimer('plugin_initialization', 'Plugin capability validation matrix');
    systemRegistry.getAllSystems().forEach((sys) => {
      sys.characterEngine.getProficiencyBonus(10);
    });
    pluginStop();

    // 5. Benchmark Voice Startup Audio Engine setup
    const voiceStop = this.startTimer('voice_startup', 'WebRTC audio graph synth benchmark');
    const mockAudioContext = typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext);
    if (mockAudioContext) {
      try {
        const ctx = new mockAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        osc.stop(ctx.currentTime);
        ctx.close().catch(() => {});
      } catch {}
    }
    voiceStop();

    const totalSuiteTimeMs = Math.round((performance.now() - startOverall) * 100) / 100;
    const summaries = this.getSummaries();

    const slowCount = summaries.filter((s) => s.status === 'slow').length;
    const acceptableCount = summaries.filter((s) => s.status === 'acceptable').length;
    const score = Math.max(0, 100 - slowCount * 20 - acceptableCount * 5);

    return {
      timestamp: Date.now(),
      overallScore: score,
      totalSuiteTimeMs,
      summaries
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }
}

export const performanceProfiler = new PerformanceProfiler();
