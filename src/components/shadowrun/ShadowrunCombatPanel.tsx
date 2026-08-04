import React, { useState } from 'react';
import { CharacterData, ShadowrunData, Attack } from '../../types';
import { Crosshair, Shield, Dices, Plus, Trash2, Zap, Cpu, Radio, Sparkles, Flame } from 'lucide-react';

interface ShadowrunCombatPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRollPool: (label: string, poolSize: number) => void;
}

export const ShadowrunCombatPanel: React.FC<ShadowrunCombatPanelProps> = ({
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

  const updateSR = (patch: Partial<ShadowrunData>) => {
    onUpdateCharacter({
      ...character,
      shadowrun: {
        ...sr,
        ...patch
      }
    });
  };

  const totalDamage = sr.physicalBoxesCurrent + sr.stunBoxesCurrent;
  const woundMod = -Math.floor(totalDamage / 3);

  // Default Shadowrun Weapons if character attacks are default D&D attacks
  const srAttacks = character.attacks && character.attacks.length > 0 ? character.attacks : [
    {
      id: 'sr-atk-1',
      name: 'Ares Predator VI',
      attackBonus: sr.agi + 6, // Agility 5 + Firearms 6
      damage: '8P',
      damageType: 'Physical',
      range: 'Heavy Pistol (AP -2, Mode SA/BF, RC 2)',
      notes: 'Smartlink included. Clip: 15(c)'
    },
    {
      id: 'sr-atk-2',
      name: 'HK 227 Submachine Gun',
      attackBonus: sr.agi + 5,
      damage: '7P',
      damageType: 'Physical',
      range: 'SMG (AP -1, Mode SA/BF/FA, RC 3)',
      notes: 'Suppressor attached. Clip: 32(c)'
    },
    {
      id: 'sr-atk-3',
      name: 'Monofilament Whip',
      attackBonus: sr.agi + 5,
      damage: '12P',
      damageType: 'Physical',
      range: 'Melee (AP -8, Reach 2)',
      notes: 'Extremely lethal. Glitch cuts user!'
    }
  ];

  const [newAtkName, setNewAtkName] = useState('');
  const [newAtkBonus, setNewAtkBonus] = useState(10);
  const [newAtkDamage, setNewAtkDamage] = useState('8P');
  const [newAtkRange, setNewAtkRange] = useState('Heavy Pistol (AP -2)');
  const [newAtkNotes, setNewAtkNotes] = useState('');

  const handleAddAttack = () => {
    if (!newAtkName.trim()) return;
    const newAtk: Attack = {
      id: 'atk-' + Date.now(),
      name: newAtkName.trim(),
      attackBonus: newAtkBonus,
      damage: newAtkDamage.trim(),
      damageType: 'Physical',
      range: newAtkRange.trim(),
      notes: newAtkNotes.trim()
    };
    onUpdateCharacter({
      ...character,
      attacks: [...srAttacks, newAtk]
    });
    setNewAtkName('');
    setNewAtkNotes('');
  };

  const handleDeleteAttack = (id: string) => {
    onUpdateCharacter({
      ...character,
      attacks: srAttacks.filter(a => a.id !== id)
    });
  };

  // Armor & Defense calculations
  const totalArmor = sr.ballisticArmor;
  const damageResistancePool = Math.max(1, sr.bod + totalArmor);
  const defensePool = Math.max(1, sr.rea + sr.int + woundMod);

  return (
    <div className="space-y-6">
      {/* COMBAT & DEFENSE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DEFENSE POOL */}
        <div className="bg-stone-900 border border-cyan-600/50 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs font-serif font-bold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" /> Defense Pool (REA + INT)
            </span>
            <span className="text-sm font-mono text-cyan-100">{defensePool}d6</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Reaction ({sr.rea}) + Intuition ({sr.int}) {woundMod < 0 ? `+ Wound (${woundMod})` : ''}
          </p>
          <button
            onClick={() => onRollPool('Defense Roll (Rodge / Full Defense)', defensePool)}
            className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/60 rounded-xl text-cyan-200 text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow"
          >
            <Dices className="w-4 h-4" /> Roll Defense Pool ({defensePool}d6)
          </button>
        </div>

        {/* DAMAGE RESISTANCE POOL */}
        <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs font-serif font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" /> Damage Resistance (BOD + Armor)
            </span>
            <span className="text-sm font-mono text-amber-100">{damageResistancePool}d6</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Body ({sr.bod}) + Ballistic Armor ({sr.ballisticArmor})
          </p>
          <button
            onClick={() => onRollPool('Damage Soak Roll', damageResistancePool)}
            className="w-full py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 rounded-xl text-amber-200 text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow"
          >
            <Dices className="w-4 h-4" /> Roll Soak ({damageResistancePool}d6)
          </button>
        </div>

        {/* INITIATIVE MODES */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-lg space-y-2">
          <span className="text-xs font-serif font-bold text-stone-200 block">Initiative Passes & Modes</span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Physical:</span>
              <span className="text-cyan-300 font-bold">{sr.rea + sr.int} + 1d6</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Astral:</span>
              <span className="text-purple-300 font-bold">{sr.int * 2} + 2d6</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Matrix Cold Sim:</span>
              <span className="text-blue-300 font-bold">{sr.int + 3} + 2d6</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-stone-400">Matrix Hot Sim:</span>
              <span className="text-rose-300 font-bold">{sr.int + 3} + 3d6</span>
            </div>
          </div>
        </div>
      </div>

      {/* WEAPONS & COMBAT ACTIONS */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="text-lg font-bold font-serif text-cyan-300 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-cyan-400" /> Firearms, Melee Weapons & Combat Arsenal
          </h3>
          <span className="text-xs text-stone-400 font-mono">Shadowrun 5e Weapon Matrix</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {srAttacks.map((atk) => {
            const attackPool = Math.max(1, atk.attackBonus + woundMod);

            return (
              <div
                key={atk.id}
                className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2 hover:border-cyan-500/50 transition group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                      {atk.name}
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600/50 text-cyan-300">
                        {atk.damage}
                      </span>
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5 font-mono">{atk.range}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAttack(atk.id)}
                    className="text-stone-600 hover:text-rose-400 p-1 opacity-50 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {atk.notes && <p className="text-xs text-stone-300 italic">{atk.notes}</p>}

                <div className="pt-2 flex items-center justify-between border-t border-stone-900">
                  <span className="text-xs font-mono text-stone-400">
                    Attack Pool: {atk.attackBonus}d6 {woundMod < 0 ? `(${woundMod})` : ''}
                  </span>

                  <button
                    onClick={() => onRollPool(`${atk.name} Attack Test`, attackPool)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <Dices className="w-4 h-4" /> Roll Attack ({attackPool}d6)
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD WEAPON FORM */}
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl space-y-3 pt-3">
          <span className="text-xs font-bold text-cyan-300 block font-serif">Add Weapon to Arsenal</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Weapon Name (e.g., Ares Alpha Assault Rifle)"
              value={newAtkName}
              onChange={(e) => setNewAtkName(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Attack Dice Pool"
              value={newAtkBonus}
              onChange={(e) => setNewAtkBonus(parseInt(e.target.value) || 0)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-center text-cyan-300"
            />
            <input
              type="text"
              placeholder="Damage Code (e.g. 11P)"
              value={newAtkDamage}
              onChange={(e) => setNewAtkDamage(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-center text-amber-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="AP & Firing Modes (e.g., AP -2, Mode SA/BF/FA)"
              value={newAtkRange}
              onChange={(e) => setNewAtkRange(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-cyan-500 md:col-span-2"
            />
            <button
              onClick={handleAddAttack}
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Weapon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
