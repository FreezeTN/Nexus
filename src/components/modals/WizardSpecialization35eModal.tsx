import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eWizardSpecializationStats,
  OFFICIAL_35E_WIZARD_SCHOOLS
} from '../../utils/calculators/classFeatures35eCalculators';
import {
  BookOpen,
  Sparkles,
  Shield,
  Zap,
  Flame,
  Eye,
  HeartCrack,
  Wand2,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

interface WizardSpecialization35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const WizardSpecialization35eModal: React.FC<WizardSpecialization35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const stats = calculate35eWizardSpecializationStats(character);
  const [selectedSchool, setSelectedSchool] = useState<string>(
    character.wizardSchool35e?.specialization || 'Universal'
  );
  const [prohibited, setProhibited] = useState<string[]>(
    character.wizardSchool35e?.prohibitedSchools || []
  );

  if (!isOpen) return null;

  const currentInfo = OFFICIAL_35E_WIZARD_SCHOOLS[selectedSchool] || OFFICIAL_35E_WIZARD_SCHOOLS['Universal'];
  const reqCount = currentInfo.prohibitedCountRequired;

  const handleSelectSchool = (schoolKey: string) => {
    setSelectedSchool(schoolKey);
    const newInfo = OFFICIAL_35E_WIZARD_SCHOOLS[schoolKey] || OFFICIAL_35E_WIZARD_SCHOOLS['Universal'];

    // Filter prohibited schools to only those allowed and not equal to the new school
    const cleaned = prohibited
      .filter(p => p !== schoolKey && newInfo.allowedProhibitedSchools.includes(p))
      .slice(0, newInfo.prohibitedCountRequired);

    setProhibited(cleaned);
  };

  const handleToggleProhibited = (schoolName: string) => {
    if (prohibited.includes(schoolName)) {
      setProhibited(prohibited.filter(p => p !== schoolName));
    } else {
      if (prohibited.length >= reqCount) {
        // Replace oldest or shift
        setProhibited([...prohibited.slice(1), schoolName]);
      } else {
        setProhibited([...prohibited, schoolName]);
      }
    }
  };

  const handleSave = () => {
    onUpdateCharacter({
      ...character,
      wizardSchool35e: {
        specialization: selectedSchool,
        prohibitedSchools: selectedSchool === 'Universal' ? [] : prohibited
      }
    });
    onClose();
  };

  const isSelectionValid = selectedSchool === 'Universal' || prohibited.length === reqCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-indigo-700/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-900/40 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-600/60 rounded-xl text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-indigo-200 font-serif">Wizard Arcane Specialization</h2>
                <span className="px-2 py-0.5 bg-indigo-950/70 border border-indigo-800 text-indigo-300 rounded text-xs font-mono">
                  Level {stats.wizardLevel} Wizard
                </span>
                <span className="px-2 py-0.5 bg-stone-800 border border-stone-700 text-stone-300 rounded text-xs font-mono">
                  PHB p. 57-58
                </span>
              </div>
              <p className="text-xs text-stone-400">
                School specialization, +1 bonus slot per spell level, and prohibited school enforcement
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

        {/* Benefits & Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-stone-950/40 border-b border-stone-800 text-xs">
          <div className="bg-stone-900/80 border border-indigo-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Chosen Specialization</div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">
              {currentInfo.name}
            </div>
          </div>
          <div className="bg-stone-900/80 border border-indigo-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Specialist Bonus Slots</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {selectedSchool === 'Universal' ? 'None (Generalist)' : '+1 Slot per Spell Level (1st–9th)'}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${isSelectionValid ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200' : 'bg-red-950/30 border-red-700/60 text-red-200'}`}>
            <div className="font-medium">Prohibited Selection</div>
            <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
              {isSelectionValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Valid Selection</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Select {reqCount - prohibited.length} more school(s)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Section 1: Choose School */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Select Arcane School of Specialization
              </h3>
              <span className="text-xs text-stone-400">9 Available Paths</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.entries(OFFICIAL_35E_WIZARD_SCHOOLS).map(([key, info]) => {
                const isSelected = selectedSchool === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleSelectSchool(key)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-stone-950/60 border-stone-800 hover:border-indigo-900/60 text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${isSelected ? 'text-indigo-200' : 'text-stone-200'}`}>
                          {info.school}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 bg-indigo-900/80 border border-indigo-600 text-indigo-200 rounded text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                        {info.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">
                        {info.prohibitedCountRequired === 0
                          ? 'No prohibited schools'
                          : `Req: ${info.prohibitedCountRequired} prohibited`}
                      </span>
                      <span className={info.prohibitedCountRequired > 0 ? 'text-amber-400 font-bold' : 'text-stone-400'}>
                        {info.prohibitedCountRequired > 0 ? '+1 Slot/Level' : 'Generalist'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Prohibited Schools Selection */}
          {selectedSchool !== 'Universal' && (
            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    Select Prohibited Schools ({prohibited.length} of {reqCount} Selected)
                  </h3>
                  <p className="text-xs text-stone-400">
                    A specialist cannot learn, prepare, or cast spells from prohibited schools, even from scrolls or wands (PHB p. 57).
                  </p>
                </div>
                {reqCount === 1 && (
                  <span className="px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded text-xs">
                    Divination perk: Only 1 prohibited school required!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentInfo.allowedProhibitedSchools.map((schoolName) => {
                  const isProhibited = prohibited.includes(schoolName);
                  return (
                    <button
                      key={schoolName}
                      type="button"
                      onClick={() => handleToggleProhibited(schoolName)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isProhibited
                          ? 'bg-red-950/60 border-red-500 text-red-200 shadow-sm'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{schoolName}</span>
                      {isProhibited ? (
                        <span className="text-[10px] bg-red-900 border border-red-700 text-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
                          Prohibited
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-mono">Available</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Special Rule Notice */}
              <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-xl flex items-start gap-2.5 text-xs text-stone-400">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-300">Official D&D 3.5e Rule:</strong> <em>Divination</em> can never be chosen as a prohibited school by any wizard specialist. Spells belonging to prohibited schools are completely barred from preparation.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs">
          <div className="text-stone-400">
            Selected: <strong className="text-indigo-300">{currentInfo.name}</strong>
            {selectedSchool !== 'Universal' && (
              <> | Prohibited: <strong className="text-red-300">{prohibited.join(', ') || 'None selected'}</strong></>
            )}
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
              disabled={!isSelectionValid}
              className="px-4 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 disabled:opacity-50 text-indigo-200 rounded-xl font-bold transition shadow"
            >
              Apply Specialization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
