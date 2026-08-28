import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CharacterData, RuleEdition } from '../types';
import { TabId } from './Navigation';
import { getPassivePerception, getProficiencyBonus, formatModifier, getEffectiveSpeed, getArmorClassBreakdown, getCombinedLevel, getActiveClassChoice, isCharacterDead, getEffectiveMaxHp } from '../utils/dndCalculations';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../data/monsterPortraits';
import { getXpProgressDetails } from '../data/levelProgressionData';
import { revertTransformation } from '../data/transformationData';
import { HpOrb, getHpColorClass } from './HpOrb';
import { LevelProgressionModal } from './modals/LevelProgressionModal';
import { MaxHpInspectorModal } from './modals/MaxHpInspectorModal';
import { RestModal } from './combat/RestModal';
import {
  Shield,
  Zap,
  Footprints,
  Heart,
  Eye,
  Award,
  Download,
  Upload,
  PlusCircle,
  Moon,
  Sun,
  Flame,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Store,
  Trash2,
  Laptop,
  DownloadCloud,
  Smartphone,
  Check,
  Layers,
  Skull,
  Brain,
  Cpu,
  BookOpen,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Users,
  User,
  Crown,
  Sword,
  Cloud,
  Lock,
  Pencil,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Settings,
  Command,
  Undo2,
  Redo2,
  Network,
  Radio
} from 'lucide-react';
import { isSoundEnabled } from '../utils/soundEffects';
import { UserProfile, CharacterPresence, GameSession } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface HeaderProps {
  characters: CharacterData[];
  activeCharacter?: CharacterData | null;
  partiesCount?: number;
  onOpenPartyManager?: () => void;
  onOpenSessionLobby?: () => void;
  onOpenCampaignGraph?: () => void;
  activeSession?: GameSession | null;
  onSelectCharacter: (id: string) => void;
  onCreateNewCharacter: (category?: 'character' | 'monster' | 'vendor') => void;
  onDeleteCharacter: (id: string) => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRollInitiative: () => void;
  onSystemChange?: (system: RuleEdition) => void;
  edition?: RuleEdition;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  presenceMap?: Record<string, CharacterPresence>;
  enabledSystems?: RuleEdition[];
  onOpenSystemSelector?: () => void;
  onOpenAudioModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenExtensionManager?: () => void;
  onOpenVoiceModal?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  activeTab?: TabId;
}

export const Header: React.FC<HeaderProps> = ({
  characters,
  activeCharacter,
  partiesCount = 0,
  onOpenPartyManager,
  onOpenSessionLobby,
  onOpenCampaignGraph,
  activeSession,
  onSelectCharacter,
  onCreateNewCharacter,
  onDeleteCharacter,
  onUpdateCharacter,
  onExportJson,
  onImportJson,
  onRollInitiative,
  onSystemChange,
  edition,
  currentUser,
  onOpenAuthModal,
  presenceMap = {},
  enabledSystems,
  onOpenSystemSelector,
  onOpenAudioModal,
  onOpenCommandPalette,
  onOpenExtensionManager,
  onOpenVoiceModal,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  activeTab
}) => {
  const { t } = useLanguage();
  const showCharacterHeader = !!(currentUser && activeCharacter && activeTab !== 'menu');
  const [showRestModal, setShowRestModal] = useState<'short' | 'long' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [hpDelta, setHpDelta] = useState<string>('');
  const [showMaxHpInspector, setShowMaxHpInspector] = useState<boolean>(false);

  const effectiveMaxHp = activeCharacter ? getEffectiveMaxHp(activeCharacter) : 0;
  const xpProgressDetails = activeCharacter ? getXpProgressDetails(activeCharacter.experiencePoints || 0, activeCharacter.level || 1) : null;
  const currentEdition = edition || activeCharacter?.edition || '5e';
  const profBonus = activeCharacter ? getProficiencyBonus(activeCharacter.level) : 2;
  const passivePerception = activeCharacter ? getPassivePerception(activeCharacter) : 10;
  const speedInfo = activeCharacter ? getEffectiveSpeed(activeCharacter) : { baseSpeed: 30, effectiveSpeed: 30, isModified: false, speedPenalty: 0, reasons: [] };

  useEffect(() => {
    // Detect if already installed / running in standalone window
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleEditionChange = (newEdition: RuleEdition) => {
    if (onSystemChange) {
      onSystemChange(newEdition);
    }
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaModal(true);
    }
  };

  const handleApplyHpChange = (type: 'heal' | 'damage' | 'temp') => {
    if (!activeCharacter) return;
    const amount = parseInt(hpDelta) || (type === 'heal' || type === 'damage' ? 1 : 0);
    if (amount <= 0 && type !== 'temp') return;

    let { hpCurrent, hpMax, hpTemp } = activeCharacter;

    if (type === 'heal') {
      const wasAtZero = activeCharacter.hpCurrent <= 0;
      hpCurrent = Math.min(effectiveMaxHp, hpCurrent + amount);
      let deathSavesSuccesses = activeCharacter.deathSavesSuccesses || 0;
      let deathSavesFailures = activeCharacter.deathSavesFailures || 0;
      let conditions = activeCharacter.conditions || [];

      if (wasAtZero && amount > 0) {
        deathSavesSuccesses = 0;
        deathSavesFailures = 0;
        conditions = conditions.filter(c => c !== 'Unconscious');
      }

      onUpdateCharacter({
        ...activeCharacter,
        hpCurrent,
        hpTemp,
        deathSavesSuccesses,
        deathSavesFailures,
        conditions
      });
      setHpDelta('');
    } else if (type === 'damage') {
      const wasAtZero = activeCharacter.hpCurrent <= 0;
      let damageToHp = amount;

      if (hpTemp > 0) {
        if (amount <= hpTemp) {
          hpTemp -= amount;
          damageToHp = 0;
        } else {
          damageToHp = amount - hpTemp;
          hpTemp = 0;
          hpCurrent = Math.max(0, hpCurrent - damageToHp);
        }
      } else {
        hpCurrent = hpCurrent - amount;
      }

      // Check if character is in transformed Beast / Wild Shape form and form HP drops <= 0
      if (activeCharacter.activeTransformation && hpCurrent <= 0) {
        // Revert transformation with overflow damage calculated
        const dummyCharWithNewHp = { ...activeCharacter, hpCurrent, hpTemp };
        const revertedChar = revertTransformation(dummyCharWithNewHp);
        alert(`🐾 Beast Form (${activeCharacter.activeTransformation.form.name}) dropped to 0 HP!\nReverted to original form. Overflow damage applied to base HP (${revertedChar.hpCurrent}/${revertedChar.hpMax} HP).`);
        onUpdateCharacter(revertedChar);
        setHpDelta('');
        return;
      }

      hpCurrent = Math.max(0, hpCurrent);

      let deathSavesFailures = activeCharacter.deathSavesFailures || 0;
      let conditions = activeCharacter.conditions || [];

      // Receiving a hit while at 0 HP automatically adds a failed death save
      if (wasAtZero && amount > 0) {
        deathSavesFailures = Math.min(3, deathSavesFailures + 1);
      }

      const isNowDead = deathSavesFailures >= 3;
      if (isNowDead) {
        if (!conditions.includes('Dead')) {
          conditions = [...conditions, 'Dead'];
        }
      } else if (hpCurrent <= 0) {
        if (!conditions.includes('Unconscious')) {
          conditions = [...conditions, 'Unconscious'];
        }
      }

      onUpdateCharacter({
        ...activeCharacter,
        hpCurrent,
        hpTemp,
        deathSavesFailures,
        conditions
      });

      // Concentration Check Helper Trigger
      const hasConcentratingSpell = (activeCharacter.spells || []).some(s => s.concentration);
      if (amount > 0 && hasConcentratingSpell) {
        const dc = Math.max(10, Math.floor(amount / 2));
        const conScore = activeCharacter.abilities?.CON?.score || 10;
        const conMod = Math.floor((conScore - 10) / 2);
        const hasWarCaster = (activeCharacter.feats || []).some(f => f.name.toLowerCase().includes('war caster')) ||
                             (activeCharacter.classFeatures || []).some(f => f.name.toLowerCase().includes('war caster'));
        alert(`⚡ Concentration Check Required!\nTook ${amount} damage while concentrating on a spell.\nTarget DC: ${dc} (Roll 1d20 + ${conMod} CON save${hasWarCaster ? ' WITH ADVANTAGE from War Caster feat' : ''}).`);
      }

      setHpDelta('');
    } else if (type === 'temp') {
      hpTemp = amount;
      onUpdateCharacter({
        ...activeCharacter,
        hpCurrent,
        hpTemp
      });
      setHpDelta('');
    }
  };

  const handleShortRest = () => {
    if (!activeCharacter) return;
    if (isCharacterDead(activeCharacter)) {
      alert(`💀 ${activeCharacter.name} is DEAD! Resting cannot restore HP or bring a dead character back to life.`);
      setShowRestModal(null);
      return;
    }

    // Reset short rest features
    const updatedFeatures = activeCharacter.classFeatures.map(cf => {
      if (cf.recharge === 'Short Rest' && cf.usesMax !== undefined) {
        return { ...cf, usesRemaining: cf.usesMax };
      }
      return cf;
    });

    onUpdateCharacter({
      ...activeCharacter,
      classFeatures: updatedFeatures
    });
    setShowRestModal(null);
  };

  const handleLongRest = () => {
    if (!activeCharacter) return;
    if (isCharacterDead(activeCharacter)) {
      alert(`💀 ${activeCharacter.name} is DEAD! Resting cannot restore HP or bring a dead character back to life. Magic such as Revivify, Raise Dead, or manual HP edit is required.`);
      setShowRestModal(null);
      return;
    }

    // Reset HP, spell slots, death saves, short and long rest features
    const updatedFeatures = activeCharacter.classFeatures.map(cf => {
      if ((cf.recharge === 'Short Rest' || cf.recharge === 'Long Rest') && cf.usesMax !== undefined) {
        return { ...cf, usesRemaining: cf.usesMax };
      }
      return cf;
    });

    const updatedSpellSlots = activeCharacter.spellSlots.map(slot => ({
      ...slot,
      current: slot.max
    }));

    onUpdateCharacter({
      ...activeCharacter,
      hpCurrent: effectiveMaxHp,
      hpTemp: 0,
      hitDiceCurrent: parseInt(activeCharacter.hitDiceTotal) || activeCharacter.level,
      deathSavesSuccesses: 0,
      deathSavesFailures: 0,
      classFeatures: updatedFeatures,
      spellSlots: updatedSpellSlots
    });
    setShowRestModal(null);
  };

  return (
    <header className="bg-stone-900 border-b border-amber-800/40 text-stone-100 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      {/* Top Banner & Control Bar */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: App Logo & Character Selector */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shadow-lg border transition ${
            currentEdition === 'shadowrun'
              ? 'bg-gradient-to-br from-cyan-600 to-blue-900 border-cyan-400/50 text-cyan-200'
              : currentEdition === 'pathfinder'
              ? 'bg-gradient-to-br from-purple-600 to-indigo-900 border-purple-400/50 text-purple-200'
              : currentEdition === 'cthulhu'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-900 border-emerald-400/50 text-emerald-200'
              : currentEdition === '3.5e'
              ? 'bg-gradient-to-br from-rose-700 to-rose-950 border-rose-500/50 text-rose-200'
              : 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400/40 text-amber-200'
          }`}>
            {currentEdition === 'shadowrun' ? (
              <Cpu className="w-6 h-6" />
            ) : currentEdition === 'pathfinder' ? (
              <BookOpen className="w-6 h-6" />
            ) : currentEdition === 'cthulhu' ? (
              <Skull className="w-6 h-6" />
            ) : (
              <Flame className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase tracking-widest font-mono font-bold ${
                currentEdition === 'shadowrun'
                  ? 'text-cyan-400'
                  : currentEdition === 'pathfinder'
                  ? 'text-purple-400'
                  : currentEdition === 'cthulhu'
                  ? 'text-emerald-400'
                  : currentEdition === '3.5e'
                  ? 'text-rose-400'
                  : 'text-amber-500'
              }`}>
                {currentEdition === 'shadowrun'
                  ? `Nexus • ${t('vault.shadowrun', 'Shadowrun Cyberpunk Vault')}`
                  : currentEdition === 'pathfinder'
                  ? `Nexus • ${t('vault.pathfinder', 'Pathfinder 2e Tactical Vault')}`
                  : currentEdition === 'cthulhu'
                  ? `Nexus • ${t('vault.cthulhu', 'Call of Cthulhu 7e Investigator Vault')}`
                  : currentEdition === '3.5e'
                  ? `Nexus • ${t('vault.dnd35', 'D&D 3.5e Classic d20 Vault')}`
                  : `Nexus • ${t('vault.dnd5e', 'D&D 5e Adventurer Vault')}`}
              </span>
              {/* Compact Mobile Edition Toggle */}
              <div className="flex md:hidden items-center bg-stone-950 p-0.5 rounded border border-theme-accent text-[10px]">
                {[
                  { id: '5e' as RuleEdition, label: '5e' },
                  { id: '3.5e' as RuleEdition, label: '3.5e' },
                  { id: 'shadowrun' as RuleEdition, label: 'SR' },
                  { id: 'pathfinder' as RuleEdition, label: 'PF' },
                  { id: 'cthulhu' as RuleEdition, label: 'CoC' },
                ]
                  .filter(sys => !enabledSystems || enabledSystems.includes(sys.id))
                  .map(sys => (
                    <button
                      key={sys.id}
                      onClick={() => handleEditionChange(sys.id)}
                      className={`px-1.5 py-0.5 rounded font-bold ${currentEdition === sys.id ? 'bg-amber-500 text-stone-950' : 'text-stone-400'}`}
                    >
                      {sys.label}
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {!currentUser ? (
                <button
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" /> {t('header.signInToSelect', 'Sign In to Select Character')}
                </button>
              ) : (
                (() => {
                  const isPlayerRole = !currentUser || currentUser.role === 'Player';
                  const currentUserId = currentUser.uid || 'guest_player';

                  const activePortrait = activeCharacter ? (activeCharacter.portraitUrl || (activeCharacter.isMonster ? getMonsterPortraitUrl(activeCharacter.name, activeCharacter.id) : undefined)) : undefined;
                  const systemChars = characters.filter((c) => (c.edition || '5e') === currentEdition);
                  const dropdownList = activeCharacter
                    ? (systemChars.some((c) => c.id === activeCharacter.id)
                        ? systemChars
                        : [activeCharacter, ...systemChars.filter((c) => c.id !== activeCharacter.id)])
                    : systemChars;

                  const playerChars = dropdownList.filter((c) => !c.isMonster && !c.isVendor);
                  const monsterChars = dropdownList.filter((c) => c.isMonster);
                  const merchantChars = dropdownList.filter((c) => c.isVendor && !c.isMonster);

                  const activePresence = activeCharacter ? presenceMap[activeCharacter.id] : undefined;
                  const activeDmIsHere = !!activePresence?.dmActive;

                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      {activePortrait && (
                        <img
                          src={activePortrait}
                          alt={activeCharacter?.name || ''}
                          className="w-8 h-8 rounded-lg object-cover border border-amber-500/60 shadow shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = generateMonsterSvgPortrait(activeCharacter?.name);
                          }}
                        />
                      )}
                      <select
                        value={activeCharacter?.id || ''}
                        onChange={(e) => onSelectCharacter(e.target.value)}
                        className="bg-stone-800 border border-stone-700 hover:border-theme-accent rounded-lg px-3 py-1 font-serif text-lg font-bold text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent max-w-[260px] sm:max-w-none truncate"
                      >
                        <option value="">{`-- ${t('header.selectCharacter', 'Select a Character')} --`}</option>
                        {playerChars.length > 0 && (
                          <optgroup label={`🧙 ${t('mainMenu.playerCharacters', 'Player Characters')}`}>
                            {playerChars.map((char) => {
                              const isDual = char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass;
                              const secClassStr = isDual
                                ? ` / ${char.optionalRules?.secondaryClass} Lv.${char.optionalRules?.secondaryLevel || 1}`
                                : '';
                              const statusTag = isCharacterDead(char) ? ' 💀 [DEAD]' : char.hpCurrent <= 0 ? ' 💤 [UNCONSCIOUS]' : '';

                              const presence = presenceMap[char.id];
                              const activeUserId = presence?.activeUserId;
                              const activeUserName = presence?.activeUserName || 'Player';
                              const activeUserRole = presence?.activeUserRole;
                              const dmUserId = presence?.dmUserId;

                              const isLockedByOtherPlayer = isPlayerRole && 
                                !!activeUserId && 
                                activeUserId !== 'guest_player' &&
                                activeUserId !== currentUserId && 
                                activeUserId !== dmUserId && 
                                activeUserRole !== 'DM';
                              const isCharDmActive = !!presence?.dmActive;

                              let lockOrActiveLabel = '';
                              if (isLockedByOtherPlayer) {
                                lockOrActiveLabel = ` [🔒 Active: ${activeUserName}]`;
                              } else if (activeUserId && activeUserId !== 'guest_player' && activeUserId !== currentUserId && activeUserId !== dmUserId && activeUserRole !== 'DM') {
                                lockOrActiveLabel = ` [Active: ${activeUserName}]`;
                              }

                              if (isCharDmActive) {
                                lockOrActiveLabel += ' [👑 DM Active]';
                              }

                              return (
                                <option 
                                  key={char.id} 
                                  value={char.id}
                                  disabled={isLockedByOtherPlayer}
                                >
                                  {char.name} ({char.race} {char.characterClass || 'Runner'} Lv.{char.level}{secClassStr}){statusTag}{lockOrActiveLabel}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}

                        {!isPlayerRole && monsterChars.length > 0 && (
                          <optgroup label={`👹 ${t('mainMenu.monsters', 'Monsters & Encounter Creatures')}`}>
                            {monsterChars.map((char) => (
                              <option key={char.id} value={char.id}>
                                {char.name} ({char.race} Lvl {char.level}) [MONSTER]
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {!isPlayerRole && merchantChars.length > 0 && (
                          <optgroup label={`🏪 ${t('mainMenu.merchants', 'Merchants & Shopkeepers')}`}>
                            {merchantChars.map((char) => (
                              <option key={char.id} value={char.id}>
                                {char.name} ({char.race} {char.characterClass || 'Merchant'}) [Merchant - {char.vendorMargin || 120}%]
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  );
                })()
              )}

              {currentUser && (
                <button
                  onClick={() => onCreateNewCharacter()}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-400 border border-stone-700 rounded-lg transition cursor-pointer"
                  title="Create New Character"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}

              {currentUser && activeCharacter && onOpenPartyManager && (
                <button
                  onClick={onOpenPartyManager}
                  className="px-2.5 py-1.5 bg-purple-950/80 hover:bg-purple-900/90 active:scale-95 text-purple-200 border border-purple-600/60 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                  title="Party Manager & Adventuring Groups"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Parties</span>
                  {partiesCount > 0 && (
                    <span className="bg-purple-700 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {partiesCount}
                    </span>
                  )}
                </button>
              )}

              {currentUser && onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer border ${
                    currentUser.role === 'DM'
                      ? 'bg-purple-950/90 hover:bg-purple-900 text-purple-200 border-purple-500/80'
                      : 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-200 border-indigo-500/80'
                  }`}
                  title={`Account: ${currentUser.displayName} (${currentUser.role})`}
                >
                  {currentUser.role === 'DM' ? (
                    <Crown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Sword className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="hidden md:inline max-w-[100px] truncate">{currentUser.displayName}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    currentUser.role === 'DM' ? 'bg-purple-800/80 text-purple-100' : 'bg-indigo-800/80 text-indigo-100'
                  }`}>
                    {currentUser.role}
                  </span>
                </button>
              )}

              {showCharacterHeader && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 bg-stone-800 hover:bg-rose-950/80 hover:border-rose-600 active:scale-95 text-stone-400 hover:text-rose-300 border border-stone-700 rounded-lg transition cursor-pointer"
                  title={`Delete ${activeCharacter?.name}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Level & Subclass Details */}
        <div className="hidden md:flex items-center gap-3 text-xs text-stone-300 font-serif">
          {showCharacterHeader && (
            <>
              {activeCharacter.isVendor && (
                <div className="bg-theme-dark border border-theme-accent px-3 py-1.5 rounded-lg text-theme-text font-bold flex items-center gap-1.5 shadow-md">
                  <Store className="w-4 h-4 text-theme-accent" />
                  <span>{t('header.merchantVendor', 'Merchant Vendor')} ({activeCharacter.vendorMargin || 120}% {t('header.margin', 'Margin')})</span>
                </div>
              )}
              <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5 flex-wrap">
                <span className="text-theme-accent font-bold">{t('common.class', 'Class')}:</span>
                <span>{activeCharacter.characterClass} ({activeCharacter.subclass || t('common.none', 'None')})</span>
                {activeCharacter.optionalRules?.useMulticlassing && activeCharacter.optionalRules?.secondaryClass && (
                  <span className="text-theme-light font-semibold bg-theme-dark border border-theme-accent px-1.5 py-0.5 rounded text-[11px]">
                    / {activeCharacter.optionalRules.secondaryClass}
                    {activeCharacter.optionalRules.secondarySubclass ? ` (${activeCharacter.optionalRules.secondarySubclass})` : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowLevelModal(true)}
                className="bg-stone-800/90 hover:bg-stone-700/90 border border-amber-600/50 hover:border-amber-400 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs text-stone-100 shadow-md group"
                title="Click to open Level Progression, Dual-Class Active Class Selector & Advancement Table"
              >
                <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-amber-300 font-bold">{t('common.level', 'Level')}:</span>
                {activeCharacter.optionalRules?.useMulticlassing && activeCharacter.optionalRules?.secondaryClass ? (
                  <div className="flex items-center gap-1.5 font-sans">
                    <span className="font-mono font-extrabold text-amber-200 text-sm bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                      Comb. Lvl {getCombinedLevel(activeCharacter)}
                    </span>
                    <span className="text-[11px] text-stone-300">
                      ({activeCharacter.characterClass} {activeCharacter.level} / {activeCharacter.optionalRules.secondaryClass} {activeCharacter.optionalRules.secondaryLevel || 1})
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/40">
                      {getActiveClassChoice(activeCharacter) === 'primary' ? `${activeCharacter.characterClass} Active` : `${activeCharacter.optionalRules.secondaryClass} Active`}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-sm text-stone-100">{activeCharacter.level}</span>
                )}
                {(activeCharacter.optionalRules?.disableAutoXpGain || activeCharacter.optionalRules?.useManualXpMode) && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/90 border border-amber-600/50 px-1.5 py-0.5 rounded ml-0.5">
                    Manual EXP
                  </span>
                )}
                {xpProgressDetails?.canLevelUp && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-stone-950 font-mono font-bold text-[10px] rounded-full animate-pulse ml-1">
                    {t('header.levelUp', 'LEVEL UP!')}
                  </span>
                )}
              </button>

              {/* Character Rest Action Group */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowRestModal('short')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-600/30 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
                  title={activeCharacter?.optionalRules?.useGrittyRealismResting ? 'Gritty Realism Short Rest: 8 Hours' : 'Standard Short Rest: 1 Hour'}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>{t('header.shortRest', 'Short Rest')}</span>
                  {activeCharacter?.optionalRules?.useGrittyRealismResting && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">8h</span>
                  )}
                </button>

                <button
                  onClick={() => setShowRestModal('long')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
                  title={activeCharacter?.optionalRules?.useGrittyRealismResting ? 'Gritty Realism Long Rest: 7 Days' : 'Standard Long Rest: 8 Hours'}
                >
                  <Moon className="w-4 h-4 text-amber-300" />
                  <span>{t('header.longRest', 'Long Rest')}</span>
                  {activeCharacter?.optionalRules?.useGrittyRealismResting && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">7d</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rest & Recovery Modal */}
      {showRestModal && activeCharacter && createPortal(
        <RestModal
          character={activeCharacter}
          onClose={() => setShowRestModal(null)}
          onUpdateCharacter={onUpdateCharacter}
          initialRestType={showRestModal}
        />,
        document.body
      )}

      {/* Delete Character Confirm Modal */}
      {showDeleteModal && activeCharacter && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-rose-800/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-100">
            <div className="flex items-center gap-3 text-rose-400 text-lg font-serif font-bold mb-2">
              <Trash2 className="w-6 h-6" />
              <span>{t('header.deleteCharacter', 'Delete Character')}</span>
            </div>
            <p className="text-sm text-stone-300 mb-4 leading-relaxed">
              {t('header.deleteConfirm', 'Are you sure you want to delete')} <strong className="text-amber-200">{activeCharacter.name}</strong> ({activeCharacter.race} {activeCharacter.characterClass} Lv.{activeCharacter.level})?
              {characters.length === 1 && (
                <span className="block mt-2 text-rose-300 text-xs font-semibold bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
                  ⚠️ {t('header.deleteLastWarning', 'Note: This is your last remaining character. Deleting it will restore default starting character templates.')}
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  onDeleteCharacter(activeCharacter.id);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('header.deleteCharacter', 'Delete Character')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}



      {/* PWA / Local App Installation Modal */}
      {showPwaModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-stone-100 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-serif font-bold text-lg">
                <Laptop className="w-6 h-6 text-amber-500" />
                <span>Run App Locally or Install PWA</span>
              </div>
              <button
                onClick={() => setShowPwaModal(false)}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800 transition text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              You can freely choose whether you prefer using this application in your web browser or running it locally as a dedicated standalone app on your desktop or mobile home screen!
            </p>

            {deferredPrompt ? (
              <div className="bg-amber-950/50 border border-amber-500/50 rounded-xl p-4 mb-4 text-center">
                <p className="text-xs text-amber-200 mb-3 font-semibold">
                  Your browser supports instant 1-click installation!
                </p>
                <button
                  onClick={async () => {
                    setShowPwaModal(false);
                    await handleTriggerInstall();
                  }}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Install Standalone App Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4" />
                    <span>Desktop (Chrome / Edge / Brave)</span>
                  </div>
                  <p className="text-stone-400">
                    Click the <strong className="text-stone-200 font-mono">Install</strong> icon in the right side of your browser’s address bar, or open the browser menu (<strong className="text-stone-200">⋮</strong>) and select <strong className="text-stone-200">"Install D&D 5e Character Sheet"</strong>.
                  </p>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>iOS / Safari (iPhone & iPad)</span>
                  </div>
                  <p className="text-stone-400">
                    Tap the <strong className="text-stone-200">Share</strong> button in Safari, then scroll down and tap <strong className="text-stone-200 font-semibold">"Add to Home Screen"</strong>.
                  </p>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Offline Storage & Data Safety</span>
                  </div>
                  <p className="text-stone-400">
                    All character sheets, spells, equipment, and dice rolling history are cached locally in your browser so you can access and edit them anytime without an active internet connection.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-800 pt-3">
              <button
                onClick={() => setShowPwaModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-semibold transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Level Progression & Character Advancement Modal */}
      {showLevelModal && activeCharacter && (
        <LevelProgressionModal
          character={activeCharacter}
          onClose={() => setShowLevelModal(false)}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </header>
  );
};
