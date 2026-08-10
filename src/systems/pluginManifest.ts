export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon?: string;
  category?: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal' | 'utility' | 'theme';
  dependencies: Record<string, string>;
  requiresAppVersion: string;
  permissions: Array<'storage' | 'event_bus' | 'dice_engine' | 'character_read' | 'character_write' | 'ui_widgets' | 'audio_engine' | 'network_api'>;
  entryPoint?: string;
  downloadUrl?: string;
  repository?: string;
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

export interface InstalledPluginState {
  manifest: PluginManifest;
  installedAt: string;
  updatedAt: string;
  enabled: boolean;
  status: 'active' | 'disabled' | 'incompatible' | 'missing_dependency';
  grantedPermissions: string[];
  installedVersion: string;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  appVersionSatisfied: boolean;
  missingDependencies: string[];
  permissionWarnings: string[];
  errors: string[];
}

export const CURRENT_PLATFORM_VERSION = '3.3.1';

/**
 * Compare semantic versions (simple lightweight parser)
 */
export function compareVersions(v1: string, v2: string): number {
  const n1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const n2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(n1.length, n2.length); i++) {
    const val1 = n1[i] || 0;
    const val2 = n2[i] || 0;
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  return 0;
}

/**
 * Check if app version satisfies a requirement range (e.g., ">=3.0.0", "^3.2.0", "3.3.1")
 */
export function satisfiesAppVersion(requiredRange: string, currentVersion: string = CURRENT_PLATFORM_VERSION): boolean {
  if (!requiredRange || requiredRange === '*' || requiredRange === 'any') return true;
  
  const cleanRange = requiredRange.trim();
  
  if (cleanRange.startsWith('>=')) {
    const minVersion = cleanRange.replace('>=', '').trim();
    return compareVersions(currentVersion, minVersion) >= 0;
  }
  if (cleanRange.startsWith('>')) {
    const minVersion = cleanRange.replace('>', '').trim();
    return compareVersions(currentVersion, minVersion) > 0;
  }
  if (cleanRange.startsWith('<=')) {
    const maxVersion = cleanRange.replace('<=', '').trim();
    return compareVersions(currentVersion, maxVersion) <= 0;
  }
  if (cleanRange.startsWith('^') || cleanRange.startsWith('~')) {
    const targetVersion = cleanRange.substring(1).trim();
    return compareVersions(currentVersion, targetVersion) >= 0;
  }
  
  return compareVersions(currentVersion, cleanRange) === 0;
}

/**
 * Validate a plugin manifest JSON string or object
 */
export function validatePluginManifest(manifestInput: unknown, installedPlugins: InstalledPluginState[] = []): CompatibilityCheckResult {
  const errors: string[] = [];
  const missingDependencies: string[] = [];
  const permissionWarnings: string[] = [];

  let manifest: Partial<PluginManifest> = {};

  if (typeof manifestInput === 'string') {
    try {
      manifest = JSON.parse(manifestInput);
    } catch {
      return {
        isCompatible: false,
        appVersionSatisfied: false,
        missingDependencies: [],
        permissionWarnings: [],
        errors: ['Invalid JSON syntax in manifest.json file.']
      };
    }
  } else if (typeof manifestInput === 'object' && manifestInput !== null) {
    manifest = manifestInput as Partial<PluginManifest>;
  } else {
    return {
      isCompatible: false,
      appVersionSatisfied: false,
      missingDependencies: [],
      permissionWarnings: [],
      errors: ['Manifest must be a JSON string or object.']
    };
  }

  // Required manifest fields check according to specification
  if (!manifest.name) errors.push('Missing required field "name" in manifest.');
  if (!manifest.version) errors.push('Missing required field "version" in manifest.');
  if (!manifest.author) errors.push('Missing required field "author" in manifest.');
  if (!manifest.requiresAppVersion) errors.push('Missing required field "requiresAppVersion" in manifest.');

  // Check Platform Version Compatibility
  const appVersionSatisfied = manifest.requiresAppVersion
    ? satisfiesAppVersion(manifest.requiresAppVersion, CURRENT_PLATFORM_VERSION)
    : false;

  if (manifest.requiresAppVersion && !appVersionSatisfied) {
    errors.push(`Incompatible platform version: requires ${manifest.requiresAppVersion}, current platform is v${CURRENT_PLATFORM_VERSION}.`);
  }

  // Check Dependencies
  if (manifest.dependencies) {
    const installedIds = new Set(installedPlugins.map(p => p.manifest.id));
    for (const [depId, depVersion] of Object.entries(manifest.dependencies)) {
      if (!installedIds.has(depId)) {
        missingDependencies.push(`${depId} (${depVersion})`);
      }
    }
  }

  // Audit Permissions
  if (manifest.permissions && Array.isArray(manifest.permissions)) {
    if (manifest.permissions.includes('character_write')) {
      permissionWarnings.push('Requests write access to player character sheets.');
    }
    if (manifest.permissions.includes('network_api')) {
      permissionWarnings.push('Requests external network API access.');
    }
    if (manifest.permissions.includes('storage')) {
      permissionWarnings.push('Requests local storage persistence access.');
    }
  }

  const isCompatible = errors.length === 0 && missingDependencies.length === 0 && appVersionSatisfied;

  return {
    isCompatible,
    appVersionSatisfied,
    missingDependencies,
    permissionWarnings,
    errors
  };
}

/**
 * Format a PluginManifest into canonical manifest.json representation for code display/export
 */
export function formatCanonicalManifestJson(manifest: PluginManifest): string {
  return JSON.stringify({
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    dependencies: manifest.dependencies || {},
    requiresAppVersion: manifest.requiresAppVersion,
    permissions: manifest.permissions || [],
    description: manifest.description,
    category: manifest.category || 'universal',
    entryPoint: manifest.entryPoint || 'plugin/index.js'
  }, null, 2);
}
