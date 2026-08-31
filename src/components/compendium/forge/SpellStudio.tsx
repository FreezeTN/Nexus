import React, { useState, useMemo } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition, FANTASY_MAGIC_SCHOOLS, FANTASY_DAMAGE_TYPES } from './ForgeTypes';
import { Save, Sparkles, Wand2, Zap, Shield, Flame, Radio, Plus, X } from 'lucide-react';
import { validateHomebrewSpell, ValidationResult } from '../../../utils/homebrewValidator';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

interface SpellStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
}

export const SpellStudio: React.FC<SpellStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose
}) => {
  // Shared Name & Description
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fantasy Fields (5e / 3.5e / PF2e)
  const [level, setLevel] = useState(1);
  const [school, setSchool] = useState('Evocation');
  const [castingTime, setCastingTime] = useState('1 action');
  const [range, setRange] = useState('60 feet');
  const [duration, setDuration] = useState('Instantaneous');
  const [components, setComponents] = useState('V, S');
  const [materialText, setMaterialText] = useState('');
  const [isConcentration, setIsConcentration] = useState(false);
  const [isRitual, setIsRitual] = useState(false);
  const [damageFormula, setDamageFormula] = useState('');
  const [damageType, setDamageType] = useState('Fire');
  const [saveType, setSaveType] = useState('DEX');
  const [higherLevel, setHigherLevel] = useState('');
  const [targetClasses, setTargetClasses] = useState('Wizard, Sorcerer');

  // PF2e Specific
  const [pf2Tradition, setPf2Tradition] = useState('Arcane');
  const [pf2Actions, setPf2Actions] = useState('2 Actions (◆◆)');
  const [pf2Defense, setPf2Defense] = useState('Basic Reflex');
  const [pf2Traits, setPf2Traits] = useState('Attack, Evocation, Fire');

  // 3.5e Specific
  const [spellResist, setSpellResist] = useState('Yes');
  const [targetAreaEffect, setTargetAreaEffect] = useState('One creature or 20-ft radius');

  // Shadowrun Specific
  const [srArcaneType, setSrArcaneType] = useState<'Spell' | 'Complex Form' | 'Adept Power' | 'Ritual'>('Spell');
  const [srCategory, setSrCategory] = useState<'Combat' | 'Detection' | 'Health' | 'Illusion' | 'Manipulation' | 'Matrix' | 'Passives'>('Combat');
  const [srType, setSrType] = useState<'Physical' | 'Mana'>('Physical');
  const [srRange, setSrRange] = useState<'Touch' | 'LOS' | 'LOS (A)' | 'Self'>('LOS');
  const [srDuration, setSrDuration] = useState<'Instant' | 'Sustained' | 'Permanent' | 'Passive'>('Instant');
  const [srDrainValue, setSrDrainValue] = useState('F - 2');

  // Call of Cthulhu Specific
  const [cocMagicType, setCocMagicType] = useState<'Eldritch Spell' | 'Mythos Ritual' | 'Folk Magic' | 'Warding Charm'>('Eldritch Spell');
  const [cocMpCost, setCocMpCost] = useState('5 Magic Points');
  const [cocSanCost, setCocSanCost] = useState('1d6 Sanity points');
  const [cocCastingTime, setCocCastingTime] = useState('1 Round');
  const [cocRange, setCocRange] = useState('Touch');
  const [cocResistance, setCocResistance] = useState('Opposed POW vs POW');
  const [cocReagents, setCocReagents] = useState('A bowl of silver water, chanted invocation in Aklo');

  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Live Validation
  const validation = useMemo(() => {
    return validateHomebrewSpell({
      name,
      level,
      school,
      damageFormula,
      duration,
      castingTime,
      isConcentration,
      description,
      edition
    });
  }, [name, level, school, damageFormula, duration, castingTime, isConcentration, description, edition]);

  const executeSave = () => {
    let descSummary = description.trim();
    let spellDataPayload: any = {};
    let itemTags: string[] = ['spells', edition, 'Homebrew'];

    if (edition === 'shadowrun') {
      itemTags.push(srArcaneType, srCategory, srType);
      spellDataPayload = {
        name: name.trim(),
        type: srArcaneType,
        category: srCategory,
        drainValue: srDrainValue,
        duration: srDuration,
        range: srRange,
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `${srArcaneType} [${srCategory}, ${srType}]. Range: ${srRange}, Duration: ${srDuration}, Drain: ${srDrainValue}.`;
      }
    } else if (edition === 'cthulhu') {
      itemTags.push(cocMagicType, 'Cthulhu Mythos');
      spellDataPayload = {
        name: name.trim(),
        school: cocMagicType,
        castingTime: cocCastingTime,
        range: cocRange,
        duration: 'Instantaneous',
        components: `Cost: ${cocMpCost}, ${cocSanCost}. Reagents: ${cocReagents}`,
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `${cocMagicType}. Cost: ${cocMpCost} & ${cocSanCost}. Cast Time: ${cocCastingTime}. Range: ${cocRange}. Resistance: ${cocResistance}. ${cocReagents ? `Reagents: ${cocReagents}.` : ''}`;
      }
    } else if (edition === 'pathfinder') {
      itemTags.push(`Rank ${level}`, pf2Tradition, school);
      spellDataPayload = {
        level,
        school,
        castingTime: pf2Actions,
        range,
        duration,
        components: pf2Traits,
        saveType: pf2Defense,
        damage: damageFormula || undefined,
        damageType: damageFormula ? damageType : undefined,
        higherLevel: higherLevel || undefined,
        description: description.trim(),
        edition: 'pathfinder'
      };
      if (!descSummary) {
        descSummary = `Rank ${level === 0 ? 'Cantrip' : level} ${school} (${pf2Tradition}). Actions: ${pf2Actions}. Defense: ${pf2Defense}. Range: ${range}.`;
      }
    } else if (edition === '3.5e') {
      itemTags.push(`Level ${level}`, school, targetClasses);
      spellDataPayload = {
        level,
        school,
        castingTime,
        range,
        duration,
        components: components + (materialText ? ` (${materialText})` : ''),
        saveType: saveType === 'None' ? undefined : saveType,
        damage: damageFormula || undefined,
        damageType: damageFormula ? damageType : undefined,
        description: description.trim(),
        edition: '3.5e'
      };
      if (!descSummary) {
        descSummary = `Level ${level} ${school}. Casting: ${castingTime}, Range: ${range}, Target/Area: ${targetAreaEffect}. SR: ${spellResist}. Save: ${saveType}.`;
      }
    } else {
      // Standard 5e
      itemTags.push(`Level ${level}`, school);
      spellDataPayload = {
        level,
        school,
        castingTime,
        range,
        duration,
        components,
        material: materialText || undefined,
        concentration: isConcentration,
        ritual: isRitual,
        damage: damageFormula || undefined,
        damageType: damageFormula ? damageType : undefined,
        saveType: saveType === 'None' ? undefined : saveType,
        higherLevel: higherLevel || undefined,
        classes: targetClasses.split(',').map(c => c.trim()).filter(Boolean),
        description: description.trim(),
        edition: '5e'
      };
      if (!descSummary) {
        descSummary = `${level === 0 ? 'Cantrip' : `Level ${level}`} ${school}. Casting: ${castingTime}, Range: ${range}, Duration: ${duration}.${isConcentration ? ' (Concentration)' : ''}${isRitual ? ' (Ritual)' : ''}`;
      }
    }

    const newItem: CompendiumItem = {
      id: `custom-spell-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category: 'spells',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: descSummary,
      isCustom: true,
      tags: itemTags,
      spellData: spellDataPayload
    };

    onSave(newItem);
    setName('');
    setDescription('');
    setShowOverrideModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (validation.hasCritical) {
      setShowOverrideModal(true);
      return;
    }

    executeSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {/* SHADOWRUN ARCANUM & MATRIX FORGE */}
      {edition === 'shadowrun' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-cyan-300 font-bold mb-1">
                Arcane Formula / Complex Form Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Manabolt, Pulse Storm, Improved Invisibility, Resonance Spike"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-cyan-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Formula Type</label>
              <select
                value={srArcaneType}
                onChange={(e) => setSrArcaneType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Spell">Spell (Mage / Shaman)</option>
                <option value="Complex Form">Complex Form (Technomancer)</option>
                <option value="Adept Power">Adept Power (Physical Adept)</option>
                <option value="Ritual">Arcane Ritual (Lodge)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Category</label>
              <select
                value={srCategory}
                onChange={(e) => setSrCategory(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Combat">Combat</option>
                <option value="Detection">Detection</option>
                <option value="Health">Health</option>
                <option value="Illusion">Illusion</option>
                <option value="Manipulation">Manipulation</option>
                <option value="Matrix">Matrix / Resonance</option>
                <option value="Passives">Passive / Adept</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Spell Aspect</label>
              <select
                value={srType}
                onChange={(e) => setSrType(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Physical">Physical (P)</option>
                <option value="Mana">Mana (M)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Range</label>
              <select
                value={srRange}
                onChange={(e) => setSrRange(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Touch">Touch (T)</option>
                <option value="LOS">Line of Sight (LOS)</option>
                <option value="LOS (A)">LOS Area (LOS-A)</option>
                <option value="Self">Self Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Duration</label>
              <select
                value={srDuration}
                onChange={(e) => setSrDuration(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Instant">Instant (I)</option>
                <option value="Sustained">Sustained (S)</option>
                <option value="Permanent">Permanent (P)</option>
                <option value="Passive">Passive</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Drain / Fade Code</label>
              <input
                type="text"
                value={srDrainValue}
                onChange={(e) => setSrDrainValue(e.target.value)}
                placeholder="F - 2, F + 1"
                className="w-full px-2.5 py-2 bg-stone-950 border border-cyan-500/50 rounded-xl text-cyan-300 font-mono font-bold text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* CALL OF CTHULHU ELDRITCH SPELLS & RITUALS */}
      {edition === 'cthulhu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-emerald-400 font-bold mb-1">
                Eldritch Spell or Mythos Ritual Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Call Yog-Sothoth, Voorish Sign, Dread Curse of Azathoth, Warding Circle"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-emerald-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Occult Type</label>
              <select
                value={cocMagicType}
                onChange={(e) => setCocMagicType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
              >
                <option value="Eldritch Spell">Eldritch Spell</option>
                <option value="Mythos Ritual">Grand Mythos Ritual</option>
                <option value="Folk Magic">Folk Magic & Charms</option>
                <option value="Warding Charm">Warding & Sealing Charm</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Magic Point (MP) Cost</label>
              <input
                type="text"
                value={cocMpCost}
                onChange={(e) => setCocMpCost(e.target.value)}
                placeholder="e.g. 5 MP, Variable"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Sanity (SAN) Cost</label>
              <input
                type="text"
                value={cocSanCost}
                onChange={(e) => setCocSanCost(e.target.value)}
                placeholder="e.g. 1d6 SAN, 1d10 SAN"
                className="w-full px-3 py-2 bg-stone-950 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Casting Time</label>
              <input
                type="text"
                value={cocCastingTime}
                onChange={(e) => setCocCastingTime(e.target.value)}
                placeholder="1 round, 1 hour, 3 nights"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Resistance / Test</label>
              <input
                type="text"
                value={cocResistance}
                onChange={(e) => setCocResistance(e.target.value)}
                placeholder="Opposed POW, Hard POW, None"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Required Components, Reagents & Chants</label>
            <input
              type="text"
              value={cocReagents}
              onChange={(e) => setCocReagents(e.target.value)}
              placeholder="e.g. A bowl of silver water, powdered mummy dust, midnight chanting in Aklo..."
              className="w-full px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* PATHFINDER 2E SPELLS */}
      {edition === 'pathfinder' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-amber-300 font-bold mb-1">Spell Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sudden Bolt, Heal, Chain Lightning"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Spell Rank</label>
              <select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={0}>Cantrip (Rank 1)</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(r => (
                  <option key={r} value={r}>Rank {r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Tradition</label>
              <select
                value={pf2Tradition}
                onChange={(e) => setPf2Tradition(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Arcane">Arcane</option>
                <option value="Divine">Divine</option>
                <option value="Occult">Occult</option>
                <option value="Primal">Primal</option>
                <option value="All Traditions">All Traditions</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Actions</label>
              <select
                value={pf2Actions}
                onChange={(e) => setPf2Actions(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              >
                <option value="1 Action (◆)">1 Action (◆)</option>
                <option value="2 Actions (◆◆)">2 Actions (◆◆)</option>
                <option value="3 Actions (◆◆◆)">3 Actions (◆◆◆)</option>
                <option value="Free Action (◇)">Free Action (◇)</option>
                <option value="Reaction (⤾)">Reaction (⤾)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Defense</label>
              <select
                value={pf2Defense}
                onChange={(e) => setPf2Defense(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Basic Reflex">Basic Reflex</option>
                <option value="Basic Fortitude">Basic Fortitude</option>
                <option value="Basic Will">Basic Will</option>
                <option value="AC / Attack Roll">AC (Spell Attack)</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Traits</label>
              <input
                type="text"
                value={pf2Traits}
                onChange={(e) => setPf2Traits(e.target.value)}
                placeholder="Attack, Fire, Concentrate"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* D&D 3.5E / 5E SPELL FIELDS */}
      {(edition === '5e' || edition === '3.5e') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Spell Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aether Lance, Hellfire Burst, Mass Haste"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Spell Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={0}>Cantrip / Orison (0th Level)</option>
                {Array.from({ length: 9 }, (_, i) => i + 1).map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}{lvl === 1 ? 'st' : lvl === 2 ? 'nd' : lvl === 3 ? 'rd' : 'th'} Level</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">School</label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                {FANTASY_MAGIC_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Casting Time</label>
              <input
                type="text"
                value={castingTime}
                onChange={(e) => setCastingTime(e.target.value)}
                placeholder="1 standard action"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Range</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Medium (100 ft. + 10 ft./lvl)"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1 round / level"
                className="w-full px-2.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>

          {/* D&D Toggles */}
          {edition === '5e' && (
            <div className="flex items-center gap-5 p-3 bg-stone-900/50 border border-stone-800 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-amber-300">
                <input
                  type="checkbox"
                  checked={isConcentration}
                  onChange={(e) => setIsConcentration(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Requires Concentration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-stone-300">
                <input
                  type="checkbox"
                  checked={isRitual}
                  onChange={(e) => setIsRitual(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Ritual Castable</span>
              </label>
            </div>
          )}

          {edition === '3.5e' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/50 border border-stone-800 p-3 rounded-xl">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Spell Resistance (SR)</label>
                <select
                  value={spellResist}
                  onChange={(e) => setSpellResist(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-stone-200 text-xs"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Yes (Harmless)">Yes (Harmless)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">Target / Area / Effect</label>
                <input
                  type="text"
                  value={targetAreaEffect}
                  onChange={(e) => setTargetAreaEffect(e.target.value)}
                  placeholder="One creature, or 20-ft.-radius spread"
                  className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-stone-200 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mechanics: Damage & Saves (Shared for Fantasy & PF2e) */}
      {(edition === '5e' || edition === '3.5e' || edition === 'pathfinder') && (
        <div className="p-4 bg-stone-900/60 border border-stone-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Damage / Healing Formula</label>
            <input
              type="text"
              value={damageFormula}
              onChange={(e) => setDamageFormula(e.target.value)}
              placeholder="e.g. 8d6, 3d8+4"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Damage Type</label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
            >
              {FANTASY_DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 mb-1">Saving Throw</label>
            <select
              value={saveType}
              onChange={(e) => setSaveType(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
            >
              <option value="None">None (Spell Attack / Utility)</option>
              {edition === '3.5e' ? (
                <>
                  <option value="Fortitude negates">Fortitude negates</option>
                  <option value="Fortitude half">Fortitude half</option>
                  <option value="Reflex negates">Reflex negates</option>
                  <option value="Reflex half">Reflex half</option>
                  <option value="Will negates">Will negates</option>
                  <option value="Will half">Will half</option>
                </>
              ) : (
                <>
                  <option value="DEX">DEX Save</option>
                  <option value="CON">CON Save</option>
                  <option value="WIS">WIS Save</option>
                  <option value="STR">STR Save</option>
                  <option value="INT">INT Save</option>
                  <option value="CHA">CHA Save</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Description Textarea */}
      <div>
        <label className="block text-xs font-mono text-stone-300 font-bold mb-1">
          Full Rules Description & Mechanical Effects *
        </label>
        <textarea
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe full spell effects, triggers, area dimensions, visual lore, and edge cases..."
          className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
        />
      </div>

      {/* Validation & Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Homebrew Spell" />

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold font-mono transition border border-stone-800 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save to Compendium</span>
        </button>
      </div>

      {/* Game-Breaking Warning Confirmation Modal */}
      <ValidationConfirmModal
        isOpen={showOverrideModal}
        entryName={name}
        category="Spell"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
