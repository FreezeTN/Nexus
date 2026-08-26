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
    version: 'v1.0.0',
    date: 'August 2026',
    title: 'Production Engineering Pillars, Web Workers, Telemetry & Automated CI Regression Suite',
    badge: 'Latest Update',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🏛️ Production Engineering Pillars Architecture',
        detail: 'Integrated 10 core engineering pillars into the Developer SDK Modal: Automated CI bundle analyzer, Lighthouse & Web Vitals CI thresholds (≥95 score floor), Web Worker offloading, Real-Time Performance Telemetry, Intelligent Domain Caches, Non-blocking Background Tasks Engine, Progressive Loading Pipeline (<100ms render), 60 FPS Performance Dashboard, Memory Profiling, and Automated CI Regression Detection.'
      },
      {
        category: '⚡ Web Worker Multithreading',
        detail: 'Offloaded heavy Campaign Knowledge Graph force-topology layout calculations and trigram search indexing to dedicated Web Worker threads, keeping the main UI rendering thread locked at 60 FPS.'
      },
      {
        category: '📊 Precision Real-Time Telemetry & Caching',
        detail: 'Added real-time opt-in telemetry tracking campaign load averages, user session timing, and peak campaign sizes with formatted decimal precision. Introduced hash-invalidated domain caching for Search, Graph, Spells, and Plugin metadata.'
      },
      {
        category: '🔄 Automated CI Performance Regression Suite',
        detail: 'Built an in-browser and CI performance regression auditor that benchmarks campaign load times, search query indexing latency, graph force computations, and JS heap allocations against saved baselines.'
      },
      {
        category: '🎨 Developer SDK UI Professionalization',
        detail: 'Refined Developer SDK tabs to clean "Engineering Pillars" terminology, added manual regression audit triggers with active spinner states and timestamps, and optimized state subscriptions for zero-overhead background monitoring.'
      },
      {
        category: '🧹 Streamlined Character Management',
        detail: 'Removed obsolete TRPG character conversion systems in favor of pure, native ruleset architectures for each supported TRPG system.'
      },
      {
        category: '🏷️ Clean Campaign Session Dock Display',
        detail: 'Streamlined the active multiplayer session dock button to dedicate full width to the campaign name without truncation, removing redundant live count badges.'
      }
    ]
  },
  {
    version: 'v0.9.5',
    date: 'August 2026',
    title: 'Multi-Monitor Detached Sheets, Real-Time Cross-Window Sync & Responsive Modal Optimization',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🖥️ Multi-Monitor Detached Sheet Pop-Outs',
        detail: 'Allowed any character sheet tab (Stats, Combat, Gear, Spells, Notes, Compendium, DM Overview) to be detached as a standalone popup window for secondary monitor and dual-display DM setups.'
      },
      {
        category: '⚡ Cross-Window Real-Time State Synchronization',
        detail: 'Integrated BroadcastChannel and storage listeners ensuring HP changes, spell slot usages, inventory updates, and party overrides sync instantaneously across all detached popup windows and main browser sessions.'
      },
      {
        category: '📌 Detached Header Control Banner',
        detail: 'Added a dedicated top banner for detached pop-out windows featuring quick sheet tab switching, character roster selector, live sync status badge, room code indicator, and window controls.'
      },
      {
        category: '📐 Responsive Modal Layouts & Ceiling Optimization',
        detail: 'Optimized modal container dimensions, padding, and max-height ceilings across Developer SDK, Options, Campaign Graph, User Manual, and Extension Manager dialogs for optimal viewability on all display resolutions.'
      }
    ]
  },
  {
    version: 'v0.9.0',
    date: 'August 2026',
    title: 'Streamlined Navigation Layout, Quick Vitals Swap & On-Demand Voice Client',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🔄 Character Sheets & Quick Vitals Header Swapping',
        detail: 'Reorganized top header layout hierarchy so primary Sheet Navigation tabs (Stats & Features, Combat, Gear, Spells, Notes) take top row priority, placing the Quick Vitals & Combat Stats Bar directly beneath for intuitive access.'
      },
      {
        category: '🎙️ On-Demand Party Voice Client Launch',
        detail: 'Optimized voice client behavior to remain hidden on initial application startup, launching dynamically only when the user opens the "Party Voice" quick control or connects to a voice channel.'
      },
      {
        category: '⚡ Performance Architecture & Performance Budgets',
        detail: 'Expanded performance profiler with 60 FPS virtualization windowing benchmarks, dynamic chunk preloading timers, JS Heap memory budget limits (< 120MB), and DOM node tree budget enforcement.'
      },
      {
        category: '🧪 3-Layer Test Suite: Unit, Integration & Automated Playwright E2E Pipeline',
        detail: 'Introduced full 3-layer testing harness: Unit tests for Spell Save DCs, Slots & Damage Modifiers; Integration tests for Campaign -> Character -> Gear -> Combat -> Persistence flow; and an automated Playwright-spec E2E pipeline.'
      }
    ]
  },
  {
    version: 'v0.8.5',
    date: 'August 2026',
    title: 'Enterprise Architecture, Plugin Contract Verification & Data-Driven Subsystem Profiler',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🧭 Left Vertical Hub, Guide & Compendium Dock Sidebar',
        detail: 'Utilized empty left screen space by moving top header action controls and core reference sheets (Hub, User Guide / System Rules, and Compendium SRD) into a dedicated vertical left sidebar dock, leaving the top tab bar purely dedicated to character sheets.'
      },
      {
        category: '📋 Plugin API Contract Testing Suite',
        detail: 'Implemented automated verification for every registered TRPG plugin (registration check, metadata exposure, capabilities implementation, and version compatibility checks).'
      },
      {
        category: '⚡ Data-Driven Subsystem Performance Profiler',
        detail: 'Built a central performance profiler utility and benchmark suite measuring campaign loading, search indexing, graph rendering, plugin initialization, and voice startup latency.'
      },
      {
        category: '🧩 Domain Decomposition & Standardized Systems Layout',
        detail: 'Decomposed monolithic calculations into dedicated, single-responsibility rules engine modules under src/systems/dnd5e/ (abilities, classes, spellcasting, combat), establishing clean system boundaries.'
      },
      {
        category: '🗄️ Repository Pattern & Storage Strategy Abstraction',
        detail: 'Implemented ICharacterRepository interface along with LocalCharacterRepository, FirebaseCharacterRepository, and CharacterRepositoryProvider (src/repositories/) to decouple application UI and business logic from direct persistence frameworks.'
      },
      {
        category: '⚙️ Domain Services & Event-Driven Business Operations',
        detail: 'Introduced CharacterService and CombatService (src/services/) to manage domain operations like leveling, inventory management, HP modifications, and combat state transitions while dispatching EventBus notifications.'
      },
      {
        category: '🏷️ Branded Nominal Type Safety & Enriched Plugin Contracts',
        detail: 'Added nominal brand types (CharacterId, CampaignId, QuestId, ItemId, SpellId, UserId) to prevent ID mixing, and enhanced GameSystemPlugin contracts with permissions, capabilities, version constraints, and config validation.'
      }
    ]
  },
  {
    version: 'v0.8.0',
    date: 'August 2026',
    title: 'Project Credits Tab, Knowledge Graph Node Editing & Active Speaker Combat Highlighting',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🏆 Project Credits & Attributions Tab in Options',
        detail: 'Added a dedicated Credits category in the Options Menu honoring Freeze (@freezecoaching) as Lead Full-Stack Developer and ChaosDwarf (@chaosdwarf7) for the original Project Idea & Concept, complete with 1-click Discord handle copy buttons.'
      },
      {
        category: '✏️ Knowledge Graph Node Management & Persistence',
        detail: 'Campaign Knowledge Graph now supports editing existing node names, categories, and summaries, deleting nodes, adding custom entities, persistent auto-saving in localStorage, and a 1-click "Reset Defaults" restore button.'
      },
      {
        category: '🎙️ Active Speaker Highlighting in Encounter Tracker',
        detail: 'Combatant cards in the Encounter Tracker display a glowing emerald ring, animated microphone pulse icon, and "SPEAKING" badge whenever a party member talks in WebRTC Party Voice.'
      }
    ]
  },
  {
    version: 'v0.7.5',
    date: 'August 2026',
    title: 'Campaign Relationship Tree Diagram & WebRTC ICE Auto-Restart Resilience',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '🌳 Interactive Entity Relationship Tree Diagram',
        detail: 'Campaign Knowledge Graph features an Interactive Tree View layout with a root entity node branching into 7 core relationship pillars: Quests, Sessions, Items, Factions, Characters/Allies, Locations, and Timelines.'
      },
      {
        category: '🔄 WebRTC ICE Auto-Restart Connection Resilience',
        detail: 'WebRTC voice manager automatically detects ICE connection failures or network drops and initiates instant ICE restarts (`iceRestart: true`) to maintain stable audio without requiring page refreshes.'
      }
    ]
  },
  {
    version: 'v0.7.0',
    date: 'August 2026',
    title: 'Integrated WebRTC Party Voice Client, UI Positioning Fixes & Security Hardening',
    badge: 'Previous Version',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
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
    version: 'v0.6.5',
    date: 'August 2026',
    title: 'Obsidian RPG Campaign Graph, Unified Omnipresent Search & Performance Virtualization',
    badge: 'Beta Milestone',
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
    version: 'v0.6.0',
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
    version: 'v0.5.5',
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
    version: 'v0.5.0',
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
    version: 'v0.4.5',
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
    version: 'v0.4.0',
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
    version: 'v0.3.5',
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
    version: 'v0.3.2',
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
    version: 'v0.3.1',
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
    version: 'v0.3.0',
    date: 'August 2026',
    title: 'DM Presence Unlocking, Options Control & Spellbook Enhancements',
    badge: 'Alpha Milestone',
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
    version: 'v0.2.5',
    date: 'August 2026',
    title: 'Procedural Sound Synthesizer & Max HP Inspector',
    badge: 'Pre-Alpha',
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
    version: 'v0.2.0',
    date: 'August 2026',
    title: 'Multi-TRPG Systems & Instant Conversion',
    badge: 'Pre-Alpha',
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
    version: 'v0.1.5',
    date: 'August 2026',
    title: 'Firebase Live Sessions & Party Manager',
    badge: 'Pre-Alpha',
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
    version: 'v0.1.2',
    date: 'August 2026',
    title: 'Encounter Tracker & Attack Resolver',
    badge: 'Pre-Alpha',
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
    version: 'v0.1.0',
    date: 'August 2026',
    title: 'UI Modernization & Animated HP Orb',
    badge: 'Prototype Start',
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
