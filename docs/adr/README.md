# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Nexus TRPG platform.

An Architecture Decision Record captures an important architectural decision made along with its context and consequences.

## Why ADRs?
- **Separate Tech from User Notes**: Keep user-facing `changelogData` focused purely on gameplay and UI experience, while storing deep technical/architectural reasoning in ADRs.
- **Onboarding Context**: Enable new contributors to understand *why* certain technologies, structures, or state patterns were chosen.
- **Traceability**: Maintain a clear historical evolution of the platform's engineering foundation.

---

## ADR Index

| ADR | Title | Status | Date |
| :--- | :--- | :--- | :--- |
| [ADR 0001](0001-record-architecture-decisions.md) | Record Architecture Decisions via ADRs | Accepted | 2026-08 |
| [ADR 0002](0002-firebase-firestore-multiplayer-sync.md) | Real-time Multiplayer Party State via Firestore & WebRTC | Accepted | 2026-08 |
| [ADR 0003](0003-persistent-root-level-campaign-ambience.md) | Root-Level Persistent Campaign Ambience & Music Player | Accepted | 2026-08 |
| [ADR 0004](0004-offline-first-hybrid-storage.md) | Dual-Layer Offline-First Storage Architecture | Accepted | 2026-08 |
| [ADR 0005](0005-modular-hook-architecture-decomposition.md) | Modular Custom Hook Architecture Decomposition (App.tsx) | Accepted | 2026-08 |
| [ADR 0006](0006-four-tier-state-architecture.md) | Four-Tier State Separation Architecture (Server -> Domain -> UI -> Transient) | Accepted | 2026-08 |
| [ADR 0007](0007-rich-domain-modeling-and-modifier-engine.md) | Rich Domain Modeling & Modifier Stacking Engine | Accepted | 2026-08 |
| [ADR 0008](0008-centralized-error-strategy-and-telemetry.md) | Centralized Error Strategy & Telemetry Taxonomy | Accepted | 2026-08 |
| [ADR 0009](0009-semantic-plugin-compatibility-and-versioning.md) | Semantic Plugin Compatibility & Versioning | Accepted | 2026-08 |

---

## ADR Template

When authoring a new ADR, create a file named `NNNN-short-descriptive-title.md` using this structure:

```markdown
# [ADR-NNNN] Title

* **Status**: [Proposed | Accepted | Superseded | Deprecated]
* **Date**: YYYY-MM-DD
* **Authors**: [Author Names / Maintainers]

## Context & Problem Statement
What problem were we trying to solve? What constraints or requirements applied?

## Decision Drivers
* Key concern 1
* Key concern 2

## Considered Options
* Option 1
* Option 2

## Decision Outcome
Chosen option and justification.

### Positive Consequences
* Advantage 1
* Advantage 2

### Negative Consequences / Trade-offs
* Trade-off 1
```
