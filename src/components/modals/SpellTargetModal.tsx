import React, { useState } from 'react';
import { CharacterData, Spell } from '../../types';
import { getEffectiveMaxHp } from '../../utils/dndCalculations';
import { isShapeshiftAbility } from '../../data/transformationData';
import { isCompanionSummonAbility } from '../../data/companionData';
import { Wand2, Sparkles, CheckSquare, Square, Shield, X, Users, PawPrint } from 'lucide-react';

interface SpellTargetModalProps {
  spell: Spell;
  caster: CharacterData;
  allCharacters: CharacterData[];
  onClose: () => void;
  onConfirmCast: (spell: Spell, selectedTargetIds: string[], conditionName: string) => void;
}

// Map common 5e spell names to standard status condition names
export function getAutoConditionForSpell(spellName: string): string {
  const name = spellName.toLowerCase().trim();
  if (name.includes('bless')) return 'Bless';
  if (name.includes('bane')) return 'Bane';
  if (name.includes('shield of faith')) return 'Shield of Faith';
  if (name.includes('shield')) return 'Shield';
  if (name.includes('haste')) return 'Haste';
  if (name.includes('guidance')) return 'Guidance';
  if (name.includes('bardic inspiration')) return 'Bardic Inspiration';
  if (name.includes('faerie fire')) return 'Faerie Fire';
  if (name.includes('heroism')) return 'Heroism';
  if (name.includes('aid')) return 'Aid';
  if (name.includes('hold person') || name.includes('hold monster')) return 'Paralyzed';
  if (name.includes('blindness') || name.includes('deafness')) return 'Blinded';
  if (name.includes('invisibility')) return 'Invisible';
  if (name.includes('ray of sickness') || name.includes('poison spray')) return 'Poisoned';
  if (name.includes('barkskin')) return 'Barkskin';
  if (name.includes('fly')) return 'Fly';
  return spellName;
}

export const SpellTargetModal: React.FC<SpellTargetModalProps> = ({
  spell,
  caster,
  allCharacters,
  onClose,
  onConfirmCast
}) => {
  const defaultCond = getAutoConditionForSpell(spell.name);
  const [conditionName, setConditionName] = useState<string>(defaultCond);
  
  // By default, select all non-monster characters if it's a buff, or caster if list is small
  const initialTargetIds = allCharacters
    .filter(c => !c.isMonster && !c.isVendor)
    .map(c => c.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialTargetIds.length > 0 ? initialTargetIds : [caster.id]
  );

  const toggleTarget = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(tId => tId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(allCharacters.map(c => c.id));
  };

  const handleSelectCasterOnly = () => {
    setSelectedIds([caster.id]);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCast(spell, selectedIds, conditionName.trim() || spell.name);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-950 border border-purple-600/50 rounded-xl text-purple-300">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-lg flex items-center gap-2">
                Cast {spell.name}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {spell.level === 0 ? 'Cantrip' : `Level ${spell.level} Spell`} • Caster: <span className="text-amber-400 font-semibold">{caster.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Shapeshift Engine Banner if spell allows transformation */}
          {isShapeshiftAbility(spell.name, spell.description) && (
            <div className="bg-emerald-950/90 border border-emerald-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-200 shadow">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">Shapeshifting Spell Detected</div>
                  <div className="text-[11px] text-emerald-200/80">
                    Use the <strong>Shapeshift Engine</strong> on your sheet header or spellbook to transform form stats!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summoning Companion Banner if spell summons familiar or companion */}
          {isCompanionSummonAbility(spell.name, spell.description) && (
            <div className="bg-teal-950/90 border border-teal-500/60 p-3 rounded-xl flex items-center justify-between text-xs text-teal-200 shadow">
              <div className="flex items-center gap-2">
                <span className="text-xl">🦅</span>
                <div>
                  <div className="font-bold text-teal-300">Summon / Companion Spell Detected</div>
                  <div className="text-[11px] text-teal-200/80">
                    Use the <strong>Summon Companion Engine</strong> on your sheet header or spellbook to conjure and add your companion directly into your Campaign Roster!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Condition Field */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <label className="block text-xs font-bold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Applied Status Effect / Condition
              </span>
              <span className="text-[10px] text-stone-400 font-mono font-normal">Auto-detected from spell</span>
            </label>
            <input
              type="text"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g. Bless, Haste, Shield, Shield of Faith..."
              className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-stone-400 leading-tight">
              Applying <strong className="text-cyan-300">{conditionName || 'this spell'}</strong> will update character status and automatically populate mechanical fields like <strong className="text-amber-300">Extra Attack Bonus</strong> in combat!
            </p>
          </div>

          {/* Target Characters Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Select Targets to Receive Status Effect ({selectedIds.length} selected):
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleSelectCasterOnly}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  Caster Only
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {allCharacters.map(char => {
                const isSelected = selectedIds.includes(char.id);
                const isCaster = char.id === caster.id;
                const activeConds = char.conditions || [];

                return (
                  <div
                    key={char.id}
                    onClick={() => toggleTarget(char.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/80 text-stone-100'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-amber-400">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-stone-600" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-2">
                          <span>{char.name}</span>
                          {isCaster && (
                            <span className="text-[9px] bg-purple-900/80 text-purple-200 border border-purple-500/50 px-1.5 py-0.2 rounded font-mono">
                              Caster
                            </span>
                          )}
                          {char.isMonster && (
                            <span className="text-[9px] bg-rose-900/80 text-rose-200 border border-rose-500/50 px-1.5 py-0.2 rounded font-mono">
                              Monster
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          HP {char.hpCurrent}/{getEffectiveMaxHp(char)} • AC {char.armorClass} • {char.characterClass || 'Adventurer'}
                        </div>
                      </div>
                    </div>

                    {activeConds.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap max-w-[140px] justify-end">
                        {activeConds.slice(0, 2).map((c, idx) => (
                          <span key={idx} className="text-[9px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                            {c}
                          </span>
                        ))}
                        {activeConds.length > 2 && (
                          <span className="text-[9px] text-stone-500 font-mono">+{activeConds.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedIds.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cast & Apply to {selectedIds.length} Target{selectedIds.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
