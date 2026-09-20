import React, { useState, useMemo } from 'react';
import {
  Footprints,
  Wind,
  Waves,
  Mountain,
  CircleDot,
  RotateCcw,
  Sparkles,
  Shield,
  Zap,
  Info,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CharacterData } from '../../types';
import { getRacialBaseSpeed } from '../../utils/raceApplication';
import { getEffectiveSpeed } from '../../utils/dndCalculations';

interface EditMovementSpeedModalProps {
  character: CharacterData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCharacter: CharacterData) => void;
}

export const EditMovementSpeedModal: React.FC<EditMovementSpeedModalProps> = ({
  character,
  isOpen,
  onClose,
  onSave
}) => {
  const racialInfo = useMemo(() => {
    return getRacialBaseSpeed(character.race, character.edition);
  }, [character.race, character.edition]);

  const defaultBaseRacialSpeed = character.baseRacialSpeed || racialInfo.speed || 30;

  const [landSpeed, setLandSpeed] = useState<number>(character.speed || defaultBaseRacialSpeed);
  const [flySpeed, setFlySpeed] = useState<string>(
    character.speedFly !== undefined && character.speedFly > 0 ? String(character.speedFly) : ''
  );
  const [swimSpeed, setSwimSpeed] = useState<string>(
    character.speedSwim !== undefined && character.speedSwim > 0 ? String(character.speedSwim) : ''
  );
  const [climbSpeed, setClimbSpeed] = useState<string>(
    character.speedClimb !== undefined && character.speedClimb > 0 ? String(character.speedClimb) : ''
  );
  const [burrowSpeed, setBurrowSpeed] = useState<string>(
    character.speedBurrow !== undefined && character.speedBurrow > 0 ? String(character.speedBurrow) : ''
  );

  // Re-sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLandSpeed(character.speed || defaultBaseRacialSpeed);
      setFlySpeed(character.speedFly !== undefined && character.speedFly > 0 ? String(character.speedFly) : '');
      setSwimSpeed(character.speedSwim !== undefined && character.speedSwim > 0 ? String(character.speedSwim) : '');
      setClimbSpeed(character.speedClimb !== undefined && character.speedClimb > 0 ? String(character.speedClimb) : '');
      setBurrowSpeed(character.speedBurrow !== undefined && character.speedBurrow > 0 ? String(character.speedBurrow) : '');
    }
  }, [isOpen, character, defaultBaseRacialSpeed]);

  if (!isOpen) return null;

  // Mock updated character to run through effective speed engine
  const previewCharacter: CharacterData = {
    ...character,
    speed: Math.max(0, landSpeed),
    speedFly: flySpeed ? Math.max(0, parseInt(flySpeed) || 0) : undefined,
    speedSwim: swimSpeed ? Math.max(0, parseInt(swimSpeed) || 0) : undefined,
    speedClimb: climbSpeed ? Math.max(0, parseInt(climbSpeed) || 0) : undefined,
    speedBurrow: burrowSpeed ? Math.max(0, parseInt(burrowSpeed) || 0) : undefined,
  };

  const effectiveSpeed = getEffectiveSpeed(previewCharacter);
  const isOverridden = landSpeed !== defaultBaseRacialSpeed;

  const handleResetToRacial = () => {
    setLandSpeed(racialInfo.speed);
    if (racialInfo.speedFly) setFlySpeed(String(racialInfo.speedFly));
    if (racialInfo.speedSwim) setSwimSpeed(String(racialInfo.speedSwim));
    if (racialInfo.speedClimb) setClimbSpeed(String(racialInfo.speedClimb));
    if (racialInfo.speedBurrow) setBurrowSpeed(String(racialInfo.speedBurrow));
  };

  const handleApplyPresetDelta = (delta: number) => {
    setLandSpeed(prev => Math.max(0, prev + delta));
  };

  const handleMultiplySpeed = (multiplier: number) => {
    setLandSpeed(prev => Math.max(0, Math.round(prev * multiplier)));
  };

  const handleSave = () => {
    const parsedFly = flySpeed.trim() ? Math.max(0, parseInt(flySpeed) || 0) : undefined;
    const parsedSwim = swimSpeed.trim() ? Math.max(0, parseInt(swimSpeed) || 0) : undefined;
    const parsedClimb = climbSpeed.trim() ? Math.max(0, parseInt(climbSpeed) || 0) : undefined;
    const parsedBurrow = burrowSpeed.trim() ? Math.max(0, parseInt(burrowSpeed) || 0) : undefined;

    const updatedChar: CharacterData = {
      ...character,
      speed: Math.max(0, landSpeed),
      speedFly: parsedFly,
      speedSwim: parsedSwim,
      speedClimb: parsedClimb,
      speedBurrow: parsedBurrow,
      baseRacialSpeed: defaultBaseRacialSpeed,
      speedOverridden: isOverridden
    };

    onSave(updatedChar);
    onClose();
  };

  return (
    <div
      id="modal-edit-movement-speed-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-edit-movement-speed"
        className="relative w-full max-w-xl bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Movement Speed & Tactical Mobility</span>
              </h2>
              <p className="text-xs text-stone-400">
                {character.name || 'Character'} • {character.race || 'Race'} • {character.edition || '5e'} Edition
              </p>
            </div>
          </div>
          <button
            id="btn-close-movement-speed-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Racial Base Movement Info Banner */}
          <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Racial Baseline: {character.race || 'Standard Race'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {racialInfo.speed} ft. Standard
                </span>
                {isOverridden && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-[11px] font-bold">
                    Custom Override Active
                  </span>
                )}
              </div>
            </div>

            {racialInfo.specialNotes && (
              <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/90 p-2.5 rounded-lg border border-stone-800/80">
                <Info className="w-3.5 h-3.5 text-amber-400 inline mr-1.5 -mt-0.5" />
                {racialInfo.specialNotes}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400">
                Rule Reference: <strong className="text-stone-300">{racialInfo.source}</strong>
              </span>
              <button
                type="button"
                id="btn-reset-to-racial-speed"
                onClick={handleResetToRacial}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset to Racial Base ({racialInfo.speed} ft.)</span>
              </button>
            </div>
          </div>

          {/* Primary Land Speed Editor */}
          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="input-land-speed" className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-400" />
                <span>Base Land Speed (Walking)</span>
              </label>
              <span className="text-xs text-stone-400">Grid: {Math.floor(landSpeed / 5)} squares</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  id="input-land-speed"
                  value={landSpeed}
                  min={0}
                  max={300}
                  step={5}
                  onChange={(e) => setLandSpeed(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 font-mono text-xl font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm font-semibold">
                  feet / round
                </span>
              </div>

              {/* Step Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-speed-minus-5"
                  onClick={() => setLandSpeed(prev => Math.max(0, prev - 5))}
                  className="px-3 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono font-bold text-sm border border-stone-700 transition-colors"
                  title="Decrease 5 ft."
                >
                  -5
                </button>
                <button
                  type="button"
                  id="btn-speed-plus-5"
                  onClick={() => setLandSpeed(prev => prev + 5)}
                  className="px-3 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono font-bold text-sm border border-stone-700 transition-colors"
                  title="Increase 5 ft."
                >
                  +5
                </button>
              </div>
            </div>

            {/* Quick Presets & Modifiers */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block mb-2">
                Quick Class / Spell Adjustments:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetDelta(10)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 text-xs font-mono font-medium transition-colors text-center"
                  title="Mobile feat, Barbarian Fast Movement, Longstrider"
                >
                  +10 ft.
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDelta(15)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 text-xs font-mono font-medium transition-colors text-center"
                  title="Monk Unarmored Movement Lvl 2-5"
                >
                  +15 ft.
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDelta(20)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 text-xs font-mono font-medium transition-colors text-center"
                  title="Monk Unarmored Movement Lvl 6-9"
                >
                  +20 ft.
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetDelta(30)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-950/50 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 text-xs font-mono font-medium transition-colors text-center"
                  title="Haste, Expeditious Retreat, Fly spell base"
                >
                  +30 ft.
                </button>
                <button
                  type="button"
                  onClick={() => handleMultiplySpeed(2)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-emerald-950/50 border border-stone-800 hover:border-emerald-500/40 text-stone-300 hover:text-emerald-300 text-xs font-mono font-bold transition-colors text-center"
                  title="Dash action / Boots of Speed / Feline Agility"
                >
                  ×2 Dash
                </button>
                <button
                  type="button"
                  onClick={() => setLandSpeed(30)}
                  className="px-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-mono transition-colors text-center"
                  title="Reset to 30 ft."
                >
                  30 ft.
                </button>
              </div>
            </div>
          </div>

          {/* Alternate Movement Modes (Fly, Swim, Climb, Burrow) */}
          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300 block">
              Special Tactical Movement Modes
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fly Speed */}
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Wind className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="input-fly-speed" className="text-xs font-semibold text-stone-300 block">
                    Fly Speed
                  </label>
                  <input
                    type="number"
                    id="input-fly-speed"
                    value={flySpeed}
                    placeholder="None"
                    min={0}
                    step={5}
                    onChange={(e) => setFlySpeed(e.target.value)}
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
              </div>

              {/* Swim Speed */}
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Waves className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="input-swim-speed" className="text-xs font-semibold text-stone-300 block">
                    Swim Speed
                  </label>
                  <input
                    type="number"
                    id="input-swim-speed"
                    value={swimSpeed}
                    placeholder="None"
                    min={0}
                    step={5}
                    onChange={(e) => setSwimSpeed(e.target.value)}
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-cyan-500 mt-1"
                  />
                </div>
              </div>

              {/* Climb Speed */}
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Mountain className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="input-climb-speed" className="text-xs font-semibold text-stone-300 block">
                    Climb Speed
                  </label>
                  <input
                    type="number"
                    id="input-climb-speed"
                    value={climbSpeed}
                    placeholder="None"
                    min={0}
                    step={5}
                    onChange={(e) => setClimbSpeed(e.target.value)}
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 mt-1"
                  />
                </div>
              </div>

              {/* Burrow Speed */}
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <CircleDot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="input-burrow-speed" className="text-xs font-semibold text-stone-300 block">
                    Burrow Speed
                  </label>
                  <input
                    type="number"
                    id="input-burrow-speed"
                    value={burrowSpeed}
                    placeholder="None"
                    min={0}
                    step={5}
                    onChange={(e) => setBurrowSpeed(e.target.value)}
                    className="w-full bg-stone-950/60 border border-stone-800 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Effective Speed In-Combat Summary */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Effective Tactical Land Speed
              </span>
              <p className="text-[11px] text-stone-400">
                Calculated after armor weight, encumbrance penalties, and tactical effects.
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-black text-amber-400">
                {effectiveSpeed.effectiveSpeed}
              </span>
              <span className="text-xs font-mono font-bold text-amber-300/80">ft. / round</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-800 bg-stone-950/70">
          <button
            type="button"
            id="btn-cancel-edit-speed"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-movement-speed"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
            <span>Apply Movement Speeds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
