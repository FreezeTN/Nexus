import React, { useState, useEffect } from 'react';
import { CharacterData, RuleEdition } from '../../types';
import {
  RotateCcw,
  Zap,
  Shield,
  Footprints,
  Hand,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  CircleDot,
  Swords,
  Timer
} from 'lucide-react';

interface TurnActionEconomyBarProps {
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onActionUsed?: (actionName: string) => void;
}

interface ActionDefinition {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ReactNode;
  colorClass: string;
  usedColorClass: string;
  badgeBorder: string;
  description: string;
  examples: string[];
}

const COLLAPSE_STORAGE_KEY = 'nexus_action_economy_collapsed';

export const TurnActionEconomyBar: React.FC<TurnActionEconomyBarProps> = ({
  character,
  edition,
  onUpdateCharacter,
  onActionUsed
}) => {
  const is35e = character.edition === '3.5e' || edition === '3.5e';

  // Collapsible view state saved to local storage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const [showRulesHelper, setShowRulesHelper] = useState<boolean>(false);
  const [activeInfoActionId, setActiveInfoActionId] = useState<string | null>(null);

  // Speed in feet (defaults to 30)
  const baseSpeed = character.speed || 30;

  // Local state fallbacks if onUpdateCharacter is not provided
  const [localRound, setLocalRound] = useState<number>(1);
  const [localActions, setLocalActions] = useState<Record<string, boolean>>({});
  const [localSpeed, setLocalSpeed] = useState<number>(baseSpeed);

  const econ = character.actionEconomy;
  const currentRound = econ?.currentRound ?? localRound;
  const remainingSpeed = econ?.remainingSpeed !== undefined ? econ.remainingSpeed : (onUpdateCharacter ? baseSpeed : localSpeed);

  // Derive used state for both editions
  const isActionUsed = (id: string): boolean => {
    if (!onUpdateCharacter) {
      return Boolean(localActions[id]);
    }
    if (is35e) {
      switch (id) {
        case 'standard':
          return Boolean(econ?.standardActionUsed);
        case 'move':
          return Boolean(econ?.moveActionUsed);
        case 'swift_immediate':
          return Boolean(econ?.swiftActionUsed || econ?.immediateActionUsed);
        case 'full_round':
          return Boolean(econ?.standardActionUsed && econ?.moveActionUsed);
        case 'five_ft_step':
          return Boolean(econ?.fiveFootStepTaken);
        default:
          return false;
      }
    } else {
      switch (id) {
        case 'action':
          return Boolean(econ?.actionUsed5e);
        case 'bonus_action':
          return Boolean(econ?.bonusActionUsed5e);
        case 'reaction':
          return Boolean(econ?.reactionUsed5e);
        case 'free_interaction':
          return Boolean(econ?.freeInteractionUsed5e);
        default:
          return false;
      }
    }
  };

  // Real-time listener for Battlemap token movement events
  useEffect(() => {
    const handleTokenMoved = (e: Event) => {
      const customEvt = e as CustomEvent<{
        combatantId?: string;
        characterId?: string;
        distanceFeet?: number;
        newRemaining?: number;
      }>;
      if (!customEvt.detail) return;
      const { characterId, combatantId, newRemaining } = customEvt.detail;

      if ((characterId === character.id || combatantId === character.id) && typeof newRemaining === 'number') {
        if (onUpdateCharacter) {
          onUpdateCharacter({
            ...character,
            actionEconomy: {
              ...(character.actionEconomy || {}),
              moveActionUsed: true,
              remainingSpeed: newRemaining
            }
          });
        } else {
          setLocalActions(prev => ({ ...prev, move: true }));
          setLocalSpeed(newRemaining);
        }
      }
    };

    window.addEventListener('nexus:token_moved', handleTokenMoved);
    return () => window.removeEventListener('nexus:token_moved', handleTokenMoved);
  }, [character, onUpdateCharacter]);

  const actions5e: ActionDefinition[] = [
    {
      id: 'action',
      name: 'Standard Action',
      shortLabel: 'Action',
      icon: <Zap className="w-3.5 h-3.5" />,
      colorClass: 'bg-amber-500/20 text-amber-200 border-amber-500/60 hover:bg-amber-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-amber-500/60',
      description: 'Your primary active maneuver on your turn.',
      examples: ['Attack (Weapon / Unarmed)', 'Cast a Spell (1 action)', 'Dash (Double movement)', 'Disengage (No AoO)', 'Dodge (Disadvantage to attackers)', 'Help an ally', 'Hide (Stealth check)', 'Ready an action', 'Search', 'Use an Object']
    },
    {
      id: 'bonus_action',
      name: 'Bonus Action',
      shortLabel: 'Bonus Action',
      icon: <Swords className="w-3.5 h-3.5" />,
      colorClass: 'bg-purple-500/20 text-purple-200 border-purple-500/60 hover:bg-purple-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-purple-500/60',
      description: 'A swift action granted by specific class features, spells, or two-weapon fighting (max 1 per turn).',
      examples: ['Off-Hand Weapon Attack', 'Healing Word / Misty Step', 'Rogue Cunning Action (Dash/Disengage/Hide)', 'Barbarian Enter Rage', 'Fighter Second Wind', 'Bardic Inspiration']
    },
    {
      id: 'reaction',
      name: 'Reaction',
      shortLabel: 'Reaction',
      icon: <Shield className="w-3.5 h-3.5" />,
      colorClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 hover:bg-cyan-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-cyan-500/60',
      description: 'An instant response to a trigger on another creature’s turn or your own (resets at start of your turn).',
      examples: ['Opportunity Attack (when enemy leaves reach)', 'Shield / Absorb Elements / Counterspell', 'Hellish Rebuke', 'Rogue Uncanny Dodge / Evasion', 'Readied Trigger']
    },
    {
      id: 'free_interaction',
      name: 'Object Interaction',
      shortLabel: 'Free Object',
      icon: <Hand className="w-3.5 h-3.5" />,
      colorClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/60 hover:bg-emerald-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-emerald-500/60',
      description: 'You can interact with one object or feature of the environment for free alongside your movement or action.',
      examples: ['Draw or sheathe 1 weapon', 'Open or close an unlocked door', 'Retrieve item from backpack', 'Pick up a dropped weapon', 'Hand an item to an ally']
    }
  ];

  const actions35e: ActionDefinition[] = [
    {
      id: 'standard',
      name: 'Standard Action',
      shortLabel: 'Standard',
      icon: <Zap className="w-3.5 h-3.5" />,
      colorClass: 'bg-amber-500/20 text-amber-200 border-amber-500/60 hover:bg-amber-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-amber-500/60',
      description: 'Allows you to make one attack, cast a standard spell, or perform an equivalent active task.',
      examples: ['Single Melee / Ranged Attack', 'Cast a Spell (1 standard action)', 'Activate Magic Item / Wand', 'Aid Another', 'Total Defense (+4 Dodge AC)']
    },
    {
      id: 'move',
      name: 'Move Action',
      shortLabel: 'Move Action',
      icon: <Footprints className="w-3.5 h-3.5" />,
      colorClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/60 hover:bg-emerald-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-emerald-500/60',
      description: 'Movement up to your speed, or an equivalent physical manipulation task.',
      examples: ['Move base speed', 'Draw a weapon (free if BAB +1 while moving)', 'Ready or loose a shield', 'Retrieve a stored item', 'Mount / dismount a steed']
    },
    {
      id: 'swift_immediate',
      name: 'Swift / Immediate Action',
      shortLabel: 'Swift / Imm.',
      icon: <Swords className="w-3.5 h-3.5" />,
      colorClass: 'bg-purple-500/20 text-purple-200 border-purple-500/60 hover:bg-purple-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-purple-500/60',
      description: 'A swift action is taken on your turn; an immediate action can be taken anytime, consuming next turn’s swift action.',
      examples: ['Cast Quickened Spell', 'Activate Martial Stance / Boost', 'Feather Fall (Immediate)', 'Certain Feat triggers']
    },
    {
      id: 'full_round',
      name: 'Full-Round Action',
      shortLabel: 'Full-Round',
      icon: <Timer className="w-3.5 h-3.5" />,
      colorClass: 'bg-rose-500/20 text-rose-200 border-rose-500/60 hover:bg-rose-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-rose-500/60',
      description: 'Consumes BOTH your Standard and Move actions for the round.',
      examples: ['Full Attack sequence (all iterative attacks)', 'Charge (double move + single attack with +2 to hit, -2 AC)', 'Run (4× speed)', 'Withdraw (double move without AoO from 1st square)', 'Extinguish flames']
    },
    {
      id: 'five_ft_step',
      name: '5-Foot Step',
      shortLabel: '5-ft Step',
      icon: <Shield className="w-3.5 h-3.5" />,
      colorClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/60 hover:bg-cyan-500/30',
      usedColorClass: 'bg-stone-900/80 text-stone-500 border-stone-800 line-through opacity-60',
      badgeBorder: 'border-cyan-500/60',
      description: 'Move 5 feet in any round where you take no other movement. Does NOT provoke Attacks of Opportunity.',
      examples: ['Step away to cast a spell safely', 'Step into melee reach before a full attack', 'Step back to shoot bow safely']
    }
  ];

  const currentActions = is35e ? actions35e : actions5e;

  const toggleAction = (id: string) => {
    onActionUsed?.(id);
    const currentlyUsed = isActionUsed(id);
    const nextUsed = !currentlyUsed;

    if (onUpdateCharacter) {
      const nextEcon = { ...(character.actionEconomy || {}) };
      if (is35e) {
        if (id === 'standard') {
          nextEcon.standardActionUsed = nextUsed;
        } else if (id === 'move') {
          nextEcon.moveActionUsed = nextUsed;
        } else if (id === 'swift_immediate') {
          nextEcon.swiftActionUsed = nextUsed;
          nextEcon.immediateActionUsed = nextUsed;
        } else if (id === 'full_round') {
          nextEcon.standardActionUsed = nextUsed;
          nextEcon.moveActionUsed = nextUsed;
        } else if (id === 'five_ft_step') {
          nextEcon.fiveFootStepTaken = nextUsed;
        }
      } else {
        if (id === 'action') {
          nextEcon.actionUsed5e = nextUsed;
        } else if (id === 'bonus_action') {
          nextEcon.bonusActionUsed5e = nextUsed;
        } else if (id === 'reaction') {
          nextEcon.reactionUsed5e = nextUsed;
        } else if (id === 'free_interaction') {
          nextEcon.freeInteractionUsed5e = nextUsed;
        }
      }

      onUpdateCharacter({
        ...character,
        actionEconomy: nextEcon
      });
    } else {
      setLocalActions(prev => {
        const next = { ...prev, [id]: nextUsed };
        if (is35e && id === 'full_round') {
          next['standard'] = nextUsed;
          next['move'] = nextUsed;
        }
        return next;
      });
    }
  };

  const handleAdjustSpeed = (newSpeed: number) => {
    const clamped = Math.max(0, newSpeed);
    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        actionEconomy: {
          ...(character.actionEconomy || {}),
          remainingSpeed: clamped,
          moveActionUsed: clamped < baseSpeed ? true : character.actionEconomy?.moveActionUsed
        }
      });
    } else {
      setLocalSpeed(clamped);
      if (clamped < baseSpeed) {
        setLocalActions(prev => ({ ...prev, move: true }));
      }
    }
  };

  const handleResetTurn = () => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        actionEconomy: {
          ...(character.actionEconomy || {}),
          standardActionUsed: false,
          moveActionUsed: false,
          swiftActionUsed: false,
          immediateActionUsed: false,
          fiveFootStepTaken: false,
          actionUsed5e: false,
          bonusActionUsed5e: false,
          reactionUsed5e: false,
          freeInteractionUsed5e: false,
          remainingSpeed: baseSpeed
        }
      });
    } else {
      setLocalActions({});
      setLocalSpeed(baseSpeed);
    }
  };

  const handleNextRound = () => {
    const nextRnd = currentRound + 1;
    if (onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        actionEconomy: {
          ...(character.actionEconomy || {}),
          standardActionUsed: false,
          moveActionUsed: false,
          swiftActionUsed: false,
          immediateActionUsed: false,
          fiveFootStepTaken: false,
          actionUsed5e: false,
          bonusActionUsed5e: false,
          reactionUsed5e: false,
          freeInteractionUsed5e: false,
          remainingSpeed: baseSpeed,
          currentRound: nextRnd
        }
      });
    } else {
      setLocalRound(nextRnd);
      setLocalActions({});
      setLocalSpeed(baseSpeed);
    }
  };

  const availableCount = currentActions.filter(a => !isActionUsed(a.id)).length;

  // COLLAPSED VIEW: A sleek, space-saving bar
  if (isCollapsed) {
    return (
      <div className="bg-stone-950/90 border border-stone-800/90 hover:border-amber-600/40 rounded-xl px-3 py-2 shadow-sm transition flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5 text-xs">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span>Turn Economy</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300">
            {is35e ? '3.5e' : '5e'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-200 font-bold">
            Rnd {currentRound}
          </span>
          <span className="text-[10.5px] font-mono text-stone-400">
            ({availableCount}/{currentActions.length} ready)
          </span>

          {/* Quick-toggle action chips directly in collapsed bar */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            {currentActions.map(action => {
              const isUsed = isActionUsed(action.id);
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => toggleAction(action.id)}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                    isUsed
                      ? 'bg-stone-900 text-stone-500 border-stone-800 line-through opacity-70'
                      : 'bg-stone-900/90 text-stone-200 border-stone-700 hover:border-amber-500 font-medium'
                  }`}
                  title={`${action.name}: ${isUsed ? 'Expended (click to mark ready)' : 'Ready (click to expend)'}`}
                >
                  <span>{action.shortLabel}</span>
                  {isUsed ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-stone-500" />
                  ) : (
                    <CircleDot className="w-2.5 h-2.5 text-amber-400" />
                  )}
                </button>
              );
            })}

            <span className="text-emerald-400/95 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/60 font-mono text-[10px] flex items-center gap-1">
              <Footprints className="w-3 h-3 text-emerald-400" />
              <span>{remainingSpeed} / {baseSpeed} ft</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleResetTurn}
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-amber-300 rounded transition cursor-pointer"
            title="Reset turn actions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapse}
            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 rounded-lg text-[11px] font-bold border border-stone-700 hover:border-amber-500 transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
            title="Expand Turn & Action Economy"
          >
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Expand</span>
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED VIEW: Full rich control dashboard with Collapse button
  return (
    <div className="bg-stone-950/90 border border-amber-600/30 hover:border-amber-600/50 rounded-xl p-3 shadow-md space-y-2.5 transition">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5 text-sm">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>Turn & Action Economy</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300">
            {is35e ? '3.5e Actions' : '5e Actions'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-200 font-bold">
            Round {currentRound}
          </span>
          <span className="text-[11px] font-mono text-stone-400 hidden sm:inline">
            ({availableCount}/{currentActions.length} available)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowRulesHelper(prev => !prev)}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 rounded-lg text-[11px] border border-stone-800 flex items-center gap-1 transition cursor-pointer"
            title="Toggle Action Economy Rules Reference"
          >
            <Info className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
            {showRulesHelper ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={handleResetTurn}
            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 rounded-lg text-[11px] font-bold border border-stone-700 hover:border-amber-600 transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
            title="Reset all actions for the start of your turn"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset Turn</span>
          </button>

          <button
            type="button"
            onClick={handleNextRound}
            className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 text-stone-950 rounded-lg text-[11px] font-bold border border-amber-400 transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
            title="Advance to next round and reset actions"
          >
            <span>Next Round &rarr;</span>
          </button>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-[11px] border border-stone-800 hover:border-stone-700 transition flex items-center gap-1 cursor-pointer"
            title="Collapse Action Economy Bar"
          >
            <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        </div>
      </div>

      {/* Action Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {currentActions.map((action) => {
          const isUsed = isActionUsed(action.id);
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => toggleAction(action.id)}
              className={`p-2 rounded-lg border text-left transition relative group flex flex-col justify-between gap-1 shadow-xs cursor-pointer ${
                isUsed ? action.usedColorClass : action.colorClass
              }`}
              title={`Click to mark ${action.name} as ${isUsed ? 'Available' : 'Used'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 font-bold text-xs">
                  {action.icon}
                  <span className="truncate">{action.shortLabel}</span>
                </span>
                {isUsed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                ) : (
                  <CircleDot className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                <span>{isUsed ? 'Expended' : 'Ready'}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfoActionId(activeInfoActionId === action.id ? null : action.id);
                  }}
                  className="hover:underline cursor-pointer opacity-70 hover:opacity-100"
                  title="View examples"
                >
                  ⓘ
                </span>
              </div>
            </button>
          );
        })}

        {/* Movement Tracker Chip */}
        <div className="p-2 rounded-lg border bg-stone-900/90 border-stone-800 flex flex-col justify-between gap-1 text-xs">
          <div className="flex items-center justify-between gap-1 text-stone-300 font-bold">
            <span className="flex items-center gap-1 text-xs">
              <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Movement</span>
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              {remainingSpeed} / {baseSpeed} ft
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => handleAdjustSpeed(remainingSpeed - 5)}
              className="flex-1 py-0.5 px-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-center transition cursor-pointer"
              title="Spend 5 ft of movement"
            >
              -5 ft
            </button>
            <button
              type="button"
              onClick={() => handleAdjustSpeed(baseSpeed)}
              className="py-0.5 px-1 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded text-center transition cursor-pointer"
              title="Reset remaining speed to maximum"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Rules & Examples Drawer */}
      {(showRulesHelper || activeInfoActionId) && (
        <div className="bg-stone-900/95 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-300 space-y-2 animate-in fade-in duration-150 font-sans">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1">
            <span className="font-serif font-bold text-amber-200 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Action Economy Reference ({is35e ? 'D&D 3.5e SRD' : 'D&D 5e PHB p. 189'})</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowRulesHelper(false);
                setActiveInfoActionId(null);
              }}
              className="text-stone-400 hover:text-stone-200 text-xs cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {currentActions.map((action) => (
              <div
                key={action.id}
                className={`p-2 rounded bg-stone-950/70 border ${
                  activeInfoActionId === action.id ? 'border-amber-500/70 ring-1 ring-amber-500/40' : 'border-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                  {action.icon}
                  <span>{action.name}</span>
                </div>
                <p className="text-stone-400 text-[10px] mb-1.5">{action.description}</p>
                <div className="flex flex-wrap gap-1">
                  {action.examples.map((ex, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[9px] text-stone-300 font-mono"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
