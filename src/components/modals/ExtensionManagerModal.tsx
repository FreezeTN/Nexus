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
  Code,
  Zap,
  Info,
  Globe,
  Trash2,
  FileText,
  BookOpen,
  ShoppingBag,
  Download,
  AlertTriangle,
  RefreshCw,
  Upload,
  Eye,
  Check,
  ShieldAlert
} from 'lucide-react';
import { RuleEdition } from '../../types';
import { systemRegistry } from '../../systems';
import { eventBus, useEventHistory } from '../../events/eventBus';
import { pluginStore, CURATED_MARKETPLACE_PLUGINS } from '../../systems/pluginStore';
import { 
  PluginManifest, 
  InstalledPluginState, 
  validatePluginManifest, 
  formatCanonicalManifestJson,
  CURRENT_PLATFORM_VERSION 
} from '../../systems/pluginManifest';

interface ExtensionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledSystems: RuleEdition[];
  onToggleSystem: (systemId: RuleEdition) => void;
  onOpenDeveloperSdk?: () => void;
}

export function ExtensionManagerModal({
  isOpen,
  onClose,
  enabledSystems,
  onToggleSystem,
  onOpenDeveloperSdk
}: ExtensionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'extensions' | 'marketplace' | 'events' | 'architecture' | 'docs'>('marketplace');
  const [selectedDoc, setSelectedDoc] = useState<'architecture' | 'pluginApi' | 'state' | 'events' | 'addingSystem'>('architecture');
  const [installedList, setInstalledList] = useState<InstalledPluginState[]>(() => pluginStore.getInstalledPlugins());
  const [viewingManifest, setViewingManifest] = useState<PluginManifest | null>(null);
  const [customManifestJson, setCustomManifestJson] = useState<string>('');
  const [customInstallError, setCustomInstallError] = useState<string | null>(null);
  const [customInstallSuccess, setCustomInstallSuccess] = useState<string | null>(null);
  const [showManifestUploader, setShowManifestUploader] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const eventHistory = useEventHistory();

  if (!isOpen) return null;

  const refreshInstalled = () => {
    setInstalledList(pluginStore.getInstalledPlugins());
  };

  const handleInstallPlugin = (manifest: PluginManifest) => {
    const res = pluginStore.installPlugin(manifest);
    if (res.success) {
      refreshInstalled();
    } else {
      alert(`Installation failed: ${res.error}`);
    }
  };

  const handleUpdatePlugin = (manifest: PluginManifest) => {
    const res = pluginStore.updatePlugin(manifest);
    if (res.success) {
      refreshInstalled();
    } else {
      alert(`Update failed: ${res.error}`);
    }
  };

  const handleTogglePlugin = (id: string) => {
    pluginStore.togglePlugin(id);
    refreshInstalled();
  };

  const handleUninstallPlugin = (id: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      pluginStore.uninstallPlugin(id);
      refreshInstalled();
    }
  };

  const handleInstallCustomManifest = () => {
    setCustomInstallError(null);
    setCustomInstallSuccess(null);

    try {
      const parsed: PluginManifest = JSON.parse(customManifestJson);
      const validation = validatePluginManifest(parsed, installedList);

      if (!validation.isCompatible) {
        setCustomInstallError(validation.errors.join(' ') || 'Manifest compatibility check failed.');
        return;
      }

      const res = pluginStore.installPlugin(parsed);
      if (res.success) {
        setCustomInstallSuccess(`Successfully installed "${parsed.name}" (v${parsed.version})!`);
        refreshInstalled();
        setCustomManifestJson('');
      } else {
        setCustomInstallError(res.error || 'Failed to install custom plugin.');
      }
    } catch {
      setCustomInstallError('Syntax error: Invalid JSON string. Please provide a valid manifest.json content.');
    }
  };

  const allSystems = systemRegistry.getAllSystems();
  const updatesAvailable = pluginStore.checkForUpdates();

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

          <div className="flex items-center gap-2">
            {onOpenDeveloperSdk && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDeveloperSdk();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-lg"
              >
                <Code className="w-4 h-4" />
                <span>Developer SDK Center</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="p-2 bg-stone-950 border-b border-stone-800 flex items-center gap-1.5 px-3 sm:px-5 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'marketplace'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Marketplace</span>
            {updatesAvailable.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {updatesAvailable.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('extensions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'extensions'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core Rulesets ({allSystems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'events'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Event Bus ({eventHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>SDK Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'docs'
                ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Docs</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'marketplace' && (
            <div className="space-y-4">
              {/* Marketplace Header & Custom Manifest Uploader Toggle */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-stone-900 to-amber-950/30 border border-emerald-600/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-serif font-bold text-sm text-emerald-200">
                      Versioned Extension Marketplace & Manifest.json Spec
                    </h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono px-2 py-0.5 rounded-full">
                      Platform v{CURRENT_PLATFORM_VERSION}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Supports <code className="text-amber-300 font-mono">plugin/manifest.json</code> metadata schema, semantic compatibility matching (<code className="text-amber-300 font-mono">requiresAppVersion</code>), dependency checks, and automated version updates.
                  </p>
                </div>

                <button
                  onClick={() => setShowManifestUploader(!showManifestUploader)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showManifestUploader ? 'Hide Uploader' : 'Install via manifest.json'}</span>
                </button>
              </div>

              {/* Custom Manifest JSON Installer Form */}
              {showManifestUploader && (
                <div className="p-4 bg-stone-950 border border-amber-600/40 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-xs text-amber-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Install Custom Plugin via manifest.json Payload</span>
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono">schema: plugin/manifest.json</span>
                  </div>

                  <p className="text-xs text-stone-400">
                    Paste custom JSON metadata containing <code className="text-amber-300">name</code>, <code className="text-amber-300">version</code>, <code className="text-amber-300">author</code>, <code className="text-amber-300">requiresAppVersion</code>, <code className="text-amber-300">dependencies</code>, and <code className="text-amber-300">permissions</code>.
                  </p>

                  <textarea
                    value={customManifestJson}
                    onChange={(e) => setCustomManifestJson(e.target.value)}
                    placeholder={`{\n  "name": "Custom Spellbook Module",\n  "version": "1.0.0",\n  "author": "Archmage Dev",\n  "requiresAppVersion": ">=3.0.0",\n  "dependencies": {},\n  "permissions": ["character_read", "ui_widgets"],\n  "description": "Adds customized ritual casting timers."\n}`}
                    className="w-full h-36 bg-stone-900 border border-stone-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
                  />

                  {customInstallError && (
                    <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{customInstallError}</span>
                    </div>
                  )}

                  {customInstallSuccess && (
                    <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{customInstallSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setCustomManifestJson(formatCanonicalManifestJson({
                          id: 'sample-custom-extension',
                          name: 'Custom Homebrew Rule Mod',
                          version: '1.0.0',
                          author: 'Community Creator',
                          description: 'Custom homebrew mechanics extension loaded via manifest.json specification.',
                          dependencies: {},
                          requiresAppVersion: '>=3.0.0',
                          permissions: ['character_read', 'event_bus', 'ui_widgets'],
                          entryPoint: 'plugin/index.js'
                        }));
                      }}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-mono rounded-lg border border-stone-800 transition"
                    >
                      Fill Example Manifest
                    </button>
                    <button
                      onClick={handleInstallCustomManifest}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-serif font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Validate & Install
                    </button>
                  </div>
                </div>
              )}

              {/* Updates Banner */}
              {updatesAvailable.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>
                      <strong>{updatesAvailable.length} Extension Update(s) Available!</strong> Newer versions are compatible with your platform.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      updatesAvailable.forEach(u => handleUpdatePlugin(u.manifest));
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs rounded-lg transition shrink-0"
                  >
                    Update All
                  </button>
                </div>
              )}

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
                <span className="text-stone-500 font-mono text-[10px] uppercase font-bold mr-1">Filter:</span>
                {['all', 'tactical', 'cyberpunk', 'horror', 'fantasy', 'utility'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-mono capitalize text-[11px] transition ${
                      filterCategory === cat
                        ? 'bg-amber-600 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Marketplace Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CURATED_MARKETPLACE_PLUGINS.filter(p => filterCategory === 'all' || p.category === filterCategory).map((plugin) => {
                  const installed = installedList.find(i => i.manifest.id === plugin.id);
                  const isInstalled = !!installed;
                  const hasUpdate = isInstalled && installed.installedVersion !== plugin.version;
                  const validation = validatePluginManifest(plugin, installedList);

                  return (
                    <div
                      key={plugin.id}
                      className="p-4 bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl transition flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1.5 rounded-lg bg-stone-900 border border-stone-800">
                              {plugin.icon || '🧩'}
                            </span>
                            <div>
                              <h4 className="font-serif font-bold text-sm text-stone-100 flex items-center gap-1.5">
                                <span>{plugin.name}</span>
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-stone-400">
                                <span>v{plugin.version}</span>
                                <span>•</span>
                                <span>by {plugin.author}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setViewingManifest(plugin)}
                            className="p-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 rounded-lg text-[10px] font-mono flex items-center gap-1 transition shrink-0"
                            title="Inspect manifest.json"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>manifest.json</span>
                          </button>
                        </div>

                        <p className="text-xs text-stone-400 mt-2.5 leading-relaxed">
                          {plugin.description}
                        </p>

                        {/* Manifest Compatibility & Requirements */}
                        <div className="mt-3 p-2 bg-stone-900/80 border border-stone-800 rounded-lg text-[10px] font-mono space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Platform Requirement:</span>
                            <span className={validation.appVersionSatisfied ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {plugin.requiresAppVersion} ({validation.appVersionSatisfied ? 'Satisfied' : 'Incompatible'})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Entry Point:</span>
                            <span className="text-stone-300">{plugin.entryPoint || 'plugin/manifest.json'}</span>
                          </div>
                        </div>

                        {/* Permissions Badges */}
                        {plugin.permissions && plugin.permissions.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {plugin.permissions.map((perm, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[9px] bg-amber-950/40 border border-amber-600/30 text-amber-300 px-1.5 py-0.5 rounded font-mono"
                              >
                                🔒 {perm}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Controls */}
                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                        {isInstalled ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" /> Active (v{installed.installedVersion})
                            </span>
                            <button
                              onClick={() => handleTogglePlugin(plugin.id)}
                              className="text-[10px] font-mono text-stone-400 hover:text-stone-200 underline"
                            >
                              {installed.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-500">
                            Available in Marketplace
                          </span>
                        )}

                        <div>
                          {hasUpdate ? (
                            <button
                              onClick={() => handleUpdatePlugin(plugin)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs rounded-lg transition flex items-center gap-1 shadow"
                            >
                              <RefreshCw className="w-3 h-3" /> Update to v{plugin.version}
                            </button>
                          ) : isInstalled ? (
                            <button
                              onClick={() => handleUninstallPlugin(plugin.id)}
                              className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-mono transition"
                            >
                              Uninstall
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInstallPlugin(plugin)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-serif font-bold text-xs rounded-lg transition flex items-center gap-1 shadow"
                            >
                              <Download className="w-3.5 h-3.5" /> Install Extension
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manifest Inspector Dialog */}
          {viewingManifest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="font-serif font-bold text-sm text-amber-100">
                      plugin/manifest.json Spec Viewer
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingManifest(null)}
                    className="p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-stone-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3 font-mono text-xs">
                  <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 space-y-1">
                    <div className="text-[10px] text-stone-500 uppercase font-bold">Extension Summary</div>
                    <div className="text-amber-300 font-bold">{viewingManifest.name} (v{viewingManifest.version})</div>
                    <div className="text-stone-400">Author: {viewingManifest.author}</div>
                  </div>

                  <div className="text-[10px] text-stone-500 uppercase font-bold">Canonical manifest.json Representation</div>
                  <pre className="p-3 bg-stone-950 border border-stone-800 rounded-lg text-emerald-300 text-[11px] overflow-x-auto h-64">
{formatCanonicalManifestJson(viewingManifest)}
                  </pre>
                </div>

                <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
                  <button
                    onClick={() => setViewingManifest(null)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

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

                        {/* Ecosystem Metadata & Dependency Status */}
                        <div className="mt-2.5 p-2 bg-stone-900/60 border border-stone-800 rounded-lg flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Dependency Check Passed
                          </span>
                          <span className="text-stone-400">
                            Min Platform: {sys.minPlatformVersion || 'v3.0+'}
                          </span>
                        </div>

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
