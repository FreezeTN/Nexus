import React from 'react';
import { Users, GitFork, Dna, Layers, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface RaceClassificationSelectorProps {
  raceType: 'standalone' | 'halfbreed';
  templateCategory: 'Inherited Cross-Breed' | 'Acquired Template' | 'Hybrid Lineage' | 'Monstrous Heritage';
  compatibleBaseRaces: string;
  levelAdjustment: number;
  inheritedTraitsSummary: string;
  onChangeRaceType: (type: 'standalone' | 'halfbreed') => void;
  onChangeCategory: (cat: 'Inherited Cross-Breed' | 'Acquired Template' | 'Hybrid Lineage' | 'Monstrous Heritage') => void;
  onChangeCompatible: (val: string) => void;
  onChangeLA: (val: number) => void;
  onChangeInherited: (val: string) => void;
  onOpenHybridModal?: () => void;
}

export const RaceClassificationSelector: React.FC<RaceClassificationSelectorProps> = ({
  raceType,
  templateCategory,
  compatibleBaseRaces,
  levelAdjustment,
  inheritedTraitsSummary,
  onChangeRaceType,
  onChangeCategory,
  onChangeCompatible,
  onChangeLA,
  onChangeInherited,
  onOpenHybridModal
}) => {
  return (
    <div className="bg-stone-950/90 border border-indigo-900/60 p-3.5 rounded-2xl space-y-3 shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/30 text-indigo-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
              Race Classification & Structural Type
            </h5>
            <p className="text-[11px] text-stone-400">
              Select whether this race is forged as an independent base race or as a Half-Breed / Inherited Template.
            </p>
          </div>
        </div>

        {onOpenHybridModal && (
          <button
            type="button"
            onClick={onOpenHybridModal}
            className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 rounded-xl text-indigo-300 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Open Lineage Blender to crossbreed SRD or custom parent races"
          >
            <GitFork className="w-3 h-3 text-indigo-400" />
            <span>Hybrid Lineage Blender</span>
          </button>
        )}
      </div>

      {/* Primary Toggle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Stand-Alone Option */}
        <button
          type="button"
          onClick={() => onChangeRaceType('standalone')}
          className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
            raceType === 'standalone'
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-md ring-1 ring-emerald-500/50'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          }`}
        >
          <div
            className={`p-2 rounded-lg shrink-0 ${
              raceType === 'standalone' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-500'
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>Stand-Alone Race</span>
              {raceType === 'standalone' && (
                <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.2 rounded-full font-mono uppercase font-black">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 leading-tight">
              A self-contained primary race (e.g. Elf, Dwarf, Human, Tiefling) with its own base stats, speeds, and biology.
            </div>
          </div>
        </button>

        {/* Half-Breed Template Option */}
        <button
          type="button"
          onClick={() => onChangeRaceType('halfbreed')}
          className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
            raceType === 'halfbreed'
              ? 'bg-indigo-950/50 border-indigo-500 text-indigo-100 shadow-md ring-1 ring-indigo-500/50'
              : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          }`}
        >
          <div
            className={`p-2 rounded-lg shrink-0 ${
              raceType === 'halfbreed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-stone-800 text-stone-500'
            }`}
          >
            <GitFork className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>Half-Breed Template</span>
              {raceType === 'halfbreed' && (
                <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-mono uppercase font-black">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-400 leading-tight">
              An inherited or hybrid template (e.g. Half-Dragon, Half-Fiend, Half-Elf, Lycanthrope) applied over a base creature.
            </div>
          </div>
        </button>
      </div>

      {/* Half-Breed Template Configuration Details */}
      {raceType === 'halfbreed' && (
        <div className="pt-2 border-t border-indigo-900/50 space-y-3 bg-indigo-950/20 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Template Specifications & Inheritance Rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-indigo-300 mb-1">Template Category</label>
              <select
                value={templateCategory}
                onChange={(e) => onChangeCategory(e.target.value as any)}
                className="w-full bg-stone-950 border border-indigo-800/60 rounded-xl p-2 text-stone-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Inherited Cross-Breed">Inherited Cross-Breed (e.g. Half-Elf, Half-Orc)</option>
                <option value="Hybrid Lineage">Hybrid Lineage (e.g. Half-Dragon, Half-Celestial)</option>
                <option value="Acquired Template">Acquired Template (e.g. Lycanthrope, Vampire)</option>
                <option value="Monstrous Heritage">Monstrous Heritage (e.g. Half-Ogre, Half-Troll)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-indigo-300 mb-1">Compatible Base Creatures</label>
              <input
                type="text"
                value={compatibleBaseRaces}
                onChange={(e) => onChangeCompatible(e.target.value)}
                placeholder="e.g. Any humanoid or monstrous humanoid"
                className="w-full bg-stone-950 border border-indigo-800/60 rounded-xl p-2 text-stone-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-indigo-300 mb-1" title="Level Adjustment for 3.5e or powerful 5e heritages">
                Level Adjustment (LA)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-mono text-xs">+</span>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={levelAdjustment}
                  onChange={(e) => onChangeLA(parseInt(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-indigo-800/60 rounded-xl p-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-indigo-300 mb-1">Inherited Traits / Application Rule</label>
            <input
              type="text"
              value={inheritedTraitsSummary}
              onChange={(e) => onChangeInherited(e.target.value)}
              placeholder="e.g. Retains all base creature abilities, HD, and skills, adding template ability modifiers and racial traits."
              className="w-full bg-stone-950 border border-indigo-800/60 rounded-xl p-2 text-stone-300 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-2 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-[11px] text-stone-300 font-mono flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              When applied to a character, this template merges onto their chosen base race without overriding basic Hit Dice or base class skill points.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
