import { 
  PluginManifest, 
  InstalledPluginState, 
  validatePluginManifest, 
  CURRENT_PLATFORM_VERSION 
} from './pluginManifest';
import { eventBus } from '../events/eventBus';

const STORAGE_KEY_INSTALLED_PLUGINS = 'dnd_app_installed_marketplace_plugins_v1';

export const CURATED_MARKETPLACE_PLUGINS: PluginManifest[] = [
  {
    id: 'pathfinder2e-tactical-engine',
    name: 'Pathfinder 2e Tactical Combat Engine',
    version: '2.1.0',
    author: 'Paizo Community Devs',
    description: 'Adds 3-action economy tracking, multiple attack penalties (MAP), condition severity counters, and reaction triggers.',
    icon: '⚔️',
    category: 'tactical',
    dependencies: {},
    requiresAppVersion: '>=3.0.0',
    permissions: ['character_read', 'event_bus', 'ui_widgets'],
    entryPoint: 'plugin/pf2eTactical.js',
    changelog: [
      { version: '2.1.0', date: '2026-08-01', changes: ['Added MAP -5/-10 auto-calculator for secondary attacks.', 'Reaction availability indicator in turn order.'] },
      { version: '2.0.0', date: '2026-06-15', changes: ['Initial release for 3.0 Platform API.'] }
    ]
  },
  {
    id: 'cyberpunk-netrunner-suite',
    name: 'Cyberpunk RED Netrunning & Cyberdeck Suite',
    version: '1.4.2',
    author: 'NightCity Hardware Guild',
    description: 'Cyberdeck RAM manager, ICE encounter tracker, program memory grids, and Black ICE damage resolvers.',
    icon: '💾',
    category: 'cyberpunk',
    dependencies: {},
    requiresAppVersion: '>=3.0.0',
    permissions: ['character_write', 'dice_engine', 'ui_widgets'],
    entryPoint: 'plugin/netrunner.js',
    changelog: [
      { version: '1.4.2', date: '2026-07-20', changes: ['Updated Cyberdeck RAM burn-out animations.', 'Added Hellhound and Kraken ICE presets.'] }
    ]
  },
  {
    id: 'shadowrun-matrix-decking',
    name: 'Shadowrun 5e Matrix & Cyberware Monitor',
    version: '2.0.1',
    author: 'Chummer Open Source',
    description: 'Essence loss calculators, Cyberware grade modifiers, Matrix initiative dice rolls, and Overwatch Score tracking.',
    icon: '⚡',
    category: 'cyberpunk',
    dependencies: {},
    requiresAppVersion: '>=3.1.0',
    permissions: ['character_write', 'storage', 'event_bus'],
    entryPoint: 'plugin/shadowrunMatrix.js',
    changelog: [
      { version: '2.0.1', date: '2026-08-05', changes: ['Fixed Essence calculation precision for Alphaware grade implants.'] }
    ]
  },
  {
    id: 'coc7e-sanity-investigator',
    name: 'Call of Cthulhu 7e Sanity & Insanity Tracker',
    version: '1.5.0',
    author: 'Chaosium Fan Project',
    description: 'Bouts of Madness generator, Indefinite Insanity tracker, Mythos knowledge rolls, and Luck spend counters.',
    icon: '🐙',
    category: 'horror',
    dependencies: {},
    requiresAppVersion: '>=3.0.0',
    permissions: ['character_write', 'event_bus', 'storage'],
    entryPoint: 'plugin/cocSanity.js',
    changelog: [
      { version: '1.5.0', date: '2026-07-10', changes: ['Added 100-entry Bout of Madness table roll engine.'] }
    ]
  },
  {
    id: 'dice-3d-physics-sim',
    name: 'Universal 3D Dice Physics & Audio FX',
    version: '1.2.0',
    author: 'Polyhedral Labs',
    description: 'Custom polyhedral d4-d100 3D dice materials, metal impact soundscapes, and critical success particle bursts.',
    icon: '🎲',
    category: 'utility',
    dependencies: {},
    requiresAppVersion: '>=3.0.0',
    permissions: ['dice_engine', 'audio_engine', 'ui_widgets'],
    entryPoint: 'plugin/dicePhysics.js',
    changelog: [
      { version: '1.2.0', date: '2026-08-08', changes: ['Added obsidian and gold foil dice skin themes.'] }
    ]
  },
  {
    id: 'dm-ambient-synth-audio',
    name: 'DM Ambient Soundscape Synthesizer',
    version: '1.1.0',
    author: 'Dungeon Soundscapes',
    description: 'Generative procedural audio loops for taverns, stormy dungeons, cybernetic alleyways, and boss battle tension.',
    icon: '🎵',
    category: 'utility',
    dependencies: {},
    requiresAppVersion: '>=3.2.0',
    permissions: ['audio_engine', 'ui_widgets'],
    entryPoint: 'plugin/ambientSynth.js',
    changelog: [
      { version: '1.1.0', date: '2026-07-28', changes: ['Added weather effects synthesizer (rain, thunder, howling wind).'] }
    ]
  },
  {
    id: 'homebrew-monster-creator',
    name: 'D&D 5e Homebrew Monster & Subclass Workbench',
    version: '1.3.0',
    author: 'Arcane Workshop',
    description: 'Challenge Rating (CR) balance benchmark calculator, legendary action designer, and Markdown stat block exporter.',
    icon: '🐲',
    category: 'fantasy',
    dependencies: {},
    requiresAppVersion: '>=3.0.0',
    permissions: ['character_write', 'storage'],
    entryPoint: 'plugin/homebrewCreator.js',
    changelog: [
      { version: '1.3.0', date: '2026-08-02', changes: ['Export stat blocks directly to Markdown and PDF.'] }
    ]
  }
];

class VersionedPluginStore {
  private installedPlugins: Map<string, InstalledPluginState> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INSTALLED_PLUGINS);
      if (saved) {
        const parsed: InstalledPluginState[] = JSON.parse(saved);
        parsed.forEach(p => this.installedPlugins.set(p.manifest.id, p));
      } else {
        // Pre-install a couple of default plugins as examples
        this.installPlugin(CURATED_MARKETPLACE_PLUGINS[0]); // PF2e
        this.installPlugin(CURATED_MARKETPLACE_PLUGINS[4]); // 3D Dice
      }
    } catch {
      // Fallback
    }
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.installedPlugins.values());
      localStorage.setItem(STORAGE_KEY_INSTALLED_PLUGINS, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  public getInstalledPlugins(): InstalledPluginState[] {
    return Array.from(this.installedPlugins.values());
  }

  public getInstalledPlugin(id: string): InstalledPluginState | undefined {
    return this.installedPlugins.get(id);
  }

  public installPlugin(manifest: PluginManifest, grantedPermissions?: string[]): { success: boolean; error?: string } {
    const installed = this.getInstalledPlugins();
    const validation = validatePluginManifest(manifest, installed);

    if (!validation.isCompatible) {
      return {
        success: false,
        error: validation.errors.join(' ') || `Plugin requires platform ${manifest.requiresAppVersion}`
      };
    }

    const state: InstalledPluginState = {
      manifest,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: true,
      status: 'active',
      grantedPermissions: grantedPermissions || manifest.permissions || [],
      installedVersion: manifest.version
    };

    this.installedPlugins.set(manifest.id, state);
    this.saveToStorage();

    eventBus.emit('SystemPluginToggled', {
      pluginId: manifest.id,
      enabled: true,
      version: manifest.version
    });

    return { success: true };
  }

  public updatePlugin(manifest: PluginManifest): { success: boolean; error?: string } {
    const existing = this.installedPlugins.get(manifest.id);
    if (!existing) {
      return this.installPlugin(manifest);
    }

    const installed = this.getInstalledPlugins();
    const validation = validatePluginManifest(manifest, installed);

    if (!validation.isCompatible) {
      return {
        success: false,
        error: validation.errors.join(' ')
      };
    }

    existing.manifest = manifest;
    existing.installedVersion = manifest.version;
    existing.updatedAt = new Date().toISOString();
    existing.grantedPermissions = manifest.permissions || [];
    existing.status = 'active';

    this.saveToStorage();

    eventBus.emit('SystemPluginToggled', {
      pluginId: manifest.id,
      enabled: existing.enabled,
      version: manifest.version,
      updated: true
    });

    return { success: true };
  }

  public togglePlugin(id: string): void {
    const plugin = this.installedPlugins.get(id);
    if (plugin) {
      plugin.enabled = !plugin.enabled;
      plugin.status = plugin.enabled ? 'active' : 'disabled';
      this.saveToStorage();
      eventBus.emit('SystemPluginToggled', {
        pluginId: id,
        enabled: plugin.enabled
      });
    }
  }

  public uninstallPlugin(id: string): void {
    if (this.installedPlugins.has(id)) {
      this.installedPlugins.delete(id);
      this.saveToStorage();
      eventBus.emit('SystemPluginToggled', {
        pluginId: id,
        enabled: false,
        uninstalled: true
      });
    }
  }

  public checkForUpdates(): Array<{ manifest: PluginManifest; newVersion: string; currentVersion: string }> {
    const updatesAvailable: Array<{ manifest: PluginManifest; newVersion: string; currentVersion: string }> = [];

    for (const catalogItem of CURATED_MARKETPLACE_PLUGINS) {
      const installed = this.installedPlugins.get(catalogItem.id);
      if (installed && installed.installedVersion !== catalogItem.version) {
        updatesAvailable.push({
          manifest: catalogItem,
          newVersion: catalogItem.version,
          currentVersion: installed.installedVersion
        });
      }
    }

    return updatesAvailable;
  }
}

export const pluginStore = new VersionedPluginStore();
