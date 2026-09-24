import React, { useState } from 'react';
import { Combatant } from '../combat/encounter/encounterTypes';
import { LightSourceType } from './battlemapTypes';
import {
  X,
  Shield,
  Heart,
  Footprints,
  ArrowUp,
  Flame,
  User,
  Trash2,
  Check,
  Crosshair,
  Sliders,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { generateMonsterSvgPortrait } from '../../data/monsterPortraits';

interface CombatantPropertiesModalProps {
  combatant: Combatant;
  isDm: boolean;
  onClose: () => void;
  onUpdateCombatant: (updated: Combatant) => void;
  onRemoveFromMap: (id: string) => void;
  onDeleteFromEncounter?: (id: string) => void;
  onCenterOnMap?: (id: string) => void;
  isSheltered?: boolean;
  ceilingFeet?: number;
}

export const CombatantPropertiesModal: React.FC<CombatantPropertiesModalProps> = ({
  combatant,
  isDm,
  onClose,
  onUpdateCombatant,
  onRemoveFromMap,
  onDeleteFromEncounter,
  onCenterOnMap,
  isSheltered = false,
  ceilingFeet = 10
}) => {
  const [name, setName] = useState(combatant.name);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [hpCurrent, setHpCurrent] = useState(String(combatant.hpCurrent));
  const [hpMax, setHpMax] = useState(String(combatant.hpMax));
  const [armorClass, setArmorClass] = useState(String(combatant.armorClass));
  const [speed, setSpeed] = useState(String(combatant.speed || 30));
  const [flySpeed, setFlySpeed] = useState(String(combatant.flySpeed || 0));
  const [hasHover, setHasHover] = useState(Boolean(combatant.hasHover));
  const [elevationFeet, setElevationFeet] = useState(String(combatant.elevationFeet || 0));
  const [reachFeet, setReachFeet] = useState(String(combatant.reachFeet || 5));
  const [type, setType] = useState<'player' | 'ally' | 'enemy'>(combatant.type);
  const [tokenSize, setTokenSize] = useState<number>(combatant.tokenSize || 1);
  const [lightSource, setLightSource] = useState<LightSourceType>(combatant.lightSource || 'none');
  const [conditions, setConditions] = useState<string[]>(combatant.conditions || []);

  const commonConditions = [
    'Blinded',
    'Charmed',
    'Deafened',
    'Frightened',
    'Grappled',
    'Incapacitated',
    'Invisible',
    'Paralyzed',
    'Petrified',
    'Poisoned',
    'Prone',
    'Restrained',
    'Stunned',
    'Unconscious'
  ];

  const handleToggleCondition = (cond: string) => {
    if (conditions.includes(cond)) {
      setConditions(conditions.filter((c) => c !== cond));
    } else {
      setConditions([...conditions, cond]);
    }
  };

  const handleSave = () => {
    const creatureHeight = Math.max(5, (tokenSize || 1) * 5);
    const maxAllowedElevation = isSheltered ? Math.max(0, ceilingFeet - creatureHeight) : 300;
    const parsedElev = parseInt(elevationFeet, 10) || 0;
    const finalElev = isSheltered ? Math.min(maxAllowedElevation, Math.max(0, parsedElev)) : Math.max(0, parsedElev);

    const updated: Combatant = {
      ...combatant,
      name: name.trim() || combatant.name,
      hpCurrent: parseInt(hpCurrent, 10) || 0,
      hpMax: Math.max(1, parseInt(hpMax, 10) || 1),
      armorClass: parseInt(armorClass, 10) || 10,
      speed: Math.max(0, parseInt(speed, 10) || 30),
      flySpeed: Math.max(0, parseInt(flySpeed, 10) || 0),
      hasHover,
      elevationFeet: finalElev,
      reachFeet: Math.max(5, parseInt(reachFeet, 10) || 5),
      type,
      tokenSize,
      lightSource,
      conditions
    };
    onUpdateCombatant(updated);
    onClose();
  };

  const creatureHeight = Math.max(5, (tokenSize || 1) * 5);
  const maxAllowedElevation = isSheltered ? Math.max(0, ceilingFeet - creatureHeight) : 300;
  const allPresets = [0, 5, 10, 20, 30, 60, 120];
  const availablePresets = allPresets.filter((preset) => preset <= maxAllowedElevation);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scaleUp text-stone-100 font-sans"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Portrait & Name */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-md bg-stone-900 shrink-0">
              <img
                src={
                  combatant.portraitUrl && !combatant.portraitUrl.includes('raw.githubusercontent.com')
                    ? combatant.portraitUrl
                    : generateMonsterSvgPortrait(combatant.name)
                }
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = generateMonsterSvgPortrait(combatant.name);
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                    combatant.type === 'player'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : combatant.type === 'ally'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {combatant.type}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  Pos: ({combatant.mapX ?? 0}, {combatant.mapY ?? 0})
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-100 truncate mt-0.5">
                {combatant.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onCenterOnMap && (
              <button
                type="button"
                onClick={() => onCenterOnMap(combatant.id)}
                className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-amber-300 transition"
                title="Center on Battlemap"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-stone-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isDm && !combatant.isPlayerChar}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Faction / Role
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'player' | 'ally' | 'enemy')}
                disabled={!isDm}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              >
                <option value="player">Player Character</option>
                <option value="ally">Ally / Companion</option>
                <option value="enemy">Hostile Enemy</option>
              </select>
            </div>
          </div>

          {/* Combat Stats: HP, AC, Speed, Fly Speed */}
          <div className="grid grid-cols-5 gap-2 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-mono text-stone-400 uppercase mb-1">
                <Heart className="w-3 h-3 text-rose-500" />
                <span>HP Now</span>
              </label>
              <input
                type="number"
                value={hpCurrent}
                onChange={(e) => setHpCurrent(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-mono text-stone-400 uppercase mb-1">
                <Heart className="w-3 h-3 text-stone-500" />
                <span>Max HP</span>
              </label>
              <input
                type="number"
                value={hpMax}
                onChange={(e) => setHpMax(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-stone-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-mono text-stone-400 uppercase mb-1">
                <Shield className="w-3 h-3 text-blue-400" />
                <span>Armor AC</span>
              </label>
              <input
                type="number"
                value={armorClass}
                onChange={(e) => setArmorClass(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-mono text-stone-400 uppercase mb-1">
                <Footprints className="w-3 h-3 text-emerald-400" />
                <span>Speed ft</span>
              </label>
              <input
                type="number"
                step="5"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-mono text-sky-400 uppercase mb-1">
                <span>✈️ Fly ft</span>
              </label>
              <input
                type="number"
                step="5"
                value={flySpeed}
                onChange={(e) => setFlySpeed(e.target.value)}
                placeholder="0"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Elevation, Melee Reach & Grid Size */}
          <div className="bg-stone-950/40 p-3 rounded-xl border border-stone-800/80 space-y-2.5">
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-mono text-stone-400 uppercase mb-1">
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Altitude (ft)</span>
                </label>
                <input
                  type="number"
                  step="5"
                  value={elevationFeet}
                  onChange={(e) => setElevationFeet(e.target.value)}
                  placeholder="0"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                  Reach (ft)
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  value={reachFeet}
                  onChange={(e) => setReachFeet(e.target.value)}
                  placeholder="5"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                  Token Size
                </label>
                <select
                  value={tokenSize}
                  onChange={(e) => setTokenSize(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="1">1x1 (Medium)</option>
                  <option value="2">2x2 (Large)</option>
                  <option value="3">3x3 (Huge)</option>
                  <option value="4">4x4 (Gargantuan)</option>
                </select>
              </div>
            </div>

            {/* Quick Altitude Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-stone-500 uppercase">Presets:</span>
              {availablePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setElevationFeet(String(preset))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    parseInt(elevationFeet, 10) === preset
                      ? 'bg-sky-600 text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {preset === 0 ? 'Ground (0)' : `+${preset} ft`}
                </button>
              ))}
            </div>

            {isSheltered && (
              <div className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-[10px] font-mono text-amber-300 flex items-center justify-between">
                <span>🏠 Indoors (Ceiling: {ceilingFeet}ft)</span>
                <span>Max Altitude: {maxAllowedElevation}ft (5e RAW)</span>
              </div>
            )}

            {/* Hover Capability Checkbox */}
            <label className="flex items-center gap-2 pt-1 border-t border-stone-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHover}
                onChange={(e) => setHasHover(e.target.checked)}
                className="rounded border-stone-700 bg-stone-950 text-sky-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] text-stone-300 font-medium select-none">
                🕊️ <strong>Hover Capability</strong> (Immune to falling plunge damage when Prone or Incapacitated)
              </span>
            </label>
          </div>

          {/* Light Source */}
          <div>
            <label className="flex items-center gap-1 text-[11px] font-mono text-stone-400 uppercase mb-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Token Light Source</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: 'Off', icon: '🌑' },
                { id: 'torch', label: 'Torch (20ft)', icon: '🕯️' },
                { id: 'lantern', label: 'Lantern (30ft)', icon: '🏮' },
                { id: 'magical_light', label: 'Spell (20ft)', icon: '✨' }
              ].map((ls) => (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => setLightSource(ls.id as LightSourceType)}
                  className={`px-2 py-1.5 text-xs rounded-lg border flex items-center justify-center gap-1 transition ${
                    lightSource === ls.id
                      ? 'bg-amber-950/80 border-amber-600 text-amber-200 font-bold'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>{ls.icon}</span>
                  <span className="truncate">{ls.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1.5">
              Status Conditions
            </label>
            <div className="flex flex-wrap gap-1">
              {commonConditions.map((cName) => {
                const active = conditions.includes(cName);
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => handleToggleCondition(cName)}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition ${
                      active
                        ? 'bg-rose-950/80 border-rose-600 text-rose-200 font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                onRemoveFromMap(combatant.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-amber-300 hover:text-rose-200 border border-stone-700 hover:border-rose-700 text-xs font-semibold transition cursor-pointer"
              title="Remove from battlemap and move to staging reserve tray"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Remove from Map</span>
            </button>

            {onDeleteFromEncounter && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-950/90 px-2 py-1 rounded-lg border border-rose-800">
                  <span className="text-[10px] text-rose-300 font-bold">Delete permanently?</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      onDeleteFromEncounter(combatant.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-1.5 py-0.5 rounded border border-stone-700 text-stone-300 text-[11px] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 border border-rose-900/60 text-xs transition cursor-pointer"
                  title="Delete combatant from encounter entirely"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Encounter Combatant</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
