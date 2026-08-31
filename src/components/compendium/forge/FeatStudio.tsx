import React, { useState, useMemo } from 'react';
import { CompendiumItem } from '../../../data/compendiumData';
import { SupportedEdition } from './ForgeTypes';
import { Scroll, Save, Plus, Shield, Award, Sparkles, BookOpen } from 'lucide-react';
import { validateHomebrewFeat, ValidationResult } from '../../../utils/homebrewValidator';
import { ValidationBadgeBanner } from './ValidationBadgeBanner';
import { ValidationConfirmModal } from './ValidationConfirmModal';

interface FeatStudioProps {
  edition: SupportedEdition;
  sourceAuthor: string;
  onSave: (item: CompendiumItem) => void;
  onClose: () => void;
}

export const FeatStudio: React.FC<FeatStudioProps> = ({
  edition,
  sourceAuthor,
  onSave,
  onClose
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fantasy Feat fields
  const [category, setCategory] = useState('General');
  const [prerequisite, setPrerequisite] = useState('');
  const [actionType, setActionType] = useState('Passive');
  const [charges, setCharges] = useState('');
  const [statBonus, setStatBonus] = useState('');

  // PF2e Specific
  const [pf2Level, setPf2Level] = useState(1);
  const [pf2Traits, setPf2Traits] = useState('General, Skill');
  const [pf2Actions, setPf2Actions] = useState('Passive');

  // Shadowrun Quality Fields
  const [srQualityType, setSrQualityType] = useState<'Positive' | 'Negative'>('Positive');
  const [srKarmaVal, setSrKarmaVal] = useState(10);
  const [srQualityCategory, setSrQualityCategory] = useState<'Physical' | 'Mental' | 'Social' | 'Matrix' | 'Arcane'>('Physical');
  const [srModifierText, setSrModifierText] = useState('+2 to all Perception checks, or +1 Initiative Die');

  // Call of Cthulhu Talent / Occupation / Trauma Fields
  const [cocTalentType, setCocTalentType] = useState<'Pulp Talent' | 'Occupation Template' | 'Insanity / Phobia' | 'Mythos Epiphany'>('Pulp Talent');
  const [cocSanReq, setCocSanReq] = useState('None');
  const [cocSkillBonuses, setCocSkillBonuses] = useState('+20% Spot Hidden, +15% Stealth, +10% Firearms');
  const [cocSpecialRule, setCocSpecialRule] = useState('Spend 10 Luck to ignore a critical failure once per session.');

  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Live Validation
  const validation = useMemo(() => {
    return validateHomebrewFeat({
      name,
      category,
      prerequisite,
      statBonus,
      description,
      edition
    });
  }, [name, category, prerequisite, statBonus, description, edition]);

  const executeSave = () => {
    let featDataPayload: any = {};
    let descSummary = description.trim();
    let itemTags: string[] = ['feats', edition, 'Homebrew'];

    if (edition === 'shadowrun') {
      itemTags.push(srQualityType, srQualityCategory, `${srKarmaVal} Karma`);
      featDataPayload = {
        name: name.trim(),
        category: `${srQualityType} Quality (${srQualityCategory})`,
        source: `${srQualityType === 'Positive' ? 'Bonus' : 'Flaw'}: ${srKarmaVal} Karma`,
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `${srQualityType} Quality [${srQualityCategory}]. Karma: ${srQualityType === 'Positive' ? '-' : '+'}${srKarmaVal} Karma. Effects: ${srModifierText}.`;
      }
    } else if (edition === 'cthulhu') {
      itemTags.push(cocTalentType, 'Call of Cthulhu');
      featDataPayload = {
        name: name.trim(),
        category: cocTalentType,
        source: `SAN Req: ${cocSanReq}`,
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `${cocTalentType}. Sanity Req: ${cocSanReq}. Skill Bonuses: ${cocSkillBonuses}. Rule: ${cocSpecialRule}.`;
      }
    } else if (edition === 'pathfinder') {
      itemTags.push(`Level ${pf2Level}`, category, pf2Traits);
      featDataPayload = {
        name: name.trim(),
        category: `Feat ${pf2Level}`,
        prerequisite: prerequisite.trim() || undefined,
        source: pf2Traits,
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `Level ${pf2Level} Feat (${pf2Traits}). Actions: ${pf2Actions}.${prerequisite ? ` Prerequisites: ${prerequisite}.` : ''}`;
      }
    } else {
      // 5e & 3.5e
      itemTags.push(category);
      if (prerequisite.trim()) itemTags.push('Has Prereq');
      featDataPayload = {
        name: name.trim(),
        category,
        prerequisite: prerequisite.trim() || undefined,
        source: sourceAuthor.trim() || 'Custom Homebrew',
        description: description.trim()
      };
      if (!descSummary) {
        descSummary = `${category} Feat.${prerequisite ? ` Requires: ${prerequisite}.` : ''}${statBonus ? ` Ability Bonus: ${statBonus}.` : ''}`;
      }
    }

    const newItem: CompendiumItem = {
      id: `custom-feat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category: 'feats',
      edition,
      source: sourceAuthor.trim() || 'Custom Homebrew',
      description: descSummary,
      isCustom: true,
      tags: itemTags,
      featData: featDataPayload
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
      {/* SHADOWRUN QUALITIES */}
      {edition === 'shadowrun' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-cyan-300 font-bold mb-1">
                Quality Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Quick Healer, High Pain Tolerance, SINner (Criminal), Gremlins"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-cyan-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Quality Type</label>
              <select
                value={srQualityType}
                onChange={(e) => setSrQualityType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Positive">Positive Quality (Costs Karma)</option>
                <option value="Negative">Negative Quality (Gives Karma)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Karma Value</label>
              <input
                type="number"
                value={srKarmaVal}
                onChange={(e) => setSrKarmaVal(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-cyan-300 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Quality Category</label>
              <select
                value={srQualityCategory}
                onChange={(e) => setSrQualityCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Physical">Physical</option>
                <option value="Mental">Mental</option>
                <option value="Social">Social</option>
                <option value="Matrix">Matrix / Resonance</option>
                <option value="Arcane">Arcane / Awakened</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Dice Pool Modifier</label>
              <input
                type="text"
                value={srModifierText}
                onChange={(e) => setSrModifierText(e.target.value)}
                placeholder="+2 to Perception, -1 to Matrix tests"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* CALL OF CTHULHU TALENTS & OCCUPATIONS */}
      {edition === 'cthulhu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-emerald-400 font-bold mb-1">
                Talent / Archetype / Trauma Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Iron Will, Mythos Epiphany, Shadow Over Innsmouth Taint, Hardened"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-emerald-500/40 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Talent Type</label>
              <select
                value={cocTalentType}
                onChange={(e) => setCocTalentType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
              >
                <option value="Pulp Talent">Pulp Cthulhu Talent</option>
                <option value="Occupation Template">Occupation Package</option>
                <option value="Insanity / Phobia">Insanity / Phobia / Mania</option>
                <option value="Mythos Epiphany">Mythos Epiphany / Boon</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Sanity / Prereq Requirement</label>
              <input
                type="text"
                value={cocSanReq}
                onChange={(e) => setCocSanReq(e.target.value)}
                placeholder="Requires SAN < 40 or Occult 50%"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Skill Packages (% Bonuses)</label>
              <input
                type="text"
                value={cocSkillBonuses}
                onChange={(e) => setCocSkillBonuses(e.target.value)}
                placeholder="+20% Spot Hidden, +15% Firearms"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* PATHFINDER 2E FEATS */}
      {edition === 'pathfinder' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-amber-300 font-bold mb-1">Feat Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sudden Charge, Battle Medicine, Quick Draw"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Feat Level</label>
              <select
                value={pf2Level}
                onChange={(e) => setPf2Level(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(l => (
                  <option key={l} value={l}>Level {l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Action Cost</label>
              <select
                value={pf2Actions}
                onChange={(e) => setPf2Actions(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-200 text-xs font-mono"
              >
                <option value="Passive">Passive</option>
                <option value="1 Action (◆)">1 Action (◆)</option>
                <option value="2 Actions (◆◆)">2 Actions (◆◆)</option>
                <option value="3 Actions (◆◆◆)">3 Actions (◆◆◆)</option>
                <option value="Reaction (⤾)">Reaction (⤾)</option>
                <option value="Free Action (◇)">Free Action (◇)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Traits</label>
              <input
                type="text"
                value={pf2Traits}
                onChange={(e) => setPf2Traits(e.target.value)}
                placeholder="General, Skill, Flourish, Stance"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Prerequisites</label>
              <input
                type="text"
                value={prerequisite}
                onChange={(e) => setPrerequisite(e.target.value)}
                placeholder="Expert in Athletics, STR 14"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* D&D 5E & 3.5E FEATS */}
      {(edition === '5e' || edition === '3.5e') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Feat Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sentinel, Metamagic Adept, Power Attack, Cleave"
                className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-stone-100 text-sm font-serif font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-stone-300 font-bold mb-1">Feat Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 font-mono font-bold text-xs"
              >
                <option value="General">General</option>
                <option value="Combat">Combat Feat</option>
                <option value="Metamagic">Metamagic (3.5e/5e)</option>
                <option value="Origin">Origin / Background</option>
                <option value="Epic Boon">Epic Boon</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Prerequisites</label>
              <input
                type="text"
                value={prerequisite}
                onChange={(e) => setPrerequisite(e.target.value)}
                placeholder="STR 13, Base Attack +1"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Action Economy</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              >
                <option value="Passive">Passive Constant</option>
                <option value="Action">Action</option>
                <option value="Bonus Action">Bonus Action / Swift</option>
                <option value="Reaction">Reaction / Immediate</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 mb-1">Stat Bonus (Half-Feat)</label>
              <input
                type="text"
                value={statBonus}
                onChange={(e) => setStatBonus(e.target.value)}
                placeholder="+1 Strength or Dexterity"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-200 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-mono text-stone-300 font-bold mb-1">
          Mechanical Benefits & Rules Text *
        </label>
        <textarea
          rows={4}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detail all benefits, modifiers, passive perks, and conditions..."
          className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
        />
      </div>

      {/* Validation & Game Balance Guard */}
      <ValidationBadgeBanner validation={validation} categoryLabel="Feat / Quality" />

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
        category="Feat"
        validation={validation}
        onProceedAnyway={executeSave}
        onCancel={() => setShowOverrideModal(false)}
      />
    </form>
  );
};
