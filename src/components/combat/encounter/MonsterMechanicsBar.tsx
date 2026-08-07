import React from 'react';
import { Combatant } from './encounterTypes';

interface MonsterMechanicsBarProps {
  combatants: Combatant[];
  onTriggerBeholderEyeRay: () => void;
  onTriggerMedusaGaze: () => void;
  onTriggerRemorhazHeatedBody: () => void;
  onTriggerRemorhazSwallow: () => void;
  onTriggerRoperReel: () => void;
  onTriggerIronGolemPoisonBreath: () => void;
  onTriggerIronGolemFireAbsorption: () => void;
  onTriggerRustTouch: () => void;
  onTriggerMindBlast: () => void;
  onTriggerVampiricBite: () => void;
  onTriggerGibberingMouther: () => void;
  onTriggerCloakerTransfer: () => void;
  onTriggerShamblingMoundEngulf: () => void;
  onTriggerShamblingMoundLightning: () => void;
  onTriggerPhaseSpiderJaunt: () => void;
  onTriggerGhostEtherealness: () => void;
  onTriggerGhostPossession: () => void;
  onTriggerNightmareStride: () => void;
  onTriggerSuccubusEtherealness: () => void;
  onTriggerNightHagEtherealness: () => void;
  onTriggerNightHagNightmareHaunting: () => void;
  onTriggerEtherealFilcherJaunt: () => void;
  onTriggerBlinkDogTeleport: () => void;
  onTriggerFlameskullFireball: () => void;
  onTriggerShadowStrengthDrain: () => void;
  onTriggerCockatricePetrify: () => void;
  onTriggerAbolethMucousCloud: () => void;
}

export const MonsterMechanicsBar: React.FC<MonsterMechanicsBarProps> = ({
  combatants,
  onTriggerBeholderEyeRay,
  onTriggerMedusaGaze,
  onTriggerRemorhazHeatedBody,
  onTriggerRemorhazSwallow,
  onTriggerRoperReel,
  onTriggerIronGolemPoisonBreath,
  onTriggerIronGolemFireAbsorption,
  onTriggerRustTouch,
  onTriggerMindBlast,
  onTriggerVampiricBite,
  onTriggerGibberingMouther,
  onTriggerCloakerTransfer,
  onTriggerShamblingMoundEngulf,
  onTriggerShamblingMoundLightning,
  onTriggerPhaseSpiderJaunt,
  onTriggerGhostEtherealness,
  onTriggerGhostPossession,
  onTriggerNightmareStride,
  onTriggerSuccubusEtherealness,
  onTriggerNightHagEtherealness,
  onTriggerNightHagNightmareHaunting,
  onTriggerEtherealFilcherJaunt,
  onTriggerBlinkDogTeleport,
  onTriggerFlameskullFireball,
  onTriggerShadowStrengthDrain,
  onTriggerCockatricePetrify,
  onTriggerAbolethMucousCloud
}) => {
  const hasMonster = (query: string) =>
    combatants.some(c => c.name.toLowerCase().includes(query));

  const showBeholder = hasMonster('beholder');
  const showMedusa = hasMonster('medusa');
  const showRemorhaz = hasMonster('remorhaz');
  const showRoper = hasMonster('roper');
  const showIronGolem = hasMonster('iron golem') || (hasMonster('golem') && hasMonster('iron'));
  const showRustMonster = hasMonster('rust');
  const showMindFlayer = hasMonster('mind flayer') || hasMonster('illithid');
  const showVampire = hasMonster('vampire') || hasMonster('vampiric');
  const showGibbering = hasMonster('gibbering') || hasMonster('mouther');
  const showCloaker = hasMonster('cloaker');
  const showShambling = hasMonster('shambling') || hasMonster('mound');
  const showPhaseSpider = hasMonster('phase spider') || hasMonster('phase');
  const showGhost = hasMonster('ghost');
  const showNightmare = hasMonster('nightmare');
  const showSuccubus = hasMonster('succubus') || hasMonster('incubus');
  const showNightHag = hasMonster('hag') || hasMonster('night hag');
  const showEtherealFilcher = hasMonster('filcher') || hasMonster('ethereal filcher');
  const showBlinkDog = hasMonster('blink dog');
  const showFlameskull = hasMonster('flameskull');
  const showShadow = hasMonster('shadow');
  const showCockatrice = hasMonster('cockatrice');
  const showAboleth = hasMonster('aboleth');

  const hasAnySpecialMonster =
    showBeholder || showMedusa || showRemorhaz || showRoper || showIronGolem ||
    showRustMonster || showMindFlayer || showVampire || showGibbering || showCloaker ||
    showShambling || showPhaseSpider || showGhost || showNightmare || showSuccubus || showNightHag ||
    showEtherealFilcher || showBlinkDog || showFlameskull || showShadow || showCockatrice || showAboleth;

  if (!hasAnySpecialMonster) return null;

  return (
    <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-200">
        <span className="flex items-center gap-1.5">
          <span>👹</span>
          <span>Monster Mechanics & Special Action Triggers</span>
        </span>
        <span className="text-[10px] text-stone-400 font-sans">
          Click to trigger mechanics in die roller & combat log
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        {showBeholder && (
          <button onClick={onTriggerBeholderEyeRay} className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/50 text-purple-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>👁️</span> Beholder Eye Ray
          </button>
        )}
        {showMedusa && (
          <button onClick={onTriggerMedusaGaze} className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🗿</span> Medusa Gaze (DC 14)
          </button>
        )}
        {showRemorhaz && (
          <>
            <button onClick={onTriggerRemorhazHeatedBody} className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🔥</span> Remorhaz Heated Body
            </button>
            <button onClick={onTriggerRemorhazSwallow} className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🕳️</span> Remorhaz Swallow
            </button>
          </>
        )}
        {showRoper && (
          <button onClick={onTriggerRoperReel} className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🪢</span> Roper Reel & Bite
          </button>
        )}
        {showIronGolem && (
          <>
            <button onClick={onTriggerIronGolemPoisonBreath} className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 border border-teal-600/50 text-teal-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🧪</span> Iron Golem Breath
            </button>
            <button onClick={onTriggerIronGolemFireAbsorption} className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🔥</span> Iron Golem Fire Absorption
            </button>
          </>
        )}
        {showRustMonster && (
          <button onClick={onTriggerRustTouch} className="px-2.5 py-1 bg-orange-950 hover:bg-orange-900 border border-orange-600/50 text-orange-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>⚙️</span> Rust Touch (-1 AC)
          </button>
        )}
        {showMindFlayer && (
          <button onClick={onTriggerMindBlast} className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🧠</span> Mind Blast (DC 15)
          </button>
        )}
        {showVampire && (
          <button onClick={onTriggerVampiricBite} className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-600/50 text-red-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🩸</span> Vampiric Bite
          </button>
        )}
        {showGibbering && (
          <button onClick={onTriggerGibberingMouther} className="px-2.5 py-1 bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-600/50 text-fuchsia-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🗣️</span> Gibbering Aura
          </button>
        )}
        {showCloaker && (
          <button onClick={onTriggerCloakerTransfer} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-600/50 text-slate-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🧥</span> Cloaker Damage Transfer
          </button>
        )}
        {showShambling && (
          <>
            <button onClick={onTriggerShamblingMoundEngulf} className="px-2.5 py-1 bg-lime-950 hover:bg-lime-900 border border-lime-600/50 text-lime-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🌿</span> Shambling Engulf
            </button>
            <button onClick={onTriggerShamblingMoundLightning} className="px-2.5 py-1 bg-yellow-950 hover:bg-yellow-900 border border-yellow-600/50 text-yellow-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>⚡</span> Shambling Lightning Heal
            </button>
          </>
        )}
        {showPhaseSpider && (
          <button onClick={onTriggerPhaseSpiderJaunt} className="px-2.5 py-1 bg-violet-950 hover:bg-violet-900 border border-violet-600/50 text-violet-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🌌</span> Phase Spider Jaunt
          </button>
        )}
        {showGhost && (
          <>
            <button onClick={onTriggerGhostEtherealness} className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🌌</span> Ghost Etherealness
            </button>
            <button onClick={onTriggerGhostPossession} className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-600/50 text-purple-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>👻</span> Ghost Possession
            </button>
          </>
        )}
        {showNightmare && (
          <button onClick={onTriggerNightmareStride} className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🌌</span> Nightmare Stride
          </button>
        )}
        {showSuccubus && (
          <button onClick={onTriggerSuccubusEtherealness} className="px-2.5 py-1 bg-pink-950 hover:bg-pink-900 border border-pink-600/50 text-pink-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🌌</span> Succubus Etherealness
          </button>
        )}
        {showNightHag && (
          <>
            <button onClick={onTriggerNightHagEtherealness} className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>🌌</span> Night Hag Etherealness
            </button>
            <button onClick={onTriggerNightHagNightmareHaunting} className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-600 text-purple-300 rounded-lg transition font-bold flex items-center gap-1 shadow">
              <span>💤</span> Nightmare Haunting
            </button>
          </>
        )}
        {showEtherealFilcher && (
          <button onClick={onTriggerEtherealFilcherJaunt} className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🌌</span> Filcher Snatch & Vanish
          </button>
        )}
        {showBlinkDog && (
          <button onClick={onTriggerBlinkDogTeleport} className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>✨</span> Blink Dog Teleport
          </button>
        )}
        {showFlameskull && (
          <button onClick={onTriggerFlameskullFireball} className="px-2.5 py-1 bg-orange-950 hover:bg-orange-900 border border-orange-600/50 text-orange-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🔥</span> Flameskull Fireball
          </button>
        )}
        {showShadow && (
          <button onClick={onTriggerShadowStrengthDrain} className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>👻</span> Shadow STR Drain
          </button>
        )}
        {showCockatrice && (
          <button onClick={onTriggerCockatricePetrify} className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-500 text-stone-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🐓</span> Cockatrice Petrify
          </button>
        )}
        {showAboleth && (
          <button onClick={onTriggerAbolethMucousCloud} className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 rounded-lg transition font-bold flex items-center gap-1 shadow">
            <span>🦠</span> Aboleth Mucous Cloud
          </button>
        )}
      </div>
    </div>
  );
};
