export interface ChangelogHighlight {
  category: string;
  detail: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  badge: string;
  badgeColor: string;
  highlights: ChangelogHighlight[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: 'v3.6.0',
    date: 'August 2026',
    title: 'Integrated WebRTC Party Voice Client, UI Positioning Fixes & Security Hardening',
    badge: 'Latest Update',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🎙️ Integrated WebRTC Party Voice Client',
        detail: 'Embedded peer-to-peer audio voice channel with WebRTC signaling, volume controls per adventurer, push-to-talk keybinds, microphone/audio deafen controls, and fallback custom room code support (e.g. #PARTY1).'
      },
      {
        category: '📐 UI Layout & Non-Overlapping Floating Widgets',
        detail: 'Relocated floating Party Voice bar to the bottom-left viewport to completely eliminate overlap with the bottom-right Dice Tray button. Added top header quick-access button and dismissal controls (X button).'
      },
      {
        category: '🔒 Firestore Security & Real-Time Connection Resilience',
        detail: 'Updated Firestore security rules for session subcollections (voice_peers and voice_signals) and added snapshot error callbacks to prevent unhandled permission errors.'
      }
    ]
  },
  {
    version: 'v3.5.0',
    date: 'August 2026',
    title: 'Obsidian RPG Campaign Graph, Unified Omnipresent Search & Performance Virtualization',
    badge: 'Major Release',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🕸️ Obsidian-Style Interactive TTRPG Knowledge Graph',
        detail: 'Full-screen interactive canvas network graph (CampaignGraphModal.tsx) mapping PCs, Monsters, NPCs, Locations, Factions, Quests, Items, and Session Notes with force physics, draggable nodes, edge relationship links, category filters, and node inspector.'
      },
      {
        category: '🔍 Unified Omnipresent Search & Search Indexer',
        detail: 'Re-engineered Command Palette (CommandPaletteModal.tsx) powered by a cached search indexer (searchIndexer.ts) aggregating results across Monsters, Spells, Items, Quests, Locations, Factions, NPCs, and Notes with instant category filter chips.'
      },
      {
        category: '⚡ Performance Optimization & Code Splitting',
        detail: 'Implemented React lazy loading and Suspense code-splitting for heavy modals alongside VirtualList viewport windowing utilities for sub-millisecond rendering performance.'
      }
    ]
  },
  {
    version: 'v3.4.0',
    date: 'August 2026',
    title: 'Complete Application User Manual, Horizontal Tab Overflow Engine & Build Artifact Fixes',
    badge: 'Feature Update',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '📖 Complete In-App User Manual Modal',
        detail: 'Created a standalone, searchable User Manual modal (UserManualModal.tsx) and embedded User Manual view in Sheet 6 detailing all application capabilities: Guest Mode, 6 TRPG Rulesets, Sheets 1–7, Multiplayer Sessions, Extension Marketplace, Companions, Dice & Audio Synthesizer, and Keyboard Power Tools.'
      },
      {
        category: '↔️ Ultra-Clean Horizontal Scroll Navigation',
        detail: 'Resolved tab header clipping and label cutoff across Sheet 6, User Manual, and Options modals with smooth overflow-x-auto scrolling, flex-nowrap badges, and hidden scrollbar utilities (.scrollbar-none).'
      },
      {
        category: '📦 Build Artifact & Cloud Deployment Optimization',
        detail: 'Updated Vite build configuration (outDir: "dist", emptyOutDir: true) ensuring clean static artifact bundling for seamless Cloud Run deployments and app share workflows.'
      }
    ]
  },
  {
    version: 'v3.3.1',
    date: 'August 2026',
    title: 'Versioned Extension Marketplace, Guest Mode & Dashboard Routing',
    badge: 'Feature Update',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '📦 Versioned Extension Marketplace & manifest.json Specification',
        detail: 'Full support for plugin/manifest.json metadata schema (name, version, author, dependencies, requiresAppVersion, permissions), semantic compatibility checks, version update alerts, and custom JSON manifest uploader.'
      },
      {
        category: '✨ Ultra-Sleek Scrollbars & Decluttered Navigation Tabs',
        detail: 'Re-engineered modal navigation headers with hidden scrollbars (.scrollbar-none / .no-scrollbar) and ultra-sleek 5px dark scrollbar tracks for a pristine, uncluttered visual experience.'
      },
      {
        category: '👤 Guest Adventurer Mode & Offline Sheet Access',
        detail: 'Unauthenticated users can now inspect, create, and manage character sheets locally without being blocked by login prompts.'
      },
      {
        category: '📌 Workspace Customizer Navigation ("Open Turn Order")',
        detail: 'Fixed turn order routing in the Pinned Workspace Customizer dashboard widget to seamlessly navigate to Sheet 2 (Combat & Turn Order).'
      },
      {
        category: '⚡ Omni-Palette Developer SDK Integration (Ctrl+K)',
        detail: 'Integrated Developer SDK & Architecture Center triggers into the Command Palette for instant access to system registry tests, event bus logs, and test harness execution.'
      }
    ]
  },
  {
    version: 'v3.3.0',
    date: 'August 2026',
    title: 'First-Class Plugin Ecosystem, Universal Search Everywhere & Interconnected Knowledge Graph',
    badge: 'Feature Update',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🧩 First-Class Plugin Ecosystem',
        detail: 'Enhanced system registry metadata with dependency checking, platform compatibility flags, optional module toggles, and community plugin specs.'
      },
      {
        category: '🔍 "Search Everywhere" Omni-Palette (Ctrl+K)',
        detail: 'Expanded universal search indexer across all 10 domain entities: Characters, NPCs, Quests, Spells, Conditions, Items, Monsters, Notes, Locations, and System Plugins.'
      },
      {
        category: '🕸️ Interconnected Knowledge Graph',
        detail: 'Hyper-linked cross-references (Appears In, Member Of, Located At, Relationships, Connected Quests, Mentions) rendered across campaign NPCs, factions, and DM notes.'
      }
    ]
  },
  {
    version: 'v3.2.0',
    date: 'August 2026',
    title: 'Workspace Customizer, Undo/Redo Engine, Universal Indexing & Architecture Docs',
    badge: 'Feature Update',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '📌 Pinned Workspace Customizer',
        detail: 'Interactive customizable workspace dashboard at the top of character sheets. Allows pinning and arranging quick widgets for Vitals, Initiative, Scratchpad, Quests, and Dice Trays.'
      },
      {
        category: '↩️ Atomic Undo / Redo History Engine',
        detail: 'Integrated useHistoryState timeline hook with 30-snapshot atomic stack rollback, Ctrl+Z / Ctrl+Y / Cmd+Shift+Z keyboard shortcut bindings, and header controls.'
      },
      {
        category: '🔍 Expanded Universal Command Indexing',
        detail: 'Command Palette (Ctrl+K) now indexes SRD spells, equipment items, and monster compendiums in addition to characters, system plugins, and navigation actions.'
      },
      {
        category: '📚 Developer Architectural Specs (/docs)',
        detail: 'Added comprehensive documentation covering Architecture.md, Plugin_API.md, State_Management.md, Event_System.md, and Adding_a_System.md with an interactive docs reader in the Extension Manager.'
      }
    ]
  },
  {
    version: 'v3.1.0',
    date: 'August 2026',
    title: 'Global Command Palette (Ctrl+K), Central Event Bus & Extension SDK',
    badge: 'Feature Update',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '⚡ Global Command Palette (Ctrl+K)',
        detail: 'Omnibox command palette supporting keyboard navigation, instant character switching, action shortcuts, system plugins search, and sheet tab navigation.'
      },
      {
        category: '📡 Central Domain Event Bus',
        detail: 'Decoupled pub/sub event bus architecture for domain-level events (CharacterCreated, LevelUp, CombatStarted, QuestCompleted, DiceRolled) with reactive event stream logging.'
      },
      {
        category: '🧩 Plugin SDK & Extension Metadata',
        detail: 'Expanded GameSystemPlugin specification with versioning, author, category, and capability tags. Introduced interactive Extension Manager modal (SDK / Plugins) in the global toolbar.'
      },
      {
        category: '🔗 System Registry Integration',
        detail: 'Refactored NewCharacterModal, OptionsModal, Compendium, User Guide, and level calculators to consume systemRegistry as the single source of truth for all TRPG rulesets.'
      }
    ]
  },
  {
    version: 'v3.0.0',
    date: 'August 2026',
    title: 'RPG System Plugin SDK Architecture & Core Refactoring',
    badge: 'Architecture Upgrade',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🧩 RPG System SDK & Plugin API',
        detail: 'Implemented extensible GameSystemPlugin architecture in src/systems/ decoupling rules engines for D&D 5e, D&D 3.5e, Pathfinder 2e, Shadowrun 5e, and Call of Cthulhu 7e.'
      },
      {
        category: '⚙️ System Registry Engine',
        detail: 'Central GameSystemRegistry allowing dynamic system lookup, standalone character stats calculation, combat engines, and spell casting requirements.'
      },
      {
        category: '📐 Modular Utils Refactoring',
        detail: 'Extracted damage type catalogs, ability score calculators, and spell slot requirement helpers into dedicated lightweight modules for higher performance and maintainability.'
      }
    ]
  },
  {
    version: 'v2.5.2',
    date: 'August 2026',
    title: 'DM Overview Navigation, Spell Slot Tracker Engine & UI Cleanup',
    badge: 'Feature Update',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '🗺️ DM Overview Tab Navigation',
        detail: 'Relocated the DM Overview sheet tab directly between Combat and Gear & Wealth in the main navigation bar for smoother Dungeon Master campaign oversight.'
      },
      {
        category: '🪄 Spell Slot Tracker Controls',
        detail: 'Enhanced Spell Slot Tracker buttons (- / + and max slot edits) to dynamically instantiate and expand missing or uninitialized spell slot levels on the fly.'
      },
      {
        category: '🐾 Header Actions & Transformation Display',
        detail: 'Streamlined sheet header controls to display active transformation status when transformed, keeping character headers clean while preserving Shapeshift buttons inside Class Features, Spells, and Feats.'
      },
      {
        category: '⚡ Offline Listener Resiliency',
        detail: 'Improved Firestore background sync logging and resilience for seamless offline mode operation when network connections drop.'
      }
    ]
  },
  {
    version: 'v2.5.1',
    date: 'August 2026',
    title: 'Spell Class Requirements Engine & DM Bypass Override',
    badge: 'Feature Update',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '📜 Class & Level Requirement Verification',
        detail: 'Automated 3.5e and 5e spell level vs character level verification for Wizard, Sorcerer, Cleric, Druid, Bard, Paladin, and Ranger spell lists.'
      },
      {
        category: '🏷️ Spell Eligibility Status Badges',
        detail: 'Interactive visual status badges (Ready for Class, Req Level X+, Cross-Class) displayed on active spells and SRD library presets.'
      },
      {
        category: '🧙 My Class Preset Filtering',
        detail: 'One-click "My Class" filter in the SRD Spells Catalog to instantly view spells tailored to your character\'s active class.'
      },
      {
        category: '👑 DM Bypass Mode & Warning Overrides',
        detail: 'DM Bypass toggle button in the spell catalog and interactive requirement confirmation modal to allow adding cross-class or high-level spells for DM custom house rules and magic items.'
      }
    ]
  },
  {
    version: 'v2.5.0',
    date: 'August 2026',
    title: 'DM Presence Unlocking, Options Control & Spellbook Enhancements',
    badge: 'Major Feature',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '👑 DM Active Presence Unlocking',
        detail: 'Dungeon Master active presence on a character sheet no longer locks players out. Players can select and control characters concurrently while the DM manages or views them. Character selection is locked only when another Player is active on that character slot.'
      },
      {
        category: '⚙️ Options Menu & Character Management',
        detail: 'Moved Character Import (.json), Export (.json), and TRPG Ruleset Conversion into the unified "Options" modal (⚙️) under a dedicated "Character" tab (accessible when logged in / character selected).'
      },
      {
        category: '🔮 Ascending & Descending Spell Level Sorting',
        detail: 'Players can now sort spells ascending (Cantrips → Level 9) or descending (Level 9 → Cantrips), by Name (A-Z / Z-A), or Magic School across both Daily Spells and Spellbook views.'
      },
      {
        category: '✨ Strict Spellbook Uniqueness Protection',
        detail: 'Spells in a character\'s spellbook stay strictly unique by Name and Effect. Prevents duplicate spell entries when adding custom spells, selecting official 5e presets, or importing from the Compendium.'
      },
      {
        category: '🧬 Hybrid Heritage Ancestry Generator',
        detail: 'Combine two distinct ancestries (e.g. Half-Elf, Half-Orc, Tiefling-Human, Aasimar-Dwarf) with custom trait selection, blended racial bonuses, and darkvision traits.'
      },
      {
        category: '🧛 Supernatural Species Transformations',
        detail: 'Apply species transformations (Vampire, Lycanthrope, Lich, Fiend, Dragonborn, Aberration) with stat modifiers, temporary HP multipliers, special senses, and vulnerability/immunity traits.'
      },
      {
        category: '🌐 English UI Standardization',
        detail: 'Standardized all UI labels and section headings across the spell management tabs to pure English expressions.'
      },
      {
        category: '💾 Persistent Sound Preferences',
        detail: 'Master volume level and mute state are saved automatically to browser local storage and applied instantly across all dice rolls, attacks, spells, and combat events.'
      },
      {
        category: '📘 User Manual & Changelog Integration',
        detail: 'Updated User Guide with dedicated Audio & Sound section, DM non-locking presence guidelines, and an integrated Version Changelog timeline.'
      }
    ]
  },
  {
    version: 'v2.4.0',
    date: 'August 2026',
    title: 'Procedural Sound Synthesizer & Max HP Inspector',
    badge: 'Major Feature',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🎶 Procedural Web Audio Engine',
        detail: 'Synthesizes 12 real-time audio effects (Dice Roll, Weapon Hit, Critical Hit Chime, Miss/Parry Whoosh, Fire Roar, Cold Shimmer, Lightning Thunder, Acid Sizzle, Healing Arpeggio, Spell Cast, Level Up Fanfare, Death Bell) using pure Web Audio API oscillators without external asset downloads.'
      },
      {
        category: '🩸 Max Hit Point Breakdown Inspector',
        detail: 'Click Max HP in Header or Combat Sheet to open an interactive modal breaking down Base HP, Tough feat bonuses, equipped item bonuses, Aid spell modifiers, and Exhaustion Level 4+ halving.'
      },
      {
        category: '💀 Death Saving Throws & Revive Spells',
        detail: '3 Death Save failures result in Permanent Death (rest disables HP regeneration). Casting Revivify, Raise Dead, or Resurrection automatically revives dead characters.'
      }
    ]
  },
  {
    version: 'v2.3.0',
    date: 'August 2026',
    title: 'Multi-TRPG Systems & Instant Conversion',
    badge: 'Core Platform',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    highlights: [
      {
        category: '⚔️ 5 Popular TRPG Systems',
        detail: 'Full native support for D&D 5e, D&D 3.5e, Shadowrun 5e, Pathfinder 2e, and Call of Cthulhu 7e.'
      },
      {
        category: '🔄 Zero Data Loss Conversion',
        detail: '1-click character conversion between all 5 systems preserving inventory, backstory, custom weapons, portrait links, and notes.'
      },
      {
        category: '💻 Shadowrun Cyberpunk Panels',
        detail: 'Cyberdeck Matrix stats, condition monitors, cyberware grade multipliers (Standard, Alpha, Beta, Delta), and drone/vehicle rigging.'
      }
    ]
  },
  {
    version: 'v2.2.0',
    date: 'August 2026',
    title: 'Firebase Live Sessions & Party Manager',
    badge: 'Multiplayer',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    highlights: [
      {
        category: '🌐 Live Session Lobby',
        detail: 'Host or join online party rooms using room codes, sync character stats in real time, and share dice roll logs across players.'
      },
      {
        category: '👥 Adventuring Party Manager',
        detail: 'Group characters into parties, view collective HP pool, track average passive perception, and launch entire parties into combat encounters.'
      }
    ]
  },
  {
    version: 'v2.1.0',
    date: 'August 2026',
    title: 'Encounter Tracker & Attack Resolver',
    badge: 'Combat Engine',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    highlights: [
      {
        category: '🎯 Target AC Attack Resolver',
        detail: 'Select enemy targets in combat, roll attacks against target AC, and apply damage automatically.'
      },
      {
        category: '🗡️ Encounter Tracker',
        detail: 'Manage initiative order, track status conditions, and calculate monster defeat XP.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: 'August 2026',
    title: 'UI Modernization & Animated HP Orb',
    badge: 'Initial Release',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🎨 Liquid Vitality Orb',
        detail: 'Dynamic color-coded liquid HP orb (Green 75-100%, Yellow 49-74%, Red <49%) with smooth wave animation.'
      },
      {
        category: '📖 SRD Rules Compendium & JSON Backups',
        detail: 'Search official SRD rules library, export and import character sheets as `.json` backup files.'
      }
    ]
  }
];
