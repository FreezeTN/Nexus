/**
 * Intelligent Domain Caching Layer
 * Domain-specific caches with cache invalidation policies:
 * 1. Search Index Cache: Rebuilds only when underlying dataset hash changes.
 * 2. Knowledge Graph Cache: Incremental node & edge updates without full recalculation.
 * 3. Spell & Rules Engine Cache: Memoized rules lookups keyed by TRPG system.
 * 4. Plugin Metadata Cache: Cached until plugin version or manifest hash changes.
 */

export interface CacheEntry<T> {
  data: T;
  hash: string;
  timestamp: number;
  hitCount: number;
  sizeBytes: number;
}

class DomainCacheManager {
  private searchIndexCache: CacheEntry<any> | null = null;
  private graphCache: Map<string, CacheEntry<any>> = new Map();
  private spellRulesCache: Map<string, CacheEntry<any>> = new Map();
  private pluginMetadataCache: Map<string, CacheEntry<any>> = new Map();

  private stats = {
    searchHits: 0,
    searchMisses: 0,
    graphHits: 0,
    graphMisses: 0,
    spellHits: 0,
    spellMisses: 0,
    pluginHits: 0,
    pluginMisses: 0
  };

  /**
   * Search Index Cache
   */
  public getSearchIndex(dataHash: string): any | null {
    if (this.searchIndexCache && this.searchIndexCache.hash === dataHash) {
      this.searchIndexCache.hitCount++;
      this.stats.searchHits++;
      return this.searchIndexCache.data;
    }
    this.stats.searchMisses++;
    return null;
  }

  public setSearchIndex(dataHash: string, indexData: any) {
    const sizeBytes = JSON.stringify(indexData).length * 2;
    this.searchIndexCache = {
      data: indexData,
      hash: dataHash,
      timestamp: Date.now(),
      hitCount: 0,
      sizeBytes
    };
  }

  /**
   * Knowledge Graph Cache (Incremental updates)
   */
  public getGraphLayout(campaignId: string, graphHash: string): any | null {
    const cached = this.graphCache.get(campaignId);
    if (cached && cached.hash === graphHash) {
      cached.hitCount++;
      this.stats.graphHits++;
      return cached.data;
    }
    this.stats.graphMisses++;
    return null;
  }

  public setGraphLayout(campaignId: string, graphHash: string, layoutData: any) {
    const sizeBytes = JSON.stringify(layoutData).length * 2;
    this.graphCache.set(campaignId, {
      data: layoutData,
      hash: graphHash,
      timestamp: Date.now(),
      hitCount: 0,
      sizeBytes
    });
  }

  public updateGraphIncremental(campaignId: string, nodeId: string, updatedNode: any) {
    const cached = this.graphCache.get(campaignId);
    if (cached && cached.data && Array.isArray(cached.data.nodes)) {
      const idx = cached.data.nodes.findIndex((n: any) => n.id === nodeId);
      if (idx !== -1) {
        cached.data.nodes[idx] = { ...cached.data.nodes[idx], ...updatedNode };
      } else {
        cached.data.nodes.push(updatedNode);
      }
      cached.timestamp = Date.now();
    }
  }

  /**
   * Spell & Rules Engine Cache
   */
  public getSpellRules(systemId: string, key: string): any | null {
    const cacheKey = `${systemId}:${key}`;
    const cached = this.spellRulesCache.get(cacheKey);
    if (cached) {
      cached.hitCount++;
      this.stats.spellHits++;
      return cached.data;
    }
    this.stats.spellMisses++;
    return null;
  }

  public setSpellRules(systemId: string, key: string, data: any) {
    const cacheKey = `${systemId}:${key}`;
    const sizeBytes = JSON.stringify(data).length * 2;
    this.spellRulesCache.set(cacheKey, {
      data,
      hash: `${systemId}-${key}`,
      timestamp: Date.now(),
      hitCount: 0,
      sizeBytes
    });
  }

  /**
   * Plugin Metadata Cache
   */
  public getPluginMetadata(pluginId: string, version: string): any | null {
    const cached = this.pluginMetadataCache.get(pluginId);
    if (cached && cached.hash === version) {
      cached.hitCount++;
      this.stats.pluginHits++;
      return cached.data;
    }
    this.stats.pluginMisses++;
    return null;
  }

  public setPluginMetadata(pluginId: string, version: string, metadata: any) {
    const sizeBytes = JSON.stringify(metadata).length * 2;
    this.pluginMetadataCache.set(pluginId, {
      data: metadata,
      hash: version,
      timestamp: Date.now(),
      hitCount: 0,
      sizeBytes
    });
  }

  /**
   * Metrics & Memory Footprint
   */
  public getCacheFootprint() {
    let totalSizeBytes = 0;
    if (this.searchIndexCache) totalSizeBytes += this.searchIndexCache.sizeBytes;

    this.graphCache.forEach(entry => { totalSizeBytes += entry.sizeBytes; });
    this.spellRulesCache.forEach(entry => { totalSizeBytes += entry.sizeBytes; });
    this.pluginMetadataCache.forEach(entry => { totalSizeBytes += entry.sizeBytes; });

    const totalRequests =
      this.stats.searchHits + this.stats.searchMisses +
      this.stats.graphHits + this.stats.graphMisses +
      this.stats.spellHits + this.stats.spellMisses +
      this.stats.pluginHits + this.stats.pluginMisses;

    const totalHits =
      this.stats.searchHits + this.stats.graphHits +
      this.stats.spellHits + this.stats.pluginHits;

    const hitRatePercent = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 100;

    return {
      sizeKb: Math.round((totalSizeBytes / 1024) * 10) / 10,
      sizeMb: Math.round((totalSizeBytes / 1024 / 1024) * 100) / 100,
      hitRatePercent,
      stats: { ...this.stats }
    };
  }

  public clearAllCaches() {
    this.searchIndexCache = null;
    this.graphCache.clear();
    this.spellRulesCache.clear();
    this.pluginMetadataCache.clear();
  }
}

export const domainCaches = new DomainCacheManager();
