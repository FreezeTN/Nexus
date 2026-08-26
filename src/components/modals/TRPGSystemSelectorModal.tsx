import React, { useState, useEffect } from 'react';
import { RuleEdition } from '../../types';
import {
  Layers,
  Flame,
  Cpu,
  BookOpen,
  Skull,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  X,
  Shield,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

interface TRPGSystemSelectorModalProps {
  isOpen: boolean;
  onClose?: () => void;
  enabledSystems: RuleEdition[];
  onSaveSystems: (selected: RuleEdition[]) => void;
  isInitialSetup?: boolean;
}

interface SystemMeta {
  id: RuleEdition;
  name: string;
  badge: string;
  tag: string;
  themeColor: string; // Tailwind color class key
  icon: React.ElementType;
  description: string;
  features: string[];
}

const ALL_SYSTEMS_META: SystemMeta[] = [
  {
    id: '5e',
    name: 'Dungeons & Dragons 5e',
    badge: '5th Edition',
    tag: 'FANTASY SYSTEM',
    themeColor: 'amber',
    icon: Flame,
    description: 'Modern 5th Edition d20 ruleset with Advantage/Disadvantage, spell slot tracking, and streamlined proficiency scaling.',
    features: ['Advantage / Disadvantage', 'Spell Slot Engine', 'Subclass Masteries', 'Standard d20 System']
  },
  {
    id: '3.5e',
    name: 'Dungeons & Dragons 3.5e',
    badge: '3.5 Edition',
    tag: 'CLASSIC d20',
    themeColor: 'rose',
    icon: Flame,
    description: 'Deep tactical d20 fantasy system featuring Fortitude/Reflex/Will saves, Skill points, and granular modifier bonuses.',
    features: ['3-Save System (Fort/Ref/Will)', 'Granular Skill Points', 'Prestige Customization', 'Tactical Combat Mods']
  },
  {
    id: 'shadowrun',
    name: 'Shadowrun',
    badge: 'Cyberpunk & Magic',
    tag: 'CYBERPUNK SYSTEM',
    themeColor: 'cyan',
    icon: Cpu,
    description: 'High-tech cyberpunk & urban fantasy ruleset featuring d6 dice pools, cyberware essence cost, decking & Matrix grids, and Nuyen.',
    features: ['d6 Skill Pools & Glitches', 'Cyberware & Essence Cost', 'Decking, Matrix & Rigging', 'Nuyen & Karma Tracking']
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder 2e',
    badge: '2nd Edition',
    tag: 'ARCANE SYSTEM',
    themeColor: 'purple',
    icon: BookOpen,
    description: 'Tactical fantasy system powered by a versatile 3-action turn economy, proficiency ranks (Untrained to Legendary), and ancestral feats.',
    features: ['3-Action Turn Economy', 'Proficiency Ranks (T/E/M/L)', 'Deep Feat Trees', 'Focus Points & Spells']
  },
  {
    id: 'cthulhu',
    name: 'Call of Cthulhu 7e',
    badge: '7th Edition',
    tag: 'HORROR SYSTEM',
    themeColor: 'emerald',
    icon: Skull,
    description: 'Eldritch mystery and investigation RPG featuring percentile d100 skill checks, Sanity loss tracking, and madness mechanics.',
    features: ['d100 Percentile Checks', 'Sanity (SAN) & Max SAN', 'Short/Long-Term Madness', 'Bouts of Madness Logs']
  }
];

export const TRPGSystemSelectorModal: React.FC<TRPGSystemSelectorModalProps> = ({
  isOpen,
  onClose,
  enabledSystems,
  onSaveSystems,
  isInitialSetup = false
}) => {
  const [selected, setSelected] = useState<RuleEdition[]>(() => 
    enabledSystems.length > 0 ? enabledSystems : ['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu']
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (enabledSystems && enabledSystems.length > 0) {
      setSelected(enabledSystems);
    }
  }, [enabledSystems, isOpen]);

  if (!isOpen) return null;

  const toggleSystem = (sysId: RuleEdition) => {
    setErrorMsg(null);
    if (selected.includes(sysId)) {
      if (selected.length <= 1) {
        setErrorMsg('At least one TRPG system must remain selected.');
        return;
      }
      setSelected(selected.filter(id => id !== sysId));
    } else {
      setSelected([...selected, sysId]);
    }
  };

  const handleSelectAll = () => {
    setErrorMsg(null);
    setSelected(['5e', '3.5e', 'shadowrun', 'pathfinder', 'cthulhu']);
  };

  const handleSelectPreset = (preset: 'dnd' | 'fantasy' | 'cyberpunk') => {
    setErrorMsg(null);
    if (preset === 'dnd') {
      setSelected(['5e', '3.5e']);
    } else if (preset === 'fantasy') {
      setSelected(['5e', '3.5e', 'pathfinder']);
    } else if (preset === 'cyberpunk') {
      setSelected(['shadowrun']);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      setErrorMsg('Please select at least one TRPG ruleset to proceed.');
      return;
    }
    onSaveSystems(selected);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/50 rounded-2xl text-amber-400 shadow">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
                  {isInitialSetup ? 'Welcome & First-Time Setup' : 'Workspace Configuration'}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  ({selected.length} of {ALL_SYSTEMS_META.length} Active)
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-100 mt-1">
                Select Active TRPG Systems
              </h2>
            </div>
          </div>

          {!isInitialSetup && onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-xl transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body & Selection Cards */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <p className="text-sm text-stone-300 leading-relaxed bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
            Choose which Tabletop RPG rulesets you want enabled in your workspace. Unselected systems will be completely hidden from top system selectors, character creation, compendiums, and user guides for a clean, customized experience.
          </p>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-stone-400 font-bold uppercase text-[10px] tracking-wider font-mono">Quick Presets:</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-xl font-bold transition shadow"
            >
              ✨ Enable All (5 Systems)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('dnd')}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-300 border border-stone-700 rounded-xl font-bold transition shadow"
            >
              ⚔️ D&D Only (5e + 3.5e)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('fantasy')}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-purple-300 border border-stone-700 rounded-xl font-bold transition shadow"
            >
              🧙 Fantasy Suite (5e + 3.5e + PF2e)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('cyberpunk')}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-stone-700 rounded-xl font-bold transition shadow"
            >
              🤖 Shadowrun Only
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALL_SYSTEMS_META.map((sys) => {
              const isSelected = selected.includes(sys.id);
              const Icon = sys.icon;

              let cardStyle = 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700';
              let badgeStyle = 'bg-stone-900 text-stone-400 border-stone-800';

              if (isSelected) {
                if (sys.id === 'shadowrun') {
                  cardStyle = 'bg-cyan-950/30 border-cyan-500/80 text-stone-100 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/40';
                  badgeStyle = 'bg-cyan-950 text-cyan-300 border-cyan-600/50';
                } else if (sys.id === 'pathfinder') {
                  cardStyle = 'bg-purple-950/30 border-purple-500/80 text-stone-100 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/40';
                  badgeStyle = 'bg-purple-950 text-purple-300 border-purple-600/50';
                } else if (sys.id === 'cthulhu') {
                  cardStyle = 'bg-emerald-950/30 border-emerald-500/80 text-stone-100 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/40';
                  badgeStyle = 'bg-emerald-950 text-emerald-300 border-emerald-600/50';
                } else if (sys.id === '3.5e') {
                  cardStyle = 'bg-rose-950/30 border-rose-500/80 text-stone-100 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500/40';
                  badgeStyle = 'bg-rose-950 text-rose-300 border-rose-600/50';
                } else {
                  cardStyle = 'bg-amber-950/30 border-amber-500/80 text-stone-100 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/40';
                  badgeStyle = 'bg-amber-950 text-amber-300 border-amber-600/50';
                }
              }

              return (
                <div
                  key={sys.id}
                  onClick={() => toggleSystem(sys.id)}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between space-y-3 relative group ${cardStyle}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${badgeStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-amber-300 transition">
                            {sys.name}
                          </h3>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${badgeStyle}`}>
                            {sys.badge}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-stone-400 tracking-wider">
                          {sys.tag}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg border border-stone-700 bg-stone-900 group-hover:border-stone-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    {sys.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-stone-800/80">
                    {sys.features.map((feat, idx) => (
                      <span key={idx} className="text-[10px] bg-stone-900/90 text-stone-300 border border-stone-800 px-2 py-0.5 rounded-md font-sans">
                        • {feat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div className="text-xs text-stone-400 font-mono">
            {selected.length} ruleset{selected.length === 1 ? '' : 's'} active in workspace
          </div>

          <div className="flex items-center gap-3">
            {!isInitialSetup && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isInitialSetup ? 'Launch Workspace with Selected TRPGs' : 'Save TRPG Selection'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TRPGSystemSelectorModal;
