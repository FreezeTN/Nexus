import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eCombatManeuvers,
  formatModifier,
  getCharacterBab,
  getEffectiveAbilities,
  getAbilityModifier
} from '../../utils/dndCalculations';
import {
  Swords,
  X,
  Dices,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles,
  Flame,
  ArrowRight,
  AlertTriangle,
  Move
} from 'lucide-react';

interface CombatManeuvers35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

type ManeuverTab = 'grapple' | 'trip' | 'disarm' | 'bullRush' | 'sunder' | 'overrun';

export const CombatManeuvers35eModal: React.FC<CombatManeuvers35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<ManeuverTab>('grapple');
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [weaponCategory, setWeaponCategory] = useState<'twoHanded' | 'oneHanded' | 'light'>('oneHanded');
  const [defenderWeaponCategory, setDefenderWeaponCategory] = useState<'twoHanded' | 'oneHanded' | 'light'>('oneHanded');

  // Calculation results
  const maneuvers = calculate35eCombatManeuvers(character);

  const handleToggleFeat = (featKey: keyof NonNullable<CharacterData['improvedManeuvers']>) => {
    if (!onUpdateCharacter) return;
    const current = character.improvedManeuvers || {};
    const updated = {
      ...current,
      [featKey]: !current[featKey]
    };
    onUpdateCharacter({
      ...character,
      improvedManeuvers: updated
    });
  };

  const handleToggleQuadruped = () => {
    if (!onUpdateCharacter) return;
    onUpdateCharacter({
      ...character,
      isQuadruped: !character.isQuadruped
    });
  };

  const handleRollManeuver = (name: string, bonus: number, rollDesc: string) => {
    if (onRoll) {
      onRoll(`[3.5e Maneuver] ${name}`, 20, 1, bonus, 'normal');
    }
  };

  // Weapon bonus for Disarm / Sunder
  const getAttackerWeaponBonus = () => {
    if (weaponCategory === 'twoHanded') return 4;
    if (weaponCategory === 'light') return -4;
    return 0;
  };

  const getDefenderWeaponBonus = () => {
    if (defenderWeaponCategory === 'twoHanded') return 4;
    if (defenderWeaponCategory === 'light') return -4;
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-600/60 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-600/50 rounded-lg text-amber-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-amber-200">
                  3.5e Combat Maneuvers Suite
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
                  Tactical Engine
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                Size: <strong className="text-stone-200">{character.sizeCategory || 'Medium'}</strong> ({formatModifier(maneuvers.sizeModifier)}) &bull; BAB: <strong className="text-amber-300">+{getCharacterBab(character)}</strong> &bull; Stability: <strong className="text-emerald-400">+{maneuvers.stabilityBonus}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Improved Feats Quick Bar */}
        <div className="bg-stone-950/70 border-b border-stone-800/80 px-4 py-2 flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
          <span className="text-stone-400 font-sans font-bold text-[10px] uppercase tracking-wider mr-1">
            Improved Feats:
          </span>
          {[
            { key: 'improvedGrapple' as const, label: 'Imp Grapple (+4)' },
            { key: 'improvedTrip' as const, label: 'Imp Trip (+4)' },
            { key: 'improvedDisarm' as const, label: 'Imp Disarm (+4)' },
            { key: 'improvedBullRush' as const, label: 'Imp Bull Rush (+4)' },
            { key: 'improvedSunder' as const, label: 'Imp Sunder (+4)' },
            { key: 'improvedOverrun' as const, label: 'Imp Overrun (+4)' }
          ].map((f) => {
            const isActive = Boolean(character.improvedManeuvers?.[f.key]);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleToggleFeat(f.key)}
                className={`px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                    : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                }`}
              >
                <span>{f.label}</span>
                {isActive && <span className="text-amber-400 text-[9px]">✓</span>}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleToggleQuadruped}
            className={`px-2 py-0.5 rounded border transition ml-auto flex items-center gap-1 ${
              character.isQuadruped
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
            }`}
            title="4+ legs grant +4 stability bonus vs Trip and Bull Rush"
          >
            <span>🐾 Quadruped (+4 Stability)</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-3 pt-2 gap-1 shrink-0 overflow-x-auto">
          {[
            { id: 'grapple', label: 'Grapple', icon: '🤼', bonus: maneuvers.grapple.checkBonus },
            { id: 'trip', label: 'Trip', icon: '🦶', bonus: maneuvers.trip.checkBonus },
            { id: 'disarm', label: 'Disarm', icon: '🗡️', bonus: maneuvers.disarm.checkBonus },
            { id: 'bullRush', label: 'Bull Rush', icon: '🐂', bonus: maneuvers.bullRush.checkBonus },
            { id: 'sunder', label: 'Sunder', icon: '🔨', bonus: maneuvers.sunder.checkBonus },
            { id: 'overrun', label: 'Overrun', icon: '🐎', bonus: maneuvers.overrun.checkBonus }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManeuverTab)}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-amber-300 border-t border-x border-amber-600/50 -mb-[1px]'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-stone-950 border border-stone-800 text-stone-300">
                {formatModifier(tab.bonus)}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GRAPPLE */}
          {activeTab === 'grapple' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                    <span>🤼</span> Grapple Check
                  </h4>
                  <p className="text-xs text-stone-400 mt-1 font-mono">
                    Formula: {maneuvers.grapple.formula}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {maneuvers.grapple.provokesAoO
                      ? '⚠️ Provokes Attack of Opportunity unless you have Improved Grapple.'
                      : '🛡️ Improved Grapple: No Attack of Opportunity provoked (+4 bonus active).'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-mono font-black text-amber-300">
                    {formatModifier(maneuvers.grapple.checkBonus)}
                  </div>
                  <button
                    onClick={() => handleRollManeuver('Grapple Check', maneuvers.grapple.checkBonus, 'Grapple Check')}
                    className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                  >
                    <Dices className="w-3.5 h-3.5" /> Roll Grapple
                  </button>
                </div>
              </div>

              {/* Grapple Tactics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="font-bold text-stone-200 flex items-center justify-between">
                    <span>1. Establish Hold / Join Grapple</span>
                    <button
                      onClick={() => handleRollManeuver('Grapple: Hold', maneuvers.grapple.checkBonus, 'Hold')}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      Roll &rarr;
                    </button>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Step 1: Melee touch attack. Step 2: Opposed grapple check. If you succeed, you are grappling and deal unarmed damage!
                  </p>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="font-bold text-stone-200 flex items-center justify-between">
                    <span>2. Pin Opponent</span>
                    <button
                      onClick={() => handleRollManeuver('Grapple: Pin Check', maneuvers.grapple.checkBonus, 'Pin')}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      Roll &rarr;
                    </button>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Opposed grapple check. While pinned, opponent cannot move, is denied DEX bonus to AC (-4 AC), and cannot cast spells with somatic components.
                  </p>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="font-bold text-stone-200 flex items-center justify-between">
                    <span>3. Deal Damage with Light Weapon</span>
                    <button
                      onClick={() => handleRollManeuver('Grapple: Light Weapon Attack', maneuvers.grapple.checkBonus - 4, 'Attack in Grapple')}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      Roll (-4 Atk) &rarr;
                    </button>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Attack with light weapon or natural weapon at -4 attack penalty, or make grapple check to deal unarmed strike damage.
                  </p>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5">
                  <div className="font-bold text-stone-200 flex items-center justify-between">
                    <span>4. Escape Grapple / Break Pin</span>
                    <button
                      onClick={() => handleRollManeuver('Escape Grapple Check', maneuvers.grapple.checkBonus, 'Escape')}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      Roll &rarr;
                    </button>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Make an opposed Grapple check or Escape Artist check vs opponent's grapple check. Success breaks pin or ends grapple.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRIP */}
          {activeTab === 'trip' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                      <span>🦶</span> Trip Attack & Opposed Strength Check
                    </h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Trip Check: {maneuvers.trip.formula}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRollManeuver('Trip Touch Attack', maneuvers.trip.touchAttackBonus, 'Touch Atk')}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition"
                    >
                      Touch Atk ({formatModifier(maneuvers.trip.touchAttackBonus)})
                    </button>
                    <button
                      onClick={() => handleRollManeuver('Trip Opposed STR Check', maneuvers.trip.checkBonus, 'Trip Check')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Dices className="w-3.5 h-3.5" /> Roll Trip Check ({formatModifier(maneuvers.trip.checkBonus)})
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-stone-900/80 rounded-lg border border-stone-800 text-xs text-stone-300 space-y-1.5">
                  <div className="font-bold text-amber-300">How Tripping Works in 3.5e:</div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-400">
                    <li>Make an unarmed melee touch attack (or with a trip weapon like flail/halberd/guisarme).</li>
                    <li>If it hits, make an opposed check: Your STR check vs Defender's STR or DEX check (whichever is higher).</li>
                    <li>Each size category difference gives +4 / -4. Stability (Dwarf, 4+ legs) adds +4 to resist.</li>
                    <li>If you win, defender is tripped and knocked <strong>Prone</strong> (-4 melee attack, -4 AC vs melee, +4 AC vs ranged).</li>
                    <li>If you fail, the defender may immediately react and make an opposed STR check to trip you!</li>
                  </ol>
                  {character.improvedManeuvers?.improvedTrip && (
                    <div className="text-emerald-400 font-bold pt-1">
                      ⚡ Improved Trip Active: You do not provoke AoO, get +4 to trip checks, and if you succeed, you gain an immediate free melee attack against the fallen foe!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISARM */}
          {activeTab === 'disarm' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                      <span>🗡️</span> Disarm Opposed Attack Roll
                    </h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Formula: {maneuvers.disarm.formula}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-amber-300">
                      {formatModifier(maneuvers.disarm.checkBonus + getAttackerWeaponBonus())}
                    </span>
                    <button
                      onClick={() => handleRollManeuver('Disarm Check', maneuvers.disarm.checkBonus + getAttackerWeaponBonus(), 'Disarm')}
                      className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Dices className="w-3.5 h-3.5" /> Roll Disarm
                    </button>
                  </div>
                </div>

                {/* Weapon Category Selectors */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block font-bold mb-1">Your Weapon:</span>
                    <div className="flex items-center gap-1">
                      {(['twoHanded', 'oneHanded', 'light'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setWeaponCategory(cat)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex-1 ${
                            weaponCategory === cat
                              ? 'bg-amber-600 text-stone-950'
                              : 'bg-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          {cat === 'twoHanded' ? '2-Hand (+4)' : cat === 'light' ? 'Light (-4)' : '1-Hand (0)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block font-bold mb-1">Defender's Weapon:</span>
                    <div className="flex items-center gap-1">
                      {(['twoHanded', 'oneHanded', 'light'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setDefenderWeaponCategory(cat)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex-1 ${
                            defenderWeaponCategory === cat
                              ? 'bg-amber-600 text-stone-950'
                              : 'bg-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          {cat === 'twoHanded' ? '2-Hand (+4)' : cat === 'light' ? 'Light (-4)' : '1-Hand (0)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-stone-400 font-mono bg-stone-900/60 p-2.5 rounded border border-stone-800">
                  If successful: Target's weapon drops in their space. If you were unarmed or using a gauntlet, you can claim the weapon in your hand! If you fail, the defender may immediately attempt to disarm you.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BULL RUSH */}
          {activeTab === 'bullRush' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                      <span>🐂</span> Bull Rush (Push Opponent Back)
                    </h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Formula: {maneuvers.bullRush.formula}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-amber-300">
                      {formatModifier(maneuvers.bullRush.checkBonus + (isCharging ? 2 : 0))}
                    </span>
                    <button
                      onClick={() => handleRollManeuver('Bull Rush Check', maneuvers.bullRush.checkBonus + (isCharging ? 2 : 0), 'Bull Rush')}
                      className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Dices className="w-3.5 h-3.5" /> Roll Bull Rush
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-stone-900 p-2.5 rounded-lg border border-stone-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCharging}
                      onChange={(e) => setIsCharging(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 rounded"
                    />
                    <span className="font-bold text-stone-200">Charging (+2 bonus to Bull Rush check)</span>
                  </label>
                </div>

                <div className="p-3 bg-stone-900/80 rounded-lg border border-stone-800 text-xs text-stone-400 space-y-1">
                  <span className="font-bold text-stone-200 block">Distance Pushed:</span>
                  <p>
                    Winning the check pushes the defender back <strong>5 feet</strong>. For every <strong>5 points</strong> by which your check result exceeds the defender's check result, you can push the defender back an additional 5 feet (and you may move with them if desired).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUNDER */}
          {activeTab === 'sunder' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                      <span>🔨</span> Sunder (Strike Weapon or Shield)
                    </h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Formula: {maneuvers.sunder.formula}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-amber-300">
                      {formatModifier(maneuvers.sunder.checkBonus + getAttackerWeaponBonus())}
                    </span>
                    <button
                      onClick={() => handleRollManeuver('Sunder Opposed Roll', maneuvers.sunder.checkBonus + getAttackerWeaponBonus(), 'Sunder')}
                      className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Dices className="w-3.5 h-3.5" /> Roll Sunder
                    </button>
                  </div>
                </div>

                {/* Common Hardness & HP Reference */}
                <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 text-xs space-y-2">
                  <span className="font-bold text-amber-300 block uppercase tracking-wider text-[10px]">
                    3.5e Common Item Hardness & Hit Points:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-300 font-mono text-[11px]">
                    <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                      <span className="text-stone-400 block text-[9px]">Light Blade</span>
                      Hardness 10, HP 2
                    </div>
                    <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                      <span className="text-stone-400 block text-[9px]">1H Weapon</span>
                      Hardness 10, HP 5
                    </div>
                    <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                      <span className="text-stone-400 block text-[9px]">2H Weapon</span>
                      Hardness 10, HP 10
                    </div>
                    <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                      <span className="text-stone-400 block text-[9px]">Heavy Shield</span>
                      Hardness 10, HP 20
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    If your opposed roll succeeds, deal damage to item directly. Damage above Hardness subtracts from Item HP. At 0 HP, item is destroyed! (Magic items get +2 Hardness and +10 HP per +1 enhancement bonus).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OVERRUN */}
          {activeTab === 'overrun' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-200 font-serif flex items-center gap-1.5">
                      <span>🐎</span> Overrun (Trample / Knock Down)
                    </h4>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      Formula: {maneuvers.overrun.formula}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black text-amber-300">
                      {formatModifier(maneuvers.overrun.checkBonus)}
                    </span>
                    <button
                      onClick={() => handleRollManeuver('Overrun STR Check', maneuvers.overrun.checkBonus, 'Overrun')}
                      className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow"
                    >
                      <Dices className="w-3.5 h-3.5" /> Roll Overrun
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-stone-900/80 rounded-lg border border-stone-800 text-xs text-stone-400 space-y-1">
                  <span className="font-bold text-stone-200 block">How Overrun Works:</span>
                  <p>
                    As part of a move action, you attempt to move through an opponent's space. The opponent can choose to avoid you or block you. If they block you, make an opposed STR check.
                  </p>
                  <p className="text-emerald-400">
                    If you win, you knock the defender prone and continue your movement! If you fail, you are knocked prone or stopped in your tracks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
