import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CloudSun,
  Wind,
  Flame,
  Snowflake,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  Compass,
  AlertTriangle,
  BookOpen,
  Send,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Shield,
  FileText,
  Newspaper,
  Volume2
} from 'lucide-react';
import {
  WorldCalendarState,
  WorldTickResult,
  WorldGazetteItem,
  WorldSeason
} from '../../types/campaign';
import {
  loadWorldCalendarState,
  saveWorldCalendarState,
  loadCampaignGazette,
  advanceWorldSimulation,
  generateAiWorldEvolution,
  logWorldTickToChronicle
} from '../../services/livingWorldService';

interface LivingWorldViewProps {
  onAppendSessionNotes?: (note: string) => void;
  onOpenKnowledgeGraph?: (entityName: string) => void;
}

const SEASON_ICONS: Record<WorldSeason, React.ReactNode> = {
  spring: <CloudSun className="w-5 h-5 text-emerald-400" />,
  summer: <Sun className="w-5 h-5 text-amber-400" />,
  autumn: <Wind className="w-5 h-5 text-orange-400" />,
  winter: <Snowflake className="w-5 h-5 text-cyan-400" />
};

export const LivingWorldView: React.FC<LivingWorldViewProps> = ({
  onAppendSessionNotes,
  onOpenKnowledgeGraph
}) => {
  const [calendar, setCalendar] = useState<WorldCalendarState>(loadWorldCalendarState);
  const [gazette, setGazette] = useState<WorldGazetteItem[]>(loadCampaignGazette);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastTickResult, setLastTickResult] = useState<WorldTickResult | null>(null);
  const [customDays, setCustomDays] = useState<number>(1);
  const [chronicleLogged, setChronicleLogged] = useState(false);

  useEffect(() => {
    setCalendar(loadWorldCalendarState());
    setGazette(loadCampaignGazette());
  }, []);

  const handleAdvance = async (days: number, useAi = false) => {
    setIsSimulating(true);
    setChronicleLogged(false);
    try {
      const res = useAi
        ? await generateAiWorldEvolution(days)
        : await advanceWorldSimulation(days);
      setCalendar(res.newCalendar);
      setGazette(loadCampaignGazette());
      setLastTickResult(res);
    } catch (e) {
      console.error('World simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogChronicle = () => {
    if (lastTickResult && !chronicleLogged) {
      logWorldTickToChronicle(lastTickResult);
      setChronicleLogged(true);
    }
  };

  const handleBroadcastToNotes = (item: WorldGazetteItem) => {
    if (onAppendSessionNotes) {
      onAppendSessionNotes(`[Living World - ${item.category.toUpperCase()}] ${item.headline}: ${item.body}`);
    }
  };

  const filteredGazette = gazette.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: World Clock & Weather Nexus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calendar Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Calendar of the Realm
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
              Year {calendar.currentYear}
            </span>
          </div>

          <div className="my-3">
            <div className="text-2xl font-serif font-black text-amber-200">
              Day {calendar.currentDay}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-300 font-medium capitalize">
              {SEASON_ICONS[calendar.season]}
              <span>Season of {calendar.season}</span>
              <span className="text-stone-600">•</span>
              <span className="text-amber-400 capitalize">{calendar.timeOfDay}</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-400 border-t border-stone-800 pt-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Moon: {calendar.activeMoonPhase || 'Waxing'}
            </span>
            <span className="text-stone-500">90 Days / Season</span>
          </div>
        </div>

        {/* Atmospheric Weather Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <CloudSun className="w-4 h-4" />
              Atmospheric Front
            </span>
            {calendar.ambientHazardActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Hazard Active
              </span>
            )}
          </div>

          <div className="my-3">
            <div className="text-lg font-serif font-bold text-cyan-200">
              {calendar.weather}
            </div>
            <p className="text-xs text-stone-300 line-clamp-2 mt-1">
              {calendar.weatherDescription}
            </p>
          </div>

          <div className="text-[11px] text-stone-400 border-t border-stone-800 pt-2 flex items-center justify-between">
            <span>Avg Temp: <strong className="text-stone-200">{calendar.temperatureFahrenheit}°F</strong></span>
            <span className="text-stone-400">{calendar.ambientHazardActive ? 'Slows travel speed' : 'Standard travel'}</span>
          </div>
        </div>

        {/* Advance World Time Controls */}
        <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border border-amber-900/40 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Passage of Time
              </span>
              <span className="text-[10px] text-stone-400 font-sans">Simulate Downtime</span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              Advance calendar days to trigger weather shifts, faction maneuvers, and quest updates.
            </p>
          </div>

          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                disabled={isSimulating}
                onClick={() => handleAdvance(1)}
                className="py-1.5 px-2 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition cursor-pointer disabled:opacity-50"
              >
                +1 Day
              </button>
              <button
                disabled={isSimulating}
                onClick={() => handleAdvance(3)}
                className="py-1.5 px-2 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition cursor-pointer disabled:opacity-50"
              >
                +3 Days
              </button>
              <button
                disabled={isSimulating}
                onClick={() => handleAdvance(7)}
                className="py-1.5 px-2 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 transition cursor-pointer disabled:opacity-50"
              >
                +1 Week
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isSimulating}
                onClick={() => handleAdvance(customDays, true)}
                className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Evolve World with AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Result Callout (if just run) */}
      {lastTickResult && (
        <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
              <div>
                <h4 className="font-serif font-bold text-sm text-amber-200">
                  World Advanced by {lastTickResult.daysAdvanced} Days
                </h4>
                <p className="text-[11px] text-stone-400">
                  New Date: Day {lastTickResult.newCalendar.currentDay} ({lastTickResult.newCalendar.season.toUpperCase()}) • {lastTickResult.newCalendar.weather}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogChronicle}
              disabled={chronicleLogged}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chronicleLogged
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow'
              }`}
            >
              {chronicleLogged ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged to Campaign Chronicle</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Record in Campaign Lore Vault</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Summary Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800 text-xs">
            {lastTickResult.factionShifts.map((f, i) => (
              <div key={i} className="p-2 rounded-xl bg-stone-950/80 border border-indigo-900/40 text-indigo-300">
                <span className="font-bold block text-indigo-200">⚔️ {f.factionName}</span>
                <span className="text-[11px] text-stone-400">{f.changeText}</span>
              </div>
            ))}
            {lastTickResult.questUpdates.map((q, i) => (
              <div key={i} className="p-2 rounded-xl bg-stone-950/80 border border-purple-900/40 text-purple-300">
                <span className="font-bold block text-purple-200">📜 {q.questTitle}</span>
                <span className="text-[11px] text-stone-400">{q.changeText}</span>
              </div>
            ))}
            {lastTickResult.npcRumors.map((r, i) => (
              <div key={i} className="p-2 rounded-xl bg-stone-950/80 border border-amber-900/40 text-amber-300">
                <span className="font-bold block text-amber-200">🗣️ Rumor Mill</span>
                <span className="text-[11px] text-stone-400">{r.rumor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Gazette & Town Crier Dispatches */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-amber-200">
                The Realm Gazette & Whisper Mill
              </h3>
              <p className="text-xs text-stone-400">
                Public proclamations, tavern rumors, and faction intelligence gathered across the campaign.
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-bold">
            {(['all', 'faction', 'quest', 'rumor', 'weather'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-stone-950 shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gazette Items Feed */}
        {filteredGazette.length === 0 ? (
          <div className="text-center py-12 text-stone-500 space-y-2">
            <Newspaper className="w-8 h-8 mx-auto text-stone-600" />
            <p className="text-sm">No dispatches currently recorded.</p>
            <p className="text-xs text-stone-600">Advance time or click "Evolve World with AI" above to generate realm rumors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGazette.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.category === 'faction'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : item.category === 'quest'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : item.category === 'weather'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {item.category}
                    </span>

                    <span className="text-[10px] text-stone-500 font-mono">
                      Day {item.timestampDay}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-stone-200 mt-2">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-900 flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${
                    item.urgency === 'critical' || item.urgency === 'high'
                      ? 'text-rose-400'
                      : item.urgency === 'moderate'
                      ? 'text-amber-400'
                      : 'text-stone-400'
                  }`}>
                    Urgency: {item.urgency}
                  </span>

                  <button
                    onClick={() => handleBroadcastToNotes(item)}
                    className="text-[11px] text-stone-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                    title="Send to Session Notes"
                  >
                    <Send className="w-3 h-3" />
                    <span>Copy to Notes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
