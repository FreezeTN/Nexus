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
    version: 'v5.9.0',
    date: 'August 2026',
    title: 'AI Combat Encounter Auto-Deployment & UI Ergonomics Refinement',
    badge: 'Encounter Engine & UI Polish',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '⚔️ Seamless AI Encounter Auto-Deployment',
        detail: 'Resolved issue where AI-generated encounters were not populating hostile combatants into Team 2. Generated monsters now immediately inject into the Encounter Tracker with initiative rolls, CR-scaled XP rewards, environmental parameters, and live event synchronization.'
      },
      {
        category: '🧹 UI Hierarchy & Ergonomics Cleanup',
        detail: 'Cleaned up repetitive development phase badges and redundant trailing pill markers across the navigation sidebar dock, Live Session Co-Pilot HUD, Campaign World Atlas, and settings modals for a cleaner aesthetic.'
      },
      {
        category: '⚡ Live Encounter State Synchronization',
        detail: 'Added cross-component custom event triggers (dnd_encounter_deployed) ensuring combat state instantly reflects new encounters and writes deployment summaries directly to the combat log.'
      }
    ]
  },
  {
    version: 'v5.8.0',
    date: 'August 2026',
    title: 'Live Tabletop AI Co-Pilot, Procedural Audio & Tactical Combat Assistant',
    badge: 'Live Session AI & Web Audio',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🎙️ Live Session Co-Pilot HUD (Ctrl+J)',
        detail: 'Instant sensory room intros, cinematic finisher narrations, improvised stunt rulings, and concentration DC check watchdog.'
      },
      {
        category: '🔊 Procedural Web Audio Synthesizer',
        detail: '100% offline procedural ambient soundscapes (Campfire, Rainstorm, Dark Dungeon, Astral Void, Tavern) and tactile SFX generators.'
      },
      {
        category: '⚔️ Real-Time Tactical Combat Assistant',
        detail: 'Dynamic AI combat recommendations analyzing enemy vulnerabilities, tactical cover, and suggested party maneuvers.'
      },
      {
        category: '🔮 In-Flow Tabletop AI Generators',
        detail: 'Integrated 1-click generators for NPCs, balanced encounters, treasure hoards, dungeon rooms, session recaps, and rules adjudication.'
      }
    ]
  },
  {
    version: 'v5.7.0',
    date: 'August 2026',
    title: 'Phase 3: Comprehensive Accessibility (A11y) & Visual Ergonomics Architecture',
    badge: 'Accessibility & Ergonomics',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    highlights: [
      {
        category: '👁️ High & Maximum Contrast Modes (WCAG AAA)',
        detail: 'Engineered high-contrast and monochrome maximum-contrast themes with strict 7:1+ contrast ratios, high-visibility borders, and black/white canvas modes for visually impaired and low-vision players.'
      },
      {
        category: '🔤 Dynamic Typography Scaling & OpenDyslexic Support',
        detail: 'Added multi-level UI text scaling (100% to 150%) and optional dyslexia-friendly font support (OpenDyslexic / weighted typography) to improve readability and character sheet comprehension.'
      },
      {
        category: '♿ Screen Reader Announcements & ARIA Live Regions',
        detail: 'Implemented polite and assertive ARIA live announcement queues for active dice rolls, hotkey operations, damage resolution, and TRPG rule edition changes.'
      },
      {
        category: '🎯 Accessible Focus Rings & Reduced Motion Directives',
        detail: 'Introduced high-visibility 3px focus rings across all interactive buttons, inputs, tabs, and modals alongside full support for reduced motion preferences (`prefers-reduced-motion`).'
      }
    ]
  },
  {
    version: 'v5.6.0',
    date: 'August 2026',
    title: 'Phase 1: Observability & Structured Tracing Architecture',
    badge: 'Observability & Telemetry',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🔍 Real-Time Structured Tracing & Span Instrumentation',
        detail: 'Implemented zero-overhead trace span measuring across the Four-Tier State Architecture (Server, Domain, UI, Transient), recording microsecond execution latencies, status codes, and context attributes.'
      },
      {
        category: '📊 User Telemetry & Tabletop Interaction Engine',
        detail: 'Integrated anonymous, privacy-safe interaction metrics capturing dice rolling tempos (rolls/min, natural 20 vs. 1 RNG frequency, polyhedral distributions), combat rounds, and compendium search queries.'
      },
      {
        category: '🖥️ Live Observability HUD & Diagnostic Console',
        detail: 'Created an accessible diagnostic HUD modal (accessible via `Ctrl+Shift+D` / `Cmd+Shift+D` or menu) featuring a live trace waterfall, structured log search/filtering, V8 heap memory monitor, and 1-click diagnostic bundle export.'
      },
      {
        category: '🛡️ Breadcrumb Error Context Collector',
        detail: 'Captured global window errors and unhandled promise rejections, automatically associating preceding trace spans and domain logs for rapid root-cause analysis.'
      }
    ]
  },
  {
    version: 'v5.5.0',
    date: 'August 2026',
    title: 'Production Security Hardening & Zero-Trust Firestore Rules Enforcement',
    badge: 'Security & Production Release',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '🛡️ Zero-Trust Firestore Security Architecture',
        detail: 'Eliminated permissive wildcard rule access in favor of strict owner-based authentication boundaries across characters, campaign saves, user accounts, and parties. Established default-deny rule evaluation for all collections.'
      },
      {
        category: '🔒 Character & Campaign Save Isolation',
        detail: 'Enforced strict ownership invariants ensuring character sheets can only be created, modified, queried, or deleted by their verified owner (`ownerId == request.auth.uid`). Campaign saves are locked exclusively to the hosting Dungeon Master (`hostUid == request.auth.uid`).'
      },
      {
        category: '🎙️ WebRTC Voice Signaling & Peer Protection',
        detail: 'Hardened real-time WebRTC voice signaling channels (`voice_signals`, `voice_peers`) to prevent peer spoofing, unauthorized signal injection, or session state tampering.'
      },
      {
        category: '📐 Document Schema & Payload Validation',
        detail: 'Added strict schema checks (`isValidUser`, `isValidCharacter`, `isValidSession`, `isValidCampaignSave`, `isValidId`) preventing prototype injection, oversized malicious payloads, and corrupted campaign states.'
      }
    ]
  },
  {
    version: 'v5.4.1',
    date: 'August 2026',
    title: 'Precision 3D Polyhedral Dice Geometry & Photorealistic Lighting Engine',
    badge: 'Visual & Physics Engine',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🎲 Standard Icosahedron Isometric Projection',
        detail: 'Replaced split-seam geometry with mathematically precise 10-visible-facet isometric projection for 20-sided dice, eliminating distorted vertices, misaligned edges, and flat blueprint wireframes.'
      },
      {
        category: '✨ Physical Surface Shading & Micro-Bevel Edges',
        detail: 'Implemented directional keylighting with ambient occlusion shadows, acrylic dome specular highlights, and crisp micro-bevel chamfer edge reflections mimicking real resin and gem dice.'
      },
      {
        category: '🪙 Debossed & Engraved Foil Numerals',
        detail: 'Rendered authentic engraved tabletop numerals featuring crisp debossed top shadows, lower edge catch-lights, and gold leaf, platinum, or enamel foil inking.'
      }
    ]
  },
  {
    version: 'v5.4.0',
    date: 'August 2026',
    title: 'Mythic & Resplendent Dice Materials: Crystalline, Resin Swirls, Gothic Filigree & Stardust',
    badge: 'Aesthetic & Visual Update',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    highlights: [
      {
        category: '💎 Mythic Crystalline & Lunar Facets',
        detail: 'Introduced Celestial Moonstone with silver wireframe borders and a glowing crescent moon crest on Natural 20, alongside Radiant Storm Prism with chrome refraction rays and divine lightning wrath iconography.'
      },
      {
        category: '🌊 Artisanal Resin Swirls & Inlaid Gold',
        detail: 'Added Oceanic Abyss with translucent sea-glass cyan and sapphire swirls with gold foil inking, Pearlescent Violet & Teal metallic swirls, and Noir Marble with electric neon pink pips.'
      },
      {
        category: '💀 Gothic Filigree & Eldritch Blood',
        detail: 'Crafted Eldritch Blood & Silver featuring gothic filigree cages over blood-veined white marble with a dripping crimson skull icon on critical fumbles.'
      },
      {
        category: '🌌 Cosmic Nebula & Live Skin Previews',
        detail: 'Implemented Cosmic Stardust with deep galaxy nebula fields and stardust glitter, plus an enhanced Dice Tray drawer with category filtering and interactive mini polyhedral live previews.'
      }
    ]
  },
  {
    version: 'v5.3.1',
    date: 'August 2026',
    title: 'QA Tester Access Control & Role Permission Hardening',
    badge: 'Security & Access Update',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '🔒 Restricted QA Tester Group Access',
        detail: 'Removed the public Tester role selection from registration, guest access, and standard account management. The Tester QA role and subscription bypass privileges are now strictly restricted to verified whitelisted users and developers.'
      },
      {
        category: '🛡️ Role Enforcement & Security Hardening',
        detail: 'Enforced verified role assignment on account creation and Firestore synchronization, ensuring only authenticated administrators and designated QA personnel can access testing tier bypasses.'
      }
    ]
  },
  {
    version: 'v5.3.0',
    date: 'August 2026',
    title: 'Enterprise Architecture Modernization: Four-Tier State, Rich Domain Modeling & Semantic Plugins',
    badge: 'Latest Update',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '🏛️ Four-Tier State Separation Architecture (ADR-0006)',
        detail: 'Formalized strict boundaries across Server, Domain, UI, and Transient state layers. Ephemeral high-frequency data (3D dice physics, WebRTC audio volume decibels, tooltips) now operates entirely in transient memory, preventing race conditions, network spam, and rubber-banding during live multiplayer sessions.'
      },
      {
        category: '🧩 Semantic Plugin Compatibility & Version Negotiation (ADR-0009)',
        detail: 'Added semver requirement declarations (`requires: { core: ">=3.2", engine: ">=2.0", api: ">=5" }`) in system plugin manifests. The contract verification engine automatically evaluates compatibility against the active host runtime before executing external code.'
      },
      {
        category: '🎲 Rich Domain AST Modeling & Multi-System Modifier Engine (ADR-0007)',
        detail: 'Introduced structured domain models for dice expressions (`DiceExpression` AST), contextual skill checks, encumbrance evaluation, and typed modifiers supporting both additive (5e) and highest-only (Pathfinder 2e status bonuses) stacking rules.'
      },
      {
        category: '🛡️ Centralized Error & Telemetry Taxonomy (ADR-0008)',
        detail: 'Unified application error handling into four predictable resolution channels: non-blocking user toasts, blocking recovery modals, silent exponential backoff retries for network glitches, and background telemetry logging.'
      },
      {
        category: '🎛️ Single-Responsibility Component Refactoring',
        detail: 'Decomposed monolithic components into reusable custom hooks (e.g., `useAmbienceBroadcast`), decoupling audio state synchronization, URL validation, and subscription tier rules from UI rendering.'
      }
    ]
  },
  {
    version: 'v5.2.0',
    date: 'August 2026',
    title: 'DM Ambience Broadcaster, Persistent Background Audio Engine & Direct Supporter Checkout',
    badge: 'Feature Release',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    highlights: [
      {
        category: '🎙️ DM Overview Ambience & Music Broadcaster',
        detail: 'Relocated the live YouTube & Spotify campaign music broadcasting studio directly into the DM Overview tab (Sheet 7) for immediate Dungeon Master control with 1-click curated atmosphere presets (Tavern, Combat, Exploration, Dungeon) and custom playlist integration.'
      },
      {
        category: '🎵 Non-Stop Persistent Campaign Background Audio',
        detail: 'Engineered a root-level persistent audio stream player. Ambient campaign soundtracks and YouTube/Spotify streams now continue playing seamlessly across character sheet swaps, tab navigation, and modal interactions without pausing or restarting.'
      },
      {
        category: '🎛️ Streamlined Sound & SFX Synthesizer Settings',
        detail: 'Refactored the Sound Options tab in Settings to focus exclusively on master volume controls, individual mute toggles, and Web Audio synthesizers (dice clatter, hits, criticals, elemental bursts, level-up fanfares, and healing chords).'
      },
      {
        category: '💳 Direct PayPal.me Supporter Integration',
        detail: 'Upgraded supporter tier checkout modals and contribution buttons with direct paypal.me/nexustrpg links and pre-filled amount presets for Hero ($3.99/mo) and Guild Master ($8.99/mo) subscriptions.'
      }
    ]
  },
  {
    version: 'v5.1.0',
    date: 'August 2026',
    title: 'Interactive UX Suite: Attunement Toggles, Prepared Filter, Stat Breakdowns & Rest Audio',
    badge: 'Feature Release',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    highlights: [
      {
        category: '🔮 Attunement Quick-Action Toggle & Limit Safeguards',
        detail: 'Added direct "Attune/Unattune" action buttons to inventory cards (Sheet 3) with real-time attunement capacity badges (e.g. 2/3 Attuned) and automatic capacity validation warnings.'
      },
      {
        category: '⭐ "Prepared Spells Only" Quick Filter',
        detail: 'Added a dedicated status filter in the spellbook (Sheet 4) allowing instant toggling between All Spells, Prepared Spells Only, and Unprepared Spells with live counts.'
      },
      {
        category: '📊 Interactive Stat Source Breakdown Popover',
        detail: 'Clicking any modified ability score or magic badge on Sheet 1 opens an interactive popover detailing base score, magic item overrides (e.g., Gauntlets of Ogre Power), additive bonuses, and effective modifiers.'
      },
      {
        category: '🌙 Rest & Recovery Engine Audio & State Polish',
        detail: 'Short and Long Rest execution now triggers procedural restorative sound effects, seamlessly recharging Warlock Pact Magic, class features, Hit Dice, HP, and clearing exhaustion.'
      },
      {
        category: '💰 Merchant Transaction Audio & Visual Confirmations',
        detail: 'Integrated realistic procedural gold coin sound synthesizers and real-time transaction feedback upon buying and selling gear in the Merchant encounter system.'
      }
    ]
  },
  {
    version: 'v5.0.0',
    date: 'August 2026',
    title: '5e Attunement Engine, Dynamic Magic Item Setters, Spell Prep Tracker & Armor Rules',
    badge: 'Major Release',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    highlights: [
      {
        category: '✨ 5e Magic Item Attunement & Class Scaling Engine',
        detail: 'Integrated full D&D 5e attunement rules with class-specific slot scaling. Automatically supports Artificer progression (4 slots at Lvl 10 via Magic Item Savant, 5 at Lvl 14 via Magic Item Master, and 6 at Lvl 18 via Magic Item Soul) alongside live attunement limit indicators, requirement checks, and active attunement benefit tags.'
      },
      {
        category: '⚡ Magic Item Ability Score Setters & Modifiers',
        detail: 'Added full support for stat-setting magic items (e.g. Gauntlets of Ogre Power STR 19, Headband of Intellect INT 19, Amulet of Health CON 19, Belts of Giant Strength) and additive stat bonuses. Automatically propagates effective scores across skills, saving throws, spell save DCs, spell attacks, carrying capacities, and initiative with visual modified badges.'
      },
      {
        category: '🛡️ Heavy Armor Strength Minimums & Dwarven Speed Rules',
        detail: 'Character speed calculation now enforces 5e heavy armor Strength requirements (e.g. Chain Mail STR 13, Plate STR 15), automatically applying a -10 ft movement penalty when requirements are unmet while honoring Dwarven racial speed traits.'
      },
      {
        category: '📖 Prepared Spells Limits & Real-Time Capacity Tracker',
        detail: 'Introduced an automatic prepared spells limit calculator and real-time counter on Sheet 4 for prepared spellcasting classes (Cleric, Druid, Wizard, Paladin, Artificer), including formula breakdowns, over-preparation warning badges, and slot management.'
      },
      {
        category: '🎲 Dynamic Initiative & Combat Defenses Synchronization',
        detail: 'Initiative modifier rolls and Armor Class now reactively account for effective dexterity modifiers, magical item bonuses, and attuned item properties across Sheet 2.'
      },
      {
        category: '🏪 Interactive Merchant Encounters & Tactical Trading',
        detail: 'Enhanced encounter tracker with dedicated Merchant encounter mode featuring dynamic haggling skill checks (Persuasion, Deception, Intimidation), real-time pricing modifiers, inventory filtering, direct wallet syncing, and seamless pivot to tactical combat.'
      },
      {
        category: '🧩 Modular Rules System & Calculator Architecture',
        detail: 'Refactored D&D 5e calculation pipelines into dedicated domain modules (ability score setters, spell prep limits, combat math, and attunement calculators) ensuring consistent state propagation and high testability.'
      }
    ]
  },
  {
    version: 'v4.9.0',
    date: 'August 2026',
    title: 'Multi-Language Localization, Nexus Oracle Multilingual AI & Clean Tab Branding',
    badge: 'Feature Release',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🌍 Multi-Language Localization System',
        detail: 'Added comprehensive language selection in Options (⚙️) → App. Choose between English 🇬🇧, German (Deutsch) 🇩🇪, French (Français) 🇫🇷, Spanish (Español) 🇪🇸, Italian (Italiano) 🇮🇹, and Japanese (日本語) 🇯🇵.'
      },
      {
        category: '🔮 Multilingual Nexus AI Oracle & Entity Forge',
        detail: 'The AI assistant automatically detects your active language selection and generates rules explanations, roleplay responses, custom monsters, magic items, and spells natively in that language using appropriate TTRPG terminology.'
      },
      {
        category: '🏷️ Streamlined Browser Tab Branding',
        detail: 'Updated browser tab title and PWA manifest metadata to a clean, minimal "Nexus" display.'
      }
    ]
  },
  {
    version: 'v4.8.0',
    date: 'August 2026',
    title: 'Monsters & Folders Real-time Search, Challenge Rating Sync & Full Factory Reset Suite',
    badge: 'Maintenance',
    badgeColor: 'bg-stone-800 text-stone-300 border-stone-700',
    highlights: [
      {
        category: '🔍 Real-time Roster & Monster Search Bar',
        detail: 'Added live instant search filtering to the Monsters & Encounter Creatures tab (as well as Player Characters and Merchants) in the character selection menu. Instant search by name, monster type, Challenge Rating (e.g. "CR 19"), alignment, and attack actions.'
      },
      {
        category: '🐉 Monster Challenge Rating (CR) Metadata Sync',
        detail: 'Fixed Challenge Rating metadata display on monster roster cards and compendium entries, ensuring accurate CR figures (e.g. Balor displays CR 19, Adult Red Dragon displays CR 17) and automatic retroactive correction for existing local saves.'
      },
      {
        category: '⚡ One-Click Factory Reset & Auth Wipe Suite',
        detail: 'Introduced an in-depth Factory Reset tool in Options (⚙️) → App. Wipes IndexedDB session databases (Firebase Auth credentials), LocalStorage, SessionStorage, unregisters Service Workers, and clears CacheStorage for a pristine reinstall state with confirmation guards.'
      },
      {
        category: '🚀 PWA Cache Invalidation & Standalone Auto-Update',
        detail: 'Implemented aggressive no-cache HTTP headers for shell documents, automatic service worker activation cleanup, and controllerchange listeners to ensure standalone PWA installs update immediately to latest builds without stale caches.'
      },
      {
        category: '🧬 Alpine DM System Hybrid Ancestries',
        detail: 'Dual-heritage character creation combining distinct Primary and Secondary parent ancestries with computed speeds, sizes, darkvision rules, and custom blended race titles.'
      }
    ]
  },
  {
    version: 'v1.1.0',
    date: 'August 2026',
    title: 'Nexus Platform Rebranding & Unified Engine Architecture Suite',
    badge: 'Major Suite',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '✨ Official "Nexus" Branding',
        detail: 'Rebranded the application and ecosystem to Nexus — establishing a cohesive identity as a next-generation multi-system TRPG and character sheet platform with synchronized rulesets, combat mechanics, and live collaboration.'
      },
      {
        category: '⚙️ Nexus Modular Engine Suite',
        detail: 'Harmonized all internal core engines under the Nexus banner: Nexus Rules Engine (5e, 3.5e, Pathfinder 2e, Shadowrun, Call of Cthulhu), Nexus Shapeshift Engine, Nexus Companion & Summon Engine, Nexus Rest & Recovery Engine, Nexus Procedural Audio Engine, Nexus Dice Physics Engine, and Nexus Plugin & Extension Engine.'
      },
      {
        category: '🛡️ Vault & Header Integration',
        detail: 'Updated application headers, vault headers, Progressive Web App manifests, install prompts, command palette actions, and developer guides to reflect the Nexus platform architecture.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: 'August 2026',
    title: 'Production Engineering Pillars, Web Workers, Telemetry & Automated CI Regression Suite',
    badge: 'Core Release',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
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
        detail: 'Streamlined the active multiplayer session dock button to dedicate full width strictly to the core campaign name (stripping redundant checkpoint suffixes and live member badges).'
      },
      {
        category: '💾 Intelligent Campaign Name Resolution',
        detail: 'Enhanced checkpoint loading to preserve and restore pure campaign names separately from checkpoint file titles across session headers, dock bars, and lobby tabs.'
      },
      {
        category: '⚙️ Production Build & Artifact Resolution Optimization',
        detail: 'Updated build and Vite bundle configuration with explicit root/public directory resolution and granular vendor chunking (React, Firebase, Lucide, Motion) to ensure clean, reliable production deployment artifacts.'
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
