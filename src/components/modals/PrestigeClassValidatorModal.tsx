import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  OFFICIAL_35E_PRESTIGE_CLASSES,
  validateCharacterForPrestigeClass,
  PrestigeClassPrerequisite
} from '../../utils/dndCalculations';
import { Award, CheckCircle2, AlertCircle, X, Search, Shield, BookOpen, Star } from 'lucide-react';

interface PrestigeClassValidatorModalProps {
  isOpen: boolean;
  character: CharacterData;
  onClose: () => void;
}

export const PrestigeClassValidatorModal: React.FC<PrestigeClassValidatorModalProps> = ({
  isOpen,
  character,
  onClose
}) => {
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredClasses = OFFICIAL_35E_PRESTIGE_CLASSES.filter(pc =>
    pc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePrestige = filteredClasses[selectedClassIndex] || filteredClasses[0] || OFFICIAL_35E_PRESTIGE_CLASSES[0];
  const auditResult = validateCharacterForPrestigeClass(character, activePrestige);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-purple-600/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-stone-900 p-4 border-b border-purple-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-purple-200">Prestige Class Prerequisites Validator</h2>
              <p className="text-xs text-stone-400">Official D&D 3.5e Dungeon Master's Guide p. 176-200</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search prestige classes (e.g. Assassin, Dragon Disciple, Duelist)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedClassIndex(0);
            }}
            className="w-full bg-transparent text-xs text-stone-200 focus:outline-none"
          />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 overflow-hidden flex-1">
          {/* Class List */}
          <div className="border-r border-stone-800 overflow-y-auto max-h-[60vh] p-2 space-y-1 bg-stone-950/60">
            {filteredClasses.map((pc, idx) => {
              const res = validateCharacterForPrestigeClass(character, pc);
              const isSelected = activePrestige.name === pc.name;

              return (
                <button
                  key={pc.name}
                  type="button"
                  onClick={() => setSelectedClassIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-purple-100 shadow'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate">{pc.name}</div>
                    <div className="text-[10px] text-stone-500">{pc.source}</div>
                  </div>
                  {res.isQualified ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-full font-semibold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Met
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-full font-semibold shrink-0">
                      Unmet
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Class Details & Requirement Audit */}
          <div className="md:col-span-2 p-5 overflow-y-auto space-y-4 max-h-[60vh]">
            {/* Class Hero Header */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-black text-purple-200">{activePrestige.name}</h3>
                <span className="text-xs text-stone-400">{activePrestige.source}</span>
              </div>
              <div>
                {auditResult.isQualified ? (
                  <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>QUALIFIED TO ENTER</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-amber-950 border border-amber-600 rounded-xl text-amber-200 font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>PREREQUISITES UNMET</span>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist of RAW Requirements */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Prerequisites Audit Breakdown</span>
              </div>

              <div className="space-y-1.5">
                {auditResult.details.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      detail.startsWith('✅')
                        ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                        : detail.startsWith('❌')
                        ? 'bg-red-950/40 border-red-900/50 text-red-200'
                        : 'bg-stone-950 border-stone-800 text-stone-300'
                    }`}
                  >
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Character Snapshot Comparison */}
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Character Snapshot</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">Base Attack Bonus</span>
                  <span className="text-stone-200 font-bold">+{character.bab || character.baseAttackBonus || 0}</span>
                </div>
                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">Alignment</span>
                  <span className="text-stone-200 font-bold truncate">{character.alignment || 'Neutral'}</span>
                </div>
                <div className="bg-stone-900 p-2 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">Character Level</span>
                  <span className="text-stone-200 font-bold">{character.level || 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
