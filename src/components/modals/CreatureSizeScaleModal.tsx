import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  DND_35E_SIZE_SCALE_TABLE,
  SIZE_ORDER_35E,
  SIZE_SCALE_FOOTNOTES_35E,
  SizeCategory35e,
  ReachType35e,
  get35eSpaceAndReach
} from '../../utils/rules/sizeScaleRules35e';
import { X, Check, Shield, Swords, Sparkles, Footprints, AlertTriangle, Info, Maximize2 } from 'lucide-react';

interface CreatureSizeScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter?: (updated: CharacterData) => void;
  readOnly?: boolean;
}

export const CreatureSizeScaleModal: React.FC<CreatureSizeScaleModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter,
  readOnly = false
}) => {
  const currentSize = (character.sizeCategory || 'Medium') as SizeCategory35e;
  const currentReachType: ReachType35e = character.reachType || (character.isQuadruped ? 'Long' : 'Tall');
  
  const [selectedSize, setSelectedSize] = useState<SizeCategory35e>(currentSize);
  const [selectedReachType, setSelectedReachType] = useState<ReachType35e>(currentReachType);

  if (!isOpen) return null;

  const activeEntry = DND_35E_SIZE_SCALE_TABLE[selectedSize] || DND_35E_SIZE_SCALE_TABLE.Medium;
  const activeSpaceReach = get35eSpaceAndReach(selectedSize, selectedReachType);

  const handleApplySize = (size: SizeCategory35e, reach: ReachType35e = selectedReachType) => {
    if (readOnly || !onUpdateCharacter) return;
    onUpdateCharacter({
      ...character,
      sizeCategory: size,
      reachType: reach,
      isQuadruped: reach === 'Long'
    });
  };

  const handleToggleReachType = (reach: ReachType35e) => {
    setSelectedReachType(reach);
    if (!readOnly && onUpdateCharacter) {
      onUpdateCharacter({
        ...character,
        reachType: reach,
        isQuadruped: reach === 'Long'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-stone-950 border-2 border-amber-600/60 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border-b border-amber-600/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-600/20 border border-amber-500/50 rounded-lg text-amber-300">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black text-amber-200 tracking-wide">
                Table: Creature Size and Scale
              </h2>
              <p className="text-[11px] text-stone-400 font-sans">
                Official D&D 3.5e Dimensions, Combat Space, Reach & Tactical Size Modifiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Active Character Quick Status Bar */}
          <div className="bg-stone-900/90 border border-amber-600/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-stone-400 font-sans text-xs">Active Character:</span>
              <span className="font-serif font-bold text-amber-300 text-sm">
                {character.name || 'Hero'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                {character.sizeCategory || 'Medium'} Size
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                {currentReachType === 'Long' ? 'Quadruped / Long' : 'Biped / Tall'}
              </span>
            </div>

            {/* Stance Selector */}
            {!readOnly && (
              <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800 text-[11px]">
                <span className="text-stone-400 px-1 font-sans text-[10px] uppercase font-bold">Stance:</span>
                <button
                  type="button"
                  onClick={() => handleToggleReachType('Tall')}
                  className={`px-2 py-0.5 rounded transition font-bold cursor-pointer ${
                    selectedReachType === 'Tall'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Tall reach (Bipeds: Humans, Giants, Ogres)"
                >
                  Tall (Biped)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleReachType('Long')}
                  className={`px-2 py-0.5 rounded transition font-bold cursor-pointer ${
                    selectedReachType === 'Long'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Long reach (Quadrupeds & Serpentine: Horses, Wolves, Dragons, Centaurs)"
                >
                  Long (Quadruped)
                </button>
              </div>
            )}
          </div>

          {/* Selected Size Tactical Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Attack & AC Mod¹</span>
              <span className={`text-base font-serif font-extrabold ${activeEntry.sizeModifier > 0 ? 'text-emerald-400' : activeEntry.sizeModifier < 0 ? 'text-red-400' : 'text-stone-200'}`}>
                {activeEntry.sizeModifier > 0 ? `+${activeEntry.sizeModifier}` : activeEntry.sizeModifier}
              </span>
              <span className="text-[9px] text-stone-500 block">To Hit & Defenses</span>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Grapple Mod²</span>
              <span className={`text-base font-serif font-extrabold ${activeEntry.grappleModifier > 0 ? 'text-amber-300' : activeEntry.grappleModifier < 0 ? 'text-red-400' : 'text-stone-200'}`}>
                {activeEntry.grappleModifier > 0 ? `+${activeEntry.grappleModifier}` : activeEntry.grappleModifier}
              </span>
              <span className="text-[9px] text-stone-500 block">Grapple & Bull Rush</span>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Hide Mod³</span>
              <span className={`text-base font-serif font-extrabold ${activeEntry.hideModifier > 0 ? 'text-emerald-400' : activeEntry.hideModifier < 0 ? 'text-red-400' : 'text-stone-200'}`}>
                {activeEntry.hideModifier > 0 ? `+${activeEntry.hideModifier}` : activeEntry.hideModifier}
              </span>
              <span className="text-[9px] text-stone-500 block">Stealth Checks</span>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Combat Space⁶</span>
              <span className="text-base font-serif font-extrabold text-sky-300">
                {activeSpaceReach.spaceDisplay}
              </span>
              <span className="text-[9px] text-stone-500 block">Grid Footprint</span>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Natural Reach⁶</span>
              <span className={`text-base font-serif font-extrabold ${activeSpaceReach.isZeroReach ? 'text-amber-400' : 'text-purple-300'}`}>
                {activeSpaceReach.reachDisplay}
              </span>
              <span className="text-[9px] text-stone-500 block">
                {selectedReachType === 'Long' ? 'Long Reach' : 'Tall Reach'}
              </span>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 text-center col-span-2 sm:col-span-2">
              <span className="text-[10px] text-stone-400 block font-bold uppercase">Height / Weight⁴,⁵</span>
              <span className="text-xs font-mono text-stone-200 block truncate" title={activeEntry.heightOrLength}>
                {activeEntry.heightOrLength}
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono block truncate" title={activeEntry.weight}>
                {activeEntry.weight}
              </span>
            </div>
          </div>

          {/* Zero Reach Alert if applicable */}
          {activeSpaceReach.isZeroReach && (
            <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3 flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">0 ft. Natural Reach Rule (3.5e RAW)</span>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Creatures with a natural reach of 0 ft. (Fine, Diminutive, and Tiny) do not threaten squares around them. They cannot make standard Attacks of Opportunity and must move into an opponent&apos;s square to attack, which provokes an Attack of Opportunity from the defender!
                </p>
              </div>
            </div>
          )}

          {/* The Exact Table from D&D 3.5e (Mirroring Screenshot) */}
          <div className="overflow-x-auto rounded-xl border border-amber-700/40 shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-amber-900/90 via-amber-950 to-stone-900 text-amber-200 font-serif border-b border-amber-600/40 text-xs">
                  <th className="py-2.5 px-3 font-bold border-r border-amber-800/30">Size Category</th>
                  <th className="py-2.5 px-2.5 font-bold text-center border-r border-amber-800/30">Size¹ Modifier</th>
                  <th className="py-2.5 px-2.5 font-bold text-center border-r border-amber-800/30">Grapple² Modifier</th>
                  <th className="py-2.5 px-2.5 font-bold text-center border-r border-amber-800/30">Hide³ Modifier</th>
                  <th className="py-2.5 px-3 font-bold border-r border-amber-800/30">Height or Length⁴</th>
                  <th className="py-2.5 px-3 font-bold border-r border-amber-800/30">Weight⁵</th>
                  <th className="py-2.5 px-2.5 font-bold text-center border-r border-amber-800/30">Space⁶</th>
                  <th className="py-2.5 px-2.5 font-bold text-center border-r border-amber-800/30">Natural Reach⁶ (Tall)</th>
                  <th className="py-2.5 px-2.5 font-bold text-center">Natural Reach⁶ (Long)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans text-xs">
                {SIZE_ORDER_35E.map((sizeKey) => {
                  const row = DND_35E_SIZE_SCALE_TABLE[sizeKey];
                  const isCurrent = (character.sizeCategory || 'Medium') === sizeKey;
                  const isSelected = selectedSize === sizeKey;

                  return (
                    <tr
                      key={sizeKey}
                      onClick={() => {
                        setSelectedSize(sizeKey);
                        if (!readOnly) handleApplySize(sizeKey);
                      }}
                      className={`transition cursor-pointer group ${
                        isSelected
                          ? 'bg-amber-950/60 font-medium text-amber-100 border-l-4 border-l-amber-500'
                          : isCurrent
                          ? 'bg-stone-900/90 text-amber-200/90 hover:bg-stone-850'
                          : 'bg-stone-950/90 text-stone-300 hover:bg-stone-900/60'
                      }`}
                    >
                      {/* Size Category */}
                      <td className="py-2 px-3 border-r border-stone-800/60 font-serif font-bold flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          {row.sizeCategory}
                          {isCurrent && (
                            <span className="text-[9px] font-sans font-black bg-amber-500 text-black px-1.5 py-0.2 rounded uppercase">
                              Active
                            </span>
                          )}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplySize(sizeKey);
                              setSelectedSize(sizeKey);
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded transition ${
                              isCurrent
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                                : 'bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCurrent ? 'Selected' : 'Select'}
                          </button>
                        )}
                      </td>

                      {/* Size Modifier */}
                      <td className={`py-2 px-2.5 text-center font-mono font-bold border-r border-stone-800/60 ${
                        row.sizeModifier > 0 ? 'text-emerald-400' : row.sizeModifier < 0 ? 'text-red-400' : 'text-stone-400'
                      }`}>
                        {row.sizeModifier > 0 ? `+${row.sizeModifier}` : row.sizeModifier}
                      </td>

                      {/* Grapple Modifier */}
                      <td className={`py-2 px-2.5 text-center font-mono font-bold border-r border-stone-800/60 ${
                        row.grappleModifier > 0 ? 'text-amber-300' : row.grappleModifier < 0 ? 'text-red-400' : 'text-stone-400'
                      }`}>
                        {row.grappleModifier > 0 ? `+${row.grappleModifier}` : row.grappleModifier}
                      </td>

                      {/* Hide Modifier */}
                      <td className={`py-2 px-2.5 text-center font-mono font-bold border-r border-stone-800/60 ${
                        row.hideModifier > 0 ? 'text-emerald-400' : row.hideModifier < 0 ? 'text-red-400' : 'text-stone-400'
                      }`}>
                        {row.hideModifier > 0 ? `+${row.hideModifier}` : row.hideModifier}
                      </td>

                      {/* Height or Length */}
                      <td className="py-2 px-3 font-mono text-stone-300 border-r border-stone-800/60 whitespace-nowrap">
                        {row.heightOrLength}
                      </td>

                      {/* Weight */}
                      <td className="py-2 px-3 font-mono text-stone-300 border-r border-stone-800/60 whitespace-nowrap">
                        {row.weight}
                      </td>

                      {/* Space */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-sky-300 border-r border-stone-800/60">
                        {row.spaceDisplay}
                      </td>

                      {/* Natural Reach (Tall) */}
                      <td className={`py-2 px-2.5 text-center font-mono font-bold border-r border-stone-800/60 ${
                        row.naturalReachTallFt === 0 ? 'text-amber-400' : 'text-purple-300'
                      }`}>
                        {row.naturalReachTallFt} ft.
                      </td>

                      {/* Natural Reach (Long) */}
                      <td className={`py-2 px-2.5 text-center font-mono font-bold ${
                        row.naturalReachLongFt === 0 ? 'text-amber-400' : 'text-purple-300'
                      }`}>
                        {row.naturalReachLongFt} ft.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footnotes Section (Exact text from screenshot) */}
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2 text-stone-400">
            <h4 className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Table Footnotes & Core Rules
            </h4>
            <ol className="list-none space-y-1.5 text-[11px] leading-relaxed">
              {SIZE_SCALE_FOOTNOTES_35E.map((fn) => (
                <li key={fn.number} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-amber-400 shrink-0">{fn.number}.</span>
                  <span>
                    <strong className="text-stone-200">{fn.title}:</strong> {fn.description}
                  </span>
                </li>
              ))}
            </ol>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-stone-900 border-t border-stone-800">
          <div className="text-[11px] text-stone-400 font-mono">
            Current: <strong className="text-amber-300">{character.sizeCategory || 'Medium'}</strong> ({currentReachType})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition text-xs shadow-md"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
