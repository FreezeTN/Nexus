import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eClericStats,
  OFFICIAL_35E_CLERIC_DOMAINS,
  Dnd35eClericBreakdown
} from '../../utils/calculators/classFeatures35eCalculators';
import {
  Sun,
  Sparkles,
  Shield,
  Heart,
  Flame,
  Zap,
  BookOpen,
  X,
  Check,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface ClericDomains35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export const ClericDomains35eModal: React.FC<ClericDomains35eModalProps> = ({
  isOpen,
  character,
  onClose,
  onUpdateCharacter,
  onRoll
}) => {
  const clericStats: Dnd35eClericBreakdown = calculate35eClericStats(character);

  const [selectedDomain1, setSelectedDomain1] = useState<string>(clericStats.domain1 || 'Healing');
  const [selectedDomain2, setSelectedDomain2] = useState<string>(clericStats.domain2 || 'Good');
  const [deityName, setDeityName] = useState<string>(character.clericData35e?.deity || character.deity || '');
  const [alignmentAura, setAlignmentAura] = useState<string>(clericStats.alignmentAura || character.alignment || 'Lawful Good');
  const [spontaneousMode, setSpontaneousMode] = useState<'cure' | 'inflict'>(clericStats.spontaneousCastingMode || 'cure');
  const [activeTab, setActiveTab] = useState<'domains' | 'powers' | 'spontaneous'>('domains');

  if (!isOpen) return null;

  const domain1Details = OFFICIAL_35E_CLERIC_DOMAINS[selectedDomain1];
  const domain2Details = OFFICIAL_35E_CLERIC_DOMAINS[selectedDomain2];

  const handleSaveConfiguration = () => {
    if (!onUpdateCharacter) return;

    const updated: CharacterData = {
      ...character,
      deity: deityName,
      clericData35e: {
        ...character.clericData35e,
        deity: deityName,
        alignmentAura,
        domain1: selectedDomain1,
        domain2: selectedDomain2,
        spontaneousCastingMode: spontaneousMode
      }
    };

    onUpdateCharacter(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-amber-600/60 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-900 p-4 border-b border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 shadow-sm">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-black text-amber-200">
                  Cleric Divine Domains & Spontaneous Casting
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-600 rounded-full font-mono font-bold">
                  Level {clericStats.clericLevel} Cleric
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Official D&D 3.5e Player's Handbook p. 30-33 — Two Domains, Granted Powers & Cure/Inflict conversion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`pb-2 px-3 border-b-2 font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'domains'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Choose Domains
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`pb-2 px-3 border-b-2 font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'powers'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Granted Powers & Spells
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spontaneous')}
            className={`pb-2 px-3 border-b-2 font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'spontaneous'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Spontaneous Conversion Mode
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto font-sans flex-1">
          {activeTab === 'domains' && (
            <div className="space-y-4">
              {/* Deity & Alignment Aura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs">
                <div>
                  <label className="block text-stone-400 font-bold uppercase text-[10px] mb-1">
                    Patron Deity
                  </label>
                  <input
                    type="text"
                    value={deityName}
                    onChange={(e) => setDeityName(e.target.value)}
                    placeholder="e.g. Pelor, Moradin, St. Cuthbert, Boccob"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 font-bold uppercase text-[10px] mb-1">
                    Divine Alignment Aura (PHB p. 32)
                  </label>
                  <input
                    type="text"
                    value={alignmentAura}
                    onChange={(e) => setAlignmentAura(e.target.value)}
                    placeholder="e.g. Lawful Good Aura (Overwhelming)"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Domain Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Domain 1 Selector */}
                <div className="bg-stone-950 p-3 rounded-xl border border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Primary Domain
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                      {selectedDomain1}
                    </span>
                  </div>

                  <select
                    value={selectedDomain1}
                    onChange={(e) => setSelectedDomain1(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Object.keys(OFFICIAL_35E_CLERIC_DOMAINS).map((d) => (
                      <option key={d} value={d}>
                        {d} Domain
                      </option>
                    ))}
                  </select>

                  {domain1Details && (
                    <div className="text-[11px] text-stone-400 mt-2 p-2 bg-stone-900/60 rounded-lg border border-stone-800/80">
                      <strong className="text-amber-300 block mb-1">Granted Power:</strong>
                      {domain1Details.grantedPower}
                    </div>
                  )}
                </div>

                {/* Domain 2 Selector */}
                <div className="bg-stone-950 p-3 rounded-xl border border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Secondary Domain
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                      {selectedDomain2}
                    </span>
                  </div>

                  <select
                    value={selectedDomain2}
                    onChange={(e) => setSelectedDomain2(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Object.keys(OFFICIAL_35E_CLERIC_DOMAINS).map((d) => (
                      <option key={d} value={d}>
                        {d} Domain
                      </option>
                    ))}
                  </select>

                  {domain2Details && (
                    <div className="text-[11px] text-stone-400 mt-2 p-2 bg-stone-900/60 rounded-lg border border-stone-800/80">
                      <strong className="text-amber-300 block mb-1">Granted Power:</strong>
                      {domain2Details.grantedPower}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'powers' && (
            <div className="space-y-4">
              {/* Detailed Breakdown for Domain 1 */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-200 font-serif">
                    {selectedDomain1} Domain Spell Suite
                  </h3>
                </div>
                <div className="text-xs text-stone-300 bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                  <strong className="text-amber-300">Granted Power: </strong>
                  {domain1Details?.grantedPower}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Domain Spells by Level:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                    {domain1Details?.domainSpells.map((sp, idx) => (
                      <div key={sp} className="bg-stone-900 px-2.5 py-1 rounded border border-stone-800 flex items-center justify-between">
                        <span className="text-stone-300">{sp}</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lvl {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown for Domain 2 */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-200 font-serif">
                    {selectedDomain2} Domain Spell Suite
                  </h3>
                </div>
                <div className="text-xs text-stone-300 bg-stone-900/70 p-2.5 rounded-lg border border-stone-800">
                  <strong className="text-amber-300">Granted Power: </strong>
                  {domain2Details?.grantedPower}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Domain Spells by Level:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                    {domain2Details?.domainSpells.map((sp, idx) => (
                      <div key={sp} className="bg-stone-900 px-2.5 py-1 rounded border border-stone-800 flex items-center justify-between">
                        <span className="text-stone-300">{sp}</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lvl {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spontaneous' && (
            <div className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wide flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  Spontaneous Casting Conversion Mode (PHB p. 32)
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  A good cleric (or a neutral cleric of a good deity) can channel stored spell energy into healing spells that the cleric did not prepare ahead of time. The cleric can "lose" any prepared spell in order to cast any cure spell of the same spell level or lower. An evil cleric converts into inflict spells instead.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSpontaneousMode('cure')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      spontaneousMode === 'cure'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Cure Spells (Good / Neutral Cleric)</span>
                      {spontaneousMode === 'cure' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] opacity-80 font-mono">
                      Spontaneously converts any prepared slot into Cure Wounds
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpontaneousMode('inflict')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      spontaneousMode === 'inflict'
                        ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Inflict Spells (Evil / Negative Energy)</span>
                      {spontaneousMode === 'inflict' && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <span className="text-[11px] opacity-80 font-mono">
                      Spontaneously converts any prepared slot into Inflict Wounds
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 font-mono">
            Domains: <strong className="text-amber-300">{selectedDomain1}</strong> & <strong className="text-amber-300">{selectedDomain2}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveConfiguration}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Domains
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
