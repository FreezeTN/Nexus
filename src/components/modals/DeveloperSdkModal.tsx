import React, { useState, useEffect } from 'react';
import { eventBus, useEventHistory } from '../../events/eventBus';
import { systemRegistry } from '../../systems/registry';
import { runArchitectureTests, TestResult } from '../../tests/systemTestSuite';
import { verifyPluginContracts, PluginContractVerificationSummary } from '../../systems/pluginContractVerifier';
import { performanceProfiler, OperationProfileSummary, PerformanceBenchmarkReport } from '../../utils/performanceProfiler';
import {
  Code,
  BookOpen,
  Package,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  Copy,
  Check,
  X,
  FileCode,
  Terminal,
  FileText,
  Zap,
  Box,
  Cpu,
  FolderTree,
  ShieldCheck,
  Download,
  Gauge,
  CheckSquare,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';

interface DeveloperSdkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperSdkModal: React.FC<DeveloperSdkModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sdk' | 'package' | 'contracts' | 'profiler' | 'events' | 'tests' | 'example'>('sdk');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [contractSummary, setContractSummary] = useState<PluginContractVerificationSummary | null>(null);
  const [profilerReport, setProfilerReport] = useState<PerformanceBenchmarkReport | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const eventLogs = useEventHistory();

  // Test Event Simulator State
  const [simEventType, setSimEventType] = useState<'DiceRolled' | 'CharacterLevelUp' | 'ItemAdded' | 'SpellLearned' | 'CombatStarted'>('DiceRolled');
  const [simActor, setSimActor] = useState('Valeros the Fighter');
  const [simFormula, setSimFormula] = useState('1d20+7');
  const [simTotal, setSimTotal] = useState(19);

  useEffect(() => {
    if (isOpen) {
      // Run quick checks on open
      runArchitectureTests().then(results => setTestResults(results));
      setContractSummary(verifyPluginContracts());
      performanceProfiler.runBenchmarkSuite().then(report => setProfilerReport(report));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRunTests = async () => {
    setIsTesting(true);
    const results = await runArchitectureTests();
    setTestResults(results);
    setContractSummary(verifyPluginContracts());
    setIsTesting(false);
  };

  const handleRunContracts = () => {
    setContractSummary(verifyPluginContracts());
  };

  const handleRunProfilerBenchmarks = async () => {
    setIsBenchmarking(true);
    const report = await performanceProfiler.runBenchmarkSuite();
    setProfilerReport(report);
    setIsBenchmarking(false);
  };

  const handleFireSimulatedEvent = () => {
    if (simEventType === 'DiceRolled') {
      eventBus.emit('DiceRolled', {
        formula: simFormula,
        total: simTotal,
        isNat20: simTotal === 20,
        isNat1: simTotal === 1,
        rollerName: simActor
      });
    } else if (simEventType === 'CharacterLevelUp') {
      eventBus.emit('CharacterLevelUp', {
        characterId: 'sim-char-1',
        characterName: simActor,
        oldLevel: 4,
        newLevel: 5
      });
    } else if (simEventType === 'ItemAdded') {
      eventBus.emit('ItemAdded', {
        characterId: 'sim-char-1',
        itemName: 'Sunblade +1',
        quantity: 1
      });
    } else if (simEventType === 'SpellLearned') {
      eventBus.emit('SpellLearned', {
        characterId: 'sim-char-1',
        spellName: 'Fireball',
        level: 3
      });
    } else if (simEventType === 'CombatStarted') {
      eventBus.emit('CombatStarted', {
        encounterName: 'Ambush at Darkwood Pass',
        participantsCount: 6
      });
    }
  };

  const helloWorldSnippet = `import { GameSystemPlugin } from './systems/types';

export const myCustomPlugin: GameSystemPlugin = {
  id: '5e' as any,
  name: 'Arcane Vanguard System Plugin',
  shortName: 'Vanguard',
  version: '1.0.0',
  minPlatformVersion: '1.5.0',
  description: 'Custom tactical magic plugin built on PenPaper OS SDK.',
  badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  icon: '🔮',
  primaryResourceName: 'Mana Points',
  author: 'Community Guild',
  category: 'fantasy',

  characterEngine: {
    getDefaultAbilities: () => ({ STR:{score:10}, DEX:{score:10}, CON:{score:10}, INT:{score:14}, WIS:{score:10}, CHA:{score:10} }),
    calculateStats: (char) => ({
      maxHp: 24,
      armorClass: 15,
      initiativeBonus: 2,
      speed: 30,
      passivePerception: 12
    }),
    getProficiencyBonus: (lvl) => Math.floor((lvl - 1) / 4) + 2,
    getAbilityModifier: (score) => Math.floor((score - 10) / 2)
  },

  combatEngine: {
    getInitiativeFormula: () => '1d20+2',
    getAttackBonus: () => 5,
    getDamageFormula: () => '1d8+3',
    getRollModel: () => ({ kind: 'd20', modifier: 5, formula: '1d20+5', targetType: 'AC' })
  },

  spellEngine: {
    isSpellcaster: () => true,
    getSpellSlotLabel: (lvl) => \`Tier \${lvl} Mana\`,
    getSpellStatLabel: () => 'Spell Save DC'
  },

  data: {
    classes: ['Spellblade', 'Chronomancer'],
    races: ['High Elf', 'Aetherborn'],
    primaryAttributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  }
};`;

  const manifestSnippet = `{
  "id": "my-custom-plugin",
  "name": "Custom TRPG Engine Extension",
  "version": "1.0.0",
  "minPlatformVersion": "1.5.0",
  "supports": ["1.5.0", "1.6.0"],
  "author": "Campaign OS Developer",
  "category": "fantasy",
  "description": "Standard plugin package definition with manifest metadata.",
  "dependencies": []
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100">Developer SDK & Architecture Center</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.5.0 SDK Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operating System specifications, Plugin Packaging, Decoupled Event Bus & Test Suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sdk')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sdk'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Plugin Guide & Docs
          </button>
          <button
            onClick={() => setActiveTab('package')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'package'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Plugin Packaging Specs
          </button>
          <button
            onClick={() => setActiveTab('example')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'example'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Hello World Plugin
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-amber-400" />
            Plugin Contracts Verification
          </button>
          <button
            onClick={() => setActiveTab('profiler')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profiler'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            Performance Profiler
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Event Bus ({eventLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Architecture Suite
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SDK & Plugin Guide */}
          {activeTab === 'sdk' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 p-5 rounded-xl">
                <h3 className="text-base font-semibold text-indigo-200 mb-2 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Tabletop Campaign Operating System Architecture
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  PenPaper OS serves as the central hub connecting character state, combat engines, campaign management, and user extensions. Plugins plug directly into the rule engine registry and communicate asynchronously through the typed central Event Bus.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-emerald-400" />
                    Recommended Directory Layout
                  </h4>
                  <pre className="text-xs font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 text-emerald-300 overflow-x-auto">
{`docs/
├── PLUGIN_GUIDE.md
├── ARCHITECTURE.md
├── MANIFEST_SPEC.json
└── HELLO_WORLD_PLUGIN.ts`}
                  </pre>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Version Matrix Declaration
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="font-mono text-indigo-300">minPlatformVersion</span>
                      <span>&gt;= 1.5.0</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="font-mono text-indigo-300">supportsVersions</span>
                      <span>["1.5.0", "1.6.0"]</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="font-mono text-indigo-300">Decoupled Pub/Sub</span>
                      <span>EventBus subscriber hooks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Plugin Packaging Spec */}
          {activeTab === 'package' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Box className="w-4 h-4 text-indigo-400" />
                    Standard Plugin Package Layout (`manifest.json` inside every plugin)
                  </h3>
                  <button
                    onClick={() => handleCopy(manifestSnippet, 'manifest')}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSection === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'manifest' ? 'Copied' : 'Copy Manifest'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <p className="font-mono text-indigo-300 font-semibold mb-1">1. manifest.json</p>
                    <p className="text-slate-400">Metadata, version specs, capabilities, and dependencies.</p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <p className="font-mono text-indigo-300 font-semibold mb-1">2. plugin.ts</p>
                    <p className="text-slate-400">Implements GameSystemPlugin rule and event contracts.</p>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded border border-slate-800">
                    <p className="font-mono text-indigo-300 font-semibold mb-1">3. README.md</p>
                    <p className="text-slate-400">User guide, setup instructions, and change log.</p>
                  </div>
                </div>

                <pre className="text-xs font-mono bg-slate-900 p-4 rounded-lg border border-slate-800 text-slate-200 overflow-x-auto">
                  {manifestSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Hello World Plugin */}
          {activeTab === 'example' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Hello World Plugin Template (`plugin.ts`)</h3>
                  <p className="text-xs text-slate-400">Copy this complete TypeScript template to kickstart your TRPG extension.</p>
                </div>
                <button
                  onClick={() => handleCopy(helloWorldSnippet, 'hello')}
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'hello' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedSection === 'hello' ? 'Copied Code' : 'Copy Full Code'}
                </button>
              </div>

              <pre className="text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-indigo-200 max-h-[500px] overflow-y-auto">
                {helloWorldSnippet}
              </pre>
            </div>
          )}

          {/* TAB 4: Plugin Contracts Verification */}
          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-semibold text-slate-100">Plugin API Contract Verification Suite</h3>
                    {contractSummary && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        contractSummary.allContractsPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {contractSummary.allContractsPassed ? '100% Compliant' : 'Contract Mismatch'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Automated contract verification for every registered TRPG plugin: registration, metadata exposure, engine capabilities, and version compatibility.
                  </p>
                </div>
                <button
                  onClick={handleRunContracts}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Verify Matrix
                </button>
              </div>

              {contractSummary && (
                <div className="space-y-4">
                  {contractSummary.checks.map((check) => (
                    <div
                      key={check.pluginId}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎲</span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{check.pluginName}</h4>
                            <p className="text-xs font-mono text-indigo-400">ID: {check.pluginId}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                          check.overallPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {check.overallPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {check.overallPassed ? 'Passed All Contracts' : 'Failed Verification'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-start gap-2">
                          {check.registersCorrectly ? (
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-200">1. Registers Correctly</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{check.details.registrationMessage}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-start gap-2">
                          {check.exposesMetadata ? (
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-200">2. Exposes Metadata</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{check.details.metadataMessage}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-start gap-2">
                          {check.implementsCapabilities ? (
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-200">3. Implements Capabilities</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{check.details.capabilitiesMessage}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-start gap-2">
                          {check.passesCompatibility ? (
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-200">4. Passes Compatibility Checks</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{check.details.compatibilityMessage}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Performance Profiler */}
          {activeTab === 'profiler' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold text-slate-100">Subsystem Performance Profiler</h3>
                    {profilerReport && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Score: {profilerReport.overallScore} / 100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Data-driven latency profiling across Campaign Loading, Search Indexing, Graph Rendering, Plugin Initialization, and Voice Startup.
                  </p>
                </div>
                <button
                  onClick={handleRunProfilerBenchmarks}
                  disabled={isBenchmarking}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
                  {isBenchmarking ? 'Profiling...' : 'Run Benchmarks'}
                </button>
              </div>

              {profilerReport && (
                <div className="space-y-4">
                  {profilerReport.summaries.map((summary) => (
                    <div
                      key={summary.operation}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-200">{summary.label}</h4>
                          <p className="text-xs text-slate-400">{summary.description}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${
                          summary.status === 'optimal'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : summary.status === 'acceptable'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {summary.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        <div>
                          <p className="text-slate-500">Average Latency</p>
                          <p className="text-sm font-mono font-semibold text-emerald-400">{summary.avgDurationMs} ms</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Min / Max</p>
                          <p className="text-sm font-mono text-slate-300">{summary.minDurationMs} / {summary.maxDurationMs} ms</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Last Latency</p>
                          <p className="text-sm font-mono text-indigo-300">{summary.lastDurationMs} ms</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Sample Count</p>
                          <p className="text-sm font-mono text-slate-300">{summary.sampleCount} runs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Event Bus Inspector */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Event Simulator Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Decoupled Event Bus Simulator
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Event Topic</label>
                    <select
                      value={simEventType}
                      onChange={(e: any) => setSimEventType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="DiceRolled">DiceRolled</option>
                      <option value="CharacterLevelUp">CharacterLevelUp</option>
                      <option value="ItemAdded">ItemAdded</option>
                      <option value="SpellLearned">SpellLearned</option>
                      <option value="CombatStarted">CombatStarted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Actor / Name</label>
                    <input
                      type="text"
                      value={simActor}
                      onChange={e => setSimActor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Formula / Value</label>
                    <input
                      type="text"
                      value={simFormula}
                      onChange={e => setSimFormula(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleFireSimulatedEvent}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Emit Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Log Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Live Central Event Bus Stream
                  </h4>
                  <button
                    onClick={() => eventBus.clearHistory()}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    Clear Feed
                  </button>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 max-h-[300px] overflow-y-auto space-y-2">
                  {eventLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">
                      No events registered yet. Use the simulator above or interact with the app.
                    </p>
                  ) : (
                    eventLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-start justify-between text-xs font-mono">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
                              {log.type}
                            </span>
                            <span className="text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-200 mt-1">
                            {JSON.stringify(log.payload)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Automated Architectural Test Suite */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Architecture Test Harness</h3>
                  <p className="text-xs text-slate-400">Validates EventBus, Plugin Registry, Version Specs, and Rule Engines.</p>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isTesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Running Diagnostic...' : 'Run Test Suite'}
                </button>
              </div>

              <div className="space-y-2">
                {testResults.map((test) => (
                  <div
                    key={test.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      test.passed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{test.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                            {test.category}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">{test.message}</p>
                      </div>
                    </div>
                    <span className="font-mono text-slate-500">{test.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>PenPaper TRPG OS Platform SDK v1.5.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close SDK Center
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperSdkModal;
