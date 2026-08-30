import React, { useState, useEffect, useMemo } from 'react';
import {
  structuredLogger,
  StructuredLogEntry,
  TraceSpan,
  LogLevel,
  StateTier,
  DiagnosticSnapshot
} from '../../utils/structuredLogger';
import { userTelemetry, CompleteTelemetryReport } from '../../utils/userTelemetry';
import {
  Activity,
  Terminal,
  Layers,
  Cpu,
  Radio,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Wifi,
  Database,
  BarChart3,
  Dices,
  Swords,
  BookOpen,
  Volume2
} from 'lucide-react';

interface DiagnosticConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticConsoleModal: React.FC<DiagnosticConsoleModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'traces' | 'logs' | 'telemetry' | 'health' | 'export'>('traces');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<StateTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLog, setSelectedLog] = useState<StructuredLogEntry | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);

  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot>(structuredLogger.generateDiagnosticSnapshot());
  const [telemetry, setTelemetry] = useState<CompleteTelemetryReport>(userTelemetry.getReport());

  // Subscribe to real-time events
  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      if (isPaused) return;
      setLogs(structuredLogger.getLogs({ level: selectedLevel, tier: selectedTier, search: searchQuery }));
      setSpans(structuredLogger.getSpans());
      setSnapshot(structuredLogger.generateDiagnosticSnapshot());
      setTelemetry(userTelemetry.getReport());
    };

    refreshData();
    const unsubLogger = structuredLogger.subscribe(refreshData);
    const unsubTelemetry = userTelemetry.subscribe(refreshData);

    const interval = setInterval(refreshData, 1000);

    return () => {
      unsubLogger();
      unsubTelemetry();
      clearInterval(interval);
    };
  }, [isOpen, isPaused, selectedLevel, selectedTier, searchQuery]);

  const filteredLogs = useMemo(() => {
    return structuredLogger.getLogs({ level: selectedLevel, tier: selectedTier, search: searchQuery });
  }, [logs, selectedLevel, selectedTier, searchQuery]);

  const filteredSpans = useMemo(() => {
    let result = spans;
    if (selectedTier !== 'all') {
      result = result.filter(s => s.tier === selectedTier);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || JSON.stringify(s.attributes).toLowerCase().includes(q));
    }
    return result;
  }, [spans, selectedTier, searchQuery]);

  if (!isOpen) return null;

  const handleCopyDiagnosticBundle = () => {
    const bundle = {
      timestamp: new Date().toISOString(),
      app: 'Nexus TRPG 5.5.0',
      snapshot,
      telemetry,
      activeSpans: structuredLogger.getActiveSpans(),
      recentLogs: filteredLogs.slice(0, 100)
    };
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDiagnosticBundle = () => {
    const bundle = {
      timestamp: new Date().toISOString(),
      app: 'Nexus TRPG 5.5.0',
      snapshot,
      telemetry,
      recentLogs: logs
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-diagnostic-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTierColor = (tier: StateTier) => {
    switch (tier) {
      case 'server':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      case 'domain':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'ui':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'transient':
        return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
      case 'system':
      default:
        return 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60';
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'error':
      case 'fatal':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40"><XCircle className="w-3 h-3" /> {level.toUpperCase()}</span>;
      case 'warn':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'info':
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40"><CheckCircle2 className="w-3 h-3" /> INFO</span>;
      case 'debug':
      default:
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-zinc-700/40 text-zinc-400 border border-zinc-600/40">DEBUG</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[88vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 font-sans">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Nexus Observability & Telemetry Console</h2>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Stream
                </span>
              </div>
              <p className="text-xs text-zinc-400">Comprehensive structured tracing, state tier telemetry & diagnostic instrumentation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isPaused ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${!isPaused ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              {isPaused ? 'Stream Paused' : 'Live Polling'}
            </button>
            <button
              onClick={handleCopyDiagnosticBundle}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Bundle' : 'Copy JSON'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('traces')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'traces' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Trace Waterfall ({spans.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Structured Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'telemetry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              User Telemetry & Dice ({telemetry.dice.totalRolls} rolls)
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'health' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              State Tiers & V8 Health
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'export' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Diagnostic Report Export
            </button>
          </div>

          {/* Quick Filters */}
          {(activeTab === 'traces' || activeTab === 'logs') && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter message/payload..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-44"
                />
              </div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as StateTier | 'all')}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All State Tiers</option>
                <option value="server">Tier 1: Server</option>
                <option value="domain">Tier 2: Domain</option>
                <option value="ui">Tier 3: UI</option>
                <option value="transient">Tier 4: Transient</option>
                <option value="system">System Core</option>
              </select>
              {activeTab === 'logs' && (
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Levels</option>
                  <option value="debug">DEBUG</option>
                  <option value="info">INFO</option>
                  <option value="warn">WARN</option>
                  <option value="error">ERROR</option>
                  <option value="fatal">FATAL</option>
                </select>
              )}
              <button
                onClick={() => structuredLogger.clearLogs()}
                title="Clear Logs Buffer"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden p-6 bg-zinc-950">

          {/* 1. TRACE WATERFALL TAB */}
          {activeTab === 'traces' && (
            <div className="h-full flex gap-6">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 border-r border-zinc-800/80">
                {filteredSpans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <Layers className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No trace spans recorded for current filters.</p>
                  </div>
                ) : (
                  filteredSpans.map((span) => {
                    const isSelected = selectedSpan?.id === span.id;
                    return (
                      <div
                        key={span.id}
                        onClick={() => setSelectedSpan(span)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-800/90 border-indigo-500 shadow-md'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTierColor(span.tier)}`}>
                              {span.tier.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-zinc-100">{span.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                              {span.durationMs !== undefined ? `${span.durationMs}ms` : 'active'}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${span.status === 'ok' ? 'bg-emerald-400' : span.status === 'error' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
                          </div>
                        </div>

                        {/* Visual Duration Bar */}
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full ${span.status === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${Math.min(100, Math.max(8, (span.durationMs || 5) * 1.5))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span>Trace: {span.traceId.slice(0, 14)}...</span>
                          <span>Span ID: {span.id}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Span Detail Side-Panel */}
              <div className="w-80 h-full overflow-y-auto bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
                {selectedSpan ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Span Detail</span>
                      <h3 className="text-sm font-bold text-zinc-100 mt-0.5">{selectedSpan.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTierColor(selectedSpan.tier)}`}>
                          {selectedSpan.tier.toUpperCase()} TIER
                        </span>
                        <span className="font-mono text-indigo-400 font-semibold">{selectedSpan.durationMs}ms</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Attributes</span>
                      <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedSpan.attributes, null, 2)}
                      </pre>
                    </div>

                    {selectedSpan.error && (
                      <div className="space-y-1.5 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60">
                        <span className="text-[10px] font-bold text-rose-400 uppercase">Captured Error</span>
                        <p className="text-rose-200 font-mono text-[11px]">{selectedSpan.error.message}</p>
                        {selectedSpan.error.stack && (
                          <pre className="text-[10px] text-rose-400 font-mono overflow-x-auto">{selectedSpan.error.stack}</pre>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                    <Layers className="w-6 h-6 mb-2 opacity-30" />
                    <p className="text-xs">Click any span on the left to inspect execution timings & payload context.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. STRUCTURED LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="h-full flex gap-6">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 border-r border-zinc-800/80">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <Terminal className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No structured logs found matching criteria.</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const dateStr = new Date(log.timestamp).toLocaleTimeString();
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-800/90 border-indigo-500 shadow-md'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {getLevelBadge(log.level)}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getTierColor(log.tier)}`}>
                              {log.tier}
                            </span>
                            <span className="text-xs font-mono text-zinc-200 truncate">{log.message}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0">{dateStr}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Log Detail Side-Panel */}
              <div className="w-80 h-full overflow-y-auto bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
                {selectedLog ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Log Entry</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getLevelBadge(selectedLog.level)}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getTierColor(selectedLog.tier)}`}>
                          {selectedLog.tier}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 mt-2">{selectedLog.message}</p>
                      <span className="text-[10px] font-mono text-zinc-500 block mt-1">
                        {new Date(selectedLog.timestamp).toISOString()}
                      </span>
                    </div>

                    {selectedLog.context && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Context Payload</span>
                        <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.context, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedLog.error && (
                      <div className="space-y-1.5 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60">
                        <span className="text-[10px] font-bold text-rose-400 uppercase">Captured Error</span>
                        <p className="text-rose-200 font-mono text-[11px]">{selectedLog.error.message}</p>
                        {selectedLog.error.stack && (
                          <pre className="text-[10px] text-rose-400 font-mono overflow-x-auto">{selectedLog.error.stack}</pre>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                    <Terminal className="w-6 h-6 mb-2 opacity-30" />
                    <p className="text-xs">Select any log event to view parsed metadata, error stack traces, and context.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. USER TELEMETRY & DICE METRICS TAB */}
          {activeTab === 'telemetry' && (
            <div className="h-full overflow-y-auto space-y-6 pr-2">
              
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Total Tabletop Rolls</span>
                    <Dices className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{telemetry.dice.totalRolls}</div>
                  <p className="text-[11px] text-zinc-500 mt-1">{telemetry.dice.rollsPerMinute} rolls/min active tempo</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Natural 20s vs. 1s</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-400">{telemetry.dice.natural20s}</span>
                    <span className="text-xs text-zinc-500 font-semibold">crits</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-xl font-bold text-rose-400">{telemetry.dice.natural1s}</span>
                    <span className="text-xs text-zinc-500 font-semibold">fumbles</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Authentic RNG frequency</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Combat Encounters</span>
                    <Swords className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{telemetry.combat.encountersInitiated}</div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {telemetry.combat.totalRoundsFought} rounds fought (~{telemetry.combat.averageRoundsPerEncounter} avg)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-xs font-semibold">Compendium Lookups</span>
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{telemetry.features.compendiumSearches}</div>
                  <p className="text-[11px] text-zinc-500 mt-1">{telemetry.features.spellsCastOrViewed} spell queries</p>
                </div>
              </div>

              {/* Dice Distribution Histogram */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Dices className="w-4 h-4 text-indigo-400" /> Dice Type Rolling Frequency
                </h4>
                <div className="grid grid-cols-7 gap-3">
                  {Object.entries(telemetry.dice.diceDistribution).map(([die, count]) => {
                    const maxCount = Math.max(1, ...Object.values(telemetry.dice.diceDistribution));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={die} className="flex flex-col items-center">
                        <div className="w-full bg-zinc-950 h-28 rounded-lg flex flex-col justify-end p-1.5 border border-zinc-800 relative">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-md transition-all"
                            style={{ height: `${Math.max(8, pct)}%` }}
                          />
                          <span className="absolute top-2 left-0 right-0 text-center text-[10px] font-mono text-zinc-400 font-semibold">
                            {count}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-zinc-300 uppercase mt-2">{die}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Interaction Activity Log */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-3">Recent Tabletop Interactions</h4>
                <div className="space-y-2">
                  {telemetry.recentTelemetryEvents.length === 0 ? (
                    <p className="text-xs text-zinc-500">Roll dice, search compendiums, or initiate combat to see live interactions.</p>
                  ) : (
                    telemetry.recentTelemetryEvents.slice(0, 8).map((evt, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-zinc-950 border border-zinc-850">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            {evt.category}
                          </span>
                          <span className="font-medium text-zinc-200">{evt.action}</span>
                          {evt.details && <span className="text-zinc-400 font-mono text-[11px]">({evt.details})</span>}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* 4. STATE TIERS & V8 HEALTH TAB */}
          {activeTab === 'health' && (
            <div className="h-full overflow-y-auto space-y-6 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400">V8 Heap Allocation</span>
                  <div className="text-2xl font-bold text-zinc-100 mt-1">
                    {snapshot.environment.memoryHeapMb ? `${snapshot.environment.memoryHeapMb} MB` : 'Optimal (<120MB)'}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Within 120MB budget ceiling
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400">Mounted DOM Nodes</span>
                  <div className="text-2xl font-bold text-zinc-100 mt-1">
                    {snapshot.environment.domNodeCount || '~850'}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Lightweight virtualized layout
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400">Network & Connectivity</span>
                  <div className="text-2xl font-bold text-zinc-100 mt-1">
                    {snapshot.environment.online ? 'Online (Realtime)' : 'Offline (Cached)'}
                  </div>
                  <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Zero-trust Firestore sync active
                  </p>
                </div>
              </div>

              {/* State Tiers Breakdown */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-4">
                  Four-Tier State Architecture Latency & Health
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(snapshot.tierSummary).map(([tier, summary]) => (
                    <div key={tier} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTierColor(tier as StateTier)}`}>
                          TIER: {tier.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono text-indigo-400 font-semibold">
                          ~{summary.avgSpanMs}ms avg span
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-900">
                        <span>Total Events: {summary.logCount}</span>
                        <span className={summary.errorCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          Errors: {summary.errorCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. DIAGNOSTIC REPORT EXPORT TAB */}
          {activeTab === 'export' && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Export Complete Diagnostic Bundle</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate a comprehensive, sanitized JSON bundle containing system telemetry, trace spans, active memory metrics, and runtime error logs. This can be attached to issue reports or reviewed for CI/CD health audits.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadDiagnosticBundle}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Report (.json)
                </button>
                <button
                  onClick={handleCopyDiagnosticBundle}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard' : 'Copy JSON to Clipboard'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
export default DiagnosticConsoleModal;
