/**
 * Centralized Error Strategy & Telemetry Taxonomy
 * 
 * Classifies application errors into standardized resolution channels:
 * 1. Toast (Non-blocking user notification)
 * 2. Dialog (Critical blocking user intervention needed)
 * 3. Silent Retry (Transient network/sync glitches with backoff)
 * 4. Silent Log (Telemetry & client analytics)
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export type ErrorActionChannel =
  | 'show_toast'
  | 'open_dialog'
  | 'retry_silent'
  | 'log_silent';

export interface AppErrorDescriptor {
  readonly code: string;
  readonly message: string;
  readonly severity: ErrorSeverity;
  readonly actionChannel: ErrorActionChannel;
  readonly userFacingTitle?: string;
  readonly userFacingResolution?: string;
  readonly retryAttemptsMax?: number;
  readonly isNetworkRelated?: boolean;
}

export const ERROR_REGISTRY: Record<string, AppErrorDescriptor> = {
  // Session & Sync Errors
  'SYNC_NETWORK_OFFLINE': {
    code: 'SYNC_NETWORK_OFFLINE',
    message: 'Internet connection lost during realtime session replication.',
    severity: 'warning',
    actionChannel: 'retry_silent',
    userFacingTitle: 'Working Offline',
    userFacingResolution: 'Changes are safely cached locally and will sync once reconnected.',
    retryAttemptsMax: 5,
    isNetworkRelated: true
  },
  'SESSION_NOT_FOUND': {
    code: 'SESSION_NOT_FOUND',
    message: 'The requested campaign room code does not exist or has expired.',
    severity: 'error',
    actionChannel: 'open_dialog',
    userFacingTitle: 'Campaign Room Not Found',
    userFacingResolution: 'Check the 6-character room code with your Dungeon Master and try again.'
  },
  'SESSION_PERMISSION_DENIED': {
    code: 'SESSION_PERMISSION_DENIED',
    message: 'User does not have permission to modify room ambience or DM controls.',
    severity: 'warning',
    actionChannel: 'show_toast',
    userFacingTitle: 'Permission Required',
    userFacingResolution: 'Only the Dungeon Master or session host can broadcast audio.'
  },

  // Media & Ambience Errors
  'MEDIA_URL_INVALID': {
    code: 'MEDIA_URL_INVALID',
    message: 'Provided stream URL does not match supported YouTube or Spotify formats.',
    severity: 'info',
    actionChannel: 'show_toast',
    userFacingTitle: 'Invalid Media Link',
    userFacingResolution: 'Please provide a valid YouTube video or Spotify playlist/track URL.'
  },
  'MEDIA_DRM_RESTRICTED': {
    code: 'MEDIA_DRM_RESTRICTED',
    message: 'Browser autoplay policy or DRM restricted automatic audio playback.',
    severity: 'info',
    actionChannel: 'show_toast',
    userFacingTitle: 'Manual Playback Required',
    userFacingResolution: 'Click the Play button on the embedded widget to begin listening.'
  },

  // AI & Gemini Errors
  'AI_QUOTA_EXCEEDED': {
    code: 'AI_QUOTA_EXCEEDED',
    message: 'Gemini AI generation rate limit reached.',
    severity: 'warning',
    actionChannel: 'show_toast',
    userFacingTitle: 'AI Cooldown Active',
    userFacingResolution: 'Rate limit reached. Please wait a brief moment before generating more text.'
  },
  'AI_NETWORK_ERROR': {
    code: 'AI_NETWORK_ERROR',
    message: 'Failed to contact Gemini API server endpoint.',
    severity: 'error',
    actionChannel: 'retry_silent',
    userFacingTitle: 'AI Service Error',
    userFacingResolution: 'Retrying connection...',
    retryAttemptsMax: 3,
    isNetworkRelated: true
  },

  // Storage & Export Errors
  'STORAGE_QUOTA_EXCEEDED': {
    code: 'STORAGE_QUOTA_EXCEEDED',
    message: 'Local browser storage quota is near full capacity.',
    severity: 'error',
    actionChannel: 'open_dialog',
    userFacingTitle: 'Storage Almost Full',
    userFacingResolution: 'Export backup files to disk or delete obsolete character sheets to free space.'
  }
};

/**
 * Resolves appropriate handling strategy for any runtime error
 */
export function classifyError(errorOrCode: unknown): AppErrorDescriptor {
  if (typeof errorOrCode === 'string' && ERROR_REGISTRY[errorOrCode]) {
    return ERROR_REGISTRY[errorOrCode];
  }

  const errStr = String(errorOrCode || '');

  if (errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
    return ERROR_REGISTRY['AI_QUOTA_EXCEEDED'];
  }
  if (errStr.includes('offline') || errStr.includes('network') || errStr.includes('fetch')) {
    return ERROR_REGISTRY['SYNC_NETWORK_OFFLINE'];
  }
  if (errStr.includes('permission') || errStr.includes('PERMISSION_DENIED')) {
    return ERROR_REGISTRY['SESSION_PERMISSION_DENIED'];
  }

  // Default fallback descriptor
  return {
    code: 'GENERIC_APPLICATION_ERROR',
    message: errStr || 'An unexpected error occurred.',
    severity: 'warning',
    actionChannel: 'show_toast',
    userFacingTitle: 'Action Notice',
    userFacingResolution: errStr || 'An unexpected issue occurred.'
  };
}

/**
 * Structured telemetry logger
 */
export function logTelemetry(
  category: 'sync' | 'audio' | 'ai' | 'dice' | 'plugin',
  action: string,
  meta?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[Telemetry:${category.toUpperCase()}] ${action}`, { timestamp, ...meta });
  }
}
