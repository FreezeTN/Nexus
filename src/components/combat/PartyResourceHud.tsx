import React, { useState } from 'react';
import { CharacterData, Party } from '../../types';
import { UserProfile, GameSession, SessionMember } from '../../lib/firebase';
import { 
  Heart, 
  Shield, 
  Eye, 
  Sparkles, 
  Activity, 
  Zap, 
  Plus, 
  Minus, 
  Crown, 
  User, 
  Moon, 
  Flame, 
  RefreshCw,
  Skull,
  Crosshair,
  AlertCircle,
  Dices,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getEffectiveMaxHp, getPassivePerception, formatModifier, isCharacterDead } from '../../utils/dndCalculations';
import { useLanguage } from '../../i18n/LanguageContext';

interface PartyResourceHudProps {
  characters: CharacterData[];
  activeSession?: GameSession | null;
  currentUser?: UserProfile | null;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onSelectCharacter?: (id: string) => void;
  activeCharacterId?: string;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  isCompact?: boolean;
}

export const PartyResourceHud: React.FC<PartyResourceHudProps> = ({
  characters,
  activeSession,
  currentUser,
  onUpdateCharacter,
  onSelectCharacter,
  activeCharacterId,
  onRoll,
  isCompact = false
}) => {
  const { t } = useLanguage();
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [hpAdjustAmount, setHpAdjustAmount] = useState<Record<string, number>>({});

  const isDm = Boolean(currentUser && activeSession && activeSession.dmUid === currentUser.uid);

  // Filter player characters relevant to this campaign or all non-monsters
  const partyCharacters = characters.filter(c => 
    !c.isMonster && 
    !c.isVendor && 
    c.characterClass?.toLowerCase() !== 'monster'
  );

  if (partyCharacters.length === 0) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 text-center text-stone-400 text-sm">
        <Activity className="w-5 h-5 mx-auto mb-1 text-stone-500 opacity-60" />
        No active party characters found. Add or create party members to monitor real-time resources.
      </div>
    );
  }

  const handleAdjustHp = (char: CharacterData, delta: number) => {
    if (!onUpdateCharacter) return;
    const maxHp = getEffectiveMaxHp(char);
    const currentHp = char.hpCurrent ?? maxHp;
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));
    onUpdateCharacter({
      ...char,
      hpCurrent: newHp
    });
  };

  const handleToggleSpellSlot = (char: CharacterData, level: number, slotIndex: number) => {
    if (!onUpdateCharacter) return;
    const slots = char.spellSlots || [];
    const targetSlot = slots.find(s => s.level === level);
    if (!targetSlot) return;

    // Toggle slot: if slotIndex < current (available), decrement by 1; else increment
    const isCurrentlyUsed = slotIndex >= targetSlot.current;
    const newCurrent = isCurrentlyUsed 
      ? Math.min(targetSlot.max, targetSlot.current + 1)
      : Math.max(0, targetSlot.current - 1);

    const updatedSlots = slots.map(s => s.level === level ? { ...s, current: newCurrent } : s);
    onUpdateCharacter({
      ...char,
      spellSlots: updatedSlots
    });
  };

  const handleUseHitDie = (char: CharacterData) => {
    if (!onUpdateCharacter) return;
    const currentHitDice = char.hitDiceCurrent ?? (char.level || 1);
    if (currentHitDice <= 0) return;

    const newHitDice = currentHitDice - 1;
    const conMod = Math.floor(((char.abilities?.CON?.score || 10) - 10) / 2);
    const dieType = parseInt((char.hitDiceTotal || '1d8').replace(/[^\d]/g, ''), 10) || 8;

    if (onRoll) {
      onRoll(`Short Rest Hit Die (${char.name})`, dieType, 1, conMod, 'normal');
    }

    onUpdateCharacter({
      ...char,
      hitDiceCurrent: newHitDice
    });
  };

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
            {activeSession ? `${activeSession.name} — Party Resource HUD` : 'Party Health & Resource HUD'}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            Live Synced ({partyCharacters.length} PCs)
          </span>
        </div>
        {isDm && (
          <span className="text-[10px] text-amber-400/90 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            👑 DM Master Overview
          </span>
        )}
      </div>

      {/* Grid of party members */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {partyCharacters.map((char) => {
          const maxHp = getEffectiveMaxHp(char);
          const currentHp = char.hpCurrent ?? maxHp;
          const tempHp = char.hpTemp || 0;
          const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
          const isDead = isCharacterDead(char);
          const isSelected = char.id === activeCharacterId;
          const isExpanded = expandedCharId === char.id;

          // Find member role in session if available
          const sessionMember = activeSession?.members?.find(m => m.characterId === char.id || m.uid === `npc_char_${char.id}`);

          // Determine HP bar color
          let hpColor = 'bg-emerald-500';
          let hpTextColor = 'text-emerald-400';
          if (hpPercent <= 25 || isDead) {
            hpColor = 'bg-rose-500';
            hpTextColor = 'text-rose-400';
          } else if (hpPercent <= 50) {
            hpColor = 'bg-amber-500';
            hpTextColor = 'text-amber-400';
          }

          const spellSlots = (char.spellSlots || []).filter(s => s.max > 0 && s.level > 0);
          const totalSpellSlots = spellSlots.reduce((sum, s) => sum + s.max, 0);
          const remainingSpellSlots = spellSlots.reduce((sum, s) => sum + s.current, 0);
          const hitDiceMax = char.level || 1;
          const hitDiceCurrent = char.hitDiceCurrent ?? hitDiceMax;

          return (
            <div
              key={char.id}
              className={`rounded-xl border transition-all duration-200 bg-stone-900/80 p-3.5 ${
                isSelected 
                  ? 'border-amber-500/80 ring-1 ring-amber-500/40 bg-stone-900/95' 
                  : isDead
                  ? 'border-rose-900/60 opacity-80'
                  : 'border-stone-800/90 hover:border-stone-700'
              }`}
            >
              {/* Top Row: Portrait, Name, Class & Badges */}
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div 
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelectCharacter && onSelectCharacter(char.id)}
                >
                  <div className="relative flex-shrink-0">
                    {char.portraitUrl ? (
                      <img 
                        src={char.portraitUrl} 
                        alt={char.name} 
                        className="w-10 h-10 rounded-lg object-cover border border-stone-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-sm">
                        {char.name.charAt(0) || 'P'}
                      </div>
                    )}
                    {isDead && (
                      <div className="absolute -top-1 -right-1 bg-rose-950 border border-rose-600 rounded-full p-0.5 text-rose-300">
                        <Skull className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-stone-100 truncate hover:text-amber-400 transition-colors">
                        {char.name}
                      </h4>
                      {sessionMember && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">
                          {sessionMember.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 truncate">
                      Lvl {char.level || 1} {char.characterClass || 'Adventurer'} {char.race ? `• ${char.race}` : ''}
                    </p>
                  </div>
                </div>

                {/* Quick Defense Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-800/90 border border-stone-700 text-stone-200 text-[11px] font-bold" title="Armor Class">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>{char.armorClass || 10}</span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-800/90 border border-stone-700 text-stone-200 text-[11px] font-bold" title="Passive Perception">
                    <Eye className="w-3 h-3 text-amber-400" />
                    <span>{getPassivePerception(char)}</span>
                  </div>
                </div>
              </div>

              {/* Health & Vitality Bar */}
              <div className="space-y-1.5 mb-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1">
                    <Heart className={`w-3.5 h-3.5 ${hpTextColor}`} />
                    <span className="text-stone-300">Hit Points:</span>
                    <span className={`font-mono ${hpTextColor}`}>
                      {currentHp} / {maxHp}
                    </span>
                    {tempHp > 0 && (
                      <span className="px-1 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                        +{tempHp} Temp
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">{hpPercent}%</span>
                </div>

                {/* Progress bar container */}
                <div className="h-2 w-full bg-stone-800/90 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-300 ${hpColor}`}
                    style={{ width: `${hpPercent}%` }}
                  />
                  {tempHp > 0 && (
                    <div 
                      className="h-full bg-cyan-400/80 animate-pulse"
                      style={{ width: `${Math.min(100 - hpPercent, (tempHp / maxHp) * 100)}%` }}
                    />
                  )}
                </div>

                {/* Quick HP Adjustment Buttons (DM & Player) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustHp(char, -5)}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 transition-colors"
                      title="Take 5 Damage"
                    >
                      -5 HP
                    </button>
                    <button
                      onClick={() => handleAdjustHp(char, -1)}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 transition-colors"
                      title="Take 1 Damage"
                    >
                      -1
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustHp(char, 1)}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 transition-colors"
                      title="Heal 1 HP"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustHp(char, 5)}
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 transition-colors"
                      title="Heal 5 HP"
                    >
                      +5 HP
                    </button>
                  </div>
                </div>
              </div>

              {/* Resource Status: Spell Slots & Hit Dice */}
              <div className="pt-2 border-t border-stone-800/80 grid grid-cols-2 gap-2 text-xs">
                {/* Spell Slots */}
                <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <div className="flex items-center gap-1 text-violet-400 font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>Spell Slots</span>
                    </div>
                    <span className="font-mono text-stone-300 text-[10px]">
                      {remainingSpellSlots}/{totalSpellSlots}
                    </span>
                  </div>

                  {spellSlots.length > 0 ? (
                    <div className="space-y-1">
                      {spellSlots.slice(0, 3).map((slot) => (
                        <div key={slot.level} className="flex items-center justify-between text-[10px]">
                          <span className="text-stone-400 font-mono">L{slot.level}:</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: slot.max }).map((_, idx) => {
                              const isAvailable = idx < slot.current;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleToggleSpellSlot(char, slot.level, idx)}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    isAvailable 
                                      ? 'bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]' 
                                      : 'bg-stone-800 border border-stone-700'
                                  }`}
                                  title={`Level ${slot.level} Slot ${idx + 1} (${isAvailable ? 'Ready' : 'Expended'})`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-500 italic">No spellcaster slots</p>
                  )}
                </div>

                {/* Hit Dice Pool */}
                <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1 text-amber-400 font-medium">
                        <Moon className="w-3 h-3" />
                        <span>Hit Dice</span>
                      </div>
                      <span className="font-mono text-stone-300 text-[10px]">
                        {hitDiceCurrent}/{hitDiceMax}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Type: {char.hitDiceTotal || '1d8'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUseHitDie(char)}
                    disabled={hitDiceCurrent <= 0}
                    className="mt-1 w-full py-0.5 text-[10px] font-semibold rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    🎲 Roll Hit Die
                  </button>
                </div>
              </div>

              {/* Status Conditions */}
              {char.conditions && char.conditions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-800/80 flex flex-wrap gap-1">
                  {char.conditions.map((cond) => (
                    <span
                      key={cond}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/50 flex items-center gap-1"
                    >
                      <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
