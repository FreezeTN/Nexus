import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Sparkles,
  Footprints,
  Award,
  Eye,
  Brain,
  UserCheck,
  Pencil
} from 'lucide-react';
import { CharacterData, RuleEdition } from '../types';
import { HpOrb, getHpColorClass } from './HpOrb';
import { MaxHpInspectorModal } from './modals/MaxHpInspectorModal';
import {
  getEffectiveMaxHp,
  getArmorClassBreakdown,
  getEffectiveSpeed,
  getProficiencyBonus,
  getPassivePerception,
  formatModifier
} from '../utils/dndCalculations';

interface QuickStatsBarProps {
  activeCharacter: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollInitiative: () => void;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  activeCharacter,
  edition,
  onUpdateCharacter,
  onRollInitiative,
}) => {
  const [hpDelta, setHpDelta] = useState<string>('');
  const [showMaxHpInspector, setShowMaxHpInspector] = useState<boolean>(false);

  const effectiveMaxHp = getEffectiveMaxHp(activeCharacter);
  const currentEdition = edition || activeCharacter.edition || '5e';
  const profBonus = getProficiencyBonus(activeCharacter.level);
  const passivePerception = getPassivePerception(activeCharacter);
  const speedInfo = getEffectiveSpeed(activeCharacter);

  const handleApplyHpChange = (mode: 'heal' | 'damage') => {
    const val = parseInt(hpDelta, 10);
    if (isNaN(val) || val <= 0) return;
    let newHp = activeCharacter.hpCurrent;
    let newTemp = activeCharacter.hpTemp || 0;

    if (mode === 'heal') {
      newHp = Math.min(effectiveMaxHp, newHp + val);
    } else {
      if (newTemp > 0) {
        if (val <= newTemp) {
          newTemp -= val;
        } else {
          const remaining = val - newTemp;
          newTemp = 0;
          newHp = Math.max(0, newHp - remaining);
        }
      } else {
        newHp = Math.max(0, newHp - val);
      }
    }

    onUpdateCharacter({
      ...activeCharacter,
      hpCurrent: newHp,
      hpTemp: newTemp
    });
    setHpDelta('');
  };

  return (
    <div className="bg-stone-950/80 border border-stone-800 rounded-xl py-2.5 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Quick HP Status */}
        <div className="flex items-center gap-3 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
          <HpOrb hpCurrent={activeCharacter.hpCurrent} hpMax={effectiveMaxHp} size="sm" showLabel={false} />
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Hit Points</div>
            <div className="font-mono text-sm font-bold flex items-center gap-1">
              <span className={getHpColorClass((activeCharacter.hpCurrent / Math.max(1, effectiveMaxHp)) * 100)}>
                {activeCharacter.hpCurrent}
              </span>
              <span className="text-stone-500 font-normal">/</span>
              <button
                onClick={() => setShowMaxHpInspector(true)}
                className="text-stone-200 hover:text-amber-300 font-mono font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-stone-900/60 hover:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-800 transition"
                title="Click to inspect Max HP breakdown (Base, Feats, Equipped Items, Spells/Drain)"
              >
                <span>{effectiveMaxHp}</span>
                <Pencil className="w-2.5 h-2.5 text-amber-400 opacity-70 hover:opacity-100" />
              </button>
              {activeCharacter.hpTemp > 0 && (
                <span className="text-cyan-400 text-xs ml-1 font-semibold">
                  (+{activeCharacter.hpTemp} Temp)
                </span>
              )}
            </div>
          </div>

          {/* Quick HP Adjust Controls */}
          <div className="flex items-center gap-1 border-l border-stone-800 pl-2">
            <input
              type="number"
              value={hpDelta}
              onChange={(e) => setHpDelta(e.target.value)}
              placeholder="0"
              className="w-12 bg-stone-800 border border-stone-700 text-center font-mono rounded text-xs py-0.5"
            />
            <button
              onClick={() => handleApplyHpChange('heal')}
              className="px-1.5 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold rounded text-[10px]"
              title="Heal HP"
            >
              +
            </button>
            <button
              onClick={() => handleApplyHpChange('damage')}
              className="px-1.5 py-0.5 bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold rounded text-[10px]"
              title="Damage HP"
            >
              -
            </button>
          </div>
        </div>

        {/* Armor Class */}
        <div
          className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800"
          title={`Armor Class: ${activeCharacter.armorClass} (${getArmorClassBreakdown(activeCharacter).explanation})`}
        >
          <Shield className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Armor Class</div>
            <div className="font-mono text-sm font-extrabold text-amber-200">
              {activeCharacter.armorClass}
            </div>
          </div>
        </div>

        {/* Initiative */}
        <button
          onClick={onRollInitiative}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-800 hover:border-amber-500/50 transition cursor-pointer"
          title="Click to Roll Initiative!"
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              Initiative <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            </div>
            <div className="font-mono text-sm font-extrabold text-yellow-300">
              {formatModifier(activeCharacter.initiativeBonus)}
            </div>
          </div>
        </button>

        {/* Speed */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${
            speedInfo.isModified
              ? 'bg-amber-950/80 border-amber-600/70 text-amber-200 shadow-md'
              : 'bg-stone-900 border-stone-800'
          }`}
          title={
            speedInfo.isModified
              ? `Effective Speed: ${speedInfo.effectiveSpeed} ft (Base Speed: ${speedInfo.baseSpeed} ft | -${speedInfo.speedPenalty} ft ${speedInfo.reasons.join(', ')})`
              : `Base Walking Speed: ${speedInfo.baseSpeed} ft`
          }
        >
          <Footprints className={`w-4 h-4 ${speedInfo.isModified ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <span>Speed</span>
              {speedInfo.isModified && (
                <span className="text-[8px] bg-amber-500/30 text-amber-300 border border-amber-500/50 px-1 rounded font-mono font-bold uppercase">
                  Penalized
                </span>
              )}
            </div>
            <div className="font-mono text-sm font-bold flex items-center gap-1">
              <span className={speedInfo.isModified ? 'text-amber-300 font-extrabold' : 'text-stone-200'}>
                {speedInfo.effectiveSpeed} ft
              </span>
              {speedInfo.isModified && (
                <span className="text-[10px] text-stone-400 line-through font-normal">
                  ({speedInfo.baseSpeed}ft)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Proficiency Bonus */}
        <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
          <Award className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Prof. Bonus</div>
            <div className="font-mono text-sm font-bold text-purple-300">
              +{profBonus}
            </div>
          </div>
        </div>

        {/* Passive Perception */}
        <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
          <Eye className="w-4 h-4 text-teal-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-400">Passive Wis</div>
            <div className="font-mono text-sm font-bold text-teal-200">
              {passivePerception}
            </div>
          </div>
        </div>

        {/* Sanity Quick Status (Call of Cthulhu) */}
        {currentEdition === 'cthulhu' && (
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/60 px-3 py-1.5 rounded-xl text-emerald-200 shadow-md">
            <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                <span>Sanity</span>
                <span className={`text-[8px] px-1 rounded font-mono font-bold ${
                  (activeCharacter.sanity?.madnessState || 'Sane') === 'Sane'
                    ? 'bg-emerald-900/80 text-emerald-200'
                    : 'bg-rose-900/80 text-rose-200 border border-rose-500/50'
                }`}>
                  {activeCharacter.sanity?.madnessState || 'Sane'}
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-100">
                {activeCharacter.sanity?.current ?? 15} / {activeCharacter.sanity?.max ?? 20}
              </div>
            </div>
          </div>
        )}

        {/* Shadowrun Quick Status Banner */}
        {currentEdition === 'shadowrun' && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/60 px-3 py-1.5 rounded-xl text-cyan-200 shadow-md">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-cyan-300">Nuyen</div>
                <div className="font-mono text-sm font-bold text-amber-300">
                  ¥{(activeCharacter.shadowrun?.nuyen ?? 25000).toLocaleString()}
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-cyan-300">Karma</div>
                <div className="font-mono text-sm font-bold text-cyan-100">
                  {activeCharacter.shadowrun?.karmaCurrent ?? 10}
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-[10px] uppercase font-bold text-cyan-300">Essence</div>
                <div className="font-mono text-sm font-bold text-cyan-200">
                  {Math.max(0, 6.0 - (activeCharacter.shadowrun?.cyberware?.reduce((acc, c) => acc + (Number(c.essenceCost) || 0), 0) || 0)).toFixed(2)} / 6.0
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspiration Toggle */}
        <button
          onClick={() => onUpdateCharacter({ ...activeCharacter, inspiration: !activeCharacter.inspiration })}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${
            activeCharacter.inspiration
              ? 'bg-amber-900/60 border-amber-500 text-amber-200 shadow-md'
              : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold">Inspiration</div>
            <div className="font-bold text-xs">{activeCharacter.inspiration ? 'ACTIVE' : 'NONE'}</div>
          </div>
        </button>
      </div>

      {/* Max HP Inspector Modal */}
      {showMaxHpInspector && (
        <MaxHpInspectorModal
          isOpen={showMaxHpInspector}
          onClose={() => setShowMaxHpInspector(false)}
          character={activeCharacter}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </div>
  );
};
