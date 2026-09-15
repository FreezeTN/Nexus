import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, BookOpen, ExternalLink, X } from 'lucide-react';

export interface RuleBadgeProps {
  ruleId: string;
  label?: string;
  edition?: '5e' | '3.5e' | 'pathfinder' | 'shadowrun' | 'cthulhu' | 'all';
  summary?: string;
  detail?: string;
  source?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  iconOnly?: boolean;
  placement?: 'top' | 'bottom' | 'auto';
}

interface RuleDefinition {
  title: string;
  edition: string;
  summary: string;
  detail: string;
  source: string;
}

export const RULE_DATABASE: Record<string, RuleDefinition> = {
  ac: {
    title: 'Armor Class (AC)',
    edition: '5e / 3.5e RAW',
    summary: 'The target number an attacker must meet or exceed on 1d20 + attack bonus to hit you.',
    detail: 'Formula: 10 + Dexterity modifier + Armor + Shield + magic/misc bonuses. In 3.5e, AC is also broken down into Touch AC (ignores armor/natural armor/shield) and Flat-Footed AC (loses Dex bonus).',
    source: 'PHB p. 14 / SRD 3.5 p. 138'
  },
  touchAc: {
    title: 'Touch Armor Class',
    edition: '3.5e / PF1e RAW',
    summary: 'Defenses against attacks that only need to touch the target to deliver an effect.',
    detail: 'Ignores Armor, Shield, and Natural Armor bonuses. Retains Dexterity bonus, Size modifier, Deflection bonus, and Dodge bonuses.',
    source: 'SRD 3.5 Combat p. 140'
  },
  flatFootedAc: {
    title: 'Flat-Footed AC',
    edition: '3.5e / PF1e RAW',
    summary: 'Defenses before you have acted in combat or when unaware of an incoming strike.',
    detail: 'You lose your Dexterity modifier to AC and any Dodge bonuses, and cannot make attacks of opportunity unless you possess the Uncanny Dodge feat/ability.',
    source: 'SRD 3.5 Combat p. 137'
  },
  bab: {
    title: 'Base Attack Bonus (BAB)',
    edition: '3.5e / PF1e RAW',
    summary: 'Core combat proficiency determining attack rolls and iterative extra attacks.',
    detail: 'Full BAB classes (Fighter, Barbarian, Paladin) gain +1/level. At BAB +6/+11/+16, an additional attack at a cumulative -5 penalty is unlocked when executing a Full Attack action.',
    source: 'SRD 3.5 Classes p. 22'
  },
  proficiencyBonus: {
    title: 'Proficiency Bonus',
    edition: 'D&D 5e RAW',
    summary: 'Universal scaling bonus applied to attacks, saving throws, and skilled checks you are trained in.',
    detail: 'Scales with total character level: +2 (Levels 1-4), +3 (Levels 5-8), +4 (Levels 9-12), +5 (Levels 13-16), and +6 (Levels 17-20). Never added more than once to a single roll unless modified by Expertise.',
    source: 'PHB p. 12'
  },
  initiative: {
    title: 'Initiative',
    edition: 'All Systems',
    summary: 'Determines turn order in combat. Rolled once at encounter start.',
    detail: '5e: 1d20 + Dexterity mod (+ Alert feat or Jack of All Trades if applicable). 3.5e: 1d20 + Dex mod (+ Improved Initiative feat +4). Tied initiatives are resolved by comparing Dexterity scores or rerolling.',
    source: 'PHB p. 189 / SRD 3.5 p. 136'
  },
  speed: {
    title: 'Tactical Speed & Movement',
    edition: '5e / 3.5e RAW',
    summary: 'The distance in feet a creature can traverse during a standard turn or move action.',
    detail: 'In 3.5e, wearing medium or heavy armor reduces 30ft base speed to 20ft (and 20ft to 15ft) and caps run multipliers. Encumbrance from heavy equipment also applies this reduction.',
    source: 'PHB p. 190 / SRD 3.5 p. 162'
  },
  hitDice: {
    title: 'Hit Dice & Short Rest Healing',
    edition: 'D&D 5e RAW',
    summary: 'Die pool determined by class (d6 to d12) used to regain hit points during a Short Rest.',
    detail: 'During a 1-hour Short Rest, spend 1 or more available Hit Dice. Roll each spent die and add your Constitution modifier per die to heal. Regain up to half your total Hit Dice upon finishing a Long Rest.',
    source: 'PHB p. 186'
  },
  passivePerception: {
    title: 'Passive Perception',
    edition: 'D&D 5e RAW',
    summary: 'Represents a character’s constant, effortless sensory awareness of their environment.',
    detail: 'Score: 10 + Wisdom modifier + Proficiency bonus (if proficient) + 5 (if observant or with advantage). DMs compare this against stealth rolls or hidden trap DCs without prompting a roll.',
    source: 'PHB p. 175'
  },
  tempHp: {
    title: 'Temporary Hit Points (Temp HP)',
    edition: '5e / 3.5e RAW',
    summary: 'A buffer of extra health that absorbs damage before your actual hit points are reduced.',
    detail: 'Temporary hit points do not stack; when you gain temp HP from multiple sources, choose whether to keep your existing amount or adopt the new value. Temp HP cannot be healed and disappears upon finishing a long rest.',
    source: 'PHB p. 198'
  },
  deathSaves: {
    title: 'Death Saving Throws',
    edition: 'D&D 5e RAW',
    summary: 'Special d20 checks rolled at the start of each turn while at 0 hit points.',
    detail: 'Roll 1d20 with no modifiers. 10 or higher is 1 success; 9 or lower is 1 failure. Roll of 20 immediately regains 1 HP. Roll of 1 counts as 2 failures. 3 successes = Stable; 3 failures = Death.',
    source: 'PHB p. 197'
  },
  aoo: {
    title: 'Attacks of Opportunity (AoO)',
    edition: '3.5e / PF1e RAW',
    summary: 'A reactive melee strike provoked when a hostile combatant lowers their guard in your threatened area.',
    detail: 'Provoked by moving out of a threatened square (unless using 5ft step or withdraw), making a ranged attack, casting a spell without defensive casting, or standing from prone. Default: 1 AoO per round (increased by Combat Reflexes feat by Dex mod).',
    source: 'SRD 3.5 Combat p. 137'
  },
  energyDrain: {
    title: 'Energy Drain & Negative Levels',
    edition: '3.5e RAW',
    summary: 'A terrifying debilitating attack from undead or fell sorcery that saps life essence.',
    detail: 'Each negative level confers a cumulative -1 penalty on attack rolls, saving throws, skill checks, ability checks, effective level, and -5 max HP. Also suppresses one highest-level spell slot.',
    source: 'SRD 3.5 Special Abilities p. 293'
  },
  concentration: {
    title: 'Concentration Check',
    edition: '5e / 3.5e RAW',
    summary: 'Required when taking damage or facing violent distractions while sustaining a spell.',
    detail: '5e: DC is 10 or half the damage taken (whichever is higher). 3.5e: 1d20 + Concentration skill bonus vs DC 10 + damage dealt + spell level, or DC 15 + spell level when casting defensively.',
    source: 'PHB p. 203 / SRD 3.5 Skills p. 69'
  },
  trip: {
    title: 'Trip Combat Maneuver',
    edition: '3.5e RAW',
    summary: 'An armed or unarmed melee attack to knock an opponent prone to the ground.',
    detail: 'Make an unarmed melee touch attack (provokes AoO unless improved). If successful, make an opposed Strength check against the defender’s Str or Dex. Prone targets suffer -4 melee attack penalty and +4 melee AC advantage for attackers.',
    source: 'SRD 3.5 Combat p. 158'
  },
  disarm: {
    title: 'Disarm Combat Maneuver',
    edition: '3.5e RAW',
    summary: 'A melee attack attempt to strike or twist a weapon out of an opponent’s grasp.',
    detail: 'Provokes AoO unless possessing Improved Disarm. Make an opposed melee attack roll modified by weapon size and whether the weapon is held in one or two hands (+4 for two-handed).',
    source: 'SRD 3.5 Combat p. 155'
  },
  grapple: {
    title: 'Grapple Combat Maneuver',
    edition: '3.5e RAW',
    summary: 'Wrestling and holding an opponent in close physical combat.',
    detail: 'Grapple check modifier = Base Attack Bonus + Strength mod + Special Size modifier. Initiating a grapple provokes an AoO. While grappling, participants lose Dex bonus to AC against outsiders.',
    source: 'SRD 3.5 Combat p. 156'
  }
};

export const RuleBadge: React.FC<RuleBadgeProps> = ({
  ruleId,
  label,
  summary: propSummary,
  detail: propDetail,
  source: propSource,
  className = '',
  size = 'xs',
  iconOnly = false,
  placement = 'auto'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [computedPlacement, setComputedPlacement] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const def = RULE_DATABASE[ruleId] || {
    title: label || ruleId,
    edition: 'Rules RAW',
    summary: propSummary || 'Official tabletop rule explanation and mechanics.',
    detail: propDetail || 'Refer to the system compendium for full mechanical details.',
    source: propSource || 'Core Rulebook'
  };

  const title = label || def.title;
  const summary = propSummary || def.summary;
  const detail = propDetail || def.detail;
  const source = propSource || def.source;

  useEffect(() => {
    if (!isOpen) return;

    // Determine vertical placement based on viewport clearance
    if (placement === 'top' || placement === 'bottom') {
      setComputedPlacement(placement);
    } else if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If trigger is within 220px of top viewport, flip down
      if (rect.top < 220) {
        setComputedPlacement('bottom');
      } else {
        setComputedPlacement('top');
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, placement]);

  const sizeClasses = {
    xs: iconOnly ? 'p-0.5' : 'text-[9px] px-1 py-0.2 gap-0.5',
    sm: iconOnly ? 'p-1' : 'text-[10px] px-1.5 py-0.5 gap-1',
    md: iconOnly ? 'p-1.5' : 'text-xs px-2 py-0.5 gap-1'
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  }[size];

  const isBottom = computedPlacement === 'bottom';

  return (
    <span className={`inline-flex items-center relative align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Rule Reference: ${title} (${source})`}
        aria-label={`Rule Reference for ${title}`}
        className={`inline-flex items-center justify-center rounded font-mono font-bold tracking-tight uppercase transition cursor-pointer border ${sizeClasses} ${
          isOpen
            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-950/40'
            : 'bg-stone-800/80 hover:bg-stone-700 text-amber-300/90 hover:text-amber-200 border-amber-600/30 hover:border-amber-500/60'
        }`}
      >
        <HelpCircle className={`${iconSizes} text-amber-400 shrink-0`} />
        {!iconOnly && <span className="truncate max-w-[100px]">{label || title}</span>}
      </button>

      {/* Floating Rules Popover Card */}
      {isOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 w-72 sm:w-80 bg-stone-900/95 border border-amber-500/60 rounded-xl shadow-2xl p-3.5 backdrop-blur-md text-stone-100 font-sans text-xs animate-in fade-in zoom-in-95 duration-150 ${
            isBottom
              ? 'top-full mt-2 left-1/2 -translate-x-1/2'
              : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <h4 className="font-serif font-bold text-amber-200 text-xs truncate">{title}</h4>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-600/40 px-1.5 py-0.2 rounded font-mono font-bold">
                {def.edition}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Popover Content */}
          <div className="space-y-2 text-stone-300 text-[11px] leading-relaxed">
            <p className="font-medium text-stone-200">{summary}</p>
            {detail && <p className="text-stone-400 leading-normal">{detail}</p>}
          </div>

          {/* Citation & Source Footer */}
          <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500 font-mono">
            <span className="truncate">Ref: {source}</span>
            <span className="text-amber-400/80 font-semibold">Official Rulebook</span>
          </div>

          {/* Pointer caret arrow */}
          {isBottom ? (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 w-2.5 h-2.5 bg-stone-900 border-l border-t border-amber-500/60 rotate-45" />
          ) : (
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-stone-900 border-r border-b border-amber-500/60 rotate-45" />
          )}
        </div>
      )}
    </span>
  );
};
