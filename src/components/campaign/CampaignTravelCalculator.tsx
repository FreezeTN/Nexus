import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  Clock,
  Coffee,
  Droplets,
  Eye,
  ShieldAlert,
  Dices,
  Wind,
  Footprints,
  Sparkles
} from 'lucide-react';
import {
  TravelCalculationParams,
  TravelMode,
  TravelPace,
  WorldLocation
} from '../../types/campaign';
import { calculateOverlandTravel } from '../../services/campaignService';

interface CampaignTravelCalculatorProps {
  initialDestination?: WorldLocation | null;
}

export const CampaignTravelCalculator: React.FC<CampaignTravelCalculatorProps> = ({
  initialDestination
}) => {
  const [distanceMiles, setDistanceMiles] = useState<number>(72);
  const [mode, setMode] = useState<TravelMode>('foot');
  const [pace, setPace] = useState<TravelPace>('normal');
  const [difficultTerrain, setDifficultTerrain] = useState<boolean>(false);
  const [weatherHazard, setWeatherHazard] = useState<boolean>(false);

  useEffect(() => {
    if (initialDestination) {
      // Calculate mock distance based on location coordinates relative to center
      const dist = Math.round(Math.hypot(initialDestination.x - 30, initialDestination.y - 30) * 3);
      setDistanceMiles(Math.max(12, dist));
    }
  }, [initialDestination]);

  const result = calculateOverlandTravel({
    distanceMiles,
    mode,
    pace,
    difficultTerrain,
    weatherHazard
  });

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-amber-200">
              TRPG Overland Travel & Expedition Pacing Calculator
            </h3>
            <p className="text-xs text-stone-400">
              Official DMG overland travel speeds, rations consumption, passive perception penalties & random encounter frequencies.
            </p>
          </div>
        </div>

        {initialDestination && (
          <span className="text-xs font-serif font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/40">
            Destination: {initialDestination.name}
          </span>
        )}
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Distance in Miles */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
          <label className="block text-stone-400 font-mono text-[11px] mb-1">
            Distance (Miles / Hexes)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="5000"
              value={distanceMiles}
              onChange={(e) => setDistanceMiles(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-300 font-bold text-sm focus:border-amber-500 focus:outline-none"
            />
            <span className="text-xs text-stone-400 font-mono">miles</span>
          </div>
          <span className="text-[10px] text-stone-500 block mt-1">
            ≈ {Math.round(distanceMiles / 6)} regional 6-mile hexes
          </span>
        </div>

        {/* Transport Mode */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
          <label className="block text-stone-400 font-mono text-[11px] mb-1">
            Transport Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as TravelMode)}
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="foot">🚶 On Foot (Marching)</option>
            <option value="draft_horse">🐴 Draft Horse & Cart</option>
            <option value="warhorse">🐎 Riding / Warhorse (Fast)</option>
            <option value="carriage">🛞 Stage Carriage</option>
            <option value="sailing_ship">⛵ Sailing Ship (Day/Night)</option>
            <option value="airship">🎈 Arcane Airship</option>
            <option value="teleport">✨ Teleportation Circle (Instant)</option>
          </select>
        </div>

        {/* Travel Pace */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
          <label className="block text-stone-400 font-mono text-[11px] mb-1">
            Expedition Pace
          </label>
          <select
            value={pace}
            onChange={(e) => setPace(e.target.value as TravelPace)}
            className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="normal">Normal Pace (24 mi/day standard)</option>
            <option value="fast">Fast Pace (+33% speed, -5 Passive Perception)</option>
            <option value="slow">Slow Pace (-25% speed, Stealth Allowed)</option>
          </select>
        </div>

        {/* Environmental Hazards */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-stone-300">
            <input
              type="checkbox"
              checked={difficultTerrain}
              onChange={(e) => setDifficultTerrain(e.target.checked)}
              className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Swamp / Mountain Terrain (1/2 Speed)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-stone-300">
            <input
              type="checkbox"
              checked={weatherHazard}
              onChange={(e) => setWeatherHazard(e.target.checked)}
              className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Severe Weather / Blizzard</span>
          </label>
        </div>
      </div>

      {/* Calculated Results Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {/* Total Days */}
        <div className="bg-stone-950 p-3 rounded-xl border border-amber-500/40 text-center">
          <Clock className="w-5 h-5 mx-auto text-amber-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Journey Duration</span>
          <strong className="text-base text-amber-300">{result.daysTotal} Days</strong>
          <span className="text-[10px] text-stone-500 block">({result.hoursTotal} travel hours)</span>
        </div>

        {/* Speed per Day */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
          <Footprints className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Speed Per Day</span>
          <strong className="text-base text-cyan-300">{result.milesPerDay} Miles/Day</strong>
          <span className="text-[10px] text-stone-500 block">({Math.round(result.milesPerDay / 8)} mph march)</span>
        </div>

        {/* Rations Needed */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
          <Coffee className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Rations Per Player</span>
          <strong className="text-base text-yellow-300">{result.rationsPerPerson} Rations</strong>
          <span className="text-[10px] text-stone-500 block">(1 lb dry food/day)</span>
        </div>

        {/* Water Gallons */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
          <Droplets className="w-5 h-5 mx-auto text-blue-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Water Needed</span>
          <strong className="text-base text-blue-300">{result.waterGallonsPerPerson} Gal/Person</strong>
          <span className="text-[10px] text-stone-500 block">(Hydration supply)</span>
        </div>

        {/* Stealth / Perception Modifier */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
          <Eye className="w-5 h-5 mx-auto text-purple-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Perception Mod</span>
          <strong className={`text-base ${result.passivePerceptionModifier < 0 ? 'text-red-400' : 'text-emerald-300'}`}>
            {result.passivePerceptionModifier === 0 ? 'Normal' : `${result.passivePerceptionModifier} Penalty`}
          </strong>
          <span className="text-[10px] text-stone-500 block">
            {result.stealthAllowed ? 'Stealth Allowed' : 'No Stealth'}
          </span>
        </div>

        {/* Random Encounter Checks */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
          <Dices className="w-5 h-5 mx-auto text-rose-400 mb-1" />
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Encounter Rolls</span>
          <strong className="text-base text-rose-300">{result.encounterCheckRolls} Checks</strong>
          <span className="text-[10px] text-stone-500 block">(1d20, roll on 18+)</span>
        </div>
      </div>

      {/* Narrative DM Guidance Summary */}
      <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
        <span className="font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>DM Wilderness Travel Summary</span>
        </span>
        <p className="leading-relaxed">
          {result.description}
        </p>
      </div>
    </div>
  );
};
