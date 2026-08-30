# Security Specification & Threat Model

## 1. Core Data Invariants

1. **Authentication & Identity Invariant**: No unauthenticated client can write, mutate, or delete persistent data across characters, users, game sessions, presence locks, or campaign saves.
2. **Character Ownership Invariant**: Characters can only be created by the authenticated owner (`request.resource.data.ownerId == request.auth.uid`), updated by their owner (`resource.data.ownerId == request.auth.uid`), and deleted only by their owner.
3. **User Profile Invariant**: Users can only create or update their own user profile document (`request.auth.uid == userId`). Deletion of user profile documents from client SDK is blocked.
4. **Game Session DM Authority Invariant**: A game session can only be created by an authenticated user who becomes the DM (`request.resource.data.dmUid == request.auth.uid`), and closed or deleted only by that DM. Players can only mutate their membership participation record in the session.
5. **Campaign Save Invariant**: Campaign saves can only be created, modified, or deleted by the host DM (`hostUid == request.auth.uid`).
6. **Voice Signaling Ephemerality & Isolation Invariant**: Voice signaling messages (`voice_signals`) can only be sent with `senderUid == request.auth.uid`, and deleted by either the sender or intended receiver. Voice peer states can only be written by the matching peer UID (`request.auth.uid == peerId`).
7. **Query Security Invariant**: Character lists and campaign save queries strictly require filtering by `ownerId == request.auth.uid` or `hostUid == request.auth.uid` so that queries never leak unauthorized documents.

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

| # | Attack Scenario | Target Collection | Payload / Action | Expected Result |
|---|---|---|---|---|
| 1 | **Unauthenticated Character Injection** | `/characters/char_hack_01` | Create character with no `request.auth` | `PERMISSION_DENIED` |
| 2 | **Character Ownership Hijack** | `/characters/char_legit_02` | Authenticated User A tries to overwrite User B's character sheet | `PERMISSION_DENIED` |
| 3 | **Character Malicious Deletion** | `/characters/char_victim_03` | User A calls `deleteDoc` on User B's character | `PERMISSION_DENIED` |
| 4 | **User Profile Impersonation** | `/users/user_target_04` | User A creates or updates `/users/user_target_04` | `PERMISSION_DENIED` |
| 5 | **Campaign Save Tampering** | `/campaign_saves/save_target_05` | User A tries to overwrite User B's DM campaign save file | `PERMISSION_DENIED` |
| 6 | **Campaign Save Wiping** | `/campaign_saves/save_target_06` | User A calls `deleteDoc` on User B's campaign save | `PERMISSION_DENIED` |
| 7 | **Unauthorized Session Closure** | `/sessions/ROOM12` | Player tries to set `status: 'closed'` on DM's session | `PERMISSION_DENIED` |
| 8 | **Ghost Field Injection on User Profile** | `/users/user_self_08` | User injects 500KB junk string payload into user profile | `PERMISSION_DENIED` (Exceeds size limits) |
| 9 | **Voice Peer Identity Spoofing** | `/sessions/ROOM12/voice_peers/victim_uid` | User A updates mute/audio state under User B's peer ID | `PERMISSION_DENIED` |
| 10 | **Voice Signal Forgery** | `/sessions/ROOM12/voice_signals/sig_hack_10` | User A sends signal with forged `senderUid: "victim_uid"` | `PERMISSION_DENIED` |
| 11 | **Unbounded Global Query Scraping** | `/characters` | Unauthenticated query requesting all characters in database | `PERMISSION_DENIED` |
| 12 | **Orphaned Save File Creation** | `/campaign_saves/save_spoof_12` | User A writes save file with `hostUid: "victim_dm_uid"` | `PERMISSION_DENIED` |
