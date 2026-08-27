import React, { useState } from 'react';
import { CharacterData, ClassFeature } from '../../../types';
import { CollapsibleBox } from '../../common/CollapsibleBox';
import { saveCustomCompendiumEntry } from '../../../data/compendiumData';
import { isShapeshiftAbility } from '../../../data/transformationData';
import { isCompanionSummonAbility } from '../../../data/companionData';
import {
  OFFICIAL_5E_CLASS_FEATURES,
  OFFICIAL_35E_CLASS_FEATURES,
  syncClassFeaturesForCharacter
} from '../../../data/srdRulesLibrary';
import { getCombinedLevel } from '../../../utils/dndCalculations';
import { Zap, Sparkles, Plus, Trash2, Search, Lock, Crown } from 'lucide-react';

interface ClassFeaturesPanelProps {
  character: CharacterData;
  isDmRole: boolean;
  onUpdateCharacter: (updated: CharacterData) => void;
  onOpenShapeshift?: () => void;
  onOpenSummonCompanion?: () => void;
}

export const ClassFeaturesPanel: React.FC<ClassFeaturesPanelProps> = ({
  character,
  isDmRole,
  onUpdateCharacter,
  onOpenShapeshift,
  onOpenSummonCompanion
}) => {
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [featureModalTab, setFeatureModalTab] = useState<'official' | 'custom'>('official');
  const [featureSearch, setFeatureSearch] = useState('');

  // New Feature Form state
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureSource, setNewFeatureSource] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureMaxUses, setNewFeatureMaxUses] = useState<string>('');
  const [newFeatureRecharge, setNewFeatureRecharge] = useState<'Short Rest' | 'Long Rest' | 'Special' | 'None'>('Short Rest');

  const effectiveCharacterLevel = getCombinedLevel(character);

  const handleUseFeature = (id: string, delta: number) => {
    const updatedFeatures = character.classFeatures.map(f => {
      if (f.id === id && f.usesMax !== undefined) {
        const remaining = f.usesRemaining ?? f.usesMax;
        const nextUses = Math.max(0, Math.min(f.usesMax, remaining + delta));
        return { ...f, usesRemaining: nextUses };
      }
      return f;
    });
    onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
  };

  const handleDeleteFeature = (id: string) => {
    onUpdateCharacter({
      ...character,
      classFeatures: character.classFeatures.filter(f => f.id !== id)
    });
  };

  const handleAddOfficialFeature = (featObj: ClassFeature & { reqLevel?: number }) => {
    const reqLevel = featObj.reqLevel || 1;
    if (reqLevel > effectiveCharacterLevel && !isDmRole) {
      alert(`🔒 Perk Locked: "${featObj.name}" requires Level ${reqLevel} (Your Level: ${effectiveCharacterLevel}). Class features unlock automatically as you level up. Ask your DM to grant early!`);
      return;
    }

    const updatedFeatures = [
      ...character.classFeatures,
      {
        ...featObj,
        id: 'cf-off-' + Date.now() + Math.random().toString(36).substring(2, 6),
        usesRemaining: featObj.usesMax
      }
    ];
    onUpdateCharacter({ ...character, classFeatures: updatedFeatures });
    setShowAddFeatureModal(false);
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    const maxUsesNum = parseInt(newFeatureMaxUses);
    const newFeature: ClassFeature = {
      id: 'cf-' + Date.now(),
      name: newFeatureName,
      source: newFeatureSource || 'Custom',
      description: newFeatureDesc,
      usesMax: !isNaN(maxUsesNum) ? maxUsesNum : undefined,
      usesRemaining: !isNaN(maxUsesNum) ? maxUsesNum : undefined,
      recharge: newFeatureRecharge
    };
    onUpdateCharacter({
      ...character,
      classFeatures: [...character.classFeatures, newFeature]
    });

    try {
      saveCustomCompendiumEntry({
        id: 'comp-feat-' + newFeature.id,
        name: newFeature.name,
        category: 'features',
        edition: character.edition || '5e',
        description: newFeature.description,
        source: newFeature.source || 'Custom Feature',
        isCustom: true,
        tags: [character.edition || '5e', 'Custom'],
        featureData: newFeature
      });
    } catch (e) {
      console.error('Failed to auto-add feature to compendium', e);
    }

    setNewFeatureName('');
    setNewFeatureSource('');
    setNewFeatureDesc('');
    setNewFeatureMaxUses('');
    setShowAddFeatureModal(false);
  };

  return (
    <>
      <CollapsibleBox
        title="Class Features"
        icon={<Zap className="w-5 h-5 text-amber-500" />}
        storageKey="sheet1_features"
        headerExtra={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const synced = syncClassFeaturesForCharacter(character, character.characterClass, character.level, character.edition);
                onUpdateCharacter(synced);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-600/60 text-amber-300 rounded-lg text-xs font-bold transition shadow"
              title={`Auto-add official ${character.characterClass} features for level ${character.level}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Sync Class ({character.characterClass})
            </button>
            <button
              onClick={() => setShowAddFeatureModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Feature
            </button>
          </div>
        }
      >
        <div className="space-y-3 pt-2">
          {character.classFeatures.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2">No class features recorded yet.</p>
          ) : (
            character.classFeatures.map((feature) => (
              <div
                key={feature.id}
                className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-serif font-bold text-amber-200 text-sm">{feature.name}</span>
                    <span className="ml-2 text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full font-sans">
                      {feature.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isShapeshiftAbility(feature.name, feature.description) && (
                      <button
                        onClick={onOpenShapeshift}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Shapeshift Engine for this feature"
                      >
                        <span>🐾</span>
                        <span>Shapeshift</span>
                      </button>
                    )}
                    {isCompanionSummonAbility(feature.name, feature.description) && (
                      <button
                        onClick={onOpenSummonCompanion}
                        className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-500/60 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                        title="Launch Nexus Companion & Summon Engine"
                      >
                        <span>🦅</span>
                        <span>Summon</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 transition"
                      title="Delete Feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-stone-300 text-xs leading-relaxed">{feature.description}</p>

                {/* Usages Counter & Recharge */}
                {feature.usesMax !== undefined && (
                  <div className="flex items-center justify-between bg-stone-900 p-2 rounded-lg border border-stone-800 mt-1">
                    <div className="text-stone-400 text-[11px] font-mono">
                      Uses: <span className="text-amber-300 font-bold">{feature.usesRemaining}</span> / {feature.usesMax}
                      {feature.recharge && (
                        <span className="ml-2 text-stone-500 text-[10px]">({feature.recharge})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUseFeature(feature.id, -1)}
                        className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUseFeature(feature.id, 1)}
                        className="px-2 py-0.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CollapsibleBox>

      {/* MODAL: Add Class Feature */}
      {showAddFeatureModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-stone-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Add Class Feature
              </h3>

              <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  onClick={() => setFeatureModalTab('official')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featureModalTab === 'official' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Official Library ({character.edition === '3.5e' ? '3.5e' : '5e'})
                </button>
                <button
                  onClick={() => setFeatureModalTab('custom')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    featureModalTab === 'custom' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Custom Feature
                </button>
              </div>
            </div>

            {featureModalTab === 'official' ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Search official class features..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  {(character.edition === '3.5e' ? OFFICIAL_35E_CLASS_FEATURES : OFFICIAL_5E_CLASS_FEATURES)
                    .filter(f => f.name.toLowerCase().includes(featureSearch.toLowerCase()) || f.description.toLowerCase().includes(featureSearch.toLowerCase()) || f.className.toLowerCase().includes(featureSearch.toLowerCase()))
                    .map((feat) => {
                      const reqLevel = (feat as any).reqLevel || 1;
                      const isLocked = reqLevel > effectiveCharacterLevel;

                      return (
                        <div key={feat.id} className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                          isLocked ? 'bg-stone-950/40 border-stone-800/80 opacity-80' : 'bg-stone-950/80 border-stone-800 hover:border-amber-600/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-serif font-bold text-amber-200 text-sm">{feat.name}</span>
                              <span className="ml-2 text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                                {feat.source}
                              </span>
                              {isLocked && (
                                <span className="ml-1.5 text-[10px] text-amber-400 font-mono bg-amber-950/90 border border-amber-600/50 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Req. Lvl {reqLevel}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddOfficialFeature(feat)}
                              className={`px-3 py-1 rounded-lg font-bold text-[11px] shadow transition flex items-center gap-1 ${
                                isLocked && !isDmRole
                                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                  : isLocked && isDmRole
                                    ? 'bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-500/60'
                                    : 'bg-amber-700 hover:bg-amber-600 text-white'
                              }`}
                              title={
                                isLocked && !isDmRole
                                  ? `🔒 Unlocks at Level ${reqLevel}. Ask your DM to grant early.`
                                  : isLocked && isDmRole
                                    ? `👑 DM Grant: Manually grant Level ${reqLevel} feature early`
                                    : '+ Add to Sheet'
                              }
                            >
                              {isLocked && isDmRole && <Crown className="w-3 h-3 text-amber-400" />}
                              {isLocked && !isDmRole && <Lock className="w-3 h-3 text-amber-500/80" />}
                              <span>{isLocked && !isDmRole ? `Lvl ${reqLevel} Req.` : isLocked && isDmRole ? 'Grant (DM)' : '+ Add to Sheet'}</span>
                            </button>
                          </div>
                          <p className="text-stone-300 text-xs leading-relaxed">{feat.description}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-stone-400 mb-1">Feature Name *</label>
                  <input
                    type="text"
                    value={newFeatureName}
                    onChange={(e) => setNewFeatureName(e.target.value)}
                    placeholder="e.g. Action Surge"
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Source (e.g. Fighter Level 2)</label>
                  <input
                    type="text"
                    value={newFeatureSource}
                    onChange={(e) => setNewFeatureSource(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Max Uses (Optional)</label>
                    <input
                      type="number"
                      value={newFeatureMaxUses}
                      onChange={(e) => setNewFeatureMaxUses(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Recharge</label>
                    <select
                      value={newFeatureRecharge}
                      onChange={(e: any) => setNewFeatureRecharge(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                    >
                      <option value="Short Rest">Short Rest</option>
                      <option value="Long Rest">Long Rest</option>
                      <option value="Special">Special</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Description</label>
                  <textarea
                    value={newFeatureDesc}
                    onChange={(e) => setNewFeatureDesc(e.target.value)}
                    rows={3}
                    placeholder="Feature effect..."
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg p-2 text-stone-100"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddFeatureModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {featureModalTab === 'custom' && (
                <button
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Save Feature
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
