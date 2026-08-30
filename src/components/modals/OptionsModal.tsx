import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Volume1,
  X,
  Trash2,
  RefreshCw,
  Database,
  Sliders,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
  FlaskConical,
  ShieldAlert,
  Sword,
  Dices,
  HeartPulse,
  TrendingUp,
  Skull,
  Radio,
  AlertTriangle,
  Check,
  Info,
  Smartphone,
  Upload,
  Download,
  UserCheck,
  ChevronRight,
  Award,
  Code2,
  Heart,
  MessageSquare,
  Copy,
  Crown,
  SlidersHorizontal,
  BookOpen,
  LogOut,
  PowerOff,
  Globe,
  Keyboard,
  Palette,
  Eye
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { SheetLayoutOptionsTab } from './options/SheetLayoutOptionsTab';
import { HotkeysOptionsTab } from './options/HotkeysOptionsTab';
import { SubscriptionOptionsTab } from './options/SubscriptionOptionsTab';
import { ThemesTab } from './options/ThemesTab';
import { SoundOptionsTab } from './options/SoundOptionsTab';
import { AccessibilityOptionsTab } from './options/AccessibilityOptionsTab';
import { StatblockExportModal } from '../character/StatblockExportModal';
import { CharacterData, RuleEdition } from '../../types';
import { UserProfile, GameSession, logoutUser } from '../../lib/firebase';
import { systemRegistry } from '../../systems';
import {
  isSoundEnabled,
  setSoundEnabled,
  getMasterVolume,
  setMasterVolume,
  playDiceSound,
  playHitSound,
  playMissSound,
  playFireSound,
  playIceColdSound,
  playLightningSound,
  playAcidPoisonSound,
  playHealSound,
  playSpellCastSound,
  playInitiativeTurnSound,
  playLevelUpSound,
  playDeathSound
} from '../../utils/soundEffects';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'themes' | 'sound' | 'app' | 'layout' | 'a11y' | 'character' | 'hotkeys' | 'subscription' | 'credits';
  currentUser?: UserProfile | null;
  activeSession?: GameSession | null;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (char: CharacterData) => void;
  onSystemChange?: (edition: RuleEdition) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenUpgradeModal?: (reason?: string) => void;
  onOpenAuthModal?: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'themes',
  currentUser,
  activeSession,
  activeCharacter,
  onUpdateCharacter,
  onSystemChange,
  onExportJson,
  onImportJson,
  onOpenUpgradeModal,
  onOpenAuthModal
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'themes' | 'sound' | 'app' | 'layout' | 'a11y' | 'character' | 'hotkeys' | 'subscription' | 'credits'>(initialCategory);
  const [muted, setMuted] = useState<boolean>(!isSoundEnabled());
  const [volume, setVolumeState] = useState<number>(() => Math.round(getMasterVolume() * 100));
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [showStatblockModal, setShowStatblockModal] = useState<boolean>(false);

  // Clear cache & factory reset state
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [storageStats, setStorageStats] = useState<{ count: number; sizeKB: string }>({ count: 0, sizeKB: '0.0' });

  // Discord handle copy state
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  const handleCopyHandle = (handle: string) => {
    navigator.clipboard.writeText(handle);
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      setMuted(!isSoundEnabled());
      setVolumeState(Math.round(getMasterVolume() * 100));
      setActiveCategory(initialCategory);
      setShowClearCacheConfirm(false);
      setShowFactoryResetConfirm(false);
      setCacheClearedSuccess(null);
      setIsResetting(false);
      calculateStorageStats();
    }
  }, [isOpen, initialCategory]);

  const calculateStorageStats = () => {
    try {
      let totalBytes = 0;
      const count = localStorage.length;
      for (let i = 0; i < count; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      setStorageStats({
        count,
        sizeKB: (totalBytes / 1024).toFixed(1)
      });
    } catch (e) {
      setStorageStats({ count: 0, sizeKB: '0.0' });
    }
  };

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setSoundEnabled(!newMuted);
  };

  const handleVolumeChange = (newVolPct: number) => {
    setVolumeState(newVolPct);
    const floatVal = newVolPct / 100;
    setMasterVolume(floatVal);
    if (newVolPct > 0 && muted) {
      setMuted(false);
      setSoundEnabled(true);
    } else if (newVolPct === 0 && !muted) {
      setMuted(true);
      setSoundEnabled(false);
    }
  };

  const playTest = (name: string, fn: () => void) => {
    if (muted) {
      setMuted(false);
      setSoundEnabled(true);
    }
    setLastPlayed(name);
    fn();
    setTimeout(() => {
      setLastPlayed(null);
    }, 800);
  };

  const handleClearCache = async () => {
    setIsResetting(true);
    try {
      // 1. Clear Web Storages
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear CacheStorage
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      // 3. Unregister active service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      setCacheClearedSuccess('Application cache and local storage cleared! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (e) {
      console.error('Failed to clear cache:', e);
      window.location.reload();
    }
  };

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      // 1. Sign out of Firebase Auth
      await logoutUser();

      // 2. Clear Web Storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Delete IndexedDB databases (where Firebase Auth session & offline tokens reside)
      if ('indexedDB' in window && window.indexedDB.databases) {
        try {
          const dbs = await window.indexedDB.databases();
          await Promise.all(
            dbs.map((dbInfo) => {
              if (dbInfo.name) {
                return new Promise((resolve) => {
                  const req = window.indexedDB.deleteDatabase(dbInfo.name!);
                  req.onsuccess = () => resolve(true);
                  req.onerror = () => resolve(false);
                  req.onblocked = () => resolve(false);
                });
              }
              return Promise.resolve(true);
            })
          );
        } catch (idbErr) {
          console.warn('Could not enumerate/delete IndexedDB databases:', idbErr);
        }
      }

      // 4. Clear CacheStorage
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      // 5. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }

      setCacheClearedSuccess('Factory Reset Complete! Wiped all local data, auth tokens, and caches. Restarting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (e) {
      console.error('Failed to perform factory reset:', e);
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-amber-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-4 border-b border-amber-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-amber-400 font-serif font-bold text-lg">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>{t('options.title', 'Options')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Navigation Tabs */}
        <div className="bg-stone-950 px-3 py-2.5 sm:px-4 border-b border-stone-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin shrink-0">
          <button
            onClick={() => setActiveCategory('themes')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'themes'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Themes & Colors</span>
          </button>

          <button
            onClick={() => setActiveCategory('sound')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'sound'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{t('options.tabSound', 'Sound')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('app')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'app'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('options.tabApp', 'App')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('layout')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'layout'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('options.tabLayout', 'Layout')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('a11y')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'a11y'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Accessibility</span>
          </button>

          <button
            onClick={() => setActiveCategory('hotkeys')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'hotkeys'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('options.tabHotkeys', 'Hotkeys')}</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setActiveCategory('character')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
                activeCategory === 'character'
                  ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('options.tabCharacter', 'Character')}</span>
            </button>
          )}

          <button
            onClick={() => setActiveCategory('subscription')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'subscription'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-amber-200 hover:bg-stone-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Supporter & Pro</span>
          </button>

          <button
            onClick={() => setActiveCategory('credits')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold font-serif transition shrink-0 cursor-pointer ${
              activeCategory === 'credits'
                ? 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-stone-950/80 text-stone-400 border border-stone-800/60 hover:text-stone-200 hover:bg-stone-900/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('options.tabCredits', 'Credits')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* CATEGORY 0: THEMES & COLOR PALETTES */}
          {activeCategory === 'themes' && (
            <div className="animate-fadeIn">
              <ThemesTab onOpenUpgradeModal={onOpenUpgradeModal} />
            </div>
          )}

          {/* CATEGORY 1: SOUND OPTIONS & AMBIENCE */}
          {activeCategory === 'sound' && (
            <div className="animate-fadeIn">
              <SoundOptionsTab
                currentUser={currentUser}
                activeSession={activeSession}
                onOpenUpgradeModal={onOpenUpgradeModal}
              />
            </div>
          )}

          {/* CATEGORY 2: APP OPTIONS & CACHE CLEARING */}
          {activeCategory === 'app' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Application Language Selector */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                  <div className="flex items-center gap-2.5 text-amber-400 font-serif font-bold text-sm">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>{t('options.language', 'Application Language')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 font-bold">
                    {SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English'}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {t('options.languageDesc', 'Select your preferred language. The entire interface, navigation, and AI Oracle will automatically adapt.')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm'
                            : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                        }`}
                      >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">{lang.nativeName}</div>
                          <div className="text-[10px] text-stone-400 truncate">{lang.name}</div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* App Cache & Local Storage Management Card */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                  <div className="flex items-center gap-2.5 text-cyan-400 font-serif font-bold text-sm">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Application Cache & Storage</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    {storageStats.sizeKB} KB ({storageStats.count} items)
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Clearing the application cache purges cached preferences, offline audio assets, and local temporary state. Use this if you experience UI rendering glitches or stale character sheet data.
                </p>

                {cacheClearedSuccess ? (
                  <div className="p-3 bg-emerald-950/90 border border-emerald-500/80 rounded-xl flex items-center gap-2 text-xs text-emerald-200 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{cacheClearedSuccess}</span>
                  </div>
                ) : showClearCacheConfirm ? (
                  <div className="p-4 bg-rose-950/80 border border-rose-600/80 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5 text-rose-200 text-xs">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-300 block mb-0.5">Are you sure you want to clear cache?</strong>
                        <span>This will reset local application settings, clear web cache, and reload the page.</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowClearCacheConfirm(false)}
                        disabled={isResetting}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition border border-stone-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearCache}
                        disabled={isResetting}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isResetting ? 'Clearing...' : 'Yes, Clear Cache & Reload'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowClearCacheConfirm(true);
                      setShowFactoryResetConfirm(false);
                    }}
                    className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-950/80 text-rose-200 border border-rose-700/50 hover:border-rose-500 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                    <span>Clear Cache & Reload App</span>
                  </button>
                )}
              </div>

              {/* Complete Factory Reset & Wipe Card */}
              <div className="bg-stone-950 p-4 rounded-xl border border-red-900/50 space-y-4">
                <div className="flex items-center justify-between border-b border-red-950 pb-3">
                  <div className="flex items-center gap-2.5 text-rose-400 font-serif font-bold text-sm">
                    <PowerOff className="w-4 h-4 text-rose-400" />
                    <span>Factory Reset & Full App Wipe</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60 font-bold">
                    HARD RESET
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Performs a complete application reset: logs out of Firebase Authentication, wipes IndexedDB session tokens, deletes all local characters, clears LocalStorage & CacheStorage, and reboots to a fresh factory install state.
                </p>

                {showFactoryResetConfirm ? (
                  <div className="p-4 bg-red-950 border border-red-500 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5 text-rose-100 text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-white block mb-0.5">WARNING: Total Application Reset</strong>
                        <span>This will log out your account, delete local IndexedDB authentication credentials, and clear all locally stored characters and configurations.</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-900/60">
                      <button
                        onClick={() => setShowFactoryResetConfirm(false)}
                        disabled={isResetting}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition border border-stone-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFactoryReset}
                        disabled={isResetting}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>{isResetting ? 'Resetting App...' : 'Yes, Factory Reset Everything'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowFactoryResetConfirm(true);
                      setShowClearCacheConfirm(false);
                    }}
                    className="w-full py-2.5 px-4 bg-red-950/70 hover:bg-red-900 text-red-100 border border-red-600/60 hover:border-red-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <PowerOff className="w-4 h-4 text-red-400 group-hover:scale-110 transition" />
                    <span>Factory Reset & Wipe All Data (Auth & Storage)</span>
                  </button>
                )}
              </div>

              {/* App Diagnostics / Info Section */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-stone-300 text-xs font-bold font-serif mb-1">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>System Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-400">
                  <div className="bg-stone-900 p-2 rounded border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">APPLICATION</span>
                    <span className="text-stone-200 font-bold">Nexus</span>
                  </div>
                  <div className="bg-stone-900 p-2 rounded border border-stone-800">
                    <span className="text-stone-500 block text-[10px]">VERSION</span>
                    <span className="text-amber-300 font-bold">v1.1.0-nexus</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY: SHEET LAYOUT & FEATURES CUSTOMIZER */}
          {activeCategory === 'layout' && (
            <SheetLayoutOptionsTab
              activeCharacter={activeCharacter}
              onSystemChange={onSystemChange}
            />
          )}

          {/* CATEGORY 3: CHARACTER MANAGEMENT (Import & Export Backup) */}
          {activeCategory === 'character' && (
            <div className="space-y-5 animate-fadeIn">
              {!currentUser ? (
                <div className="bg-stone-950 p-6 rounded-xl border border-stone-800 text-center space-y-3">
                  <UserCheck className="w-8 h-8 text-stone-500 mx-auto" />
                  <div className="text-sm font-serif font-bold text-stone-300">Logged Out</div>
                  <p className="text-xs text-stone-400">
                    Please log in or select a user profile to access character backup, export, and import tools.
                  </p>
                </div>
              ) : (
                <>
                  {/* CHARACTER IMPORT (Available when logged in) */}
                  <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                      <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Import Character Sheet</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                        JSON File
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Load a previously exported <code className="text-amber-300 font-mono">.json</code> character backup file into your active profile.
                    </p>
                    <label
                      className="w-full py-2.5 px-4 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-600/60 hover:border-amber-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Upload className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                      <span>Select & Import Character JSON File</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (onImportJson) onImportJson(e);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* CHARACTER EXPORT (Available when character is selected) */}
                  {!activeCharacter ? (
                    <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center space-y-2">
                      <p className="text-xs text-stone-400">
                        💡 Select a character sheet from the top menu to enable <strong>Export</strong> options.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* EXPORT CHARACTER */}
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                          <div className="flex items-center gap-2 text-cyan-400 font-serif font-bold text-sm">
                            <Download className="w-4 h-4 text-cyan-400" />
                            <span>Export {activeCharacter.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                            Backup (.json)
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          Download a complete standalone backup file of <strong className="text-amber-300">{activeCharacter.name}</strong> including stats, inventory, spells, and backstory.
                        </p>
                        <button
                          onClick={onExportJson}
                          className="w-full py-2.5 px-4 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-600/60 hover:border-cyan-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                          <span>Export {activeCharacter.name} JSON Backup</span>
                        </button>
                      </div>

                      {/* PRINTABLE STATBLOCK */}
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                          <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
                            <BookOpen className="w-4 h-4 text-amber-400" />
                            <span>Printable Statblock</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-bold">
                            PDF / Print
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          Open a clean, printable D&D statblock of <strong className="text-amber-300">{activeCharacter.name}</strong> formatted for physical tabletop play, PDF export, and markdown copying.
                        </p>
                        <button
                          onClick={() => setShowStatblockModal(true)}
                          className="w-full py-2.5 px-4 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 hover:border-amber-400 rounded-xl font-bold text-xs transition shadow flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                          <span className="font-serif font-bold">Open Printable Statblock</span>
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          {/* CATEGORY: ACCESSIBILITY & VISUAL ERGONOMICS */}
          {activeCategory === 'a11y' && (
            <div className="animate-fadeIn">
              <AccessibilityOptionsTab />
            </div>
          )}

          {/* CATEGORY: HOTKEYS & SHORTCUTS */}
          {activeCategory === 'hotkeys' && (
            <div className="animate-fadeIn">
              <HotkeysOptionsTab />
            </div>
          )}

          {/* CATEGORY 4: CREDITS & ATTRIBUTIONS */}
          {activeCategory === 'credits' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-950/80 via-stone-950 to-purple-950/80 p-4 rounded-xl border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-amber-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Project Credits & Vision</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-700/60 px-2 py-0.5 rounded-full font-bold">
                    Core Contributors
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Nexus TRPG Platform is built for Dungeon Masters, players, and tabletop roleplaying enthusiasts worldwide.
                </p>
              </div>

              {/* Developer Card: Freeze */}
              <div className="bg-stone-950 p-4 rounded-xl border border-amber-500/30 space-y-3 relative overflow-hidden group hover:border-amber-500/60 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-serif font-bold text-lg shadow">
                      <Code2 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-amber-100">Freeze</h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Lead Developer
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">Lead Full-Stack Developer & Systems Architect</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                  Engineered the multi-system ruleset mechanics, WebRTC party voice, initiative tracker, interactive knowledge graph, and sound synthesizer.
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                  <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Discord:</span>
                    <span className="text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
                      @freezecoaching
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyHandle('freezecoaching')}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 rounded-lg text-xs transition flex items-center gap-1 font-mono"
                  >
                    {copiedHandle === 'freezecoaching' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>Copy Discord</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Visionary Card: ChaosDwarf */}
              <div className="bg-stone-950 p-4 rounded-xl border border-purple-500/30 space-y-3 relative overflow-hidden group hover:border-purple-500/60 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 font-serif font-bold text-lg shadow">
                      <Crown className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-base text-purple-100">ChaosDwarf</h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Project Creator
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">Original Idea & Concept Creator</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                  Conceived the original vision for a unified digital tabletop companion bringing D&D 5e, 3.5e, Pathfinder, Shadowrun, and Call of Cthulhu into one digital workspace.
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                  <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Discord:</span>
                    <span className="text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
                      @chaosdwarf7
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyHandle('chaosdwarf7')}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-purple-300 rounded-lg text-xs transition flex items-center gap-1 font-mono"
                  >
                    {copiedHandle === 'chaosdwarf7' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>Copy Discord</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Special Thanks Badge */}
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span>Special thanks to the TRPG community and tabletop gaming groups everywhere!</span>
              </div>
            </div>
          )}

          {/* CATEGORY: SUBSCRIPTION / SUPPORTER */}
          {activeCategory === 'subscription' && (
            <SubscriptionOptionsTab
              onOpenUpgradeModal={onOpenUpgradeModal || (() => {})}
              onOpenAuthModal={onOpenAuthModal}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            {activeCategory === 'sound'
              ? (muted ? '🔇 Sound disabled' : `🔊 Active (${volume}% volume)`)
              : activeCategory === 'hotkeys'
              ? '⌨️ Hotkey Keybindings Manager'
              : activeCategory === 'subscription'
              ? '✨ Supporter Perks & PayPal Subscriptions'
              : activeCategory === 'credits'
              ? '🏆 Nexus Platform Credits'
              : `⚙️ App Options (${storageStats.sizeKB} KB Cache)`}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition shadow"
          >
            Done
          </button>
        </div>
      </div>

      {/* Statblock Export & Printable PDF Modal */}
      {showStatblockModal && activeCharacter && (
        <StatblockExportModal
          character={activeCharacter}
          characters={[]}
          isOpen={showStatblockModal}
          onClose={() => setShowStatblockModal(false)}
          onExportJson={onExportJson || (() => {})}
          onImportJson={onImportJson || (() => {})}
        />
      )}
    </div>
  );
};
