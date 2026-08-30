# [ADR-0003] Root-Level Persistent Campaign Ambience & Music Player

* **Status**: Accepted
* **Date**: 2026-08-29
* **Authors**: Nexus Core Team

## Context & Problem Statement
During a tabletop session, Dungeon Masters broadcast background ambient music (YouTube soundtrack playlists, Spotify tavern tunes, atmospheric rain). Players frequently switch between character sheets, tabs (Stats, Combat, Inventory, Spells, Notes), and pop-up modals.

If the audio player is mounted inside a specific tab or modal component, switching views unmounts the player and interrupts the audio stream, causing audio stuttering or full playback termination.

## Decision Drivers
* Music must play uninterrupted during character navigation, tab switching, and modal viewing.
* Only explicit DM pause/stop commands should alter playback state.
* Individual players should retain local mute/volume control without affecting party peers.

## Decision Outcome
Mount a single `PersistentAmbiencePlayer` component directly at the root application layer in `App.tsx`:
1. The DOM container for the embedded YouTube/Spotify player remains permanently mounted whenever an active broadcast exists.
2. View transitions and tab routing in React do not cause remounting.
3. Expanded/collapsed states toggle CSS dimensions and visibility rather than mounting/unmounting iframe DOM nodes.

### Positive Consequences
* Completely uninterrupted music streaming across the entire party session.
* Zero reload latency when toggling between sheet views or opening/closing options.
* Clean separation between DM broadcast controls (`DmAmbienceBroadcastStudio` in DM Overview) and audio output rendering.
