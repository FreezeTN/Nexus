import React from 'react';
import { CharacterData } from '../../types';
import { ScrollText, User, Heart, Shield, BookOpen, Users, FileText } from 'lucide-react';

interface Sheet5Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
}

export const Sheet5DescriptionNotes: React.FC<Sheet5Props> = ({
  character,
  onUpdateCharacter
}) => {
  const handleTextChange = (field: keyof CharacterData, value: string) => {
    onUpdateCharacter({
      ...character,
      [field]: value
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Physical Appearance & Demographics */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-2 text-amber-300 font-serif font-bold text-lg">
          <User className="w-5 h-5 text-amber-500" />
          <span>Character Description & Appearance</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 text-xs">
          <div>
            <label className="block text-stone-400 mb-1">Gender</label>
            <input
              type="text"
              value={character.gender || ''}
              onChange={(e) => handleTextChange('gender', e.target.value)}
              placeholder="e.g. Male"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Age</label>
            <input
              type="text"
              value={character.age || ''}
              onChange={(e) => handleTextChange('age', e.target.value)}
              placeholder="e.g. 28"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Height</label>
            <input
              type="text"
              value={character.height || ''}
              onChange={(e) => handleTextChange('height', e.target.value)}
              placeholder="e.g. 6'1&quot;"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Weight</label>
            <input
              type="text"
              value={character.weight || ''}
              onChange={(e) => handleTextChange('weight', e.target.value)}
              placeholder="e.g. 190 lbs"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Eyes</label>
            <input
              type="text"
              value={character.eyes || ''}
              onChange={(e) => handleTextChange('eyes', e.target.value)}
              placeholder="e.g. Steel Blue"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Hair</label>
            <input
              type="text"
              value={character.hair || ''}
              onChange={(e) => handleTextChange('hair', e.target.value)}
              placeholder="e.g. Dark Brown"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">Skin</label>
            <input
              type="text"
              value={character.skin || ''}
              onChange={(e) => handleTextChange('skin', e.target.value)}
              placeholder="e.g. Tanned"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-amber-300 font-bold mb-1">Creature Size Category</label>
            <select
              value={character.sizeCategory || 'Medium'}
              onChange={(e) => onUpdateCharacter({ ...character, sizeCategory: e.target.value as any })}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-amber-200 font-bold"
            >
              <option value="Fine">Fine (1/8 Carry Multiplier)</option>
              <option value="Diminutive">Diminutive (1/4 Carry Multiplier)</option>
              <option value="Tiny">Tiny (1/2 Carry Multiplier)</option>
              <option value="Small">Small ({character.edition === '3.5e' ? '3/4' : 'x1'} Carry Multiplier)</option>
              <option value="Medium">Medium (Standard x1 Multiplier)</option>
              <option value="Large">Large (x2 Carry Multiplier)</option>
              <option value="Huge">Huge (x4 Carry Multiplier)</option>
              <option value="Gargantuan">Gargantuan (x8 Carry Multiplier)</option>
              <option value="Colossal">Colossal (x16 Carry Multiplier)</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="w-full flex items-center justify-between gap-2 bg-stone-950 border border-stone-800 rounded-lg p-2 cursor-pointer hover:border-amber-600/50 transition">
              <span className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                ⚡ Powerful Build / Little Giant
              </span>
              <input
                type="checkbox"
                checked={!!character.optionalRules?.hasPowerfulBuild}
                onChange={(e) => onUpdateCharacter({
                  ...character,
                  optionalRules: {
                    ...character.optionalRules,
                    hasPowerfulBuild: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: Roleplaying Traits (Personality, Ideals, Bonds, Flaws) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personality Traits */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" /> Personality Traits
          </label>
          <textarea
            value={character.personalityTraits}
            onChange={(e) => handleTextChange('personalityTraits', e.target.value)}
            rows={3}
            placeholder="Quirks, speech mannerisms, habits..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Ideals */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Ideals
          </label>
          <textarea
            value={character.ideals}
            onChange={(e) => handleTextChange('ideals', e.target.value)}
            rows={3}
            placeholder="Core values, moral principles..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Bonds */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Bonds
          </label>
          <textarea
            value={character.bonds}
            onChange={(e) => handleTextChange('bonds', e.target.value)}
            rows={3}
            placeholder="Connections to people, places, or events..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Flaws */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Flaws
          </label>
          <textarea
            value={character.flaws}
            onChange={(e) => handleTextChange('flaws', e.target.value)}
            rows={3}
            placeholder="Weaknesses, compulsions, vices..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* SECTION 3: Backstory (Hintergrund) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
        <label className="block font-serif font-bold text-amber-300 text-lg flex items-center gap-2 border-b border-stone-800 pb-2">
          <BookOpen className="w-5 h-5 text-amber-500" /> Character Backstory
        </label>
        <textarea
          value={character.backstory}
          onChange={(e) => handleTextChange('backstory', e.target.value)}
          rows={6}
          placeholder="Origins, history, defining events, mentors..."
          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-4 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* SECTION 4: Allies, Organizations & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allies & Organizations */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Allies & Factions
          </label>
          <textarea
            value={character.alliesAndOrganizations}
            onChange={(e) => handleTextChange('alliesAndOrganizations', e.target.value)}
            rows={5}
            placeholder="Guilds, mercenary groups, allies, contacts..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Campaign Notes */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-2">
          <label className="block font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-400" /> Quest Log & Campaign Notes
          </label>
          <textarea
            value={character.additionalNotes}
            onChange={(e) => handleTextChange('additionalNotes', e.target.value)}
            rows={5}
            placeholder="Dungeon clues, active quests, party loot agreements..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
