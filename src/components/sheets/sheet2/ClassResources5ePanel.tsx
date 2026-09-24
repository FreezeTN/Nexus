import React from 'react';
import { CharacterData } from '../../../types';
import { getEffectiveAbilities, getAbilityModifier } from '../../../utils/dndCalculations';
import { Flame, Sparkles, Shield, Heart, Zap, RefreshCw, Dices } from 'lucide-react';

interface ClassResources5ePanelProps {
  character: CharacterData;
  onUpdateCharacter: (character: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const ClassResources5ePanel: React.FC<ClassResources5ePanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  if (character.edition === '3.5e') return null;

  const cls = (character.characterClass || '').toLowerCase();
  const secCls = (character.optionalRules?.useMulticlassing && character.optionalRules?.secondaryClass)
    ? character.optionalRules.secondaryClass.toLowerCase()
    : '';

  const priLvl = character.level || 1;
  const secLvl = character.optionalRules?.secondaryLevel || 1;

  const getClassLevel = (className: string): number => {
    let lvl = 0;
    if (cls.includes(className)) lvl += priLvl;
    if (secCls.includes(className)) lvl += secLvl;
    return lvl;
  };

  const barbLvl = getClassLevel('barbarian');
  const monkLvl = getClassLevel('monk');
  const sorcLvl = getClassLevel('sorcerer');
  const clericLvl = getClassLevel('cleric');
  const paladinLvl = getClassLevel('paladin');
  const bardLvl = getClassLevel('bard');
  const fighterLvl = getClassLevel('fighter');
  const rogueLvl = getClassLevel('rogue');
  const druidLvl = getClassLevel('druid');

  const hasAny5eResource =
    barbLvl > 0 ||
    monkLvl >= 2 ||
    sorcLvl >= 2 ||
    clericLvl >= 2 ||
    paladinLvl >= 1 ||
    bardLvl > 0 ||
    fighterLvl > 0 ||
    rogueLvl > 0 ||
    druidLvl >= 2;

  if (!hasAny5eResource) return null;

  const effectiveAbilities = getEffectiveAbilities(character);
  const chaMod = getAbilityModifier(effectiveAbilities.CHA?.score || 10);

  // Initialize or fetch resources
  const res = character.classResources5e || {};

  const updateRes = (patch: Partial<NonNullable<CharacterData['classResources5e']>>) => {
    onUpdateCharacter({
      ...character,
      classResources5e: {
        ...res,
        ...patch
      }
    });
  };

  // 1. Barbarian Calculations
  const getBarbarianRageMax = (lvl: number): number => {
    if (lvl >= 20) return 999;
    if (lvl >= 17) return 6;
    if (lvl >= 12) return 5;
    if (lvl >= 6) return 4;
    if (lvl >= 3) return 3;
    return 2;
  };
  const getRageDamage = (lvl: number): number => {
    if (lvl >= 16) return 4;
    if (lvl >= 9) return 3;
    return 2;
  };
  const rageMax = getBarbarianRageMax(barbLvl);
  const rageCurrent = res.rage?.current ?? rageMax;
  const isRaging = res.rage?.isRaging ?? false;

  // 2. Monk Ki Calculations
  const kiMax = monkLvl >= 2 ? monkLvl : 0;
  const kiCurrent = res.ki?.current ?? kiMax;

  // 3. Sorcerer Sorcery Points Calculations
  const sorcPointsMax = sorcLvl >= 2 ? sorcLvl : 0;
  const sorcPointsCurrent = res.sorceryPoints?.current ?? sorcPointsMax;

  // 4. Channel Divinity
  let channelDivinityMax = 0;
  if (clericLvl >= 18) channelDivinityMax = 3;
  else if (clericLvl >= 6) channelDivinityMax = 2;
  else if (clericLvl >= 2) channelDivinityMax = 1;
  else if (paladinLvl >= 3) channelDivinityMax = 1;
  const channelDivinityCurrent = res.channelDivinity?.current ?? channelDivinityMax;

  // 5. Bardic Inspiration
  const bardicDie = bardLvl >= 15 ? 'd12' : bardLvl >= 10 ? 'd10' : bardLvl >= 5 ? 'd8' : 'd6';
  const bardicDieFaces = bardLvl >= 15 ? 12 : bardLvl >= 10 ? 10 : bardLvl >= 5 ? 8 : 6;
  const bardicMax = Math.max(1, chaMod);
  const bardicCurrent = res.bardicInspiration?.current ?? bardicMax;

  // 6. Fighter
  const secondWindAvailable = res.secondWind?.available ?? true;
  const actionSurgeMax = fighterLvl >= 17 ? 2 : fighterLvl >= 2 ? 1 : 0;
  const actionSurgeCurrent = res.actionSurge?.current ?? actionSurgeMax;

  // 7. Rogue Sneak Attack
  const sneakDice = Math.ceil(rogueLvl / 2);

  // 8. Druid Wild Shape
  const wildShapeMax = druidLvl >= 20 ? 999 : druidLvl >= 2 ? 2 : 0;
  const wildShapeCurrent = res.wildShape?.current ?? wildShapeMax;

  // 9. Paladin Lay on Hands
  const layOnHandsMax = paladinLvl * 5;
  const layOnHandsCurrent = res.layOnHands5e?.current ?? layOnHandsMax;

  // Rest recovery handlers
  const handleShortRest = () => {
    updateRes({
      ki: monkLvl >= 2 ? { current: kiMax, max: kiMax } : res.ki,
      channelDivinity: channelDivinityMax > 0 ? { current: channelDivinityMax, max: channelDivinityMax } : res.channelDivinity,
      bardicInspiration: bardLvl >= 5 ? { current: bardicMax, max: bardicMax } : res.bardicInspiration,
      secondWind: fighterLvl >= 1 ? { available: true } : res.secondWind,
      actionSurge: actionSurgeMax > 0 ? { current: actionSurgeMax, max: actionSurgeMax } : res.actionSurge,
      wildShape: wildShapeMax > 0 ? { current: wildShapeMax, max: wildShapeMax } : res.wildShape
    });
  };

  const handleLongRest = () => {
    updateRes({
      rage: barbLvl > 0 ? { current: rageMax, max: rageMax, isRaging: false } : res.rage,
      ki: monkLvl >= 2 ? { current: kiMax, max: kiMax } : res.ki,
      sorceryPoints: sorcLvl >= 2 ? { current: sorcPointsMax, max: sorcPointsMax } : res.sorceryPoints,
      channelDivinity: channelDivinityMax > 0 ? { current: channelDivinityMax, max: channelDivinityMax } : res.channelDivinity,
      bardicInspiration: bardLvl > 0 ? { current: bardicMax, max: bardicMax } : res.bardicInspiration,
      secondWind: fighterLvl >= 1 ? { available: true } : res.secondWind,
      actionSurge: actionSurgeMax > 0 ? { current: actionSurgeMax, max: actionSurgeMax } : res.actionSurge,
      wildShape: wildShapeMax > 0 ? { current: wildShapeMax, max: wildShapeMax } : res.wildShape,
      layOnHands5e: paladinLvl > 0 ? { current: layOnHandsMax, max: layOnHandsMax } : res.layOnHands5e
    });
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 space-y-3 shadow-md">
      {/* Header with Rest resets */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-serif font-black uppercase tracking-wider text-stone-200">
            5e Class Features & Resources
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShortRest}
            className="px-2 py-0.5 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-[10px] font-mono text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Recover Short Rest class resources (Ki, Channel Divinity, Wild Shape, Action Surge, Second Wind, Font of Inspiration)"
          >
            Short Rest
          </button>
          <button
            type="button"
            onClick={handleLongRest}
            className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/50 text-[10px] font-mono text-amber-300 font-bold transition cursor-pointer"
            title="Reset all 5e daily resources to full"
          >
            Long Rest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* BARBARIAN RAGE */}
        {barbLvl > 0 && (
          <div className={`p-2.5 rounded-xl border transition ${
            isRaging ? 'bg-rose-950/40 border-rose-600/70 shadow-inner' : 'bg-stone-950 border-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 ${isRaging ? 'text-rose-400 animate-pulse' : 'text-stone-400'}`} />
                <span className="text-xs font-bold text-stone-200">Barbarian Rage</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newRaging = !isRaging;
                  let newCur = rageCurrent;
                  if (newRaging && rageCurrent > 0 && rageMax !== 999) {
                    newCur = Math.max(0, rageCurrent - 1);
                  }
                  updateRes({ rage: { current: newCur, max: rageMax, isRaging: newRaging } });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  isRaging
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                }`}
              >
                {isRaging ? '🔥 RAGING (+B/P/S Res)' : 'Enter Rage'}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">
                Bonus: <strong className="text-amber-400">+{getRageDamage(barbLvl)} Dmg</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ rage: { ...res.rage, current: Math.max(0, rageCurrent - 1), max: rageMax } })}
                  disabled={rageCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-stone-200 font-bold">
                  {rageMax === 999 ? '∞' : `${rageCurrent} / ${rageMax}`}
                </span>
                <button
                  type="button"
                  onClick={() => updateRes({ rage: { ...res.rage, current: Math.min(rageMax, rageCurrent + 1), max: rageMax } })}
                  disabled={rageCurrent >= rageMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MONK KI */}
        {monkLvl >= 2 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-200">Monk Ki Points</span>
              <span className="text-[10px] text-teal-400 font-mono">Short Rest</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">Flurry / Patient / Step</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ ki: { current: Math.max(0, kiCurrent - 1), max: kiMax } })}
                  disabled={kiCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-teal-300 font-bold">{kiCurrent} / {kiMax}</span>
                <button
                  type="button"
                  onClick={() => updateRes({ ki: { current: Math.min(kiMax, kiCurrent + 1), max: kiMax } })}
                  disabled={kiCurrent >= kiMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SORCERER SORCERY POINTS */}
        {sorcLvl >= 2 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-200">Sorcery Points</span>
              <span className="text-[10px] text-purple-400 font-mono">Font of Magic</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">Metamagic Fuel</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ sorceryPoints: { current: Math.max(0, sorcPointsCurrent - 1), max: sorcPointsMax } })}
                  disabled={sorcPointsCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-purple-300 font-bold">{sorcPointsCurrent} / {sorcPointsMax}</span>
                <button
                  type="button"
                  onClick={() => updateRes({ sorceryPoints: { current: Math.min(sorcPointsMax, sorcPointsCurrent + 1), max: sorcPointsMax } })}
                  disabled={sorcPointsCurrent >= sorcPointsMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CLERIC / PALADIN CHANNEL DIVINITY */}
        {channelDivinityMax > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-200">Channel Divinity</span>
              <span className="text-[10px] text-amber-400 font-mono">Short/Long Rest</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">Turn Undead / Sacred Weapon</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ channelDivinity: { current: Math.max(0, channelDivinityCurrent - 1), max: channelDivinityMax } })}
                  disabled={channelDivinityCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-amber-300 font-bold">{channelDivinityCurrent} / {channelDivinityMax}</span>
                <button
                  type="button"
                  onClick={() => updateRes({ channelDivinity: { current: Math.min(channelDivinityMax, channelDivinityCurrent + 1), max: channelDivinityMax } })}
                  disabled={channelDivinityCurrent >= channelDivinityMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARDIC INSPIRATION */}
        {bardLvl > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-200">Bardic Inspiration</span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded">
                  1{bardicDie}
                </span>
              </div>
              {onRoll && (
                <button
                  type="button"
                  onClick={() => {
                    if (bardicCurrent > 0) {
                      updateRes({ bardicInspiration: { current: bardicCurrent - 1, max: bardicMax } });
                    }
                    onRoll(`Bardic Inspiration (1${bardicDie})`, bardicDieFaces, 1, 0, 'normal');
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                >
                  Roll Die 🎲
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">{bardLvl >= 5 ? 'Short/Long Rest' : 'Long Rest'}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ bardicInspiration: { current: Math.max(0, bardicCurrent - 1), max: bardicMax } })}
                  disabled={bardicCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-indigo-300 font-bold">{bardicCurrent} / {bardicMax}</span>
                <button
                  type="button"
                  onClick={() => updateRes({ bardicInspiration: { current: Math.min(bardicMax, bardicCurrent + 1), max: bardicMax } })}
                  disabled={bardicCurrent >= bardicMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FIGHTER SECOND WIND & ACTION SURGE */}
        {fighterLvl > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-200">Fighter Maneuvers</span>
              <span className="text-[10px] text-stone-500 font-mono">Short Rest</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-300">Second Wind (1d10 + {fighterLvl})</span>
              <button
                type="button"
                onClick={() => {
                  const nextAvail = !secondWindAvailable;
                  updateRes({ secondWind: { available: nextAvail } });
                  if (secondWindAvailable && onRoll) {
                    onRoll(`Second Wind Heal (1d10 + ${fighterLvl})`, 10, 1, fighterLvl, 'normal');
                  }
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
                  secondWindAvailable
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900'
                    : 'bg-stone-900 text-stone-500 border border-stone-800'
                }`}
              >
                {secondWindAvailable ? 'Available (Heal)' : 'Expended'}
              </button>
            </div>
            {actionSurgeMax > 0 && (
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-stone-800">
                <span className="text-stone-300">Action Surge</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateRes({ actionSurge: { current: Math.max(0, actionSurgeCurrent - 1), max: actionSurgeMax } })}
                    disabled={actionSurgeCurrent <= 0}
                    className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                  >
                    -
                  </button>
                  <span className="text-amber-300 font-bold">{actionSurgeCurrent} / {actionSurgeMax}</span>
                  <button
                    type="button"
                    onClick={() => updateRes({ actionSurge: { current: Math.min(actionSurgeMax, actionSurgeCurrent + 1), max: actionSurgeMax } })}
                    disabled={actionSurgeCurrent >= actionSurgeMax}
                    className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROGUE SNEAK ATTACK */}
        {rogueLvl > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-stone-200 block">Rogue Sneak Attack</span>
              <span className="text-[10px] text-stone-400 font-mono">1/turn with Advantage or Ally adjacent</span>
            </div>
            <button
              type="button"
              onClick={() => onRoll && onRoll(`Sneak Attack Damage (${sneakDice}d6)`, 6, sneakDice, 0, 'normal')}
              className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>+{sneakDice}d6 Dmg</span>
            </button>
          </div>
        )}

        {/* DRUID WILD SHAPE */}
        {wildShapeMax > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-200">Druid Wild Shape</span>
              <span className="text-[10px] text-emerald-400 font-mono">Short Rest</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">Beast Shapes</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ wildShape: { current: Math.max(0, wildShapeCurrent - 1), max: wildShapeMax } })}
                  disabled={wildShapeCurrent <= 0}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  -
                </button>
                <span className="text-emerald-300 font-bold">
                  {wildShapeMax === 999 ? '∞' : `${wildShapeCurrent} / ${wildShapeMax}`}
                </span>
                <button
                  type="button"
                  onClick={() => updateRes({ wildShape: { current: Math.min(wildShapeMax, wildShapeCurrent + 1), max: wildShapeMax } })}
                  disabled={wildShapeCurrent >= wildShapeMax}
                  className="w-5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PALADIN LAY ON HANDS */}
        {paladinLvl > 0 && (
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-200">Lay on Hands</span>
              <span className="text-[10px] text-amber-400 font-mono">Long Rest Pool</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-400">5 HP per level</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => updateRes({ layOnHands5e: { current: Math.max(0, layOnHandsCurrent - 5), max: layOnHandsMax } })}
                  disabled={layOnHandsCurrent <= 0}
                  className="px-1.5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800 text-[10px]"
                >
                  -5
                </button>
                <span className="text-amber-300 font-bold">{layOnHandsCurrent} / {layOnHandsMax} HP</span>
                <button
                  type="button"
                  onClick={() => updateRes({ layOnHands5e: { current: Math.min(layOnHandsMax, layOnHandsCurrent + 5), max: layOnHandsMax } })}
                  disabled={layOnHandsCurrent >= layOnHandsMax}
                  className="px-1.5 h-5 rounded bg-stone-900 border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800 text-[10px]"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
