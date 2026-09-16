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
    version: 'v0.9.12',
    date: 'Today',
    title: 'Hybrid Heritage Synchronization, Custom Template Integration & Skills Engine Polish',
    badge: 'Lineage & Skills Polish',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    highlights: [
      {
        category: '🧬 Dynamic Custom Half-Breed Templates in Character Creation',
        detail: 'Homebrew races and templates created in the Compendium Forge (with halfbreed tags or raceType) are now dynamically made available during character creation and hybrid heritage selection, preserving full defense metadata, scaling attributes, and racial skill bonuses.'
      },
      {
        category: '🔄 Cross-Entity Lineage & Compendium Forge Sync',
        detail: 'Editing custom races or half-breed templates in the Forge immediately cascades updates to active characters whose race matches composite lineages (updating speed, damage reduction, and racial skill bonuses in real time without manual re-creation).'
      },
      {
        category: '🎲 Non-Stacking Racial Skill Bonus & Situational Roll Engine',
        detail: 'Complete calculation of racial skill bonuses according to official D&D 3.5e stacking rules (highest unconditional bonus applies), with separate situational bonus tracking and an interactive ConditionalSkillRollModal for rolling circumstance-based checks.'
      },
      {
        category: '📐 Skills Panel Anti-Collision & Responsive Layout Polish',
        detail: 'Refined the Sheet 1 Skills panel layout with compact situational badges (+2 Sit. with sparkle icon and tooltip), rigid shrink protection on numeric controls (ranks, ability modifiers, misc modifiers, and roll button), skill name truncation guards, and expanded responsive grid columns (lg:col-span-6 xl:col-span-5).'
      }
    ]
  },
  {
    version: 'v0.9.11',
    date: 'Today',
    title: 'Legal Licensing, SRD Provenance Architecture & Open Gaming Suite',
    badge: 'Legal & IP Compliance',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '📜 Interactive Legal & Licensing Compliance Modal',
        detail: 'Created the dedicated LegalLicensingModal with three streamlined tabs: Attribution & Disclaimers, SRD 5.1 under Creative Commons (CC-BY-4.0), and D&D 3.5e Open Game License v1.0a, complete with 1-click clipboard copy for official attribution text.'
      },
      {
        category: '🏷️ Compendium License Provenance Badges',
        detail: 'Tagged every compendium item card and detail view in Sheet 7 with explicit license provenance badges (CC-BY-4.0, OGL 1.0a, ORC, and Homebrew), ensuring clear visual distinction between Open Game Content and user-authored homebrew.'
      },
      {
        category: '⚖️ User Guide Legal & Licensing Documentation Hub',
        detail: 'Added a dedicated "Legal & Licenses" tab in Sheet 6 (User Guide) covering Creative Commons irrevocable permissions, OGL 1.0a Section 15 requirements, Product Identity boundaries, and nominative trademark fair use.'
      },
      {
        category: '🌐 Global Quick-Access Integration',
        detail: 'Integrated direct launch triggers across the Main Menu drawer footer, the Compendium top action bar, the User Guide header, and the item inspection cards.'
      }
    ]
  },
  {
    version: 'v0.9.10',
    date: 'Today',
    title: 'Official D&D 3.5e Monster Bestiary Expansion & Tactical Defense Rulings',
    badge: '3.5e SRD Bestiary',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '🐉 25+ Official 3.5e Monster Entries',
        detail: 'Expanded the compendium with classic 3.5e SRD monsters across all challenge tiers: Human Warrior Skeleton (CR 1/2), Orc Warrior (CR 1/2), Ghoul (CR 1), Bugbear Stalker (CR 2), Shadow (CR 3), Rust Monster (CR 3), Gelatinous Cube (CR 3), Gargoyle (CR 4), Displacer Beast (CR 4), Owlbear (CR 4), Basilisk (CR 5), Manticore (CR 5), Wraith (CR 5), Chimera (CR 7), Medusa (CR 7), Mind Flayer (CR 8), Aboleth (CR 7), Bone Devil (CR 9), Beholder (CR 13), Ice Devil / Gelugon (CR 13), Lich 11th-Level Wizard (CR 13), and the Balor Demon (CR 20).'
      },
      {
        category: '🛡️ 3.5e Tactical Combat & Defenses Card',
        detail: 'Enhanced the monster inspection modal in Sheet 7 (Compendium) with a specialized 3.5e combat readout detailing Touch AC, Flat-Footed AC, Base Attack Bonus (BAB), Damage Reduction with bypass types (e.g. DR 10/Magic, DR 10/Good, DR 15/Cold Iron and Good), Spell Resistance (SR), and calculated Fortitude, Reflex, and Will saving throws.'
      },
      {
        category: '⚔️ Precise Attack Mechanics & Threat Ranges',
        detail: 'Equipped each 3.5e monster with authentic weapon threat ranges, critical multipliers (e.g. Scimitar 18-20/x2, Greataxe x3, Vorpal Greatsword), multiattack routines, special venom mechanics, and iconic abilities like Beholder Eye Rays, Aboleth Mucus, Rust Monster antennae, and Medusa Petrifying Gaze.'
      },
      {
        category: '⚡ Instant Campaign Roster Spawning',
        detail: 'All newly added 3.5e monsters can be spawned directly into the active campaign roster or encounter tracker with a single click, fully mapped with portrait artwork and tokens.'
      }
    ]
  },
  {
    version: 'v0.9.9',
    date: 'Today',
    title: 'Workspace Streamlining, Redundancy Elimination & Context-Aware Vitals',
    badge: 'UI & UX Streamline',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '🎯 Level Advancement & Progression Consolidation',
        detail: 'Converted the top header level indicator into a clean, read-only status badge. Centralized interactive character advancement, multiclass XP allocation, and leveling wizard exclusively to the primary "Character Advancement" button on Sheet 1.'
      },
      {
        category: '☕ Unified Rest & Recovery Action Center',
        detail: 'Pinned Short Rest and Long Rest actions exclusively to the persistent top header bar, eliminating redundant duplicate rest modal launcher buttons across the combat sheet and floating quick-play dock.'
      },
      {
        category: '⚡ Floating Quick-Play Dock Cleanup',
        detail: 'Streamlined the floating quick-action dock by removing redundant Table Mode and Rest buttons, keeping the quick bar dedicated to rapid d20 rolls, quick combat navigation, and on-the-fly HP management.'
      },
      {
        category: '🩺 Context-Aware Combat Vitals De-duplication',
        detail: 'The persistent QuickStatsBar now automatically hides the quick HP status orb and adjustment controls when actively viewing Sheet 2 (Combat & Defenses) to prevent duplicate side-by-side HP blocks, while keeping AC, Initiative, Speed, Proficiency Bonus/BAB, Inspiration, Passive Senses, and Spell Slots intact.'
      },
      {
        category: '🖼️ Table Mode HUD Iconography & Visual Clarity',
        detail: 'Assigned a dedicated LayoutTemplate icon to Table Mode across collapsed/expanded sidebar docks and the Command Palette (Ctrl+K), establishing a clear visual distinction between the tabletop play HUD and the Physical Dice modal.'
      },
      {
        category: '👁️ QuickStatsBar Flow & Passive Senses Reordering',
        detail: 'Reordered the 5e QuickStatsBar so the Passive Senses suite (Perception, Investigation, Insight) sits alongside core defense metrics, followed by the Inspiration Token toggle.'
      },
      {
        category: '🧭 Interactive Guided Tour & Workspace Setup Suite',
        detail: 'Extended the Guided Tour into a 6-step interactive onboarding and customization suite with direct on-screen controls: configure Role Personas (Player / GM / Unified), toggle Density Modes (Focus vs Master), test & apply Ambient Themes and custom accent colors in real time, adjust procedural audio synthesizer volume with instant test rolls, toggle persistent HUD companion docks, and access full keyboard hotkey cheat sheets.'
      }
    ]
  },
  {
    version: 'v0.9.8',
    date: 'Today',
    title: 'Half-Breed Lineage Studio, Scaling Racial Defenses & Modal Draft Persistence',
    badge: 'Lineage & Race Studio',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    highlights: [
      {
        category: '🧬 Half-Breed & Hybrid Lineage Studio',
        detail: 'Comprehensive hybrid creation suite supporting both Classic SRD Half-Breeds (Half-Elf, Half-Orc, Half-Dragon, Half-Celestial, Half-Fiend, Half-Ogre, Half-Giant, Mul) with 1-click Forge application, and a Custom Hybrid Blender allowing users to combine any two parent lineages with configurable dominance and selectable Hybrid Vigor perks.'
      },
      {
        category: '📈 Ruleset-Exclusive Scaling Stats (5e & 3.5e)',
        detail: 'Full support for edition-specific scaling defenses. 3.5e lineages support level-scaling and formula-based Damage Reduction with bypass materials, Natural Armor progression, Spell Resistance scaling, per-element Energy Resistances with uniform or individual curves (Fire, Cold, Electricity, Acid, Sonic), and tiered Spell-Like Abilities. 5e lineages support Innate Spells with recharge/level thresholds, Damage & Condition Immunities, Natural Armor formulas, and Scaling Racial Dice.'
      },
      {
        category: '🛡️ Persistent Form Drafts & Accidental Modal Close Safety',
        detail: 'Race Studio and Character Creation form states are automatically persisted to local storage, preventing loss of entries across tab switches or accidental window dismissals. Backdrop clicks now require confirmation when active edits are present.'
      },
      {
        category: '⚔️ End-to-End Racial Stat Injection in Character Creation',
        detail: 'Creating a character now resolves and applies all racial ability score adjustments, natural armor bonuses, damage reduction values, energy resistances, immunities, vision/senses, and natural weapons directly to the character sheet with an interactive Base + Race breakdown toggle.'
      },
      {
        category: '👁️ Streamlined Vision & Senses Architecture',
        detail: 'Removed redundant Darkvision checkboxes in favor of an intelligent vision parser that detects Darkvision, Low-Light Vision, Blindsight, and Tremorsense directly from the senses definition.'
      }
    ]
  },
  {
    version: 'v0.9.7',
    date: 'Today',
    title: 'Compendium In-Place Editing, Entity Synchronization & UI Refinement',
    badge: 'Compendium & DM Tools',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '✏️ In-Place Compendium Entry Editing',
        detail: 'DMs can now edit any custom homebrew entry directly from the Compendium via both the entry card action buttons and the full Detail Modal view. Clicking Edit re-opens the dedicated Forge Studio pre-populated with all parameters, preserves entity IDs, and supports full updates.'
      },
      {
        category: '🔄 Bi-Directional Entity Synchronization',
        detail: 'When editing a compendium entry, the Forge dynamically scans active party character sheets and campaign rosters to identify linked instances (monsters, inventory gear, spells, races, classes, feats, and features). DMs can toggle synchronization to automatically propagate updated stats, AC, damage reduction, and descriptions across the campaign.'
      },
      {
        category: '🛡️ Studio Form Pre-Population & State Retention',
        detail: 'All Homebrew & Rules Forge Studios (Race, Class, Feat, Monster, Spell, and Item) have been updated to cleanly bind existing entity properties into their state controls, with clear "Editing Mode" banners and contextual action buttons.'
      },
      {
        category: '🎨 Polished Forge Studio Header Trigger',
        detail: 'Streamlined the Compendium header by removing the vector icon from the Homebrew & Rules Forge Studio button for a cleaner, unified typography and visual balance.'
      }
    ]
  },
  {
    version: 'v0.9.6',
    date: 'Today',
    title: 'Homebrew Lineage Forge, Dynamic Ability Score Matrix & Damage Reduction Suite',
    badge: 'Lineage & Combat Defenses',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    highlights: [
      {
        category: '🧬 Dynamic Ability Score Parser & Auto-Application',
        detail: 'Smart regex engine parsing complex multi-stat modifiers (e.g. "+4 Strength, -2 Dexterity, +4 Constitution, +4 Wisdom, -2 Charisma" and "+2 All") with live detected badges in the Race Studio. Applying a lineage directly modifies the character\'s ability scores and recalculates all dependent bonuses.'
      },
      {
        category: '🛡️ Advanced Damage Reduction (DR) Engine & Level Scaling',
        detail: 'Comprehensive Damage Reduction support for 3.5e, monsters, and custom lineages. Parses level-scaling DR ("gain 3 Damage Reduction at 1st level, increases to 6 at 5th level..."), standard slash syntax ("DR 5/magic", "DR 10/adamantine", "DR 3/-"), and word syntax ("Damage Reduction 5/silver"). Includes explicit DR Value & Bypass fields with automatic trait detection.'
      },
      {
        category: '👁️ Darkvision & Senses Display Normalization',
        detail: 'Cleaned up vision rendering in the Compendium race detail viewer, converting boolean values to readable distance labels (e.g. "60 ft" instead of "true ft") and adding explicit readouts for detected Ability Modifiers and active Damage Reduction.'
      },
      {
        category: '⚔️ Combat Defenses & Armor Class Dynamic Synchronization',
        detail: 'Applying a race from the Compendium triggers instant recalculation of Armor Class, Touch AC, Flat-Footed AC, and size modifiers, while automatically replacing previous racial traits to prevent trait accumulation.'
      },
      {
        category: '📜 1-Click Lineage Application with Live Toast Diagnostics',
        detail: 'Enhanced the "Apply Race to Character" flow in the Compendium with descriptive toast notifications displaying applied ability score adjustments, active DR values, and updated speeds.'
      }
    ]
  },
  {
    version: 'v0.9.5',
    date: 'September 2026',
    title: 'Complete D&D 3.5e Rules As Written (RAW) Mechanics & Tactical Engines Suite',
    badge: 'Official RAW Expansion',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    highlights: [
      {
        category: '💀 Negative Levels & Energy Drain Engine (DMG p. 293)',
        detail: 'Full penalty pipeline applying -1 per negative level to attack rolls, saving throws, skill checks, ability checks, effective caster level, and -5 Max HP per level. Includes a 24-hour Fortitude recovery save resolver against the source DC (Wight, Spectre, Vampire, Enervation) to prevent permanent level loss.'
      },
      {
        category: '⚡ Concentration & Defensive Casting Suite (PHB p. 69-70, 140)',
        detail: 'Dedicated Concentration DC calculator for Defensive Casting (DC 15 + Spell Level), Taking Damage while casting (DC 10 + damage + spell level), Continuous Damage, Extreme Weather, and Entanglement. Accounts for the Combat Casting feat (+4 bonus) and automatically subtracts Armor Check Penalties when applicable.'
      },
      {
        category: '🤸 Tumble & Acrobatics Movement Suite (PHB p. 84-85)',
        detail: 'Interactive Tumble check resolver for moving through threatened squares without provoking Attacks of Opportunity (DC 15) and tumbling directly through an occupied enemy space (DC 25), with +2 DC per additional opponent, full-speed (+10 DC) toggles, Armor Check Penalty integration, and Jump synergy bonuses (+2).'
      },
      {
        category: '🐎 Mounted Combat & Ride Maneuvers Suite (PHB p. 80-81, 157-158)',
        detail: 'Maneuver resolver covering Hit Negation (Ride check vs. incoming attack roll, 1/round with Mounted Combat feat), Guide with Knees (DC 5), Stay in Saddle (DC 5), Cover Behind Mount (DC 15 for +4 AC), Soft Fall (DC 15), Leap (DC 15), Spur Mount (DC 15), and Fast Mount/Dismount (DC 20).'
      },
      {
        category: '🐾 Wild Shape & Alternate Form Engine (PHB p. 37, Rules Compendium p. 24-27)',
        detail: 'True 3.5e Wild Shape physical stat replacement engine: substitutes Strength, Dexterity, and Constitution scores while preserving mental attributes (INT/WIS/CHA), recalculates HP, AC, Natural Armor, and Speed, overrides natural attack routines, and tracks size modifier changes.'
      },
      {
        category: '🧭 Environmental Hazards & Endurance Engine (DMG p. 301-304)',
        detail: 'Systemic condition and damage tracker for Forced March (DC 10 + 2/extra hour Fortitude check), Extreme Cold & Heat nonlethal damage, and Suffocation/Drowning rounds, fully factoring the Endurance feat (+4 bonus to physical resilience saves).'
      },
      {
        category: '👑 Prestige Class Prerequisites Validator (DMG p. 176-200)',
        detail: 'Automated prerequisite validation engine verifying Base Attack Bonus (BAB), Feats, Skill Ranks, Alignment, and Spellcasting requirements for iconic 3.5e Prestige Classes (Assassin, Blackguard, Arcane Archer, Arcane Trickster, Dragon Disciple, Duelist, Eldritch Knight, Loremaster, Shadowdancer).'
      },
      {
        category: '⏱️ Action Economy & Swift/Immediate Round Tracker (PHB p. 138-144)',
        detail: 'Round-based action tracker enforcing RAW rules for Standard, Move, Swift, and Immediate actions. Accurately simulates the rule that expending an Immediate action consumes the character\'s Swift action on their next turn, and tracks 5-Foot Step restrictions.'
      },
      {
        category: '🛡️ Tactical Cover & Line of Sight Selector (PHB p. 150-152)',
        detail: 'Interactive battlefield cover picker instantly toggling Standard Cover (+4 AC, +2 Reflex save), Improved Cover (+8 AC, +4 Reflex save, +10 Hide bonus, Improved Evasion vs. reflex bursts), and Total Cover directly onto character defense calculations.'
      }
    ]
  },
  {
    version: 'v0.9',
    date: 'September 2026',
    title: 'D&D 3.5e Tactical Combat, Combat Reflexes, Dual-Wielding & XP Ledger Suite',
    badge: 'Latest Release',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    highlights: [
      {
        category: '⚔️ Attacks of Opportunity (AoO) & Combat Reflexes Tracker',
        detail: 'Dynamic budget counter factoring base Dexterity modifiers and the Combat Reflexes feat (1 + DEX mod per round, min 1). Includes a full provocation rules matrix (moving through threatened squares, casting spells without defensive casting, ranged weapons in melee, standing up from prone, unarmed attacks) and 1-click AoO strike launchers.'
      },
      {
        category: '🗡️ Two-Weapon Fighting (TWF) Multi-Attack Engine',
        detail: 'Comprehensive 3.5e dual-wielding penalty matrix calculating primary and off-hand attack modifiers according to feat tiers (Two-Weapon Fighting, Improved TWF, Greater TWF) and light vs. one-handed off-hand weapons. Generates synchronized iterative main attacks and off-hand attacks with automatic 0.5× Strength damage modifier scaling.'
      },
      {
        category: '🌫️ Target Miss Chance, Concealment & Blind-Fight Integration',
        detail: 'Integrated miss chance engine into the Full Attack sequence supporting 20% Concealment, 50% Total Concealment, 50% Incorporeal Miss Chance, and Blink (50%/20%). Features automated percentile (d100) evaluation and automatic rerolls for characters with the Blind-Fight feat.'
      },
      {
        category: '🧪 Ability Damage, Permanent Drain & Poison Incubation Tracker',
        detail: 'Advanced vitality tracker for temporary ability damage and permanent ability drain across all six core ability scores, recalculating effective modifiers for dependent saves and skills. Includes a poison and disease incubation tracker with Fortitude DC checks, stage progression, and restoration healing helpers.'
      },
      {
        category: '📜 XP Crafting & High-Tier Spell Component Ledger',
        detail: 'Dedicated 3.5e experience point ledger to manage item creation XP costs (1/25th market price) and high-level spell material components (Wish, Limited Wish, Permanency, Miracle, Atonement), featuring 3.5e level-floor safeguards to prevent accidental de-leveling.'
      },
      {
        category: '🛡️ 3.5e Tactical Maneuvers, Spell Resistance & Arcane Spell Failure',
        detail: 'Interactive calculators for core 3.5e tactical maneuvers (Bull Rush, Disarm, Grapple, Overrun, Sunder, Trip) with size modifiers and opposed checks, Spell Penetration / Spell Resistance (SR) check resolver, Arcane Spell Failure (ASF) d100 roller, and Metamagic spell slot adjustments.'
      }
    ]
  },
  {
    version: 'v0.8',
    date: 'September 2026',
    title: 'Adaptive Sidebar Dock Architecture, Category Grouping & Table Ergonomics',
    badge: 'Navigation Suite',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    highlights: [
      {
        category: '🗂️ Categorized & Calibrated Sidebar Navigation',
        detail: 'Redesigned the primary navigation dock into five distinct semantic functional groups: Campaign & Rules, AI & World Intel, Multiplayer & Table, Developer & Plugins, and Settings & Preferences.'
      },
      {
        category: '🎲 Physical Tabletop Dice & Command Palette Reorganization',
        detail: 'Relocated Physical Tabletop Dice Mode (manual real-die input) and Global Command Palette (Ctrl+K) into Settings & Preferences for seamless access alongside Undo/Redo, audio settings, and PWA options.'
      },
      {
        category: '↔️ Phase In / Phase Out Collapsible Dock Rail',
        detail: 'Added synchronized compact icon-rail dock with subtle dividers and hover micro-tooltips matching the 5 categorized sections for maximized viewport space on single monitors and tablets.'
      },
      {
        category: '🛡️ Streamlined Multiplayer & Party Controls',
        detail: 'Focused the Multiplayer & Table section exclusively on live room session management, active campaign indicators, and integrated WebRTC Party Voice communication.'
      },
      {
        category: '⚡ Enhanced Tabletop Navigation Keybinds',
        detail: 'Direct fast-key accessibility across all views with Ctrl+K (Command Palette), Ctrl+M (Campaign World Atlas), Ctrl+J (Live Session Co-Pilot), Alt+T (Table Mode), and Ctrl+Z / Ctrl+Y (Atomic Undo/Redo).'
      }
    ]
  },
  {
    version: 'v0.7',
    date: 'August 2026',
    title: 'Homebrew Entity Studios, AI Forge & Multi-Dice Simulation',
    badge: 'Entity Suite',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
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
