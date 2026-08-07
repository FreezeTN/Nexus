import React, { useState } from 'react';
import { CharacterData, Party, RuleEdition } from '../../../types';
import { Combatant } from './encounterTypes';
import { Swords, Users, UserCheck, X } from 'lucide-react';
import { getMonsterPortraitUrl, generateMonsterSvgPortrait } from '../../../data/monsterPortraits';
import { getAbilityModifier, isCharacterDead, getEffectiveMaxHp } from '../../../utils/dndCalculations';

interface AddCombatantModalProps {
  character: CharacterData;
  allCharacters?: CharacterData[];
  parties?: Party[];
  activeEdition: RuleEdition;
  onClose: () => void;
  onAddCombatant: (combatant: Combatant) => void;
  onAddPartyToEncounter: (party: Party) => void;
}

export const AddCombatantModal: React.FC<AddCombatantModalProps> = ({
  character,
  allCharacters = [],
  parties = [],
  activeEdition,
  onClose,
  onAddCombatant,
  onAddPartyToEncounter
}) => {
  const [selectedPartyIdToAdd, setSelectedPartyIdToAdd] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState<number>(10);
  const [newAc, setNewAc] = useState<number>(14);
  const [newHp, setNewHp] = useState<number>(20);
  const [newType, setNewType] = useState<'ally' | 'enemy'>('enemy');
  const [newMonsterXpReward, setNewMonsterXpReward] = useState<number>(450);
  const [newPortraitUrl, setNewPortraitUrl] = useState<string>('');

  const filteredCharacters = allCharacters.filter(c => (c.edition || '5e') === activeEdition);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setNewPortraitUrl('');
      return;
    }

    const tpl = allCharacters.find(c => c.id === templateId);
    if (!tpl) return;

    setNewName(tpl.name);
    setNewAc(tpl.armorClass || 10);
    setNewHp(tpl.hpMax || 10);
    setNewMonsterXpReward(tpl.monsterXpReward !== undefined ? tpl.monsterXpReward : (tpl.isMonster ? 450 : 0));

    const portrait = tpl.portraitUrl || (tpl.isMonster ? getMonsterPortraitUrl(tpl.name, tpl.id) : '');
    setNewPortraitUrl(portrait);

    const tplDexScore = tpl.abilities?.DEX?.score ?? 10;
    const tplDexMod = getAbilityModifier(tplDexScore);
    const tplInitBonus = (tpl.initiativeBonus || 0) + (isNaN(tplDexMod) ? 0 : tplDexMod);
    const rolledInit = Math.floor(Math.random() * 20) + 1 + tplInitBonus;

    setNewInit(rolledInit);
    setNewType(tpl.isMonster ? 'enemy' : 'ally');
  };

  const handleAddSubmit = () => {
    if (!newName.trim()) return;

    if (selectedTemplateId) {
      const tpl = allCharacters.find(c => c.id === selectedTemplateId);
      if (tpl && !tpl.isMonster && isCharacterDead(tpl)) {
        alert(`"${tpl.name}" is Dead and cannot be added to combat until revived!`);
        return;
      }
    }

    const finalPortrait = newPortraitUrl.trim() || (newType === 'enemy' ? getMonsterPortraitUrl(newName.trim()) : undefined);

    const newEntry: Combatant = {
      id: 'comb-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: newName.trim(),
      initiative: isNaN(newInit) ? 10 : newInit,
      armorClass: isNaN(newAc) ? 10 : newAc,
      hpCurrent: isNaN(newHp) ? 10 : newHp,
      hpMax: isNaN(newHp) ? 10 : newHp,
      type: newType,
      monsterXpReward: newType === 'enemy' ? (isNaN(newMonsterXpReward) ? 450 : newMonsterXpReward) : 0,
      isDefeated: false,
      portraitUrl: finalPortrait
    };

    onAddCombatant(newEntry);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-serif font-bold text-stone-100">Add Target / Monster to Encounter</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Quick Add Adventuring Party */}
          {parties && parties.length > 0 && (
            <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-xl space-y-2">
              <div className="text-amber-300 font-bold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Add Adventuring Party (Allies)</span>
                </span>
                <span className="text-[10px] font-mono text-purple-300">Group Encounter</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPartyIdToAdd}
                  onChange={(e) => setSelectedPartyIdToAdd(e.target.value)}
                  className="flex-1 bg-stone-950 border border-purple-600/50 rounded-xl p-2 text-stone-100 font-semibold focus:outline-none focus:border-purple-400"
                >
                  <option value="">-- Select Party to Add --</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.characterIds.length} members)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const foundParty = parties.find(p => p.id === selectedPartyIdToAdd);
                    if (foundParty) onAddPartyToEncounter(foundParty);
                  }}
                  disabled={!selectedPartyIdToAdd}
                  className="px-3 py-2 bg-gradient-to-r from-purple-700 to-amber-700 hover:from-purple-600 hover:to-amber-600 text-white rounded-xl font-extrabold text-xs shadow transition disabled:opacity-50 shrink-0"
                >
                  + Add Party
                </button>
              </div>
            </div>
          )}

          {/* Quick Pick Dropdown from Characters / Monsters */}
          {filteredCharacters.length > 0 && (
            <div>
              <label className="block text-amber-300 mb-1 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select from {activeEdition} Characters / Monsters</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">[{activeEdition} Active TRPG]</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full bg-stone-950 border border-amber-600/40 rounded-xl p-2.5 text-stone-100 font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Custom Manual Entry --</option>
                {filteredCharacters.map(char => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({char.isMonster ? `Monster - CR ${char.monsterXpReward ? `${char.monsterXpReward} XP` : 'Custom'}` : `Level ${char.level} ${char.characterClass}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-stone-400 mb-1 font-bold">Target Name</label>
            <input
              type="text"
              placeholder="e.g. Goblin Warchief"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-stone-400 mb-1 font-bold">Initiative</label>
              <input
                type="number"
                value={newInit}
                onChange={(e) => setNewInit(parseInt(e.target.value) || 0)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1 font-bold">Armor Class</label>
              <input
                type="number"
                value={newAc}
                onChange={(e) => setNewAc(parseInt(e.target.value) || 10)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-400 mb-1 font-bold">Max HP</label>
              <input
                type="number"
                value={newHp}
                onChange={(e) => setNewHp(parseInt(e.target.value) || 1)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-400 mb-1 font-bold">Combatant Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewType('enemy')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  newType === 'enemy'
                    ? 'bg-rose-900/80 text-rose-200 border-rose-500 shadow'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Enemy / Monster
              </button>
              <button
                type="button"
                onClick={() => setNewType('ally')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  newType === 'ally'
                    ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500 shadow'
                    : 'bg-stone-950 text-stone-400 border-stone-800'
                }`}
              >
                Ally / NPC
              </button>
            </div>
          </div>

          {newType === 'enemy' && (
            <div>
              <label className="block text-amber-300 mb-1 font-bold">Monster XP Reward</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={newMonsterXpReward}
                onChange={(e) => setNewMonsterXpReward(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-stone-400 mb-1 font-bold">Portrait Artwork URL (Optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={newPortraitUrl}
                onChange={(e) => setNewPortraitUrl(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-700 rounded-xl p-2 text-stone-100 font-sans text-xs"
              />
              {(newPortraitUrl || (newName && newType === 'enemy')) && (
                <img
                  src={newPortraitUrl || getMonsterPortraitUrl(newName)}
                  alt="Portrait preview"
                  className="w-9 h-9 rounded-xl object-cover border border-amber-500/50 shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = generateMonsterSvgPortrait(newName || 'Monster');
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-4 py-2 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSubmit}
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-2 rounded-xl shadow"
          >
            Add to Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
