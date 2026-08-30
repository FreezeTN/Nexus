/**
 * Structured Logger & Tracing Engine
 * 
 * Provides production-grade structured logging, trace spans, and error breadcrumbs
 * mapped across the application's Four-Tier State Architecture:
 * - Tier 1: Server State (Firestore, Cloud sync, Auth)
 * - Tier 2: Domain State (Rules, Combat, Dice AST, Modifier Stacking)
 * - Tier 3: UI State (Modals, Navigation, Search, Themes)
 * - Tier 4: Transient State (3D Dice Animation, Audio Decibels, Toasts)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type StateTier = 'server' | 'domain' | 'ui' | 'transient' | 'system';

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  tier: StateTier;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'active' | 'ok' | 'error';
  attributes: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface StructuredLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  tier: StateTier;
  message: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface DiagnosticSnapshot {
  timestamp: string;
  environment: {
    userAgent: string;
    screenResolution: string;
    language: string;
    memoryHeapMb?: number;
    domNodeCount?: number;
    online: boolean;
  };
  recentLogs: StructuredLogEntry[];
  recentSpans: TraceSpan[];
  tierSummary: Record<StateTier, { logCount: number; errorCount: number; avgSpanMs: number }>;
}

const MAX_LOGS_BUFFER = 300;
const MAX_SPANS_BUFFER = 200;
const BREADCRUMB_LIMIT = 30;

class StructuredLogger {
  private logs: StructuredLogEntry[] = [];
  private spans: TraceSpan[] = [];
  private activeSpans: Map<string, TraceSpan> = new Map();
  private breadcrumbs: StructuredLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private currentTraceId: string = this.generateId('trace');

  constructor() {
    // Capture global uncaught errors and attach breadcrumb context
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Unhandled window error', {
          tier: 'system',
          context: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          error: event.error
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          tier: 'system',
          context: { reason: String(event.reason) },
          error: event.reason instanceof Error ? event.reason : undefined
        });
      });
    }

    this.info('Structured Logging & Tracing Engine initialized', { tier: 'system' });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in structured logger listener:', err);
      }
    });
  }

  public getTraceId(): string {
    return this.currentTraceId;
  }

  public renewTraceId(): string {
    this.currentTraceId = this.generateId('trace');
    return this.currentTraceId;
  }

  // --- TRACING SPANS ---

  public startSpan(name: string, options?: {
    tier?: StateTier;
    attributes?: Record<string, unknown>;
    parentId?: string;
  }): string {
    const spanId = this.generateId('span');
    const span: TraceSpan = {
      id: spanId,
      traceId: this.currentTraceId,
      parentId: options?.parentId,
      name,
      tier: options?.tier || 'domain',
      startTime: performance.now(),
      status: 'active',
      attributes: options?.attributes || {}
    };

    this.activeSpans.set(spanId, span);
    return spanId;
  }

  public endSpan(spanId: string, options?: {
    status?: 'ok' | 'error';
    attributes?: Record<string, unknown>;
    error?: Error | { message: string; code?: string; stack?: string };
  }): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.durationMs = Math.round((span.endTime - span.startTime) * 100) / 100;
    span.status = options?.status || (options?.error ? 'error' : 'ok');

    if (options?.attributes) {
      span.attributes = { ...span.attributes, ...options.attributes };
    }

    if (options?.error) {
      if (options.error instanceof Error) {
        span.error = {
          message: options.error.message,
          stack: options.error.stack,
        };
      } else {
        span.error = options.error;
      }
    }

    this.activeSpans.delete(spanId);
    this.spans.unshift(span);

    if (this.spans.length > MAX_SPANS_BUFFER) {
      this.spans.pop();
    }

    this.notify();
  }

  public async measureAsync<T>(
    name: string,
    tier: StateTier,
    fn: () => Promise<T>,
    attributes?: Record<string, unknown>
  ): Promise<T> {
    const spanId = this.startSpan(name, { tier, attributes });
    try {
      const result = await fn();
      this.endSpan(spanId, { status: 'ok' });
      return result;
    } catch (err) {
      this.endSpan(spanId, {
        status: 'error',
        error: err instanceof Error ? err : { message: String(err) }
      });
      throw err;
    }
  }

  public measureSync<T>(
    name: string,
    tier: StateTier,
    fn: () => T,
    attributes?: Record<string, unknown>
  ): T {
    const spanId = this.startSpan(name, { tier, attributes });
    try {
      const result = fn();
      this.endSpan(spanId, { status: 'ok' });
      return result;
    } catch (err) {
      this.endSpan(spanId, {
        status: 'error',
        error: err instanceof Error ? err : { message: String(err) }
      });
      throw err;
    }
  }

  // --- LOGGING METHODS ---

  private log(
    level: LogLevel,
    message: string,
    options?: {
      tier?: StateTier;
      traceId?: string;
      spanId?: string;
      context?: Record<string, unknown>;
      error?: Error;
    }
  ) {
    const entry: StructuredLogEntry = {
      id: this.generateId('log'),
      timestamp: Date.now(),
      level,
      tier: options?.tier || 'domain',
      message,
      traceId: options?.traceId || this.currentTraceId,
      spanId: options?.spanId,
      context: options?.context,
      error: options?.error ? {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack
      } : undefined
    };

    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS_BUFFER) {
      this.logs.pop();
    }

    // Keep breadcrumbs
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > BREADCRUMB_LIMIT) {
      this.breadcrumbs.shift();
    }

    // Format console output with level badge
    if (process.env.NODE_ENV !== 'production' || level === 'error' || level === 'fatal') {
      const prefix = `[${entry.tier.toUpperCase()}] [${level.toUpperCase()}]`;
      if (level === 'error' || level === 'fatal') {
        console.error(prefix, message, entry.context || '', entry.error || '');
      } else if (level === 'warn') {
        console.warn(prefix, message, entry.context || '');
      } else if (level === 'info') {
        console.info(prefix, message, entry.context || '');
      } else {
        console.debug(prefix, message, entry.context || '');
      }
    }

    this.notify();
  }

  public debug(message: string, options?: { tier?: StateTier; context?: Record<string, unknown>; spanId?: string }) {
    this.log('debug', message, options);
  }

  public info(message: string, options?: { tier?: StateTier; context?: Record<string, unknown>; spanId?: string }) {
    this.log('info', message, options);
  }

  public warn(message: string, options?: { tier?: StateTier; context?: Record<string, unknown>; spanId?: string }) {
    this.log('warn', message, options);
  }

  public error(message: string, options?: { tier?: StateTier; context?: Record<string, unknown>; spanId?: string; error?: Error }) {
    this.log('error', message, options);
  }

  public fatal(message: string, options?: { tier?: StateTier; context?: Record<string, unknown>; spanId?: string; error?: Error }) {
    this.log('fatal', message, options);
  }

  // --- QUERY & DIAGNOSTIC RETRIEVAL ---

  public getLogs(filter?: { level?: LogLevel | 'all'; tier?: StateTier | 'all'; search?: string }): StructuredLogEntry[] {
    let result = this.logs;

    if (filter?.level && filter.level !== 'all') {
      result = result.filter(l => l.level === filter.level);
    }

    if (filter?.tier && filter.tier !== 'all') {
      result = result.filter(l => l.tier === filter.tier);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(l =>
        l.message.toLowerCase().includes(q) ||
        (l.context && JSON.stringify(l.context).toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getSpans(): TraceSpan[] {
    return this.spans;
  }

  public getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  public getBreadcrumbs(): StructuredLogEntry[] {
    return [...this.breadcrumbs];
  }

  public clearLogs() {
    this.logs = [];
    this.spans = [];
    this.notify();
  }

  public generateDiagnosticSnapshot(): DiagnosticSnapshot {
    const memory = (typeof window !== 'undefined' && (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory)
      ? Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024))
      : undefined;

    const domCount = typeof document !== 'undefined' ? document.querySelectorAll('*').length : undefined;

    const tiers: StateTier[] = ['server', 'domain', 'ui', 'transient', 'system'];
    const tierSummary = {} as DiagnosticSnapshot['tierSummary'];

    for (const t of tiers) {
      const tierLogs = this.logs.filter(l => l.tier === t);
      const tierSpans = this.spans.filter(s => s.tier === t && s.durationMs !== undefined);
      const avgDuration = tierSpans.length > 0
        ? Math.round((tierSpans.reduce((acc, s) => acc + (s.durationMs || 0), 0) / tierSpans.length) * 10) / 10
        : 0;

      tierSummary[t] = {
        logCount: tierLogs.length,
        errorCount: tierLogs.filter(l => l.level === 'error' || l.level === 'fatal').length,
        avgSpanMs: avgDuration
      };
    }

    return {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Server',
        screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        language: typeof navigator !== 'undefined' ? navigator.language : 'en',
        memoryHeapMb: memory,
        domNodeCount: domCount,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true
      },
      recentLogs: this.logs.slice(0, 50),
      recentSpans: this.spans.slice(0, 30),
      tierSummary
    };
  }
}

export const structuredLogger = new StructuredLogger();
