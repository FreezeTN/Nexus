import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  Key,
  X,
  Swords,
  Skull,
  Shield,
  Scroll,
  Network,
  Compass,
  Check,
  Copy,
  Plus,
  Loader2,
  HelpCircle,
  BookOpen,
  Dice5,
  ChevronRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { CharacterData, GearItem, Spell, RuleEdition } from '../../types';
import { CampaignEntity } from '../../utils/searchIndexer';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ChatMessage,
  EntityType,
  askAssistant,
  generateEntity,
  getStoredUserApiKey,
  setStoredUserApiKey,
  hydrateGeneratedMonster,
  hydrateGeneratedItem,
  hydrateGeneratedSpell,
  hydrateGeneratedGraphNode
} from '../../services/geminiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter?: CharacterData | null;
  ruleEdition?: RuleEdition;
  onAddCharacter?: (newChar: CharacterData) => void;
  onAddItemToInventory?: (item: GearItem) => void;
  onAddSpellToSpellbook?: (spell: Spell) => void;
  onNavigateTab?: (tab: string) => void;
}

function formatHumanError(err: any): string {
  if (!err) return 'Unable to connect to AI assistant. Please try again.';
  let msg = typeof err === 'string' ? err : err.message || '';
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error?.message) {
      msg = parsed.error.message;
    } else if (parsed?.message) {
      msg = parsed.message;
    }
  } catch {}

  const lower = msg.toLowerCase();
  if (
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429')
  ) {
    return 'The AI Oracle is currently experiencing temporary high demand across the network. Please wait a few moments and try your inquiry again.';
  }

  if (
    lower.includes('json.parse') ||
    lower.includes('unexpected character') ||
    lower.includes('is not valid json') ||
    lower.includes('syntaxerror') ||
    lower.includes('502') ||
    lower.includes('504') ||
    lower.includes('gateway')
  ) {
    return 'The AI Oracle connection experienced a temporary network timeout. Please retry your inquiry in a moment.';
  }

  if (lower.includes('api key') || lower.includes('permission_denied') || lower.includes('unauthenticated')) {
    return 'API authentication was not recognized. Please check your API key in the AI Settings (⚙️) tab.';
  }

  return msg;
}

const FORGE_INSPIRATIONS: Record<string, string[]> = {
  monster: [
    'CR 6 Glacial Drake with frost breath and burrowing',
    'CR 1/2 Clockwork Scout with optical disruption',
    'CR 12 Abyssal Archon boss with phase shifts'
  ],
  npc: [
    'A dwarven spy master running a tavern front in Waterdeep',
    'An elven alchemist seeking rare glowing cavern moss'
  ],
  item: [
    'Legendary warhammer forged in celestial flame with radiant strike',
    'Cloak of shadows granting stealth advantage in dim light'
  ],
  spell: [
    '3rd-level transmutation spell that slows enemy reflexes',
    'Cantrip creating a dancing orb of cold light'
  ],
  graph_node: [
    'The Gilded Shadows thieves guild operating in the sewers',
    'Sunken citadel in the weeping marshlands'
  ],
  quest: [
    'Investigate the missing shipments in the mountain pass',
    'A cursed heirloom causing nightmares across the village'
  ],
  encounter: [
    'Ambush on a rope bridge over a chasm in heavy fog',
    'Ritual disruption inside a crumbling mausoleum'
  ]
};

export function AiAssistantModal({
  isOpen,
  onClose,
  activeCharacter,
  ruleEdition = '5e',
  onAddCharacter,
  onAddItemToInventory,
  onAddSpellToSpellbook,
  onNavigateTab
}: AiAssistantModalProps) {
  const { language, currentLanguageObj } = useLanguage();
  const [activeTab, setActiveTab] = useState<'chat' | 'generator' | 'settings'>('chat');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome_1',
        role: 'assistant',
        text: 'Greetings, adventurer! I am **Nexus Oracle**, your in-app tabletop assistant. You can ask me anything about TTRPG rules (5e, 3.5e, Pathfinder, Shadowrun, Cthulhu), how features in this app work, or use the **Entity Forge** tab to generate monsters, magic items, spells, and campaign lore directly into your sheets.',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Generator state
  const [entityType, setEntityType] = useState<EntityType>('monster');
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenLoading, setIsGenLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [importedSuccess, setImportedSuccess] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // API Key Settings
  const [userApiKey, setUserApiKey] = useState(getStoredUserApiKey());
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  // Save chat messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_ai_chat_history', JSON.stringify(chatMessages.slice(-30)));
    } catch {}
  }, [chatMessages]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
        isError: m.isError,
      }));

      let contextSummary = `Rule System: ${ruleEdition}`;
      if (activeCharacter) {
        contextSummary = `Current Active Character: ${activeCharacter.name} (${activeCharacter.race} ${activeCharacter.characterClass} Lv.${activeCharacter.level}), Rule System: ${ruleEdition}`;
        if (activeCharacter.backstory) {
          contextSummary += `\nCharacter Backstory & Description: ${activeCharacter.backstory.substring(0, 600)}`;
        }
        if (activeCharacter.additionalNotes) {
          contextSummary += `\nQuest Log / Notes: ${activeCharacter.additionalNotes.substring(0, 400)}`;
        }
        if (activeCharacter.personalityTraits || activeCharacter.ideals || activeCharacter.bonds || activeCharacter.flaws) {
          contextSummary += `\nRoleplaying Traits: Traits: ${activeCharacter.personalityTraits || 'None'}, Ideals: ${activeCharacter.ideals || 'None'}, Bonds: ${activeCharacter.bonds || 'None'}, Flaws: ${activeCharacter.flaws || 'None'}`;
        }
      }

      const reply = await askAssistant(textToSend, historyPayload, contextSummary, language);

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Error:** ${formatHumanError(err)}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateEntity = async () => {
    if (!genPrompt.trim() || isGenLoading) return;

    setIsGenLoading(true);
    setGeneratedResult(null);
    setImportedSuccess(null);

    try {
      const context = {
        ruleEdition,
        activeCharacterName: activeCharacter?.name,
        activeCharacterLevel: activeCharacter?.level
      };

      const res = await generateEntity(entityType, genPrompt, ruleEdition, context, language);
      setGeneratedResult(res.entity);
    } catch (err: any) {
      alert(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenLoading(false);
    }
  };

  const handleImportEntity = () => {
    if (!generatedResult) return;

    try {
      if (entityType === 'monster' || entityType === 'npc') {
        const monster = hydrateGeneratedMonster(generatedResult, ruleEdition);
        if (onAddCharacter) {
          onAddCharacter(monster);
          setImportedSuccess(`Added "${monster.name}" (CR ${monster.challengeRating}) to your character & creature roster!`);
        }
      } else if (entityType === 'item') {
        const item = hydrateGeneratedItem(generatedResult);
        if (onAddItemToInventory) {
          onAddItemToInventory(item);
          setImportedSuccess(`Added "${item.name}" directly to ${activeCharacter?.name || 'active character'}'s inventory!`);
        }
      } else if (entityType === 'spell') {
        const spell = hydrateGeneratedSpell(generatedResult, ruleEdition);
        if (onAddSpellToSpellbook) {
          onAddSpellToSpellbook(spell);
          setImportedSuccess(`Added "${spell.name}" (Level ${spell.level}) to ${activeCharacter?.name || 'active character'}'s spellbook!`);
        }
      } else if (entityType === 'graph_node') {
        const node = hydrateGeneratedGraphNode(generatedResult);
        const existingRaw = localStorage.getItem('penpaper_campaign_graph_nodes');
        const existingNodes = existingRaw ? JSON.parse(existingRaw) : [];
        const updated = [node, ...existingNodes];
        localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(updated));
        setImportedSuccess(`Added "${node.name}" (${node.type.toUpperCase()}) to your Campaign Graph network!`);
      } else {
        navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2));
        setImportedSuccess('Entity details copied to clipboard!');
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleCopyResult = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleSaveApiKey = () => {
    setStoredUserApiKey(userApiKey);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 2500);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      setChatMessages([
        {
          id: 'welcome_cleared',
          role: 'assistant',
          text: 'Conversation history cleared. How may I assist your quest today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="nexus_ai_assistant_modal"
        className="w-full max-w-4xl h-[92vh] max-h-[850px] bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-950/90 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                  Nexus AI Oracle & Forge
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  Oracle AI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50 font-mono flex items-center gap-1">
                  <span>{currentLanguageObj.flag}</span>
                  <span>{currentLanguageObj.nativeName}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Rules Assistant & Entity Generator • {ruleEdition.toUpperCase()} System Active
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-stone-900 rounded-xl border border-stone-800">
              <button
                id="ai_tab_chat_btn"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Oracle Chat</span>
              </button>

              <button
                id="ai_tab_generator_btn"
                onClick={() => setActiveTab('generator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'generator'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Entity Forge</span>
              </button>

              <button
                id="ai_tab_settings_btn"
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="API Key Settings (Optional BYOK)"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {activeTab === 'chat' && chatMessages.length > 1 && (
                <button
                  id="ai_clear_history_btn"
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="ai_assistant_close_btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Oracle Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-900/50">
            {/* Chat Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[88%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-stone-950 shadow-md'
                        : msg.isError
                        ? 'bg-red-900/80 text-red-200 border border-red-500'
                        : 'bg-purple-950 border border-purple-500/40 text-purple-200'
                    }`}
                  >
                    {msg.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-tr-none'
                        : msg.isError
                        ? 'bg-red-950/40 border border-red-800/60 text-red-200 rounded-tl-none'
                        : 'bg-stone-950/80 border border-stone-800 text-stone-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="markdown-body prose prose-invert max-w-none text-sm space-y-2">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                    <div className="mt-1 text-[10px] opacity-40 text-right font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-200 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-stone-950/80 border border-stone-800 text-xs text-stone-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>Nexus Oracle is consulting the arcane archives...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-stone-950 border-t border-stone-800">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="ai_chat_input"
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder={`Ask a rules question, how a sheet works, or TTRPG advice... (${ruleEdition.toUpperCase()})`}
                  className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition"
                  disabled={isChatLoading}
                />
                <button
                  id="ai_chat_send_btn"
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-sm rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Inquire</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Entity Forge */}
        {activeTab === 'generator' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-stone-800 overflow-y-auto">
            {/* Left Configuration Pane */}
            <div className="w-full md:w-5/12 p-4 space-y-4 flex flex-col justify-between bg-stone-950/40">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" /> 1. Select Entity Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { type: 'monster' as EntityType, label: 'Monster / Boss', icon: Skull },
                      { type: 'npc' as EntityType, label: 'NPC Character', icon: Bot },
                      { type: 'item' as EntityType, label: 'Magic Item', icon: Shield },
                      { type: 'spell' as EntityType, label: 'Arcane Spell', icon: Scroll },
                      { type: 'graph_node' as EntityType, label: 'Lore Node', icon: Network },
                      { type: 'quest' as EntityType, label: 'Quest Hook', icon: Compass }
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = entityType === item.type;
                      return (
                        <button
                          key={item.type}
                          onClick={() => setEntityType(item.type)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-bold shadow-sm'
                              : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 2. Description & Directives
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">System: {ruleEdition.toUpperCase()}</span>
                  </div>
                  <textarea
                    id="ai_forge_prompt"
                    value={genPrompt}
                    onChange={e => setGenPrompt(e.target.value)}
                    placeholder={
                      entityType === 'monster'
                        ? 'e.g. A CR 6 Glacial Drake with frost breath, ice armor, and burrowing...'
                        : entityType === 'item'
                        ? 'e.g. A legendary warhammer forged in celestial flame with radiant strike and return throw...'
                        : entityType === 'spell'
                        ? 'e.g. A 3rd-level transmutation spell that petrifies blood or slows enemy reflexes...'
                        : 'e.g. Describe the theme, level, rarity, or story hook...'
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                {/* Preset Prompt Chips */}
                <div>
                  <label className="text-[11px] font-bold text-stone-400 block mb-1">Preset Inspirations:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(FORGE_INSPIRATIONS[entityType] || []).map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGenPrompt(promptText)}
                        className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/30 text-stone-300 text-[11px] rounded-lg transition cursor-pointer text-left"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                id="ai_forge_generate_btn"
                onClick={handleGenerateEntity}
                disabled={!genPrompt.trim() || isGenLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                {isGenLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Forging Entity with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Forge {entityType.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Results & Preview Pane */}
            <div className="w-full md:w-7/12 p-4 flex flex-col justify-between overflow-y-auto bg-stone-900/30">
              {generatedResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                        <span>{generatedResult.name || generatedResult.title || 'Forged Entity'}</span>
                        {generatedResult.challengeRating && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-700 font-mono">
                            CR {generatedResult.challengeRating}
                          </span>
                        )}
                        {generatedResult.level !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700 font-mono">
                            Level {generatedResult.level}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-400">
                        {generatedResult.characterClass || generatedResult.race || generatedResult.school || generatedResult.itemType || generatedResult.type}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopyResult}
                        className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Copy Raw JSON"
                      >
                        {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSuccess ? 'Copied' : 'JSON'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Card / Preview */}
                  <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs space-y-3 text-stone-300">
                    {/* HP / AC / Speed Stats */}
                    {generatedResult.hpMax !== undefined && (
                      <div className="grid grid-cols-3 gap-2 bg-stone-900/80 p-2 rounded-lg text-center font-mono">
                        <div>
                          <span className="text-stone-500 block text-[10px]">HP Max</span>
                          <span className="text-emerald-400 font-bold">{generatedResult.hpMax} ({generatedResult.hitDiceTotal})</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Armor Class</span>
                          <span className="text-blue-400 font-bold">{generatedResult.armorClass}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block text-[10px]">Speed</span>
                          <span className="text-amber-400 font-bold">{generatedResult.speed} ft</span>
                        </div>
                      </div>
                    )}

                    {/* Attacks */}
                    {Array.isArray(generatedResult.attacks) && generatedResult.attacks.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1 text-[11px]">Attacks & Actions:</span>
                        <div className="space-y-1.5">
                          {generatedResult.attacks.map((atk: any, idx: number) => (
                            <div key={idx} className="p-2 bg-stone-900 rounded-lg border border-stone-800 flex justify-between">
                              <div>
                                <span className="font-bold text-stone-200">{atk.name}</span>: <span className="text-stone-400">{atk.damage} {atk.damageType}</span>
                              </div>
                              <span className="font-mono text-amber-300 font-bold">+{atk.attackBonus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spell / Item Description */}
                    {(generatedResult.description || generatedResult.notes || generatedResult.summary || generatedResult.backstory) && (
                      <div>
                        <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1 text-[11px]">Details & Lore:</span>
                        <p className="text-stone-300 leading-relaxed italic bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                          {generatedResult.description || generatedResult.notes || generatedResult.summary || generatedResult.backstory}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Import confirmation badge */}
                  {importedSuccess && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{importedSuccess}</span>
                    </div>
                  )}

                  {/* Actions to Insert / Import */}
                  <div className="pt-2">
                    <button
                      id="ai_forge_import_btn"
                      onClick={handleImportEntity}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {entityType === 'monster' || entityType === 'npc'
                          ? 'Add to Creature & Character Roster'
                          : entityType === 'item'
                          ? 'Add to Inventory (Sheet 3)'
                          : entityType === 'spell'
                          ? 'Add to Spellbook (Sheet 4)'
                          : entityType === 'graph_node'
                          ? 'Add to Campaign Graph'
                          : 'Copy Entity Data'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
                  <Swords className="w-12 h-12 mb-3 text-stone-700" />
                  <p className="text-sm font-bold text-stone-400 mb-1">Entity Preview Empty</p>
                  <p className="text-xs max-w-sm">
                    Configure your desired creature, item, spell, or lore node on the left, then click <strong>"Forge Entity"</strong> to generate and inspect it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Optional Personal API Key Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-2xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-amber-200 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>AI Configuration & Personal Key (BYOK)</span>
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                The application connects to the AI assistant via the secure server backend. By default, queries use the shared application quota. If you wish to use your own personal API key to avoid any rate limits, you can enter it below.
              </p>
            </div>

            <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
              <label className="text-xs font-bold text-amber-400 block">
                Personal API Key:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={userApiKey}
                  onChange={e => setUserApiKey(e.target.value)}
                  placeholder="AIzaSy... (Leave empty to use app default)"
                  className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Save Key
                </button>
              </div>
              {keySavedMessage && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> API Key setting saved locally!
                </p>
              )}
              <p className="text-[11px] text-stone-500">
                You can get a free personal API key at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5"
                >
                  aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiAssistantModal;
