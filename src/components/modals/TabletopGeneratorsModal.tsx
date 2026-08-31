import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Swords,
  Coins,
  Scroll,
  HelpCircle,
  MapPin,
  X,
  Loader2,
  Check,
  Copy,
  ChevronRight,
  Shield,
  Heart,
  Plus,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
  FolderPlus,
  Compass,
  Layers,
  Wand2,
  Dices,
  Zap
} from 'lucide-react';
import { CharacterData, GearItem, Spell, RuleEdition } from '../../types';
import {
  generateEntity,
  GeneratedEncounter,
  GeneratedTreasure,
  GeneratedSessionSummary,
  GeneratedRulesAdjudication,
  GeneratedDungeonHazard,
  hydrateGeneratedMonster,
  hydrateGeneratedItem,
  hydrateGeneratedCharacter,
  hydrateGeneratedMerchant
} from '../../services/geminiService';
import {
  generateProceduralNpc,
  generateProceduralEncounter,
  generateProceduralTreasure,
  generateProceduralSessionSummary,
  generateProceduralRules,
  generateProceduralDungeon
} from '../../services/proceduralGenerators';
import { useLanguage } from '../../i18n/LanguageContext';

export type GeneratorTab = 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon';

interface TabletopGeneratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: GeneratorTab;
  activeCharacter?: CharacterData | null;
  ruleEdition?: RuleEdition;
  onAddCharacter?: (newChar: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem) => void;
  onAddSpellToSpellbook?: (spell: Spell) => void;
  onPopulateCombatEncounter?: (encounter: GeneratedEncounter) => void;
  onAppendSessionNotes?: (notes: string) => void;
}

export const TabletopGeneratorsModal: React.FC<TabletopGeneratorsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'npc',
  activeCharacter,
  ruleEdition = '5e',
  onAddCharacter,
  onAddItemToInventory,
  onAddSpellToSpellbook,
  onPopulateCombatEncounter,
  onAppendSessionNotes
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<GeneratorTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importedStatus, setImportedStatus] = useState<Record<string, boolean>>({});

  // 1. NPC State
  const [npcArchetype, setNpcArchetype] = useState('Tavern Bartender & Information Broker');
  const [npcTone, setNpcTone] = useState('Mysterious & Suspicious');
  const [npcCustomPrompt, setNpcCustomPrompt] = useState('');
  const [generatedNpc, setGeneratedNpc] = useState<any | null>(null);

  // 2. Encounter State
  const [encounterPartySize, setEncounterPartySize] = useState(4);
  const [encounterPartyLevel, setEncounterPartyLevel] = useState(activeCharacter?.level || 3);
  const [encounterDifficulty, setEncounterDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Deadly'>('Medium');
  const [encounterEnv, setEncounterEnv] = useState('Dungeon Crypt / Ruins');
  const [encounterCustomPrompt, setEncounterCustomPrompt] = useState('');
  const [generatedEncounter, setGeneratedEncounter] = useState<GeneratedEncounter | null>(null);

  // 3. Treasure State
  const [treasureTier, setTreasureTier] = useState<'CR 0-4 (Tier 1)' | 'CR 5-10 (Tier 2)' | 'CR 11-16 (Tier 3)' | 'CR 17+ (Tier 4)'>('CR 5-10 (Tier 2)');
  const [treasureType, setTreasureType] = useState('Dungeon Boss Chest');
  const [treasureCustomPrompt, setTreasureCustomPrompt] = useState('');
  const [generatedTreasure, setGeneratedTreasure] = useState<GeneratedTreasure | null>(null);

  // 4. Session Summary State
  const [sessionNotesInput, setSessionNotesInput] = useState(activeCharacter?.additionalNotes || '');
  const [sessionFocus, setSessionFocus] = useState('Balanced Recap & Next Hooks');
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSessionSummary | null>(null);

  // 5. Rules Arbiter State
  const [rulesQuery, setRulesQuery] = useState('');
  const [generatedRules, setGeneratedRules] = useState<GeneratedRulesAdjudication | null>(null);

  // 6. Dungeon Room State
  const [dungeonArchetype, setDungeonArchetype] = useState('Trapped Arcane Vault');
  const [dungeonThreatLevel, setDungeonThreatLevel] = useState('Moderate');
  const [dungeonCustomPrompt, setDungeonCustomPrompt] = useState('');
  const [generatedDungeon, setGeneratedDungeon] = useState<GeneratedDungeonHazard | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger Generators
  const handleGenerateNpc = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Generate a vivid, memorable NPC for ${ruleEdition}.
Archetype: ${npcArchetype}.
Tone/Personality: ${npcTone}.
${npcCustomPrompt ? `Additional Details: ${npcCustomPrompt}` : ''}
Include a secret motive, distinct voice quirk, roleplay hooks, balanced stats, and equipment.`;

      const res = await generateEntity('character', prompt, ruleEdition, { activeLevel: activeCharacter?.level }, language);
      setGeneratedNpc(res.entity);
    } catch (err: any) {
      console.warn('AI NPC generation failed, falling back to procedural table:', err);
      const fallback = generateProceduralNpc(npcArchetype, npcTone, npcCustomPrompt, ruleEdition, activeCharacter?.level || 3);
      setGeneratedNpc(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantNpc = () => {
    setErrorMsg(null);
    const result = generateProceduralNpc(npcArchetype, npcTone, npcCustomPrompt, ruleEdition, activeCharacter?.level || 3);
    setGeneratedNpc(result);
  };

  const handleGenerateEncounter = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Create a thrilling, balanced ${encounterDifficulty} combat encounter for a party of ${encounterPartySize} level ${encounterPartyLevel} characters in ${ruleEdition}.
Environment: ${encounterEnv}.
${encounterCustomPrompt ? `Custom Theme: ${encounterCustomPrompt}` : ''}
Provide tactical phases, terrain features, interactive hazards, complete statblocks for all enemies, and XP/gold loot.`;

      const res = await generateEntity('encounter', prompt, ruleEdition, { partySize: encounterPartySize, level: encounterPartyLevel }, language);
      setGeneratedEncounter(res.entity as GeneratedEncounter);
    } catch (err: any) {
      console.warn('AI Encounter generation failed, falling back to procedural table:', err);
      const fallback = generateProceduralEncounter(encounterPartySize, encounterPartyLevel, encounterDifficulty as any, encounterEnv, encounterCustomPrompt, ruleEdition);
      setGeneratedEncounter(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantEncounter = () => {
    setErrorMsg(null);
    const result = generateProceduralEncounter(encounterPartySize, encounterPartyLevel, encounterDifficulty as any, encounterEnv, encounterCustomPrompt, ruleEdition);
    setGeneratedEncounter(result);
  };

  const handleGenerateTreasure = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Roll a rich, flavorful treasure hoard or loot drop for ${ruleEdition}.
Tier: ${treasureTier}.
Type: ${treasureType}.
${treasureCustomPrompt ? `Notes: ${treasureCustomPrompt}` : ''}
Include coin denominations (cp, sp, ep, gp, pp), appraised art/gems with GP value, and exciting magic items matching the tier with full mechanical stats.`;

      const res = await generateEntity('treasure', prompt, ruleEdition, { tier: treasureTier }, language);
      setGeneratedTreasure(res.entity as GeneratedTreasure);
    } catch (err: any) {
      console.warn('AI Treasure generation failed, falling back to procedural table:', err);
      const fallback = generateProceduralTreasure(treasureTier, treasureType, treasureCustomPrompt, ruleEdition);
      setGeneratedTreasure(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantTreasure = () => {
    setErrorMsg(null);
    const result = generateProceduralTreasure(treasureTier, treasureType, treasureCustomPrompt, ruleEdition);
    setGeneratedTreasure(result);
  };

  const handleGenerateSessionSummary = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Generate a cinematic, structured tabletop session summary and campaign recap for ${ruleEdition}.
Session Notes / Key Events:
${sessionNotesInput || 'The party explored the sunken ruins, fought a water elemental guardian, retrieved the ancient sapphire key, and rested before opening the vault.'}
Focus: ${sessionFocus}`;

      const res = await generateEntity('session_summary', prompt, ruleEdition, { characterName: activeCharacter?.name }, language);
      setGeneratedSummary(res.entity as GeneratedSessionSummary);
    } catch (err: any) {
      console.warn('AI Session Summary failed, falling back to procedural table:', err);
      const fallback = generateProceduralSessionSummary(sessionNotesInput, sessionFocus, ruleEdition);
      setGeneratedSummary(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantSessionSummary = () => {
    setErrorMsg(null);
    const result = generateProceduralSessionSummary(sessionNotesInput, sessionFocus, ruleEdition);
    setGeneratedSummary(result);
  };

  const handleGenerateRules = async (queryToRun?: string) => {
    const q = queryToRun || rulesQuery;
    if (!q.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Adjudicate this TTRPG rules question for ${ruleEdition}: "${q}".
Provide a bottom-line verdict, exact RAW (Rules As Written) citations, RAI (Rules As Intended) context, and a recommended quick table ruling to keep play moving smoothly.`;

      const res = await generateEntity('rules_adjudication', prompt, ruleEdition, {}, language);
      setGeneratedRules(res.entity as GeneratedRulesAdjudication);
    } catch (err: any) {
      console.warn('AI Rules adjudication failed, falling back to rule tables:', err);
      const fallback = generateProceduralRules(q, ruleEdition);
      setGeneratedRules(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantRules = (queryToRun?: string) => {
    const q = queryToRun || rulesQuery;
    if (!q.trim()) return;
    setErrorMsg(null);
    const result = generateProceduralRules(q, ruleEdition);
    setGeneratedRules(result);
  };

  const handleGenerateDungeon = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const prompt = `Design an atmospheric, tactical dungeon room and environmental hazard for ${ruleEdition}.
Room Theme: ${dungeonArchetype}.
Threat Level: ${dungeonThreatLevel}.
${dungeonCustomPrompt ? `Custom notes: ${dungeonCustomPrompt}` : ''}
Provide read-aloud sensory descriptions, lighting, tactical features (cover/elevations), dynamic hazards with DC checks, and a hidden secret.`;

      const res = await generateEntity('dungeon_hazard', prompt, ruleEdition, {}, language);
      setGeneratedDungeon(res.entity as GeneratedDungeonHazard);
    } catch (err: any) {
      console.warn('AI Dungeon generation failed, falling back to procedural table:', err);
      const fallback = generateProceduralDungeon(dungeonArchetype, dungeonThreatLevel, dungeonCustomPrompt, ruleEdition);
      setGeneratedDungeon(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDungeon = () => {
    setErrorMsg(null);
    const result = generateProceduralDungeon(dungeonArchetype, dungeonThreatLevel, dungeonCustomPrompt, ruleEdition);
    setGeneratedDungeon(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[900px] flex flex-col rounded-3xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-amber-500/30 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-stone-100">
                  In-Flow Tabletop AI Generators
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Instant Table Tools
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Generate ready-to-play NPCs, balanced encounters, treasure hoards, session chronicles & fast rule adjudications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 bg-stone-900/80 hover:bg-stone-800 rounded-xl border border-stone-800 transition cursor-pointer"
            aria-label="Close Generators Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-stone-950 border-b border-stone-800/60 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('npc')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'npc'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quick NPC</span>
          </button>

          <button
            onClick={() => setActiveTab('encounter')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'encounter'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Encounter Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('treasure')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'treasure'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Treasure & Loot</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'session'
                ? 'bg-cyan-600 text-white shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Scroll className="w-4 h-4" />
            <span>Session Chronicle</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'rules'
                ? 'bg-amber-600 text-stone-950 shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Rule Arbiter</span>
          </button>

          <button
            onClick={() => setActiveTab('dungeon')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'dungeon'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Dungeon Room</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="p-1 hover:bg-rose-900/60 rounded text-rose-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: QUICK NPC */}
          {activeTab === 'npc' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    NPC Role & Archetype
                  </label>
                  <select
                    value={npcArchetype}
                    onChange={(e) => setNpcArchetype(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Tavern Bartender & Information Broker">Tavern Bartender & Info Broker</option>
                    <option value="Rogue Informant / Fence">Rogue Informant / Fence</option>
                    <option value="Town Guard Captain / Veteran">Town Guard Captain / Veteran</option>
                    <option value="Mysterious Archmage / Hermit">Mysterious Archmage / Hermit</option>
                    <option value="Wandering Apothecary & Herbalist">Wandering Apothecary & Herbalist</option>
                    <option value="Corrupt Noble / Guild Magistrate">Corrupt Noble / Guild Magistrate</option>
                    <option value="Fanatical Cultist / Warlock">Fanatical Cultist / Warlock</option>
                    <option value="Blacksmith Artisan & Weaponsmith">Blacksmith Artisan & Weaponsmith</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Disposition & Tone
                  </label>
                  <select
                    value={npcTone}
                    onChange={(e) => setNpcTone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Mysterious & Suspicious">Mysterious & Suspicious</option>
                    <option value="Cheerful & Fast-Talking">Cheerful & Fast-Talking</option>
                    <option value="Gruff, Weary & Battle-Hardened">Gruff, Weary & Battle-Hardened</option>
                    <option value="Eccentric & Secretive">Eccentric & Secretive</option>
                    <option value="Cold, Calculating & Pragmatic">Cold, Calculating & Pragmatic</option>
                    <option value="Desperate & Seeking Aid">Desperate & Seeking Aid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Custom Specifics (Optional)
                  </label>
                  <input
                    type="text"
                    value={npcCustomPrompt}
                    onChange={(e) => setNpcCustomPrompt(e.target.value)}
                    placeholder="e.g. Speaks in rhyming proverbs, missing left eye..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantNpc}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Generate instantly using local DM roll tables (zero waiting / offline)"
                >
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span>Instant Table Roll</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateNpc}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating NPC...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Forge AI NPC</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated NPC Card */}
              {generatedNpc && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-amber-500/40 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-serif font-bold text-amber-300">
                          {generatedNpc.name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-stone-800 text-stone-300 rounded">
                          Level {generatedNpc.level || 1} {generatedNpc.race} {generatedNpc.characterClass}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Alignment: <strong className="text-stone-200">{generatedNpc.alignment}</strong> • Background: <strong className="text-stone-200">{generatedNpc.background}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(generatedNpc, null, 2), 'npc')}
                        className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-stone-100 text-xs border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                        title="Copy NPC JSON"
                      >
                        {copiedId === 'npc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>Copy</span>
                      </button>

                      {onAddCharacter && (
                        <button
                          onClick={() => {
                            const newPc = hydrateGeneratedCharacter(generatedNpc, ruleEdition);
                            onAddCharacter(newPc);
                            setImportedStatus({ ...importedStatus, npc: true });
                          }}
                          disabled={importedStatus.npc}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:bg-emerald-600 disabled:text-white"
                        >
                          {importedStatus.npc ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Roster!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add to Character Roster</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                      <span className="text-[10px] text-stone-400 font-mono uppercase block">Armor Class</span>
                      <span className="text-base font-bold text-cyan-400">{generatedNpc.armorClass || 12}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                      <span className="text-[10px] text-stone-400 font-mono uppercase block">Max HP</span>
                      <span className="text-base font-bold text-rose-400">{generatedNpc.hpMax || 18}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                      <span className="text-[10px] text-stone-400 font-mono uppercase block">Speed</span>
                      <span className="text-base font-bold text-emerald-400">{generatedNpc.speed || 30} ft</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                      <span className="text-[10px] text-stone-400 font-mono uppercase block">Initiative</span>
                      <span className="text-base font-bold text-amber-400">+{generatedNpc.initiativeBonus || 0}</span>
                    </div>
                  </div>

                  {/* Roleplay & Secret Motives */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                      <span className="font-serif font-bold text-amber-400 block">Personality & Mannerisms</span>
                      <p className="text-stone-300 leading-relaxed">{generatedNpc.personalityTraits || 'Expressive and sharp-witted.'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                      <span className="font-serif font-bold text-purple-400 block">Backstory & Hidden Hook</span>
                      <p className="text-stone-300 leading-relaxed">{generatedNpc.backstory || generatedNpc.ideals || 'Carries a clandestine past.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENCOUNTER & BOSS BUILDER */}
          {activeTab === 'encounter' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={encounterPartySize}
                    onChange={(e) => setEncounterPartySize(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Average Party Level (APL)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={encounterPartyLevel}
                    onChange={(e) => setEncounterPartyLevel(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Difficulty Target
                  </label>
                  <select
                    value={encounterDifficulty}
                    onChange={(e) => setEncounterDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Easy">Easy (Resource attrition)</option>
                    <option value="Medium">Medium (Standard tactical)</option>
                    <option value="Hard">Hard (Dangerous mob)</option>
                    <option value="Deadly">Deadly (Boss / High stakes)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Environment & Theme
                  </label>
                  <select
                    value={encounterEnv}
                    onChange={(e) => setEncounterEnv(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Dungeon Crypt / Ancient Ruins">Dungeon Crypt / Ancient Ruins</option>
                    <option value="Dense Wild Forest / Ambush">Dense Wild Forest / Ambush</option>
                    <option value="Volcanic Lair / Magma Fissures">Volcanic Lair / Magma Fissures</option>
                    <option value="Cyberpunk Corporate Underbelly">Cyberpunk Corporate Underbelly</option>
                    <option value="Haunted Swamp & Bog">Haunted Swamp & Bog</option>
                    <option value="Sunken Temple / Submerged Grotto">Sunken Temple / Submerged Grotto</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantEncounter}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Generate balanced combatants instantly using local tables"
                >
                  <Dices className="w-4 h-4 text-purple-400" />
                  <span>Instant Table Roll</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateEncounter}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Building Encounter...</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-4 h-4" />
                      <span>Generate AI Encounter</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Encounter Card */}
              {generatedEncounter && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-purple-500/40 space-y-5 shadow-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-serif font-bold text-purple-300">
                          {generatedEncounter.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                          generatedEncounter.difficulty === 'Deadly'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : 'bg-purple-950 text-purple-300 border-purple-700'
                        }`}>
                          {generatedEncounter.difficulty} Encounter
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Environment: <strong className="text-stone-200">{generatedEncounter.environment}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {onPopulateCombatEncounter && (
                        <button
                          onClick={() => {
                            onPopulateCombatEncounter(generatedEncounter);
                            setImportedStatus({ ...importedStatus, encounter: true });
                          }}
                          disabled={importedStatus.encounter}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:bg-emerald-600"
                        >
                          {importedStatus.encounter ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Enemies Sent to Combat Tracker!</span>
                            </>
                          ) : (
                            <>
                              <Swords className="w-4 h-4" />
                              <span>Deploy to Combat Tracker</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
                    {generatedEncounter.description}
                  </p>

                  {/* Enemy Roster */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-serif font-bold text-purple-400 uppercase tracking-wide">
                      Hostile Combatants Roster
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {generatedEncounter.enemies.map((enemy, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sm text-stone-100">
                              {enemy.count > 1 ? `${enemy.count}x ` : ''}{enemy.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
                              CR {enemy.cr} • {enemy.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-400">
                            <span>HP: <strong className="text-rose-400">{enemy.hpMax}</strong></span>
                            <span>AC: <strong className="text-cyan-400">{enemy.armorClass}</strong></span>
                            <span>Init: <strong className="text-amber-400">+{enemy.initiativeBonus}</strong></span>
                          </div>
                          <p className="text-[11px] text-stone-400 leading-normal">
                            {enemy.tacticalNotes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactics & Phases */}
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs space-y-1">
                    <span className="font-serif font-bold text-purple-300 block">Tactical Phases & Hazards</span>
                    <p className="text-stone-300 leading-relaxed">{generatedEncounter.tacticsAndPhases}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TREASURE & LOOT */}
          {activeTab === 'treasure' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Level / Challenge Tier
                  </label>
                  <select
                    value={treasureTier}
                    onChange={(e) => setTreasureTier(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CR 0-4 (Tier 1)">CR 0-4 (Tier 1: Local Adventurers)</option>
                    <option value="CR 5-10 (Tier 2)">CR 5-10 (Tier 2: Heroes of the Realm)</option>
                    <option value="CR 11-16 (Tier 3)">CR 11-16 (Tier 3: Masters of the World)</option>
                    <option value="CR 17+ (Tier 4)">CR 17+ (Tier 4: Legendary / Godlike)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Loot Container / Source
                  </label>
                  <select
                    value={treasureType}
                    onChange={(e) => setTreasureType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Dungeon Boss Chest">Dungeon Boss Iron Chest</option>
                    <option value="Dragon Hoard Vault">Dragon Hoard Relic Vault</option>
                    <option value="Bandit Chief Coin Pouch">Bandit Chief Coin Pouch</option>
                    <option value="Ancient Wizard Sanctum Library">Ancient Wizard Sanctum</option>
                    <option value="Sunken Galleon Cargo Hold">Sunken Galleon Cargo Hold</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Custom Flavor / Keywords
                  </label>
                  <input
                    type="text"
                    value={treasureCustomPrompt}
                    onChange={(e) => setTreasureCustomPrompt(e.target.value)}
                    placeholder="e.g. Celestial radiant artifacts, gemstone focus..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantTreasure}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Roll hoard loot and magic items instantly using DMG tables (zero waiting)"
                >
                  <Dices className="w-4 h-4 text-emerald-400" />
                  <span>Instant Table Roll</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateTreasure}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rolling Hoard Loot...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Roll AI Hoard</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Treasure Card */}
              {generatedTreasure && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-emerald-500/40 space-y-5 shadow-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-emerald-300">
                        {generatedTreasure.title}
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Total Appraised Value: <strong className="text-amber-400">{generatedTreasure.totalGpEquivalent || 500} GP Equivalent</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(JSON.stringify(generatedTreasure, null, 2), 'treasure')}
                      className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-stone-100 text-xs border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === 'treasure' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>Copy Loot Manifest</span>
                    </button>
                  </div>

                  {/* Coinage Stash */}
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
                      <span className="text-[10px] text-amber-500 font-mono block">CP</span>
                      <span className="font-bold text-stone-200">{generatedTreasure.wealth?.cp || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-stone-950 border border-stone-800">
                      <span className="text-[10px] text-slate-400 font-mono block">SP</span>
                      <span className="font-bold text-stone-200">{generatedTreasure.wealth?.sp || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
                      <span className="text-[10px] text-cyan-400 font-mono block">EP</span>
                      <span className="font-bold text-stone-200">{generatedTreasure.wealth?.ep || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 font-mono block">GP</span>
                      <span className="font-bold text-amber-300">{generatedTreasure.wealth?.gp || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40">
                      <span className="text-[10px] text-purple-400 font-mono block">PP</span>
                      <span className="font-bold text-stone-200">{generatedTreasure.wealth?.pp || 0}</span>
                    </div>
                  </div>

                  {/* Gemstones & Art */}
                  {generatedTreasure.gemstonesAndArt?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-serif font-bold text-emerald-400 uppercase">Gemstones & Valuables</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {generatedTreasure.gemstonesAndArt.map((gem, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-stone-200 block">{gem.name}</span>
                              <span className="text-[11px] text-stone-400">{gem.description}</span>
                            </div>
                            <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">{gem.valueGp} GP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Magic Items */}
                  {generatedTreasure.magicItems?.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-serif font-bold text-purple-400 uppercase">Magic Items</span>
                      <div className="space-y-2">
                        {generatedTreasure.magicItems.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-stone-950 border border-purple-800/40 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-purple-200">{item.name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                  {item.rarity} {item.itemType}
                                </span>
                              </div>
                              <p className="text-xs text-stone-300 mt-1 leading-relaxed">{item.notes}</p>
                            </div>

                            {onAddItemToInventory && (
                              <button
                                onClick={() => {
                                  const gear = hydrateGeneratedItem(item);
                                  onAddItemToInventory(gear);
                                  setImportedStatus({ ...importedStatus, [`loot_${idx}`]: true });
                                }}
                                disabled={importedStatus[`loot_${idx}`]}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 cursor-pointer transition disabled:bg-stone-800 disabled:text-stone-500"
                              >
                                {importedStatus[`loot_${idx}`] ? 'Added!' : '+ Add to Gear'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SESSION CHRONICLE */}
          {activeTab === 'session' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                  Raw Session Events & Bullet Notes
                </label>
                <textarea
                  rows={4}
                  value={sessionNotesInput}
                  onChange={(e) => setSessionNotesInput(e.target.value)}
                  placeholder="Paste combat log notes, character discoveries, defeated bosses, or dialogue bullet points..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantSessionSummary}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Synthesize chronicle notes instantly using structured campaign recap engine"
                >
                  <Dices className="w-4 h-4 text-cyan-400" />
                  <span>Instant Chronicle</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateSessionSummary}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Chronicle...</span>
                    </>
                  ) : (
                    <>
                      <Scroll className="w-4 h-4" />
                      <span>Synthesize AI Chronicle</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Summary */}
              {generatedSummary && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-cyan-500/40 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-cyan-300">
                        {generatedSummary.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {onAppendSessionNotes && (
                        <button
                          onClick={() => {
                            const formatted = `\n\n### ${generatedSummary.title}\n\n**Previously On:** ${generatedSummary.previouslyOn}\n\n**Key Victories:** ${generatedSummary.keyVictoriesAndCasualties}\n\n**Next Session Hooks:**\n${generatedSummary.unresolvedHooksAndCliffhangers?.map(h => `- ${h}`).join('\n')}`;
                            onAppendSessionNotes(formatted);
                            setImportedStatus({ ...importedStatus, summary: true });
                          }}
                          disabled={importedStatus.summary}
                          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:bg-emerald-600"
                        >
                          {importedStatus.summary ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          <span>{importedStatus.summary ? 'Appended to Notes!' : 'Append to Session Notes'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-950/80 border border-cyan-900/30 text-xs space-y-2">
                    <span className="font-serif font-bold text-cyan-400 block uppercase tracking-wide">
                      "Previously On..." Narrative Brief
                    </span>
                    <p className="text-stone-200 leading-relaxed italic">{generatedSummary.previouslyOn}</p>
                  </div>

                  {/* Next session hooks */}
                  {generatedSummary.unresolvedHooksAndCliffhangers?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-1.5">
                      <span className="font-serif font-bold text-amber-400 block">Cliffhangers & Unresolved Hooks</span>
                      <ul className="list-disc list-inside space-y-1 text-stone-300">
                        {generatedSummary.unresolvedHooksAndCliffhangers.map((hook, idx) => (
                          <li key={idx}>{hook}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RULES ARBITER */}
          {activeTab === 'rules' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Rule Query Chips */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-2">
                  Frequently Adjudicated Tabletop Rules (Click to Arbitrate):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Can I cast Misty Step and Fireball in the same turn?',
                    'How does Grappling + Shoving prone work together?',
                    'Can a rogue Sneak Attack on someone else\'s turn with an Opportunity Attack?',
                    'Does Blindness/Invisibility grant advantage against a creature in Darkness?',
                    'How does taking multiple damage sources affect Concentration checks?',
                    'Can you drink a potion as a bonus action or action?'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setRulesQuery(chip);
                        handleGenerateRules(chip);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 transition cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={rulesQuery}
                  onChange={(e) => setRulesQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateRules()}
                  placeholder="Ask any tabletop rule, edge-case interaction, or spell combination..."
                  className="flex-1 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleInstantRules()}
                  disabled={isLoading || !rulesQuery.trim()}
                  className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50 shrink-0"
                  title="Instant reference adjudication from core rule tables"
                >
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span>Instant RAW</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateRules()}
                  disabled={isLoading || !rulesQuery.trim()}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                  <span>Judge Rule</span>
                </button>
              </div>

              {/* Generated Rules Adjudication */}
              {generatedRules && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-amber-500/40 space-y-4 shadow-xl">
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block mb-1">
                      Official Ruling Verdict
                    </span>
                    <p className="text-base font-serif font-bold text-amber-200">{generatedRules.verdict}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5">
                      <span className="font-serif font-bold text-cyan-400 block">Rules As Written (RAW)</span>
                      <p className="text-stone-300 leading-relaxed">{generatedRules.rulesAsWritten}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5">
                      <span className="font-serif font-bold text-purple-400 block">Rules As Intended (RAI)</span>
                      <p className="text-stone-300 leading-relaxed">{generatedRules.rulesAsIntended}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1">
                    <span className="font-serif font-bold text-emerald-400 block">Fast Table Recommendation (Keep game moving)</span>
                    <p className="text-stone-200 leading-relaxed">{generatedRules.recommendedTableRuling}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DUNGEON ROOM */}
          {activeTab === 'dungeon' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Room Archetype
                  </label>
                  <select
                    value={dungeonArchetype}
                    onChange={(e) => setDungeonArchetype(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Trapped Arcane Vault">Trapped Arcane Vault</option>
                    <option value="Flooded Scriptorium & Catacombs">Flooded Catacombs</option>
                    <option value="Magma Forge & Golem Assembly">Magma Forge & Foundry</option>
                    <option value="Spore-Infested Underdark Cavern">Spore-Infested Cavern</option>
                    <option value="Collapsing Bridge over Abyss">Collapsing Bridge over Abyss</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Threat / Hazard Severity
                  </label>
                  <select
                    value={dungeonThreatLevel}
                    onChange={(e) => setDungeonThreatLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Low (Minor hindrance)">Low (Minor hindrance)</option>
                    <option value="Moderate (Dangerous check)">Moderate (Dangerous check)</option>
                    <option value="Severe (Deadly trap/hazard)">Severe (Deadly trap/hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Custom Theme / Elements
                  </label>
                  <input
                    type="text"
                    value={dungeonCustomPrompt}
                    onChange={(e) => setDungeonCustomPrompt(e.target.value)}
                    placeholder="e.g. Poison gas vents, swinging pendulum..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleInstantDungeon}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                  title="Generate dungeon layout, hazards, and traps instantly using tactical chamber tables"
                >
                  <Dices className="w-4 h-4 text-rose-400" />
                  <span>Instant Table Roll</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateDungeon}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Architecting Chamber...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Generate AI Chamber</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Dungeon Room */}
              {generatedDungeon && (
                <div className="p-6 rounded-2xl bg-stone-900/80 border border-rose-500/40 space-y-4 shadow-xl">
                  <div className="border-b border-stone-800 pb-3">
                    <h3 className="text-xl font-serif font-bold text-rose-300">
                      {generatedDungeon.roomName}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5 font-mono">
                      {generatedDungeon.dimensionsAndLighting}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-950/80 border border-rose-900/30 text-xs space-y-1.5">
                    <span className="font-serif font-bold text-rose-400 uppercase tracking-wide">
                      Read-Aloud Sensory Description
                    </span>
                    <p className="text-stone-200 leading-relaxed italic">{generatedDungeon.sensoryDescription}</p>
                  </div>

                  {/* Hazards */}
                  {generatedDungeon.dynamicHazards?.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <span className="font-serif font-bold text-amber-400 uppercase">Environmental Hazards & Traps</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {generatedDungeon.dynamicHazards.map((hz, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-200">{hz.name}</span>
                              <span className="font-mono text-rose-400 font-bold">{hz.dcCheck}</span>
                            </div>
                            <p className="text-stone-400 text-[11px]">Trigger: {hz.trigger}</p>
                            <p className="text-stone-300 text-[11px]">Effect: {hz.damageOrEffect}</p>
                            <p className="text-emerald-400 text-[10px]">Counter: {hz.countermeasure}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
