import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  getWarlockBlastDice,
  getDragonfireBreathDice,
  DND35E_WARLOCK_INVOCATIONS,
  InvocationDefinition
} from '../../utils/calculators/supplemental35eCalculators';
import { Sparkles, Flame, Zap, Shield, X, CheckCircle2, ChevronRight, Dices, Info, BookOpen } from 'lucide-react';
import { getCombinedLevel } from '../../utils/dndCalculations';

interface WarlockInvocations35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number) => void;
}

export const WarlockInvocations35eModal: React.FC<WarlockInvocations35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const level = getCombinedLevel(character);
  const isDragonfire = (character.characterClass || '').toLowerCase().includes('dragonfire');
  const baseDice = isDragonfire ? getDragonfireBreathDice(level) : getWarlockBlastDice(level);

  const existingState = character.warlockInvocations35e || {
    knownInvocations: [],
    activeBlastShape: '',
    activeEldritchEssence: '',
    bonusBlastDice: 0
  };

  const [knownInvocations, setKnownInvocations] = useState<string[]>(existingState.knownInvocations || []);
  const [activeShape, setActiveShape] = useState<string>(existingState.activeBlastShape || '');
  const [activeEssence, setActiveEssence] = useState<string>(existingState.activeEldritchEssence || '');
  const [selectedGrade, setSelectedGrade] = useState<'All' | 'Least' | 'Lesser' | 'Greater' | 'Dark'>('All');
  const [filterQuery, setFilterQuery] = useState('');
  const [blastNotice, setBlastNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalDice = baseDice + (existingState.bonusBlastDice || 0);

  const handleToggleInvocation = (invName: string) => {
    setKnownInvocations(prev =>
      prev.includes(invName) ? prev.filter(n => n !== invName) : [...prev, invName]
    );
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      warlockInvocations35e: {
        ...existingState,
        knownInvocations,
        activeBlastShape: activeShape,
        activeEldritchEssence: activeEssence
      }
    });
    onClose();
  };

  const handleRollBlast = () => {
    let label = isDragonfire ? `Dragonfire Breath (${totalDice}d6)` : `Eldritch Blast (${totalDice}d6)`;
    if (activeShape) label += ` [Shape: ${activeShape}]`;
    if (activeEssence) label += ` [Essence: ${activeEssence}]`;

    if (onRoll) {
      onRoll(label, 6, totalDice, 0);
    } else {
      let sum = 0;
      const rolls: number[] = [];
      for (let i = 0; i < totalDice; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        sum += roll;
      }
      setBlastNotice(`💥 ${label}: Rolled [${rolls.join(', ')}] = ${sum} Damage!`);
    }
  };

  const blastShapes = DND35E_WARLOCK_INVOCATIONS.filter(i => i.type === 'Blast Shape');
  const eldritchEssences = DND35E_WARLOCK_INVOCATIONS.filter(i => i.type === 'Eldritch Essence');

  const filteredInvocations = DND35E_WARLOCK_INVOCATIONS.filter(inv => {
    if (selectedGrade !== 'All' && inv.grade !== selectedGrade) return false;
    if (filterQuery) {
      const match = inv.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        inv.description.toLowerCase().includes(filterQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-purple-500/40 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/60 border border-purple-600/40 rounded-lg text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isDragonfire ? 'Dragonfire Adept: Breath & Invocations' : 'Warlock: Eldritch Blast & Invocations Suite'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50 font-mono">
                  D&D 3.5e
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                At-will invocations, supernatural blast shaping, and eldritch essence modifiers
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {blastNotice && (
            <div className="p-3 bg-purple-950/80 border border-purple-500/60 rounded-xl text-purple-200 text-xs flex items-center justify-between animate-fadeIn">
              <span>{blastNotice}</span>
              <button
                type="button"
                onClick={() => setBlastNotice(null)}
                className="text-purple-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Row: Eldritch Blast Calculator & Tactical Modifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Blast Power Card */}
            <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-purple-400" />
                  {isDragonfire ? 'Breath Weapon Damage' : 'Eldritch Blast Damage'}
                </div>
                <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {totalDice}d6
                </div>
                <div className="text-xs text-purple-200/70 mt-1">
                  Base: {baseDice}d6 (Level {level}) {existingState.bonusBlastDice ? `+ ${existingState.bonusBlastDice}d6 bonus` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRollBlast}
                className="mt-3 w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition active:scale-95"
              >
                <Dices className="w-4 h-4" /> Roll {totalDice}d6 Blast
              </button>
            </div>

            {/* Active Blast Shape */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Active Blast Shape
              </div>
              <select
                value={activeShape}
                onChange={e => setActiveShape(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Standard Ray (60 ft, Single Target)</option>
                {blastShapes.map(shape => (
                  <option key={shape.name} value={shape.name}>
                    {shape.name} ({shape.grade})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 mt-2 flex-1">
                {activeShape
                  ? blastShapes.find(s => s.name === activeShape)?.description
                  : 'Fires as an at-will ranged touch attack up to 60 ft dealing pure eldritch energy.'}
              </p>
            </div>

            {/* Active Eldritch Essence */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex flex-col">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Active Eldritch Essence
              </div>
              <select
                value={activeEssence}
                onChange={e => setActiveEssence(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">None (Pure Eldritch Force)</option>
                {eldritchEssences.map(ess => (
                  <option key={ess.name} value={ess.name}>
                    {ess.name} ({ess.grade})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 mt-2 flex-1">
                {activeEssence
                  ? eldritchEssences.find(e => e.name === activeEssence)?.description
                  : 'Infuses your blast with supernatural riders, debilitating debuffs, or energy types.'}
              </p>
            </div>
          </div>

          {/* Known Invocations Selector */}
          <div className="bg-neutral-950/50 border border-neutral-800 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" /> Invocations Catalog
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40">
                    {knownInvocations.length} Selected
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Select invocations your character has mastered. Invocations can be used at-will without spell slots.
                </p>
              </div>

              {/* Grade Filter Tabs */}
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
                {(['All', 'Least', 'Lesser', 'Greater', 'Dark'] as const).map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-2.5 py-1 rounded transition ${
                      selectedGrade === grade
                        ? 'bg-purple-700 text-white font-bold shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Invocations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {filteredInvocations.map(inv => {
                const isKnown = knownInvocations.includes(inv.name);
                return (
                  <div
                    key={inv.name}
                    onClick={() => handleToggleInvocation(inv.name)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start justify-between gap-2 ${
                      isKnown
                        ? 'bg-purple-950/40 border-purple-500/70 text-purple-100 shadow-sm'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{inv.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          inv.grade === 'Least' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' :
                          inv.grade === 'Lesser' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50' :
                          inv.grade === 'Greater' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                          'bg-red-950 text-red-300 border border-red-800/50'
                        }`}>
                          {inv.grade}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {inv.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        {inv.description}
                      </p>
                    </div>

                    <div className={`mt-0.5 p-1 rounded-full ${isKnown ? 'bg-purple-600 text-white' : 'text-neutral-600'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            Selected Invocations: <span className="text-purple-300 font-bold">{knownInvocations.length}</span>
          </div>
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
              className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition shadow-lg shadow-purple-900/40"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
