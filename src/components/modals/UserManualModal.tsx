import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  UserPlus,
  Shield,
  ShieldAlert,
  Crosshair,
  Package,
  Wand2,
  ScrollText,
  Dices,
  Users,
  ShoppingBag,
  Dog,
  Sparkles,
  Volume2,
  Zap,
  HelpCircle,
  Layers,
  Crown,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Code2,
  RefreshCw,
  Award
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    | 'getting-started'
    | 'rulesets'
    | 'sheets'
    | 'multiplayer'
    | 'extensions'
    | 'companions'
    | 'dice-audio'
    | 'shortcuts'
  >('getting-started');

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedManual, setCopiedManual] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const text = `Pen & Paper Applet - Complete User Manual Overview\n\n` +
      `• Guest Adventurer Mode: Local storage access without login. Sign in for Firebase Cloud Sync.\n` +
      `• Rulesets Supported: D&D 5e, D&D 3.5e, Shadowrun 5e, Pathfinder 2e, Call of Cthulhu 7e, Custom TRPG Systems.\n` +
      `• Character Sheets: 7 dedicated views covering Stats, Combat, Inventory, Spells, Notes, Rules, Compendium & DM Overview.\n` +
      `• Combat Vitality: Animated HP Orb, Target AC Resolver, Weapons & Spell Attacks, Death Saves, Permanent Death & Revives.\n` +
      `• Multiplayer: Live session lobbies with 6-character room codes, Party Manager, DM Active Crown, Live Roll Log.\n` +
      `• Extensions: Plugin Manifest Schema (plugin/manifest.json), Marketplace catalog, Central Event Bus & Developer SDK.\n` +
      `• Companions & Transformations: Animal Companions, Mounts, Wild Shape / Polymorph with 0 HP form reversion.\n` +
      `• Dice & Audio: Polyhedral 3D/2D dice, ADV/DIS, formula expressions (2d6+4), 12 Web Audio procedural sound FX.\n` +
      `• Power Tools: Command Palette (Ctrl+K / Cmd+K), Theme Switcher, Quick HP Delta header buttons.`;

    navigator.clipboard.writeText(text);
    setCopiedManual(true);
    setTimeout(() => setCopiedManual(false), 2000);
  };

  const manualSections = [
    {
      id: 'getting-started',
      title: '🚀 Getting Started & Account Management',
      icon: UserPlus,
      color: 'text-amber-400',
      description: 'Learn how to create characters, switch between PCs and Monsters, use Guest Mode, and backup data.',
      topics: [
        {
          name: 'Guest Adventurer Mode (No Account Required)',
          detail: 'You can immediately create, view, edit, and roll on character sheets as a Guest. All progress is saved automatically in your browser local storage. No registration is required to enjoy full sheet capabilities.'
        },
        {
          name: 'Firebase Account & Cloud Sync',
          detail: 'Click the "Sign In / Register" button in the header or Main Menu to create a free account. Signed-in accounts enjoy persistent cloud synchronization via Firebase Firestore, allowing you to access your adventuring party from any desktop, tablet, or mobile device.'
        },
        {
          name: 'Creating a New Character',
          detail: 'Click "+ New" in the header to launch the New Character Creator wizard. Choose your character Class, Level, Race, Ability Scores, Portrait Image URL, and HP Calculation Mode (Average, Rolled, or Max Value HP).'
        },
        {
          name: 'Switching Between Characters, Monsters & Merchants',
          detail: 'Use the character switcher dropdown in the top left header. You can manage Player Characters (PCs), DM Encounter Monsters, and Town Shopkeepers / Merchants with custom vendor profit margins.'
        },
        {
          name: 'JSON Backup Export & Import',
          detail: 'To backup your character or transfer it between browsers, open the Options Modal (⚙️) → Character tab and click "Export Character JSON" or "Import Character JSON".'
        }
      ]
    },
    {
      id: 'rulesets',
      title: '⚔️ Multi-Edition TRPG Rulesets',
      icon: Layers,
      color: 'text-emerald-400',
      description: 'Overview of native rule engines: D&D 5e, D&D 3.5e, Shadowrun 5e, Pathfinder 2e, Call of Cthulhu 7e, and Custom TRPGs.',
      topics: [
        {
          name: 'D&D 5th Edition (5e)',
          detail: 'Core 5e engine featuring Proficiency Bonus scaling (+2 to +6), Advantage / Disadvantage toggles, 18 standard skill checks, Passive Perception, Concentration tracking, Pact Magic, and 20 preset spells.'
        },
        {
          name: 'D&D 3.5 Edition (3.5e)',
          detail: 'Classic v3.5 ruleset featuring Base Attack Bonus (BAB) progression (+6/+1 iterative attacks), Fortitude/Reflex/Will base save tables, Touch AC, Flat-Footed AC, Skill Points Calculator with Class/Cross-Class caps, Caster Level, Damage Reduction (DR), and Spell Resistance (SR).'
        },
        {
          name: 'Shadowrun 5e (Cyberpunk)',
          detail: 'Full d6 dice pool system (Attribute + Skill), Hit threshold (5s and 6s), Glitches, Physical & Stun condition monitors with wound penalties, Cyberware Essence limits (Max 6.00), Cyberdeck Matrix stats, Nuyen (¥), and Karma.'
        },
        {
          name: 'Pathfinder 2e (PF2e)',
          detail: 'Tactical 3-Action Turn Economy, Multiple Attack Penalty (MAP: -0, -5, -10), Four Degrees of Success (Critical Success, Success, Failure, Critical Failure), and Proficiency Ranks (Untrained, Trained, Expert, Master, Legendary).'
        },
        {
          name: 'Call of Cthulhu 7e (Eldritch Horror)',
          detail: 'd100 Percentile Skill Rolls, Sanity Points (SAN = WIS × 5), Bouts of Madness tracking, and Pushed Rolls.'
        },
        {
          name: 'Custom TRPG Ruleset Engine & Selector',
          detail: 'Use the TRPG System Selector Modal to filter enabled systems or build your own modular TRPG ruleset with custom attribute keys, dice formulas, and sheet layouts.'
        }
      ]
    },
    {
      id: 'sheets',
      title: '📊 Interactive Character Sheet Views (Sheets 1–7 & DM)',
      icon: ScrollText,
      color: 'text-purple-400',
      description: 'Detailed walkthrough of each sheet tab: Stats, Combat, Gear, Spells, Notes, Rules, Compendium, and DM View.',
      topics: [
        {
          name: 'Sheet 1: Stats, Saves, Skills & Feats',
          detail: 'View primary Ability Scores (Score primary with calculated modifier below). Toggle Saving Throw proficiencies and Skill proficiencies/expertise. Add Class Features, Feats with Max HP grants (+10 HP for Tough feat), Hybrid Heritage ancestry, or Supernatural Species Transformations.'
        },
        {
          name: 'Sheet 2: Combat, Vitality & Death Saves',
          detail: 'Track health with an animated liquid HP Orb, Temp HP, and Max HP Breakdown Inspector. Features Target AC Attack Resolver, Weapon attack & damage rolls, Bonus Actions, Reactions, Conditions, Exhaustion Levels 1-6, Death Saving Throws (3 successes/failures), Permanent Death mechanics, and Revive spell restoration.'
        },
        {
          name: 'Sheet 3: Gear, Wealth & Encumbrance',
          detail: 'Currency pouch for CP, SP, EP, GP, PP with automatic gold conversion. Track item quantities, weights, encumbrance capacity bar (STR × 15 lbs), 3 Magic Item Attunement slots, Damage Reduction (DR), and custom item properties.'
        },
        {
          name: 'Sheet 4: Spells & Spellcasting',
          detail: 'Select Spellcasting Ability (INT, WIS, CHA) to compute Save DC and Attack Bonus. Manage 1st–9th level spell slot grid and Pact Magic slots. Features 20 official 5e preset spells (Wish, Revivify, Fireball, etc.), concentration tracker, ritual tag, unique duplicate spellbook prevention, and ascending/descending level sorting.'
        },
        {
          name: 'Sheet 5: Description, Background & Notes',
          detail: 'Record age, height, weight, eyes, hair, deity/patron, and character portrait URL. Log personality traits, ideals, bonds, flaws, alignment matrix, backstory, and session notes with formatted rich text.'
        },
        {
          name: 'Sheet 6: Rules Reference & User Manual',
          detail: 'Interactive manual containing mathematical formula breakdowns, system ruleset guides, Web Audio sound sandbox, version changelogs, and live search.'
        },
        {
          name: 'Sheet 7: SRD Compendium & Quick Import',
          detail: 'Searchable compendium database of Spells, Equipment, Magic Items, Feats, and Monsters with 1-click import into your active character sheet.'
        },
        {
          name: 'Sheet DM: DM Campaign Overview',
          detail: 'Dungeon Master dashboard displaying total party HP pool, average passive perception, monster encounter XP award manager, party loot distribution, and real-time party roll log.'
        }
      ]
    },
    {
      id: 'multiplayer',
      title: '👥 Multiplayer Live Sessions & Party Manager',
      icon: Users,
      color: 'text-indigo-400',
      description: 'Collaborate live with your party and DM using Firebase Firestore synchronization.',
      topics: [
        {
          name: 'Creating or Joining a Live Session',
          detail: 'Click "Session Lobby" in the header or Main Menu to create a new session room or join an existing session using a 6-character room code. Changes to HP, combat rolls, and inventory sync in real time.'
        },
        {
          name: 'Party Manager & Adventuring Groups',
          detail: 'Click "Parties" in the header to group player characters and allies into adventuring parties. Inspect party total HP, average level, average passive perception, and import entire parties directly into combat encounters.'
        },
        {
          name: 'DM Active Crown Indicator & Unlocked Player Access',
          detail: 'A purple Crown badge appears on sheets when a Dungeon Master is actively supervising or viewing. DM presence does NOT block players from controlling their character; selection is locked only if another active Player occupies the slot.'
        },
        {
          name: 'Shared Live Dice Roll Log',
          detail: 'All dice rolls made by players or the DM in a live session appear instantly in the shared session roll log drawer.'
        }
      ]
    },
    {
      id: 'extensions',
      title: '🔌 Extension Marketplace & Custom Plugins',
      icon: ShoppingBag,
      color: 'text-cyan-400',
      description: 'Extend your applet with modular rulesets, plugin manifests, and developer SDK tools.',
      topics: [
        {
          name: 'Plugin Manifest Schema (plugin/manifest.json)',
          detail: 'Full support for standardized plugin manifest metadata including name, version, author, dependencies, app version requirements, and permission declarations.'
        },
        {
          name: 'Extension Marketplace Catalog',
          detail: 'Open the Extension Manager Modal (🧩) to browse and install curated extensions: Pathfinder 2e Tactical Engine, Cyberpunk Netrunner Suite, Shadowrun Matrix, Call of Cthulhu Sanity, 3D Dice Physics, Soundscape Synthesizer, and Homebrew Creator.'
        },
        {
          name: 'Updating Extensions & Version Alerts',
          detail: 'When new plugin versions are released (e.g., v1.4.2 → v2.0.0), a red notification badge appears on the Marketplace tab with 1-click update buttons.'
        },
        {
          name: 'Central Event Bus & Developer SDK',
          detail: 'Plugin developers can inspect live event history (DICE_ROLLED, HP_CHANGED, SPELL_CAST), test event payloads, and access complete TypeScript SDK specifications.'
        }
      ]
    },
    {
      id: 'companions',
      title: '🐾 Companions & Transformation Manager',
      icon: Dog,
      color: 'text-amber-300',
      description: 'Manage pets, familiars, mounts, Wild Shape forms, and polymorph transformations.',
      topics: [
        {
          name: 'Companion Manager Modal',
          detail: 'Click "Companions" to add pets, familiars, mounts, homunculi, or summoned creatures. Track separate HP, AC, attacks, and special abilities for each companion.'
        },
        {
          name: 'Supernatural Transformation & Wild Shape',
          detail: 'Transform into Beast forms (Wild Shape for Druids), Polymorph targets, Lycanthropes, Vampires, or Liches. Automatically overrides physical stats and grants temporary HP.'
        },
        {
          name: 'Automatic Reversion & Overflow Damage on 0 HP',
          detail: 'When a transformed form drops to 0 HP, the character automatically reverts to their original form, and any leftover overflow damage is subtracted directly from base HP.'
        }
      ]
    },
    {
      id: 'dice-audio',
      title: '🎲 Interactive Dice Roller & Audio Synthesizer',
      icon: Dices,
      color: 'text-rose-400',
      description: 'Polyhedral dice rolling bar, formula expressions, and Web Audio sound effects.',
      topics: [
        {
          name: 'Polyhedral Floating Dice Bar',
          detail: 'Floating toolbar providing 1-click access to d4, d6, d8, d10, d12, d20, and d100 with multiplier and modifier inputs.'
        },
        {
          name: 'Advantage & Disadvantage Rolling',
          detail: 'Toggle ADV (rolls 2d20, keeps higher) or DIS (rolls 2d20, keeps lower) for d20 ability, save, or attack checks.'
        },
        {
          name: 'Custom Roll Formulas',
          detail: 'Type complex expressions like 2d6+4, 1d20+7, or 4d6kh3 directly into the custom formula field.'
        },
        {
          name: 'Roll Log Drawer with Critical Highlights',
          detail: 'Timestamped history drawer displaying individual dice results, natural 20 critical gold highlights, and natural 1 fumble red highlights.'
        },
        {
          name: '12 Procedural Web Audio Sound Effects',
          detail: 'Real-time Web Audio sound synthesis for 12 dynamic triggers: Dice Rolls, Critical Hits, Spell Casts, Healing Chimes, Level Up Fanfares, Sword Swings, and Death Save Bells. Features master volume slider and 1-click presets (Mute, 25%, 50%, 75%, Max).'
        }
      ]
    },
    {
      id: 'shortcuts',
      title: '⚡ Power Tools & Keyboard Shortcuts',
      icon: Zap,
      color: 'text-amber-400',
      description: 'Boost your speed with Command Palette, Theme Engines, and Header Actions.',
      topics: [
        {
          name: 'Command Palette (Ctrl+K / Cmd+K)',
          detail: 'Press Ctrl+K (or Cmd+K on Mac) to open the Command Palette. Type any tab name, feature, or tool to jump instantly.'
        },
        {
          name: 'Workspace Theme Selector',
          detail: 'Open Options (⚙️) → Workspace Customizer to switch themes: Parchment Classic, Dark Obsidian, Emerald Glade, Royal Velvet, Cyberpunk Neon, or Blood Moon.'
        },
        {
          name: 'Header Quick Health Delta Buttons',
          detail: 'Adjust current HP instantly using header quick buttons (-10, -1, +1, +10) or type exact values into the HP delta input.'
        },
        {
          name: 'Short Rest & Long Rest Triggers',
          detail: 'Click "Short Rest" (restores temp HP & spend Hit Dice) or "Long Rest" (restores max HP, resets spent Hit Dice, and refills spell slots).'
        }
      ]
    }
  ];

  const filteredSections = manualSections.map((sec) => {
    if (!searchQuery.trim()) return sec;
    const q = searchQuery.toLowerCase();
    const matchingTopics = sec.topics.filter(
      (t) => t.name.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q)
    );
    const titleMatch = sec.title.toLowerCase().includes(q) || sec.description.toLowerCase().includes(q);

    if (titleMatch || matchingTopics.length > 0) {
      return {
        ...sec,
        topics: titleMatch ? sec.topics : matchingTopics
      };
    }
    return null;
  }).filter(Boolean);

  const activeSectionObj = manualSections.find((s) => s.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100 flex items-center gap-2">
                <span>Complete Application User Manual</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  v1.0.0
                </span>
              </h2>
              <p className="text-xs text-stone-400 hidden sm:block">
                Comprehensive guide covering every feature, ruleset, multiplayer session, extension, and tool in Pen & Paper Applet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 border border-stone-700 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5"
              title="Copy Quick Manual Summary"
            >
              {copiedManual ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Copy Summary</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Search & Tabs Bar */}
        <div className="p-3 bg-stone-950/90 border-b border-stone-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user manual topics..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[10px] text-stone-400 hover:text-stone-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent pb-1 pr-4">
            {manualSections.map((sec) => {
              const IconComp = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveTab(sec.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === sec.id
                      ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${activeTab === sec.id ? 'text-stone-950' : sec.color}`} />
                  <span>{sec.title.split(' ')[1]}</span>
                </button>
              );
            })}
            <div className="w-6 shrink-0 h-1" />
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-200 text-xs sm:text-sm">
          {searchQuery ? (
            /* Search Results View */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="text-amber-400 font-serif font-bold">
                  Search Results for "{searchQuery}" ({filteredSections.reduce((acc, s) => acc + (s?.topics.length || 0), 0)} topics)
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-stone-400 hover:text-amber-300"
                >
                  Show All Sections
                </button>
              </div>

              {filteredSections.length === 0 ? (
                <div className="text-center py-12 text-stone-500 space-y-2">
                  <HelpCircle className="w-12 h-12 text-stone-600 mx-auto" />
                  <p>No user manual topics found matching "{searchQuery}".</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-1.5 bg-amber-600 text-stone-950 rounded-lg font-bold text-xs"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                filteredSections.map((sec) => {
                  if (!sec) return null;
                  const IconComp = sec.icon;
                  return (
                    <div key={sec.id} className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                        <IconComp className={`w-5 h-5 ${sec.color}`} />
                        <h3 className="text-base font-serif font-bold text-amber-100">{sec.title}</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {sec.topics.map((t, idx) => (
                          <div key={idx} className="bg-stone-900 border border-stone-800/80 rounded-xl p-3 space-y-1">
                            <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{t.name}</span>
                            </h4>
                            <p className="text-stone-300 text-xs leading-relaxed pl-5">{t.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Tabbed Single Section View */
            activeSectionObj && (
              <div className="space-y-6">
                {/* Active Section Header Banner */}
                <div className="bg-gradient-to-r from-amber-950/60 via-stone-950 to-stone-950 border border-amber-600/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl shrink-0">
                    {React.createElement(activeSectionObj.icon, { className: `w-7 h-7 ${activeSectionObj.color}` })}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-amber-100">{activeSectionObj.title}</h3>
                    <p className="text-stone-300 text-xs leading-relaxed">{activeSectionObj.description}</p>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeSectionObj.topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-950/80 border border-stone-800/90 hover:border-amber-600/40 rounded-2xl p-4 space-y-2 transition shadow-sm hover:shadow-md"
                    >
                      <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{topic.name}</span>
                      </h4>
                      <p className="text-stone-300 text-xs leading-relaxed">{topic.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pen & Paper Applet • Multi-Edition TRPG VTT</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-serif font-bold rounded-xl transition shadow"
          >
            Close Manual
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserManualModal;
