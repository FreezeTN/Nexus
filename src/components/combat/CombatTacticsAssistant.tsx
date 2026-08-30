import React, { useState } from 'react';
import {
  Sparkles,
  Swords,
  Shield,
  Zap,
  Target,
  BrainCircuit,
  Compass,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Volume2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Combatant } from './EncounterTracker';
import {
  generateTacticalCombatAdvice,
  generateCinematicNarration,
  TacticalCombatAdvice
} from '../../services/geminiService';
import { proceduralAudio } from '../../utils/proceduralAudioSynthesizer';

interface CombatTacticsAssistantProps {
  activeCombatant: Combatant | null;
  allCombatants: Combatant[];
  round: number;
}

export const CombatTacticsAssistant: React.FC<CombatTacticsAssistantProps> = ({
  activeCombatant,
  allCombatants,
  round
}) => {
  const [advice, setAdvice] = useState<TacticalCombatAdvice | null>(null);
  const [narration, setNarration] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);
  const [isLoadingNarration, setIsLoadingNarration] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!activeCombatant) {
    return null;
  }

  const hpPercent = Math.round(((activeCombatant.hpCurrent || 0) / Math.max(1, activeCombatant.hpMax || 1)) * 100);
  const isMonster = activeCombatant.type === 'enemy';

  const handleGetTactics = async () => {
    setIsLoadingAdvice(true);
    try {
      const opponents = allCombatants
        .filter(c => c.type !== activeCombatant.type)
        .map(c => `${c.name} (HP ${c.hpCurrent}/${c.hpMax}, AC ${c.armorClass})`)
        .join(', ');

      const attacks = ['Standard Melee Attack', 'Ranged Strike', 'Spell / Cantrip'];

      const result = await generateTacticalCombatAdvice({
        combatantName: activeCombatant.name,
        hpPercent,
        availableAttacks: attacks,
        opponentsSummary: opponents || 'Enemy party'
      });
      setAdvice(result);
    } catch {
      // handled inside service with fallback
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const handleGenerateNarration = async (actionType: 'attack_hit' | 'critical_hit' | 'kill' | 'spell_cast') => {
    setIsLoadingNarration(true);
    try {
      if (actionType === 'critical_hit') {
        proceduralAudio.playSfx('critical_hit');
      } else if (actionType === 'kill') {
        proceduralAudio.playSfx('sword_clash');
      } else if (actionType === 'spell_cast') {
        proceduralAudio.playSfx('magic_surge');
      } else {
        proceduralAudio.playSfx('sword_clash');
      }

      const target = allCombatants.find(c => c.type !== activeCombatant.type && (c.hpCurrent || 0) > 0);
      const text = await generateCinematicNarration({
        actorName: activeCombatant.name,
        targetName: target?.name || 'the opponent',
        actionType,
        weaponOrSpell: 'a decisive attack',
        damageDealt: 'heavy damage',
        damageType: 'kinetic'
      });
      setNarration(text);
    } catch {
      // fallback
    } finally {
      setIsLoadingNarration(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-stone-900/95 via-purple-950/20 to-stone-900/95 border border-purple-800/40 rounded-2xl p-3 shadow-lg space-y-2.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-600/50 text-purple-300">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-serif font-bold text-purple-200 flex items-center gap-1.5">
              <span>Tactical Combat Co-Pilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded">
                Round {round}
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              Active Turn: <strong className="text-amber-300">{activeCombatant.name}</strong> ({isMonster ? 'Monster / NPC' : 'Player'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGetTactics}
            disabled={isLoadingAdvice}
            className="flex items-center gap-1 text-[11px] font-serif font-bold bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-600/60 px-2.5 py-1 rounded-xl transition cursor-pointer disabled:opacity-50 shadow"
            title="Generate AI tactical recommendation for current turn"
          >
            {isLoadingAdvice ? (
              <Loader2 className="w-3 h-3 animate-spin text-purple-300" />
            ) : (
              <Sparkles className="w-3 h-3 text-purple-400" />
            )}
            <span>{advice ? 'Refresh Tactics' : 'Advise Action'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-stone-400 hover:text-stone-200 rounded-lg transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 pt-1">
          {/* Quick Cinematic Narration Triggers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-stone-400 mr-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-400" />
              <span>Cinematic Flavor:</span>
            </span>

            <button
              onClick={() => handleGenerateNarration('attack_hit')}
              disabled={isLoadingNarration}
              className="text-[10px] font-serif bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-amber-600/50 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              ⚔️ Strike Hit
            </button>

            <button
              onClick={() => handleGenerateNarration('critical_hit')}
              disabled={isLoadingNarration}
              className="text-[10px] font-serif bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              🌟 Critical Strike
            </button>

            <button
              onClick={() => handleGenerateNarration('spell_cast')}
              disabled={isLoadingNarration}
              className="text-[10px] font-serif bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              🔮 Spell Surge
            </button>

            <button
              onClick={() => handleGenerateNarration('kill')}
              disabled={isLoadingNarration}
              className="text-[10px] font-serif bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              ☠️ Final Blow
            </button>
          </div>

          {/* Cinematic Narration Output */}
          {narration && (
            <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 font-serif italic text-xs leading-relaxed flex items-start gap-2 shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>&ldquo;{narration}&rdquo;</span>
              </div>
              <button
                onClick={() => setNarration(null)}
                className="text-stone-500 hover:text-stone-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tactical Advice Breakdown */}
          {advice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                <div className="text-[11px] font-serif font-bold text-amber-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Action & Target Strategy</span>
                </div>
                <p className="text-stone-300 leading-relaxed text-[11px]">{advice.recommendedAction}</p>
                <div className="text-[10px] text-amber-200/80 font-mono pt-1">
                  <strong>Focus:</strong> {advice.targetPriority}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 space-y-1">
                <div className="text-[11px] font-serif font-bold text-indigo-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Positioning & Reaction</span>
                </div>
                <p className="text-stone-300 leading-relaxed text-[11px]">{advice.positioningTip}</p>
                <div className="text-[10px] text-purple-300/80 font-mono pt-1">
                  <strong>Reaction Alert:</strong> {advice.reactionWarning}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
