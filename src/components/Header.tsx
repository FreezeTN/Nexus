import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CharacterData, RuleEdition } from '../types';
import { getPassivePerception, getProficiencyBonus, formatModifier, convertCharacterEdition, getEffectiveSpeed, getArmorClassBreakdown } from '../utils/dndCalculations';
import { getMonsterPortraitUrl } from '../data/monsterPortraits';
import { getXpProgressDetails } from '../data/levelProgressionData';
import { HpOrb, getHpColorClass } from './HpOrb';
import { StatblockExportModal } from './character/StatblockExportModal';
import { LevelProgressionModal } from './modals/LevelProgressionModal';
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
  Users
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface HeaderProps {
  characters: CharacterData[];
  activeCharacter: CharacterData;
  partiesCount?: number;
  onOpenPartyManager?: () => void;
  onSelectCharacter: (id: string) => void;
  onCreateNewCharacter: (category?: 'character' | 'monster' | 'vendor') => void;
  onDeleteCharacter: (id: string) => void;
  onUpdateCharacter: (updated: CharacterData) => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRollInitiative: () => void;
  onSystemChange?: (system: RuleEdition) => void;
  edition?: RuleEdition;
}

export const Header: React.FC<HeaderProps> = ({
  characters,
  activeCharacter,
  partiesCount = 0,
  onOpenPartyManager,
  onSelectCharacter,
  onCreateNewCharacter,
  onDeleteCharacter,
  onUpdateCharacter,
  onExportJson,
  onImportJson,
  onRollInitiative,
  onSystemChange,
  edition
}) => {
  const [showRestModal, setShowRestModal] = useState<'short' | 'long' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [showStatblockModal, setShowStatblockModal] = useState<boolean>(false);
  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [hpDelta, setHpDelta] = useState<string>('');

  const xpProgressDetails = getXpProgressDetails(activeCharacter.experiencePoints || 0, activeCharacter.level || 1);

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

  const currentEdition = edition || activeCharacter.edition || '5e';

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

  const profBonus = getProficiencyBonus(activeCharacter.level);
  const passivePerception = getPassivePerception(activeCharacter);
  const speedInfo = getEffectiveSpeed(activeCharacter);

  const handleApplyHpChange = (type: 'heal' | 'damage' | 'temp') => {
    const amount = parseInt(hpDelta) || 0;
    if (amount <= 0) return;

    let { hpCurrent, hpMax, hpTemp } = activeCharacter;

    if (type === 'heal') {
      hpCurrent = Math.min(hpMax, hpCurrent + amount);
    } else if (type === 'damage') {
      if (hpTemp > 0) {
        if (amount <= hpTemp) {
          hpTemp -= amount;
        } else {
          const remainder = amount - hpTemp;
          hpTemp = 0;
          hpCurrent = Math.max(0, hpCurrent - remainder);
        }
      } else {
        hpCurrent = Math.max(0, hpCurrent - amount);
      }
    } else if (type === 'temp') {
      hpTemp = amount;
    }

    onUpdateCharacter({
      ...activeCharacter,
      hpCurrent,
      hpTemp
    });
    setHpDelta('');
  };

  const handleShortRest = () => {
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
      hpCurrent: activeCharacter.hpMax,
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
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
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
                  ? 'Shadowrun Vault • Cyberpunk Sheet'
                  : currentEdition === 'pathfinder'
                  ? 'Pathfinder Vault • 2e Sheet'
                  : currentEdition === 'cthulhu'
                  ? 'Call of Cthulhu Vault • 7e Sheet'
                  : `D&D Vault • ${currentEdition} Sheet`}
              </span>
              {/* Compact Mobile Edition Toggle */}
              <div className="flex md:hidden items-center bg-stone-950 p-0.5 rounded border border-theme-accent text-[10px]">
                <button
                  onClick={() => handleEditionChange('5e')}
                  className={`px-1.5 py-0.5 rounded font-bold ${currentEdition === '5e' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'}`}
                >
                  5e
                </button>
                <button
                  onClick={() => handleEditionChange('3.5e')}
                  className={`px-1.5 py-0.5 rounded font-bold ${currentEdition === '3.5e' ? 'bg-rose-500 text-stone-950' : 'text-stone-400'}`}
                >
                  3.5e
                </button>
                <button
                  onClick={() => handleEditionChange('shadowrun')}
                  className={`px-1.5 py-0.5 rounded font-bold ${currentEdition === 'shadowrun' ? 'bg-cyan-500 text-stone-950' : 'text-stone-400'}`}
                >
                  SR
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {(() => {
                const activePortrait = activeCharacter.portraitUrl || (activeCharacter.isMonster ? getMonsterPortraitUrl(activeCharacter.name, activeCharacter.id) : undefined);
                const systemChars = characters.filter((c) => (c.edition || '5e') === currentEdition);
                const dropdownList = systemChars.some((c) => c.id === activeCharacter.id)
                  ? systemChars
                  : [activeCharacter, ...systemChars.filter((c) => c.id !== activeCharacter.id)];

                const playerChars = dropdownList.filter((c) => !c.isMonster && !c.isVendor);
                const monsterChars = dropdownList.filter((c) => c.isMonster);
                const merchantChars = dropdownList.filter((c) => c.isVendor && !c.isMonster);

                return (
                  <div className="flex items-center gap-2">
                    {activePortrait && (
                      <img
                        src={activePortrait}
                        alt={activeCharacter.name}
                        className="w-8 h-8 rounded-lg object-cover border border-amber-500/60 shadow shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <select
                      value={activeCharacter.id}
                      onChange={(e) => onSelectCharacter(e.target.value)}
                      className="bg-stone-800 border border-stone-700 hover:border-theme-accent rounded-lg px-3 py-1 font-serif text-lg font-bold text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
                    >
                      {playerChars.length > 0 && (
                        <optgroup label="🧙 Player Characters">
                          {playerChars.map((char) => {
                            const secClassStr = (char.optionalRules?.useMulticlassing && char.optionalRules?.secondaryClass)
                              ? ` / ${char.optionalRules.secondaryClass} Lv.${char.optionalRules.secondaryLevel || 1}`
                              : '';
                            return (
                              <option key={char.id} value={char.id}>
                                {char.name} ({char.race} {char.characterClass || 'Runner'} Lv.{char.level}{secClassStr})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}

                      {monsterChars.length > 0 && (
                        <optgroup label="👹 Monsters & Encounter Creatures">
                          {monsterChars.map((char) => (
                            <option key={char.id} value={char.id}>
                              {char.name} ({char.race} Lvl {char.level}) [MONSTER]
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {merchantChars.length > 0 && (
                        <optgroup label="🏪 Merchants & Shopkeepers">
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
              })()}

              <button
                onClick={() => onCreateNewCharacter()}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-400 border border-stone-700 rounded-lg transition cursor-pointer"
                title="Create New Character"
              >
                <PlusCircle className="w-5 h-5" />
              </button>

              {onOpenPartyManager && (
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

              <button
                onClick={() => setShowConvertModal(true)}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-cyan-400 border border-stone-700 rounded-lg transition cursor-pointer"
                title={`Convert ${activeCharacter.name} to another TRPG system`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 bg-stone-800 hover:bg-rose-950/80 hover:border-rose-600 active:scale-95 text-stone-400 hover:text-rose-300 border border-stone-700 rounded-lg transition cursor-pointer"
                title={`Delete ${activeCharacter.name}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Level & Subclass Details + System Selector */}
        <div className="hidden md:flex items-center gap-3 text-xs text-stone-300 font-serif">
          {/* TRPG System Selector Widget */}
          <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-theme-accent shadow-inner">
            <span className="text-[10px] uppercase font-bold text-theme-accent px-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              System:
            </span>
            <div className="flex items-center gap-0.5">
              {[
                { id: '5e' as RuleEdition, label: 'D&D 5e' },
                { id: '3.5e' as RuleEdition, label: 'D&D 3.5e' },
                { id: 'shadowrun' as RuleEdition, label: 'Shadowrun' },
                { id: 'pathfinder' as RuleEdition, label: 'Pathfinder' },
                { id: 'cthulhu' as RuleEdition, label: 'Cthulhu' },
              ].map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => handleEditionChange(sys.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    currentEdition === sys.id
                      ? 'bg-theme-accent text-stone-950 shadow'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {sys.label}
                </button>
              ))}
            </div>
          </div>

          {activeCharacter.isVendor && (
            <div className="bg-theme-dark border border-theme-accent px-3 py-1.5 rounded-lg text-theme-text font-bold flex items-center gap-1.5 shadow-md">
              <Store className="w-4 h-4 text-theme-accent" />
              <span>Merchant Vendor ({activeCharacter.vendorMargin || 120}% Margin)</span>
            </div>
          )}
          <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5 flex-wrap">
            <span className="text-theme-accent font-bold">Class:</span>
            <span>{activeCharacter.characterClass} ({activeCharacter.subclass || 'None'})</span>
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
            title="Click to open Level Progression & Character Advancement Table"
          >
            <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-amber-300 font-bold">Level:</span>
            <span className="font-mono font-bold text-sm text-stone-100">{activeCharacter.level}</span>
            {activeCharacter.optionalRules?.useMulticlassing && activeCharacter.optionalRules?.secondaryClass && (
              <span className="text-amber-200 font-semibold text-[11px]">
                (+{activeCharacter.optionalRules.secondaryLevel || 1} {activeCharacter.optionalRules.secondaryClass})
              </span>
            )}
            {xpProgressDetails.canLevelUp && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-stone-950 font-mono font-bold text-[10px] rounded-full animate-pulse ml-1">
                LEVEL UP!
              </span>
            )}
          </button>
        </div>

        {/* Right: Rest, Export, Import Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRestModal('short')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-600/30 rounded-lg text-xs font-semibold transition"
            title={activeCharacter?.optionalRules?.useGrittyRealismResting ? 'Gritty Realism Short Rest: 8 Hours' : 'Standard Short Rest: 1 Hour'}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Short Rest</span>
            {activeCharacter?.optionalRules?.useGrittyRealismResting && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">8h</span>
            )}
          </button>

          <button
            onClick={() => setShowRestModal('long')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold transition"
            title={activeCharacter?.optionalRules?.useGrittyRealismResting ? 'Gritty Realism Long Rest: 7 Days' : 'Standard Long Rest: 8 Hours'}
          >
            <Moon className="w-4 h-4 text-amber-300" />
            <span>Long Rest</span>
            {activeCharacter?.optionalRules?.useGrittyRealismResting && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">7d</span>
            )}
          </button>

          <div className="h-5 w-px bg-stone-800 my-auto" />

          <button
            onClick={handleTriggerInstall}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isStandalone
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                : deferredPrompt
                ? 'bg-amber-900/90 hover:bg-amber-800 border-amber-500 text-amber-100 shadow-md animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-amber-300'
            }`}
            title={isStandalone ? 'App Installed (Running Standalone)' : 'Install App locally as PWA (Desktop or Mobile)'}
          >
            <Laptop className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {isStandalone ? 'App Installed' : 'Install App'}
            </span>
          </button>

          <button
            onClick={() => setShowStatblockModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition shadow"
            title="Open Printable Statblock & JSON Backup Manager"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-serif font-bold">Statblock & Backup</span>
          </button>

          <button
            onClick={onExportJson}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition"
            title="Export Character JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition cursor-pointer"
            title="Import Character JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Vitals & Combat Quick Status Strip */}
      <div className="bg-stone-950/80 border-t border-stone-800 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick HP Status with Animated Orb below Rest options */}
          <div className="flex items-center gap-3 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <HpOrb hpCurrent={activeCharacter.hpCurrent} hpMax={activeCharacter.hpMax} size="sm" showLabel={false} />
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Hit Points</div>
              <div className="font-mono text-sm font-bold flex items-center gap-1">
                <span className={getHpColorClass((activeCharacter.hpCurrent / Math.max(1, activeCharacter.hpMax)) * 100)}>
                  {activeCharacter.hpCurrent}
                </span>
                <span className="text-stone-500 font-normal">/</span>
                <span className="text-stone-200">{activeCharacter.hpMax}</span>
                {activeCharacter.hpTemp > 0 && (
                  <span className="text-cyan-400 text-xs ml-1 font-semibold">
                    (+{activeCharacter.hpTemp} Temp)
                  </span>
                )}
              </div>
            </div>

            {/* Quick HP Adjust Controls */}
            <div className="flex items-center gap-1 border-l border-stone-800 pl-2">
              <input
                type="number"
                value={hpDelta}
                onChange={(e) => setHpDelta(e.target.value)}
                placeholder="0"
                className="w-12 bg-stone-800 border border-stone-700 text-center font-mono rounded text-xs py-0.5"
              />
              <button
                onClick={() => handleApplyHpChange('heal')}
                className="px-1.5 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold rounded text-[10px]"
                title="Heal HP"
              >
                +
              </button>
              <button
                onClick={() => handleApplyHpChange('damage')}
                className="px-1.5 py-0.5 bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold rounded text-[10px]"
                title="Damage HP"
              >
                -
              </button>
            </div>
          </div>

          {/* Armor Class */}
          <div
            className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800"
            title={`Armor Class: ${activeCharacter.armorClass} (${getArmorClassBreakdown(activeCharacter).explanation})`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Armor Class</div>
              <div className="font-mono text-sm font-extrabold text-amber-200">
                {activeCharacter.armorClass}
              </div>
            </div>
          </div>

          {/* Initiative */}
          <button
            onClick={onRollInitiative}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-800 hover:border-amber-500/50 transition cursor-pointer"
            title="Click to Roll Initiative!"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                Initiative <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="font-mono text-sm font-extrabold text-yellow-300">
                {formatModifier(activeCharacter.initiativeBonus)}
              </div>
            </div>
          </button>

          {/* Speed */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${
              speedInfo.isModified
                ? 'bg-amber-950/80 border-amber-600/70 text-amber-200 shadow-md'
                : 'bg-stone-900 border-stone-800'
            }`}
            title={
              speedInfo.isModified
                ? `Effective Speed: ${speedInfo.effectiveSpeed} ft (Base Speed: ${speedInfo.baseSpeed} ft | -${speedInfo.speedPenalty} ft ${speedInfo.reasons.join(', ')})`
                : `Base Walking Speed: ${speedInfo.baseSpeed} ft`
            }
          >
            <Footprints className={`w-4 h-4 ${speedInfo.isModified ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                <span>Speed</span>
                {speedInfo.isModified && (
                  <span className="text-[8px] bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1 rounded font-mono font-bold uppercase">
                    Penalized
                  </span>
                )}
              </div>
              <div className="font-mono text-sm font-bold flex items-center gap-1">
                <span className={speedInfo.isModified ? 'text-amber-300 font-extrabold' : 'text-stone-200'}>
                  {speedInfo.effectiveSpeed} ft
                </span>
                {speedInfo.isModified && (
                  <span className="text-[10px] text-stone-400 line-through font-normal">
                    ({speedInfo.baseSpeed}ft)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Proficiency Bonus */}
          <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <Award className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Prof. Bonus</div>
              <div className="font-mono text-sm font-bold text-purple-300">
                +{profBonus}
              </div>
            </div>
          </div>

          {/* Passive Perception */}
          <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
            <Eye className="w-4 h-4 text-teal-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">Passive Wis</div>
              <div className="font-mono text-sm font-bold text-teal-200">
                {passivePerception}
              </div>
            </div>
          </div>

          {/* Sanity Quick Status (Call of Cthulhu) */}
          {currentEdition === 'cthulhu' && (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/60 px-3 py-1.5 rounded-xl text-emerald-200 shadow-md">
              <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                  <span>Sanity</span>
                  <span className={`text-[8px] px-1 rounded font-mono font-bold ${
                    (activeCharacter.sanity?.madnessState || 'Sane') === 'Sane'
                      ? 'bg-emerald-900/80 text-emerald-200'
                      : 'bg-rose-900/80 text-rose-200 border border-rose-500/50'
                  }`}>
                    {activeCharacter.sanity?.madnessState || 'Sane'}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-100">
                  {activeCharacter.sanity?.current ?? 15} / {activeCharacter.sanity?.max ?? 20}
                </div>
              </div>
            </div>
          )}

          {/* Shadowrun Quick Status Banner */}
          {currentEdition === 'shadowrun' && (
            <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/60 px-3 py-1.5 rounded-xl text-cyan-200 shadow-md">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-300">Nuyen</div>
                  <div className="font-mono text-sm font-bold text-amber-300">
                    ¥{(activeCharacter.shadowrun?.nuyen ?? 25000).toLocaleString()}
                  </div>
                </div>

                <div className="hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-cyan-300">Karma</div>
                  <div className="font-mono text-sm font-bold text-cyan-100">
                    {activeCharacter.shadowrun?.karmaCurrent ?? 10}
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="text-[10px] uppercase font-bold text-cyan-300">Essence</div>
                  <div className="font-mono text-sm font-bold text-cyan-200">
                    {Math.max(0, 6.0 - (activeCharacter.shadowrun?.cyberware?.reduce((acc, c) => acc + (Number(c.essenceCost) || 0), 0) || 0)).toFixed(2)} / 6.0
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inspiration Toggle */}
          <button
            onClick={() => onUpdateCharacter({ ...activeCharacter, inspiration: !activeCharacter.inspiration })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${
              activeCharacter.inspiration
                ? 'bg-amber-900/60 border-amber-500 text-amber-200 shadow-md'
                : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold">Inspiration</div>
              <div className="font-bold text-xs">{activeCharacter.inspiration ? 'ACTIVE' : 'NONE'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Rest Confirm Modals */}
      {showRestModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-100">
            <div className="flex items-center gap-3 text-amber-400 text-lg font-serif font-bold mb-2">
              {showRestModal === 'short' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              <span>Take a {showRestModal === 'short' ? 'Short Rest' : 'Long Rest'}?</span>
            </div>
            <p className="text-sm text-stone-300 mb-4">
              {showRestModal === 'short'
                ? activeCharacter?.optionalRules?.useGrittyRealismResting
                  ? 'Gritty Realism Short Rest (8 Hours / Overnight): Recharges short-rest class features like Action Surge or Second Wind.'
                  : 'A Short Rest (at least 1 hour) recharges short-rest class features like Action Surge or Second Wind.'
                : activeCharacter?.optionalRules?.useGrittyRealismResting
                  ? 'Gritty Realism Long Rest (7 Days in Sanctuary): Restores all Hit Points, spell slots, death saves, hit dice, and both Short & Long rest features.'
                  : 'A Long Rest (8 hours) restores all Hit Points, spell slots, death saves, hit dice, and both Short & Long rest features.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestModal(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={showRestModal === 'short' ? handleShortRest : handleLongRest}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Confirm Rest
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Character Confirm Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-rose-800/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-100">
            <div className="flex items-center gap-3 text-rose-400 text-lg font-serif font-bold mb-2">
              <Trash2 className="w-6 h-6" />
              <span>Delete Character</span>
            </div>
            <p className="text-sm text-stone-300 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-amber-200">{activeCharacter.name}</strong> ({activeCharacter.race} {activeCharacter.characterClass} Lv.{activeCharacter.level})?
              {characters.length === 1 && (
                <span className="block mt-2 text-rose-300 text-xs font-semibold bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
                  ⚠️ Note: This is your last remaining character. Deleting it will restore default starting character templates.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteCharacter(activeCharacter.id);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Character</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Convert Ruleset Modal */}
      {showConvertModal && createPortal(
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-stone-900 border border-theme-accent rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 shrink-0">
              <h3 className="text-lg font-serif font-bold text-theme-text flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-theme-accent" />
                Convert {activeCharacter.name}'s Ruleset
              </h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-stone-400 hover:text-stone-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed shrink-0">
              Converting rulesets adapts <strong className="text-theme-text">{activeCharacter.name}</strong> to your target TRPG mechanics while preserving equipment, backstory, notes, and portrait data.
            </p>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {[
                { id: '5e' as RuleEdition, title: 'D&D 5th Edition (5e)', desc: 'Standard 5e stats, proficiency bonuses, and 18 skills.' },
                { id: '3.5e' as RuleEdition, title: 'D&D 3.5 Edition (3.5e)', desc: 'Base Attack Bonus (BAB), Fort/Ref/Will saves, Touch AC, and 30+ skill ranks.' },
                { id: 'shadowrun' as RuleEdition, title: 'Shadowrun', desc: 'Cyberware, Essence, Matrix/Decking, Physical/Stun monitors, Nuyen & Karma.' },
                { id: 'pathfinder' as RuleEdition, title: 'Pathfinder 2e', desc: '3-Action combat, proficiency ranks, and tactical fantasy features.' },
                { id: 'cthulhu' as RuleEdition, title: 'Call of Cthulhu (7e)', desc: 'Sanity points, Eldritch horror tracking, and d100 skill percentiles.' },
              ].map((edition) => {
                const isCurrent = (activeCharacter.edition || '5e') === edition.id;

                return (
                  <button
                    key={edition.id}
                    disabled={isCurrent}
                    onClick={() => {
                      const updated = convertCharacterEdition(activeCharacter, edition.id);
                      onUpdateCharacter(updated);
                      if (onSystemChange) {
                        onSystemChange(edition.id);
                      }
                      setShowConvertModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-stone-950 border-stone-800 opacity-50 cursor-not-allowed'
                        : 'bg-stone-950/80 hover:bg-stone-950 border-stone-800 hover:border-theme-accent text-stone-200 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-sm flex items-center gap-2">
                        <span>{edition.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-stone-800 text-amber-400 font-mono font-bold px-2 py-0.5 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">{edition.desc}</p>
                    </div>
                    {!isCurrent && <ChevronRight className="w-4 h-4 text-theme-accent shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-800 shrink-0">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
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

      {/* Statblock Export & Printable PDF Modal */}
      <StatblockExportModal
        character={activeCharacter}
        characters={characters}
        isOpen={showStatblockModal}
        onClose={() => setShowStatblockModal(false)}
        onExportJson={onExportJson}
        onImportJson={onImportJson}
      />

      {/* Level Progression & Character Advancement Modal */}
      {showLevelModal && (
        <LevelProgressionModal
          character={activeCharacter}
          onClose={() => setShowLevelModal(false)}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </header>
  );
};
