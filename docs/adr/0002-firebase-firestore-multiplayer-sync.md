# [ADR-0002] Real-time Multiplayer Party State via Firestore & WebRTC

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
Tabletop games require synchronized party state: Dungeon Masters need live character HP, spell slots, death saves, initiative rankings, and ambient background music across all connected players. Furthermore, players need low-latency spatial party voice chat without expensive central audio media servers.

## Decision Drivers
* Instant reactivity when players modify character stats (HP, spell slots, conditions).
* Minimal operational overhead for real-time WebSocket infrastructure.
* Peer-to-peer audio transmission for voice chat.

## Decision Outcome
* **Party & Room State**: Use Firebase Firestore snapshot listeners (`onSnapshot`) on session documents (`game_sessions/{sessionCode}`).
* **Voice Communications**: Use peer-to-peer WebRTC mesh networking (`RTCPeerConnection`) with Firestore as the signaling channel for SDP offer/answer exchanges and ICE candidates.

### Positive Consequences
* Zero maintenance backend for party room synchronization.
* Instant sub-second propagation of combat matrix updates and campaign ambience triggers.
* Free and low-cost P2P voice without centralized media server hosting requirements.

### Negative Consequences / Trade-offs
* Full-mesh WebRTC scaling is practical up to ~6–8 simultaneous voice connections per room, which matches standard TRPG party sizes.
