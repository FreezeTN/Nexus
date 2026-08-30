# [ADR-0009] Semantic Plugin Compatibility & Versioning

* **Status**: Accepted
* **Date**: 2026-08-30
* **Authors**: Nexus Core Team

## Context & Problem Statement
As third-party community plugins and official rule systems expand, simply loading all installed plugins without version negotiation risks crashes when a plugin expects newer engine methods or deprecated core APIs.

## Decision Drivers
* Allow plugins to declare strict or range-based compatibility constraints (e.g. `requires: { core: ">=3.2", engine: ">=2.0", api: ">=5" }`).
* Automatically evaluate plugin requirements against current host runtime versions during contract verification.
* Provide actionable error messages when a plugin fails compatibility checks.

## Decision Outcome
Created `src/systems/semanticVersion.ts` and integrated semver checking into `verifyPluginContracts`:
1. **`PluginCompatibilityRequirement`**: Schema supporting `core`, `engine`, `api`, and inter-plugin `dependencies`.
2. **`CURRENT_HOST_RUNTIME`**: Host runtime version descriptors (`coreVersion: 5.2.0`, `engineVersion: 2.1.0`, `apiVersion: 5`).
3. **`satisfiesVersion` & `compareSemver`**: Semver evaluation supporting `>=`, `<=`, `^`, `>`, `<`, and multi-clause ranges.
4. **Contract Integration**: `verifyPluginContracts` rejects packages whose requirements are unmet before they can execute or cause runtime faults.

### Positive Consequences
* Prevents broken plugins from loading or crashing the host application.
* Clear developer errors guide plugin authors to update or target supported APIs.
