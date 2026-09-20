import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eAoOPool,
  DND35E_AOO_TRIGGERS,
  formatModifier
} from '../../utils/dndCalculations';
import {
  ShieldAlert,
  X,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Footprints,
  Sparkles,
  Swords,
  Crosshair,
  Maximize2
} from 'lucide-react';
import { CreatureSizeScaleModal } from './CreatureSizeScaleModal';

interface AoOTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollAttack?: (label: string, bonus: number) => void;
}

export const AoOTrackerModal: React.FC<AoOTrackerModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRollAttack
}) => {
  if (!isOpen) return null;

  const aooInfo = calculate35eAoOPool(character);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tracker' | 'rules'>('tracker');
  const [showSizeModal, setShowSizeModal] = useState(false);

  const handleSpendAoO = () => {
    if (aooInfo.currentAoO <= 0) return;
    onUpdateCharacter({
      ...character,
      aooRemaining: Math.max(0, aooInfo.currentAoO - 1)
    });
  };

  const handleRestoreAoO = () => {
    onUpdateCharacter({
      ...character,
      aooRemaining: Math.min(aooInfo.maxAoO, aooInfo.currentAoO + 1)
    });
  };

  const handleResetRound = () => {
    onUpdateCharacter({
      ...character,
      aooRemaining: aooInfo.maxAoO
    });
  };

  const handleToggleCombatReflexes = () => {
    const nextVal = !character.hasCombatReflexes;
    onUpdateCharacter({
      ...character,
      hasCombatReflexes: nextVal,
      aooRemaining: nextVal ? Math.max(1, 1 + aooInfo.dexBonus) : 1
    });
  };

  const filteredTriggers = DND35E_AOO_TRIGGERS.filter(
    (t) => filterCategory === 'all' || t.category === filterCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/80 via-stone-900 to-stone-900 p-4 border-b border-red-900/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                Attacks of Opportunity (AoO)
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-red-950/80 border border-red-800/60 text-red-300 rounded-full font-bold">
                  D&D 3.5e
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Turn-by-turn reaction budget, threatened reach & provocation triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-stone-800 bg-stone-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'tracker'
                ? 'border-red-500 text-red-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Combat Tracker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'rules'
                ? 'border-red-500 text-red-300 bg-stone-800/60'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            3.5e Trigger Reference ({DND35E_AOO_TRIGGERS.length})
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'tracker' ? (
            <>
              {/* AoO Status Counter Card */}
              <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                      Remaining AoOs This Round
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-mono font-bold text-red-400">
                        {aooInfo.currentAoO}
                      </span>
                      <span className="text-sm font-mono text-stone-500">
                        / {aooInfo.maxAoO} Max
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSpendAoO}
                      disabled={aooInfo.currentAoO <= 0}
                      className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 disabled:opacity-40 disabled:hover:bg-red-900/60 text-red-100 text-xs font-bold rounded-lg border border-red-700/50 transition flex items-center gap-1.5 shadow"
                    >
                      <Zap className="w-3.5 h-3.5 text-red-400" />
                      <span>Spend 1 AoO</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreAoO}
                      disabled={aooInfo.currentAoO >= aooInfo.maxAoO}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 text-xs font-bold rounded-lg border border-stone-700 transition"
                      title="Undo / Restore 1 AoO"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={handleResetRound}
                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold rounded-lg border border-stone-700 transition flex items-center gap-1"
                      title="Reset for New Combat Round"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>New Round</span>
                    </button>
                  </div>
                </div>

                {/* Progress Pip Bar */}
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: aooInfo.maxAoO }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2.5 flex-1 rounded-full border transition-colors ${
                        idx < aooInfo.currentAoO
                          ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                          : 'bg-stone-900 border-stone-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-[11px] font-mono text-stone-400 bg-stone-900/90 p-2 rounded-lg border border-stone-800 flex items-center justify-between flex-wrap gap-1">
                  <span>{aooInfo.explanation}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${aooInfo.threatReachFt === 0 ? 'text-amber-400' : 'text-amber-300'}`}>
                      Threatened Reach: {aooInfo.threatReachFt} ft
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSizeModal(true)}
                      className="text-[10px] font-sans text-amber-400 hover:text-amber-300 bg-stone-950 border border-amber-600/40 px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>Size & Reach Table</span>
                    </button>
                  </div>
                </div>

                {aooInfo.threatReachFt === 0 && (
                  <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-200">0 ft. Natural Reach ({character.sizeCategory || 'Tiny'}):</strong>
                      <span>Creatures with 0 ft. natural reach do not threaten squares around them and cannot make standard Attacks of Opportunity. You must move into an opponent&apos;s square to attack, which provokes an Attack of Opportunity!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Combat Reflexes Feat & Stance Settings */}
              <div className="bg-stone-950/50 border border-stone-800 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-stone-200">Combat Reflexes Feat</span>
                      <span className="text-[11px] text-stone-400 block">
                        Adds Dex mod ({formatModifier(aooInfo.dexBonus)}) to AoOs and allows AoOs while Flat-Footed
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aooInfo.hasCombatReflexes}
                      onChange={handleToggleCombatReflexes}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {aooInfo.canAoOFlatFooted && (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Flat-Footed Defense:</strong> You may make attacks of opportunity before you have acted in combat.</span>
                  </div>
                )}
              </div>

              {/* Quick Attack Strike */}
              {character.attacks && character.attacks.length > 0 && (
                <div className="bg-stone-950/50 border border-stone-800 p-3.5 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-red-400" />
                    Deliver AoO Strike (Single Melee Attack at Highest Bonus)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {character.attacks.slice(0, 4).map((atk) => (
                      <button
                        key={atk.id}
                        type="button"
                        onClick={() => {
                          handleSpendAoO();
                          if (onRollAttack) {
                            onRollAttack(`AoO: ${atk.name}`, atk.attackBonus);
                          }
                        }}
                        disabled={aooInfo.currentAoO <= 0}
                        className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 rounded-lg text-left transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-stone-200 group-hover:text-red-300 transition">
                            {atk.name}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {atk.damage} ({atk.damageType})
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-amber-400 block">
                            {formatModifier(atk.attackBonus)}
                          </span>
                          <span className="text-[9px] text-stone-500 uppercase">Strike</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Rules & Provocation Reference */
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['all', 'Movement', 'Spells', 'Combat Actions', 'Item Use'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      filterCategory === cat
                        ? 'bg-red-900/60 text-red-200 border border-red-700/50'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredTriggers.map((trig) => (
                  <div
                    key={trig.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      trig.provokes
                        ? 'bg-stone-950/80 border-red-900/40 text-stone-300'
                        : 'bg-stone-950/40 border-emerald-900/40 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-100 flex items-center gap-1.5">
                        {trig.provokes ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {trig.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                          trig.provokes
                            ? 'bg-red-950 text-red-300 border border-red-800/50'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        {trig.provokes ? 'Provokes AoO' : 'Safe Action'}
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px] leading-relaxed">
                      {trig.description}
                    </p>
                    {trig.exceptionOrAvoidance && (
                      <div className="text-[10px] font-mono text-amber-300/90 bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                        Avoidance: {trig.exceptionOrAvoidance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500 font-mono">
            3.5e Rule: Maximum 1 AoO per opportunity trigger per creature.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded Creature Size and Scale Table Modal */}
      <CreatureSizeScaleModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
      />
    </div>
  );
};
