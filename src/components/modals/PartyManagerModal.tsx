import React, { useState } from 'react';
import { CharacterData, Party } from '../../types';
import { Users, Plus, Shield, Heart, Eye, Trash2, Edit3, Check, Swords, UserPlus, UserMinus, Sparkles, X, ChevronRight, Crown } from 'lucide-react';
import { getPassivePerception } from '../../utils/dndCalculations';

interface PartyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parties: Party[];
  allCharacters: CharacterData[];
  activeCharacterId: string;
  onUpdateParties: (parties: Party[]) => void;
  onSelectCharacter?: (charId: string) => void;
  onAddPartyToEncounter?: (party: Party) => void;
}

export const PartyManagerModal: React.FC<PartyManagerModalProps> = ({
  isOpen,
  onClose,
  parties,
  allCharacters,
  activeCharacterId,
  onUpdateParties,
  onSelectCharacter,
  onAddPartyToEncounter
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    parties[0]?.id || ''
  );

  // New Party Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyDesc, setNewPartyDesc] = useState('');
  const [newPartyMemberIds, setNewPartyMemberIds] = useState<string[]>([activeCharacterId]);

  // Edit Party State
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete Confirmation State
  const [confirmDeletePartyId, setConfirmDeletePartyId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && (!selectedPartyId || !parties.some(p => p.id === selectedPartyId))) {
      if (parties.length > 0) {
        setSelectedPartyId(parties[0].id);
      } else {
        setIsCreating(true);
      }
    }
  }, [isOpen, parties, selectedPartyId]);

  if (!isOpen) return null;

  const currentParty = parties.find(p => p.id === selectedPartyId) || parties[0];

  const handleCreateParty = () => {
    if (!newPartyName.trim()) return;
    const newParty: Party = {
      id: 'party-' + Date.now(),
      name: newPartyName.trim(),
      description: newPartyDesc.trim() || undefined,
      characterIds: newPartyMemberIds,
      createdAt: new Date().toISOString()
    };

    const updated = [...parties, newParty];
    onUpdateParties(updated);
    setSelectedPartyId(newParty.id);
    setIsCreating(false);
    setNewPartyName('');
    setNewPartyDesc('');
    setNewPartyMemberIds([activeCharacterId]);
  };

  const handleStartEdit = (party: Party) => {
    setEditingPartyId(party.id);
    setEditName(party.name);
    setEditDesc(party.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingPartyId || !editName.trim()) return;
    const updated = parties.map(p =>
      p.id === editingPartyId
        ? { ...p, name: editName.trim(), description: editDesc.trim() || undefined }
        : p
    );
    onUpdateParties(updated);
    setEditingPartyId(null);
  };

  const handleDeleteParty = (partyId: string) => {
    const updated = parties.filter(p => p.id !== partyId);
    onUpdateParties(updated);
    setConfirmDeletePartyId(null);
    if (updated.length > 0) {
      setSelectedPartyId(updated[0].id);
    } else {
      setSelectedPartyId('');
      setIsCreating(true);
    }
  };

  const handleToggleMember = (partyId: string, charId: string) => {
    const updated = parties.map(p => {
      if (p.id === partyId) {
        const exists = p.characterIds.includes(charId);
        const newMemberIds = exists
          ? p.characterIds.filter(id => id !== charId)
          : [...p.characterIds, charId];
        return { ...p, characterIds: newMemberIds };
      }
      return p;
    });
    onUpdateParties(updated);
  };

  const handleToggleNewMember = (charId: string) => {
    if (newPartyMemberIds.includes(charId)) {
      setNewPartyMemberIds(prev => prev.filter(id => id !== charId));
    } else {
      setNewPartyMemberIds(prev => [...prev, charId]);
    }
  };

  // Party calculations
  const partyMembers = currentParty
    ? allCharacters.filter(c => currentParty.characterIds.includes(c.id))
    : [];

  const totalPartyHp = partyMembers.reduce((acc, c) => acc + (c.hpMax || 0), 0);
  const currentPartyHp = partyMembers.reduce((acc, c) => acc + (c.hpCurrent || 0), 0);
  const avgLevel = partyMembers.length
    ? Math.round((partyMembers.reduce((acc, c) => acc + (c.level || 1), 0) / partyMembers.length) * 10) / 10
    : 0;
  const avgPassivePerception = partyMembers.length
    ? Math.round(partyMembers.reduce((acc, c) => acc + getPassivePerception(c), 0) / partyMembers.length)
    : 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl max-w-4xl w-full shadow-2xl text-stone-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-300">Party Manager & Adventuring Groups</h2>
              <p className="text-xs text-stone-400">
                Organize party members, allies, and add full parties directly to encounters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 hover:text-stone-100 hover:bg-stone-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Sidebar: Party List */}
          <div className="w-full md:w-64 bg-stone-950/80 border-r border-stone-800 p-4 flex flex-col gap-3 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-400 uppercase">Your Parties ({parties.length})</span>
              <button
                onClick={() => setIsCreating(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-lg text-xs flex items-center gap-1 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" /> New Party
              </button>
            </div>

            <div className="space-y-2 flex-1">
              {parties.map(p => {
                const isSelected = p.id === selectedPartyId;
                const validMembers = allCharacters.filter(c => p.characterIds.includes(c.id));
                const membersCount = validMembers.length;
                const containsActiveChar = p.characterIds.includes(activeCharacterId);

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPartyId(p.id);
                      setIsCreating(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/70 shadow-md'
                        : 'bg-stone-900/60 border-stone-800 hover:bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-serif font-bold text-sm ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                        {p.name}
                      </span>
                      {containsActiveChar && (
                        <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                          ACTIVE CHAR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                      <span className="text-emerald-400 font-semibold">Allies United</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-stone-900">
            {isCreating ? (
              /* CREATE NEW PARTY FORM */
              <div className="space-y-4 max-w-xl mx-auto bg-stone-950 border border-stone-800 p-5 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h3 className="font-serif font-bold text-amber-300 text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Create New Party
                  </h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-stone-400 hover:text-stone-200 text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-300 font-bold mb-1">Party Name *</label>
                    <input
                      type="text"
                      value={newPartyName}
                      onChange={e => setNewPartyName(e.target.value)}
                      placeholder="e.g. Heroes of Phandalin, Crown Vanguard"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">Party Description (Optional)</label>
                    <textarea
                      value={newPartyDesc}
                      onChange={e => setNewPartyDesc(e.target.value)}
                      rows={2}
                      placeholder="Brief details about the adventuring campaign or party background..."
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold mb-2">Select Initial Members</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-stone-900 border border-stone-800 rounded-xl">
                      {allCharacters.map(char => {
                        const isSelected = newPartyMemberIds.includes(char.id);
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => handleToggleNewMember(char.id)}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                                : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {char.portraitUrl ? (
                                <img src={char.portraitUrl} alt={char.name} className="w-6 h-6 rounded-full object-cover border border-amber-500/40" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 font-bold text-[10px] flex items-center justify-center">
                                  {char.name[0]}
                                </div>
                              )}
                              <span className="font-bold text-xs">{char.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateParty}
                      disabled={!newPartyName.trim()}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl font-extrabold shadow-lg disabled:opacity-50"
                    >
                      Create Party
                    </button>
                  </div>
                </div>
              </div>
            ) : currentParty ? (
              /* VIEW / EDIT SELECTED PARTY */
              <div className="space-y-5">
                {/* Party Header Banner */}
                <div className="bg-stone-950 border border-stone-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    {editingPartyId === currentParty.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="bg-stone-900 border border-amber-500 px-3 py-1 rounded-lg font-serif font-bold text-amber-200 text-lg"
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-amber-600 text-stone-950 font-bold rounded-lg text-xs"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-serif font-extrabold text-amber-200 flex items-center gap-2">
                          {currentParty.name}
                        </h3>
                        <button
                          onClick={() => handleStartEdit(currentParty)}
                          className="text-stone-400 hover:text-amber-300 transition p-1"
                          title="Edit Party Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-stone-400">{currentParty.description || 'No party description set.'}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" /> Allied Adventuring Bond Active
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {onAddPartyToEncounter && (
                      <button
                        onClick={() => {
                          onAddPartyToEncounter(currentParty);
                          onClose();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-amber-700 hover:from-purple-600 hover:to-amber-600 text-white rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition"
                      >
                        <Swords className="w-4 h-4" />
                        <span>Add Entire Party to Encounter</span>
                      </button>
                    )}
                    {confirmDeletePartyId === currentParty.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600/80 p-1 rounded-xl">
                        <span className="text-[11px] font-bold text-rose-200 px-2 font-mono">Delete Party?</span>
                        <button
                          onClick={() => handleDeleteParty(currentParty.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-stone-950 font-extrabold rounded-lg text-xs shadow transition"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeletePartyId(null)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-lg text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeletePartyId(currentParty.id)}
                        className="p-2 bg-stone-900 hover:bg-rose-950 border border-stone-800 hover:border-rose-800 text-stone-400 hover:text-rose-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
                        title="Delete Party"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Party Members</div>
                    <div className="text-2xl font-serif font-extrabold text-amber-200">{partyMembers.length}</div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Party HP Pool</div>
                    <div className="text-2xl font-serif font-extrabold text-emerald-300">{currentPartyHp} / {totalPartyHp}</div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Average Level</div>
                    <div className="text-2xl font-serif font-extrabold text-purple-300">Lvl {avgLevel || 1}</div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl text-center">
                    <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Avg Passive Perception</div>
                    <div className="text-2xl font-serif font-extrabold text-cyan-300">{avgPassivePerception}</div>
                  </div>
                </div>

                {/* Party Members Roster */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" /> Current Party Roster ({partyMembers.length})
                    </h4>
                    <span className="text-[11px] font-mono text-stone-400">All members are considered sworn Allies</span>
                  </div>

                  {partyMembers.length === 0 ? (
                    <div className="bg-stone-950 border border-stone-800 p-6 text-center rounded-xl text-stone-400 text-xs">
                      No characters currently in this party. Use the character list below to add members.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {partyMembers.map(char => {
                        const isActive = char.id === activeCharacterId;
                        const passivePerception = getPassivePerception(char);

                        return (
                          <div
                            key={char.id}
                            className={`bg-stone-950 border rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow transition ${
                              isActive
                                ? 'border-amber-500/80 shadow-amber-950/40'
                                : 'border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                {char.portraitUrl ? (
                                  <img src={char.portraitUrl} alt={char.name} className="w-10 h-10 rounded-full object-cover border border-amber-500/50 shadow" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-stone-800 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center font-serif text-sm">
                                    {char.name[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-serif font-bold text-stone-100 text-sm">{char.name}</span>
                                    {isActive && (
                                      <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-stone-400">
                                    Lvl {char.level || 1} {char.race} {char.characterClass}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleToggleMember(currentParty.id, char.id)}
                                className="text-stone-500 hover:text-rose-400 p-1.5 transition"
                                title="Remove from Party"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Stats Line */}
                            <div className="grid grid-cols-3 gap-2 text-center bg-stone-900/80 p-2 rounded-lg border border-stone-800/80 text-[11px] font-mono">
                              <div>
                                <span className="text-stone-500 block text-[9px]">HP</span>
                                <span className="font-bold text-emerald-300">{char.hpCurrent}/{char.hpMax}</span>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px]">AC</span>
                                <span className="font-bold text-amber-300">{char.armorClass || 10}</span>
                              </div>
                              <div>
                                <span className="text-stone-500 block text-[9px]">Passive Perc.</span>
                                <span className="font-bold text-cyan-300">{passivePerception}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            {onSelectCharacter && !isActive && (
                              <button
                                onClick={() => {
                                  onSelectCharacter(char.id);
                                  onClose();
                                }}
                                className="w-full py-1 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 hover:border-amber-600/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                              >
                                <ChevronRight className="w-3.5 h-3.5" /> Switch to {char.name}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add / Toggle Other Available Characters into Party */}
                <div className="space-y-3 pt-4 border-t border-stone-800">
                  <h4 className="font-serif font-bold text-stone-300 text-xs flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Add / Remove Other Characters to "{currentParty.name}"
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allCharacters.map(char => {
                      const isInParty = currentParty.characterIds.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          onClick={() => handleToggleMember(currentParty.id, char.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                            isInParty
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {char.portraitUrl ? (
                              <img src={char.portraitUrl} alt={char.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {char.name[0]}
                              </div>
                            )}
                            <span className="font-semibold truncate">{char.name}</span>
                          </div>
                          {isInParty ? (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 border border-amber-700 px-1.5 py-0.5 rounded">
                              In Party
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded">
                              + Add
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400 text-xs">
                No party selected. Click "New Party" on the left to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
