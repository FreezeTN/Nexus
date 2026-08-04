import React, { useState } from 'react';
import { CharacterData, ShadowrunData, ShadowrunMatrixDevice, ShadowrunVehicle } from '../../types';
import { Cpu, Radio, Shield, Zap, Plus, Trash2, Crosshair, AlertTriangle, Dices } from 'lucide-react';

interface ShadowrunMatrixRiggingPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollPool: (label: string, poolSize: number) => void;
}

export const ShadowrunMatrixRiggingPanel: React.FC<ShadowrunMatrixRiggingPanelProps> = ({
  character,
  onUpdateCharacter,
  onRollPool
}) => {
  const sr: ShadowrunData = character.shadowrun || {
    bod: 5, agi: 5, rea: 4, str: 4, wil: 4, log: 3, int: 4, cha: 3, edg: 3, edgCurrent: 3, ess: 6.0, mag: 0, res: 0,
    nuyen: 25000, karmaCurrent: 10, karmaTotal: 50, streetCred: 2, notoriety: 1, publicAwareness: 0,
    physicalBoxesCurrent: 0, stunBoxesCurrent: 0, overflowBoxesCurrent: 0, ballisticArmor: 12, impactArmor: 10,
    qualities: [], cyberware: [], srSkills: [], vehicles: []
  };

  const matrix: ShadowrunMatrixDevice = sr.matrixDevice || {
    name: 'Transys Avalon Cyberdeck',
    model: 'Transys Avalon Custom',
    deviceRating: 4,
    dataProcessing: 5,
    firewall: 4,
    attack: 3,
    sleaze: 2,
    overwatchScore: 0,
    programsRunning: ['Armor', 'Baby Monitor', 'Exploit', 'Fork']
  };

  const updateSR = (patch: Partial<ShadowrunData>) => {
    onUpdateCharacter({
      ...character,
      shadowrun: {
        ...sr,
        ...patch
      }
    });
  };

  const updateMatrix = (patch: Partial<ShadowrunMatrixDevice>) => {
    updateSR({
      matrixDevice: {
        ...matrix,
        ...patch
      }
    });
  };

  const [newProgName, setNewProgName] = useState('');

  const [newVehName, setNewVehName] = useState('');
  const [newVehType, setNewVehType] = useState<ShadowrunVehicle['type']>('Drone');
  const [newVehHand, setNewVehHand] = useState('4/3');
  const [newVehSpeed, setNewVehSpeed] = useState('4');
  const [newVehBody, setNewVehBody] = useState(4);
  const [newVehArmor, setNewVehArmor] = useState(8);
  const [newVehPilot, setNewVehPilot] = useState(3);
  const [newVehSensor, setNewVehSensor] = useState(3);
  const [newVehMounts, setNewVehMounts] = useState('');

  const handleAddProgram = () => {
    if (!newProgName.trim()) return;
    updateMatrix({
      programsRunning: [...matrix.programsRunning, newProgName.trim()]
    });
    setNewProgName('');
  };

  const handleDeleteProgram = (prog: string) => {
    updateMatrix({
      programsRunning: matrix.programsRunning.filter(p => p !== prog)
    });
  };

  const handleAddVehicle = () => {
    if (!newVehName.trim()) return;
    const v: ShadowrunVehicle = {
      id: 'veh-' + Date.now(),
      name: newVehName.trim(),
      type: newVehType,
      handling: newVehHand.trim(),
      speed: newVehSpeed.trim(),
      acceleration: '2',
      body: newVehBody,
      armor: newVehArmor,
      pilot: newVehPilot,
      sensor: newVehSensor,
      weaponMounts: newVehMounts.trim() || undefined
    };
    updateSR({ vehicles: [...sr.vehicles, v] });
    setNewVehName('');
    setNewVehMounts('');
  };

  const handleDeleteVehicle = (id: string) => {
    updateSR({ vehicles: sr.vehicles.filter(v => v.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* MATRIX DECKING & CYBERDECK SUITE */}
      <div className="bg-stone-900 border border-blue-600/50 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-xl font-bold font-serif text-blue-300 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-blue-400" /> Matrix Cyberdeck & Overwatch Console
            </h3>
            <p className="text-xs text-stone-400">
              Configure Cyberdeck Array attributes, running Matrix programs, and track Overwatch Score (OS).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Overwatch Score (OS) Counter */}
            <div className={`p-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-xs ${
              matrix.overwatchScore >= 40
                ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'
                : matrix.overwatchScore >= 25
                ? 'bg-amber-950 border-amber-500 text-amber-200'
                : 'bg-stone-950 border-stone-800 text-blue-300'
            }`}>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Overwatch Score (OS): {matrix.overwatchScore} / 40</span>
            </div>
          </div>
        </div>

        {/* MATRIX ATTRIBUTES ARRAY */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400">Device Rating</span>
            <input
              type="number"
              min="1"
              max="10"
              value={matrix.deviceRating}
              onChange={(e) => updateMatrix({ deviceRating: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-lg font-mono font-bold text-blue-300 py-1"
            />
          </div>

          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-400">Data Processing</span>
            <input
              type="number"
              min="1"
              max="12"
              value={matrix.dataProcessing}
              onChange={(e) => updateMatrix({ dataProcessing: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-lg font-mono font-bold text-blue-300 py-1"
            />
          </div>

          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Firewall</span>
            <input
              type="number"
              min="1"
              max="12"
              value={matrix.firewall}
              onChange={(e) => updateMatrix({ firewall: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-lg font-mono font-bold text-emerald-300 py-1"
            />
          </div>

          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400">Attack</span>
            <input
              type="number"
              min="1"
              max="12"
              value={matrix.attack}
              onChange={(e) => updateMatrix({ attack: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-lg font-mono font-bold text-rose-300 py-1"
            />
          </div>

          <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-400">Sleaze</span>
            <input
              type="number"
              min="1"
              max="12"
              value={matrix.sleaze}
              onChange={(e) => updateMatrix({ sleaze: parseInt(e.target.value) || 1 })}
              className="w-full bg-stone-900 border border-stone-700 rounded text-center text-lg font-mono font-bold text-purple-300 py-1"
            />
          </div>
        </div>

        {/* QUICK MATRIX ACTIONS & ROLLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onRollPool('Hacking (Hack Target Icon)', sr.log + 4)}
            className="p-3 bg-stone-950 hover:bg-blue-950 border border-blue-600/50 rounded-xl text-left transition group space-y-1"
          >
            <span className="text-xs font-bold text-blue-300 flex items-center justify-between">
              <span>Hack Target Icon</span>
              <span className="font-mono text-xs">{sr.log + 4}d6</span>
            </span>
            <p className="text-[10px] text-stone-400">Logic ({sr.log}) + Hacking (4)</p>
          </button>

          <button
            onClick={() => onRollPool('Matrix Perception (Spot Hidden Icon)', sr.int + 4)}
            className="p-3 bg-stone-950 hover:bg-blue-950 border border-blue-600/50 rounded-xl text-left transition group space-y-1"
          >
            <span className="text-xs font-bold text-blue-300 flex items-center justify-between">
              <span>Matrix Perception</span>
              <span className="font-mono text-xs">{sr.int + 4}d6</span>
            </span>
            <p className="text-[10px] text-stone-400">Intuition ({sr.int}) + Computer (4)</p>
          </button>

          <button
            onClick={() => onRollPool('Cybercombat (Brute Force Attack)', sr.log + 3)}
            className="p-3 bg-stone-950 hover:bg-rose-950 border border-rose-600/50 rounded-xl text-left transition group space-y-1"
          >
            <span className="text-xs font-bold text-rose-300 flex items-center justify-between">
              <span>Cybercombat Attack</span>
              <span className="font-mono text-xs">{sr.log + 3}d6</span>
            </span>
            <p className="text-[10px] text-stone-400">Logic ({sr.log}) + Cybercombat (3)</p>
          </button>
        </div>

        {/* RUNNING PROGRAMS */}
        <div className="space-y-2 pt-2 border-t border-stone-800">
          <span className="text-xs font-bold text-stone-300 block">Loaded Cyberdeck Programs</span>
          <div className="flex flex-wrap gap-2">
            {matrix.programsRunning.map((prog) => (
              <span
                key={prog}
                className="px-2.5 py-1 bg-stone-950 border border-blue-500/40 rounded-lg text-xs font-mono text-blue-200 flex items-center gap-1.5"
              >
                <span>{prog}</span>
                <button
                  onClick={() => handleDeleteProgram(prog)}
                  className="text-stone-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Program Name (e.g., Decryption, Baby Monitor)"
              value={newProgName}
              onChange={(e) => setNewProgName(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-blue-500 w-full"
            />
            <button
              onClick={handleAddProgram}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" /> Load Program
            </button>
          </div>
        </div>
      </div>

      {/* VEHICLES & DRONES (RIGGING) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-lg font-bold font-serif text-amber-300 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" /> Vehicles, Drones & Rigging Interface
          </h3>
          <span className="text-xs text-stone-400 font-mono">Drones & Pilot Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sr.vehicles.length === 0 ? (
            <p className="text-xs text-stone-500 italic col-span-2 py-2">No vehicles or drones registered.</p>
          ) : (
            sr.vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2 hover:border-amber-500/50 transition group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                      {v.name}
                      <span className="text-[10px] bg-amber-950 border border-amber-600/50 px-2 py-0.5 rounded text-amber-300">
                        {v.type}
                      </span>
                    </h4>
                    {v.weaponMounts && (
                      <p className="text-xs text-cyan-400 font-mono mt-0.5">Mounts: {v.weaponMounts}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="text-stone-600 hover:text-rose-400 p-1 opacity-50 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-stone-300 bg-stone-900 p-2 rounded-lg text-center">
                  <div>Handling: <span className="text-amber-300">{v.handling}</span></div>
                  <div>Speed: <span className="text-amber-300">{v.speed}</span></div>
                  <div>Body: <span className="text-amber-300">{v.body}</span></div>
                  <div>Armor: <span className="text-amber-300">{v.armor}</span></div>
                </div>

                <button
                  onClick={() => onRollPool(`Pilot ${v.name} Test`, sr.rea + 3)}
                  className="w-full py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/50 text-amber-200 text-xs font-mono font-bold rounded-lg transition"
                >
                  🎲 Piloting Roll ({sr.rea + 3}d6)
                </button>
              </div>
            ))
          )}
        </div>

        {/* ADD VEHICLE FORM */}
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl space-y-3 pt-3">
          <span className="text-xs font-bold text-amber-300 block font-serif">Add Vehicle or Drone</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Vehicle / Drone Name"
              value={newVehName}
              onChange={(e) => setNewVehName(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 sm:col-span-2"
            />
            <select
              value={newVehType}
              onChange={(e) => setNewVehType(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Drone">Drone</option>
              <option value="Bike">Bike</option>
              <option value="Car">Car</option>
              <option value="VTOL">VTOL</option>
            </select>
            <input
              type="text"
              placeholder="Weapon Mounts"
              value={newVehMounts}
              onChange={(e) => setNewVehMounts(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleAddVehicle}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Register Vehicle / Drone
          </button>
        </div>
      </div>
    </div>
  );
};
