import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getBinderMaxVestiges,
  DND35E_VESTIGES_COMPENDIUM,
  VestigeDefinition
} from '../../utils/calculators/supplemental35eCalculators';
import { Eye, Ghost, Skull, Shield, X, CheckCircle2, AlertTriangle, Dices, Plus, RotateCcw } from 'lucide-react';
import { getCombinedLevel, getAbilityModifier } from '../../utils/dndCalculations';

interface BinderPact35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number) => void;
}

export const BinderPact35eModal: React.FC<BinderPact35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const level = getCombinedLevel(character);
  const chaMod = getAbilityModifier(character.abilities.CHA.score);
  const maxVestiges = getBinderMaxVestiges(level);

  const existingState = character.binderPact35e || {
    boundVestiges: [
      {
        vestigeName: 'Naberius',
        goodPact: true,
        suppressSign: false
      }
    ]
  };

  const [boundVestiges, setBoundVestiges] = useState(existingState.boundVestiges || []);
  const [selectedTab, setSelectedTab] = useState<'active' | 'compendium'>('active');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleBind = (v: VestigeDefinition) => {
    setStatusNotice(null);
    const isBound = boundVestiges.some(b => b.vestigeName === v.name);
    if (isBound) {
      setBoundVestiges(prev => prev.filter(b => b.vestigeName !== v.name));
    } else {
      if (boundVestiges.length >= maxVestiges) {
        setStatusNotice(`⚠️ Binding Limit: You can only bind ${maxVestiges} vestige(s) simultaneously at level ${level}.`);
        return;
      }
      setBoundVestiges(prev => [
        ...prev,
        {
          vestigeName: v.name,
          goodPact: true,
          suppressSign: false
        }
      ]);
    }
  };

  const handleToggleSuppressSign = (vestigeName: string) => {
    setBoundVestiges(prev =>
      prev.map(b => (b.vestigeName === vestigeName ? { ...b, suppressSign: !b.suppressSign } : b))
    );
  };

  const handleRollPactCheck = (v: VestigeDefinition) => {
    const totalBonus = level + chaMod;
    const bonusText = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;
    const label = `Binding Check for ${v.name} (DC ${v.bindingDc})`;

    if (onRoll) {
      onRoll(label, 20, 1, totalBonus);
    } else {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const total = d20 + totalBonus;
      const success = total >= v.bindingDc;
      setStatusNotice(`🔮 Binding Check for ${v.name} (DC ${v.bindingDc}): Rolled 1d20 (${d20}) ${bonusText} = ${total}. ${success ? '✅ Success! Good Pact formed. You can suppress the sign and resist influence.' : '⚠️ Failed check! Poor Pact formed: You MUST manifest the physical sign and obey the vestige’s influence!'}`);
    }
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      binderPact35e: {
        ...existingState,
        boundVestiges
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-violet-500/40 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-950/60 border border-violet-600/40 rounded-lg text-violet-400">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Binder: Pact Magic & Vestige Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-700/50 font-mono">
                  Tome of Magic 3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Summon and bind vestiges of forgotten souls for supernatural powers, signs, and influences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/50 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTab('active')}
            className={`px-3 py-2 border-b-2 font-bold transition flex items-center gap-1.5 ${
              selectedTab === 'active'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Ghost className="w-3.5 h-3.5" /> Bound Vestiges ({boundVestiges.length}/{maxVestiges})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('compendium')}
            className={`px-3 py-2 border-b-2 font-bold transition flex items-center gap-1.5 ${
              selectedTab === 'compendium'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Vestige Compendium
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {statusNotice && (
            <div className="p-3 bg-violet-950/80 border border-violet-500/60 rounded-xl text-violet-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="text-violet-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {selectedTab === 'active' && (
            <div className="space-y-3">
              {boundVestiges.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800 text-xs">
                  No vestiges currently bound. Open the Vestige Compendium tab to draw a ceremonial circle and summon a vestige!
                </div>
              ) : (
                <div className="space-y-3">
                  {boundVestiges.map(b => {
                    const def = DND35E_VESTIGES_COMPENDIUM.find(v => v.name === b.vestigeName);
                    if (!def) return null;

                    return (
                      <div
                        key={b.vestigeName}
                        className="p-4 bg-neutral-950/70 border border-violet-800/40 rounded-xl space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white">{def.name}</h3>
                              <span className="text-xs text-violet-300 italic">{def.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40 font-mono">
                                Binding DC {def.bindingDc}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRollPactCheck(def)}
                              className="px-2.5 py-1 bg-violet-950 hover:bg-violet-900 text-violet-200 border border-violet-700/60 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Dices className="w-3.5 h-3.5" /> Roll Check (1d20+{level + chaMod})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSuppressSign(b.vestigeName)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                                b.suppressSign
                                  ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                                  : 'bg-amber-950/70 border-amber-600/60 text-amber-200'
                              }`}
                            >
                              {b.suppressSign ? 'Sign Suppressed' : 'Sign Manifested'}
                            </button>
                          </div>
                        </div>

                        {/* Sign & Influence */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                            <span className="font-bold text-amber-300">Physical Sign:</span>
                            <p className="text-neutral-400 mt-0.5">{def.sign}</p>
                          </div>
                          <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                            <span className="font-bold text-purple-300">Roleplay Influence:</span>
                            <p className="text-neutral-400 mt-0.5">{def.influence}</p>
                          </div>
                        </div>

                        {/* Granted Abilities */}
                        <div>
                          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                            Granted Supernatural Abilities:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                            {def.grantedAbilities.map((ab, i) => (
                              <div
                                key={i}
                                className="p-2 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-200 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                <span>{ab}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'compendium' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 mb-2">
                Choose vestiges to summon and bind for 24 hours. You can bind up to <strong className="text-violet-300">{maxVestiges}</strong> vestige(s) at level {level}.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto pr-1">
                {DND35E_VESTIGES_COMPENDIUM.map(v => {
                  const isBound = boundVestiges.some(b => b.vestigeName === v.name);
                  return (
                    <div
                      key={v.name}
                      onClick={() => handleToggleBind(v)}
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-start justify-between gap-2 ${
                        isBound
                          ? 'bg-violet-950/50 border-violet-500 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{v.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                            Lvl {v.level} • DC {v.bindingDc}
                          </span>
                        </div>
                        <p className="text-[10px] text-violet-300/80 italic mt-0.5">{v.title}</p>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                          {v.sign}
                        </p>
                      </div>

                      <div className={`p-1 rounded ${isBound ? 'text-violet-400' : 'text-neutral-600'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Bound Vestiges: <strong className="text-violet-300 font-mono">{boundVestiges.length} / {maxVestiges}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition"
            >
              Save Vestige Pacts
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
