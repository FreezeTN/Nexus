import React, { useState, useMemo } from 'react';
import { CharacterData, ClassFeature } from '../../types';
import {
  PARENT_RACE_CATALOG,
  getHybridName,
  buildHybridFeature,
  getClassicSRDHalfBreedsForEdition,
  buildClassicSRDFeature,
  DRAGON_VARIETIES_35E,
  DRAGON_VARIETIES_5E,
  BASE_CREATURES_35E,
  HALF_BREED_TEMPLATES_35E,
  BaseCreature35e,
  HalfBreedTemplate35e,
  resolve35eHalfBreedTemplate
} from '../../data/halfBreedData';
import {
  getAvailable35eHalfBreedTemplates,
  getAvailable35eBaseCreatures
} from './newCharacter/newCharacterData';
import { applyHalfBreedTemplate35eToCharacter } from '../../utils/raceApplication';
import { Dna, X, Check, Sparkles, Zap, Shield, Swords, Eye, Info, ChevronDown, ChevronUp, AlertTriangle, Layers } from 'lucide-react';

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
  const is35e = character.edition === '3.5e';
  const currentHybrid = character.hybridHeritage;
  const initialIsClassic = currentHybrid?.isClassicSRD || character.optionalRules?.useClassicSRDHalfBreed || false;
  const initialIsTemplate = currentHybrid?.isTemplateMode || character.optionalRules?.useHalfBreedTemplate35e || (is35e && !initialIsClassic && !character.optionalRules?.useHalfBreedSystem);

  const [enabled, setEnabled] = useState<boolean>(currentHybrid?.enabled ?? true);
  const [systemMode, setSystemMode] = useState<'template' | 'alpine' | 'srd'>(
    initialIsTemplate ? 'template' : initialIsClassic ? 'srd' : 'alpine'
  );

  // 3.5e Template System State
  const availableBases35e = useMemo(() => getAvailable35eBaseCreatures(character.edition), [character.edition]);
  const availableTemplates35e = useMemo(() => getAvailable35eHalfBreedTemplates(character.edition), [character.edition]);

  const defaultBaseId = currentHybrid?.baseRaceId || (
    availableBases35e.find(b => character.race?.toLowerCase().includes(b.name.toLowerCase()))?.id || 'dwarf'
  );
  const defaultTemplateId = currentHybrid?.templateId || 'half-dragon';

  const [selectedBaseId, setSelectedBaseId] = useState<string>(defaultBaseId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);
  const [templateDragonVariety, setTemplateDragonVariety] = useState<string>(currentHybrid?.dragonVariety || 'Red');
  const [customTemplateName, setCustomTemplateName] = useState<string>(currentHybrid?.customHybridName || '');
  const [applyCumulativeAbilities, setApplyCumulativeAbilities] = useState<boolean>(true);
  const [conflictChoices, setConflictChoices] = useState<Record<string, 'base' | 'template' | 'suppress'>>(
    currentHybrid?.conflictsResolved || {}
  );
  const [showPrecedenceDetails, setShowPrecedenceDetails] = useState<boolean>(false);

  // Alpine DM state
  const [primaryParent, setPrimaryParent] = useState<string>(currentHybrid?.primaryParent || 'Elf');
  const [secondaryParent, setSecondaryParent] = useState<string>(currentHybrid?.secondaryParent || 'Dwarf');
  const [customHybridName, setCustomHybridName] = useState<string>(currentHybrid?.customHybridName || '');

  // Classic SRD state
  const availableSRDHalfBreeds = getClassicSRDHalfBreedsForEdition(character.edition);
  const defaultSRDId = currentHybrid?.classicSRDId || (availableSRDHalfBreeds[0]?.id || 'srd-5e-half-elf');
  const [selectedClassicSRDId, setSelectedClassicSRDId] = useState<string>(defaultSRDId);
  const [srdDragonVariety, setSrdDragonVariety] = useState<string>(currentHybrid?.dragonVariety || 'Red');

  const primaryData = PARENT_RACE_CATALOG.find(p => p.name === primaryParent) || PARENT_RACE_CATALOG[0];
  const secondaryData = PARENT_RACE_CATALOG.find(s => s.name === secondaryParent) || PARENT_RACE_CATALOG[1];

  const calculatedAlpineRaceName = getHybridName(primaryParent, secondaryParent, customHybridName);
  const hasDarkvisionAlpine = primaryData.hasDarkvision || secondaryData.hasDarkvision;

  // Selected 3.5e Base & Template
  const selectedBase = availableBases35e.find(b => b.id === selectedBaseId) || availableBases35e[0] || BASE_CREATURES_35E[0];
  const selectedTemplate = availableTemplates35e.find(t => t.id === selectedTemplateId) || availableTemplates35e[0] || HALF_BREED_TEMPLATES_35E[0];

  const charLevel = character.level || 1;
  const hasClassLevels = charLevel >= 1 || !!character.characterClass;

  const resolvedTemplate = resolve35eHalfBreedTemplate(
    selectedBase,
    selectedTemplate,
    charLevel,
    hasClassLevels,
    selectedTemplate.hasDragonVarieties ? templateDragonVariety : undefined,
    conflictChoices
  );

  const handleSave = () => {
    if (!enabled) {
      // Disable Hybrid system for this character
      const cleanedFeatures = character.classFeatures.filter(
        f => !f.id.startsWith('feat-hybrid-heritage') &&
             !f.id.startsWith('feat-srd-halfbreed') &&
             !f.id.startsWith('feat-hb-composite') &&
             !f.id.startsWith('feat-base-') &&
             !f.id.startsWith('feat-tpl-')
      );
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
          useClassicSRDHalfBreed: false,
          useHalfBreedTemplate35e: false
        },
        classFeatures: cleanedFeatures
      });
      onClose();
      return;
    }

    if (systemMode === 'template') {
      // 3.5e Half-Breed Template System
      const updated = applyHalfBreedTemplate35eToCharacter(
        character,
        selectedBase,
        selectedTemplate,
        {
          dragonVariety: selectedTemplate.hasDragonVarieties ? templateDragonVariety : undefined,
          conflictChoices,
          applyAbilities: applyCumulativeAbilities,
          customRaceName: customTemplateName.trim() || undefined
        }
      );
      onUpdateCharacter(updated);
      onClose();
      return;
    }

    // Clean existing half breed features
    let updatedFeatures = character.classFeatures.filter(
      f => !f.id.startsWith('feat-hybrid-heritage') &&
           !f.id.startsWith('feat-srd-halfbreed') &&
           !f.id.startsWith('feat-hb-composite') &&
           !f.id.startsWith('feat-base-') &&
           !f.id.startsWith('feat-tpl-')
    );

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
        senses: hasDarkvisionAlpine ? 'Darkvision 60 ft.' : 'Normal',
        hybridHeritage: {
          enabled: true,
          isTemplateMode: false,
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
          useClassicSRDHalfBreed: false,
          useHalfBreedTemplate35e: false
        },
        classFeatures: updatedFeatures
      });
    } else {
      // Classic SRD mode
      const selectedSRD = availableSRDHalfBreeds.find(hb => hb.id === selectedClassicSRDId) || availableSRDHalfBreeds[0];
      if (selectedSRD) {
        const isDragon = selectedSRD.id.includes('half-dragon');
        const finalRaceName = isDragon ? (character.edition === '3.5e' ? `Half-${srdDragonVariety} Dragon (3.5e SRD)` : `Half-${srdDragonVariety} Dragon (5e SRD)`) : selectedSRD.name;
        const srdFeature = buildClassicSRDFeature(selectedSRD, srdDragonVariety);
        updatedFeatures.unshift(srdFeature);

        onUpdateCharacter({
          ...character,
          race: finalRaceName,
          speed: selectedSRD.speed,
          senses: selectedSRD.hasDarkvision ? 'Darkvision 60 ft.' : selectedSRD.hasLowLightVision ? 'Low-Light Vision' : 'Normal',
          hybridHeritage: {
            enabled: true,
            isTemplateMode: false,
            isClassicSRD: true,
            classicSRDId: selectedSRD.id,
            dragonVariety: isDragon ? srdDragonVariety : undefined,
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
            useClassicSRDHalfBreed: true,
            useHalfBreedTemplate35e: false
          },
          classFeatures: updatedFeatures
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-amber-600/60 rounded-2xl max-w-3xl w-full p-5 sm:p-6 text-stone-100 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-400">
              <Dna className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-200">
                Half-Breed Ancestry & Template Manager ({character.edition.toUpperCase()})
              </h2>
              <p className="text-xs text-stone-400 font-mono">
                {is35e
                  ? 'Official 3.5e Inherited Templates (Base Creature + Template) or Homebrew Lineages'
                  : 'Configure Dual Ancestry Lineages or Classic SRD Half-Breeds'}
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
        <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-xs sm:text-sm text-stone-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Enable Half-Breed Heritage
            </span>
            <p className="text-[11px] text-stone-400">
              Applies merged racial traits, physical dimensions, natural armor, speeds, and abilities.
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
            <div className={`grid ${is35e ? 'grid-cols-3' : 'grid-cols-2'} gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-mono font-bold`}>
              {is35e && (
                <button
                  type="button"
                  onClick={() => setSystemMode('template')}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-center ${
                    systemMode === 'template'
                      ? 'bg-amber-600 text-stone-950 font-extrabold shadow'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Half-Breed Template</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSystemMode('srd')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-center ${
                  systemMode === 'srd'
                    ? 'bg-amber-600 text-stone-950 font-extrabold shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Classic SRD</span>
              </button>
              <button
                type="button"
                onClick={() => setSystemMode('alpine')}
                className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-center ${
                  systemMode === 'alpine'
                    ? 'bg-amber-600 text-stone-950 font-extrabold shadow'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                <Dna className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Alpine DM System</span>
              </button>
            </div>

            {/* Mode 1: 3.5e Half-Breed Template System */}
            {systemMode === 'template' && (
              <div className="space-y-4">
                {/* Notice on 3.5e ruleset */}
                <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-300">
                      3.5e Inherited Template Mechanics Active
                    </p>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      The creature retains all racial traits, speed, and size of the <strong>Base Creature</strong> while gaining the special attacks, qualities, and traits of the <strong>Half-Breed Template</strong>. Numerical modifiers to abilities, natural armor, and saves stack cumulatively. Duplicate traits adopt the higher value.
                    </p>
                  </div>
                </div>

                {/* Base Creature and Template Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-amber-300 font-bold font-mono">
                        🛡️ Base Creature
                      </label>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {selectedBase.size} | {selectedBase.speed} ft
                      </span>
                    </div>
                    <select
                      value={selectedBaseId}
                      onChange={(e) => setSelectedBaseId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {availableBases35e.map(bc => (
                        <option key={bc.id} value={bc.id}>
                          {bc.name} ({bc.size}, {bc.speed}ft) — {bc.source.split(',')[0]}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-400 italic">
                      {selectedBase.description}
                    </p>
                  </div>

                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-amber-300 font-bold font-mono">
                        🧬 Half-Breed Template
                      </label>
                      <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-600/40 px-1.5 py-0.5 rounded font-mono font-bold">
                        ECL LA +{selectedTemplate.levelAdjustment}
                      </span>
                    </div>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {availableTemplates35e.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (LA +{t.levelAdjustment}) — {t.typeChange}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-400 italic">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>

                {/* Half-Dragon Ancestor Selection */}
                {selectedTemplate.hasDragonVarieties && (
                  <div className="bg-stone-950 border border-amber-600/40 p-3 rounded-xl space-y-1.5 text-xs">
                    <label className="block text-amber-300 font-bold font-mono">
                      🐉 Draconic Lineage & Ancestor Energy
                    </label>
                    <select
                      value={templateDragonVariety}
                      onChange={(e) => setTemplateDragonVariety(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-stone-100 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {DRAGON_VARIETIES_35E.map(dv => (
                        <option key={dv.variety} value={dv.variety}>
                          {dv.variety} Dragon — Immunity: {dv.immunityOrResistance} | Breath Weapon: {dv.breathWeapon}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-stone-400">
                      Exhales destructive energy once per day (6d8 damage, Reflex DC 10 + 1/2 HD + CON mod). Grants total immunity to matching energy type.
                    </p>
                  </div>
                )}

                {/* Custom Race Title & Ability Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl space-y-1">
                    <label className="block text-stone-300 font-bold">
                      Custom Composite Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={customTemplateName}
                      onChange={(e) => setCustomTemplateName(e.target.value)}
                      placeholder={`e.g. ${resolvedTemplate.compositeName}`}
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-stone-400">
                      Calculated Race Name: <strong className="text-amber-300">{customTemplateName.trim() || resolvedTemplate.compositeName}</strong>
                    </p>
                  </div>

                  <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xl flex flex-col justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyCumulativeAbilities}
                        onChange={(e) => setApplyCumulativeAbilities(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="font-bold text-stone-200 text-xs">
                        Apply Cumulative Ability Modifiers
                      </span>
                    </label>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Adds net bonuses from Base Creature ({selectedBase.name}) and Template ({selectedTemplate.name}) directly to character ability scores.
                    </p>
                  </div>
                </div>

                {/* Conflicting Abilities Resolution (if any) */}
                {resolvedTemplate.conflicts.length > 0 && (
                  <div className="bg-stone-950 border border-rose-500/50 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Conflicting Abilities Detected (Rule 3)</span>
                    </div>
                    <p className="text-[11px] text-stone-300">
                      The Base Creature and Template possess mutually exclusive abilities. By default, both are ignored unless the DM or player specifies one:
                    </p>
                    {resolvedTemplate.conflicts.map(c => (
                      <div key={c.key} className="bg-stone-900 p-2.5 rounded-lg border border-stone-800 space-y-2">
                        <div className="text-[11px] font-mono text-amber-300">
                          {c.baseName} ({selectedBase.name}) vs. {c.templateName} ({selectedTemplate.name})
                        </div>
                        <div className="flex gap-3 text-[11px]">
                          <label className="flex items-center gap-1 text-stone-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`conflict_${c.key}`}
                              checked={(conflictChoices[c.key] || 'suppress') === 'suppress'}
                              onChange={() => setConflictChoices(prev => ({ ...prev, [c.key]: 'suppress' }))}
                              className="accent-amber-500"
                            />
                            <span>Suppress Both (Default)</span>
                          </label>
                          <label className="flex items-center gap-1 text-stone-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`conflict_${c.key}`}
                              checked={conflictChoices[c.key] === 'base'}
                              onChange={() => setConflictChoices(prev => ({ ...prev, [c.key]: 'base' }))}
                              className="accent-amber-500"
                            />
                            <span>Keep {c.baseName}</span>
                          </label>
                          <label className="flex items-center gap-1 text-stone-300 cursor-pointer">
                            <input
                              type="radio"
                              name={`conflict_${c.key}`}
                              checked={conflictChoices[c.key] === 'template'}
                              onChange={() => setConflictChoices(prev => ({ ...prev, [c.key]: 'template' }))}
                              className="accent-amber-500"
                            />
                            <span>Keep {c.templateName}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Synthesis / Audit Panel */}
                <div className="bg-stone-950 border border-amber-600/50 p-4 rounded-xl space-y-3.5 text-xs">
                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                    <div>
                      <span className="text-base font-serif font-bold text-amber-200">
                        {customTemplateName.trim() || resolvedTemplate.compositeName}
                      </span>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {selectedTemplate.typeChange} • ECL Level Adjustment: <strong className="text-amber-300">+{resolvedTemplate.levelAdjustment}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-stone-300 font-mono text-[10px]">
                        Size: <strong className="text-amber-300">{resolvedTemplate.size}</strong>
                      </span>
                      <span className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-stone-300 font-mono text-[10px]">
                        Land: <strong className="text-amber-300">{resolvedTemplate.speed} ft.</strong>
                      </span>
                      {resolvedTemplate.flySpeed && (
                        <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 rounded font-mono text-[10px]">
                          Fly: <strong>{resolvedTemplate.flySpeed} ft. ({resolvedTemplate.flyManeuverability})</strong>
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-stone-300 font-mono text-[10px]">
                        Nat Armor: <strong className="text-amber-300">+{resolvedTemplate.naturalArmor} AC</strong>
                      </span>
                    </div>
                  </div>

                  {/* Cumulative Ability Scores Grid */}
                  <div className="space-y-1.5">
                    <span className="text-amber-300 font-bold font-mono text-[11px] block">
                      📊 Cumulative Ability Modifiers (Rule 3: Base + Template Stack)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map(stat => {
                        const bd = resolvedTemplate.abilityBreakdowns[stat];
                        const isPos = bd.net > 0;
                        const isNeg = bd.net < 0;
                        return (
                          <div key={stat} className="bg-stone-900/90 border border-stone-800 rounded-lg p-2 space-y-0.5">
                            <span className="text-[10px] text-stone-400 font-mono font-bold block">{stat}</span>
                            <div className={`text-sm font-mono font-black ${isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-stone-300'}`}>
                              {bd.net > 0 ? `+${bd.net}` : bd.net}
                            </div>
                            <div className="text-[9px] text-stone-500 font-mono">
                              {bd.base >= 0 ? `+${bd.base}` : bd.base} / {bd.template >= 0 ? `+${bd.template}` : bd.template}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Senses & Defenses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-lg space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-amber-400" /> Inherited Senses (Higher Value Wins)
                      </span>
                      <p className="text-stone-300">
                        {resolvedTemplate.darkvisionFeet > 0 ? `Darkvision ${resolvedTemplate.darkvisionFeet} ft.` : 'Normal Darkvision'}
                        {resolvedTemplate.hasLowLightVision ? ' • Low-Light Vision' : ''}
                        {resolvedTemplate.hasBlindsight && resolvedTemplate.blindsightFeet ? ` • Blindsight ${resolvedTemplate.blindsightFeet} ft.` : ''}
                      </p>
                    </div>

                    <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-lg space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Immunities & Resistances
                      </span>
                      <p className="text-stone-300">
                        {resolvedTemplate.damageImmunities.length > 0 ? `Immune: ${resolvedTemplate.damageImmunities.join(', ')}` : 'None'}
                        {Object.keys(resolvedTemplate.energyResistances).length > 0
                          ? ` • Res: ${Object.entries(resolvedTemplate.energyResistances).map(([k, v]) => `${k} ${v}`).join(', ')}`
                          : ''}
                        {resolvedTemplate.damageReduction ? ` • DR ${resolvedTemplate.damageReduction.value}/${resolvedTemplate.damageReduction.bypass}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Natural Attacks if present */}
                  {selectedTemplate.naturalAttacks && selectedTemplate.naturalAttacks.length > 0 && (
                    <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-lg space-y-1 text-[11px]">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <Swords className="w-3.5 h-3.5 text-amber-400" /> Gained Natural Weapons
                      </span>
                      <div className="flex flex-wrap gap-2 text-stone-300">
                        {selectedTemplate.naturalAttacks.map(na => (
                          <span key={na.name} className="px-2 py-0.5 bg-stone-950 border border-amber-900/50 rounded font-mono text-[10px]">
                            {na.name}: <strong>{na.damageDice}</strong> {na.damageType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3.5e Racial Skill Points Rule Card */}
                  <div className="bg-stone-900/95 border border-amber-500/40 p-3 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span>📜 3.5e Half-Breed Skill Points Rule</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${hasClassLevels ? 'bg-amber-950 text-amber-300 border border-amber-600/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'}`}>
                        {hasClassLevels ? 'CLASS SP ACTIVE' : 'RACIAL SP ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {resolvedTemplate.skillPointsNotice}
                    </p>
                  </div>

                  {/* Traits Breakdown (Retained Base + Gained Template) */}
                  <div className="space-y-2 pt-1">
                    <span className="font-bold text-amber-300 block font-mono text-[11px]">
                      🧬 Merged Heritage Traits (Base: {selectedBase.name} + Template: {selectedTemplate.name})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {/* Base Traits */}
                      <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-lg space-y-1.5">
                        <span className="text-amber-400 font-bold block border-b border-stone-800 pb-1">
                          Retained Base Traits ({selectedBase.name})
                        </span>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {resolvedTemplate.retainedBaseTraits.map(t => (
                            <div key={t.name} className="text-stone-300">
                              <strong className="text-stone-200">{t.name}:</strong> <span className="text-stone-400">{t.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Template Traits */}
                      <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-lg space-y-1.5">
                        <span className="text-amber-400 font-bold block border-b border-stone-800 pb-1">
                          Gained Template Traits ({selectedTemplate.name})
                        </span>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                          {resolvedTemplate.gainedTemplateTraits.map(t => (
                            <div key={t.name} className="text-stone-300">
                              <strong className="text-stone-200">{t.name}:</strong> <span className="text-stone-400">{t.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order of Precedence Details */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPrecedenceDetails(!showPrecedenceDetails)}
                      className="w-full flex items-center justify-between text-left text-xs font-mono text-amber-400/90 hover:text-amber-300 bg-stone-900/60 p-2 rounded-lg border border-stone-800 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        View 4-Tier Order of Precedence Audit Log ({resolvedTemplate.precedenceLog.length} rules evaluated)
                      </span>
                      {showPrecedenceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showPrecedenceDetails && (
                      <div className="mt-2 bg-stone-900 p-3 rounded-lg border border-stone-800 space-y-1 text-[10px] font-mono text-stone-300 max-h-48 overflow-y-auto">
                        <div className="text-amber-300 font-bold pb-1 border-b border-stone-800">
                          Order of Precedence: Template Rule &gt; Base Creature Rule &gt; General Half-Breed Rules &gt; Core 3.5e Rules
                        </div>
                        {resolvedTemplate.precedenceLog.map((log, idx) => (
                          <div key={idx} className="leading-tight">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: The Alpine DM System */}
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

            {/* Mode 3: Classic SRD Half-Breeds */}
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
                      value={srdDragonVariety}
                      onChange={(e) => setSrdDragonVariety(e.target.value)}
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

                  const dynamicFeature = buildClassicSRDFeature(srdHB, srdDragonVariety);
                  const isDragon = srdHB.id.includes('half-dragon');
                  const displayName = isDragon ? (character.edition === '3.5e' ? `Half-${srdDragonVariety} Dragon (3.5e SRD)` : `Half-${srdDragonVariety} Dragon (5e SRD)`) : srdHB.name;

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
        <div className="flex items-center justify-end gap-2.5 border-t border-stone-800 pt-3.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg transition active:scale-95"
          >
            <Check className="w-4 h-4" /> Save Ancestry Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

