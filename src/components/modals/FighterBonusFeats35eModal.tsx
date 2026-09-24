import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eFighterStats,
  OFFICIAL_35E_FIGHTER_BONUS_FEATS
} from '../../utils/calculators/classFeatures35eCalculators';
import {
  Shield,
  Sword,
  Target,
  Sparkles,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Info
} from 'lucide-react';

interface FighterBonusFeats35eModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const FighterBonusFeats35eModal: React.FC<FighterBonusFeats35eModalProps> = ({
  isOpen,
  onClose,
  character,
  onUpdateCharacter
}) => {
  const stats = calculate35eFighterStats(character);
  const [activeTab, setActiveTab] = useState<'bonus_feats' | 'specialization' | 'catalog'>('bonus_feats');
  const [newWeaponName, setNewWeaponName] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const currentFeats = stats.bonusFeatsChosen;
  const currentSpecs = character.fighterData35e?.weaponSpecializations || [];

  const handleToggleBonusFeat = (featName: string) => {
    let next: string[];
    if (currentFeats.includes(featName)) {
      next = currentFeats.filter(f => f !== featName);
    } else {
      if (currentFeats.length >= stats.bonusFeatsMax) {
        return; // Max reached
      }
      next = [...currentFeats, featName];
    }

    onUpdateCharacter({
      ...character,
      fighterData35e: {
        ...character.fighterData35e,
        bonusFeatsChosen: next
      }
    });
  };

  const handleAddWeaponSpec = () => {
    if (!newWeaponName.trim()) return;
    const exists = currentSpecs.some(s => s.weaponName.toLowerCase() === newWeaponName.trim().toLowerCase());
    if (exists) return;

    const next = [
      ...currentSpecs,
      {
        weaponName: newWeaponName.trim(),
        hasWeaponFocus: true,
        hasWeaponSpecialization: stats.canTakeWeaponSpecialization,
        hasGreaterWeaponFocus: false,
        hasGreaterWeaponSpecialization: false
      }
    ];

    onUpdateCharacter({
      ...character,
      fighterData35e: {
        ...character.fighterData35e,
        weaponSpecializations: next
      }
    });
    setNewWeaponName('');
  };

  const handleToggleSpecField = (weaponName: string, field: 'hasWeaponFocus' | 'hasWeaponSpecialization' | 'hasGreaterWeaponFocus' | 'hasGreaterWeaponSpecialization') => {
    const next = currentSpecs.map(s => {
      if (s.weaponName !== weaponName) return s;
      return {
        ...s,
        [field]: !s[field]
      };
    });

    onUpdateCharacter({
      ...character,
      fighterData35e: {
        ...character.fighterData35e,
        weaponSpecializations: next
      }
    });
  };

  const handleRemoveWeaponSpec = (weaponName: string) => {
    const next = currentSpecs.filter(s => s.weaponName !== weaponName);
    onUpdateCharacter({
      ...character,
      fighterData35e: {
        ...character.fighterData35e,
        weaponSpecializations: next
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-700/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/40 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950/80 border border-red-600/60 rounded-xl text-red-300">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-amber-200 font-serif">Fighter Martial Progression</h2>
                <span className="px-2 py-0.5 bg-red-950/70 border border-red-800 text-red-300 rounded text-xs font-mono">
                  Level {stats.fighterLevel} Fighter
                </span>
                <span className="px-2 py-0.5 bg-stone-800 border border-stone-700 text-stone-300 rounded text-xs font-mono">
                  PHB p. 37-39
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Bonus Combat Feat progression and exclusive Fighter Weapon Specialization
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

        {/* Milestone Tracker Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-stone-950/40 border-b border-stone-800 text-xs">
          <div className="bg-stone-900/80 border border-amber-900/40 p-2.5 rounded-xl">
            <div className="text-stone-400 font-medium">Bonus Feat Slots</div>
            <div className="text-base font-bold text-amber-400 mt-0.5 font-mono">
              {currentFeats.length} / {stats.bonusFeatsMax} chosen
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${stats.canTakeWeaponSpecialization ? 'bg-amber-950/30 border-amber-700/60 text-amber-200' : 'bg-stone-900/60 border-stone-800 text-stone-500'}`}>
            <div className="font-medium">Weapon Specialization</div>
            <div className="text-xs font-bold mt-0.5">
              {stats.canTakeWeaponSpecialization ? 'Unlocked (Lvl 4+)' : 'Locked (Req. Lvl 4)'}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${stats.canTakeGreaterWeaponFocus ? 'bg-amber-950/30 border-amber-700/60 text-amber-200' : 'bg-stone-900/60 border-stone-800 text-stone-500'}`}>
            <div className="font-medium">Greater Weapon Focus</div>
            <div className="text-xs font-bold mt-0.5">
              {stats.canTakeGreaterWeaponFocus ? 'Unlocked (Lvl 8+)' : 'Locked (Req. Lvl 8)'}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${stats.canTakeGreaterWeaponSpecialization ? 'bg-amber-950/30 border-amber-700/60 text-amber-200' : 'bg-stone-900/60 border-stone-800 text-stone-500'}`}>
            <div className="font-medium">Greater Weapon Spec.</div>
            <div className="text-xs font-bold mt-0.5">
              {stats.canTakeGreaterWeaponSpecialization ? 'Unlocked (Lvl 12+)' : 'Locked (Req. Lvl 12)'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-4 pt-2">
          <button
            onClick={() => setActiveTab('bonus_feats')}
            className={`px-4 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'bonus_feats'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            Assigned Bonus Feats ({currentFeats.length}/{stats.bonusFeatsMax})
          </button>
          <button
            onClick={() => setActiveTab('specialization')}
            className={`px-4 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'specialization'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            Weapon Specializations ({currentSpecs.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'catalog'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-300'
            }`}
          >
            Fighter Feat Catalog ({OFFICIAL_35E_FIGHTER_BONUS_FEATS.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: ASSIGNED BONUS FEATS */}
          {activeTab === 'bonus_feats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-200">Fighter Bonus Feats</h3>
                  <p className="text-xs text-stone-400">
                    A fighter gets a bonus combat feat at 1st level, 2nd level, and every 2 levels thereafter (PHB p. 38).
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {stats.bonusFeatsMax - currentFeats.length} slots remaining
                </div>
              </div>

              {currentFeats.length === 0 ? (
                <div className="p-6 bg-stone-950/60 border border-dashed border-stone-800 rounded-xl text-center">
                  <Shield className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                  <p className="text-stone-400 text-xs">No bonus feats assigned yet.</p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="mt-3 px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-bold transition"
                  >
                    Browse Fighter Feats Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentFeats.map((featName, idx) => {
                    const featDef = OFFICIAL_35E_FIGHTER_BONUS_FEATS.find(f => f.name === featName);
                    return (
                      <div
                        key={idx}
                        className="bg-stone-950/70 border border-amber-900/40 p-3 rounded-xl flex items-start justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-950 border border-amber-700/60 text-amber-300 text-[10px] font-mono font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-amber-200">{featName}</span>
                          </div>
                          {featDef && (
                            <>
                              <div className="text-[11px] text-stone-400">
                                <span className="text-stone-500 font-semibold">Prereq:</span> {featDef.prereq}
                              </div>
                              <p className="text-xs text-stone-300 leading-snug">{featDef.benefit}</p>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleBonusFeat(featName)}
                          className="p-1 text-stone-500 hover:text-red-400 rounded transition"
                          title="Remove from bonus feats"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEAPON SPECIALIZATION */}
          {activeTab === 'specialization' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-relaxed">
                  <span className="font-bold text-amber-300">Fighter Signature Mastery:</span> Only Fighters can select <strong>Weapon Specialization</strong> (+2 damage, 4th level) and <strong>Greater Weapon Specialization</strong> (+2 damage, 12th level), unlocking unmatched prowess with their chosen armament.
                </div>
              </div>

              {/* Add Weapon Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter weapon name (e.g. Longsword, Greatsword, Longbow)..."
                  value={newWeaponName}
                  onChange={(e) => setNewWeaponName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWeaponSpec()}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
                />
                <button
                  onClick={handleAddWeaponSpec}
                  disabled={!newWeaponName.trim()}
                  className="px-4 py-2 bg-amber-900/80 hover:bg-amber-800 disabled:opacity-50 text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Weapon
                </button>
              </div>

              {/* Weapon List */}
              {currentSpecs.length === 0 ? (
                <div className="p-6 bg-stone-950/60 border border-dashed border-stone-800 rounded-xl text-center text-xs text-stone-500">
                  No specialized weapons configured yet. Add a weapon above to track Focus and Specialization bonuses.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.weaponSpecializations.map((spec) => (
                    <div
                      key={spec.weaponName}
                      className="bg-stone-950/70 border border-stone-800 hover:border-amber-900/60 p-3.5 rounded-xl transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sword className="w-4 h-4 text-amber-400" />
                          <h4 className="font-bold text-sm text-stone-100">{spec.weaponName}</h4>
                          <span className="px-2 py-0.5 bg-amber-950 border border-amber-700/60 text-amber-300 rounded text-xs font-mono font-bold">
                            +{spec.totalAttackBonus} Attack / +{spec.totalDamageBonus} Damage
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveWeaponSpec(spec.weaponName)}
                          className="p-1 text-stone-500 hover:text-red-400 transition"
                          title="Remove weapon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800/80 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={spec.hasWeaponFocus || false}
                            onChange={() => handleToggleSpecField(spec.weaponName, 'hasWeaponFocus')}
                            className="rounded border-stone-700 text-amber-600 focus:ring-0 bg-stone-900"
                          />
                          <span className="text-stone-300">Weapon Focus (+1 Atk)</span>
                        </label>

                        <label className={`flex items-center gap-1.5 ${stats.canTakeWeaponSpecialization ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!stats.canTakeWeaponSpecialization}
                            checked={spec.hasWeaponSpecialization || false}
                            onChange={() => handleToggleSpecField(spec.weaponName, 'hasWeaponSpecialization')}
                            className="rounded border-stone-700 text-amber-600 focus:ring-0 bg-stone-900"
                          />
                          <span className="text-stone-300">Weapon Spec (+2 Dmg)</span>
                        </label>

                        <label className={`flex items-center gap-1.5 ${stats.canTakeGreaterWeaponFocus ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!stats.canTakeGreaterWeaponFocus}
                            checked={spec.hasGreaterWeaponFocus || false}
                            onChange={() => handleToggleSpecField(spec.weaponName, 'hasGreaterWeaponFocus')}
                            className="rounded border-stone-700 text-amber-600 focus:ring-0 bg-stone-900"
                          />
                          <span className="text-stone-300">Gr. Focus (+1 Atk)</span>
                        </label>

                        <label className={`flex items-center gap-1.5 ${stats.canTakeGreaterWeaponSpecialization ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!stats.canTakeGreaterWeaponSpecialization}
                            checked={spec.hasGreaterWeaponSpecialization || false}
                            onChange={() => handleToggleSpecField(spec.weaponName, 'hasGreaterWeaponSpecialization')}
                            className="rounded border-stone-700 text-amber-600 focus:ring-0 bg-stone-900"
                          />
                          <span className="text-stone-300">Gr. Spec (+2 Dmg)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search official Fighter bonus feats..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {OFFICIAL_35E_FIGHTER_BONUS_FEATS.filter(f =>
                  f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                  f.benefit.toLowerCase().includes(filterQuery.toLowerCase())
                ).map((feat) => {
                  const isAssigned = currentFeats.includes(feat.name);
                  const isLockedByLevel = feat.levelReq ? stats.fighterLevel < feat.levelReq : false;

                  return (
                    <div
                      key={feat.name}
                      onClick={() => !isLockedByLevel && handleToggleBonusFeat(feat.name)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isAssigned
                          ? 'bg-amber-950/40 border-amber-600/70 text-amber-100'
                          : isLockedByLevel
                          ? 'bg-stone-950/30 border-stone-800/40 opacity-50 cursor-not-allowed'
                          : 'bg-stone-950/70 border-stone-800 hover:border-amber-900/60 text-stone-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{feat.name}</span>
                          {isAssigned && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                            </span>
                          )}
                          {isLockedByLevel && (
                            <span className="text-[10px] text-red-400 font-bold">
                              Req. Level {feat.levelReq}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          <span className="text-stone-500 font-semibold">Prereq:</span> {feat.prereq}
                        </div>
                        <p className="text-xs text-stone-300 line-clamp-2">{feat.benefit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs">
          <div className="text-stone-400">
            Total Fighter Bonus Feats: <strong className="text-amber-300">{currentFeats.length}</strong> of <strong className="text-stone-200">{stats.bonusFeatsMax}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-900/80 hover:bg-amber-800 text-amber-200 rounded-xl font-bold transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
