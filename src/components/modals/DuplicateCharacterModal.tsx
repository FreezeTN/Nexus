import React, { useState } from 'react';
import { CharacterData } from '../../types';
import { Copy, X, Layers, Sparkles, Heart, ShieldAlert, Bookmark } from 'lucide-react';
import { DuplicateCharacterOptions } from '../../utils/characterSessionSync';

interface DuplicateCharacterModalProps {
  character: CharacterData;
  onClose: () => void;
  onDuplicate: (charId: string, options: DuplicateCharacterOptions) => void;
}

export const DuplicateCharacterModal: React.FC<DuplicateCharacterModalProps> = ({
  character,
  onClose,
  onDuplicate
}) => {
  const [name, setName] = useState(`${character.name} (Copy)`);
  const [campaignName, setCampaignName] = useState(character.campaignName || '');
  const [versionTag, setVersionTag] = useState(
    character.campaignName ? '' : (character.versionTag ? `${character.versionTag} v2` : 'Session Version')
  );
  const [linkToBase, setLinkToBase] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onDuplicate(character.id, {
      name: name.trim(),
      campaignName: campaignName.trim(),
      versionTag: versionTag.trim(),
      linkToBase
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-300 shadow">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-lg">
                Duplicate / Create Character Version
              </h3>
              <p className="text-xs text-stone-400">
                Create a distinct version of <strong className="text-amber-300">{character.name}</strong> for a session or campaign
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Character Name */}
          <div>
            <label className="block text-stone-300 font-semibold mb-1">
              Version Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Valeros (Session 3)"
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-stone-100 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Distinct Box: Campaign & Version Tag */}
          <div className="bg-stone-950/80 border border-amber-600/40 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Campaign & Version Box (Distinguishing Tag)</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              This box is displayed prominently on character cards, sheets, and menus to easily distinguish between different campaigns, one-shots, or versions of this character.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-stone-400 font-medium mb-1">
                  Active Campaign
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Curse of Strahd, West Marches"
                  className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-stone-400 font-medium mb-1">
                  Version Label / Sub-tag
                </label>
                <input
                  type="text"
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  placeholder="e.g. Session 4, Level 5 One-Shot"
                  className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-stone-200 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sync to Base Character Option */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={linkToBase}
                onChange={(e) => setLinkToBase(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-stone-200 block">
                  Link to Base Character (Auto-Sync Permanent Progression)
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5 leading-relaxed">
                  Permanent updates made during session gameplay (Level, XP, Spells, Inventory, Wealth, Lost Limbs, Feats) will automatically update your original Base Character.
                </span>
              </div>
            </label>

            {linkToBase && (
              <div className="ml-6 mt-2 pt-2 border-t border-stone-800/80 flex items-center gap-2 text-[11px] text-emerald-400">
                <Heart className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Full HP Guarantee:</strong> The Base Character outside the session always remains at 100% full HP and clear of temporary combat conditions.
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Create Version / Duplicate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
