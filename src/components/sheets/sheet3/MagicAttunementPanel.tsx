import React from 'react';
import { CharacterData, GearItem } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { recalculateCharacterAC, getMaxAttunementSlots } from '../../../utils/dndCalculations';
import { Sparkles, ShieldCheck, Zap, Lock, Unlock, AlertCircle, Plus, CheckCircle2, Award, Shield } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface MagicAttunementPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const MagicAttunementPanel: React.FC<MagicAttunementPanelProps> = ({
  character,
  onUpdateCharacter
}) => {
  const { t } = useLanguage();
  
  // Use the advanced 5e attunement rules calculator
  const attunementBreakdown = getMaxAttunementSlots(character);
  const maxSlots = attunementBreakdown.maxSlots;

  const inventory = character.inventory || [];
  const attunedItems = inventory.filter(i => i.attuned);
  const slotsUsed = attunedItems.length;

  // Magic / Attunable candidate items in inventory that are not yet attuned
  const candidateItems = inventory.filter(item => {
    if (item.attuned) return false;
    if (item.requiresAttunement) return true;
    if (item.isMagic) return true;
    const notes = (item.notes || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    if (notes.includes('attunement') || notes.includes('attune') || name.includes('wand') || name.includes('ring') || name.includes('cloak') || name.includes('amulet') || name.includes('staff')) {
      return true;
    }
    return false;
  });

  const handleToggleAttune = (itemId: string) => {
    const targetItem = inventory.find(i => i.id === itemId);
    if (!targetItem) return;

    const nextAttunedState = !targetItem.attuned;

    // Prevent attuning beyond max slots
    if (nextAttunedState && slotsUsed >= maxSlots) {
      alert(`Attunement limit reached (${slotsUsed}/${maxSlots} slots occupied). You must unattune an existing item before attuning a new one!`);
      return;
    }

    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          attuned: nextAttunedState,
          isMagic: true
        };
      }
      return item;
    });

    const updatedChar = recalculateCharacterAC({
      ...character,
      inventory: updatedInventory
    });

    onUpdateCharacter(updatedChar);
  };

  return (
    <CollapsibleBox
      title={t('inventory.attunementSlots', 'Magic Item Attunement Slots')}
      icon={<Sparkles className="w-5 h-5 text-purple-400" />}
      storageKey="sheet3_magic_attunement"
      headerExtra={
        <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
          slotsUsed > maxSlots
            ? 'bg-rose-950 text-rose-300 border-rose-600/60'
            : slotsUsed === maxSlots
            ? 'bg-amber-950 text-amber-300 border-amber-600/50'
            : 'bg-purple-950 text-purple-300 border-purple-600/50'
        }`}>
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>{slotsUsed} / {maxSlots} {t('inventory.attuned', 'Attuned')}</span>
        </div>
      }
    >
      <div className="space-y-4 pt-2 text-xs">
        {attunementBreakdown.featureName && (
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-purple-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Award className="w-4 h-4 text-purple-400" />
              {attunementBreakdown.featureName}
            </span>
            <span className="font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/50">
              {maxSlots} Max Attunement Slots
            </span>
          </div>
        )}

        {/* Attunement Slot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: maxSlots }).map((_, index) => {
            const item: GearItem | undefined = attunedItems[index];

            if (item) {
              return (
                <div
                  key={item.id}
                  className="bg-purple-950/40 border border-purple-500/50 rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-md relative overflow-hidden group hover:border-purple-400 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-900/80 rounded-lg text-purple-300 shrink-0 border border-purple-600/50">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <span className="font-bold text-purple-200 block text-sm leading-tight">{item.name}</span>
                        <span className="text-[10px] text-purple-400 font-mono">
                          Slot #{index + 1} &bull; {item.equipped ? t('inventory.equipped', 'Equipped') : 'Carried'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAttune(item.id)}
                      className="text-[10px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 px-2 py-1 rounded-lg font-bold font-mono transition shrink-0 cursor-pointer"
                      title="Unattune this magic item"
                    >
                      Unattune
                    </button>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-stone-300 font-sans italic line-clamp-2 bg-stone-950/60 p-1.5 rounded border border-purple-900/40">
                      {item.notes}
                    </p>
                  )}

                  {/* Active Attunement Benefits */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-900/40 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-purple-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Active Bond
                    </span>
                    {item.spellDcBonus && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded font-bold">
                        +{item.spellDcBonus} DC
                      </span>
                    )}
                    {item.spellAttackBonus && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded font-bold">
                        +{item.spellAttackBonus} Spell Atk
                      </span>
                    )}
                    {item.acBonus && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-bold">
                        +{item.acBonus} AC
                      </span>
                    )}
                    {item.abilitySetters && Object.entries(item.abilitySetters).map(([abil, val]) => val && (
                      <span key={abil} className="bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-1.5 py-0.5 rounded font-bold">
                        {abil} = {val}
                      </span>
                    ))}
                    {item.abilityBonuses && Object.entries(item.abilityBonuses).map(([abil, val]) => val && (
                      <span key={abil} className="bg-blue-950 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded font-bold">
                        +{val} {abil}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty-slot-${index}`}
                className="bg-stone-950/80 border border-dashed border-stone-800 rounded-xl p-3 flex flex-col items-center justify-center text-center text-stone-500 space-y-1.5 min-h-[90px]"
              >
                <div className="p-1.5 bg-stone-900 rounded-full text-stone-600">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-400 font-mono">Attunement Slot #{index + 1}</span>
                <span className="text-[10px] text-stone-500">Unused / Available</span>
              </div>
            );
          })}
        </div>

        {/* Unattuned Magic / Attunable Items in Inventory */}
        {candidateItems.length > 0 && (
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Magic Items in Inventory Awaiting Attunement ({candidateItems.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidateItems.map(item => (
                <div
                  key={item.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-stone-700 transition"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-stone-200 block text-xs truncate">{item.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {item.itemType || 'Magic Gear'} &bull; {item.equipped ? t('inventory.equipped', 'Equipped') : 'Carried'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAttune(item.id)}
                    disabled={slotsUsed >= maxSlots}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-900 hover:bg-purple-800 disabled:opacity-40 disabled:hover:bg-purple-900 text-purple-100 border border-purple-500/50 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                    title={slotsUsed >= maxSlots ? 'All Attunement Slots Occupied' : 'Attune to this magic item'}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Attune
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attunement Rules Note */}
        <div className="bg-stone-950/60 border border-stone-800 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-stone-400 font-sans">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-300 font-bold block">5e Attunement Rules:</strong>
            Attuning to a magic item requires spending a Short Rest (1 hour) focused on the item. {attunementBreakdown.reason}. Attunement activates magical ability score modifications, stat setters, spell bonuses, and protective properties.
          </div>
        </div>
      </div>
    </CollapsibleBox>
  );
};

