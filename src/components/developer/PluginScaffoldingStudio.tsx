import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  FileCode, 
  BookOpen, 
  RefreshCw,
  Zap,
  Sliders,
  Box,
  Compass,
  Cpu,
  Flame,
  Swords
} from 'lucide-react';
import { systemRegistry } from '../../systems/registry';
import { GameSystemPlugin } from '../../systems/types';
import { RuleEdition, AbilityName, CharacterData } from '../../types';
import { eventBus } from '../../events/eventBus';

interface PluginTemplatePreset {
  id: string;
  name: string;
  category: 'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal';
  description: string;
  icon: string;
  badgeColor: string;
  primaryResource: string;
  rollModelKind: 'd20' | 'dicePool' | 'percentile';
  initiativeFormula: string;
  classes: string[];
  races: string[];
  primaryAttributes: string[];
}

const TEMPLATE_PRESETS: PluginTemplatePreset[] = [
  {
    id: 'd20-heroic',
    name: 'Heroic d20 Fantasy',
    category: 'fantasy',
    description: 'Classic d20 resolution system with proficiency scaling, spell slots, and ability modifiers.',
    icon: '🐉',
    badgeColor: 'bg-amber-600',
    primaryResource: 'Spell Slots',
    rollModelKind: 'd20',
    initiativeFormula: '1d20+DEX',
    classes: ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Paladin'],
    races: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc', 'Tiefling'],
    primaryAttributes: ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']
  },
  {
    id: 'cyber-dicepool',
    name: 'Cyberpunk D6 Dice Pool',
    category: 'cyberpunk',
    description: 'Attribute + Skill D6 dice pool system with hit threshold (5-6) and glitch mechanics.',
    icon: '⚡',
    badgeColor: 'bg-cyan-600',
    primaryResource: 'Edge Points',
    rollModelKind: 'dicePool',
    initiativeFormula: '(INT+REA)+1d6',
    classes: ['Street Samurai', 'Decker', 'Rigger', 'Mage', 'Face', 'Infiltrator'],
    races: ['Human', 'Elf', 'Dwarf', 'Ork', 'Troll'],
    primaryAttributes: ['Body', 'Agility', 'Reaction', 'Strength', 'Willpower', 'Logic', 'Intuition', 'Charisma']
  },
  {
    id: 'cosmic-percentile',
    name: 'Eldritch d100 Percentile',
    category: 'horror',
    description: 'Roll-under percentile system (1-100) with Sanity checks, Hard (1/2) and Extreme (1/5) thresholds.',
    icon: '🐙',
    badgeColor: 'bg-emerald-700',
    primaryResource: 'Sanity',
    rollModelKind: 'percentile',
    initiativeFormula: 'DEX',
    classes: ['Investigator', 'Doctor', 'Professor', 'Journalist', 'Antiquarian', 'Detective'],
    races: ['Human (Standard)', 'Occultist', 'Hardened Veteran'],
    primaryAttributes: ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU']
  },
  {
    id: 'pbta-2d6',
    name: 'Narrative 2d6 (PbtA)',
    category: 'universal',
    description: 'Narrative 2d6 moves: 10+ Full Success, 7-9 Partial Success / Complication, 6- Miss.',
    icon: '🎲',
    badgeColor: 'bg-purple-600',
    primaryResource: 'Hold / Momentum',
    rollModelKind: 'd20',
    initiativeFormula: '2d6',
    classes: ['The Chosen', 'The Expert', 'The Flake', 'The Mundane', 'The Spooky'],
    races: ['Human', 'Awakened', 'Construct'],
    primaryAttributes: ['Charm', 'Cool', 'Sharp', 'Tough', 'Weird']
  }
];

export const PluginScaffoldingStudio: React.FC = () => {
  // Form State
  const [pluginId, setPluginId] = useState('custom-valoria');
  const [pluginName, setPluginName] = useState('Valoria: Chronicles of Aethelgard');
  const [shortName, setShortName] = useState('Valoria 1e');
  const [version, setVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('Guild Master');
  const [category, setCategory] = useState<'fantasy' | 'cyberpunk' | 'horror' | 'tactical' | 'universal'>('fantasy');
  const [description, setDescription] = useState('A high-fantasy TRPG system emphasizing tactical grit and arcane resonance.');
  const [badgeColor, setBadgeColor] = useState('bg-amber-600');
  const [icon, setIcon] = useState('⚔️');
  const [primaryResource, setPrimaryResource] = useState('Mana Points');
  const [rollModelKind, setRollModelKind] = useState<'d20' | 'dicePool' | 'percentile'>('d20');
  const [initiativeFormula, setInitiativeFormula] = useState('1d20+DEX');
  const [hasSpellcasting, setHasSpellcasting] = useState(true);
  const [supportsSanity, setSupportsSanity] = useState(false);
  const [supportsConditionMonitors, setSupportsConditionMonitors] = useState(false);

  // Lists
  const [classesInput, setClassesInput] = useState('Knight, Elementalist, Rogue, Cleric, Spellblade');
  const [racesInput, setRacesInput] = useState('Human, High Elf, Mountain Dwarf, Sylph, Dragonborn');
  const [attributesInput, setAttributesInput] = useState('Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma');

  // UI state
  const [activeCodeTab, setActiveCodeTab] = useState<'plugin' | 'manifest' | 'cli'>('plugin');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [installedCustomPlugins, setInstalledCustomPlugins] = useState<GameSystemPlugin[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load installed custom plugins on mount
  useEffect(() => {
    refreshInstalledPlugins();
  }, []);

  const refreshInstalledPlugins = () => {
    const customList = systemRegistry.getSavedCustomPlugins();
    setInstalledCustomPlugins(customList);
  };

  const handleApplyPreset = (preset: PluginTemplatePreset) => {
    setPluginId(preset.id + '-' + Math.floor(Math.random() * 899 + 100));
    setPluginName(preset.name + ' Edition');
    setShortName(preset.name.split(' ')[0]);
    setCategory(preset.category);
    setDescription(preset.description);
    setBadgeColor(preset.badgeColor);
    setIcon(preset.icon);
    setPrimaryResource(preset.primaryResource);
    setRollModelKind(preset.rollModelKind);
    setInitiativeFormula(preset.initiativeFormula);
    setClassesInput(preset.classes.join(', '));
    setRacesInput(preset.races.join(', '));
    setAttributesInput(preset.primaryAttributes.join(', '));
    setSupportsSanity(preset.category === 'horror');
    setSupportsConditionMonitors(preset.category === 'cyberpunk');
    setFeedbackMessage({ type: 'success', text: `Loaded template: ${preset.name}` });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Build the live GameSystemPlugin object
  const buildLivePlugin = (): GameSystemPlugin => {
    const classes = classesInput.split(',').map(s => s.trim()).filter(Boolean);
    const races = racesInput.split(',').map(s => s.trim()).filter(Boolean);
    const primaryAttributes = attributesInput.split(',').map(s => s.trim()).filter(Boolean);

    const safeId = (pluginId.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'custom-sys') as RuleEdition;

    return {
      id: safeId,
      name: pluginName || 'Custom System',
      shortName: shortName || 'Custom',
      description: description || 'Custom TRPG rule system created with Nexus Scaffolding Studio.',
      badgeColor: badgeColor || 'bg-amber-600',
      icon: icon || '🎲',
      primaryResourceName: primaryResource || 'Points',
      version: version || '1.0.0',
      author: author || 'Community Developer',
      category,
      thirdParty: true,
      supportedFeatures: [
        'Custom Character Engine',
        'Combat Engine',
        'Spell Engine',
        'Universal Importer',
        'Search Indexer'
      ],
      characterEngine: {
        getDefaultAbilities: () => {
          const abils: Record<AbilityName, { score: number; overrideBonus?: number }> = {
            STR: { score: 10 },
            DEX: { score: 10 },
            CON: { score: 10 },
            INT: { score: 10 },
            WIS: { score: 10 },
            CHA: { score: 10 }
          };
          return abils;
        },
        calculateStats: (char: CharacterData) => {
          const conScore = char.abilities?.CON?.score || 10;
          const dexScore = char.abilities?.DEX?.score || 10;
          const conMod = Math.floor((conScore - 10) / 2);
          const dexMod = Math.floor((dexScore - 10) / 2);
          const lvl = char.level || 1;
          const maxHp = char.hpMax || Math.max(6, 10 + conMod + (lvl - 1) * (6 + conMod));

          return {
            maxHp,
            armorClass: 10 + dexMod,
            initiativeBonus: dexMod,
            speed: 30,
            passivePerception: 10 + Math.floor(((char.abilities?.WIS?.score || 10) - 10) / 2),
            secondaryResourceLabel: primaryResource,
            secondaryResourceVal: char.spellSlots?.[1]?.current ?? 10,
            secondaryResourceMax: char.spellSlots?.[1]?.max ?? 10
          };
        },
        getProficiencyBonus: (lvl: number) => Math.floor((lvl - 1) / 4) + 2,
        getAbilityModifier: (score: number) => Math.floor((score - 10) / 2)
      },
      combatEngine: {
        getInitiativeFormula: () => initiativeFormula || '1d20+DEX',
        getAttackBonus: (_itemOrAttack, char) => {
          const strMod = Math.floor(((char.abilities?.STR?.score || 10) - 10) / 2);
          const prof = Math.floor(((char.level || 1) - 1) / 4) + 2;
          return strMod + prof;
        },
        getDamageFormula: () => '1d8+STR',
        getRollModel: () => {
          if (rollModelKind === 'dicePool') {
            return { kind: 'dicePool', diceCount: 6, successTarget: 5, glitchThreshold: 1 };
          }
          if (rollModelKind === 'percentile') {
            return { kind: 'percentile', targetPercentage: 50, hardTarget: 25, extremeTarget: 10 };
          }
          return { kind: 'd20', modifier: 5, formula: '1d20+5', targetType: 'AC' };
        },
        supportsSanityCheck: supportsSanity,
        supportsConditionMonitors: supportsConditionMonitors
      },
      spellEngine: {
        isSpellcaster: () => hasSpellcasting,
        getSpellSlotLabel: (lvl) => `Tier ${lvl} ${primaryResource}`,
        getSpellStatLabel: () => 'Arcane DC'
      },
      data: {
        classes,
        races,
        primaryAttributes,
        damageTypes: ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Arcane']
      }
    };
  };

  const handleRegisterCustomPlugin = () => {
    try {
      const plugin = buildLivePlugin();
      systemRegistry.registerAndSaveCustomPlugin(plugin);
      refreshInstalledPlugins();

      eventBus.emit('SystemPluginToggled', {
        pluginId: plugin.id,
        enabled: true,
        version: plugin.version,
        updated: true
      });

      setFeedbackMessage({
        type: 'success',
        text: `Successfully registered "${plugin.name}"! It is now active across the entire app.`
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (e: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Failed to register plugin: ${e?.message || 'Unknown error'}`
      });
    }
  };

  const handleUnregisterPlugin = (id: string) => {
    try {
      systemRegistry.unregisterCustomPlugin(id);
      refreshInstalledPlugins();
      setFeedbackMessage({
        type: 'success',
        text: `Unregistered custom plugin "${id}".`
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (e: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Failed to unregister plugin: ${e?.message}`
      });
    }
  };

  // Generate TypeScript code
  const generatedTsCode = `import { GameSystemPlugin } from '@nexus-trpg/sdk';
import { RuleEdition, CharacterData, AbilityName } from '@nexus-trpg/types';

export const ${pluginId.replace(/[^a-zA-Z0-9]/g, '')}Plugin: GameSystemPlugin = {
  id: '${pluginId}' as RuleEdition,
  name: '${pluginName.replace(/'/g, "\\'")}',
  shortName: '${shortName.replace(/'/g, "\\'")}',
  description: '${description.replace(/'/g, "\\'")}',
  badgeColor: '${badgeColor}',
  icon: '${icon}',
  primaryResourceName: '${primaryResource.replace(/'/g, "\\'")}',
  version: '${version}',
  author: '${author.replace(/'/g, "\\'")}',
  category: '${category}',
  thirdParty: true,

  characterEngine: {
    getDefaultAbilities: () => ({
      str: { score: 10 },
      dex: { score: 10 },
      con: { score: 10 },
      int: { score: 10 },
      wis: { score: 10 },
      cha: { score: 10 }
    }),
    calculateStats: (char: CharacterData) => {
      const conMod = Math.floor(((char.abilities?.con?.score || 10) - 10) / 2);
      const dexMod = Math.floor(((char.abilities?.dex?.score || 10) - 10) / 2);
      const lvl = char.level || 1;
      return {
        maxHp: char.hpMax || Math.max(6, 10 + conMod + (lvl - 1) * (6 + conMod)),
        armorClass: 10 + dexMod,
        initiativeBonus: dexMod,
        speed: 30,
        passivePerception: 10 + Math.floor(((char.abilities?.wis?.score || 10) - 10) / 2),
        secondaryResourceLabel: '${primaryResource}',
        secondaryResourceVal: 10,
        secondaryResourceMax: 10
      };
    },
    getProficiencyBonus: (lvl: number) => Math.floor((lvl - 1) / 4) + 2,
    getAbilityModifier: (score: number) => Math.floor((score - 10) / 2)
  },

  combatEngine: {
    getInitiativeFormula: () => '${initiativeFormula}',
    getAttackBonus: (_item, char) => {
      const strMod = Math.floor(((char.abilities?.str?.score || 10) - 10) / 2);
      const prof = Math.floor(((char.level || 1) - 1) / 4) + 2;
      return strMod + prof;
    },
    getDamageFormula: () => '1d8+STR',
    getRollModel: () => (${
      rollModelKind === 'dicePool'
        ? `{ kind: 'dicePool', diceCount: 6, successTarget: 5, glitchThreshold: 1 }`
        : rollModelKind === 'percentile'
        ? `{ kind: 'percentile', targetPercentage: 50, hardTarget: 25, extremeTarget: 10 }`
        : `{ kind: 'd20', modifier: 5, formula: '1d20+5', targetType: 'AC' }`
    }),
    supportsSanityCheck: ${supportsSanity},
    supportsConditionMonitors: ${supportsConditionMonitors}
  },

  spellEngine: {
    isSpellcaster: () => ${hasSpellcasting},
    getSpellSlotLabel: (lvl) => \`Tier \${lvl} ${primaryResource}\`,
    getSpellStatLabel: () => 'Arcane DC'
  },

  data: {
    classes: ${JSON.stringify(classesInput.split(',').map(s => s.trim()).filter(Boolean), null, 4)},
    races: ${JSON.stringify(racesInput.split(',').map(s => s.trim()).filter(Boolean), null, 4)},
    primaryAttributes: ${JSON.stringify(attributesInput.split(',').map(s => s.trim()).filter(Boolean), null, 4)},
    damageTypes: ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Arcane']
  }
};
`;

  // Generate Manifest JSON
  const generatedManifestJson = JSON.stringify(
    {
      $schema: 'https://nexus-trpg.app/schemas/plugin-manifest.v1.json',
      id: pluginId,
      name: pluginName,
      shortName: shortName,
      version: version,
      author: author,
      category: category,
      description: description,
      icon: icon,
      badgeColor: badgeColor,
      primaryResource: primaryResource,
      engine: {
        rollModel: rollModelKind,
        initiativeFormula: initiativeFormula,
        supportsSanity: supportsSanity,
        supportsConditionMonitors: supportsConditionMonitors,
        hasSpellcasting: hasSpellcasting
      },
      minPlatformVersion: '1.0.0',
      permissions: ['character:read', 'character:write', 'dice:roll', 'events:subscribe'],
      capabilities: [
        { id: 'character-engine', name: 'Custom Character Sheet', enabled: true },
        { id: 'combat-calculator', name: 'Combat & Roll Resolution', enabled: true },
        { id: 'spell-tracker', name: 'Resource & Spellcasting Meter', enabled: hasSpellcasting }
      ]
    },
    null,
    2
  );

  // Generate CLI Command
  const generatedCliCmd = `npm create @nexus-trpg/plugin@latest ${pluginId} \\
  --name="${pluginName}" \\
  --category="${category}" \\
  --rollModel="${rollModelKind}" \\
  --template=typescript`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-indigo-950/40 border border-amber-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-200 font-serif">
              Plugin SDK & Scaffolding Studio
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              TRPG Visual Engine Builder
            </span>
          </div>
          <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
            Visually design custom tabletop roleplaying game engines, test live roll mechanics, export production TypeScript SDK packages, and instantly register them into the live app runtime.
          </p>
        </div>

        <button
          onClick={handleRegisterCustomPlugin}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-xs font-serif shrink-0 ring-1 ring-amber-400/50"
        >
          <Play className="w-4 h-4 fill-stone-950" />
          <span>Register & Activate Live</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono animate-fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-stone-400 hover:text-stone-200 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Template Presets Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-300 font-serif flex items-center gap-1.5">
            <Box className="w-4 h-4 text-amber-400" />
            <span>1-Click System Archetype Templates</span>
          </label>
          <span className="text-[10px] text-stone-500 font-mono">Select a foundation to customize</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 transition text-left flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{preset.icon}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded text-stone-950 font-bold uppercase font-mono ${preset.badgeColor}`}>
                    {preset.category}
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-200 font-serif group-hover:text-amber-300 transition">
                  {preset.name}
                </div>
                <p className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>Model: {preset.rollModelKind}</span>
                <span className="text-amber-500 group-hover:underline flex items-center gap-0.5">
                  Load <Plus className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Form Builder & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 bg-stone-900/60 border border-stone-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h4 className="text-xs font-bold text-stone-200 font-serif flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Plugin Metadata & Rule Configurator</span>
            </h4>
            <span className="text-[10px] text-stone-500 font-mono">Real-time Reactive Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Plugin ID (Unique Key)</label>
              <input
                type="text"
                value={pluginId}
                onChange={(e) => setPluginId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="e.g. shadow-dark"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Display Name</label>
              <input
                type="text"
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                placeholder="e.g. Shadowdark RPG 1e"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Short Name / Tag</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. Shadowdark"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Version (SemVer)</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Author / Guild</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Arcane Forge"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="fantasy">Fantasy</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="horror">Cosmic Horror</option>
                <option value="tactical">Tactical / Sci-Fi</option>
                <option value="universal">Universal / Narrative</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Primary Resource</label>
              <input
                type="text"
                value={primaryResource}
                onChange={(e) => setPrimaryResource(e.target.value)}
                placeholder="e.g. Mana, Sanity, Edge"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">System Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. ⚔️, 🐉, ⚡"
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-stone-400 mb-1 block">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your TRPG system rules and atmosphere..."
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none resize-none font-sans"
            />
          </div>

          {/* Engine Mechanics Row */}
          <div className="pt-2 border-t border-stone-800 space-y-3">
            <h5 className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider">
              Combat & Dice Mechanics
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-stone-400 mb-1 block">Roll Resolution Model</label>
                <select
                  value={rollModelKind}
                  onChange={(e) => setRollModelKind(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none font-mono"
                >
                  <option value="d20">d20 + Mod vs Target AC/DC</option>
                  <option value="dicePool">D6 Dice Pool (Hits on 5-6)</option>
                  <option value="percentile">d100 Percentile (Roll Under)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-stone-400 mb-1 block">Initiative Formula</label>
                <input
                  type="text"
                  value={initiativeFormula}
                  onChange={(e) => setInitiativeFormula(e.target.value)}
                  placeholder="e.g. 1d20+DEX or (INT+REA)+1d6"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSpellcasting}
                  onChange={(e) => setHasSpellcasting(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Enable Magic / Spells Engine</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsSanity}
                  onChange={(e) => setSupportsSanity(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Sanity & Madness Checks</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsConditionMonitors}
                  onChange={(e) => setSupportsConditionMonitors(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>Wound / Condition Monitors</span>
              </label>
            </div>
          </div>

          {/* Classes, Races, Attributes */}
          <div className="pt-2 border-t border-stone-800 space-y-3">
            <h5 className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider">
              Data Catalog & Archetypes
            </h5>

            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Classes / Roles (Comma Separated)</label>
              <input
                type="text"
                value={classesInput}
                onChange={(e) => setClassesInput(e.target.value)}
                placeholder="Warrior, Mage, Rogue..."
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Races / Species / Lineages</label>
              <input
                type="text"
                value={racesInput}
                onChange={(e) => setRacesInput(e.target.value)}
                placeholder="Human, Elf, Dwarf..."
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-stone-400 mb-1 block">Primary Attributes</label>
              <input
                type="text"
                value={attributesInput}
                onChange={(e) => setAttributesInput(e.target.value)}
                placeholder="Strength, Dexterity, Constitution..."
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-sans focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Code Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col">
          {/* Live Card Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-600/30 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-xl shadow-inner border border-stone-700">
                  {icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm text-stone-100">{pluginName || 'Unnamed System'}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                      v{version}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                    <span>{author}</span>
                    <span>•</span>
                    <span className="capitalize">{category}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded text-stone-950 font-bold uppercase font-mono ${badgeColor}`}>
                {shortName || 'Custom'}
              </span>
            </div>

            <p className="text-xs text-stone-300 mt-3 font-sans line-clamp-2 leading-relaxed">
              {description}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-800 text-[10px] font-mono text-stone-400">
              <div>
                <span className="text-stone-500 block">Model:</span>
                <span className="text-amber-300 font-bold">{rollModelKind}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Initiative:</span>
                <span className="text-stone-300 truncate">{initiativeFormula}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Resource:</span>
                <span className="text-stone-300 truncate">{primaryResource}</span>
              </div>
            </div>
          </div>

          {/* Code Tabs */}
          <div className="flex-1 flex flex-col bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden min-h-[320px]">
            <div className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCodeTab('plugin')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                    activeCodeTab === 'plugin'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  plugin.ts
                </button>
                <button
                  onClick={() => setActiveCodeTab('manifest')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                    activeCodeTab === 'manifest'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  manifest.json
                </button>
                <button
                  onClick={() => setActiveCodeTab('cli')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition ${
                    activeCodeTab === 'cli'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  CLI Scaffolding
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const content = activeCodeTab === 'plugin' ? generatedTsCode : activeCodeTab === 'manifest' ? generatedManifestJson : generatedCliCmd;
                    handleCopy(content, activeCodeTab);
                  }}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] font-mono text-stone-300 flex items-center gap-1 transition"
                >
                  {copiedId === activeCodeTab ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === activeCodeTab ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-3 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-[300px] overflow-y-auto leading-relaxed flex-1 bg-stone-950 select-text">
              <pre>
                {activeCodeTab === 'plugin' && generatedTsCode}
                {activeCodeTab === 'manifest' && generatedManifestJson}
                {activeCodeTab === 'cli' && generatedCliCmd}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Installed Custom Plugins List */}
      <div className="bg-stone-900/60 border border-stone-800 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-stone-200 font-serif">
              Installed Custom Plugins ({installedCustomPlugins.length})
            </h4>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">Persisted in local registry storage</span>
        </div>

        {installedCustomPlugins.length === 0 ? (
          <div className="p-6 text-center text-stone-500 text-xs font-serif">
            No custom plugins registered yet. Use the form above and click "Register & Activate Live" to install your own rule systems!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {installedCustomPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs group hover:border-amber-500/40 transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{plugin.icon || '🎲'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-stone-200 truncate">{plugin.name}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-stone-800 text-stone-400 font-mono">
                        v{plugin.version || '1.0.0'}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono truncate">
                      ID: {plugin.id} • {plugin.primaryResourceName}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUnregisterPlugin(plugin.id)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0 ml-2"
                  title={`Uninstall ${plugin.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
