import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Sparkles,
  BookOpen,
  Film,
  History,
  X,
  MapPin,
  Compass,
  Users,
  Swords,
  Shield,
  Clock,
  Sun,
  Moon,
  CloudRain,
  Flame,
  Volume2,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Plus,
  Heart,
  Zap,
  Dices,
  Trophy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CharacterData, Party, RuleEdition } from '../../types';
import { WorldLocation, CampaignQuest } from '../../types/campaign';
import { loadCampaignLocations, loadCampaignQuests, loadCampaignJournal } from '../../services/campaignService';
import {
  ActiveSessionOrchestration,
  SessionReplayEvent,
  SessionAiSuggestions,
  PreviouslyOnRecap,
  loadActiveSessionOrchestration,
  saveActiveSessionOrchestration,
  startSessionOrchestrator,
  endSessionOrchestrator,
  loadSessionReplayEvents,
  recordSessionReplayEvent,
  clearSessionReplayEvents,
  generateContextAwareSessionPrep,
  generatePreviouslyOnStory,
  exportSessionReplayMarkdown
} from '../../services/sessionOrchestratorService';

export type SessionModalTab = 'orchestrator' | 'recap' | 'replay';

interface SessionOrchestratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SessionModalTab;
  activeCharacter: CharacterData | null;
  characters: CharacterData[];
  parties: Party[];
  ruleEdition: RuleEdition;
  onUpdateCharacter?: (char: CharacterData) => void;
  onLaunchEncounterAtLocation?: (location: WorldLocation) => void;
  onNavigateTab?: (tab: string) => void;
}

const RANDOM_SESSION_TITLES = [
  'The Whispering Crypts of the Forgotten',
  'Echoes of the Blood Moon',
  'Blood Upon the Shattered Altar',
  'The Sunken Vaults of Nerull',
  'Descent into the Deep Chasm',
  'The Traitor’s Banquet',
  'Ashes of the Dragon Cult',
  'The Clockwork Citadel Awakens'
];

export const SessionOrchestratorModal: React.FC<SessionOrchestratorModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'orchestrator',
  activeCharacter,
  characters = [],
  parties = [],
  ruleEdition,
  onUpdateCharacter,
  onLaunchEncounterAtLocation,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<SessionModalTab>(initialTab);
  const [activeSession, setActiveSession] = useState<ActiveSessionOrchestration | null>(() => loadActiveSessionOrchestration());
  const [replayEvents, setReplayEvents] = useState<SessionReplayEvent[]>(() => loadSessionReplayEvents());

  // Locations & Quests
  const [locations, setLocations] = useState<WorldLocation[]>(() => loadCampaignLocations());
  const [quests, setQuests] = useState<CampaignQuest[]>(() => loadCampaignQuests());

  // Form State for Starting Session
  const [sessionNumber, setSessionNumber] = useState<number>(() => (activeSession?.sessionNumber ? activeSession.sessionNumber : 1));
  const [sessionTitle, setSessionTitle] = useState<string>(() => (activeSession?.sessionTitle || 'The Whispering Crypts of the Forgotten'));
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => (activeSession?.startingLocationId || locations[0]?.id || ''));
  const [selectedQuestId, setSelectedQuestId] = useState<string>(() => (activeSession?.activeQuestId || quests[0]?.id || ''));
  const [inGameTime, setInGameTime] = useState<ActiveSessionOrchestration['inGameTime']>(() => activeSession?.inGameTime || 'morning');
  const [weatherCondition, setWeatherCondition] = useState<string>(() => activeSession?.weatherCondition || 'Overcast & Chilly');
  const [ambienceTrack, setAmbienceTrack] = useState<string>(() => activeSession?.ambienceTrack || 'Subterranean Dungeon');

  // AI Generation States
  const [aiSuggestions, setAiSuggestions] = useState<SessionAiSuggestions | null>(() => activeSession?.aiSuggestions || null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState<boolean>(false);

  const [previouslyOnRecap, setPreviouslyOnRecap] = useState<PreviouslyOnRecap | null>(() => activeSession?.recap || null);
  const [isGeneratingRecap, setIsGeneratingRecap] = useState<boolean>(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [manualNote, setManualNote] = useState<string>('');

  // Selected Location & Quest objects
  const selectedLocation = useMemo(() => {
    return locations.find(l => l.id === selectedLocationId) || locations[0] || null;
  }, [locations, selectedLocationId]);

  const selectedQuest = useMemo(() => {
    return quests.find(q => q.id === selectedQuestId) || quests[0] || null;
  }, [quests, selectedQuestId]);

  // Active party characters
  const activePartyCharacters = useMemo(() => {
    if (!activeCharacter) return characters.slice(0, 4);
    const party = parties.find(p => p.characterIds.includes(activeCharacter.id));
    if (party) {
      return characters.filter(c => party.characterIds.includes(c.id));
    }
    return [activeCharacter];
  }, [activeCharacter, characters, parties]);

  useEffect(() => {
    setActiveSession(loadActiveSessionOrchestration());
    setReplayEvents(loadSessionReplayEvents());
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRandomizeTitle = () => {
    const random = RANDOM_SESSION_TITLES[Math.floor(Math.random() * RANDOM_SESSION_TITLES.length)];
    setSessionTitle(random);
  };

  const handleStartSession = () => {
    const newSession = startSessionOrchestrator({
      sessionNumber,
      sessionTitle,
      startingLocation: selectedLocation,
      activeQuest: selectedQuest,
      inGameTime,
      weatherCondition,
      ambienceTrack,
      activeCharacters: activePartyCharacters
    });

    setActiveSession(newSession);
    setReplayEvents(loadSessionReplayEvents());
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    endSessionOrchestrator(activeSession, `Completed session ${activeSession.sessionNumber} with ${replayEvents.length} recorded events.`);
    setActiveSession(null);
    setReplayEvents(loadSessionReplayEvents());
  };

  const handleGenerateAiPrep = async () => {
    setIsGeneratingPrep(true);
    try {
      const journal = loadCampaignJournal();
      const prep = await generateContextAwareSessionPrep({
        sessionTitle,
        startingLocation: selectedLocation,
        activeQuest: selectedQuest,
        partyMembers: activePartyCharacters,
        ruleEdition,
        recentJournal: journal
      });
      setAiSuggestions(prep);

      if (activeSession) {
        const updated = { ...activeSession, aiSuggestions: prep };
        saveActiveSessionOrchestration(updated);
        setActiveSession(updated);
      }
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const handleGeneratePreviouslyOn = async () => {
    setIsGeneratingRecap(true);
    try {
      const journal = loadCampaignJournal();
      const recap = await generatePreviouslyOnStory({
        sessionTitle: activeSession?.sessionTitle || sessionTitle,
        partyMembers: activePartyCharacters,
        ruleEdition,
        journalEntries: journal
      });
      setPreviouslyOnRecap(recap);

      if (activeSession) {
        const updated = { ...activeSession, recap };
        saveActiveSessionOrchestration(updated);
        setActiveSession(updated);
      }
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  const handleLongRestParty = () => {
    if (!onUpdateCharacter) return;
    activePartyCharacters.forEach(char => {
      onUpdateCharacter({
        ...char,
        hpCurrent: char.hpMax,
        conditions: (char.conditions || []).filter(c => !c.toLowerCase().includes('poison') && !c.toLowerCase().includes('stun'))
      });
    });

    recordSessionReplayEvent({
      type: 'lore',
      title: 'Full Party Long Rest',
      details: `All ${activePartyCharacters.length} party members completed an 8-hour Long Rest. Hit Points and essential resources fully restored.`,
      highlight: true
    });
    setReplayEvents(loadSessionReplayEvents());
  };

  const handleAddManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim()) return;

    recordSessionReplayEvent({
      type: 'custom',
      title: 'DM Log Note',
      details: manualNote.trim(),
      actor: 'Game Master',
      locationName: activeSession?.startingLocationName,
      highlight: true
    });

    setManualNote('');
    setReplayEvents(loadSessionReplayEvents());
  };

  const handleExportMarkdown = () => {
    const md = exportSessionReplayMarkdown(activeSession, replayEvents, previouslyOnRecap);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Session_${sessionNumber}_Chronicle.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = replayEvents.filter(e => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'combat') return e.type === 'combat' || e.type === 'damage_heal';
    if (eventFilter === 'dice') return e.type === 'dice_nat20' || e.type === 'dice_nat1';
    if (eventFilter === 'story') return e.type === 'quest' || e.type === 'lore' || e.type === 'session_start' || e.type === 'session_end';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between gap-3 bg-stone-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-serif font-bold text-amber-100 truncate">
                  Live Session Director & Orchestrator
                </h2>
                {activeSession?.status === 'live' ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE SESSION #{activeSession.sessionNumber}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                    Standby / Prep
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate">
                One-click session launchpad, context-aware AI DM assistance, serialized story recaps, and live timeline replay.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-2 border-b border-stone-800 bg-stone-950/30 text-xs font-serif overflow-x-auto">
          <button
            onClick={() => setActiveTab('orchestrator')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'orchestrator'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Session Orchestrator</span>
          </button>

          <button
            onClick={() => setActiveTab('recap')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'recap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>&quot;Previously On...&quot; Recap</span>
          </button>

          <button
            onClick={() => setActiveTab('replay')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'replay'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Session Replay & Timeline ({replayEvents.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: ONE-CLICK START SESSION ORCHESTRATOR & CONTEXT-AWARE AI SUGGESTIONS */}
          {activeTab === 'orchestrator' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Active Session Status or Launch Banner */}
              {activeSession?.status === 'live' ? (
                <div className="bg-gradient-to-r from-emerald-950/60 via-stone-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-emerald-950/40">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="text-sm font-serif font-bold text-emerald-100 flex items-center gap-2">
                        <span>Session {activeSession.sessionNumber}: {activeSession.sessionTitle} is LIVE!</span>
                      </div>
                      <div className="text-xs text-stone-300 flex items-center gap-3 flex-wrap mt-0.5">
                        <span className="flex items-center gap-1 text-stone-400">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{activeSession.startingLocationName}</span>
                        </span>
                        <span className="flex items-center gap-1 text-stone-400">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="capitalize">{activeSession.inGameTime}</span>
                        </span>
                        <span className="text-stone-400">Weather: {activeSession.weatherCondition}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEndSession}
                      className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                    >
                      End Active Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800 flex-wrap gap-2">
                    <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400 fill-current" />
                      <span>Configure & Launch Session</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleRandomizeTitle}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Suggest Title</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Session #</label>
                      <input
                        type="number"
                        value={sessionNumber}
                        onChange={(e) => setSessionNumber(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Session Title</label>
                      <input
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="e.g. Infiltration of the Sunken Crypt"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-serif"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Starting Landmark / Location</label>
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Active Objective / Quest</label>
                      <select
                        value={selectedQuestId}
                        onChange={(e) => setSelectedQuestId(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {quests.map(q => (
                          <option key={q.id} value={q.id}>
                            {q.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Time of Day</label>
                      <select
                        value={inGameTime}
                        onChange={(e) => setInGameTime(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="dawn">🌅 Dawn / Sunrise</option>
                        <option value="morning">☀️ Morning</option>
                        <option value="noon">🌞 High Noon</option>
                        <option value="afternoon">🌤️ Afternoon</option>
                        <option value="dusk">🌇 Dusk / Twilight</option>
                        <option value="night">🌙 Nightfall</option>
                        <option value="midnight">🌑 Deep Midnight</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Weather / Atmosphere</label>
                      <input
                        type="text"
                        value={weatherCondition}
                        onChange={(e) => setWeatherCondition(e.target.value)}
                        placeholder="e.g. Overcast, driving rain"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 uppercase">Ambient Background Sound</label>
                      <select
                        value={ambienceTrack}
                        onChange={(e) => setAmbienceTrack(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Subterranean Dungeon">🏰 Subterranean Dungeon</option>
                        <option value="Tavern Taproom">🍻 Cozy Bustling Tavern</option>
                        <option value="Storm & Thunder">⛈️ Rain & Roaring Thunder</option>
                        <option value="Mystic Astral Void">🌌 Mystic Arcane Spire</option>
                        <option value="Forest Wilderness">🌲 Whispering Forest Night</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleStartSession}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Launch Live Session #{sessionNumber}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Party Pre-Flight Health & Readiness Check */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                      Party Pre-Flight Readiness ({activePartyCharacters.length} Adventurers)
                    </h3>
                  </div>

                  <button
                    onClick={handleLongRestParty}
                    className="px-3 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Long Rest Full Party</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activePartyCharacters.map(char => {
                    const hpPercent = Math.round((char.hpCurrent / Math.max(1, char.hpMax)) * 100);
                    return (
                      <div
                        key={char.id}
                        className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {char.portraitUrl ? (
                            <img src={char.portraitUrl} alt={char.name} className="w-8 h-8 rounded-lg object-cover border border-stone-700 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {char.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-stone-200 truncate">{char.name}</div>
                            <div className="text-[10px] text-stone-400">Lvl {char.level} {char.characterClass}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-stone-200">
                            <span className={hpPercent <= 25 ? 'text-rose-400 font-bold' : hpPercent <= 50 ? 'text-amber-400' : 'text-emerald-400'}>
                              {char.hpCurrent}
                            </span> / {char.hpMax} HP
                          </div>
                          <div className="w-16 h-1.5 bg-stone-950 rounded-full overflow-hidden mt-1 ml-auto border border-stone-800">
                            <div
                              className={`h-full rounded-full ${hpPercent <= 25 ? 'bg-rose-500' : hpPercent <= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, hpPercent))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Context-Aware AI Suggestions Panel */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-stone-900 to-stone-950 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-serif font-bold text-indigo-200">
                        Context-Aware AI DM Dossier & Suggestions
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        Synthesizes party level, starting location, active quests, and past exploits to generate opening scene hooks and tactical twists.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAiPrep}
                    disabled={isGeneratingPrep}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow shadow-indigo-950/50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingPrep ? 'Analyzing Campaign...' : 'Generate AI Prep Dossier'}</span>
                  </button>
                </div>

                {isGeneratingPrep && (
                  <div className="py-8 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 mx-auto text-indigo-400 animate-spin" />
                    <div className="text-xs font-mono text-indigo-300">
                      Weaving opening narration, tactical complications, and DM perception secrets...
                    </div>
                  </div>
                )}

                {aiSuggestions && !isGeneratingPrep && (
                  <div className="space-y-4">
                    {/* Read-Aloud Opening Scene Box */}
                    <div className="bg-stone-950/80 border border-amber-500/40 rounded-xl p-4 space-y-2 relative group">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cinematic Opening Scene (Read Aloud to Players)</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(aiSuggestions.openingNarration, 'narration')}
                          className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedKey === 'narration' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-stone-400" />}
                          <span>{copiedKey === 'narration' ? 'Copied!' : 'Copy Read-Aloud'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-amber-100/90 leading-relaxed font-serif italic bg-amber-950/20 p-3 rounded-lg border border-amber-500/20">
                        &quot;{aiSuggestions.openingNarration}&quot;
                      </p>
                    </div>

                    {/* Immediate Complications & Encounters */}
                    <div className="space-y-2">
                      <div className="text-xs font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span>Dynamic Encounters & Tactical Complications</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {aiSuggestions.immediateComplications.map((comp, idx) => (
                          <div
                            key={idx}
                            className="bg-stone-900 border border-stone-800 hover:border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-md transition"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-serif font-bold text-amber-200">
                                  {comp.title}
                                </h4>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">
                                  {comp.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-300 leading-relaxed">
                                {comp.description}
                              </p>
                              {comp.suggestedEnemies && comp.suggestedEnemies.length > 0 && (
                                <div className="text-[10px] text-rose-300 font-mono">
                                  Foes: {comp.suggestedEnemies.join(', ')}
                                </div>
                              )}
                            </div>

                            {comp.type === 'combat' && (
                              <button
                                onClick={() => {
                                  if (selectedLocation && onLaunchEncounterAtLocation) {
                                    onLaunchEncounterAtLocation({
                                      ...selectedLocation,
                                      suggestedMonsterNames: comp.suggestedEnemies || ['Bugbear Scout', 'Goblin Skirmisher']
                                    });
                                    onClose();
                                  } else if (onNavigateTab) {
                                    onNavigateTab('battlemap');
                                    onClose();
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow"
                              >
                                <Swords className="w-3 h-3" />
                                <span>Deploy to Battlemap</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DM Secret Intel */}
                    <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Passive Perception Clue</div>
                        <p className="text-[11px] text-stone-300">{aiSuggestions.dmSecretIntel.perceptionClue}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Environmental Factor</div>
                        <p className="text-[11px] text-stone-300">{aiSuggestions.dmSecretIntel.environmentalFactor}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Opening Pacing Advice</div>
                        <p className="text-[11px] text-stone-300">{aiSuggestions.dmSecretIntel.pacingAdvice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: "PREVIOUSLY ON..." STORY GENERATOR (PHASE 4) */}
          {activeTab === 'recap' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-purple-950/40 via-stone-900 to-amber-950/30 border border-purple-500/30 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xl">
                <div>
                  <h3 className="text-base font-serif font-bold text-purple-200 flex items-center gap-2">
                    <Film className="w-5 h-5 text-purple-400" />
                    <span>&quot;Previously On...&quot; Serialized Story Generator</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Analyzes historical campaign chronicles, battle victories, and cliffhangers to craft a television-style dramatic recap monologue.
                  </p>
                </div>

                <button
                  onClick={handleGeneratePreviouslyOn}
                  disabled={isGeneratingRecap}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow shadow-purple-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingRecap ? 'Composing Dramatic Recap...' : 'Generate "Previously On..."'}</span>
                </button>
              </div>

              {isGeneratingRecap && (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 mx-auto text-purple-400 animate-spin" />
                  <div className="text-xs font-mono text-purple-300">
                    Reviewing past chronicle logs and crafting serialized television intro...
                  </div>
                </div>
              )}

              {previouslyOnRecap && !isGeneratingRecap && (
                <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-5 space-y-5 shadow-2xl">
                  {/* Episode Title & Monologue */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800 flex-wrap gap-2">
                      <h4 className="text-base font-serif font-bold text-amber-200">
                        {previouslyOnRecap.episodeTitle}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(previouslyOnRecap.monologue, 'recap_mono')}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedKey === 'recap_mono' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                        <span>{copiedKey === 'recap_mono' ? 'Copied!' : 'Copy Monologue'}</span>
                      </button>
                    </div>

                    <div className="bg-stone-900/90 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-100/90 leading-relaxed font-serif italic space-y-2 shadow-inner">
                      {previouslyOnRecap.monologue.split('\n\n').map((paragraph, idx) => (
                        <p key={idx}>&quot;{paragraph}&quot;</p>
                      ))}
                    </div>
                  </div>

                  {/* Key Exploits & Unresolved Cliffhangers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-2">
                      <div className="text-[10px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Key Exploits & Past Milestones</span>
                      </div>
                      <div className="space-y-1.5">
                        {previouslyOnRecap.keyEvents.map((event, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-stone-300">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{event}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-2">
                      <div className="text-[10px] font-mono uppercase text-rose-300 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Unresolved Cliffhangers & Immediate Threats</span>
                      </div>
                      <div className="space-y-1.5">
                        {previouslyOnRecap.unresolvedCliffhangers.map((threat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-stone-300">
                            <span className="text-rose-400 shrink-0">⚠️</span>
                            <span>{threat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {previouslyOnRecap.spotlightHero && (
                    <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-amber-300 font-bold">Spotlight Hero</div>
                        <div className="text-stone-300 text-[11px]">{previouslyOnRecap.spotlightHero}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SESSION REPLAY & TIMELINE (PHASE 4) */}
          {activeTab === 'replay' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Live Session Chronology & Replay Timeline</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Real-time log of combat turns, natural 20s/1s, quest milestones, and DM notes.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportMarkdown}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Markdown</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Clear all session replay timeline events?')) {
                        clearSessionReplayEvents();
                        setReplayEvents([]);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-red-950/60 text-stone-500 hover:text-red-300 text-xs transition cursor-pointer"
                    title="Clear Replay Events"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Event Filter & Manual Note Form */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs">
                  {[
                    { id: 'all', label: 'All Events' },
                    { id: 'combat', label: '⚔️ Combat' },
                    { id: 'dice', label: '🎲 Nat 20s & 1s' },
                    { id: 'story', label: '📜 Story & Quests' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setEventFilter(tab.id)}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        eventFilter === tab.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-900/60 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddManualNote} className="flex items-center gap-2 flex-1 sm:max-w-md">
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Log a DM note to session timeline..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </form>
              </div>

              {/* Replay Events Timeline List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-stone-500">
                    <History className="w-8 h-8 mx-auto text-stone-600" />
                    <p className="text-xs">No replay events recorded yet for this session.</p>
                  </div>
                ) : (
                  filteredEvents.map(evt => {
                    const isNat20 = evt.type === 'dice_nat20';
                    const isNat1 = evt.type === 'dice_nat1';
                    const isCombat = evt.type === 'combat' || evt.type === 'damage_heal';
                    const isSessionBoundary = evt.type === 'session_start' || evt.type === 'session_end';

                    return (
                      <div
                        key={evt.id}
                        className={`rounded-xl p-3 border transition text-xs space-y-1 ${
                          isNat20
                            ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-950/30'
                            : isNat1
                            ? 'bg-red-950/40 border-red-500/60 shadow-md shadow-red-950/30'
                            : isSessionBoundary
                            ? 'bg-indigo-950/40 border-indigo-500/40'
                            : isCombat
                            ? 'bg-stone-900 border-stone-800'
                            : 'bg-stone-900/70 border-stone-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-stone-400">{evt.timestamp}</span>
                            <span className="font-serif font-bold text-amber-200">{evt.title}</span>
                            {evt.roundNumber && (
                              <span className="text-[10px] font-mono px-1.5 rounded bg-stone-800 text-stone-300">
                                Round {evt.roundNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-stone-400">
                            {evt.actor && <span>Actor: <strong className="text-stone-200">{evt.actor}</strong></span>}
                            {evt.locationName && <span>Location: <strong className="text-amber-300">{evt.locationName}</strong></span>}
                          </div>
                        </div>

                        <p className="text-[11px] text-stone-300 leading-relaxed">
                          {evt.details}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between gap-3">
          <span className="text-[11px] text-stone-400">
            {activeSession?.status === 'live' ? `⚡ Session #${activeSession.sessionNumber} in progress` : 'Ready to orchestrate your next adventure'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
          >
            Close Orchestrator
          </button>
        </div>
      </div>
    </div>
  );
};
