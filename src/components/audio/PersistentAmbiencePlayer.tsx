import React, { useState, useEffect } from 'react';
import {
  RadioTower,
  Volume2,
  VolumeX,
  Music,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Radio
} from 'lucide-react';
import { GameSession, UserProfile } from '../../lib/firebase';

interface PersistentAmbiencePlayerProps {
  activeSession: GameSession | null;
  currentUser: UserProfile | null;
}

export const PersistentAmbiencePlayer: React.FC<PersistentAmbiencePlayerProps> = ({
  activeSession,
  currentUser
}) => {
  const [locallyMuted, setLocallyMuted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeAmbience = activeSession?.activeAmbience;
  const isBroadcastPlaying = Boolean(
    activeAmbience &&
    activeAmbience.isPlaying &&
    activeAmbience.embedUrl &&
    activeAmbience.embedUrl.trim().length > 0
  );

  // If activeAmbience changes or stops, collapse expanded view
  useEffect(() => {
    if (!isBroadcastPlaying) {
      setIsExpanded(false);
    }
  }, [isBroadcastPlaying, activeAmbience?.embedUrl]);

  if (!isBroadcastPlaying || !activeAmbience?.embedUrl) {
    return null;
  }

  const isDm = Boolean(currentUser && activeSession && (activeSession.dmUid === currentUser.uid || currentUser.role === 'DM'));

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end pointer-events-auto select-none">
      {/* 
        Persistent Single Iframe Container:
        This DOM node is ALWAYS mounted when isBroadcastPlaying is true.
        We change its CSS styling between expanded frame and hidden background audio
        so the iframe NEVER unmounts, restarts, or glitches when swapping sheets or toggling expand!
      */}
      {!locallyMuted && (
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'mb-2 w-80 sm:w-96 rounded-2xl border border-amber-500/60 bg-black/95 shadow-2xl backdrop-blur-md opacity-100 max-h-[400px]'
              : 'w-0 h-0 opacity-0 pointer-events-none max-h-0 border-none m-0 p-0'
          }`}
        >
          {isExpanded && (
            <div className="p-2.5 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-serif font-bold text-amber-200 truncate">
                  {activeAmbience.title || 'Campaign Ambience'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                title="Minimize player frame"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="w-full">
            {activeAmbience.sourceType === 'spotify' ? (
              <iframe
                src={activeAmbience.embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={activeAmbience.title || 'Spotify Player'}
                className="w-full"
              />
            ) : (
              <div className="aspect-video w-full">
                <iframe
                  src={activeAmbience.embedUrl}
                  title={activeAmbience.title || 'YouTube Player'}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Campaign Audio Pill / Bar */}
      <div className="bg-stone-950/90 border border-amber-500/50 rounded-2xl px-3.5 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs text-stone-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center p-1.5 bg-amber-950/80 border border-amber-600/60 text-amber-400 rounded-xl shadow-inner">
            <RadioTower className="w-4 h-4 animate-pulse text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-950" />
          </div>

          <div className="min-w-0 max-w-[160px] sm:max-w-[240px]">
            <div className="font-bold text-amber-200 text-xs truncate flex items-center gap-1.5">
              <span className="truncate">{activeAmbience.title || 'Campaign Ambience'}</span>
              <span className="text-[9px] font-mono uppercase bg-amber-950 text-amber-300 border border-amber-800 px-1 rounded shrink-0">
                {activeAmbience.sourceType || 'stream'}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 truncate">
              {isDm ? 'Broadcasting live to party' : `DM ${activeAmbience.changedBy || 'Party'} Stream`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-stone-800">
          {/* Expand/View Visual Player */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-900 rounded-lg transition cursor-pointer"
            title={isExpanded ? 'Hide visual frame' : 'Open visual player'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Personal Mute Toggle */}
          <button
            type="button"
            onClick={() => setLocallyMuted(!locallyMuted)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              locallyMuted
                ? 'text-rose-400 bg-rose-950/80 hover:bg-rose-900'
                : 'text-stone-300 hover:text-amber-300 hover:bg-stone-900'
            }`}
            title={locallyMuted ? 'Unmute personal audio' : 'Mute personal audio (does not affect party)'}
          >
            {locallyMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
