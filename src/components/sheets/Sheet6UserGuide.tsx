import React, { useState, useEffect } from 'react';
import { RuleEdition } from '../../types';
import { changelogData } from '../../data/changelogData';
import { systemRegistry } from '../../systems';
import { 
  BookOpen, 
  ShieldAlert, 
  Crosshair, 
  Package, 
  Wand2, 
  ScrollText, 
  Dices, 
  UserPlus, 
  Download, 
  Upload, 
  Heart, 
  Shield, 
  Sparkles, 
  Flame, 
  RefreshCw,
  HelpCircle,
  Search,
  Layers,
  Award,
  Swords,
  Cpu,
  Skull,
  Volume2,
  VolumeX,
  Radio,
  History,
  Crown,
  Users,
  CheckCircle2,
  Zap,
  RadioTower,
  ShoppingBag,
  Dog
} from 'lucide-react';

interface Sheet6UserGuideProps {
  edition?: RuleEdition;
  enabledSystems?: RuleEdition[];
}

export const Sheet6UserGuide: React.FC<Sheet6UserGuideProps> = ({
  edition = '5e',
  enabledSystems
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('all');
  const [guideEdition, setGuideEdition] = useState<RuleEdition | 'manual' | 'audio' | 'changelog'>(edition);

  useEffect(() => {
    if (guideEdition === 'manual' || guideEdition === 'audio' || guideEdition === 'changelog') return;
    if (enabledSystems && enabledSystems.length > 0) {
      if (!enabledSystems.includes(guideEdition as RuleEdition)) {
        setGuideEdition(enabledSystems[0]);
      }
    } else {
      setGuideEdition(edition);
    }
  }, [edition, enabledSystems]);

  // 5e Guide Data
  const guideSections5e = [
    {
      id: 'formulas-5e',
      title: 'Edition Formulas & Calculations Breakdown (5e)',
      icon: Wand2,
      color: 'text-amber-300',
      description: 'Mathematical breakdown of every score, bonus, save, AC, and spell stat in D&D 5e.',
      items: [
        {
          name: 'Ability Modifier Formula',
          action: 'Floor((Score - 10) / 2)',
          detail: 'Score 10-11 = +0; Score 12-13 = +1; Score 14-15 = +2; Score 8-9 = -1. Standard D&D modifier calculation applied to all checks.'
        },
        {
          name: 'Proficiency Bonus Scaling',
          action: 'Floor((Level - 1) / 4) + 2',
          detail: 'Levels 1–4: +2 | Levels 5–8: +3 | Levels 9–12: +4 | Levels 13–16: +5 | Levels 17–20: +6.'
        },
        {
          name: 'Armor Class (AC) Calculations',
          action: 'Base Armor + DEX Modifier',
          detail: 'Unarmored: 10 + DEX Mod. Light Armor: Base AC + DEX Mod. Medium Armor: Base AC + min(2, DEX Mod). Heavy Armor: Base AC (no DEX). Shield: +2 AC.'
        },
        {
          name: 'Saving Throws & Skill Checks',
          action: 'd20 + Ability Mod + (Prof / Expertise)',
          detail: 'Proficient Save/Skill: d20 + Mod + Prof. Expertise Skill: d20 + Mod + (2 × Prof). Jack of All Trades: d20 + Mod + Floor(Prof / 2).'
        },
        {
          name: 'Passive Perception',
          action: '10 + WIS Mod + Prof / Expertise',
          detail: 'Base 10 + WIS Modifier + Proficiency Bonus (if proficient in Perception) + 5 if the character has Advantage.'
        },
        {
          name: 'Weapon Attack & Damage Rolls',
          action: 'd20 + Prof + STR/DEX',
          detail: 'Melee Attack: d20 + STR Mod + Prof. Ranged / Finesse: d20 + DEX Mod + Prof. Weapon Damage: Weapon Die + STR or DEX Mod.'
        },
        {
          name: 'Spell Save DC & Attack Bonus',
          action: '8 + Prof + Casting Mod',
          detail: 'Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Mod (INT/WIS/CHA). Spell Attack = Prof + Casting Ability Mod.'
        },
        {
          name: 'Hit Points & HP Calc Modes',
          action: 'Class Hit Die + CON Mod',
          detail: 'Level 1: Max Hit Die + CON Mod. Subsequent Levels (Average): Floor(Hit Die / 2) + 1 + CON Mod. Rolled Mode: Rolled die result + CON Mod.'
        },
        {
          name: 'Hit Point Maximum Breakdown Inspector',
          action: 'Click Max HP in Header or Combat Sheet',
          detail: 'Opens the Max HP Breakdown inspector showing Effective Max HP calculated from Base HP, Feat bonuses (e.g. Tough), Equipped Item bonuses (e.g. Ring of Vitality), active modifiers (Spells like Aid or Life Drain), and Level 4+ Exhaustion halving.'
        },
        {
          name: 'Carrying Capacity & Encumbrance',
          action: 'STR × 15 lbs',
          detail: 'Max Carrying Capacity = STR × 15 lbs. Push / Drag / Lift Capacity = STR × 30 lbs.'
        },
        {
          name: 'Monster Encounter Defeat XP',
          action: 'Custom Party XP Field',
          detail: 'When a creature is marked as a Monster, the DM can specify the total Defeat XP awarded to the adventuring party upon victory.'
        }
      ]
    },
    {
      id: 'header-mgmt',
      title: 'Header & Character Management (5e)',
      icon: UserPlus,
      color: 'text-amber-400',
      description: 'Manage 5e characters, portrait URLs, import/export backups, and trigger rests.',
      items: [
        {
          name: 'Character Switcher & Main Menu',
          action: 'Top Left Dropdown / Main Menu',
          detail: 'Switch instantly between stored 5e characters. All character state is automatically saved to your browser local storage.'
        },
        {
          name: 'Create New Character & HP Calc',
          action: '"+ New" Button in Header',
          detail: 'Input Class, Level, Race, Ability Scores, Portrait Image URL, and HP Calculation Mode (Average, Rolled, or Max Value HP).'
        },
        {
          name: 'JSON Export & Import',
          action: 'Options Modal (⚙️) → Character Tab',
          detail: 'When logged in, open the Options modal (⚙️) and select the Character tab to import `.json` backups or export active character sheets.'
        },
        {
          name: 'Short Rest & Long Rest',
          action: 'Rest Buttons next to Level',
          detail: 'Short Rest restores temporary HP and lets you spend Hit Dice. Long Rest restores HP to maximum, resets spent Hit Dice, and refills all Spell Slots.'
        },
        {
          name: 'Initiative Roll',
          action: '⚡ Init Roll Button in Header',
          detail: 'Rolls a d20 + your DEX initiative modifier and logs the result directly to the Floating Dice Roller.'
        },
        {
          name: 'DM Active Presence & Unlocked Player Access',
          action: '👑 DM Active Header Banner',
          detail: 'Displays a live crown indicator whenever a Dungeon Master is actively managing or viewing this character sheet. DM presence does NOT block players from selecting or controlling the character. Selection is locked only when another active Player occupies the character slot.'
        },
        {
          name: 'Audio & Sound Effects Options',
          action: '🔊 Sound Status in Header / Main Menu',
          detail: 'Opens the Audio Options modal to adjust Master Volume (0-100%), toggle Master Mute, select volume presets (25%, 50%, 75%, Max), and test all 12 procedural Web Audio API sound effects.'
        },
        {
          name: 'Death Saving Throws & Permanent Death',
          action: 'Combat Sheet Death Save Tracker',
          detail: 'When at 0 HP, roll death saving throws. 3 Successes (or a Natural 20) automatically restores 1 HP so the character can act again and resets death saves. Accumulating 3 Failures results in Permanent Death: HP is locked to 0, labeled "DEAD", and standard rests are disabled until Revive spells (e.g. Revivify) are cast.'
        }
      ]
    },
    {
      id: 'sheet1-guide',
      title: 'Stats & Features (5e)',
      icon: ShieldAlert,
      color: 'text-rose-400',
      description: 'Ability Scores (Score Primary), Saving Throws, 18 Skills & Feats.',
      items: [
        {
          name: 'Ability Scores & Modifiers',
          action: 'Click any Ability Card or d20 icon',
          detail: 'Displays primary Ability Score prominently with Modifier below. Modifiers are calculated automatically: (Score - 10) / 2. Click to roll a check with Normal, Advantage, or Disadvantage.'
        },
        {
          name: 'Saving Throws',
          action: 'Checkboxes next to Abilities',
          detail: 'Toggle saving throw proficiency checkboxes. When proficiencies are enabled, your Proficiency Bonus (+2 to +6) is automatically added to rolls.'
        },
        {
          name: '5e Skill Checks List',
          action: 'Click any Skill row or d20 button',
          detail: 'Complete 18 standard 5e skills list (Acrobatics, Athletics, Stealth, Perception, etc.). Radio/box toggles Proficiency or Expertise (+2x Prof Bonus).'
        },
        {
          name: 'Class Features & Feats with Max HP Grants',
          action: '"+ Add Feature / Feat" Buttons',
          detail: 'Add custom racial traits, class features (e.g. Action Surge, Second Wind), or feats with custom source tags and optional Max HP bonuses (e.g., +10 HP for Tough feat).'
        },
        {
          name: 'Hybrid Heritage Ancestry Generator',
          action: 'Options Modal (⚙️) / Race Selector',
          detail: 'Combine two distinct ancestries (e.g. Half-Elf, Half-Orc, Tiefling-Human, Aasimar-Dwarf) with custom trait selection, blended racial bonuses, and combined darkvision capabilities.'
        },
        {
          name: 'Supernatural Species Transformations',
          action: 'Options Modal (⚙️) / Character Tab',
          detail: 'Apply supernatural species transformations (Vampire, Lycanthrope, Lich, Fiend, Dragonborn, Aberration) with stat modifiers, temporary HP multipliers, special senses, and vulnerability/immunity traits.'
        }
      ]
    },
    {
      id: 'sheet2-guide',
      title: 'Combat & Actions (5e)',
      icon: Crosshair,
      color: 'text-emerald-400',
      description: 'HP Management with Animated Orb, Armor Class, Weapons & 5e Rules.',
      items: [
        {
          name: 'Hit Points & Animated HP Orb',
          action: 'Quick adjustment buttons (-10, -1, +1, +10)',
          detail: 'Track Current HP, Max HP, and Temp HP. Uses color-coded HP text (Green 75-100%, Yellow 49-74%, Red <49%) with an animated liquid vitality orb.'
        },
        {
          name: 'Death Saving Throws & Permanent Death',
          action: 'Success / Failure Checkboxes',
          detail: 'Track 3 Successes and 3 Failures. Accumulating 3 Failures results in Permanent Death for PCs and Merchants: HP is locked to 0, labeled "DEAD", and standard rests or healing items/potions are disabled. Only Revive spells (e.g. Revivify, Resurrection) or manual DM HP modifications bring the character back to life.'
        },
        {
          name: 'Encounter Tracker, Target AC Resolver & Active Speaker Highlighting',
          action: 'Combat View & Target AC Panel',
          detail: 'Manage turn orders, initiative, status conditions, and use the automated Target AC Hit & Attack Resolver. Combatant cards automatically display a glowing emerald ring and "SPEAKING" pulse badge when party members talk in WebRTC Party Voice.'
        },
        {
          name: 'Party Manager & Adventuring Groups',
          action: 'Header "Parties" Button',
          detail: 'Group player characters and allies into adventuring parties. View total party HP pool, average passive perception, average level, and add entire parties directly to combat encounters (dead members automatically excluded).'
        },
        {
          name: 'Weapons & Attacks',
          action: 'Click "Atk Roll" or "Damage Roll"',
          detail: 'Add melee, ranged, or spell weapons with custom bonuses. Click "Atk Roll" to roll d20 + Prof + STR/DEX, or "Damage Roll" to parse expressions like 2d6+4.'
        },
        {
          name: '5e Combat Rules Cheat Sheet',
          action: 'Accordion / Reference Panels',
          detail: 'Built-in 5e cheat sheet covering Movement, Actions (Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready), Bonus Actions, and Conditions (Blinded, Charmed, Grappled, Prone, Stunned, etc.).'
        }
      ]
    },
    {
      id: 'sheet3-guide',
      title: 'Gear, Inventory & Wealth (5e)',
      icon: Package,
      color: 'text-amber-300',
      description: 'Currency, encumbrance weight tracking, and attunement slots.',
      items: [
        {
          name: 'Currency Pouch',
          action: 'Inputs for CP, SP, EP, GP, PP',
          detail: 'Track copper, silver, electrum, gold, and platinum pieces with automatic total gold value conversion.'
        },
        {
          name: 'Inventory Items, DR & Max HP Bonuses',
          action: '"+ Add Item" / Item Editor',
          detail: 'Track quantity, unit weight, equipped status, Damage Reduction (DR), Damage Resistance type, and custom Max HP bonus/penalty fields for items.'
        },
        {
          name: 'Encumbrance Calculator',
          action: 'Automatic Weight Bar',
          detail: 'Calculates Total Weight carried against Carrying Capacity (STR × 15 lbs) and Push/Drag/Lift capacity (STR × 30 lbs).'
        },
        {
          name: 'Magic Items & Attunement',
          action: 'Attunement Slots (Max 3)',
          detail: 'Track magic items requiring attunement with active status indicators (e.g., Ring of Protection, Cloak of Displacement).'
        }
      ]
    },
    {
      id: 'sheet4-guide',
      title: 'Spells & Spellcasting (5e)',
      icon: Wand2,
      color: 'text-purple-400',
      description: 'Spell slots tracker, Spell Save DC, and spellbook manager.',
      items: [
        {
          name: 'Spellcasting Stats',
          action: 'Casting Ability selector',
          detail: 'Select INT, WIS, or CHA. Automatically computes Spell Save DC (8 + Prof + Mod) and Spell Attack Bonus (Prof + Mod).'
        },
        {
          name: 'Spell Slots Tracker',
          action: 'Slot counter buttons',
          detail: 'Track total and remaining spell slots for 1st through 9th level spells. Click slot boxes to spend or restore slots.'
        },
        {
          name: 'Official 5e Preset Spells & Wish',
          action: '"+ Add Spell" Dropdown Picker',
          detail: 'Choose from 20 iconic official D&D 5e spells (Wish, Revivify, Raise Dead, Resurrection, Fireball, Cure Wounds, Shield, Counterspell, etc.). Selecting a preset auto-populates casting time, range, components, duration, and spell descriptions.'
        },
        {
          name: 'Revive Spells & Life Restoration',
          action: 'Cast Revivify / Resurrection',
          detail: 'Casting revive spells (Revivify, Raise Dead, Resurrection, True Resurrection) automatically restores a Dead character to life, clears death save failures, and restores hit points.'
        },
        {
          name: 'Spellbook & Cantrips',
          action: '"+ Add Spell" / Level Filters',
          detail: 'Organize spells by level (Cantrip to 9th). Filter by level, mark prepared spells, and click "Cast / Roll" to trigger spell attacks or damage rolls directly.'
        },
        {
          name: 'Ascending & Descending Spell Level Sorting',
          action: 'Sorting Selector (Level / Name / School)',
          detail: 'Sort spells ascending (Cantrips → Level 9) or descending (Level 9 → Cantrips), by Name (A-Z / Z-A), or Magic School across both Daily Spells and Spellbook views.'
        },
        {
          name: 'Strict Unique Spellbook Protection',
          action: 'Automatic Duplicate Guard',
          detail: 'Enforces strict spellbook uniqueness by Name and Effect, preventing duplicate entries when adding custom spells, selecting 5e presets, or importing from the Compendium.'
        }
      ]
    },
    {
      id: 'sheet5-guide',
      title: 'Description & Notes',
      icon: ScrollText,
      color: 'text-blue-400',
      description: 'Physical appearance, backstory, personality traits, and campaign log.',
      items: [
        {
          name: 'Physical Demographics & Portrait',
          action: 'Form inputs & Image Link',
          detail: 'Record age, height, weight, eyes, hair, skin color, gender, and display custom character portrait image.'
        },
        {
          name: 'Personality, Ideals, Bonds & Flaws',
          action: 'Text areas',
          detail: 'Log standard roleplaying characteristics for quick access during social encounters.'
        },
        {
          name: 'Backstory, Allies & Quest Log',
          action: 'Large notes areas',
          detail: 'Write detailed character history, faction allegiances, contacts, session secrets, and party loot.'
        }
      ]
    },
    {
      id: 'dice-guide',
      title: 'Floating Interactive Dice Roller',
      icon: Dices,
      color: 'text-amber-500',
      description: 'Standard polyhedral dice floating toolbar and roll log history.',
      items: [
        {
          name: 'Polyhedral Quick Buttons',
          action: 'Bottom Floating Bar (d4, d6, d8, d10, d12, d20, d100)',
          detail: 'Click any die button to roll instantly. Set custom count or modifiers.'
        },
        {
          name: 'Advantage & Disadvantage',
          action: 'ADV / DIS Toggle Buttons',
          detail: 'When rolling a d20, toggle ADV (rolls 2d20, takes higher) or DIS (rolls 2d20, takes lower).'
        },
        {
          name: 'Roll Log Drawer',
          action: 'Click "Log" button on floating bar',
          detail: 'Opens a complete history drawer of all recent rolls with timestamp, die breakdown, and total result.'
        }
      ]
    }
  ];

  // 3.5e Edition Specific Guide Data
  const guideSections35e = [
    {
      id: 'formulas-35e',
      title: 'Edition Formulas & Calculations Breakdown (3.5e)',
      icon: Wand2,
      color: 'text-amber-300',
      description: 'Mathematical breakdown of BAB, Fort/Ref/Will, Touch AC, Skill Point Calculator, and Encumbrance in 3.5e.',
      items: [
        {
          name: 'Ability Modifier Formula',
          action: 'Floor((Score - 10) / 2)',
          detail: 'Score 10-11 = +0; Score 12-13 = +1; Score 14-15 = +2; Score 8-9 = -1.'
        },
        {
          name: 'Base Attack Bonus (BAB) Progression',
          action: 'Full (Lvl), 3/4 (Lvl×0.75), 1/2 (Lvl×0.5)',
          detail: 'Good BAB (Fighter/Paladin/Barbarian/Ranger) = Level. Average BAB (Cleric/Rogue/Monk/Bard) = Floor(Level × 0.75). Poor BAB (Wizard/Sorcerer) = Floor(Level × 0.5). Extra iterative attacks gained at BAB +6/+1, +11/+6/+1, +16/+11/+6/+1.'
        },
        {
          name: '3.5e Saving Throws (Fort, Ref, Will)',
          action: 'Base Save + Ability Mod + Misc',
          detail: 'Fortitude = Base Fort + CON Mod. Reflex = Base Ref + DEX Mod. Will = Base Will + WIS Mod. Good Save Base = Floor(Level / 2) + 2. Poor Save Base = Floor(Level / 3).'
        },
        {
          name: 'Standard Armor Class (AC)',
          action: '10 + Armor + Shield + DEX + Size',
          detail: '10 + Armor Bonus + Shield Bonus + DEX Mod + Size Mod + Natural Armor + Deflection Mod.'
        },
        {
          name: 'Touch Armor Class (Touch AC)',
          action: '10 + DEX Mod + Size + Deflection',
          detail: 'Ignores Armor, Shield, and Natural Armor. Used against spell rays, incorporeal attacks, and touch spells.'
        },
        {
          name: 'Flat-Footed Armor Class',
          action: '10 + Armor + Shield + Natural + Size',
          detail: 'Ignores DEX Modifier and Dodge bonuses. Applies when surprised or caught flat-footed in combat.'
        },
        {
          name: 'Grapple Check Formula',
          action: 'BAB + STR Mod + Special Size Mod',
          detail: 'BAB + STR Modifier + Size Mod (Medium 0, Large +4, Huge +8, Gargantuan +12, Colossal +16, Small -4, Tiny -8).'
        },
        {
          name: '3.5e Skill Point Calculator & Max Ranks',
          action: '(Base SP + INT Mod) × 4 at Lvl 1',
          detail: 'Level 1: (Base Class SP + INT Mod) × 4 + Human (+4). Subsequent: Base Class SP + INT Mod + Human (+1). Class Skill Max Ranks = Level + 3 (1 SP/rank). Cross-Class Max Ranks = (Level + 3) / 2 (2 SP/rank).'
        },
        {
          name: '3.5e Spell Save DC Formula',
          action: '10 + Spell Level + Casting Mod',
          detail: '10 + Spell Level + Ability Mod (INT for Wizard, WIS for Cleric/Druid, CHA for Sorcerer/Bard).'
        },
        {
          name: 'Carrying Capacity Loads (3.5e)',
          action: 'Light / Medium / Heavy Load',
          detail: 'Light Load: No penalty, normal speed. Medium Load: Max DEX +3, -3 check penalty, 20ft speed. Heavy Load: Max DEX +1, -6 check penalty, 20ft speed.'
        },
        {
          name: 'Monster Encounter Defeat XP',
          action: 'Custom Party XP Field',
          detail: 'DMs can flag encounter creatures as Monsters and set Defeat XP rewards for battle session planning.'
        }
      ]
    },
    {
      id: 'header-mgmt',
      title: 'Header & Character Management (3.5e)',
      icon: UserPlus,
      color: 'text-amber-400',
      description: '3.5e ruleset management, BAB display, 3.5e saving throws, and HP calculation modes.',
      items: [
        {
          name: '3.5e Ruleset Badge',
          action: 'Header Edition Badge / Switcher',
          detail: 'Shows active D&D 3.5e system tag. Switch active rulesets in the top menu bar.'
        },
        {
          name: 'Base Attack Bonus (BAB)',
          action: 'Header Vitals Bar',
          detail: 'In 3.5e, Base Attack Bonus (BAB) replaces Proficiency Bonus and scales based on class progression (Full, 3/4, or 1/2 BAB).'
        },
        {
          name: 'DM Active Presence & Unlocked Player Selection',
          action: '👑 DM Active Indicator',
          detail: 'DM active presence on a character sheet displays a live crown badge but does NOT lock player selection. Players can select and play characters concurrently with the DM.'
        },
        {
          name: 'Audio & Sound Options Control',
          action: '🔊 Header / Main Menu / Dice Roller',
          detail: 'Adjust Master Volume (0-100%), toggle Master Mute, and preview all 12 procedural sound effects.'
        },
        {
          name: 'Custom Portrait & HP Calculation Mode',
          action: 'Character Creation / Sheet Edit',
          detail: 'Set custom portrait image URL. Choose between "Average HP", "Rolled HP" (simulating 5e HP calculator), or "Max Value HP" (max hit die per level).'
        },
        {
          name: 'Short & Long Rest in 3.5e',
          action: 'Rest Buttons next to Level',
          detail: 'Long Rest restores full Hit Points and prepares 3.5e daily spell slots and domain powers.'
        }
      ]
    },
    {
      id: 'sheet1-guide',
      title: 'Stats, 3.5e Saves & Skill Point Calculator',
      icon: ShieldAlert,
      color: 'text-rose-400',
      description: 'Ability Scores (Score Primary), Fort/Ref/Will Base Saves, and 30+ 3.5e Skill Ranks.',
      items: [
        {
          name: 'Ability Scores & Modifiers',
          action: 'Ability Card Grid',
          detail: 'Displays primary Score in big typography with Modifier below. Modifiers are calculated automatically: (Score - 10) / 2.'
        },
        {
          name: '3.5e Base Saving Throws',
          action: 'Fortitude, Reflex, Will Cards',
          detail: 'In 3.5e, saves are split into Fortitude (CON), Reflex (DEX), and Will (WIS). Total Save = Base Save + Ability Mod + Misc Mod.'
        },
        {
          name: '3.5e Skill Point Calculator',
          action: 'Top of Skills Panel',
          detail: 'Automatically calculates Available Skill Points based on Level 1 formula ((Base SP + INT Mod) × 4 + Human bonus) and subsequent levels. Tracks spent SP vs remaining SP.'
        },
        {
          name: 'Class Skill Checkboxes ("C" vs "X")',
          action: 'Checkbox next to each 3.5e skill',
          detail: 'Check box for Class Skill ("C", costs 1 SP per rank, max rank = Level + 3). Uncheck for Cross-Class Skill ("X", costs 2 SP per rank, max rank = (Level + 3) / 2).'
        },
        {
          name: '30+ D&D 3.5e Skills List',
          action: 'Skill Rows with Ranks & Misc Mod',
          detail: 'Includes 3.5e specific skills such as Appraise, Balance, Climb, Concentration, Craft, Diplomacy, Disable Device, Disguise, Escape Artist, Heal, Hide, Move Silently, Search, Spellcraft, Use Magic Device, and more.'
        }
      ]
    },
    {
      id: 'sheet2-guide',
      title: '3.5e Combat, Armor Classes & Attacks',
      icon: Crosshair,
      color: 'text-emerald-400',
      description: 'Touch AC, Flat-Footed AC, Grapple Checks, BAB, and Animated HP Orb.',
      items: [
        {
          name: 'Armor Class Trio (Standard, Touch, Flat-Footed)',
          action: 'Combat Sheet AC Cards',
          detail: 'Computes Standard AC (10 + Armor + Shield + DEX + Size), Touch AC (ignores armor/shield: 10 + DEX + Size + Deflection), and Flat-Footed AC (ignores DEX mod: 10 + Armor + Shield + Size + Natural + Deflection).'
        },
        {
          name: 'Grapple Check',
          action: 'Grapple Stat Box',
          detail: 'Calculated as BAB + STR Modifier + Size Modifier.'
        },
        {
          name: 'Hit Points & Animated Vitality Orb',
          action: 'HP Display Bar & Orb',
          detail: 'Dynamic color-coded HP text (Green 75-100%, Yellow 49-74%, Red <49%) with pulsing liquid orb next to HP buttons and in top header.'
        },
        {
          name: '3.5e Weapons & Attacks',
          action: 'Click "Atk Roll" or "Damage Roll"',
          detail: 'Weapon attacks roll d20 + BAB + STR/DEX modifier + Enhancement bonus.'
        },
        {
          name: '3.5e Combat Cheat Sheet',
          action: 'Accordion Panel',
          detail: 'Includes 3.5e rules for Full Attacks, Attacks of Opportunity, Flanking, Cover, Concealment, Charge, Feint, Trip, and Grapple.'
        }
      ]
    },
    {
      id: 'sheet3-guide',
      title: 'Gear & 3.5e Carrying Capacity',
      icon: Package,
      color: 'text-amber-300',
      description: 'Currency, 3.5e encumbrance thresholds (Light, Medium, Heavy), and Equipment.',
      items: [
        {
          name: 'Currency & Coin Weight',
          action: 'CP, SP, GP, PP Inputs',
          detail: 'Track coins with gold piece conversion values. Includes coin weight calculations.'
        },
        {
          name: '3.5e Carrying Capacity Loads',
          action: 'Encumbrance Progress Bar',
          detail: 'Tracks Light Load (no penalty), Medium Load (Max DEX +3, -3 check penalty, 20ft speed), and Heavy Load (Max DEX +1, -6 check penalty, 20ft speed) based on 3.5e Strength tables.'
        },
        {
          name: 'Merchant / Vendor Trade Margin',
          action: 'Toggle Merchant Mode',
          detail: 'Allows calculating custom sell/buy profit margins for merchant PCs or shopkeeper NPCs.'
        }
      ]
    },
    {
      id: 'sheet4-guide',
      title: '3.5e Spells & Spellcasting',
      icon: Wand2,
      color: 'text-purple-400',
      description: 'Spell Save DC (10 + Spell Level + Mod), 3.5e spell slots, and caster levels.',
      items: [
        {
          name: '3.5e Spell Save DC Formula',
          action: 'Casting Header',
          detail: 'Calculated as 10 + Spell Level + Ability Modifier (INT for Wizard, WIS for Cleric/Druid, CHA for Sorcerer/Bard).'
        },
        {
          name: '3.5e Daily Spell Slots & Bonus Spells',
          action: 'Spell Level Grid (0 to 9th)',
          detail: 'Track base daily spell slots and bonus slots earned from high ability scores.'
        },
        {
          name: 'Spellbook Manager & Casting',
          action: '"+ Add Spell" & "Cast / Roll"',
          detail: 'Manage prepared spells, track material components, and click to trigger spell attack rolls or saving throw DCs.'
        }
      ]
    },
    {
      id: 'sheet5-guide',
      title: 'Description, Alignment & Notes',
      icon: ScrollText,
      color: 'text-blue-400',
      description: '3.5e Alignment grid, Deity, Patron, Backstory, and Campaign Log.',
      items: [
        {
          name: 'Physical Demographics & Portrait',
          action: 'Appearance Section',
          detail: 'Record age, height, weight, deity/patron, and paste custom image hyperlink for character portrait.'
        },
        {
          name: '3.5e Alignment System',
          action: 'Alignment Selector',
          detail: 'Choose from 9 alignment combinations (Lawful Good to Chaotic Evil) relevant to paladin/cleric restrictions.'
        },
        {
          name: 'Backstory, Allies & Quest Log',
          action: 'Campaign Notes Textarea',
          detail: 'Log session notes, loot splitting agreements, monster information, and NPC contacts.'
        }
      ]
    },
    {
      id: 'dice-guide',
      title: 'Floating Interactive Dice Roller',
      icon: Dices,
      color: 'text-amber-500',
      description: 'Standard polyhedral dice floating toolbar and roll log history.',
      items: [
        {
          name: 'Polyhedral Dice Buttons',
          action: 'Floating Bar (d4, d6, d8, d10, d12, d20, d100)',
          detail: 'Click any die to roll instantly with custom count and modifiers.'
        },
        {
          name: 'Roll Log Drawer',
          action: 'Log Button',
          detail: 'View timestamped log of all recent rolls, complete with natural rolls and calculated total.'
        }
      ]
    }
  ];

  // Shadowrun TRPG Guide Data
  const guideSectionsShadowrun = [
    {
      id: 'sr-formulas',
      title: 'Shadowrun 5e Mechanics & Formulas',
      icon: Cpu,
      color: 'text-cyan-400',
      description: 'Dice Pools, Success Thresholds, Limits, Condition Monitors, and Wound Penalties in Shadowrun 5e.',
      items: [
        {
          name: 'Dice Pool Formula',
          action: 'Attribute Rating + Skill Rating',
          detail: 'When performing tests in Shadowrun, roll d6 dice equal to Attribute + Skill. Every 5 or 6 rolled counts as a Hit (Success).'
        },
        {
          name: 'Glitches & Critical Glitches',
          action: '>= 50% Ones Rolled',
          detail: 'If more than half the dice in your pool show 1s, a Glitch occurs. If you glitch with 0 hits, it becomes a Critical Glitch.'
        },
        {
          name: 'Physical Condition Monitor',
          action: '8 + Floor(BOD / 2) Boxes',
          detail: 'Tracks physical damage taken. Every 3 boxes filled imposes a -1 Wound Penalty to all test dice pools.'
        },
        {
          name: 'Stun Condition Monitor',
          action: '8 + Floor(WIL / 2) Boxes',
          detail: 'Tracks non-lethal stun/fatigue damage. When Stun boxes fill completely, character falls unconscious.'
        },
        {
          name: 'Overflow Boxes',
          action: 'Equal to Body Rating',
          detail: 'Physical damage beyond your Physical Monitor enters Overflow. If Overflow boxes fill, character dies.'
        },
        {
          name: 'Essence & Cyberware Limit',
          action: 'Max 6.00 Essence',
          detail: 'Starting Essence is 6.00. Installing cyberware/bioware reduces Essence. Essence Loss directly reduces Magic/Resonance ratings.'
        },
        {
          name: 'Armor & Damage Resistance',
          action: 'Body + Ballistic / Impact Armor',
          detail: 'Roll Body + Total Armor vs Attack AP (Armor Penetration) to reduce incoming damage net hits.'
        },
        {
          name: 'Nuyen (¥) & Karma',
          action: 'Street Capital & EXP',
          detail: 'Nuyen is spent on cyberware, vehicles, decks, and weapons. Karma is spent on raising attributes, skills, and Edge tests.'
        }
      ]
    },
    {
      id: 'sr-cyberware',
      title: 'Cyberware, Bioware & Matrix Decking',
      icon: Cpu,
      color: 'text-cyan-300',
      description: 'Essence tracking, Cyberware grades, Cyberdecks, and Matrix Firewall stats.',
      items: [
        {
          name: 'Cyberware Grade Multipliers',
          action: 'Standard (1.0x), Alpha (0.8x), Beta (0.7x), Delta (0.5x)',
          detail: 'Higher quality cyberware reduces Essence cost penalties. Deltaware cuts Essence cost in half.'
        },
        {
          name: 'Cyberdeck Matrix Stats',
          action: 'Device Rating, Data Processing, Firewall, Attack, Sleaze',
          detail: 'Deckers assign attribute arrays to configure cyberdeck security for hacking and Overwatch score management.'
        },
        {
          name: 'Positive & Negative Qualities',
          action: 'Karma Cost / Gain',
          detail: 'Street qualities grant tactical bonuses (e.g. High Pain Tolerance) or grant bonus Karma during character generation.'
        }
      ]
    },
    {
      id: 'sr-combat',
      title: 'Shadowrun Combat & Rigging',
      icon: Crosshair,
      color: 'text-emerald-400',
      description: 'Initiative passes, recoil compensation, and vehicle/drone rigging.',
      items: [
        {
          name: 'Initiative Score',
          action: '(REA + INT) + Initiative Dice',
          detail: 'Roll 1d6 (or more with Wired Reflexes/Synaptic Booster). High initiative score grants extra Action Passes per combat turn.'
        },
        {
          name: 'Firearm Modes & Recoil',
          action: 'Single Shot (SS), Semi-Auto (SA), Burst Fire (BF), Full Auto (FA)',
          detail: 'Firing bursts increases damage and reduces target defense dice pools, but increases progressive Recoil.'
        },
        {
          name: 'Vehicles & Drones',
          action: 'Handling, Speed, Acceleration, Body, Armor, Sensor',
          detail: 'Riggers jump into drones using a Control Rig for bonus dice pools and lower response latency.'
        }
      ]
    }
  ];

  // Pathfinder 2e Guide Data
  const guideSectionsPathfinder = [
    {
      id: 'pf-formulas',
      title: 'Pathfinder 2e Mechanics & 3-Action System',
      icon: BookOpen,
      color: 'text-purple-400',
      description: '3-Action Turn, Proficiency Ranks, Four Degrees of Success, and Perception Checks.',
      items: [
        {
          name: '3-Action Economy',
          action: '3 Actions + 1 Reaction per turn',
          detail: 'In PF2e, characters receive 3 Actions to spend flexibly (Strike = 1 Action, Stride = 1 Action, Cast a Spell = 2 Actions).'
        },
        {
          name: 'Multiple Attack Penalty (MAP)',
          action: '1st: -0, 2nd: -5, 3rd: -10',
          detail: 'Subsequent attacks on the same turn suffer cumulative accuracy penalties (-5 on 2nd attack, -10 on 3rd attack).'
        },
        {
          name: 'Four Degrees of Success',
          action: 'Critical Success, Success, Failure, Critical Failure',
          detail: 'Beating a DC by 10+ results in a Critical Success. Missing a DC by 10 or more results in a Critical Failure.'
        }
      ]
    }
  ];

  // Call of Cthulhu Guide Data
  const guideSectionsCthulhu = [
    {
      id: 'coc-formulas',
      title: 'Call of Cthulhu 7e Mechanics & Sanity System',
      icon: Skull,
      color: 'text-emerald-400',
      description: 'd100 Skill Percentiles, Sanity Checks, Bouts of Madness, and Pushed Rolls.',
      items: [
        {
          name: 'd100 Percentile Skill Rolls',
          action: 'Roll <= Skill Percentage',
          detail: 'Roll 1d100. If the roll is less than or equal to your skill rating, the check succeeds. Half skill = Hard Success, Fifth skill = Extreme Success.'
        },
        {
          name: 'Sanity Loss & Bouts of Madness',
          action: 'SAN Check vs Mythos Horrors',
          detail: 'Losing 5+ SAN in a single encounter triggers temporary insanity and a Bout of Madness roll.'
        }
      ]
    }
  ];

  // Audio & Sound Engine Guide Data
  const guideSectionsAudio = [
    {
      id: 'audio-overview',
      title: 'Procedural Web Audio Engine & Sound Options',
      icon: Volume2,
      color: 'text-amber-400',
      description: 'Master volume slider, volume presets, sound effect triggers, and sound preferences.',
      items: [
        {
          name: 'Master Volume & Mute Controls',
          action: 'Header Sound Button / Main Menu',
          detail: 'Click the Sound Status indicator in the top header, Main Menu ("Sound Options"), or Floating Dice Roller ("Options") to open the Audio Options modal. Adjust master volume from 0% to 100% or toggle master mute.'
        },
        {
          name: '1-Click Volume Presets',
          action: 'Mute, 25%, 50%, 75%, Max 100%',
          detail: 'Quickly set master volume level using pre-configured volume preset buttons in the Audio Options modal.'
        },
        {
          name: '12 Procedural Synthesized Sound Effects',
          action: 'Interactive Live Sound Previews',
          detail: 'Features real-time Web Audio synthesis for 12 dynamic triggers: Dice Rolls, Weapon Hit, Critical Hit Chime, Miss/Parry Whoosh, Fire Roar, Cold Shimmer, Lightning Thunder, Acid Sizzle, Healing Arpeggio, Spell Cast, Level Up Fanfare, and Death Bell.'
        },
        {
          name: 'Integrated WebRTC Party Voice Client',
          action: 'Top Header "Party Voice" / Bottom Floating Bar',
          detail: 'Peer-to-peer live voice chat integrated into multiplayer sessions or custom room codes (#PARTY1). Features push-to-talk keybinds, microphone mute, audio deafen, speaker pulse animations, and per-adventurer volume control sliders.'
        },
        {
          name: 'Non-Overlapping Bottom-Left Voice Bar',
          action: 'Floating Dock & Header Toggle',
          detail: 'Positioned on the bottom-left of the screen so it never overlaps the bottom-right Dice Tray button. Includes a close/dismiss (X) button and header bar shortcut for quick access.'
        },
        {
          name: 'Persistent Sound Storage',
          action: 'Browser Local Storage',
          detail: 'Volume settings and mute toggles are saved automatically in your browser and restored across sessions.'
        }
      ]
    }
  ];

  // Complete App User Manual Data
  const guideSectionsManual = [
    {
      id: 'manual-start',
      title: '🚀 Getting Started & Guest Mode',
      icon: UserPlus,
      color: 'text-amber-400',
      description: 'Account management, Guest Mode, Cloud Synchronization, and character backups.',
      items: [
        {
          name: 'Guest Adventurer Mode',
          action: 'Instant Access Without Registration',
          detail: 'Create, inspect, and roll on character sheets stored in browser local storage. No registration is required to access full sheet functionality.'
        },
        {
          name: 'Firebase Account & Cloud Sync',
          action: 'Persistent Cross-Device Sync',
          detail: 'Sign in via Google or Email to sync character sheets across desktop, tablet, and mobile devices in real time via Firebase Firestore.'
        },
        {
          name: 'Multi-Character & NPC Switcher',
          action: 'Header Character Dropdown',
          detail: 'Switch instantly between stored Player Characters, DM Encounter Monsters, and Town Shopkeepers / Merchants with custom vendor margins.'
        },
        {
          name: 'JSON Export & Import',
          action: 'Options Modal (⚙️) → Character',
          detail: 'Export character sheets as .json backup files or import existing sheet backups into your local or cloud storage.'
        }
      ]
    },
    {
      id: 'manual-systems',
      title: '⚔️ Rule Systems & Multi-Edition Engines',
      icon: Layers,
      color: 'text-emerald-400',
      description: 'Native rulesets: D&D 5e, D&D 3.5e, Shadowrun 5e, Pathfinder 2e, Call of Cthulhu 7e, and Custom TRPGs.',
      items: [
        {
          name: 'D&D 5th Edition (5e)',
          action: 'Core 5e Ruleset',
          detail: 'Proficiency Bonus scaling (+2 to +6), Advantage/Disadvantage toggles, 18 skill checks, Passive Perception, Concentration tracking, Pact Magic, and 20 preset spells.'
        },
        {
          name: 'D&D 3.5 Edition (3.5e)',
          action: 'v3.5 Core Ruleset',
          detail: 'Base Attack Bonus (BAB) progression (+6/+1 iterative attacks), Fortitude/Reflex/Will base save tables, Touch AC, Flat-Footed AC, Skill Points Calculator with Class/Cross-Class caps, Caster Level, Damage Reduction (DR), and Spell Resistance (SR).'
        },
        {
          name: 'Shadowrun 5e (Cyberpunk)',
          action: 'd6 Dice Pool Engine',
          detail: 'Dice pools (Attribute + Skill), Hit threshold (5s and 6s), Glitches, Physical/Stun condition monitors with wound penalties, Cyberware Essence limits (Max 6.00), Cyberdeck Matrix stats, Nuyen (¥), and Karma.'
        },
        {
          name: 'Pathfinder 2e (PF2e)',
          action: '3-Action Turn Economy',
          detail: '3-Action economy, Multiple Attack Penalty (MAP: -0, -5, -10), Four Degrees of Success (Critical Success, Success, Failure, Critical Failure), and Proficiency Ranks.'
        },
        {
          name: 'Call of Cthulhu 7e (Horror)',
          action: 'd100 Percentile System',
          detail: 'd100 percentile skill checks, Sanity Points (SAN = WIS × 5), Bouts of Madness tracking, and Pushed Rolls.'
        },
        {
          name: 'Custom TRPG Ruleset Creator',
          action: 'System Selector Modal',
          detail: 'Configure enabled systems or build modular custom TRPG rulesets with unique attribute keys, dice pool algorithms, and sheet layouts.'
        }
      ]
    },
    {
      id: 'manual-sheets',
      title: '📊 Character Sheet Views (Sheets 1–7 & DM View)',
      icon: ScrollText,
      color: 'text-purple-400',
      description: 'Comprehensive overview of all 7 character sheet tabs and the DM Campaign Dashboard.',
      items: [
        {
          name: 'Sheet 1: Stats, Saves, Skills & Feats',
          action: 'Primary Ability Scores & Modifiers',
          detail: 'Primary scores with calculated modifiers below. Toggle Save proficiencies and Skill proficiencies/expertise. Add Class Features, Feats with Max HP grants, Hybrid Heritage ancestry, or Supernatural Species Transformations.'
        },
        {
          name: 'Sheet 2: Combat & Vitality',
          action: 'HP Orb, Target AC Resolver & Death Saves',
          detail: 'Track HP with animated liquid HP Orb, Temp HP, and Max HP Inspector. Features Target AC Attack Resolver, Weapon attack & damage rolls, Bonus Actions, Reactions, Conditions, Exhaustion Levels 1-6, Death Saves (3 successes/failures), Permanent Death mechanics, and Revive spell restoration.'
        },
        {
          name: 'Sheet 3: Gear, Wealth & Encumbrance',
          action: 'Currency Pouch & Carrying Capacity',
          detail: 'Track CP, SP, EP, GP, PP with auto gold conversion. Manage item quantities, weights, encumbrance capacity bar (STR × 15 lbs), 3 Attunement slots, Damage Reduction (DR), and custom item properties.'
        },
        {
          name: 'Sheet 4: Spells & Spellcasting',
          action: 'Spell Matrix & Preset Spells',
          detail: 'Select Casting Ability (INT, WIS, CHA) to calculate Save DC and Attack Bonus. Track 1st–9th level spell slots and Pact Magic slots. Features 20 official 5e preset spells, concentration tracker, ritual tag, unique duplicate spellbook protection, and level sorting.'
        },
        {
          name: 'Sheet 5: Description & Notes',
          action: 'Demographics & Rich Text Notes',
          detail: 'Record age, height, weight, eyes, hair, deity/patron, and character portrait URL. Log personality traits, ideals, bonds, flaws, alignment matrix, backstory, and session notes with formatted rich text.'
        },
        {
          name: 'Sheet 6: Rules Reference & User Manual',
          action: 'Formulas, Rulesets & Audio',
          detail: 'Interactive reference featuring mathematical formula breakdowns, system ruleset guides, Web Audio sound sandbox, version changelogs, and live manual search.'
        },
        {
          name: 'Sheet 7: SRD Compendium',
          action: 'Searchable Database & Quick Import',
          detail: 'Searchable compendium database of Spells, Equipment, Magic Items, Feats, and Monsters with 1-click import into your active character sheet.'
        },
        {
          name: 'Sheet DM: DM Campaign Dashboard',
          action: 'Party HP Pool & Encounter XP',
          detail: 'Dungeon Master dashboard displaying total party HP pool, average passive perception, monster encounter XP award calculator, party loot distribution, and real-time party roll log.'
        }
      ]
    },
    {
      id: 'manual-multiplayer',
      title: '👥 Multiplayer Live Sessions & Party Management',
      icon: Users,
      color: 'text-indigo-400',
      description: 'Firebase Firestore live session rooms, party grouping, and DM controls.',
      items: [
        {
          name: 'Session Lobby & 6-Character Room Codes',
          action: 'Header "Session Lobby" Button',
          detail: 'Create a live multiplayer session room or join an existing session using a 6-character room code. Changes to HP, combat rolls, and inventory sync in real time across players.'
        },
        {
          name: 'Party Manager',
          action: 'Header "Parties" Button',
          detail: 'Group player characters and allies into adventuring parties. Inspect total party HP, average level, average passive perception, and import entire parties into combat encounters.'
        },
        {
          name: 'DM Active Crown Indicator',
          action: 'Header Crown Badge',
          detail: 'Displays a purple Crown badge whenever a Dungeon Master is actively supervising or viewing a sheet. Player access remains unlocked while DM is viewing.'
        },
        {
          name: 'Integrated WebRTC Voice Channels',
          action: 'Header "Party Voice" / Voice Widget',
          detail: 'Connect instantly to party voice channels linked to your session code or custom room codes with real-time peer-to-peer audio and signaling.'
        }
      ]
    },
    {
      id: 'manual-extensions',
      title: '🔌 Extension Marketplace & Custom Plugins',
      icon: ShoppingBag,
      color: 'text-cyan-400',
      description: 'Plugin manifests, Marketplace extensions, Central Event Bus, and Developer SDK.',
      items: [
        {
          name: 'Plugin Manifest Schema (plugin/manifest.json)',
          action: 'Standardized Plugin Spec',
          detail: 'Full support for plugin manifest metadata including name, version, author, dependencies, app compatibility requirements, and permission declarations.'
        },
        {
          name: 'Extension Marketplace Catalog',
          action: 'Extension Manager Modal (🧩)',
          detail: 'Install curated extensions: Pathfinder 2e Tactical Engine, Cyberpunk Netrunner Suite, Shadowrun Matrix, Call of Cthulhu Sanity, 3D Dice Physics, Soundscape Synthesizer, and Homebrew Creator.'
        },
        {
          name: 'Central Event Bus & Developer SDK',
          action: 'Architecture & SDK Specs Tab',
          detail: 'Inspect live system events (DICE_ROLLED, HP_CHANGED, SPELL_CAST), test event payloads, and access complete TypeScript SDK specifications for custom plugin development.'
        }
      ]
    },
    {
      id: 'manual-companions',
      title: '🐾 Companions & Transformation Manager',
      icon: Dog,
      color: 'text-amber-300',
      description: 'Track familiars, pets, mounts, Wild Shape forms, and polymorph transformations.',
      items: [
        {
          name: 'Companion Manager Modal',
          action: 'Companion Modal Button',
          detail: 'Add pets, familiars, mounts, homunculi, or summoned creatures with separate HP, AC, attacks, and special abilities.'
        },
        {
          name: 'Supernatural Transformations & Wild Shape',
          action: 'Transformation Modal',
          detail: 'Transform into Beast forms (Wild Shape for Druids), Polymorph targets, Lycanthropes, Vampires, or Liches. Automatically overrides physical stats and grants temporary HP.'
        },
        {
          name: 'Reversion & Overflow Damage on 0 HP',
          action: 'Automated Form Health Guard',
          detail: 'When a transformed form drops to 0 HP, the character automatically reverts to their original form, and leftover overflow damage is applied directly to base HP.'
        }
      ]
    },
    {
      id: 'manual-dice-audio',
      title: '🎲 Floating Dice Roller & Sound Synthesizer',
      icon: Dices,
      color: 'text-rose-400',
      description: 'Polyhedral dice toolbar, formula expressions, and Web Audio sound synthesis.',
      items: [
        {
          name: 'Polyhedral Floating Dice Bar',
          action: 'Bottom Dice Toolbar',
          detail: '1-click access to d4, d6, d8, d10, d12, d20, and d100 with multiplier and modifier inputs.'
        },
        {
          name: 'Advantage & Disadvantage Rolling',
          action: 'ADV / DIS Toggle Buttons',
          detail: 'Roll 2d20 and automatically take the higher result (ADV) or lower result (DIS).'
        },
        {
          name: 'Custom Formula Expression Parser',
          action: 'Formula Input Field',
          detail: 'Roll complex expressions like 2d6+4, 1d20+7, or 4d6kh3 directly in the custom formula input.'
        },
        {
          name: '12 Procedural Web Audio Sound FX',
          action: 'Audio Options Modal',
          detail: 'Real-time sound synthesis for dice rolls, weapon strikes, critical hits, spell casts, healing chimes, level up fanfares, and death save bells with volume presets.'
        }
      ]
    },
    {
      id: 'manual-tools',
      title: '⚡ Power Tools & Keyboard Shortcuts',
      icon: Zap,
      color: 'text-amber-400',
      description: 'Command Palette (Ctrl+K), Theme Engine, and quick header health adjustments.',
      items: [
        {
          name: 'Command Palette (Ctrl+K / Cmd+K)',
          action: 'Global Search Shortcut',
          detail: 'Press Ctrl+K (or Cmd+K) to open the Command Palette and jump instantly to any sheet, modal, or action.'
        },
        {
          name: 'Workspace Customizer & Themes',
          action: 'Options Modal (⚙️) → Workspace',
          detail: 'Switch between Parchment Classic, Dark Obsidian, Emerald Glade, Royal Velvet, Cyberpunk Neon, or Blood Moon visual themes.'
        },
        {
          name: 'Quick Health Delta Adjustments',
          action: 'Header Health Controls',
          detail: 'Adjust HP instantly using header quick buttons (-10, -1, +1, +10) or type exact values into the HP delta input.'
        }
      ]
    }
  ];

  // App Release Notes & Version History Changelog Data imported from src/data/changelogData.ts

  const currentGuideSections = guideEdition === 'manual'
    ? guideSectionsManual
    : guideEdition === 'shadowrun'
    ? guideSectionsShadowrun
    : guideEdition === 'pathfinder'
    ? guideSectionsPathfinder
    : guideEdition === 'cthulhu'
    ? guideSectionsCthulhu
    : guideEdition === 'audio'
    ? guideSectionsAudio
    : guideEdition === '3.5e'
    ? guideSections35e
    : guideSections5e;

  const filteredSections = currentGuideSections.map(section => {
    if (!searchQuery.trim()) return section;
    const query = searchQuery.toLowerCase();
    const matchingItems = section.items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.action.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query)
    );
    const titleMatches = section.title.toLowerCase().includes(query) || section.description.toLowerCase().includes(query);

    if (titleMatches || matchingItems.length > 0) {
      return {
        ...section,
        items: titleMatches ? section.items : matchingItems
      };
    }
    return null;
  }).filter(Boolean);

  const filteredChangelog = changelogData.filter(entry => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.version.toLowerCase().includes(query) ||
      entry.title.toLowerCase().includes(query) ||
      entry.date.toLowerCase().includes(query) ||
      entry.highlights.some(
        h => h.category.toLowerCase().includes(query) || h.detail.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Banner Intro & Edition Switcher */}
      <div className="bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border border-amber-600/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 text-amber-500" />
        </div>

        <div className="flex flex-col gap-4 relative z-10 border-b border-amber-900/40 pb-6">
          <div className="space-y-2 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Edition-Specific User Manual
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100">
              {guideEdition === 'shadowrun'
                ? 'Shadowrun Cyberpunk Guide'
                : guideEdition === 'pathfinder'
                ? 'Pathfinder 2e System Guide'
                : guideEdition === 'cthulhu'
                ? 'Call of Cthulhu 7e Horror Guide'
                : guideEdition === 'audio'
                ? 'Procedural Web Audio Engine & Sound Options'
                : guideEdition === 'changelog'
                ? 'Application Release Notes & Version History'
                : guideEdition === '3.5e'
                ? 'D&D 3.5 Edition (3.5e) Guide'
                : 'D&D 5th Edition (5e) Guide'}
            </h2>
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed">
              {guideEdition === 'shadowrun'
                ? 'Complete manual for Shadowrun mechanics: Dice pools, Success hits, Cyberware & Essence limits, Matrix hacking, Physical/Stun condition monitors, Nuyen (¥), and Karma.'
                : guideEdition === 'pathfinder'
                ? 'Complete manual for Pathfinder 2e mechanics: 3-Action turn economy, Multiple Attack Penalty (MAP), and Four Degrees of Success.'
                : guideEdition === 'cthulhu'
                ? 'Complete manual for Call of Cthulhu 7e mechanics: d100 percentile skills, Sanity points (SAN), Bouts of Madness, and Eldritch horror tracking.'
                : guideEdition === 'audio'
                ? 'Comprehensive guide to the built-in procedural Web Audio synthesizer, master volume slider, volume presets, sound effect triggers, and sound preferences.'
                : guideEdition === 'changelog'
                ? 'Complete version history log of features, enhancements, bug fixes, system expansions, and UI updates.'
                : guideEdition === '3.5e'
                ? 'Complete manual for D&D 3.5e mechanics: Base Attack Bonus (BAB), Touch AC, Flat-Footed AC, Fort/Ref/Will Base Saves, 3.5e Skill Point Calculator, and Class Skill checkboxes.'
                : 'Complete manual for D&D 5e mechanics: Proficiency bonus, 18 skills, Advantage/Disadvantage, death saves, spell slots, and character management.'}
            </p>
          </div>

          {/* Edition & View Selection Toggle Tabs */}
          <div className="bg-stone-950/90 p-1.5 rounded-2xl border border-amber-600/40 flex items-center gap-1.5 w-full max-w-full overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent shadow-lg pr-4">
            <button
              onClick={() => setGuideEdition('manual')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                guideEdition === 'manual'
                  ? 'bg-emerald-600 text-stone-950 shadow-md ring-1 ring-emerald-300 font-extrabold'
                  : 'text-stone-300 hover:text-emerald-300 hover:bg-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>User Manual</span>
            </button>
            {systemRegistry.getAllSystems().filter(sys => !enabledSystems || enabledSystems.includes(sys.id)).map((sys) => (
              <button
                key={sys.id}
                onClick={() => setGuideEdition(sys.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  guideEdition === sys.id
                    ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-400'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <span>{sys.icon}</span>
                <span>{sys.shortName}</span>
              </button>
            ))}
            <button
              onClick={() => setGuideEdition('audio')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                guideEdition === 'audio'
                  ? 'bg-amber-500 text-stone-950 shadow-md ring-1 ring-amber-300'
                  : 'text-stone-400 hover:text-amber-300 hover:bg-stone-900'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Audio & Sound</span>
            </button>
            <button
              onClick={() => setGuideEdition('changelog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                guideEdition === 'changelog'
                  ? 'bg-amber-600 text-stone-950 shadow-md ring-1 ring-amber-300 font-extrabold'
                  : 'text-stone-300 hover:text-amber-300 hover:bg-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Changelog</span>
            </button>
            <div className="w-8 shrink-0 h-1" />
          </div>
        </div>

        {/* Search Bar & Quick Section Filter */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  guideEdition === 'changelog'
                    ? 'Search release notes (e.g. v0.9.0, DM, audio)...'
                    : `Search ${guideEdition} functions (e.g. roll, volume, skill, hp)...`
                }
                className="w-full bg-stone-950/90 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-400 hover:text-amber-300 transition self-start sm:self-center"
              >
                Clear Search
              </button>
            )}
          </div>

          {guideEdition !== 'changelog' && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <button
                onClick={() => setActiveSection('all')}
                className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                  activeSection === 'all'
                    ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold shadow-md'
                    : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                All Sections
              </button>
              {currentGuideSections.map((sec) => {
                let shortTitle = sec.title.replace(' (5e)', '').replace(' (3.5e)', '');
                if (sec.id.startsWith('formulas')) shortTitle = '📐 Formulas Breakdown';
                if (sec.id === 'header-mgmt') shortTitle = 'Header & Management';
                if (sec.id === 'sheet1-guide') shortTitle = 'Stats & Skills';
                if (sec.id === 'sheet2-guide') shortTitle = 'Combat & Actions';
                if (sec.id === 'sheet3-guide') shortTitle = 'Gear & Wealth';
                if (sec.id === 'sheet4-guide') shortTitle = 'Spells & Casting';
                if (sec.id === 'sheet5-guide') shortTitle = 'Description & Notes';
                if (sec.id === 'dice-guide') shortTitle = 'Dice Roller';
                if (sec.id === 'audio-overview') shortTitle = '🔊 Audio & Sound';

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
                      activeSection === sec.id
                        ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold shadow-md'
                        : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    {shortTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Changelog View vs Standard Functions Grid */}
      {guideEdition === 'changelog' ? (
        <div className="space-y-6">
          {filteredChangelog.map((entry) => (
            <div
              key={entry.version}
              className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-amber-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif font-bold text-amber-200">
                        {entry.version}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${entry.badgeColor}`}>
                        {entry.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 font-medium mt-0.5">{entry.title}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-stone-400 bg-stone-950 px-3 py-1 rounded-lg border border-stone-800 self-start sm:self-auto">
                  {entry.date}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {entry.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-1 hover:border-amber-600/40 transition"
                  >
                    <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{item.category}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed pl-5">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredChangelog.length === 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400 space-y-2">
              <HelpCircle className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-sm font-bold text-stone-300">No matching release notes found</p>
              <p className="text-xs">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => {
            if (!section) return null;
            if (activeSection !== 'all' && activeSection !== section.id) return null;

            const IconComponent = section.icon;

            return (
              <div
                key={section.id}
                className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl">
                      <IconComponent className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-amber-200">
                        {section.title}
                      </h3>
                      <p className="text-xs text-stone-400">{section.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-2 py-1 rounded border border-stone-800">
                    {section.items.length} Functions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-1.5 hover:border-amber-600/40 transition group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif font-bold text-stone-100 text-xs group-hover:text-amber-300 transition">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-stone-900 border border-stone-800 text-amber-400 rounded-full">
                          {item.action}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400 space-y-2">
              <HelpCircle className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-sm font-bold text-stone-300">No matching functions found for {guideEdition}</p>
              <p className="text-xs">Try adjusting your search term or switch guide edition.</p>
            </div>
          )}
        </div>
      )}

      {/* Quick FAQ / Tips Box */}
      <div className="bg-stone-900/70 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-base font-serif font-bold text-amber-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Pro Tips for {guideEdition === 'changelog' ? 'TRPG Players' : guideEdition}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-200">💾 Automatic Local Persistence</div>
            <p className="text-stone-400 text-[11px]">
              Every edit, roll history, custom attack, portrait link, audio preference, and spell adjustment is automatically saved to your browser.
            </p>
          </div>
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-200">🎲 Interactive Roll Triggers</div>
            <p className="text-stone-400 text-[11px]">
              Click any d20 icon across Stats, Skills, Attacks, and Spells to trigger instant interactive rolls logged to your dice tray with audio feedback.
            </p>
          </div>
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-200">👑 Concurrent DM & Player Access</div>
            <p className="text-stone-400 text-[11px]">
              Dungeon Masters and Players can view and edit character sheets concurrently without locking each other out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
