# [ADR-0008] Centralized Error Strategy & Telemetry Taxonomy

* **Status**: Accepted
* **Date**: 2026-08-30
* **Authors**: Nexus Core Team

## Context & Problem Statement
Previously, errors across different features (Firebase synchronization, WebRTC audio streaming, YouTube/Spotify embeds, and Gemini AI generations) were handled ad-hoc with inconsistent user notifications, arbitrary console logs, and uncoordinated retries.

## Decision Drivers
* Define a predictable taxonomy for error handling across the entire application.
* Clearly differentiate between user-actionable notifications (Toast vs Dialog), silent retries with backoff, and background telemetry.
* Improve debugging and observability without polluting the user experience.

## Decision Outcome
Implemented `src/utils/errorStrategy.ts` defining four standardized resolution channels:
1. **`show_toast`**: Non-blocking notices for benign, temporary, or informative errors (e.g. invalid YouTube URL, DRM play notice).
2. **`open_dialog`**: Critical blocking notices requiring user intervention (e.g. storage full, invalid campaign room code).
3. **`retry_silent`**: Automatic background retry with exponential backoff for network/sync blips.
4. **`log_silent`**: Developer/telemetry logging for non-critical lifecycle tracking (`logTelemetry`).

### Positive Consequences
* UX is consistent: users only see dialogs when intervention is strictly necessary.
* Temporary network disconnects retry silently without disturbing tabletop gameplay.
* Telemetry provides clear category traces (`sync`, `audio`, `ai`, `dice`, `plugin`).
