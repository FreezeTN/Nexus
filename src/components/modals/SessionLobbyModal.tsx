import React, { useState, useEffect } from 'react';
import { CharacterData, OptionalRulesConfig, CampaignSaveFile } from '../../types';
import { 
  UserProfile, 
  GameSession, 
  createGameSession, 
  joinGameSessionByCode, 
  leaveGameSession, 
  closeGameSession, 
  updateSessionMemberCharacter,
  updateSessionOptionalRules,
  addParticipantCharacterToSession,
  removeParticipantCharacterFromSession,
  CharacterPresence,
  saveCampaignProgress,
  loadHostCampaignSaves,
  deleteCampaignSave,
  saveCharacterToCloud
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
  EyeOff,
  LogOut, 
  Power, 
  Plus, 
  Trash2,
  Key, 
  UserCheck, 
  Share2, 
  X,
  Radio,
  UserPlus,
  Settings,
  Scale,
  Swords,
  Brain,
  Dna,
  Layers,
  Zap,
  Crosshair,
  Lock,
  Sliders,
  RefreshCw,
  Save,
  Download,
  Upload,
  FolderOpen,
  History,
  CheckCircle2,
  Clock,
  FileText,
  Bookmark
} from 'lucide-react';
import { getPassivePerception, getEffectiveMaxHp } from '../../utils/dndCalculations';

interface CampaignRulesSelectorProps {
  rules: OptionalRulesConfig;
  onChangeRules: (updated: OptionalRulesConfig) => void;
  readOnly?: boolean;
}

export const CampaignRulesSelector: React.FC<CampaignRulesSelectorProps> = ({
  rules,
  onChangeRules,
  readOnly = false
}) => {
  const toggleRule = (key: keyof OptionalRulesConfig) => {
    if (readOnly) return;
    onChangeRules({
      ...rules,
      [key]: !rules[key]
    });
  };

  const applyPreset = (preset: 'default' | 'tactical' | 'high_power') => {
    if (readOnly) return;
    if (preset === 'default') {
      onChangeRules({});
    } else if (preset === 'tactical') {
      onChangeRules({
        useVariantEncumbrance: true,
        useFlankingRules: true,
        useGrittyRealismResting: true,
        useVariantCritDamage: true,
        useSanityRules: true,
        useMilestoneXp: true,
      });
    } else if (preset === 'high_power') {
      onChangeRules({
        useGestaltUA72: true,
        useDefenseBonusUA109: true,
        useArmorAsDRUA109: true,
        useFlankingRules: true,
        useMulticlassing: true,
        useHalfBreedSystem: true,
        hasPowerfulBuild: true,
      });
    }
  };

  const activeCount = Object.values(rules).filter(Boolean).length;

  return (
    <div className="bg-stone-950/80 border border-amber-900/40 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-bold text-amber-200 text-sm">
            Campaign Optional Rules & Variant Mechanics
          </span>
          {activeCount > 0 && (
            <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="text-stone-400 font-semibold">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('default')}
              className="px-2 py-0.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 transition"
            >
              Standard 5e
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tactical')}
              className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 rounded border border-amber-700/60 transition"
            >
              Gritty & Tactical
            </button>
            <button
              type="button"
              onClick={() => applyPreset('high_power')}
              className="px-2 py-0.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 rounded border border-purple-700/60 transition"
            >
              High Power / UA
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
        {/* Rule Items */}
        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useVariantEncumbrance ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useVariantEncumbrance}
            onChange={() => toggleRule('useVariantEncumbrance')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Scale className="w-3 h-3 text-amber-400 shrink-0" /> Variant Encumbrance
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              STR×5 lbs = Encumbered, STR×10 lbs = Heavy penalty.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useFlankingRules ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useFlankingRules}
            onChange={() => toggleRule('useFlankingRules')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Swords className="w-3 h-3 text-amber-400 shrink-0" /> Tactical Flanking
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Gain Advantage / +2 on melee attacks when flanking.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useGrittyRealismResting ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useGrittyRealismResting}
            onChange={() => toggleRule('useGrittyRealismResting')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400 shrink-0" /> Gritty Realism Resting
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Short Rest = 8 hours, Long Rest = 7 days.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useVariantCritDamage ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useVariantCritDamage}
            onChange={() => toggleRule('useVariantCritDamage')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" /> Variant Critical Damage
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Max initial damage die + roll second die.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useMilestoneXp ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useMilestoneXp}
            onChange={() => toggleRule('useMilestoneXp')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400 shrink-0" /> Milestone Progression
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Level up via DM story milestones instead of numerical XP.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useDiagonal5105Rules ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useDiagonal5105Rules}
            onChange={() => toggleRule('useDiagonal5105Rules')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400 shrink-0" /> 5/10/5 Diagonal Movement
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Alternating 5ft and 10ft cost for grid diagonal movement.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useSanityRules ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useSanityRules}
            onChange={() => toggleRule('useSanityRules')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Brain className="w-3 h-3 text-amber-400 shrink-0" /> Sanity & Madness System
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Sanity score & madness checks (DMG p.264).
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useGestaltUA72 ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useGestaltUA72}
            onChange={() => toggleRule('useGestaltUA72')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400 shrink-0" /> Gestalt Characters (UA)
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Dual class progression at every level (UA p.72).
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useDefenseBonusUA109 ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useDefenseBonusUA109}
            onChange={() => toggleRule('useDefenseBonusUA109')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400 shrink-0" /> Class Defense Bonus
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Scaling defense bonus to AC by level (UA p.109).
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useArmorAsDRUA109 ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useArmorAsDRUA109}
            onChange={() => toggleRule('useArmorAsDRUA109')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-amber-400 shrink-0" /> Armor as DR (UA109)
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Armor absorbs incoming damage (UA p.109/111).
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useHalfBreedSystem ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useHalfBreedSystem}
            onChange={() => toggleRule('useHalfBreedSystem')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Dna className="w-3 h-3 text-amber-400 shrink-0" /> Half-Breed Ancestry
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Dual-ancestry hybrid heritage rules & traits.
            </p>
          </div>
        </label>

        <label className={`flex items-start gap-2 bg-stone-900/90 border ${rules.useMulticlassing ? 'border-amber-600/60 bg-amber-950/20' : 'border-stone-800'} p-2.5 rounded-lg ${readOnly ? 'opacity-80' : 'cursor-pointer hover:border-amber-600/40'} transition`}>
          <input
            type="checkbox"
            disabled={readOnly}
            checked={!!rules.useMulticlassing}
            onChange={() => toggleRule('useMulticlassing')}
            className="accent-amber-500 w-3.5 h-3.5 rounded mt-0.5 shrink-0"
          />
          <div>
            <span className="font-bold text-stone-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 shrink-0" /> Multiclassing
            </span>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">
              Allow secondary class selection & dual XP allocation.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

interface SessionLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  activeSession: GameSession | null;
  activeSessionCode?: string | null;
  activeCharacter?: CharacterData | null;
  allCharacters: CharacterData[];
  presenceMap?: Record<string, CharacterPresence>;
  onSessionChange: (sessionCode: string | null) => void;
  onSelectCharacter: (charId: string) => void;
  onOpenAuthModal?: () => void;
  onLoadCampaignSave?: (save: CampaignSaveFile) => void;
}

export const SessionLobbyModal: React.FC<SessionLobbyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeSession,
  activeSessionCode,
  activeCharacter,
  allCharacters,
  presenceMap = {},
  onSessionChange,
  onSelectCharacter,
  onOpenAuthModal,
  onLoadCampaignSave
}) => {
  const [tab, setTab] = useState<'current' | 'join' | 'create' | 'saves'>('current');
  const [joinCode, setJoinCode] = useState('');
  const [selectedCharId, setSelectedCharId] = useState(activeCharacter?.id || '');
  const [newSessionName, setNewSessionName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sessionOptionalRules, setSessionOptionalRules] = useState<OptionalRulesConfig>(
    activeSession?.optionalRules || {}
  );
  const [isUpdatingRules, setIsUpdatingRules] = useState<boolean>(false);
  const [rulesSavedSuccess, setRulesSavedSuccess] = useState<boolean>(false);
  const [selectedParticipantCharIds, setSelectedParticipantCharIds] = useState<string[]>([]);
  const [selectedAddParticipantCharId, setSelectedAddParticipantCharId] = useState<string>('');
  const [isAddingParticipant, setIsAddingParticipant] = useState<boolean>(false);
  const [showRoomCode, setShowRoomCode] = useState<boolean>(true);
  const [confirmingEnd, setConfirmingEnd] = useState<boolean>(false);
  const [confirmDeleteSaveId, setConfirmDeleteSaveId] = useState<string | null>(null);

  // Campaign Saves State
  const [hostSaves, setHostSaves] = useState<CampaignSaveFile[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>('');
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const activeEdition = activeCharacter?.edition || '5e';
  const playerCharacters = allCharacters.filter(c => 
    !c.isMonster && 
    !c.isVendor && 
    c.characterClass?.toLowerCase() !== 'monster' &&
    (c.edition || '5e') === activeEdition
  );

  const fetchHostSaves = async () => {
    setIsLoadingSaves(true);
    try {
      const uid = currentUser?.uid || 'dm_local';
      const saves = await loadHostCampaignSaves(uid);
      setHostSaves(saves);
    } catch (e) {
      console.warn('Failed to load host saves', e);
    } finally {
      setIsLoadingSaves(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHostSaves();
    }
  }, [isOpen, currentUser?.uid]);

  useEffect(() => {
    if (activeCharacter?.id && !activeCharacter.isMonster && !activeCharacter.isVendor) {
      setSelectedCharId(activeCharacter.id);
    } else if (playerCharacters.length > 0) {
      setSelectedCharId(playerCharacters[0].id);
    }
  }, [activeCharacter?.id, activeEdition]);

  useEffect(() => {
    if (activeSession?.optionalRules) {
      setSessionOptionalRules(activeSession.optionalRules);
    }
  }, [activeSession?.optionalRules]);

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

      const initialChars = allCharacters
        .filter(c => selectedParticipantCharIds.includes(c.id))
        .map(c => ({ id: c.id, name: c.name }));

      const newSession = await createGameSession(userObj, newSessionName || 'Campaign Session', sessionOptionalRules, initialChars);
      onSessionChange(newSession.code);
      setTab('current');
      setNewSessionName('');
      setSelectedParticipantCharIds([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipantToActiveSession = async () => {
    if (!activeSession || !selectedAddParticipantCharId) return;
    const char = allCharacters.find(c => c.id === selectedAddParticipantCharId);
    if (!char) return;
    setIsAddingParticipant(true);
    setErrorMsg(null);
    try {
      await addParticipantCharacterToSession(activeSession.code, { id: char.id, name: char.name });
      setSelectedAddParticipantCharId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add participant character to session.');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleRemoveParticipantFromSession = async (memberUid: string) => {
    if (!activeSession) return;
    setErrorMsg(null);
    try {
      await removeParticipantCharacterFromSession(activeSession.code, memberUid);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member from session.');
    }
  };

  const handleSaveSessionRules = async () => {
    if (!activeSession) return;
    setIsUpdatingRules(true);
    setErrorMsg(null);
    try {
      await updateSessionOptionalRules(activeSession.code, sessionOptionalRules);
      setRulesSavedSuccess(true);
      setTimeout(() => setRulesSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update session optional rules.');
    } finally {
      setIsUpdatingRules(false);
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
    if (!activeSession) return;
    try {
      const dmUid = currentUser?.uid || activeSession.dmUid || 'dm_local';
      await closeGameSession(activeSession.code, activeSession.dmUid || dmUid);
    } catch (e) {
      console.warn('Could not close session in database:', e);
    }
    onSessionChange(null);
    setConfirmingEnd(false);
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

  // Campaign Save Implementation (DM only)
  const handleOpenSaveDialog = () => {
    if (!activeSession) return;
    const defaultName = `${activeSession.name} - Checkpoint (${new Date().toLocaleDateString()})`;
    setSaveName(defaultName);
    setSaveNotes('');
    setSaveSuccessMsg(null);
    setShowSaveModal(true);
  };

  const handleConfirmSaveCampaign = async () => {
    if (!activeSession) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Filter all characters strictly to the corresponding TRPG ruleset
      const trpgCharacters = allCharacters.filter(c => (c.edition || '5e') === activeEdition);

      const sessionMemberCharIds = new Set(
        (activeSession.members || [])
          .map(m => m.characterId)
          .filter(Boolean) as string[]
      );
      (activeSession.activeCharacterIds || []).forEach(id => sessionMemberCharIds.add(id));

      // Captured characters: only characters of the matching TRPG edition
      const capturedCharacters = trpgCharacters.filter(c => 
        sessionMemberCharIds.has(c.id) || 
        c.id === selectedCharId || 
        (c.isMonster !== true && c.characterClass?.toLowerCase() !== 'monster' && c.isVendor !== true)
      );

      // Fallback to all characters of this TRPG if no specific player characters matched
      const finalCaptured = capturedCharacters.length > 0 ? capturedCharacters : trpgCharacters;

      const saveId = `save_${activeSession.code}_${Date.now()}`;
      const saveFile: CampaignSaveFile = {
        id: saveId,
        name: saveName.trim() || `${activeSession.name} Checkpoint`,
        sessionCode: activeSession.code,
        hostUid: currentUser?.uid || activeSession.dmUid || 'dm_local',
        hostName: currentUser?.displayName || activeSession.dmName || 'Dungeon Master',
        savedAt: new Date().toISOString(),
        edition: activeEdition,
        notes: saveNotes.trim(),
        session: {
          name: activeSession.name,
          code: activeSession.code,
          optionalRules: sessionOptionalRules,
          members: (activeSession.members || []).map(m => ({
            uid: m.uid,
            displayName: m.displayName,
            role: m.role,
            characterId: m.characterId,
            characterName: m.characterName,
            isUnassignedParticipant: m.isUnassignedParticipant
          })),
          activeCharacterIds: activeSession.activeCharacterIds || []
        },
        characters: finalCaptured
      };

      await saveCampaignProgress(saveFile);
      setLastSavedId(saveId);
      setSaveSuccessMsg(`Campaign progress saved successfully as "${saveFile.name}"!`);
      await fetchHostSaves();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save campaign progress.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSave = async (save: CampaignSaveFile) => {
    if (!save) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (onLoadCampaignSave) {
        await onLoadCampaignSave(save);
      }
      if (save.sessionCode) {
        onSessionChange(save.sessionCode);
      }
      setSaveSuccessMsg(`Campaign checkpoint "${save.name}" loaded successfully!`);
      setTab('current');
      setShowSaveModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load campaign checkpoint.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    try {
      await deleteCampaignSave(saveId);
      setConfirmDeleteSaveId(null);
      await fetchHostSaves();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete campaign save.');
    }
  };

  const handleExportSaveJson = (save: CampaignSaveFile) => {
    const filename = `CampaignSave_${save.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${save.sessionCode}.json`;
    const jsonStr = JSON.stringify(save, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSaveJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as CampaignSaveFile;
        if (parsed && parsed.name && parsed.characters && Array.isArray(parsed.characters)) {
          parsed.id = parsed.id || `imported_save_${Date.now()}`;
          parsed.hostUid = currentUser?.uid || 'dm_local';
          await saveCampaignProgress(parsed);
          await fetchHostSaves();
          setSaveSuccessMsg(`Successfully imported "${parsed.name}" checkpoint!`);
          setTab('saves');
        } else {
          setErrorMsg('Invalid Campaign Save File structure.');
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse campaign save JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isDmOfSession = Boolean(
    activeSession && (
      (currentUser?.uid && activeSession.dmUid === currentUser.uid) ||
      currentUser?.role === 'DM' ||
      !activeSession.dmUid ||
      activeSession.dmUid.startsWith('dm_')
    )
  );
  const hasActiveSession = Boolean(activeSession || activeSessionCode);
  const activeTab = (!hasActiveSession && tab === 'current') ? 'join' : tab;

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
        <div className="border-b border-stone-800 bg-stone-950/60 p-2.5 sm:px-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs font-bold">
            {hasActiveSession && (
              <button
                onClick={() => setTab('current')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'current'
                    ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 bg-stone-900/50 border border-stone-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {activeSession ? `Active (${activeSession.name})` : `Active (${activeSessionCode})`}
                </span>
              </button>
            )}

            <button
              onClick={() => setTab('join')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                activeTab === 'join'
                  ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 bg-stone-900/50 border border-stone-800'
              }`}
            >
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span>Join Room</span>
            </button>

            <button
              onClick={() => setTab('create')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                activeTab === 'create'
                  ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 bg-stone-900/50 border border-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Host Campaign (DM)</span>
            </button>

            <button
              onClick={() => {
                setTab('saves');
                fetchHostSaves();
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                activeTab === 'saves'
                  ? 'bg-amber-600 text-stone-950 font-extrabold shadow-md'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 bg-stone-900/50 border border-stone-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Campaign Saves (DM)</span>
              {hostSaves.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                  activeTab === 'saves'
                    ? 'bg-stone-950 text-amber-400 border-stone-900'
                    : 'bg-amber-950 text-amber-300 border-amber-700/60'
                }`}>
                  {hostSaves.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          {/* TAB 1: ACTIVE SESSION LOBBY */}
          {activeTab === 'current' && (
            activeSession ? (
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

                  {/* Room Code Display Box with Streamer Hide/Reveal Toggle */}
                  <div className="bg-stone-900/90 border border-stone-700 p-3 rounded-xl flex items-center gap-3">
                    <div>
                      <div className="text-[9px] font-mono text-stone-400 uppercase tracking-widest flex items-center justify-between gap-2">
                        <span>Room Code</span>
                        <button
                          onClick={() => setShowRoomCode(!showRoomCode)}
                          className="text-stone-400 hover:text-amber-300 transition flex items-center gap-1 text-[9px] font-sans font-medium cursor-pointer"
                          title={showRoomCode ? "Hide room code (Streamer Mode)" : "Reveal room code"}
                        >
                          {showRoomCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showRoomCode ? 'Hide' : 'Reveal'}</span>
                        </button>
                      </div>
                      <div className="text-2xl font-mono font-black text-amber-300 tracking-widest">
                        {showRoomCode ? activeSession.code : '••••••'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Copy Room Code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                        title="Copy direct invite URL"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Picker for active session (Only for Players; DM controls campaign) */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {!isDmOfSession ? (
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
                          playerCharacters.map(c => {
                            const presence = presenceMap[c.id];
                            const activeUserId = presence?.activeUserId;
                            const activeUserName = presence?.activeUserName || 'Player';
                            const activeUserRole = presence?.activeUserRole;
                            const dmUserId = presence?.dmUserId;
                            const currentUserId = currentUser?.uid || 'guest_player';
                            const isPlayerRole = !currentUser || currentUser.role === 'Player';

                            const isLockedByOtherPlayer = isPlayerRole && 
                              !!activeUserId && 
                              activeUserId !== currentUserId && 
                              activeUserId !== dmUserId && 
                              activeUserRole !== 'DM';
                            const isCharDmActive = !!presence?.dmActive;

                            let label = `${c.name} (Lvl ${c.level} ${c.characterClass})`;
                            if (isLockedByOtherPlayer) {
                              label += ` [🔒 In Use: ${activeUserName}]`;
                            }
                            if (isCharDmActive) {
                              label += ` [👑 DM Active]`;
                            }

                            return (
                              <option key={c.id} value={c.id} disabled={isLockedByOtherPlayer}>
                                {label}
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-300 font-semibold bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-lg shadow-inner">
                      <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Campaign Host & DM Mode Active</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {isDmOfSession && (
                      <button
                        type="button"
                        onClick={handleOpenSaveDialog}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
                        title="Save current campaign checkpoint & character states"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Progress</span>
                      </button>
                    )}
                    <button
                      onClick={handleLeave}
                      className="px-3 py-1 bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Session</span>
                    </button>
                    {isDmOfSession && (
                      confirmingEnd ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button
                            onClick={handleCloseSession}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-lg cursor-pointer"
                            title="Confirm and end session for all players"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm End?</span>
                          </button>
                          <button
                            onClick={() => setConfirmingEnd(false)}
                            className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingEnd(true)}
                          className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="End multiplayer session for all players"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>End Session (DM)</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Roster List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono uppercase font-bold text-stone-400">
                  <span>Connected Group Members ({activeSession.members?.length || 0})</span>
                  <span>Active Campaign Session</span>
                </div>

                {/* DM Participant Quick Add */}
                {isDmOfSession && (
                  <div className="bg-stone-950 p-3 rounded-xl border border-purple-800/50 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-serif font-bold text-purple-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" /> Add Participant Characters to Session (NPCs / Unassigned PCs)
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Include characters in session roster without requiring a live player login
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedAddParticipantCharId}
                        onChange={(e) => setSelectedAddParticipantCharId(e.target.value)}
                        className="bg-stone-900 border border-stone-700 text-stone-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-purple-500 shrink-0 max-w-full sm:max-w-xs"
                      >
                        <option value="">Select an existing player character to add...</option>
                        {playerCharacters.map(c => {
                          const isAlreadyInSession = (activeSession.members || []).some(m => m.characterId === c.id);
                          return (
                            <option key={c.id} value={c.id} disabled={isAlreadyInSession}>
                              {c.name} (Lvl {c.level} {c.characterClass}){isAlreadyInSession ? ' - Already in Session' : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddParticipantToActiveSession}
                        disabled={!selectedAddParticipantCharId || isAddingParticipant}
                        className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-purple-100 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-purple-600/50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-purple-300" />
                        <span>{isAddingParticipant ? 'Adding...' : 'Add to Session Roster'}</span>
                      </button>
                    </div>
                  </div>
                )}

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
                              {m.isUnassignedParticipant && (
                                <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-700/60 px-1.5 py-0.2 rounded">NPC/PC Participant</span>
                              )}
                            </div>
                            <div className="text-xs text-stone-400">
                              {m.role === 'DM' ? 'Campaign Controller & Host' : (
                                charObj ? `${charObj.name} • Level ${charObj.level} ${charObj.characterClass}` : (m.characterName || 'No character selected')
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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

                          {/* DM Remove Participant button */}
                          {isDmOfSession && m.role !== 'DM' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipantFromSession(m.uid)}
                              className="p-2 bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-300 rounded-lg border border-stone-800 hover:border-rose-800 transition cursor-pointer"
                              title="Remove participant from session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Optional Rules Section */}
              <div className="space-y-3 pt-3 border-t border-stone-800">
                {isDmOfSession ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-purple-400" /> DM Campaign Optional Rules Management
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveSessionRules}
                        disabled={isUpdatingRules}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        {isUpdatingRules ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                        )}
                        <span>Sync Rules to All Players</span>
                      </button>
                    </div>

                    {rulesSavedSuccess && (
                      <div className="bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Campaign optional rules synchronized live to all player sheets!</span>
                      </div>
                    )}

                    <CampaignRulesSelector
                      rules={sessionOptionalRules}
                      onChangeRules={setSessionOptionalRules}
                      readOnly={false}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-serif font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-lg">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span>Campaign Rules Enforced by DM ({activeSession.dmName})</span>
                        <p className="text-[11px] font-sans text-stone-400 font-normal">
                          All player character sheets and combat rules automatically conform to these settings.
                        </p>
                      </div>
                    </div>
                    <CampaignRulesSelector
                      rules={sessionOptionalRules}
                      onChangeRules={() => {}}
                      readOnly={true}
                    />
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-base font-serif font-bold text-amber-200">
                  Connecting to Session {activeSessionCode || ''}...
                </h3>
                <p className="text-xs text-stone-400">
                  Restoring campaign session and synchronizing party character data.
                </p>
              </div>
            )
          )}

          {/* TAB 2: JOIN SESSION BY CODE */}
          {activeTab === 'join' && (
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
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" /> Host New Campaign Session (DM)
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Create a dedicated room code for your campaign session. Configure optional rules below to enforce standard mechanics across all connected players.
                  </p>
                </div>

                <div className="space-y-4">
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

                  {/* Pre-add Existing Characters */}
                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <label className="block text-xs font-mono uppercase text-stone-300 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Pre-add Existing Characters to Session (NPCs / Participant PCs)
                    </label>
                    <p className="text-[11px] text-stone-400 leading-tight">
                      Select any existing player characters to automatically include in this session's roster from the start (does not require an active player login):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl">
                      {playerCharacters.length === 0 ? (
                        <span className="text-xs text-stone-500 italic p-1">No player characters found for current ruleset</span>
                      ) : (
                        playerCharacters.map(c => {
                          const isChecked = selectedParticipantCharIds.includes(c.id);
                          return (
                            <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                              isChecked ? 'bg-purple-950/60 border-purple-600 text-purple-200 font-semibold' : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedParticipantCharIds(prev => [...prev, c.id]);
                                  } else {
                                    setSelectedParticipantCharIds(prev => prev.filter(id => id !== c.id));
                                  }
                                }}
                                className="accent-purple-500 w-3.5 h-3.5 rounded"
                              />
                              <span className="truncate">{c.name} (Lvl {c.level} {c.characterClass})</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Campaign Rules Initial Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-stone-300 font-bold">
                      Initial Campaign Optional Rules & Variant Mechanics
                    </label>
                    <CampaignRulesSelector
                      rules={sessionOptionalRules}
                      onChangeRules={setSessionOptionalRules}
                      readOnly={false}
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

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('saves');
                        fetchHostSaves();
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      Or load from a Saved Campaign Checkpoint →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAMPAIGN SAVES (DM) */}
          {activeTab === 'saves' && (
            <div className="space-y-4">
              <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-amber-500" /> Campaign Save Files & Checkpoints
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Save-files capture the entire state of your campaign, including character stats, HP, spell slots, inventory, and session rules.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-stone-700">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Import .json Save</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSaveJson}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={fetchHostSaves}
                      disabled={isLoadingSaves}
                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 transition"
                      title="Refresh saves list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSaves ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                    {lastSavedId && (
                      <button
                        type="button"
                        onClick={() => {
                          const s = hostSaves.find(x => x.id === lastSavedId);
                          if (s) handleExportSaveJson(s);
                        }}
                        className="text-[11px] underline font-bold text-emerald-300 hover:text-emerald-100 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download JSON
                      </button>
                    )}
                  </div>
                )}

                {isLoadingSaves ? (
                  <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                    <span>Loading saved campaign checkpoints...</span>
                  </div>
                ) : hostSaves.length === 0 ? (
                  <div className="py-10 text-center space-y-3 bg-stone-900/40 rounded-xl border border-stone-800/80 p-6">
                    <div className="p-3 bg-stone-800/50 rounded-2xl w-fit mx-auto text-stone-500">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif font-bold text-stone-300">No Campaign Saves Yet</h4>
                      <p className="text-xs text-stone-400 max-w-md mx-auto">
                        While in an active session, DMs can click <strong>"Save Progress"</strong> to create restore points. You can also import an existing <code>.json</code> save file.
                      </p>
                    </div>
                    {activeSession && isDmOfSession && (
                      <button
                        type="button"
                        onClick={handleOpenSaveDialog}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Current Session Now</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hostSaves.map((save) => {
                      const charCount = save.characters?.length || 0;
                      const activeRulesCount = Object.values(save.session?.optionalRules || {}).filter(Boolean).length;
                      const savedDate = new Date(save.savedAt);
                      const isRecent = Date.now() - savedDate.getTime() < 86400000;

                      return (
                        <div
                          key={save.id}
                          className="bg-stone-900 border border-stone-800 hover:border-amber-700/60 rounded-xl p-4 transition space-y-3 shadow-md"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif font-bold text-amber-200 text-sm">
                                  {save.name}
                                </h4>
                                <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.2 rounded-full">
                                  #{save.sessionCode}
                                </span>
                                <span className="text-[10px] font-mono uppercase bg-stone-800 text-stone-300 px-1.5 py-0.2 rounded">
                                  {save.edition || '5e'}
                                </span>
                                {isRecent && (
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded-full">
                                    Recent
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-500" />
                                  {savedDate.toLocaleDateString()} at {savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>•</span>
                                <span>Host: {save.hostName}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono">{charCount} Characters Saved</span>
                                {activeRulesCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-300 font-mono">{activeRulesCount} Variant Rules</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleLoadSave(save)}
                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-950/30 cursor-pointer"
                                title="Restore characters & resume this campaign"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Load & Resume</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExportSaveJson(save)}
                                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl border border-stone-700 transition cursor-pointer"
                                title="Download JSON Save File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {confirmDeleteSaveId === save.id ? (
                                <div className="flex items-center gap-1 bg-rose-950/90 p-0.5 rounded-xl border border-rose-600/80 animate-fadeIn">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSave(save.id)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Confirm permanent deletion"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Delete?</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSaveId(null)}
                                    className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSaveId(save.id)}
                                  className="p-1.5 bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 rounded-xl border border-stone-700 hover:border-rose-800 transition cursor-pointer"
                                  title="Delete Checkpoint"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          {save.notes && (
                            <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-2.5 text-xs text-stone-300 flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{save.notes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Checkpoint Dialog Modal Overlay */}
        {showSaveModal && activeSession && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-amber-600/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-amber-200 text-sm">Save Campaign Checkpoint</h3>
                    <p className="text-[11px] text-stone-400">Snapshot campaign state & all player character sheets</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-300 font-bold mb-1">
                    Checkpoint Name
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g. Session 14 - Boss Defeated"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-300 font-bold mb-1">
                    DM Campaign Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={saveNotes}
                    onChange={(e) => setSaveNotes(e.target.value)}
                    placeholder="e.g. Party rested at Blue Water Inn; 450 gp looted; Strahd encounter pending..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <span>Captures current state for all {playerCharacters.length} {activeEdition === '3.5e' ? 'D&D 3.5e' : 'D&D 5e'} party characters</span>
                  <span className="text-emerald-400 font-mono font-bold">Auto-Captured</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveCampaign}
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 rounded-xl font-bold transition flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Progress...' : 'Confirm & Save Checkpoint'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

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

export default SessionLobbyModal;
