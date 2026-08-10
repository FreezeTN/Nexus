import React, { useState } from 'react';
import { CharacterData, Feat } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { saveCustomCompendiumEntry } from '../../../data/compendiumData';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import {
  OFFICIAL_5E_FEATS,
  OFFICIAL_35E_FEATS
} from '../../../data/srdRulesLibrary';
import { Star, Plus, Trash2, Search } from 'lucide-react';

interface FeatsPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const FeatsPanel: React.FC<FeatsPanelProps> = ({
  character,
  onUpdateCharacter,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const [showAddFeatModal, setShowAddFeatModal] = useState(false);
  const [featModalTab, setFeatModalTab] = useState<'official' | 'custom'>('official');
  const [featSearch, setFeatSearch] = useState('');

  // New Feat Form state
  const [newFeatName, setNewFeatName] = useState('');
  const [newFeatSource, setNewFeatSource] = useState('');
  const [newFeatDesc, setNewFeatDesc] = useState('');
  const [newFeatHpMaxBonus, setNewFeatHpMaxBonus] = useState<number>(0);

  const handleDeleteFeat = (id: string) => {
    onUpdateCharacter({
      ...character,
      feats: character.feats.filter(f => f.id !== id)
    });
  };

  const handleAddOfficialFeat = (featObj: Feat) => {
    const updatedFeats = [
      ...character.feats,
      {
        ...featObj,
        id: 'feat-off-' + Date.now() + Math.random().toString(36).substring(2, 6)
      }
    ];
    onUpdateCharacter({ ...character, feats: updatedFeats });
    setShowAddFeatModal(false);
  };

  const handleAddFeat = () => {
    if (!newFeatName.trim()) return;
    const newFeat: Feat = {
      id: 'feat-' + Date.now(),
      name: newFeatName,
      source: newFeatSource || 'Feat',
      description: newFeatDesc,
      hpMaxBonus: newFeatHpMaxBonus !== 0 ? newFeatHpMaxBonus : undefined
    };
    onUpdateCharacter({
      ...character,
      feats: [...character.feats, newFeat]
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-feat-' + newFeat.id,
        name: newFeat.name,
        category: 'feats',
        edition: character.edition || '5e',
        description: newFeat.description,
        source: newFeat.source || 'Custom Feat',
        isCustom: true,
        tags: [character.edition || '5e', 'Custom'],
        featData: newFeat
      });
    } catch (e) {
      console.error('Failed to auto-add feat to compendium', e);
    }

    setNewFeatName('');
    setNewFeatSource('');
    setNewFeatDesc('');
    setNewFeatHpMaxBonus(0);
    setShowAddFeatModal(false);
  };

  return (
    <>
      <CollapsibleBox
        title="Feats"
        icon={<Star className="w-5 h-5 text-amber-500" />}
        storageKey="sheet1_feats"
        headerExtra={
          <button
            onClick={() => setShowAddFeatModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Feat
          </button>
        }
      >
        <div className="space-y-3 pt-2">
          {character.feats.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2">No feats added yet.</p>
          ) : (
            character.feats.map((feat) => (
              <div
                key={feat.id}
                className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-amber-200 text-sm">{feat.name}</div>
                  <div className="flex items-center gap-1.5">
                    {isShapeshiftAbility(feat.name, feat.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Shapeshift Engine"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(feat.name, feat.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-500/60 rounded-lg font-bold transition text-[11px] flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Animal Companion & Familiar Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFeat(feat.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
              </div>
            ))
          )}
        </div>
      </CollapsibleBox>

      {/* MODAL: Add Feat */}
      {showAddFeatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Add Feat
              </h3>

              <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => setFeatModalTab('official')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featModalTab === 'official' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Official Library ({character.edition === '3.5e' ? '3.5e' : '5e'})
                </button>
                <button
                  onClick={() => setFeatModalTab('custom')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featModalTab === 'custom' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Custom Feat
                </button>
              </div>
            </div>

            {featModalTab === 'official' ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={featSearch}
                    onChange={(e) => setFeatSearch(e.target.value)}
                    placeholder="Search official feats..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  {(character.edition === '3.5e' ? OFFICIAL_35E_FEATS : OFFICIAL_5E_FEATS)
                    .filter(f => f.name.toLowerCase().includes(featSearch.toLowerCase()) || f.description.toLowerCase().includes(featSearch.toLowerCase()))
                    .map((feat) => (
                      <div key={feat.id} className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 text-xs space-y-1.5 hover:border-amber-600/50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                            <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                              {feat.source}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddOfficialFeat(feat)}
                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow transition"
                          >
                            + Add to Sheet
                          </button>
                        </div>
                        <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-stone-400 mb-1">Feat Name *</label>
                  <input
                    type="text"
                    value={newFeatName}
                    onChange={(e) => setNewFeatName(e.target.value)}
                    placeholder="e.g. War Caster"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Source (e.g. PHB p.170)</label>
                  <input
                    type="text"
                    value={newFeatSource}
                    onChange={(e) => setNewFeatSource(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">HP Bonus (e.g. Toughness Feat gives +2 HP/level)</label>
                  <input
                    type="number"
                    value={newFeatHpMaxBonus}
                    onChange={(e) => setNewFeatHpMaxBonus(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Description</label>
                  <textarea
                    value={newFeatDesc}
                    onChange={(e) => setNewFeatDesc(e.target.value)}
                    rows={3}
                    placeholder="Feat effects and features..."
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddFeatModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {featModalTab === 'custom' && (
                <button
                  onClick={handleAddFeat}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save Feat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
