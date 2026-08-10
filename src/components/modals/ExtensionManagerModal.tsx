import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  Code2, 
  Zap,
  Info,
  Globe,
  Trash2,
  FileText,
  BookOpen
} from 'lucide-react';
import { RuleEdition } from '../../types';
import { systemRegistry } from '../../systems';
import { eventBus, useEventHistory } from '../../events/eventBus';

interface ExtensionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledSystems: RuleEdition[];
  onToggleSystem: (systemId: RuleEdition) => void;
}

export function ExtensionManagerModal({
  isOpen,
  onClose,
  enabledSystems,
  onToggleSystem
}: ExtensionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'extensions' | 'events' | 'architecture' | 'docs'>('extensions');
  const [selectedDoc, setSelectedDoc] = useState<'architecture' | 'pluginApi' | 'state' | 'events' | 'addingSystem'>('architecture');
  const eventHistory = useEventHistory();

  if (!isOpen) return null;

  const allSystems = systemRegistry.getAllSystems();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-stone-950/90 border-b border-amber-600/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-100 flex items-center gap-2">
                <span>Plugin & Extension SDK Architecture</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono px-2 py-0.5 rounded-full">
                  v3.0 Platform
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans">
                Modular RPG Rulesets, Extension Metadata, and Central Domain Event Bus Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="p-2 bg-stone-950 border-b border-stone-800 flex items-center gap-2 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('extensions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-2 ${
              activeTab === 'extensions'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            System Plugins ({allSystems.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            Central Event Bus ({eventHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-400" />
            SDK Specifications
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            Developer Docs (/docs)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  Each registered RPG ruleset operates as an isolated, self-contained plugin exposing character engines, combat roll models, spell slot logic, and data catalogs.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSystems.map((sys) => {
                  const isEnabled = enabledSystems.includes(sys.id);

                  return (
                    <div
                      key={sys.id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        isEnabled
                          ? 'bg-stone-950/80 border-amber-600/40 text-stone-200 shadow-md'
                          : 'bg-stone-950/40 border-stone-800 text-stone-500 opacity-60'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sys.icon}</span>
                            <div>
                              <h3 className="font-serif font-bold text-sm text-stone-100 flex items-center gap-1.5">
                                <span>{sys.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${sys.badgeColor}`}>
                                  {sys.shortName}
                                </span>
                              </h3>
                              <span className="text-[10px] text-stone-400 font-mono">
                                v{sys.version || '1.0.0'} • by {sys.author || 'Community Plugin'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onToggleSystem(sys.id);
                              eventBus.emit('SystemPluginToggled', { pluginId: sys.id, enabled: !isEnabled });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1 ${
                              isEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Disabled
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-stone-400 mt-2.5 font-sans leading-relaxed">
                          {sys.description}
                        </p>

                        {/* Plugin Features */}
                        {sys.supportedFeatures && sys.supportedFeatures.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-stone-800/80">
                            <div className="text-[10px] uppercase font-mono text-stone-500 font-bold mb-1.5">
                              Exposed Capabilities & Engines
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {sys.supportedFeatures.map((feat, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono"
                                >
                                  ⚡ {feat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 text-[10px] text-stone-500 font-mono flex items-center justify-between border-t border-stone-800/40">
                        <span>Category: <strong className="text-stone-400 uppercase">{sys.category || 'universal'}</strong></span>
                        <span>Primary Resource: <strong className="text-amber-400">{sys.primaryResourceName}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/30 border border-cyan-600/30 rounded-xl text-xs text-cyan-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Central Domain Event Bus is actively broadcasting domain state across decoupled plugins.</span>
                </div>
                <button
                  onClick={() => eventBus.clearHistory()}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono rounded-lg transition flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3 h-3" /> Clear Stream
                </button>
              </div>

              {eventHistory.length === 0 ? (
                <div className="p-10 text-center text-stone-500 text-xs font-serif bg-stone-950/50 rounded-xl border border-stone-800">
                  No domain events emitted in current session yet. Perform actions like leveling up, rolling dice, or creating characters to trigger live events!
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-xs max-h-[420px] overflow-y-auto">
                  {eventHistory.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3 text-stone-300 hover:border-stone-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1 rounded bg-stone-900 border border-stone-800 text-amber-400 text-[10px] shrink-0">
                          {evt.type}
                        </span>
                        <div className="truncate text-stone-300 text-[11px]">
                          {JSON.stringify(evt.payload)}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-500 shrink-0">
                        {evt.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs font-sans text-stone-300">
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
                <h3 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Decoupled GameSystemPlugin Contract
                </h3>
                <p className="text-stone-400 leading-relaxed">
                  The application uses an interface contract to strictly decouple game mechanics from the UI layout. Each plugin conforms to the following specification:
                </p>
                <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
{`interface GameSystemPlugin {
  id: RuleEdition;
  name: string;
  shortName: string;
  description: string;
  badgeColor: string;
  icon: string;
  primaryResourceName: string;

  version?: string;
  author?: string;
  category?: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal';
  supportedFeatures?: string[];

  characterEngine: SystemCharacterEngine;
  combatEngine: SystemCombatEngine;
  spellEngine: SystemSpellEngine;
  data: SystemDataCatalog;
}`}
                </pre>
              </div>

              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
                <h3 className="font-serif font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Central Domain Event Bus
                </h3>
                <p className="text-stone-400 leading-relaxed">
                  Instead of hardcoding cross-component state synchronization, features register domain subscribers using <code className="text-amber-300">eventBus.on(eventType, callback)</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-800">
                <button
                  onClick={() => setSelectedDoc('architecture')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
                    selectedDoc === 'architecture' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  📄 Architecture.md
                </button>
                <button
                  onClick={() => setSelectedDoc('pluginApi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
                    selectedDoc === 'pluginApi' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  📄 Plugin_API.md
                </button>
                <button
                  onClick={() => setSelectedDoc('state')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
                    selectedDoc === 'state' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  📄 State_Management.md
                </button>
                <button
                  onClick={() => setSelectedDoc('events')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
                    selectedDoc === 'events' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  📄 Event_System.md
                </button>
                <button
                  onClick={() => setSelectedDoc('addingSystem')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 ${
                    selectedDoc === 'addingSystem' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-stone-900 text-stone-400'
                  }`}
                >
                  📄 Adding_a_System.md
                </button>
              </div>

              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
                {selectedDoc === 'architecture' && (
                  <div className="space-y-2 text-xs font-sans text-stone-300">
                    <h3 className="font-serif font-bold text-sm text-amber-300">/docs/Architecture.md</h3>
                    <p className="text-stone-400">Decoupled system registry architecture, multi-ruleset plugin contracts, central event bus, and undo/redo history engine.</p>
                    <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-amber-200/90 whitespace-pre-wrap overflow-x-auto">
{`# Pen & Paper Platform Architecture
Platform Architecture consists of 5 modular layers:
1. Plugin Registry (systemRegistry)
2. Domain Event Bus (eventBus)
3. State Management & History Stack (useHistoryState)
4. Universal Command Indexing (CommandPaletteModal)
5. Pinned Workspace Customization`}
                    </pre>
                  </div>
                )}

                {selectedDoc === 'pluginApi' && (
                  <div className="space-y-2 text-xs font-sans text-stone-300">
                    <h3 className="font-serif font-bold text-sm text-purple-300">/docs/Plugin_API.md</h3>
                    <p className="text-stone-400">Complete GameSystemPlugin, RollModel, and sub-engine interface specifications.</p>
                    <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-purple-200/90 whitespace-pre-wrap overflow-x-auto">
{`interface GameSystemPlugin {
  id: RuleEdition;
  name: string;
  shortName: string;
  category: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal';
  characterEngine: SystemCharacterEngine;
  combatEngine: SystemCombatEngine;
  spellEngine: SystemSpellEngine;
  data: SystemDataCatalog;
}`}
                    </pre>
                  </div>
                )}

                {selectedDoc === 'addingSystem' && (
                  <div className="space-y-2 text-xs font-sans text-stone-300">
                    <h3 className="font-serif font-bold text-sm text-emerald-300">/docs/Adding_a_System.md</h3>
                    <p className="text-stone-400">Step-by-step developer guide for adding new TRPG systems without modifying core UI code.</p>
                    <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-emerald-200/90 whitespace-pre-wrap overflow-x-auto">
{`1. Add edition key to RuleEdition in /src/types.ts
2. Create plugin file in /src/systems/plugins/myPlugin.ts
3. Export GameSystemPlugin conforming object
4. Register via systemRegistry.registerSystem(myPlugin)`}
                    </pre>
                  </div>
                )}

                {selectedDoc === 'events' && (
                  <div className="space-y-2 text-xs font-sans text-stone-300">
                    <h3 className="font-serif font-bold text-sm text-cyan-300">/docs/Event_System.md</h3>
                    <p className="text-stone-400">Decoupled Pub/Sub event bus for domain listeners and real-time logs.</p>
                    <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-cyan-200/90 whitespace-pre-wrap overflow-x-auto">
{`eventBus.emit('DiceRolled', { formula: '1d20+5', total: 23 });
useEventListener('DiceRolled', (payload) => console.log(payload));`}
                    </pre>
                  </div>
                )}

                {selectedDoc === 'state' && (
                  <div className="space-y-2 text-xs font-sans text-stone-300">
                    <h3 className="font-serif font-bold text-sm text-amber-300">/docs/State_Management.md</h3>
                    <p className="text-stone-400">Atomic snapshot stack for full session undo/redo and storage sync.</p>
                    <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-stone-300 whitespace-pre-wrap overflow-x-auto">
{`const { state, setPresent, undo, redo, canUndo, canRedo } = useHistoryState(initialChar);`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>Plugin Registry Status: <strong className="text-emerald-400">ACTIVE ({allSystems.length} Plugins)</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
