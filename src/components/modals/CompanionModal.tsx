import React, { useState } from 'react';
import { CharacterData, RuleEdition } from '../../types';
import { PRESET_COMPANIONS, CompanionPreset, calculate35eFamiliarBonusStats, isCompanionSummonAbility } from '../../data/companionData';
import { Shield, Sparkles, Plus, Trash2, PawPrint, Users, Heart, Zap, X, Dices, BookOpen, Crown } from 'lucide-react';

interface CompanionModalProps {
  isOpen: boolean;
  character: CharacterData;
  edition?: RuleEdition;
  onUpdateCharacter: (updated: CharacterData) => void;
  onAddMonsterToRoster?: (monster: CharacterData) => void;
  onClose: () => void;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onRollDamage?: (label: string, expression: string) => void;
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  isOpen,
  character,
  edition = '5e',
  onUpdateCharacter,
  onAddMonsterToRoster,
  onClose,
  onRoll,
  onRollDamage
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom companion form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<CompanionPreset['category']>('Familiar');
  const [customHp, setCustomHp] = useState(10);
  const [customAc, setCustomAc] = useState(12);
  const [customSpeed, setCustomSpeed] = useState('30 ft.');
  const [customStr, setCustomStr] = useState(10);
  const [customDex, setCustomDex] = useState(14);
  const [customCon, setCustomCon] = useState(12);
  const [customInt, setCustomInt] = useState(6);
  const [customWis, setCustomWis] = useState(12);
  const [customCha, setCustomCha] = useState(8);
  const [customAttackName, setCustomAttackName] = useState('Bite');
  const [customAttackBonus, setCustomAttackBonus] = useState(4);
  const [customDamageExpr, setCustomDamageExpr] = useState('1d6+2');
  const [customSpecialNote, setCustomSpecialNote] = useState('');

  if (!isOpen) return null;

  const currentEditionKey = edition === '3.5e' ? '3.5e' : '5e';
  const masterLevel = character.level || 1;

  // Filter presets
  const filteredPresets = PRESET_COMPANIONS.filter(p => {
    if (p.edition !== 'both' && p.edition !== currentEditionKey) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    return true;
  });

  const handleSummonPreset = (preset: CompanionPreset) => {
    // 3.5e Familiar calculation if applicable
    let finalHp = preset.hp;
    let finalAc = preset.ac;
    let finalInt = preset.int;
    let specialTraitsList = [...preset.specialTraits];

    if (currentEditionKey === '3.5e' && preset.category === 'Familiar') {
      const b = calculate35eFamiliarBonusStats(masterLevel, character.hpMax);
      finalHp = b.familiarHp;
      finalAc = preset.ac + b.naturalArmorBonus;
      finalInt = b.intScore;
      b.specialAbilities.forEach(ab => {
        specialTraitsList.push({ name: ab, description: `3.5e Familiar Special Ability (Master Level ${masterLevel})` });
      });
    }

    const speedNum = parseInt(preset.speed) || 30;
    const companionCharacter: CharacterData = {
      id: `companion-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${preset.name} (${character.name}'s ${preset.category})`,
      race: preset.size + ' Beast / Spirit',
      characterClass: preset.category,
      subclass: 'Companion',
      level: masterLevel,
      background: 'Summoned Companion',
      alignment: 'Neutral',
      experiencePoints: 0,
      edition: currentEditionKey as any,
      hpCurrent: finalHp,
      hpMax: finalHp,
      hpTemp: 0,
      hitDiceTotal: '1d8',
      hitDiceCurrent: 1,
      armorClass: finalAc,
      speed: speedNum,
      initiativeBonus: Math.floor((preset.dex - 10) / 2),
      inspiration: false,
      deathSavesSuccesses: 0,
      deathSavesFailures: 0,
      abilities: {
        STR: { score: preset.str },
        DEX: { score: preset.dex },
        CON: { score: preset.con },
        INT: { score: finalInt },
        WIS: { score: preset.wis },
        CHA: { score: preset.cha },
      },
      savingThrowProficiencies: [],
      skills: [],
      isMonster: true,
      additionalNotes: `Summoned / Bound Companion of ${character.name}.\nMaster Bonus (3.5e): ${preset.masterBonuses35e || 'None'}\nSenses: ${preset.senses || 'Normal'}`,
      attacks: preset.attacks.map((a, idx) => ({
        id: `atk-${Date.now()}-${idx}`,
        name: a.name,
        attackBonus: a.attackBonus,
        damage: a.damage,
        damageType: a.damageType,
        range: 'Melee',
        notes: a.description
      })),
      classFeatures: specialTraitsList.map((t, idx) => ({
        id: `trait-${Date.now()}-${idx}`,
        name: t.name,
        description: t.description,
        source: `${preset.category} Trait`
      })),
      feats: [],
      inventory: [],
      spells: [],
      isSpellcaster: false,
      spellcastingAbility: 'WIS',
      spellSlots: [],
      wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstory: `Bound companion of ${character.name}`,
      alliesAndOrganizations: character.name,
      conditions: [`Companion of ${character.name}`]
    };

    if (onAddMonsterToRoster) {
      onAddMonsterToRoster(companionCharacter);
    }

    // Also attach reference note to character
    const updatedNotes = character.additionalNotes
      ? `${character.additionalNotes}\n🐾 Active ${preset.category}: ${preset.name} (HP ${finalHp}/${finalHp})`
      : `🐾 Active ${preset.category}: ${preset.name} (HP ${finalHp}/${finalHp})`;

    onUpdateCharacter({
      ...character,
      additionalNotes: updatedNotes
    });

    alert(`✨ ${preset.name} has been summoned and added to your Campaign Roster!`);
    onClose();
  };

  const handleSummonCustom = () => {
    if (!customName.trim()) {
      alert('Please enter a name for your companion.');
      return;
    }

    const speedNum = parseInt(customSpeed) || 30;
    const companionCharacter: CharacterData = {
      id: `companion-custom-${Date.now()}`,
      name: `${customName} (${character.name}'s ${customCategory})`,
      race: 'Custom Companion',
      characterClass: customCategory,
      subclass: 'Companion',
      level: masterLevel,
      background: 'Summoned Companion',
      alignment: 'Unaligned',
      experiencePoints: 0,
      edition: currentEditionKey as any,
      hpCurrent: customHp,
      hpMax: customHp,
      hpTemp: 0,
      hitDiceTotal: '1d8',
      hitDiceCurrent: 1,
      armorClass: customAc,
      speed: speedNum,
      initiativeBonus: Math.floor((customDex - 10) / 2),
      inspiration: false,
      deathSavesSuccesses: 0,
      deathSavesFailures: 0,
      abilities: {
        STR: { score: customStr },
        DEX: { score: customDex },
        CON: { score: customCon },
        INT: { score: customInt },
        WIS: { score: customWis },
        CHA: { score: customCha },
      },
      savingThrowProficiencies: [],
      skills: [],
      isMonster: true,
      additionalNotes: `Custom Companion of ${character.name}.\nNotes: ${customSpecialNote}`,
      attacks: [
        {
          id: `atk-${Date.now()}`,
          name: customAttackName || 'Natural Attack',
          attackBonus: customAttackBonus,
          damage: customDamageExpr,
          damageType: 'Piercing',
          range: 'Melee'
        }
      ],
      classFeatures: customSpecialNote ? [
        {
          id: `f-${Date.now()}`,
          name: 'Special Ability',
          description: customSpecialNote,
          source: 'Companion Ability'
        }
      ] : [],
      feats: [],
      inventory: [],
      spells: [],
      isSpellcaster: false,
      spellcastingAbility: 'WIS',
      spellSlots: [],
      wealth: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstory: `Bound companion of ${character.name}`,
      alliesAndOrganizations: character.name,
      conditions: [`Companion of ${character.name}`]
    };

    if (onAddMonsterToRoster) {
      onAddMonsterToRoster(companionCharacter);
    }

    onUpdateCharacter({
      ...character,
      additionalNotes: (character.additionalNotes || '') + `\n🐾 Active Companion: ${customName}`
    });

    alert(`✨ Custom Companion "${customName}" has been summoned into your Campaign Roster!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-emerald-600/60 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border-b border-emerald-700/60 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐾</span>
            <div>
              <h2 className="text-xl font-bold text-emerald-200 flex items-center gap-2">
                <span>Summon Animal Companion & Familiar Engine</span>
                <span className="text-xs bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono uppercase">
                  {currentEditionKey} Edition
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Instantly conjure, bind, and manage Familiars, Animal Companions, Mounts, and Summoned Spirits into your campaign roster.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-2 rounded-xl hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edition Rule Callout Banner */}
        <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {currentEditionKey === '3.5e' ? (
                <span><strong>3.5e Rules Active:</strong> Familiars share half of Master HP ({Math.max(1, Math.floor(character.hpMax / 2))} HP), gain Natural Armor & Intelligence with Master Level {masterLevel}, and grant passive skill/stat bonuses to the Master.</span>
              ) : (
                <span><strong>5e Rules Active:</strong> Primal Companions, Familiars, and Summon Spirits scale attack bonuses and defenses with your Proficiency Bonus (+{Math.floor(((character.level || 1) - 1) / 4) + 2}).</span>
              )}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 shrink-0">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'presets'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Official Companion Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'custom'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Plus className="w-4 h-4" /> Custom Companion Builder
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'presets' && (
            <>
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                {['All', 'Familiar', 'Animal Companion', 'Steed / Mount', 'Summoned Spirit'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-stone-950 shadow'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPresets.map(preset => {
                  let scaledHp = preset.hp;
                  let scaledAc = preset.ac;
                  if (currentEditionKey === '3.5e' && preset.category === 'Familiar') {
                    const b = calculate35eFamiliarBonusStats(masterLevel, character.hpMax);
                    scaledHp = b.familiarHp;
                    scaledAc = preset.ac + b.naturalArmorBonus;
                  }

                  return (
                    <div
                      key={preset.id}
                      className="bg-stone-950/80 border border-stone-800 hover:border-emerald-500/60 p-4 rounded-xl space-y-3 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                              <span>{preset.name}</span>
                              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-sans font-semibold">
                                {preset.category}
                              </span>
                            </h3>
                            <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                              {preset.size} • {preset.crOrLevelReq}
                            </div>
                          </div>
                          <span className="text-[11px] bg-emerald-950 border border-emerald-600/50 text-emerald-300 px-2 py-0.5 rounded-lg font-mono font-bold">
                            HP {scaledHp} | AC {scaledAc}
                          </span>
                        </div>

                        {/* Ability Scores Row */}
                        <div className="grid grid-cols-6 gap-1 bg-stone-900/90 p-1.5 rounded-lg text-center text-[10px] my-2 font-mono border border-stone-800">
                          <div><span className="text-stone-500 block">STR</span><span className="font-bold text-amber-300">{preset.str}</span></div>
                          <div><span className="text-stone-500 block">DEX</span><span className="font-bold text-amber-300">{preset.dex}</span></div>
                          <div><span className="text-stone-500 block">CON</span><span className="font-bold text-amber-300">{preset.con}</span></div>
                          <div><span className="text-stone-500 block">INT</span><span className="font-bold text-amber-300">{preset.int}</span></div>
                          <div><span className="text-stone-500 block">WIS</span><span className="font-bold text-amber-300">{preset.wis}</span></div>
                          <div><span className="text-stone-500 block">CHA</span><span className="font-bold text-amber-300">{preset.cha}</span></div>
                        </div>

                        {/* Traits */}
                        <div className="space-y-1 my-2">
                          {preset.specialTraits.map((trait, idx) => (
                            <div key={idx} className="text-xs text-stone-300">
                              <span className="font-bold text-emerald-300">{trait.name}: </span>
                              <span className="text-stone-400">{trait.description}</span>
                            </div>
                          ))}
                          {preset.masterBonuses35e && currentEditionKey === '3.5e' && (
                            <div className="text-xs text-amber-300 font-semibold bg-amber-950/40 p-1.5 rounded border border-amber-700/40 mt-1">
                              👑 3.5e Master Bonus: {preset.masterBonuses35e}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSummonPreset(preset)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <span>✨</span>
                        <span>Summon & Add to Campaign Roster</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'custom' && (
            <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-200 uppercase font-serif">Design Custom Companion or Minion</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Companion Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Barnaby the Shadow Raven"
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Type / Category</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                  >
                    <option value="Familiar">Familiar</option>
                    <option value="Animal Companion">Animal Companion</option>
                    <option value="Steed / Mount">Steed / Mount</option>
                    <option value="Summoned Spirit">Summoned Spirit</option>
                    <option value="Fiend / Undead">Fiend / Undead</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Hit Points (HP)</label>
                  <input
                    type="number"
                    value={customHp}
                    onChange={e => setCustomHp(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Armor Class (AC)</label>
                  <input
                    type="number"
                    value={customAc}
                    onChange={e => setCustomAc(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Speed</label>
                  <input
                    type="text"
                    value={customSpeed}
                    onChange={e => setCustomSpeed(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-6 gap-2 bg-stone-900 p-2 rounded-xl border border-stone-800">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">STR</label>
                  <input type="number" value={customStr} onChange={e => setCustomStr(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">DEX</label>
                  <input type="number" value={customDex} onChange={e => setCustomDex(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">CON</label>
                  <input type="number" value={customCon} onChange={e => setCustomCon(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">INT</label>
                  <input type="number" value={customInt} onChange={e => setCustomInt(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">WIS</label>
                  <input type="number" value={customWis} onChange={e => setCustomWis(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 text-center">CHA</label>
                  <input type="number" value={customCha} onChange={e => setCustomCha(Number(e.target.value))} className="w-full bg-stone-950 text-center text-xs p-1 rounded border border-stone-700 text-amber-300 font-bold" />
                </div>
              </div>

              {/* Primary Attack */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Attack Name</label>
                  <input type="text" value={customAttackName} onChange={e => setCustomAttackName(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Attack Bonus (+)</label>
                  <input type="number" value={customAttackBonus} onChange={e => setCustomAttackBonus(Number(e.target.value))} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">Damage Expression</label>
                  <input type="text" value={customDamageExpr} onChange={e => setCustomDamageExpr(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">Special Abilities / Traits</label>
                <textarea
                  value={customSpecialNote}
                  onChange={e => setCustomSpecialNote(e.target.value)}
                  placeholder="e.g. Telepathic link up to 100 ft, delivers touch spells, darkvision..."
                  rows={2}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs text-stone-100 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleSummonCustom}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <span>✨</span>
                <span>Summon Custom Companion</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
