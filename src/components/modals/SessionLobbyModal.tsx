import React, { useState, useEffect } from 'react';
import { CharacterData } from '../../types';
import { 
  UserProfile, 
  GameSession, 
  createGameSession, 
  joinGameSessionByCode, 
  leaveGameSession, 
  closeGameSession, 
  updateSessionMemberCharacter,
  CharacterPresence 
} from '../../lib/firebase';
import { 
  Users, 
  Sparkles, 
  Copy, 
  Check, 
  Crown, 
  Shield, 
  Heart, 
  Eye, 
  LogOut, 
  Power, 
  Plus, 
  Key, 
  UserCheck, 
  Share2, 
  X,
  Radio,
  UserPlus
} from 'lucide-react';
import { getPassivePerception, getEffectiveMaxHp } from '../../utils/dndCalculations';

interface SessionLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  activeSession: GameSession | null;
  activeCharacter: CharacterData;
  allCharacters: CharacterData[];
  presenceMap?: Record<string, CharacterPresence>;
  onSessionChange: (sessionCode: string | null) => void;
  onSelectCharacter: (charId: string) => void;
  onOpenAuthModal?: () => void;
}

export const SessionLobbyModal: React.FC<SessionLobbyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeSession,
  activeCharacter,
  allCharacters,
  presenceMap = {},
  onSessionChange,
  onSelectCharacter,
  onOpenAuthModal
}) => {
  const [tab, setTab] = useState<'current' | 'join' | 'create'>('current');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCharId, setSelectedCharId] = useState(activeCharacter?.id || '');
  const [newSessionName, setNewSessionName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeEdition = activeCharacter?.edition || '5e';
  const playerCharacters = allCharacters.filter(c => 
    !c.isMonster && 
    !c.isVendor && 
    (c.edition || '5e') === activeEdition
  );

  useEffect(() => {
    if (activeCharacter?.id && !activeCharacter.isMonster && !activeCharacter.isVendor) {
      setSelectedCharId(activeCharacter.id);
    } else if (playerCharacters.length > 0) {
      setSelectedCharId(playerCharacters[0].id);
    }
  }, [activeCharacter?.id, activeEdition]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (activeSession) {
        setTab('current');
      } else {
        setTab('join');
      }
    }
  }, [isOpen, activeSession]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!activeSession) return;
    navigator.clipboard.writeText(activeSession.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const url = `${window.location.origin}${window.location.pathname}?session=${activeSession.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      setErrorMsg('Please enter a 6-digit room code.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const userObj = {
        uid: currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 7),
        displayName: currentUser?.displayName || 'Adventurer',
        role: currentUser?.role || 'Player'
      };

      const selectedChar = allCharacters.find(c => c.id === selectedCharId) || activeCharacter;
      const charObj = selectedChar ? { id: selectedChar.id, name: selectedChar.name } : undefined;

      const joined = await joinGameSessionByCode(joinCode, userObj, charObj);
      onSessionChange(joined.code);
      setTab('current');
      setJoinCode('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join session. Please check the room code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const userObj = {
        uid: currentUser?.uid || 'dm_' + Math.random().toString(36).substring(2, 7),
        displayName: currentUser?.displayName || 'Dungeon Master'
      };

      const newSession = await createGameSession(userObj, newSessionName || 'Campaign Session');
      onSessionChange(newSession.code);
      setTab('current');
      setNewSessionName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!activeSession) return;
    const uid = currentUser?.uid || 'guest_player';
    try {
      await leaveGameSession(activeSession.code, uid);
    } catch (e) {}
    onSessionChange(null);
    setTab('join');
  };

  const handleCloseSession = async () => {
    if (!activeSession || !currentUser?.uid) return;
    if (!window.confirm('Are you sure you want to end this session for all players?')) return;
    try {
      await closeGameSession(activeSession.code, currentUser.uid);
    } catch (e) {}
    onSessionChange(null);
    setTab('join');
  };

  const handleChangeCharacter = async (newCharId: string) => {
    setSelectedCharId(newCharId);
    onSelectCharacter(newCharId);
    if (activeSession && currentUser?.uid) {
      const charObj = allCharacters.find(c => c.id === newCharId);
      if (charObj) {
        await updateSessionMemberCharacter(activeSession.code, currentUser.uid, {
          id: charObj.id,
          name: charObj.name
        });
      }
    }
  };

  const isDmOfSession = activeSession && currentUser && activeSession.dmUid === currentUser.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/80 border border-amber-600/50 text-amber-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-200">
                Multiplayer Session Lobby
              </h2>
              <p className="text-xs text-stone-400">
                Sync live character stats, rolls & presence with your DM and party
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-4 pt-2 gap-2 text-xs font-bold">
          {activeSession && (
            <button
              onClick={() => setTab('current')}
              className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 ${
                tab === 'current'
                  ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Active Session ({activeSession.code})</span>
            </button>
          )}

          <button
            onClick={() => setTab('join')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 ${
              tab === 'join'
                ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Join with Room Code</span>
          </button>

          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 ${
              tab === 'create'
                ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Host New Campaign (DM)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {/* TAB 1: ACTIVE SESSION LOBBY */}
          {tab === 'current' && activeSession && (
            <div className="space-y-5">
              {/* Session Banner */}
              <div className="bg-stone-950 border border-amber-600/40 rounded-2xl p-4 md:p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/90 border border-amber-700/60 px-2.5 py-0.5 rounded-full">
                        👑 DM: {activeSession.dmName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Session
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-extrabold text-amber-100 mt-1">
                      {activeSession.name}
                    </h3>
                  </div>

                  {/* Room Code Display Box */}
                  <div className="bg-stone-900/90 border border-stone-700 p-3 rounded-xl flex items-center gap-3">
                    <div>
                      <div className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">6-Digit Room Code</div>
                      <div className="text-2xl font-mono font-black text-amber-300 tracking-widest">
                        {activeSession.code}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Copy Room Code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition flex items-center gap-1"
                        title="Copy direct invite URL"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Picker for active session */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-medium">Your Active Character in Session:</span>
                    <select
                      value={selectedCharId}
                      onChange={(e) => handleChangeCharacter(e.target.value)}
                      className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-amber-200 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {playerCharacters.length === 0 ? (
                        <option value="">No player characters found for active TRPG</option>
                      ) : (
                        playerCharacters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Lvl {c.level} {c.characterClass})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLeave}
                      className="px-3 py-1 bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Session</span>
                    </button>
                    {isDmOfSession && (
                      <button
                        onClick={handleCloseSession}
                        className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>End Session (DM)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Roster List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase font-bold text-stone-400">
                  <span>Connected Group Members ({activeSession.members?.length || 0})</span>
                  <span>Active Campaign Session</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {(activeSession.members || []).map((m) => {
                    const charObj = allCharacters.find(c => c.id === m.characterId);
                    const isUserMe = currentUser && m.uid === currentUser.uid;

                    return (
                      <div
                        key={m.uid}
                        className={`p-3 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 ${
                          m.role === 'DM'
                            ? 'bg-purple-950/40 border-purple-800/80'
                            : 'bg-stone-950/80 border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${
                            m.role === 'DM' ? 'bg-purple-900/60 border-purple-500/50 text-purple-300' : 'bg-stone-900 border-stone-700 text-amber-400'
                          }`}>
                            {m.role === 'DM' ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-100 text-sm">{m.displayName}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold uppercase ${
                                m.role === 'DM' ? 'bg-purple-900/80 text-purple-200 border border-purple-600' : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {m.role}
                              </span>
                              {isUserMe && (
                                <span className="text-[10px] font-mono bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded">You</span>
                              )}
                            </div>
                            <div className="text-xs text-stone-400">
                              {m.role === 'DM' ? 'Campaign Controller & Host' : (
                                charObj ? `${charObj.name} • Level ${charObj.level} ${charObj.characterClass}` : (m.characterName || 'No character selected')
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Character Quick Stats Preview */}
                        {charObj && m.role !== 'DM' && (
                          <div className="flex items-center gap-3 text-xs font-mono bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
                            <div className="flex items-center gap-1 text-emerald-300 font-bold">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                              <span>{charObj.hpCurrent} / {getEffectiveMaxHp(charObj)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                              <Shield className="w-3.5 h-3.5 text-amber-500" />
                              <span>AC {charObj.armorClass}</span>
                            </div>
                            <div className="flex items-center gap-1 text-stone-300">
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>PP {getPassivePerception(charObj)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JOIN SESSION BY CODE */}
          {tab === 'join' && (
            <div className="space-y-4">
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" /> Enter 6-Digit Room Code
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Ask your DM for their 6-character campaign room code (e.g. <code>DRAGON</code> or <code>8X4K2P</code>) to join their live group.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-300 font-bold mb-1">
                      Room Code
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DRAGON or 8X4K2P"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-xl font-mono font-bold tracking-widest text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-500 text-center uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-300 font-bold mb-1">
                      Select Your Character
                    </label>
                    <select
                      value={selectedCharId}
                      onChange={(e) => setSelectedCharId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      {playerCharacters.length === 0 ? (
                        <option value="">No player characters found for active TRPG</option>
                      ) : (
                        playerCharacters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} (Lvl {c.level} {c.characterClass})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    onClick={handleJoinSession}
                    disabled={isLoading || !joinCode.trim()}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 rounded-xl font-serif font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span>Connecting to Room...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Join Session Lobby</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW SESSION */}
          {tab === 'create' && (
            <div className="space-y-4">
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" /> Host New Campaign Session (DM)
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Create a dedicated room code for your campaign session. Share the code with your players so everyone syncs in real-time.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-300 font-bold mb-1">
                      Campaign Session Name
                    </label>
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="e.g. Curse of Strahd - Session 12"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleCreateSession}
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded-xl font-serif font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 border border-purple-500/40"
                  >
                    {isLoading ? (
                      <span>Generating Room Code...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Generate 6-Digit Room Code & Open Lobby</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs text-stone-400">
          <span>Multiplayer Sync Powered by Firebase Firestore</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-bold transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
