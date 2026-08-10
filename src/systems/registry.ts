import { RuleEdition } from '../types';
import { GameSystemPlugin } from './types';
import { dnd5ePlugin } from './plugins/dnd5ePlugin';
import { dnd35ePlugin } from './plugins/dnd35ePlugin';
import { pathfinder2ePlugin } from './plugins/pathfinder2ePlugin';
import { shadowrun5ePlugin } from './plugins/shadowrun5ePlugin';
import { cthulhu7ePlugin } from './plugins/cthulhu7ePlugin';

class GameSystemRegistry {
  private plugins: Map<RuleEdition, GameSystemPlugin> = new Map();

  constructor() {
    this.register(dnd5ePlugin);
    this.register(dnd35ePlugin);
    this.register(pathfinder2ePlugin);
    this.register(shadowrun5ePlugin);
    this.register(cthulhu7ePlugin);
  }

  public register(plugin: GameSystemPlugin): void {
    this.plugins.set(plugin.id, plugin);
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
