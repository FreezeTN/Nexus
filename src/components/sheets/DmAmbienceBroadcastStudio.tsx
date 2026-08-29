import React, { useState, useEffect } from 'react';
import {
  RadioTower,
  Crown,
  Lock,
  Music,
  Plus,
  Trash2,
  ListMusic,
  Play,
  Pause,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  Square
} from 'lucide-react';
import {
  parseExternalMediaUrl,
  getSavedExternalStreams,
  saveExternalStream,
  deleteExternalStream,
  ExternalAmbienceStream
} from '../../utils/externalAmbience';
import { UserProfile, GameSession, updateSessionAmbience } from '../../lib/firebase';
import { getEffectiveUserTier, isDeveloperUser } from '../../lib/subscription';

const CURATED_PARTY_STREAMS: Omit<ExternalAmbienceStream, 'id' | 'addedAt'>[] = [
  {
    title: 'Fantasy Medieval Tavern & Lute',
    url: 'https://www.youtube.com/watch?v=7bW75BM3m9A',
    sourceType: 'youtube',
    embedUrl: 'https://www.youtube-nocookie.com/embed/7bW75BM3m9A?autoplay=1&enablejsapi=1',
    category: 'tavern',
    description: 'Cozy rustic tavern lute tunes, crackling fireplace & background alehouse murmurs.'
  },
  {
    title: 'Epic Orchestral Combat & Boss Fights',
    url: 'https://www.youtube.com/watch?v=k1-TrAvp_xs',
    sourceType: 'youtube',
    embedUrl: 'https://www.youtube-nocookie.com/embed/k1-TrAvp_xs?autoplay=1&enablejsapi=1',
    category: 'combat',
    description: 'Intense cinematic orchestral battle soundtrack with heavy drums and brass sweeps.'
  },
  {
    title: 'D&D Atmospheric Exploration (Spotify)',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    sourceType: 'spotify',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0',
    category: 'exploration',
    description: 'Official Spotify fantasy gaming soundtrack playlist for exploration and journeying.'
  },
  {
    title: 'Deep Catacombs & Dark Dungeon Ambience',
    url: 'https://www.youtube.com/watch?v=jX6kn9_U8qk',
    sourceType: 'youtube',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jX6kn9_U8qk?autoplay=1&enablejsapi=1',
    category: 'dungeon',
    description: 'Eerie underground cavern reverberations, dripping water & low subterranean winds.'
  }
];

interface DmAmbienceBroadcastStudioProps {
  activeSession: GameSession;
  currentUser: UserProfile | null;
  onOpenUpgradeModal?: (reason?: string, tier?: 'hero' | 'guild') => void;
}

export const DmAmbienceBroadcastStudio: React.FC<DmAmbienceBroadcastStudioProps> = ({
  activeSession,
  currentUser,
  onOpenUpgradeModal
}) => {
  const [customStreams, setCustomStreams] = useState<ExternalAmbienceStream[]>(() => getSavedExternalStreams());
  const [inputUrl, setInputUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'tavern' | 'combat' | 'exploration' | 'dungeon' | 'mystic' | 'custom'>('exploration');
  const [urlParseError, setUrlParseError] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [broadcastToParty, setBroadcastToParty] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const effectiveTier = currentUser ? (isDeveloperUser(currentUser) ? 'developer' : getEffectiveUserTier(currentUser)) : 'free';
  const hasSubscription = effectiveTier === 'hero' || effectiveTier === 'guild' || effectiveTier === 'developer';

  const liveAmbience = activeSession?.activeAmbience;
  const isPlaying = Boolean(liveAmbience?.isPlaying && liveAmbience?.embedUrl);

  const requireSubscription = (actionName: string): boolean => {
    if (!hasSubscription) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal(
          `${actionName} requires a Hero or Guild Master subscription. Unlock YouTube & Spotify stream broadcasting for your entire party!`,
          'hero'
        );
      }
      return false;
    }
    return true;
  };

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSubscription('Adding external ambient stream links')) return;

    setUrlParseError(null);
    const parsed = parseExternalMediaUrl(inputUrl);
    if (!parsed.isValid) {
      setUrlParseError(parsed.error || 'Invalid link format.');
      return;
    }

    const title = customTitle.trim() || parsed.titleSuggestion;
    const newStream = saveExternalStream({
      title,
      url: inputUrl.trim(),
      sourceType: parsed.sourceType,
      embedUrl: parsed.embedUrl,
      category: selectedCategory,
      addedBy: currentUser?.displayName || 'Dungeon Master'
    });

    setCustomStreams(getSavedExternalStreams());
    setInputUrl('');
    setCustomTitle('');
    handleSelectStream(newStream);
  };

  const handleDeleteStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteExternalStream(id);
    setCustomStreams(getSavedExternalStreams());
  };

  const handleSelectStream = async (stream: ExternalAmbienceStream | Omit<ExternalAmbienceStream, 'id' | 'addedAt'>) => {
    if (!requireSubscription('Selecting and streaming ambient audio')) return;

    const streamObj: ExternalAmbienceStream = {
      ...stream,
      id: (stream as any).id || `curated_${Date.now()}`
    };

    try {
      await updateSessionAmbience(activeSession.code, {
        streamId: streamObj.id,
        title: streamObj.title,
        url: streamObj.url,
        sourceType: streamObj.sourceType,
        embedUrl: streamObj.embedUrl,
        isPlaying: true,
        category: streamObj.category,
        changedBy: currentUser?.displayName || 'Dungeon Master',
        updatedAt: new Date().toISOString()
      });
      setBroadcastStatus(`Now broadcasting "${streamObj.title}" to room ${activeSession.code}`);
      setTimeout(() => setBroadcastStatus(null), 3500);
    } catch (err) {
      console.warn('Failed to update session ambience:', err);
    }
  };

  const handleTogglePlayback = async () => {
    if (!requireSubscription('Ambient audio playback')) return;
    if (!liveAmbience?.embedUrl) return;

    const nextState = !liveAmbience.isPlaying;
    try {
      await updateSessionAmbience(activeSession.code, {
        ...liveAmbience,
        isPlaying: nextState,
        changedBy: currentUser?.displayName || 'Dungeon Master',
        updatedAt: new Date().toISOString()
      });
      setBroadcastStatus(nextState ? 'Ambience playback resumed' : 'Ambience paused for party');
      setTimeout(() => setBroadcastStatus(null), 3000);
    } catch (err) {
      console.warn('Failed to toggle session ambience:', err);
    }
  };

  const handleStopAmbience = async () => {
    if (!liveAmbience?.embedUrl) return;
    try {
      await updateSessionAmbience(activeSession.code, {
        ...liveAmbience,
        isPlaying: false,
        embedUrl: '',
        title: 'Playback stopped',
        changedBy: currentUser?.displayName || 'Dungeon Master',
        updatedAt: new Date().toISOString()
      });
      setBroadcastStatus('Ambience stream stopped');
      setTimeout(() => setBroadcastStatus(null), 3000);
    } catch (err) {
      console.warn('Failed to stop session ambience:', err);
    }
  };

  return (
    <div className="bg-stone-950/90 p-4 sm:p-5 rounded-2xl border border-amber-900/50 space-y-4 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950/90 border border-amber-600/60 text-amber-400 rounded-xl shadow-inner">
            <RadioTower className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-extrabold text-amber-200 text-base">
                DM Campaign Music & Ambience Broadcaster
              </h2>
              <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-amber-400" /> Hero & Guild Master
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Broadcast YouTube & Spotify audio live to all players in session{' '}
              <strong className="text-amber-300 font-mono">{activeSession.code}</strong>. Audio continues playing in the background as players swap character sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasSubscription && (
            <button
              type="button"
              onClick={() => onOpenUpgradeModal?.('Ambient audio streaming requires a Hero or Guild Master subscription.', 'hero')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock Broadcaster</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-700/80 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {isExpanded ? 'Collapse Studio' : 'Expand Studio'}
          </button>
        </div>
      </div>

      {/* Subscription Callout if on Free Tier */}
      {!hasSubscription && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>Hero Supporter / Guild Master Subscription Required:</strong>
            <p className="text-stone-300">
              Live YouTube soundtrack & Spotify playlist broadcasting to campaign party rooms is a premium supporter feature. Upgrade to <strong>Hero Supporter ($3.99/mo)</strong> or <strong>Guild Master ($8.99/mo)</strong> to broadcast unlimited audio to your players!
            </p>
          </div>
        </div>
      )}

      {/* Live Broadcast Status Notice */}
      {broadcastStatus && (
        <div className="p-2.5 bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{broadcastStatus}</span>
        </div>
      )}

      {/* Active Broadcast HUD Card */}
      {liveAmbience?.embedUrl && (
        <div className="bg-stone-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${isPlaying ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}>
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-100">{liveAmbience.title || 'Campaign Stream'}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {liveAmbience.sourceType || 'stream'}
                  </span>
                  {isPlaying ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Live to Party
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full">
                      Paused
                    </span>
                  )}
                </div>
                <a
                  href={liveAmbience.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 truncate max-w-md mt-0.5"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{liveAmbience.url}</span>
                </a>
              </div>
            </div>

            {hasSubscription && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-stone-950" />
                      <span>Pause Stream</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-stone-200" />
                      <span>Resume Stream</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStopAmbience}
                  className="px-3 py-2 bg-stone-900 hover:bg-rose-950/80 hover:text-rose-300 border border-stone-700 hover:border-rose-700 text-stone-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="Stop and clear active ambience stream"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Add New Custom Link Form */}
          <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" /> Add YouTube or Spotify Link to Campaign Library
              </span>
              <span className="text-[10px] text-stone-400 font-sans">
                Paste any YouTube video/playlist or Spotify track/album/playlist
              </span>
            </div>

            <form onSubmit={handleAddCustomStream} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1">
                    Media URL (YouTube / Spotify)
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/playlist?list=... or spotify.com/..."
                    value={inputUrl}
                    onChange={(e) => {
                      setInputUrl(e.target.value);
                      setUrlParseError(null);
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1">
                    Custom Soundtrack Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tomb of Horrors Boss Theme"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-400 text-[11px]">Atmosphere Tag:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="exploration">Exploration & Travel</option>
                    <option value="combat">Combat & Boss Fight</option>
                    <option value="tavern">Tavern & Cozy</option>
                    <option value="dungeon">Dungeon & Catacombs</option>
                    <option value="mystic">Mystic & Arcane</option>
                    <option value="custom">Custom Theme</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Link & Broadcast</span>
                </button>
              </div>

              {urlParseError && (
                <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800 p-2 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{urlParseError}</span>
                </div>
              )}
            </form>
          </div>

          {/* Saved & Curated Playlists Selection Grid */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-amber-400" /> Campaign Playlists & Atmosphere Library
              </span>
              <span className="text-[10px] text-stone-400 font-sans">
                Click any soundtrack below to instantly broadcast it to the party
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Custom Saved User Streams */}
              {customStreams.map((stream) => {
                const isSelected = liveAmbience?.url === stream.url;
                return (
                  <div
                    key={stream.id}
                    onClick={() => handleSelectStream(stream)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected && isPlaying
                        ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500/40 text-amber-100'
                        : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/50 hover:bg-stone-850 text-stone-200'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{stream.title}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                          {stream.sourceType}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{stream.url}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && isPlaying && (
                        <span className="flex h-2.5 w-2.5 relative mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteStream(stream.id, e)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition"
                        title="Delete stream"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Curated Default Playlist Templates */}
              {CURATED_PARTY_STREAMS.map((stream, idx) => {
                const isSelected = liveAmbience?.url === stream.url;
                return (
                  <div
                    key={`curated_${idx}`}
                    onClick={() => handleSelectStream(stream)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected && isPlaying
                        ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500/40 text-amber-100'
                        : 'bg-stone-900/90 border-stone-800 hover:border-amber-600/50 hover:bg-stone-850 text-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{stream.title}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {stream.sourceType}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-stone-400 leading-tight">{stream.description}</p>
                      </div>

                      {!hasSubscription ? (
                        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : isSelected && isPlaying ? (
                        <span className="flex h-2.5 w-2.5 relative mt-1 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
