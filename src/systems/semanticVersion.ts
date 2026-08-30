/**
 * Semantic Versioning & Plugin Compatibility Resolver
 * 
 * Provides semver comparison, range matching (e.g. ">=3.2", "^1.0.0", ">=2.0.0 <4.0.0"),
 * and host runtime capability negotiation.
 */

export interface HostRuntimeVersion {
  readonly coreVersion: string;   // e.g. "5.2.0"
  readonly engineVersion: string; // e.g. "2.1.0"
  readonly apiVersion: number;    // e.g. 5
}

export const CURRENT_HOST_RUNTIME: HostRuntimeVersion = {
  coreVersion: '5.2.0',
  engineVersion: '2.1.0',
  apiVersion: 5
};

export interface PluginCompatibilityRequirement {
  readonly core?: string;   // e.g. ">=3.2.0"
  readonly engine?: string; // e.g. ">=2.0.0"
  readonly api?: string | number; // e.g. ">=5" or 5
  readonly dependencies?: Record<string, string>; // pluginId -> version range
}

export interface CompatibilityCheckResult {
  readonly isCompatible: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Parses a simple semver string into [major, minor, patch]
 */
export function parseSemver(v: string): [number, number, number] {
  const clean = v.trim().replace(/^[v^~>=<\s]+/, '');
  const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Compares two semver strings: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareSemver(v1: string, v2: string): number {
  const [maj1, min1, pat1] = parseSemver(v1);
  const [maj2, min2, pat2] = parseSemver(v2);

  if (maj1 !== maj2) return maj1 > maj2 ? 1 : -1;
  if (min1 !== min2) return min1 > min2 ? 1 : -1;
  if (pat1 !== pat2) return pat1 > pat2 ? 1 : -1;
  return 0;
}

/**
 * Checks if a version satisfies a comparator (e.g. ">=3.2.0", ">1.0.0", "<=5.0.0")
 */
export function satisfiesVersion(version: string, requirement: string): boolean {
  const trimmed = requirement.trim();
  if (!trimmed || trimmed === '*') return true;

  // Handle multiple range clauses separated by space (e.g., ">=2.0.0 <4.0.0")
  const clauses = trimmed.split(/\s+/).filter(Boolean);
  if (clauses.length > 1) {
    return clauses.every(clause => satisfiesVersion(version, clause));
  }

  const single = clauses[0];

  if (single.startsWith('>=')) {
    const target = single.slice(2);
    return compareSemver(version, target) >= 0;
  }
  if (single.startsWith('>')) {
    const target = single.slice(1);
    return compareSemver(version, target) > 0;
  }
  if (single.startsWith('<=')) {
    const target = single.slice(2);
    return compareSemver(version, target) <= 0;
  }
  if (single.startsWith('<')) {
    const target = single.slice(1);
    return compareSemver(version, target) < 0;
  }
  if (single.startsWith('^')) {
    // Caret range: compatible with same major version
    const target = single.slice(1);
    const [targetMaj] = parseSemver(target);
    const [verMaj] = parseSemver(version);
    return verMaj === targetMaj && compareSemver(version, target) >= 0;
  }

  // Exact match
  return compareSemver(version, single) === 0;
}

/**
 * Validates a plugin's declared requirements against the current host runtime
 */
export function checkPluginCompatibility(
  pluginId: string,
  requires?: PluginCompatibilityRequirement,
  hostRuntime: HostRuntimeVersion = CURRENT_HOST_RUNTIME
): CompatibilityCheckResult {
  if (!requires) {
    return { isCompatible: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Core version
  if (requires.core && !satisfiesVersion(hostRuntime.coreVersion, requires.core)) {
    errors.push(
      `Plugin "${pluginId}" requires Core ${requires.core}, but runtime is running Core ${hostRuntime.coreVersion}.`
    );
  }

  // Check Engine version
  if (requires.engine && !satisfiesVersion(hostRuntime.engineVersion, requires.engine)) {
    errors.push(
      `Plugin "${pluginId}" requires Engine ${requires.engine}, but runtime is running Engine ${hostRuntime.engineVersion}.`
    );
  }

  // Check API version
  if (requires.api !== undefined) {
    const apiReqStr = typeof requires.api === 'number' ? `>=${requires.api}` : String(requires.api);
    if (!satisfiesVersion(String(hostRuntime.apiVersion), apiReqStr)) {
      errors.push(
        `Plugin "${pluginId}" requires API ${apiReqStr}, but runtime API level is ${hostRuntime.apiVersion}.`
      );
    }
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings
  };
}
