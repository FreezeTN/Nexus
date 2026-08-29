import React, { useState } from 'react';
import { DiceRollResult } from '../types';
import { Dices, Trash2, History, Sparkles, ChevronDown, ChevronUp, Volume2, VolumeX, Palette, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playDiceSound, isDiceSoundEnabled, setDiceSoundEnabled } from '../utils/diceAudio';
import { useLanguage } from '../i18n/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import { DiceSkin, DICE_SKINS } from './dice/diceSkins';

interface DiceRollerProps {
  rollLogs: DiceRollResult[];
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onClearLogs: () => void;
  activeRollResult?: DiceRollResult | null;
  onOpenAudioModal?: () => void;
  isPhysicalDiceMode?: boolean;
  onTogglePhysicalDiceMode?: () => void;
  onOpenUpgradeModal?: (reason?: string, requiredTier?: 'hero' | 'guild') => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  rollLogs,
  onRoll,
  onClearLogs,
  activeRollResult,
  onOpenAudioModal,
  isPhysicalDiceMode = false,
  onTogglePhysicalDiceMode,
  onOpenUpgradeModal
}) => {
  const { t } = useLanguage();
  const { isHero, isGuild, isDeveloper, openUpgradeModal } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDie, setSelectedDie] = useState<number>(20);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [customModifier, setCustomModifier] = useState<number>(0);
  const [rollMode, setRollMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [customLabel, setCustomLabel] = useState<string>(t('dice.customRoll', 'Custom Roll'));
  const [soundOn, setSoundOn] = useState<boolean>(isDiceSoundEnabled());
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [currentAnimatedRolls, setCurrentAnimatedRolls] = useState<number[]>([20]);
  const [activeSkin, setActiveSkin] = useState<string>(() => {
    try {
      return localStorage.getItem('nexus_dice_skin') || 'standard';
    } catch {
      return 'standard';
    }
  });
  const [showSkinPicker, setShowSkinPicker] = useState(false);

  // Sync external roll results
  React.useEffect(() => {
    if (activeRollResult && activeRollResult.diceRolls && activeRollResult.diceRolls.length > 0) {
      setCurrentAnimatedRolls(activeRollResult.diceRolls);
      setIsRollingAnimation(true);
    }
  }, [activeRollResult]);

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  const handleSelectSkin = (skin: DiceSkin) => {
    // Lead developers bypass all locks
    if (!isDeveloper) {
      if (skin.requiredTier === 'guild' && !isGuild) {
        const msg = `The "${skin.name}" cosmetic dice theme requires the Guild Master Supporter tier.`;
        if (onOpenUpgradeModal) {
          onOpenUpgradeModal(msg, 'guild');
        } else {
          openUpgradeModal(msg, 'guild');
        }
        return;
      }
      if (skin.requiredTier === 'hero' && !isHero) {
        const msg = `The "${skin.name}" cosmetic dice theme requires the Hero Supporter tier.`;
        if (onOpenUpgradeModal) {
          onOpenUpgradeModal(msg, 'hero');
        } else {
          openUpgradeModal(msg, 'hero');
        }
        return;
      }
    }

    setActiveSkin(skin.id);
    try {
      localStorage.setItem('nexus_dice_skin', skin.id);
    } catch {}
  };

  const currentSkin = DICE_SKINS.find(s => s.id === activeSkin) || DICE_SKINS[0];

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setDiceSoundEnabled(next);
    if (next) playDiceSound();
  };

  const handleQuickRoll = (d: number) => {
    playDiceSound();
    
    // Generate animated visual dice simulation
    const simulatedRolls: number[] = [];
    const countToRoll = d === 20 && rollMode !== 'normal' ? 2 : diceCount;
    for (let i = 0; i < countToRoll; i++) {
      simulatedRolls.push(Math.floor(Math.random() * d) + 1);
    }
    setCurrentAnimatedRolls(simulatedRolls);
    setIsRollingAnimation(true);

    onRoll(customLabel || `d${d} ${t('dice.roll', 'Roll')}`, d, diceCount, customModifier, d === 20 ? rollMode : 'normal');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Active Quick Result Popup toast */}
      <AnimatePresence>
        {activeRollResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-amber-950/90 text-amber-100 border-2 border-amber-500/80 rounded-xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full"
          >
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1">
              <span>{activeRollResult.label}</span>
              <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded text-amber-300">
                {activeRollResult.mode !== 'normal' ? activeRollResult.mode : activeRollResult.expression}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-3xl font-extrabold text-amber-200 flex items-center gap-2">
                <span>{activeRollResult.total}</span>
                {activeRollResult.isNat20 && (
                  <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full animate-bounce">
                    NAT 20!
                  </span>
                )}
                {activeRollResult.isNat1 && (
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                    NAT 1!
                  </span>
                )}
              </div>
              <div className="text-xs text-amber-300/80 text-right">
                <div>Dice: [{activeRollResult.diceRolls.join(', ')}]</div>
                <div>Mod: {activeRollResult.modifier >= 0 ? `+${activeRollResult.modifier}` : activeRollResult.modifier}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Dice Roller Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-stone-900 border-2 border-amber-600/60 rounded-2xl p-4 shadow-2xl w-80 sm:w-96 text-stone-200 flex flex-col gap-3 backdrop-blur-md"
          >
            {/* Header / Skin & Sound Controls */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2 font-serif font-bold text-amber-400">
                <Dices className="w-5 h-5 text-amber-500" />
                <span>{t('dice.diceTray', 'Dice Tray')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {onTogglePhysicalDiceMode && (
                  <button
                    onClick={onTogglePhysicalDiceMode}
                    className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
                      isPhysicalDiceMode
                        ? 'bg-amber-900/80 text-amber-300 border-amber-600/50 hover:bg-amber-800'
                        : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                    title={isPhysicalDiceMode ? 'Switch to Virtual Dice' : 'Switch to Tabletop Physical Dice Mode'}
                  >
                    <span className="text-[10px] font-mono font-bold">
                      {isPhysicalDiceMode ? '🎲 Virtual' : '🖐️ Physical'}
                    </span>
                  </button>
                )}
                {/* Dice Cosmetic Skins Picker Button */}
                <button
                  onClick={() => setShowSkinPicker(!showSkinPicker)}
                  className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
                    showSkinPicker
                      ? 'bg-purple-950/90 text-purple-300 border-purple-500/80 hover:bg-purple-900 shadow-md'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-purple-300'
                  }`}
                  title="Dice Skins & Aesthetics"
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                </button>
                <button
                  onClick={handleToggleSound}
                  className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
                    isDiceSoundEnabled()
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600/50 hover:bg-amber-900'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
                  }`}
                  title={isDiceSoundEnabled() ? 'Mute Roll Sound FX' : 'Enable Roll Sound FX'}
                >
                  {isDiceSoundEnabled() ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                </button>
                {onOpenAudioModal && (
                  <button
                    onClick={onOpenAudioModal}
                    className="p-1.5 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition text-[10px] font-mono"
                    title="Open Audio Options"
                  >
                    {t('common.options', 'Options')}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-stone-400 hover:text-stone-200 p-1 rounded-md"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dice Skin Selector Drawer */}
            {showSkinPicker && (
              <div className="bg-stone-950/90 border border-purple-500/40 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Cosmetic Dice Materials</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Active: <strong className="text-amber-300">{currentSkin.name}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {DICE_SKINS.map((skin) => {
                    const isLocked = !isDeveloper && (
                      (skin.requiredTier === 'guild' && !isGuild) ||
                      (skin.requiredTier === 'hero' && !isHero)
                    );
                    const isSelected = activeSkin === skin.id;

                    return (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => handleSelectSkin(skin)}
                        className={`p-2 rounded-lg border text-left text-xs transition flex flex-col justify-between relative overflow-hidden bg-gradient-to-br cursor-pointer ${skin.previewBg} ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-500/50 shadow-md scale-102'
                            : 'border-stone-700/80 hover:border-stone-500 hover:scale-101'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-bold text-[11px] truncate ${skin.textColor}`}>
                            {skin.name}
                          </span>
                          {isLocked && (
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-stone-300">
                          <span className="uppercase">
                            {skin.requiredTier === 'free' ? 'Standard' : skin.requiredTier}
                          </span>
                          {isSelected && <span className="text-emerald-400 font-bold">● Active</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode Banner if Physical Dice Mode is Active */}
            {isPhysicalDiceMode && (
              <div className="bg-amber-950/50 border border-amber-600/50 rounded-xl p-2 text-xs flex items-center justify-between text-amber-200">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-semibold text-[11px]">{t('dice.tabletopModeActive', 'Tabletop Mode Active')}:</span>
                  <span className="text-[10px] text-amber-300/80">{t('dice.promptsRealRoll', 'Prompts for real roll result')}</span>
                </div>
                {onTogglePhysicalDiceMode && (
                  <button
                    onClick={onTogglePhysicalDiceMode}
                    className="text-[10px] underline text-amber-400 hover:text-amber-200 font-mono"
                  >
                    {t('dice.switch', 'Switch')}
                  </button>
                )}
              </div>
            )}

            {/* Dice Selector Buttons */}
            <div className="grid grid-cols-7 gap-1">
              {diceTypes.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDie(d)}
                  className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all ${
                    selectedDie === d
                      ? 'bg-amber-600 text-white border-amber-400 shadow'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                  }`}
                >
                  d{d}
                </button>
              ))}
            </div>

            {/* Roll Mode Toggle for d20 */}
            {selectedDie === 20 && (
              <div className="flex bg-stone-800/80 p-1 rounded-lg border border-stone-700 text-xs font-medium">
                <button
                  onClick={() => setRollMode('advantage')}
                  className={`flex-1 py-1 rounded text-center transition ${
                    rollMode === 'advantage' ? 'bg-emerald-700 text-white font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t('dice.advantage', 'Advantage')}
                </button>
                <button
                  onClick={() => setRollMode('normal')}
                  className={`flex-1 py-1 rounded text-center transition ${
                    rollMode === 'normal' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t('dice.normal', 'Normal')}
                </button>
                <button
                  onClick={() => setRollMode('disadvantage')}
                  className={`flex-1 py-1 rounded text-center transition ${
                    rollMode === 'disadvantage' ? 'bg-rose-700 text-white font-bold' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t('dice.disadvantage', 'Disadvantage')}
                </button>
              </div>
            )}

            {/* Inputs: Count, Modifier & Label */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">{t('dice.numberOfDice', 'Number of Dice')}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-center text-stone-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">{t('dice.modifier', 'Modifier (+/-)')}</label>
                <input
                  type="number"
                  value={customModifier}
                  onChange={(e) => setCustomModifier(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-center text-stone-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1">{t('dice.rollTag', 'Roll Tag')}</label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Check"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-100 text-xs"
                />
              </div>
            </div>

            {/* Roll Trigger Button */}
            <button
              onClick={() => handleQuickRoll(selectedDie)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg border border-amber-400/30 flex items-center justify-center gap-2 text-sm transition transform active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('dice.roll', 'Roll')} {diceCount}d{selectedDie} {customModifier >= 0 ? `+${customModifier}` : customModifier}</span>
            </button>

            {/* Roll Logs History */}
            <div className="border-t border-stone-800 pt-2 max-h-40 overflow-y-auto space-y-1.5 pr-1">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span className="flex items-center gap-1 font-semibold text-stone-300">
                  <History className="w-3.5 h-3.5" /> {t('dice.recentRolls', 'Recent Rolls')}
                </span>
                {rollLogs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="text-stone-500 hover:text-rose-400 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> {t('common.clear', 'Clear')}
                  </button>
                )}
              </div>

              {rollLogs.length === 0 ? (
                <div className="text-xs text-stone-500 text-center py-2 italic">
                  {t('dice.noRollsYet', 'No dice rolls yet. Click any skill, stat, weapon or spell to roll!')}
                </div>
              ) : (
                rollLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="bg-stone-800/60 rounded-lg p-2 text-xs flex justify-between items-center border border-stone-800"
                  >
                    <div>
                      <div className="font-medium text-amber-300/90">{log.label}</div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {log.expression} ({log.diceRolls.join(', ')}) {log.modifier >= 0 ? `+${log.modifier}` : log.modifier}
                      </div>
                    </div>
                    <div className="text-base font-bold text-amber-200 font-mono pl-2">
                      {log.total}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full shadow-2xl border-2 flex items-center gap-2 group transition transform active:scale-95 cursor-pointer ${
          isPhysicalDiceMode
            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-amber-100 border-amber-400 ring-2 ring-amber-500/40 shadow-amber-950/80'
            : 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 border-amber-400/50'
        }`}
        title={isPhysicalDiceMode ? 'Physical Tabletop Mode Active' : 'Dice Tray'}
      >
        <Dices className={`w-6 h-6 ${isPhysicalDiceMode ? 'text-amber-200 animate-pulse' : 'text-amber-300'} group-hover:rotate-12 transition-transform`} />
        <span className="hidden md:inline font-serif font-bold text-sm pr-1">
          {isPhysicalDiceMode ? t('dice.physicalDice', 'Physical Dice') : t('dice.diceTray', 'Dice Tray')}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
};
