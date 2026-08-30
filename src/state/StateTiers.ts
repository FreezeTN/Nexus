/**
 * Four-Tier State Management Utilities & Diagnostic Helpers
 * 
 * Provides tier metadata, classification guards, and runtime state boundary validators.
 */

import { StateTier, StateTierDescriptor } from './types';

export const STATE_TIERS_REGISTRY: Record<StateTier, StateTierDescriptor> = {
  server: {
    tier: 'server',
    description: 'Durable cloud database (Firestore), realtime party rooms, remote user profiles.',
    isPersistent: true,
    syncTarget: 'firestore'
  },
  domain: {
    tier: 'domain',
    description: 'TRPG business entities, rules engines, calculated character stats, combat state.',
    isPersistent: true,
    syncTarget: 'indexeddb_localstorage'
  },
  ui: {
    tier: 'ui',
    description: 'View routing, tab selection, modal visibility coordinators, draft form values.',
    isPersistent: false,
    syncTarget: 'memory_react_context'
  },
  transient: {
    tier: 'transient',
    description: 'High-frequency animations, 3D dice physics, WebRTC audio levels, hover tooltips.',
    isPersistent: false,
    syncTarget: 'request_animation_frame'
  }
};

/**
 * Validates that an operation does not bridge forbidden state boundaries.
 * (e.g. Transient high-frequency values should NEVER trigger synchronous server writes).
 */
export function validateStateFlow(
  sourceTier: StateTier,
  targetTier: StateTier
): { allowed: boolean; warning?: string } {
  // Direct Transient -> Server is an architectural anti-pattern
  if (sourceTier === 'transient' && targetTier === 'server') {
    return {
      allowed: false,
      warning: 'Forbidden State Transition: Transient frame data (e.g., dice physics / audio volume) must not directly invoke Server writes. Debounce or aggregate into Domain state first.'
    };
  }

  // Normal hierarchical data flow: Server -> Domain -> UI -> Transient
  return { allowed: true };
}

/**
 * Returns metadata descriptor for a given state tier.
 */
export function getStateTierDescriptor(tier: StateTier): StateTierDescriptor {
  return STATE_TIERS_REGISTRY[tier];
}
