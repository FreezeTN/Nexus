# [ADR-0004] Dual-Layer Offline-First Storage Architecture

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
TRPG players often use character sheets in environments with flaky internet (conventions, cabins, basement game rooms). At the same time, users expect cloud backup, multi-device access, and real-time DM synchronization when connected.

## Decision Drivers
* Zero UI latency on character stat updates, inventory management, and spell slot tracking.
* Full offline functionality without requiring an active internet connection.
* Cloud synchronization when an authenticated user is online.

## Decision Outcome
Implement a dual-layer hybrid storage strategy:
1. **Local Layer**: Fast, reactive client state stored immediately to browser `localStorage` and `IndexedDB`.
2. **Cloud Layer**: Asynchronous debounced sync to Firebase Firestore for authenticated user accounts.
3. **Conflict Resolution**: Last-write-wins with timestamp validation and optimistic local updates.

### Positive Consequences
* Instant, stutter-free UI feedback on dice rolls, HP changes, and spell usage.
* Players never lose character progress if network connectivity drops mid-session.
* Guests and offline players have 100% full access to sheets without mandatory sign-in.
