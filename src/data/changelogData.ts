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
    version: 'v0.7',
    date: 'August 2026',
    title: 'Homebrew Entity Studios, AI Forge & Multi-Dice Simulation',
    badge: 'Latest Release',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🛡️ Homebrew Class & Race Creation Studios',
        detail: 'Deep creation suite for designing custom TTRPG classes (hit dice d6–d12, primary abilities, saving throw masteries, weapon/armor proficiencies, caster progression types, subclasses) and lineages (custom speed configurations, darkvision, modular racial traits).'
      },
      {
        category: '🧙 AI Homebrew Entity Forge & 1-Click Importer',
        detail: 'Generate balanced homebrew entities powered by Gemini and rule-aware prompt engineering. Supports Monsters & Bosses (with CR scaling and legendary actions), Player Characters, Merchants, Magic Items, Spells, Quests, Encounters, and Lore Nodes with 1-click compendium import.'
      },
      {
        category: '🎲 Multi-Dice Pool Engine & 3D Polyhedral Visuals',
        detail: 'Extended the interactive Dice Tray to support rolling custom combinations of different polyhedral dice (e.g. 2× D20 + 1× D6 + modifier) in a single action, complete with quick-increment steppers, live pool chips, and authentic 3D polyhedral geometry rendering.'
      },
      {
        category: '👑 Campaign Lobby-Scoped Presence & Cloud Isolation',
        detail: 'Character presence indicators ([👑 DM Active] and [🔒 Active: PlayerName]) are now strictly partitioned by active Game Lobby room code, preventing cross-user presence collision and keeping solo/offline sheet management private.'
      },
      {
        category: '🔄 Conflict-Resistant State Synchronization & Inventory Deletions',
        detail: 'Attached timestamp-based conflict protection (updatedAt) to character state mutations to eliminate stale snapshot rollbacks, hardened item deletion event dispatching, and added direct item deletion within the item edit dialog.'
      },
      {
        category: '📜 PDF Compendium Parser & Extraction Engine',
        detail: 'Attach custom TRPG rulebooks, third-party supplements, or monster manual PDFs directly in the AI Assistant to extract raw text, headings, and statblocks, synthesizing custom homebrew entities directly from attached chapters.'
      }
    ]
  },
  {
    version: 'v0.6',
    date: 'August 2026',
    title: 'Distraction-Free "Table Mode" HUD, Live Session Co-Pilot & Web Audio Soundscapes',
    badge: 'Live Tabletop Suite',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🎲 Distraction-Free Table Mode HUD (Alt+T)',
        detail: 'Introduced an ultra-focused, high-contrast Play Mode that hides administrative menus, sidebars, and tab chrome to surface only what matters during live turns: vitality, equipped weapons, spell slots, active buffs, and immediate rolls.'
      },
      {
        category: '⚔️ Seamless AI Encounter Auto-Deployment',
        detail: 'Generated monsters now immediately inject into the Encounter Tracker with initiative rolls, CR-scaled XP rewards, environmental parameters, and live event synchronization with deployment summaries written to combat logs.'
      },
      {
        category: '🎙️ Live Session Co-Pilot HUD (Ctrl+J)',
        detail: 'Instant sensory room intros, cinematic finisher narrations, improvised stunt rulings, dynamic tactical combat suggestions, and concentration DC check watchdog.'
      },
      {
        category: '🔊 Procedural Web Audio Soundscapes',
        detail: '100% offline procedural ambient soundscapes (Campfire, Rainstorm, Dark Dungeon, Astral Void, Tavern) and tactile SFX generators for immersive tabletop atmosphere.'
      },
      {
        category: '❤️ Rapid Vitality & Combat Dashboard',
        detail: 'Interactive HP controls with instant delta buttons (-10, -5, -1, +1, +5, +10), custom heal/damage calculator, temp HP tracker, hit dice spending, inspiration toggle, and automatic death save evaluator with natural 20/1 handling.'
      },
      {
        category: '⚔️ 1-Click Action Strip & Spell Bubble Matrix',
        detail: 'Equipped attacks with 1-click Attack and Damage rolls, interactive spell slot bubbles (1st-9th level) to cast spells with single clicks, custom class power counters, 5e condition toggles, and instant skill checks.'
      }
    ]
  },
  {
    version: 'v0.5',
    date: 'August 2026',
    title: 'Production Zero-Trust Security, Comprehensive Accessibility (A11y) & Visual Polish',
    badge: 'Security & Ergonomics',
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
        category: '🛡️ Zero-Trust Firestore Security Architecture',
        detail: 'Strict owner-based authentication boundaries across characters, campaign saves, user accounts, and parties. Enforced document schema and payload validation preventing unauthorized state tampering.'
      },
      {
        category: '🔍 Real-Time Structured Tracing & Observability HUD',
        detail: 'Zero-overhead trace span measuring across Server, Domain, UI, and Transient state layers with an accessible diagnostic HUD modal (Ctrl+Shift+D), live trace waterfall, and V8 heap memory monitor.'
      },
      {
        category: '🎲 Precision 3D Polyhedral Geometry & Lighting Engine',
        detail: '10-visible-facet isometric projection for 20-sided dice, directional keylighting with ambient occlusion shadows, acrylic dome specular highlights, and micro-bevel chamfer edge reflections.'
      },
      {
        category: '💎 Mythic & Resplendent Dice Materials',
        detail: 'Introduced Celestial Moonstone, Radiant Storm Prism, Oceanic Abyss translucent resin swirls, Noir Marble, Eldritch Blood & Silver gothic filigree, and Cosmic Stardust nebula glitter.'
      }
    ]
  },
  {
    version: 'v0.4',
    date: 'August 2026',
    title: 'Four-Tier State Architecture, DM Ambience Broadcaster & 5e Attunement Engine',
    badge: 'Architecture & Mechanics',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    highlights: [
      {
        category: '🏛️ Four-Tier State Separation Architecture (ADR-0006)',
        detail: 'Formalized strict boundaries across Server, Domain, UI, and Transient state layers. Ephemeral high-frequency data operates entirely in transient memory, preventing network race conditions and live session jitter.'
      },
      {
        category: '🎙️ DM Overview Ambience & Music Broadcaster',
        detail: 'Live YouTube & Spotify campaign music broadcasting studio in the DM Overview tab (Sheet 7) with 1-click curated atmosphere presets (Tavern, Combat, Exploration, Dungeon) and persistent background playback.'
      },
      {
        category: '✨ 5e Magic Item Attunement & Class Scaling Engine',
        detail: 'Full D&D 5e attunement rules with class-specific slot scaling (Artificer progression 4–6 slots), stat-setting items (Gauntlets of Ogre Power, Headband of Intellect, Belts of Giant Strength), and heavy armor speed penalties.'
      },
      {
        category: '📖 Prepared Spells Limits & Real-Time Capacity Tracker',
        detail: 'Automatic prepared spells limit calculator and real-time counter on Sheet 4 for prepared spellcasters (Cleric, Druid, Wizard, Paladin, Artificer) with formula breakdowns and over-preparation warnings.'
      },
      {
        category: '🏪 Interactive Merchant Encounters & Tactical Trading',
        detail: 'Encounter tracker merchant mode featuring dynamic haggling skill checks, real-time pricing modifiers, inventory filtering, direct wallet syncing, and procedural gold coin sound synthesizers.'
      },
      {
        category: '🧩 Semantic Plugin Compatibility & Version Negotiation',
        detail: 'Semver requirement declarations in system plugin manifests with contract verification evaluating compatibility against active host runtimes before executing external code.'
      }
    ]
  },
  {
    version: 'v0.3',
    date: 'August 2026',
    title: 'Nexus Platform Rebranding, Multi-Language Localization & Production CI Suite',
    badge: 'Core Platform Suite',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '✨ Official "Nexus" Platform Rebranding',
        detail: 'Harmonized all internal core engines under the Nexus banner: Nexus Rules Engine (5e, 3.5e, Pathfinder 2e, Shadowrun, Call of Cthulhu), Nexus Shapeshift, Companion, Rest & Recovery, and Dice Physics.'
      },
      {
        category: '🌍 Multi-Language Localization & Multilingual AI Oracle',
        detail: 'Comprehensive language selection (English 🇬🇧, German 🇩🇪, French 🇫🇷, Spanish 🇪🇸, Italian 🇮🇹, Japanese 🇯🇵) with the AI assistant natively generating roleplay and statblocks in the chosen language.'
      },
      {
        category: '🏛️ Production Engineering Pillars & Web Worker Multithreading',
        detail: '10 core engineering pillars including automated CI bundle analyzer, Lighthouse CI thresholds (≥95), and Web Worker multithreading for Campaign Knowledge Graph force-topology layout computations.'
      },
      {
        category: '🔍 Real-time Roster & Monster Search Bar',
        detail: 'Live instant search filtering across Monsters, Encounter Creatures, and Player Characters in the roster menu by name, type, Challenge Rating (e.g. "CR 19"), and combat actions.'
      },
      {
        category: '⚡ One-Click Factory Reset & Auth Wipe Suite',
        detail: 'Factory Reset tool in Options wiping IndexedDB session databases (Firebase Auth), LocalStorage, and CacheStorage for a pristine reinstall state with confirmation guards.'
      },
      {
        category: '🧬 Alpine DM System Hybrid Ancestries',
        detail: 'Dual-heritage character creation combining distinct Primary and Secondary parent ancestries with computed speeds, sizes, darkvision rules, and custom blended race titles.'
      }
    ]
  },
  {
    version: 'v0.2',
    date: 'August 2026',
    title: 'Multi-Monitor Detached Sheets, WebRTC Voice & Campaign Knowledge Graph',
    badge: 'Multiplayer & Knowledge',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    highlights: [
      {
        category: '🖥️ Multi-Monitor Detached Sheet Pop-Outs',
        detail: 'Detached pop-out windows for any character sheet tab (Stats, Combat, Gear, Spells, Notes, Compendium, DM Overview) for secondary monitor and dual-display DM setups.'
      },
      {
        category: '⚡ Cross-Window Real-Time State Synchronization',
        detail: 'Integrated BroadcastChannel and storage listeners ensuring HP changes, spell slots, inventory updates, and party overrides sync instantaneously across all detached popup windows and browser sessions.'
      },
      {
        category: '🎙️ Integrated WebRTC Party Voice Client',
        detail: 'Embedded peer-to-peer audio voice channel with WebRTC signaling, volume controls per adventurer, push-to-talk keybinds, microphone/audio deafen controls, and active speaker highlighting in combat.'
      },
      {
        category: '🕸️ Obsidian-Style Interactive TTRPG Knowledge Graph',
        detail: 'Full-screen interactive canvas network graph mapping PCs, Monsters, NPCs, Locations, Factions, Quests, Items, and Session Notes with force physics, draggable nodes, and category filters.'
      },
      {
        category: '🔍 Unified Omnipresent Search & Command Palette (Ctrl+K)',
        detail: 'Command Palette powered by a cached search indexer aggregating results across all 10 domain entities (Characters, Spells, Items, Monsters, Quests, Locations, Factions, NPCs, Notes, Plugins).'
      },
      {
        category: '📦 Versioned Extension Marketplace & Plugin SDK',
        detail: 'Full support for plugin manifest metadata schemas, semantic compatibility checks, version update alerts, and custom JSON manifest uploading.'
      }
    ]
  },
  {
    version: 'v0.1',
    date: 'August 2026',
    title: 'Multi-TRPG Rules Engine, Live Session Lobby & Foundation Sheets',
    badge: 'Genesis Milestone',
    badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
    highlights: [
      {
        category: '⚔️ Multi-TRPG Rules Engine & Foundation Sheets',
        detail: 'Native ruleset architectures for D&D 5e, D&D 3.5e, Pathfinder 2e, Shadowrun 5e, and Call of Cthulhu 7e across 7 dedicated sheet views (Stats, Combat, Gear, Spells, Notes, Rules, Compendium).'
      },
      {
        category: '🌐 Real-Time Firebase Session Lobby & Party Manager',
        detail: 'Host or join online party rooms using 6-character room codes, synchronize character stats in real time, group adventurers into parties, and share live dice roll logs.'
      },
      {
        category: '🎯 Encounter Tracker, Target AC Resolver & Liquid Vitality Orb',
        detail: 'Dynamic color-coded liquid HP orb, automated initiative order, condition tracking, target AC attack resolution, death saving throw tracking, and permanent death rules.'
      },
      {
        category: '↩️ Atomic Undo / Redo History Engine',
        detail: 'Integrated 30-snapshot atomic stack rollback with Ctrl+Z / Ctrl+Y / Cmd+Shift+Z keyboard bindings and header undo/redo controls.'
      },
      {
        category: '🎶 Procedural Web Audio Synthesizer',
        detail: 'Synthesizes 12 real-time audio effects (Dice Roll, Weapon Hit, Critical Hit Chime, Spell Casts, Level Up Fanfare) using pure Web Audio API oscillators.'
      },
      {
        category: '🧛 Supernatural Species Transformations & Guest Mode',
        detail: 'Apply transformations (Vampire, Lycanthrope, Lich, Wild Shape) with temporary HP scaling and 0 HP reversion, alongside Guest Adventurer Mode for offline local play.'
      }
    ]
  }
];
