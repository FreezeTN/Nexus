import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getInitiatorLevel,
  getCrusaderSteelyResolve,
  getCrusaderFuriousCounterstrikeBonus,
  DND35E_TOME_OF_BATTLE_MANEUVERS,
  MartialManeuverDefinition
} from '../../utils/calculators/supplemental35eCalculators';
import { Sword, Shield, RotateCcw, Zap, Sparkles, X, CheckCircle2, ChevronRight, Dices, Shuffle, Flame, Heart } from 'lucide-react';
import { getCombinedLevel } from '../../utils/dndCalculations';

interface TomeOfBattle35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number) => void;
}

export const TomeOfBattle35eModal: React.FC<TomeOfBattle35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const level = getCombinedLevel(character);
  const clsLower = (character.characterClass || '').toLowerCase();
  const isCrusader = clsLower.includes('crusader');
  const isWarblade = clsLower.includes('warblade');
  const isSwordsage = clsLower.includes('swordsage');

  const initiatorLevel = getInitiatorLevel(level);

  const existingState = character.tomeOfBattle35e || {
    knownManeuvers: ['Crusader’s Strike', 'Martial Spirit', 'Steely Strike'],
    readiedManeuvers: ['Crusader’s Strike', 'Steely Strike'],
    expendedManeuvers: [],
    grantedManeuvers: ['Crusader’s Strike'],
    activeStance: 'Martial Spirit',
    steelyResolveDamage: 0
  };

  const [knownManeuvers, setKnownManeuvers] = useState<string[]>(existingState.knownManeuvers || []);
  const [readiedManeuvers, setReadiedManeuvers] = useState<string[]>(existingState.readiedManeuvers || []);
  const [expendedManeuvers, setExpendedManeuvers] = useState<string[]>(existingState.expendedManeuvers || []);
  const [grantedManeuvers, setGrantedManeuvers] = useState<string[]>(existingState.grantedManeuvers || []);
  const [activeStance, setActiveStance] = useState<string>(existingState.activeStance || '');
  const [steelyDamage, setSteelyDamage] = useState<number>(existingState.steelyResolveDamage || 0);
  const [selectedTab, setSelectedTab] = useState<'readied' | 'catalog' | 'steely'>('readied');
  const [actionLog, setActionLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const steelyMax = getCrusaderSteelyResolve(level);
  const furiousBonus = getCrusaderFuriousCounterstrikeBonus(steelyDamage);

  const stances = DND35E_TOME_OF_BATTLE_MANEUVERS.filter(m => m.type === 'Stance');

  const handleToggleKnown = (name: string) => {
    setKnownManeuvers(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const handleToggleReadied = (name: string) => {
    setReadiedManeuvers(prev => {
      if (prev.includes(name)) {
        return prev.filter(m => m !== name);
      }
      return [...prev, name];
    });
  };

  const handleToggleExpended = (name: string) => {
    setExpendedManeuvers(prev => {
      if (prev.includes(name)) {
        return prev.filter(m => m !== name);
      }
      return [...prev, name];
    });
  };

  const handleSaveState = () => {
    onUpdateCharacter({
      ...character,
      tomeOfBattle35e: {
        ...existingState,
        knownManeuvers,
        readiedManeuvers,
        expendedManeuvers,
        grantedManeuvers,
        activeStance,
        steelyResolveDamage: steelyDamage
      }
    });
    onClose();
  };

  // Crusader Granted Maneuver Draw
  const handleCrusaderDraw = () => {
    const ungranted = readiedManeuvers.filter(m => !grantedManeuvers.includes(m));
    if (ungranted.length === 0) {
      // Reshuffle!
      const initialTwo = [...readiedManeuvers].sort(() => 0.5 - Math.random()).slice(0, 2);
      setGrantedManeuvers(initialTwo);
      setExpendedManeuvers([]);
      setActionLog(`🔀 Crusader deck empty! All maneuvers reshuffled. Newly granted: ${initialTwo.join(', ')}`);
    } else {
      const drawn = ungranted[Math.floor(Math.random() * ungranted.length)];
      setGrantedManeuvers([...grantedManeuvers, drawn]);
      setActionLog(`⚔️ Crusader inspiration grants: "${drawn}"!`);
    }
  };

  // Warblade Flourish Recovery
  const handleWarbladeFlourish = () => {
    setExpendedManeuvers([]);
    setActionLog('⚡ Warblade Flourish: All readied maneuvers refreshed and ready for combat!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-red-500/40 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/60 border border-red-600/40 rounded-lg text-red-400">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Tome of Battle: The Sublime Way
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-700/50 font-mono">
                  Initiator Lvl {initiatorLevel}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Martial maneuvers, stances, dynamic combat recovery, and Steely Resolve
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
            onClick={() => setSelectedTab('readied')}
            className={`px-3 py-2 border-b-2 font-bold transition flex items-center gap-1.5 ${
              selectedTab === 'readied'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sword className="w-3.5 h-3.5" /> Readied Maneuvers ({readiedManeuvers.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('catalog')}
            className={`px-3 py-2 border-b-2 font-bold transition flex items-center gap-1.5 ${
              selectedTab === 'catalog'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Maneuver Catalog
          </button>
          {isCrusader && (
            <button
              type="button"
              onClick={() => setSelectedTab('steely')}
              className={`px-3 py-2 border-b-2 font-bold transition flex items-center gap-1.5 ${
                selectedTab === 'steely'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Steely Resolve ({steelyDamage}/{steelyMax})
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {actionLog && (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{actionLog}</span>
              <button
                type="button"
                onClick={() => setActionLog(null)}
                className="text-red-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Stance Bar */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Active Stance:</span>
              <select
                value={activeStance}
                onChange={e => setActiveStance(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
              >
                <option value="">No Active Stance</option>
                {stances.map(s => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.discipline})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Recovery Button */}
            {isCrusader ? (
              <button
                type="button"
                onClick={handleCrusaderDraw}
                className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Shuffle className="w-3.5 h-3.5" /> Draw Next Granted Maneuver
              </button>
            ) : isWarblade ? (
              <button
                type="button"
                onClick={handleWarbladeFlourish}
                className="px-3 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700/60 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Flourish & Reset Maneuvers
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExpendedManeuvers([])}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refresh All Readied
              </button>
            )}
          </div>

          {selectedTab === 'readied' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Click a maneuver to toggle between <strong>Ready</strong> and <strong>Expended</strong>.</span>
                <span>{readiedManeuvers.length - expendedManeuvers.length} Available / {readiedManeuvers.length} Readied</span>
              </div>

              {readiedManeuvers.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800 text-xs">
                  No maneuvers currently readied. Open the Maneuver Catalog tab to ready maneuvers for encounter!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {readiedManeuvers.map(name => {
                    const def = DND35E_TOME_OF_BATTLE_MANEUVERS.find(m => m.name === name);
                    const isExpended = expendedManeuvers.includes(name);
                    const isGranted = !isCrusader || grantedManeuvers.includes(name);

                    return (
                      <div
                        key={name}
                        onClick={() => handleToggleExpended(name)}
                        className={`p-3 rounded-lg border cursor-pointer transition flex items-start justify-between gap-2 ${
                          isExpended
                            ? 'bg-neutral-950/70 border-neutral-800 text-neutral-500 opacity-60'
                            : isGranted
                            ? 'bg-red-950/30 border-red-700/60 text-white shadow-sm'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{name}</span>
                            {def && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                                {def.discipline}
                              </span>
                            )}
                            {isCrusader && isGranted && !isExpended && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono">
                                Granted
                              </span>
                            )}
                          </div>
                          {def && (
                            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                              {def.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            isExpended
                              ? 'bg-neutral-800 text-neutral-500'
                              : 'bg-red-700 text-white shadow'
                          }`}>
                            {isExpended ? 'Expended' : 'Ready'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'catalog' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 mb-2">
                Browse Sublime Way maneuvers. Toggle checkboxes to ready or unready for combat encounters.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                {DND35E_TOME_OF_BATTLE_MANEUVERS.map(m => {
                  const isReadied = readiedManeuvers.includes(m.name);
                  return (
                    <div
                      key={m.name}
                      onClick={() => handleToggleReadied(m.name)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start justify-between gap-2 ${
                        isReadied
                          ? 'bg-red-950/40 border-red-600/70 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{m.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                            {m.discipline} Lvl {m.level}
                          </span>
                          <span className="text-[10px] text-neutral-400">{m.type}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                      <div className={`p-1 rounded ${isReadied ? 'text-red-400' : 'text-neutral-600'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === 'steely' && (
            <div className="space-y-4 p-2">
              <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Steely Resolve Delayed Damage Pool
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white font-mono">{steelyDamage}</span>
                    <span className="text-neutral-400 text-sm font-semibold">/ {steelyMax} Max Stored</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Damage entering the pool is delayed until the end of your next turn.
                  </p>
                </div>

                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-center">
                  <div className="text-xs text-red-300 font-bold uppercase">Furious Counterstrike Bonus</div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                    +{furiousBonus} Attack & Damage
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSteelyDamage(Math.min(steelyMax, steelyDamage + 5))}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg text-white transition"
                >
                  +5 Damage to Pool
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionLog(`💥 Stored damage (${steelyDamage} HP) applied to character!`);
                    setSteelyDamage(0);
                  }}
                  className="px-3 py-2 bg-amber-900/80 hover:bg-amber-800 text-xs font-bold rounded-lg text-amber-100 transition"
                >
                  Empty Pool (End of Turn Resolution)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Readied: <strong className="text-red-300 font-mono">{readiedManeuvers.length}</strong>
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
              onClick={handleSaveState}
              className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition"
            >
              Save Stances & Maneuvers
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
