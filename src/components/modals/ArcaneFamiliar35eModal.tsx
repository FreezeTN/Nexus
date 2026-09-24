import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eFamiliarMasterStats,
  OFFICIAL_35E_FAMILIARS
} from '../../utils/calculators/classFeatures35eCalculators';
import {
  Sparkles,
  PawPrint,
  Heart,
  Shield,
  Eye,
  Volume2,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Info,
  Radio,
  RadioTower,
  MessageSquare
} from 'lucide-react';

interface ArcaneFamiliar35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const ArcaneFamiliar35eModal: React.FC<ArcaneFamiliar35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const stats = calculate35eFamiliarMasterStats(character);
  const famData = character.familiarData35e;

  const [selectedType, setSelectedType] = useState<string>(
    famData?.familiarType || 'cat'
  );
  const [familiarName, setFamiliarName] = useState<string>(
    famData?.name || ''
  );
  const [isSummoned, setIsSummoned] = useState<boolean>(
    famData?.isSummoned ?? false
  );
  const [isWithinReach, setIsWithinReach] = useState<boolean>(
    famData?.isWithinArmReach ?? true
  );
  const [currentHp, setCurrentHp] = useState<number>(
    famData?.currentHp !== undefined ? famData.currentHp : stats.familiarHpMax
  );
  const [chosenLanguage, setChosenLanguage] = useState<string>(
    famData?.chosenLanguage || 'Common'
  );

  if (!isOpen) return null;

  const currentPreset = OFFICIAL_35E_FAMILIARS[selectedType] || OFFICIAL_35E_FAMILIARS['cat'];

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      familiarData35e: {
        familiarType: selectedType,
        name: familiarName.trim() || currentPreset.name,
        isSummoned,
        isWithinArmReach: isWithinReach,
        currentHp,
        chosenLanguage: selectedType === 'raven' ? chosenLanguage : undefined
      }
    });
    onClose();
  };

  const handleAdjustHp = (delta: number) => {
    const next = Math.max(0, Math.min(stats.familiarHpMax, currentHp + delta));
    setCurrentHp(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-purple-700/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-900/40 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-950/80 border border-purple-600/60 rounded-xl text-purple-300">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-purple-200 font-serif">Arcane Familiar Engine</h2>
                <span className="px-2 py-0.5 bg-purple-950/70 border border-purple-800 text-purple-300 rounded text-xs font-mono">
                  Master Level {stats.masterLevel}
                </span>
                <span className="px-2 py-0.5 bg-stone-800 border border-stone-700 text-stone-300 rounded text-xs font-mono">
                  PHB p. 52-53
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Magical companion for Sorcerers and Wizards with empathic link, shared defenses, and master perks
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

        {/* Master Synergy Top Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-stone-950/40 border-b border-stone-800 text-xs">
          <div className="bg-stone-900/80 border border-purple-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Familiar Status</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSummoned ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-stone-600'}`} />
              <span className="font-bold text-stone-200">{isSummoned ? 'Active Companion' : 'Not Summoned'}</span>
            </div>
          </div>

          <div className="bg-stone-900/80 border border-purple-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Proximity (Within Reach)</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`font-bold ${isSummoned && isWithinReach ? 'text-amber-300' : 'text-stone-500'}`}>
                {isSummoned && isWithinReach ? 'Within 5 ft (Arm\'s Reach)' : 'Separated / Far'}
              </span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border ${isSummoned && isWithinReach ? 'bg-amber-950/30 border-amber-700/60 text-amber-200' : 'bg-stone-900/60 border-stone-800 text-stone-500'}`}>
            <div className="font-medium">Alertness Feat</div>
            <div className="text-xs font-bold mt-0.5">
              {isSummoned && isWithinReach ? '+2 Listen, +2 Spot to Master' : 'Inactive (needs reach)'}
            </div>
          </div>

          <div className="bg-stone-900/80 border border-purple-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Master Perk</div>
            <div className="text-xs font-bold text-purple-300 mt-0.5 truncate" title={currentPreset.masterPerk}>
              {currentPreset.masterPerk}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 1: Activation Controls & Naming */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-200">Familiar Identity & Summoning</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Familiar name (optional)..."
                  value={familiarName}
                  onChange={(e) => setFamiliarName(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              {selectedType === 'raven' && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-stone-400">Raven Language:</span>
                  <input
                    type="text"
                    value={chosenLanguage}
                    onChange={(e) => setChosenLanguage(e.target.value)}
                    placeholder="e.g. Common, Draconic, Elven..."
                    className="bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-purple-200"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isSummoned}
                    onChange={(e) => setIsSummoned(e.target.checked)}
                    className="rounded border-stone-700 text-purple-600 focus:ring-0 bg-stone-900"
                  />
                  <span className="text-stone-200 font-bold">Summoned & Present</span>
                </label>

                <label className={`flex items-center gap-2 cursor-pointer text-xs ${!isSummoned ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!isSummoned}
                    checked={isWithinReach}
                    onChange={(e) => setIsWithinReach(e.target.checked)}
                    className="rounded border-stone-700 text-purple-600 focus:ring-0 bg-stone-900"
                  />
                  <span className="text-stone-300">Within Arm's Reach (5 ft.)</span>
                </label>
              </div>
            </div>

            {/* Familiar Vitality & Defense Stats */}
            <div className="space-y-3 bg-stone-900/60 border border-stone-800/80 p-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300">Familiar Vitality</span>
                <span className="text-xs font-mono text-purple-300">
                  HP: {currentHp} / {stats.familiarHpMax} (1/2 Master)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-stone-950 h-3 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-purple-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (currentHp / stats.familiarHpMax) * 100))}%` }}
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAdjustHp(-1)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleAdjustHp(1)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80 text-[11px] text-center">
                <div className="bg-stone-950/70 p-1.5 rounded-lg">
                  <div className="text-stone-500">Natural AC</div>
                  <div className="font-bold text-stone-200">+{stats.naturalArmorBonus}</div>
                </div>
                <div className="bg-stone-950/70 p-1.5 rounded-lg">
                  <div className="text-stone-500">Intelligence</div>
                  <div className="font-bold text-purple-300">{stats.intScore}</div>
                </div>
                <div className="bg-stone-950/70 p-1.5 rounded-lg">
                  <div className="text-stone-500">Base Saves</div>
                  <div className="font-bold text-stone-200">Master's</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Choose Familiar Type */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-200">Select Familiar Archetype (PHB p. 52)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {Object.entries(OFFICIAL_35E_FAMILIARS).map(([key, fam]) => {
                const isSelected = selectedType === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 shadow-md ring-1 ring-purple-500/40'
                        : 'bg-stone-950/60 border-stone-800 hover:border-purple-900/60 text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-xs ${isSelected ? 'text-purple-200' : 'text-stone-200'}`}>
                          {fam.name}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">{fam.size}</span>
                      </div>
                      <div className="text-[11px] font-bold text-amber-300 mb-1">
                        {fam.masterPerk}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-400 line-clamp-2 mt-1 pt-1 border-t border-stone-800/80">
                      {fam.specialQualities}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Familiar Level Progression Timeline */}
          <div className="space-y-2.5 pt-2 border-t border-stone-800">
            <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Special Abilities Granted by Master Level
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {stats.specialAbilities.map((ability, idx) => (
                <div
                  key={idx}
                  className="bg-stone-950/70 border border-purple-900/30 p-2.5 rounded-xl flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-medium text-stone-200">{ability}</span>
                </div>
              ))}
            </div>

            <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl flex items-start gap-2.5 text-xs text-stone-400">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-300">Spell Sharing & Touch Spells:</strong> The master may have any spell she casts on herself also affect her familiar. At 3rd level, the familiar can deliver touch spells on the master's behalf.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs">
          <div className="text-stone-400">
            Current: <strong className="text-purple-300">{familiarName || currentPreset.name}</strong> ({currentPreset.name})
            {isSummoned && isWithinReach && <span className="text-amber-300 font-bold ml-2">• Alertness Active</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-xl font-bold transition shadow"
            >
              Save Familiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
