import React, { useState } from 'react';
import { CharacterData, ClassFeature } from '../../types';
import { PARENT_RACE_CATALOG, getHybridName, buildHybridFeature, getClassicSRDHalfBreedsForEdition, buildClassicSRDFeature, CLASSIC_SRD_HALF_BREEDS, DRAGON_VARIETIES_35E, DRAGON_VARIETIES_5E } from '../../data/halfBreedData';
import { Dna, X, Check, Sparkles, Zap } from 'lucide-react';

interface HybridHeritageModalProps {
  character: CharacterData;
  onClose: () => void;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const HybridHeritageModal: React.FC<HybridHeritageModalProps> = ({
  character,
  onClose,
  onUpdateCharacter
}) => {
  const currentHybrid = character.hybridHeritage;
  const initialIsClassic = currentHybrid?.isClassicSRD || character.optionalRules?.useClassicSRDHalfBreed || false;

  const [enabled, setEnabled] = useState<boolean>(currentHybrid?.enabled ?? true);
  const [systemMode, setSystemMode] = useState<'alpine' | 'srd'>(initialIsClassic ? 'srd' : 'alpine');

  // Alpine DM state
  const [primaryParent, setPrimaryParent] = useState<string>(currentHybrid?.primaryParent || 'Elf');
  const [secondaryParent, setSecondaryParent] = useState<string>(currentHybrid?.secondaryParent || 'Dwarf');
  const [customHybridName, setCustomHybridName] = useState<string>(currentHybrid?.customHybridName || '');

  // Classic SRD state
  const availableSRDHalfBreeds = getClassicSRDHalfBreedsForEdition(character.edition);
  const defaultSRDId = currentHybrid?.classicSRDId || (availableSRDHalfBreeds[0]?.id || 'srd-5e-half-elf');
  const [selectedClassicSRDId, setSelectedClassicSRDId] = useState<string>(defaultSRDId);
  const [dragonVariety, setDragonVariety] = useState<string>(currentHybrid?.dragonVariety || 'Red');

  const primaryData = PARENT_RACE_CATALOG.find(p => p.name === primaryParent) || PARENT_RACE_CATALOG[0];
  const secondaryData = PARENT_RACE_CATALOG.find(s => s.name === secondaryParent) || PARENT_RACE_CATALOG[1];

  const calculatedAlpineRaceName = getHybridName(primaryParent, secondaryParent, customHybridName);
  const hasDarkvisionAlpine = primaryData.hasDarkvision || secondaryData.hasDarkvision;

  const handleSave = () => {
    if (!enabled) {
      // Disable Hybrid system for this character
      const cleanedFeatures = character.classFeatures.filter(f => !f.id.startsWith('feat-hybrid-heritage') && !f.id.startsWith('feat-srd-halfbreed'));
      onUpdateCharacter({
        ...character,
        hybridHeritage: {
          enabled: false,
          primaryParent: '',
          secondaryParent: ''
        },
        optionalRules: {
          ...character.optionalRules,
          useHalfBreedSystem: false,
          useClassicSRDHalfBreed: false
        },
        classFeatures: cleanedFeatures
      });
      onClose();
      return;
    }

    // Clean existing half breed features
    let updatedFeatures = character.classFeatures.filter(f => !f.id.startsWith('feat-hybrid-heritage') && !f.id.startsWith('feat-srd-halfbreed'));

    if (systemMode === 'alpine') {
      const hybridFeature: ClassFeature = buildHybridFeature(
        calculatedAlpineRaceName,
        primaryData,
        secondaryData,
        primaryData.size,
        primaryData.speed,
        hasDarkvisionAlpine
      );
      updatedFeatures.unshift(hybridFeature);

      onUpdateCharacter({
        ...character,
        race: calculatedAlpineRaceName,
        speed: primaryData.speed,
        hybridHeritage: {
          enabled: true,
          isClassicSRD: false,
          primaryParent,
          secondaryParent,
          customHybridName: calculatedAlpineRaceName,
          primaryTraitName: primaryData.primaryTraitName,
          primaryTraitDesc: primaryData.primaryTraitDesc,
          secondaryTraitName: secondaryData.secondaryTraitName,
          secondaryTraitDesc: secondaryData.secondaryTraitDesc,
          speedFeet: primaryData.speed,
          sizeCategory: primaryData.size,
          hasDarkvision: hasDarkvisionAlpine
        },
        optionalRules: {
          ...character.optionalRules,
          useHalfBreedSystem: true,
          useClassicSRDHalfBreed: false
        },
        classFeatures: updatedFeatures
      });
    } else {
      // Classic SRD mode
      const selectedSRD = availableSRDHalfBreeds.find(hb => hb.id === selectedClassicSRDId) || availableSRDHalfBreeds[0];
      if (selectedSRD) {
        const isDragon = selectedSRD.id.includes('half-dragon');
        const finalRaceName = isDragon ? (character.edition === '3.5e' ? `Half-${dragonVariety} Dragon (3.5e SRD)` : `Half-${dragonVariety} Dragon (5e SRD)`) : selectedSRD.name;
        const srdFeature = buildClassicSRDFeature(selectedSRD, dragonVariety);
        updatedFeatures.unshift(srdFeature);

        onUpdateCharacter({
          ...character,
          race: finalRaceName,
          speed: selectedSRD.speed,
          hybridHeritage: {
            enabled: true,
            isClassicSRD: true,
            classicSRDId: selectedSRD.id,
            dragonVariety: isDragon ? dragonVariety : undefined,
            primaryParent: finalRaceName,
            secondaryParent: 'SRD Classic',
            customHybridName: finalRaceName,
            speedFeet: selectedSRD.speed,
            sizeCategory: selectedSRD.size,
            hasDarkvision: selectedSRD.hasDarkvision
          },
          optionalRules: {
            ...character.optionalRules,
            useHalfBreedSystem: false,
            useClassicSRDHalfBreed: true
          },
          classFeatures: updatedFeatures
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-600/60 rounded-2xl max-w-2xl w-full p-6 text-stone-100 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-400">
              <Dna className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-200">
                Half-Breed Ancestry Manager ({character.edition.toUpperCase()})
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                Configure Alpine DM Dual Ancestry or Classic SRD Half-Breeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle enable / disable */}
        <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Enable Half-Breed Ancestry
            </span>
            <p className="text-xs text-stone-400">
              Applies racial traits, physical dimensions, speed, and abilities for half-breed lineage.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {enabled && (
          <div className="space-y-4">
            {/* System Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-mono font-bold">
              <button
                onClick={() => setSystemMode('alpine')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  systemMode === 'alpine'
                    ? 'bg-amber-600 text-stone-950 font-extrabold shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <Dna className="w-4 h-4" />
                <span>The Alpine DM System</span>
              </button>
              <button
                onClick={() => setSystemMode('srd')}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                  systemMode === 'srd'
                    ? 'bg-amber-600 text-stone-950 font-extrabold shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Classic Half-Breeds (SRD {character.edition})</span>
              </button>
            </div>

            {/* Mode 1: The Alpine DM System */}
            {systemMode === 'alpine' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl space-y-1.5">
                    <label className="block text-amber-300 font-bold font-mono">
                      🧬 Primary Parent Lineage
                    </label>
                    <select
                      value={primaryParent}
                      onChange={(e) => setPrimaryParent(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {PARENT_RACE_CATALOG.map(pr => (
                        <option key={pr.id} value={pr.name}>
                          {pr.name} ({pr.size}, {pr.speed}ft speed)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl space-y-1.5">
                    <label className="block text-amber-300 font-bold font-mono">
                      ⚡ Secondary Parent Lineage
                    </label>
                    <select
                      value={secondaryParent}
                      onChange={(e) => setSecondaryParent(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {PARENT_RACE_CATALOG.map(pr => (
                        <option key={pr.id} value={pr.name}>
                          {pr.name} ({pr.size}, {pr.speed}ft speed)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-stone-950/90 border border-stone-800 p-3.5 rounded-xl space-y-2">
                  <label className="block text-xs text-stone-300 font-bold">
                    Custom Hybrid Race Title (Optional / Auto-Calculated)
                  </label>
                  <input
                    type="text"
                    value={customHybridName}
                    onChange={(e) => setCustomHybridName(e.target.value)}
                    placeholder={`e.g. ${getHybridName(primaryParent, secondaryParent)}`}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-200 text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-xs text-stone-400">
                    Final Character Race Display: <strong className="text-amber-300 font-serif">{calculatedAlpineRaceName}</strong>
                  </p>
                </div>

                <div className="bg-stone-950 border border-amber-600/40 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="font-bold text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Live Inherited Ancestral Features
                    </span>
                    <span className="font-mono text-[11px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                      Size: {primaryData.size} | Speed: {primaryData.speed}ft | Darkvision: {hasDarkvisionAlpine ? '60ft' : 'None'}
                    </span>
                  </div>

                  <div className="space-y-2 text-stone-300">
                    <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                      <span className="text-amber-400 font-bold block mb-0.5">
                        🧬 Primary Trait ({primaryData.name}): {primaryData.primaryTraitName}
                      </span>
                      <p className="text-stone-300 leading-relaxed text-[11px]">
                        {primaryData.primaryTraitDesc}
                      </p>
                    </div>

                    <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                      <span className="text-amber-400 font-bold block mb-0.5">
                        ⚡ Secondary Trait ({secondaryData.name}): {secondaryData.secondaryTraitName}
                      </span>
                      <p className="text-stone-300 leading-relaxed text-[11px]">
                        {secondaryData.secondaryTraitDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Classic SRD Half-Breeds */}
            {systemMode === 'srd' && (
              <div className="space-y-4">
                <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-xl space-y-2">
                  <label className="block text-xs text-amber-300 font-bold font-mono">
                    Select SRD Half-Breed Race for {character.edition.toUpperCase()}
                  </label>
                  <select
                    value={selectedClassicSRDId}
                    onChange={(e) => setSelectedClassicSRDId(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold text-xs focus:outline-none focus:border-amber-500"
                  >
                    {availableSRDHalfBreeds.map(hb => (
                      <option key={hb.id} value={hb.id}>
                        {hb.name} ({hb.size}, {hb.speed}ft {hb.flySpeed ? `/ Fly ${hb.flySpeed}ft` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClassicSRDId.includes('half-dragon') && (
                  <div className="bg-stone-950 border border-amber-600/40 p-3 rounded-xl space-y-1.5">
                    <label className="block text-amber-300 font-bold text-xs font-mono">
                      🐉 Select Dragon Ancestry / Variety ({character.edition.toUpperCase()}) *
                    </label>
                    <select
                      value={dragonVariety}
                      onChange={(e) => setDragonVariety(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold text-xs focus:outline-none focus:border-amber-500"
                    >
                      {(character.edition === '3.5e' ? DRAGON_VARIETIES_35E : DRAGON_VARIETIES_5E).map(dv => (
                        <option key={dv.variety} value={dv.variety}>
                          {dv.variety} Dragon — {dv.immunityOrResistance} | Breath: {dv.breathWeapon}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-400 italic">
                      Determines breath weapon area/damage type and elemental energy immunity/resistance.
                    </p>
                  </div>
                )}

                {(() => {
                  const srdHB = availableSRDHalfBreeds.find(hb => hb.id === selectedClassicSRDId) || availableSRDHalfBreeds[0];
                  if (!srdHB) return null;

                  const dynamicFeature = buildClassicSRDFeature(srdHB, dragonVariety);
                  const isDragon = srdHB.id.includes('half-dragon');
                  const displayName = isDragon ? (character.edition === '3.5e' ? `Half-${dragonVariety} Dragon (3.5e SRD)` : `Half-${dragonVariety} Dragon (5e SRD)`) : srdHB.name;

                  return (
                    <div className="bg-stone-950 border border-amber-600/40 p-4 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <span className="font-bold text-amber-200 text-sm">{displayName}</span>
                        <span className="font-mono text-[11px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                          Size: {srdHB.size} | Speed: {srdHB.speed}ft {srdHB.flySpeed ? `(Fly ${srdHB.flySpeed}ft)` : ''} | {srdHB.hasDarkvision ? 'Darkvision 60ft' : srdHB.hasLowLightVision ? 'Low-Light Vision' : 'Normal Vision'}
                        </span>
                      </div>

                      <p className="text-stone-300 italic">{srdHB.description}</p>

                      <div className="bg-stone-900/90 p-2.5 rounded-lg border border-amber-900/50 text-amber-300 font-mono text-xs">
                        <strong>Stat Adjustments:</strong> {srdHB.statBonusText}
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-amber-400 font-bold block">Racial Features ({srdHB.source}):</span>
                        <div className="bg-stone-900/80 p-3 rounded-lg border border-stone-800 whitespace-pre-wrap text-stone-200 leading-relaxed font-sans text-xs">
                          {dynamicFeature.description.split('\n\nRacial Traits:\n')[1] || dynamicFeature.description}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-stone-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg transition"
          >
            <Check className="w-4 h-4" /> Save Ancestry Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
