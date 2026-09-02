import { RuleEdition } from '../types';
import { GameSystemPlugin } from './types';
import { dnd5ePlugin } from './plugins/dnd5ePlugin';
import { dnd35ePlugin } from './plugins/dnd35ePlugin';
import { pathfinder2ePlugin } from './plugins/pathfinder2ePlugin';
import { shadowrun5ePlugin } from './plugins/shadowrun5ePlugin';
import { cthulhu7ePlugin } from './plugins/cthulhu7ePlugin';

const STORAGE_KEY_CUSTOM_SYSTEM_PLUGINS = 'nexus_custom_system_plugins_v1';

class GameSystemRegistry {
  private plugins: Map<RuleEdition, GameSystemPlugin> = new Map();

  constructor() {
    this.register(dnd5ePlugin);
    this.register(dnd35ePlugin);
    this.register(pathfinder2ePlugin);
    this.register(shadowrun5ePlugin);
    this.register(cthulhu7ePlugin);
    this.loadCustomPlugins();
  }

  public register(plugin: GameSystemPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public registerAndSaveCustomPlugin(plugin: GameSystemPlugin): void {
    this.register(plugin);
    try {
      const existing = this.getSavedCustomPlugins();
      const filtered = existing.filter(p => p.id !== plugin.id);
      filtered.push(plugin);
      localStorage.setItem(STORAGE_KEY_CUSTOM_SYSTEM_PLUGINS, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to persist custom system plugin:', e);
    }
  }

  public unregisterCustomPlugin(id: string): void {
    this.plugins.delete(id as RuleEdition);
    try {
      const existing = this.getSavedCustomPlugins();
      const filtered = existing.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY_CUSTOM_SYSTEM_PLUGINS, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to update custom system plugins storage:', e);
    }
  }

  public getSavedCustomPlugins(): GameSystemPlugin[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_SYSTEM_PLUGINS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse custom system plugins:', e);
    }
    return [];
  }

  private loadCustomPlugins(): void {
    const saved = this.getSavedCustomPlugins();
    saved.forEach(p => {
      if (p && p.id && p.name) {
        this.plugins.set(p.id, p);
      }
    });
  }

  public getSystem(id?: RuleEdition | string): GameSystemPlugin {
    if (!id) return dnd5ePlugin;
    const plugin = this.plugins.get(id as RuleEdition);
    if (plugin) return plugin;
    return dnd5ePlugin;
  }

  public getAllSystems(): GameSystemPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getSupportedEditions(): RuleEdition[] {
    return Array.from(this.plugins.keys());
  }
}

export const systemRegistry = new GameSystemRegistry();

