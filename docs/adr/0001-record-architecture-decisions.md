# [ADR-0001] Record Architecture Decisions via ADRs

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
As the Nexus platform grew in complexity—encompassing multi-system rule parsing, real-time party synchronization, audio streaming, WebRTC voice communication, and subscription logic—technical architecture decisions became mixed with user-facing changelogs in the UI.

We needed a standardized method to document high-level architectural choices, frameworks, and system trade-offs without cluttering in-app player release notes.

## Decision Drivers
* Clean separation of player-facing feature changelogs (`src/data/changelogData.ts`) and developer architectural records.
* Facilitate onboarding for open-source contributors and co-developers.
* Create an immutable trail of system decisions and trade-offs.

## Considered Options
1. Keep all changes and technical notes in `changelogData.ts` and `CHANGELOG.txt`.
2. Maintain separate Architecture Decision Records in `docs/adr/` following standard markdown ADR templates.

## Decision Outcome
Adopt Option 2: Establish `docs/adr/` with standard sequential markdown files for all major architectural decisions.

### Positive Consequences
* `changelogData.ts` and the in-app User Manual stay focused on gameplay enhancements, UI polishes, and user workflows.
* Technical decisions have full context, alternatives considered, and trade-off analyses preserved in version control.
