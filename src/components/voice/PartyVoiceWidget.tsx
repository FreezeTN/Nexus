import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Radio, 
  Users, 
  Sliders, 
  ShieldAlert,
  Sparkles,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { voiceManager, VoicePeerState } from '../../lib/voiceChatService';
import { GameSession, UserProfile } from '../../lib/firebase';

interface PartyVoiceWidgetProps {
  activeSession: GameSession | null;
  currentUser: UserProfile | null;
  activeCharacterName?: string;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const PartyVoiceWidget: React.FC<PartyVoiceWidgetProps> = ({
  activeSession,
  currentUser,
  activeCharacterName,
  isOpenModal,
  onCloseModal
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [peers, setPeers] = useState<VoicePeerState[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [isPttPressed, setIsPttPressed] = useState<boolean>(false);
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});

  const [customRoomCode, setCustomRoomCode] = useState<string>('PARTY1');
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const displayRoomCode = (activeSession?.code || customRoomCode || 'PARTY1').trim().toUpperCase();

  // PTT keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hold Spacebar or CapsLock or ~ key for PTT if enabled and not typing in an input
      if (!isPushToTalk) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space' || e.code === 'CapsLock' || e.code === 'Backquote') {
        setIsPttPressed(true);
        voiceManager.setPttPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isPushToTalk) return;
      if (e.code === 'Space' || e.code === 'CapsLock' || e.code === 'Backquote') {
        setIsPttPressed(false);
        voiceManager.setPttPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk]);

  // Subscribe to Voice Manager state
  useEffect(() => {
    const unsubPeers = voiceManager.onPeersChange((peerList) => {
      setPeers(peerList);
    });

    const unsubStatus = voiceManager.onStatusChange((status, error) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
      if (error) setErrorMessage(error);
      else setErrorMessage('');
    });

    return () => {
      unsubPeers();
      unsubStatus();
    };
  }, []);

  // Reset dismissed state when modal is toggled open
  useEffect(() => {
    if (isOpenModal) {
      setIsDismissed(false);
    }
  }, [isOpenModal]);

  // Handle Join / Leave Voice
  const handleToggleVoiceConnection = async () => {
    if (isConnected || connectionStatus === 'connecting') {
      voiceManager.leaveVoice();
    } else {
      const user = {
        uid: currentUser?.uid || 'guest_' + Math.random().toString(36).slice(2, 7),
        displayName: currentUser?.displayName || 'Adventurer',
        role: currentUser?.role || 'Player',
        characterName: activeCharacterName
      };

      await voiceManager.joinVoice(displayRoomCode, user);
    }
  };

  const handleMuteToggle = () => {
    const muted = voiceManager.toggleMute();
    setIsMuted(muted);
  };

  const handleDeafenToggle = () => {
    const deafened = voiceManager.toggleDeafen();
    setIsDeafened(deafened);
  };

  const handlePttToggle = (enabled: boolean) => {
    setIsPushToTalk(enabled);
    voiceManager.setPushToTalkMode(enabled);
  };

  const handleVolumeChange = (uid: string, newVolume: number) => {
    voiceManager.setUserVolume(uid, newVolume);
    setUserVolumes(prev => ({ ...prev, [uid]: newVolume }));
  };

  return (
    <>
      {/* Floating Bottom-Left Party Voice Bar (Positioned on bottom-left to avoid overlapping Dice Tray on bottom-right) */}
      {!isDismissed && (
        <div className="fixed bottom-4 left-4 md:left-6 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-80 md:w-96 text-slate-100">
          
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Radio className={`w-5 h-5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' :
                  connectionStatus === 'connecting' ? 'bg-amber-400 animate-ping' :
                  connectionStatus === 'error' ? 'bg-rose-500' : 'bg-slate-600'
                }`} />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide uppercase text-indigo-300 flex items-center gap-1.5">
                  <span>Party Voice Client</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 font-mono font-bold">
                    #{displayRoomCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                  {activeSession ? activeSession.name : 'Adventurer Voice Room'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition ${showSettings ? 'bg-indigo-600/40 text-indigo-300' : 'hover:bg-slate-800 text-slate-400'}`}
                title="Voice Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition"
                title={isExpanded ? "Collapse" : "Expand Voice Panel"}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Hide Floating Voice Bar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Quick Voice Bar Controls */}
        <div className="px-3 py-2.5 bg-slate-900/80 flex items-center justify-between border-b border-slate-800/60">
          {isConnected ? (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleMuteToggle}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                    isMuted 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                  <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  onClick={handleDeafenToggle}
                  className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                    isDeafened 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
                >
                  {isDeafened ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                  <span className="hidden sm:inline">{isDeafened ? 'Deafened' : 'Deafen'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200">{peers.length}</span>
                </div>
                <button
                  onClick={handleToggleVoiceConnection}
                  className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              {!activeSession ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Room:</span>
                  <input
                    type="text"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="PARTY1"
                    className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span>Voice Channel Offline</span>
                </div>
              )}
              <button
                onClick={handleToggleVoiceConnection}
                disabled={connectionStatus === 'connecting'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 ml-auto"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Voice'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="px-3 py-2 bg-rose-950/60 border-b border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Settings Drawer */}
        {showSettings && (
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-3 text-xs">
            <div className="font-semibold text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Audio & Microphone Config
              </span>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-medium">Input Mode</span>
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => handlePttToggle(false)}
                  className={`px-2 py-1 rounded-md text-[11px] transition ${!isPushToTalk ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
                >
                  Voice Activity
                </button>
                <button
                  onClick={() => handlePttToggle(true)}
                  className={`px-2 py-1 rounded-md text-[11px] transition ${isPushToTalk ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
                >
                  Push-To-Talk
                </button>
              </div>
            </div>

            {isPushToTalk && (
              <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/40 text-[11px] text-indigo-200">
                Hold <kbd className="px-1.5 py-0.5 bg-indigo-900 border border-indigo-700 rounded text-xs font-mono font-bold text-white">Spacebar</kbd> or <kbd className="px-1.5 py-0.5 bg-indigo-900 border border-indigo-700 rounded text-xs font-mono font-bold text-white">CapsLock</kbd> while speaking.
              </div>
            )}
          </div>
        )}

        {/* Expanded Active Party Members Speaker List */}
        {isExpanded && isConnected && (
          <div className="p-3 max-h-60 overflow-y-auto space-y-2 bg-slate-950/60 divide-y divide-slate-800/50">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Connected Adventurers ({peers.length})
            </div>

            {peers.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center italic">
                Waiting for party members to join voice channel...
              </div>
            ) : (
              peers.map((peer) => {
                const vol = userVolumes[peer.uid] ?? 1.0;
                const isSelf = peer.uid === (currentUser?.uid || 'guest');

                return (
                  <div key={peer.uid} className="pt-2 pb-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar with speaking aura */}
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full bg-slate-800 border flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            peer.isSpeaking 
                              ? 'border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50 scale-105 shadow-md shadow-emerald-900/50' 
                              : peer.isMuted ? 'border-rose-500/50 text-slate-400' : 'border-slate-700 text-indigo-300'
                          }`}>
                            {peer.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          {peer.isSpeaking && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                            <span>{peer.displayName}</span>
                            {isSelf && <span className="text-[10px] bg-slate-800 text-indigo-300 px-1 rounded">(You)</span>}
                            {peer.role === 'DM' && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">DM</span>}
                          </div>
                          {peer.characterName && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {peer.characterName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {peer.isMuted && <span title="Microphone Muted"><MicOff className="w-3.5 h-3.5 text-rose-400" /></span>}
                        {peer.isDeafened && <span title="Audio Deafened"><VolumeX className="w-3.5 h-3.5 text-amber-400" /></span>}
                        {peer.isSpeaking && !peer.isMuted && (
                          <div className="flex items-end gap-0.5 h-3.5">
                            <span className="w-0.5 h-full bg-emerald-400 rounded animate-bounce" />
                            <span className="w-0.5 h-2/3 bg-emerald-400 rounded animate-bounce [animation-delay:0.15s]" />
                            <span className="w-0.5 h-full bg-emerald-400 rounded animate-bounce [animation-delay:0.3s]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Per-User Volume Control */}
                    {!isSelf && (
                      <div className="flex items-center gap-2 pl-10 text-[10px] text-slate-400">
                        <Volume2 className="w-3 h-3 text-slate-500 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={vol}
                          onChange={(e) => handleVolumeChange(peer.uid, parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                        />
                        <span className="w-8 text-right font-mono">{Math.round(vol * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      )}

      {/* Full Modal View if requested */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Party Voice Channel</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono font-bold">
                      #{displayRoomCode}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time low-latency WebRTC audio voice client for party session members
                  </p>
                </div>
              </div>

              <button
                onClick={onCloseModal}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-slate-200">Connection Status</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span>{isConnected ? 'Connected to Voice Channel' : 'Disconnected'}</span>
                  </div>
                </div>

                <button
                  onClick={handleToggleVoiceConnection}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${
                    isConnected 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  {isConnected ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span>{isConnected ? 'Disconnect Voice' : 'Connect Microphone'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Party Members in Voice Room ({peers.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {peers.map((peer) => (
                    <div 
                      key={peer.uid} 
                      className={`p-3.5 rounded-2xl border transition-all ${
                        peer.isSpeaking 
                          ? 'bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                            peer.isSpeaking 
                              ? 'bg-emerald-900/40 border-emerald-400 text-emerald-200 ring-4 ring-emerald-500/20' 
                              : 'bg-slate-800 border-slate-700 text-slate-200'
                          }`}>
                            {peer.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                              <span>{peer.displayName}</span>
                              {peer.role === 'DM' && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">DM</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-[140px]">
                              {peer.characterName || 'Player'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {peer.isMuted && <MicOff className="w-4 h-4 text-rose-400" />}
                          {peer.isDeafened && <VolumeX className="w-4 h-4 text-amber-400" />}
                          {peer.isSpeaking && !peer.isMuted && (
                            <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                              Speaking
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={onCloseModal}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
