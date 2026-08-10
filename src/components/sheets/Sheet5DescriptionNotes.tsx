import React from 'react';
import { CharacterData } from '../../types';
import { ScrollText, User, Heart, Shield, BookOpen, Users, FileText } from 'lucide-react';
import { CollapsibleBox } from '../common/CollapsibleBox';
import { FormattedTextEditor } from '../common/FormattedTextEditor';

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
      <CollapsibleBox
        title="Character Description & Appearance"
        icon={<User className="w-5 h-5 text-amber-500" />}
        storageKey="sheet5_appearance"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 text-xs pt-2">
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
      </CollapsibleBox>

      {/* SECTION 2: Roleplaying Traits (Personality, Ideals, Bonds, Flaws) */}
      <CollapsibleBox
        title="Roleplaying Traits & Personality"
        icon={<Heart className="w-5 h-5 text-rose-400" />}
        storageKey="sheet5_traits"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Personality Traits */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Personality Traits
                </span>
              }
              value={character.personalityTraits || ''}
              onChange={(val) => handleTextChange('personalityTraits', val)}
              rows={4}
              placeholder="Quirks, speech mannerisms, habits..."
            />
          </div>

          {/* Ideals */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Ideals
                </span>
              }
              value={character.ideals || ''}
              onChange={(val) => handleTextChange('ideals', val)}
              rows={4}
              placeholder="Core values, moral principles..."
            />
          </div>

          {/* Bonds */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Bonds
                </span>
              }
              value={character.bonds || ''}
              onChange={(val) => handleTextChange('bonds', val)}
              rows={4}
              placeholder="Connections to people, places, or events..."
            />
          </div>

          {/* Flaws */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> Flaws
                </span>
              }
              value={character.flaws || ''}
              onChange={(val) => handleTextChange('flaws', val)}
              rows={4}
              placeholder="Weaknesses, compulsions, vices..."
            />
          </div>
        </div>
      </CollapsibleBox>

      {/* SECTION 3: Backstory (Hintergrund) */}
      <CollapsibleBox
        title="Character Backstory"
        icon={<BookOpen className="w-5 h-5 text-amber-500" />}
        storageKey="sheet5_backstory"
      >
        <div className="pt-2">
          <FormattedTextEditor
            label="Full Backstory & Origins"
            value={character.backstory || ''}
            onChange={(val) => handleTextChange('backstory', val)}
            rows={8}
            placeholder="Origins, history, defining events, mentors..."
          />
        </div>
      </CollapsibleBox>

      {/* SECTION 4: Allies, Organizations & Notes */}
      <CollapsibleBox
        title="Allies, Factions & Campaign Quest Log"
        icon={<Users className="w-5 h-5 text-emerald-400" />}
        storageKey="sheet5_allies_notes"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Allies & Organizations */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Allies & Factions
                </span>
              }
              value={character.alliesAndOrganizations || ''}
              onChange={(val) => handleTextChange('alliesAndOrganizations', val)}
              rows={6}
              placeholder="Guilds, mercenary groups, allies, contacts..."
            />
          </div>

          {/* Campaign Notes */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
            <FormattedTextEditor
              label={
                <span className="flex items-center gap-2">
                  <ScrollText className="w-3.5 h-3.5 text-amber-400" /> Quest Log & Campaign Notes
                </span>
              }
              value={character.additionalNotes || ''}
              onChange={(val) => handleTextChange('additionalNotes', val)}
              rows={6}
              placeholder="Dungeon clues, active quests, party loot agreements..."
            />
          </div>
        </div>
      </CollapsibleBox>
    </div>
  );
};

