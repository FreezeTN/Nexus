import React, { useState } from 'react';
import { Combatant } from './encounterTypes';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../../data/monsterPortraits';
import { 
  Sparkles, 
  Trash2, 
  ArrowRightLeft, 
  Mic, 
  Skull, 
  Clock, 
  Plus, 
  X, 
  Swords, 
  Shield, 
  Heart,
  ChevronDown
} from 'lucide-react';

const COMMON_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Blessed',
  'Bane',
  'Faerie Fire',
  "Hunter's Mark",
  'Hex',
  'Shield of Faith',
  'Haste',
  'Slow'
];

interface CombatantRowCardProps {
  combatant: Combatant;
  isActive: boolean;
  isSpeaking: boolean;
  globalRank: number;
  onAdjustHp: (id: string, delta: number) => void;
  onToggleType?: (id: string) => void;
  onRemove?: (id: string) => void;
  onApplyCondition: (id: string, conditionName: string, durationRounds?: number) => void;
  onRemoveCondition: (id: string, conditionName: string) => void;
  onToggleConcentration: (id: string, spellName?: string) => void;
}

export const CombatantRowCard: React.FC<CombatantRowCardProps> = ({
  combatant: c,
  isActive,
  isSpeaking,
  globalRank,
  onAdjustHp,
  onToggleType,
  onRemove,
  onApplyCondition,
  onRemoveCondition,
  onToggleConcentration
}) => {
  const [customHpVal, setCustomHpVal] = useState<string>('');
  const [showAddCondition, setShowAddCondition] = useState<boolean>(false);
  const [selectedCondition, setSelectedCondition] = useState<string>(COMMON_CONDITIONS[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [customSpellName, setCustomSpellName] = useState<string>('');
  const [showConcentrationInput, setShowConcentrationInput] = useState<boolean>(false);

  const isDefeated = c.isDefeated || c.hpCurrent === 0;
  const isEnemy = c.type === 'enemy' && !c.isPlayerChar;
  const hpPercent = Math.max(0, Math.min(100, Math.round((c.hpCurrent / Math.max(1, c.hpMax)) * 100)));

  const handleApplyCustomDmg = (mult: number = 1) => {
    const val = parseInt(customHpVal, 10);
    if (isNaN(val) || val <= 0) return;
    const finalDelta = mult === 0.5 ? -Math.floor(val / 2) : mult === 2 ? -(val * 2) : -val;
    onAdjustHp(c.id, finalDelta);
    setCustomHpVal('');
  };

  const handleApplyCustomHeal = () => {
    const val = parseInt(customHpVal, 10);
    if (isNaN(val) || val <= 0) return;
    onAdjustHp(c.id, val);
    setCustomHpVal('');
  };

  const handleAddConditionSubmit = () => {
    if (!selectedCondition) return;
    onApplyCondition(c.id, selectedCondition, selectedDuration > 0 ? selectedDuration : undefined);
    setShowAddCondition(false);
  };

  const handleConfirmConcentration = () => {
    onToggleConcentration(c.id, customSpellName.trim() || 'Concentration Spell');
    setShowConcentrationInput(false);
    setCustomSpellName('');
  };

  return (
    <div
      className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
        isSpeaking
          ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
          : isActive
          ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 shadow-lg'
          : isDefeated
          ? 'bg-stone-950/60 border-stone-800/80 opacity-70'
          : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700'
      }`}
      id={`combatant-card-${c.id}`}
    >
      {/* Top Row: Avatar, Info, Badges */}
      <div className="flex items-start justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={c.portraitUrl || (isEnemy ? getMonsterPortraitUrl(c.name) : '/default-avatar.png')}
              alt={c.name}
              className={`w-11 h-11 rounded-xl object-cover border shadow shrink-0 ${
                isSpeaking
                  ? 'border-emerald-400 ring-2 ring-emerald-400/60 animate-pulse'
                  : isActive
                  ? 'border-amber-400 ring-1 ring-amber-400/50'
                  : isDefeated
                  ? 'border-stone-800 grayscale'
                  : isEnemy
                  ? 'border-rose-700/50'
                  : 'border-emerald-600/40'
              }`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = generateMonsterSvgPortrait(c?.name);
              }}
            />
            <div
              className={`absolute -bottom-1 -right-1 px-1 min-w-[18px] h-4 rounded text-stone-950 font-mono font-bold text-[9px] border shadow flex items-center justify-center ${
                isEnemy ? 'bg-rose-500 border-rose-300' : 'bg-emerald-500 border-emerald-300'
              }`}
              title={`Initiative: ${c.initiative}`}
            >
              {isNaN(c.initiative) ? 0 : c.initiative}
            </div>
          </div>

          <div className="min-w-0">
            <div className="font-serif font-bold text-stone-100 text-xs flex items-center gap-1.5 flex-wrap">
              <span className="truncate max-w-[150px] sm:max-w-[180px]">{c.name}</span>
              <span className="text-[10px] text-stone-400 font-mono" title="Global Turn Order">
                #{globalRank}
              </span>
              {c.isPlayerChar && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                  YOU
                </span>
              )}
              {isActive && (
                <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded font-mono animate-pulse">
                  ACTIVE TURN
                </span>
              )}
              {isSpeaking && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                  <Mic className="w-2.5 h-2.5 text-emerald-400" /> SPEAKING
                </span>
              )}
              {isDefeated && (
                <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-600/80 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                  <Skull className="w-2.5 h-2.5" /> DEFEATED
                </span>
              )}
            </div>

            <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2 mt-0.5">
              <span>AC: <strong className="text-stone-200">{c.armorClass}</strong></span>
              <span>HP: <strong className={isDefeated ? 'text-rose-500 font-bold' : c.hpCurrent <= (c.hpMax / 4) ? 'text-rose-400' : 'text-emerald-400'}>{c.hpCurrent}</strong> / {c.hpMax}</span>
              {c.monsterXpReward ? (
                <span className="text-amber-300 text-[10px] font-bold">+{c.monsterXpReward} XP</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Utilities (Allegiance switch, remove) */}
        <div className="flex items-center gap-1">
          {onToggleType && !c.isPlayerChar && (
            <button
              type="button"
              onClick={() => onToggleType(c.id)}
              className="p-1 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800 rounded-lg transition cursor-pointer"
              title={`Switch Allegiance to ${isEnemy ? 'Team 1 (Ally)' : 'Team 2 (Enemy)'}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {onRemove && !c.isPlayerChar && (
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              className="p-1 text-stone-500 hover:text-rose-400 transition cursor-pointer"
              title="Remove from encounter"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Health Progress Bar */}
      <div className="w-full bg-stone-950 rounded-full h-1.5 border border-stone-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isDefeated ? 'bg-rose-900' : hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* Active Conditions & Concentration Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Concentration Status */}
        {c.isConcentrating ? (
          <button
            type="button"
            onClick={() => onToggleConcentration(c.id)}
            className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/60 px-2 py-0.5 rounded-full text-[10px] font-bold shadow transition hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500 group cursor-pointer"
            title="Click to drop concentration"
          >
            <Sparkles className="w-3 h-3 text-amber-400 group-hover:hidden" />
            <X className="w-3 h-3 text-rose-400 hidden group-hover:inline" />
            <span>Conc: {c.concentratingSpell?.spellName || 'Active'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowConcentrationInput(!showConcentrationInput)}
            className="flex items-center gap-1 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-300 border border-stone-800 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer"
            title="Declare active concentration spell"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>+ Conc</span>
          </button>
        )}

        {/* Condition Badges with Expiry Watchdog Indicator */}
        {(c.conditions || []).map((cond) => {
          const durationLeft = c.conditionDurations?.[cond];
          return (
            <span
              key={cond}
              className="flex items-center gap-1 bg-stone-950 text-stone-300 border border-stone-700/80 px-2 py-0.5 rounded-full text-[10px] font-medium"
            >
              <span>{cond}</span>
              {durationLeft !== undefined && (
                <span className="flex items-center gap-0.5 text-amber-400 font-mono font-bold bg-amber-950/60 px-1 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{durationLeft}r</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveCondition(c.id, cond)}
                className="text-stone-500 hover:text-rose-400 ml-0.5 cursor-pointer"
                title={`Remove ${cond}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}

        {/* Add Condition Trigger */}
        <button
          type="button"
          onClick={() => setShowAddCondition(!showAddCondition)}
          className="flex items-center gap-0.5 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer"
          title="Apply condition with round duration"
        >
          <Plus className="w-2.5 h-2.5 text-stone-400" />
          <span>Condition</span>
        </button>
      </div>

      {/* Popover: Set Concentration Spell Name */}
      {showConcentrationInput && (
        <div className="flex items-center gap-2 bg-stone-950 border border-amber-500/50 p-2 rounded-xl text-xs animate-fadeIn">
          <input
            type="text"
            placeholder="Spell name (e.g. Bless, Haste)..."
            value={customSpellName}
            onChange={(e) => setCustomSpellName(e.target.value)}
            className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmConcentration();
            }}
          />
          <button
            type="button"
            onClick={handleConfirmConcentration}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer shadow"
          >
            Concentrate
          </button>
          <button
            type="button"
            onClick={() => setShowConcentrationInput(false)}
            className="text-stone-400 hover:text-stone-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Popover: Add Condition with Duration */}
      {showAddCondition && (
        <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 p-2 rounded-xl text-xs flex-wrap animate-fadeIn">
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
          >
            {COMMON_CONDITIONS.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>

          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(parseInt(e.target.value, 10))}
            className="bg-stone-900 border border-stone-700 text-amber-300 text-xs rounded-lg px-2 py-1 font-mono font-bold focus:outline-none focus:border-amber-500"
          >
            <option value={1}>1 Round (Until next turn)</option>
            <option value={2}>2 Rounds</option>
            <option value={3}>3 Rounds</option>
            <option value={5}>5 Rounds</option>
            <option value={10}>10 Rounds (1 Min)</option>
            <option value={0}>Permanent / Save Ends</option>
          </select>

          <button
            type="button"
            onClick={handleAddConditionSubmit}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer shadow"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowAddCondition(false)}
            className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* HP Automation Control Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-stone-800/80">
        {/* Quick Stepper */}
        <div className="flex items-center gap-0.5 bg-stone-950 border border-stone-800 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onAdjustHp(c.id, -5)}
            className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-200 rounded font-mono font-bold text-[11px] cursor-pointer"
            title="-5 HP"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => onAdjustHp(c.id, -1)}
            className="px-1.5 py-0.5 bg-rose-900/70 hover:bg-rose-800 text-rose-100 rounded font-mono font-bold text-[11px] cursor-pointer"
            title="-1 HP"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => onAdjustHp(c.id, 1)}
            className="px-1.5 py-0.5 bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 rounded font-mono font-bold text-[11px] cursor-pointer"
            title="+1 HP"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => onAdjustHp(c.id, 5)}
            className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded font-mono font-bold text-[11px] cursor-pointer"
            title="+5 HP"
          >
            +5
          </button>
        </div>

        {/* Custom Exact HP Input & Direct Apply Buttons */}
        <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 p-1 rounded-xl">
          <input
            type="number"
            placeholder="Amt"
            value={customHpVal}
            onChange={(e) => setCustomHpVal(e.target.value)}
            className="w-12 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-mono font-bold px-1.5 py-0.5 rounded focus:outline-none focus:border-amber-500 text-center"
            min={1}
          />

          <button
            type="button"
            onClick={() => handleApplyCustomDmg(1)}
            className="flex items-center gap-0.5 bg-rose-900 hover:bg-rose-800 text-rose-100 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
            title="Apply Full Damage"
          >
            <Swords className="w-2.5 h-2.5" />
            <span>Dmg</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyCustomDmg(0.5)}
            className="flex items-center gap-0.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-[10px] font-bold px-1.5 py-1 rounded transition border border-stone-700 cursor-pointer"
            title="Apply Half Damage (Saved)"
          >
            <Shield className="w-2.5 h-2.5" />
            <span>½</span>
          </button>

          <button
            type="button"
            onClick={handleApplyCustomHeal}
            className="flex items-center gap-0.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
            title="Apply Healing"
          >
            <Heart className="w-2.5 h-2.5" />
            <span>Heal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
