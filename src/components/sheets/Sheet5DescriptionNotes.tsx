import React from 'react';
import { CharacterData } from '../../types';
import { ScrollText, User, Heart, Shield, BookOpen, Users, FileText, Sparkles, Compass, Flag, ShieldCheck } from 'lucide-react';
import { CollapsibleBox } from '../common/CollapsibleBox';
import { FormattedTextEditor } from '../common/FormattedTextEditor';
import { useLayoutCustomization } from '../../utils/layoutCustomization';
import { EmptyLayoutState } from '../common/EmptyLayoutState';
import { useLanguage } from '../../i18n/LanguageContext';

interface Sheet5Props {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  onOpenCampaignLoreVault?: (tab?: 'atlas' | 'quests' | 'factions' | 'travel' | 'export') => void;
}

export const Sheet5DescriptionNotes: React.FC<Sheet5Props> = ({
  character,
  onUpdateCharacter,
  onOpenGenerators,
  onOpenCampaignLoreVault
}) => {
  const { t } = useLanguage();
  const { isVisible } = useLayoutCustomization();

  const handleTextChange = (field: keyof CharacterData, value: string) => {
    onUpdateCharacter({
      ...character,
      [field]: value
    });
  };

  const showAppearance = isVisible('s5_appearanceDemographics');
  const showTraits = isVisible('s5_roleplayingTraits');
  const showBackstory = isVisible('s5_backstory');
  const showAlliesNotes = isVisible('s5_alliesFactionsNotes');

  const hasAnyVisible = showAppearance || showTraits || showBackstory || showAlliesNotes;

  if (!hasAnyVisible) {
    return <EmptyLayoutState sheetName={t('nav.sheet5', 'Description & Notes')} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: Physical Appearance & Demographics */}
      {showAppearance && (
        <CollapsibleBox
          title={t('notes.appearance', 'Character Description & Appearance')}
          icon={<User className="w-5 h-5 text-amber-500" />}
          storageKey="sheet5_appearance"
        >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 text-xs pt-2">
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.gender', 'Gender')}</label>
            <input
              type="text"
              value={character.gender || ''}
              onChange={(e) => handleTextChange('gender', e.target.value)}
              placeholder="e.g. Male"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.age', 'Age')}</label>
            <input
              type="text"
              value={character.age || ''}
              onChange={(e) => handleTextChange('age', e.target.value)}
              placeholder="e.g. 28"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.height', 'Height')}</label>
            <input
              type="text"
              value={character.height || ''}
              onChange={(e) => handleTextChange('height', e.target.value)}
              placeholder={`e.g. 6'1"`}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.weight', 'Weight')}</label>
            <input
              type="text"
              value={character.weight || ''}
              onChange={(e) => handleTextChange('weight', e.target.value)}
              placeholder="e.g. 190 lbs"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.eyes', 'Eyes')}</label>
            <input
              type="text"
              value={character.eyes || ''}
              onChange={(e) => handleTextChange('eyes', e.target.value)}
              placeholder="e.g. Steel Blue"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.hair', 'Hair')}</label>
            <input
              type="text"
              value={character.hair || ''}
              onChange={(e) => handleTextChange('hair', e.target.value)}
              placeholder="e.g. Dark Brown"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-stone-400 mb-1">{t('notes.skin', 'Skin')}</label>
            <input
              type="text"
              value={character.skin || ''}
              onChange={(e) => handleTextChange('skin', e.target.value)}
              placeholder="e.g. Tanned"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100"
            />
          </div>
          <div>
            <label className="block text-amber-300 font-bold mb-1">{t('notes.sizeCategory', 'Creature Size Category')}</label>
            <select
              value={character.sizeCategory || 'Medium'}
              onChange={(e) => onUpdateCharacter({ ...character, sizeCategory: e.target.value as any })}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-amber-200 font-bold"
            >
              <option value="Fine">Fine (1/8)</option>
              <option value="Diminutive">Diminutive (1/4)</option>
              <option value="Tiny">Tiny (1/2)</option>
              <option value="Small">Small ({character.edition === '3.5e' ? '3/4' : 'x1'})</option>
              <option value="Medium">Medium (x1)</option>
              <option value="Large">Large (x2)</option>
              <option value="Huge">Huge (x4)</option>
              <option value="Gargantuan">Gargantuan (x8)</option>
              <option value="Colossal">Colossal (x16)</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="w-full flex items-center justify-between gap-2 bg-stone-950 border border-stone-800 rounded-lg p-2 cursor-pointer hover:border-amber-600/50 transition">
              <span className="text-xs text-stone-200 font-bold flex items-center gap-1.5">
                ⚡ Powerful Build
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
      )}

      {/* SECTION 2: Roleplaying Traits (Personality, Ideals, Bonds, Flaws) */}
      {showTraits && (
        <CollapsibleBox
          title={t('notes.traits', 'Roleplaying Traits & Personality')}
          icon={<Heart className="w-5 h-5 text-rose-400" />}
          storageKey="sheet5_traits"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Personality Traits */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow">
              <FormattedTextEditor
                label={
                  <span className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-rose-400" /> {t('notes.personalityTraits', 'Personality Traits')}
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
                    <Shield className="w-3.5 h-3.5 text-amber-400" /> {t('notes.ideals', 'Ideals')}
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
                    <Users className="w-3.5 h-3.5 text-blue-400" /> {t('notes.bonds', 'Bonds')}
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
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> {t('notes.flaws', 'Flaws')}
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
      )}

      {/* SECTION 3: Backstory (Hintergrund) */}
      {showBackstory && (
        <CollapsibleBox
          title={t('notes.backstory', 'Character Backstory')}
          icon={<BookOpen className="w-5 h-5 text-amber-500" />}
          storageKey="sheet5_backstory"
        >
          <div className="pt-2">
            <FormattedTextEditor
              label={t('notes.backstoryLabel', 'Full Backstory & Origins')}
              value={character.backstory || ''}
              onChange={(val) => handleTextChange('backstory', val)}
              rows={8}
              placeholder="Origins, history, defining events, mentors..."
            />
          </div>
        </CollapsibleBox>
      )}

      {/* SECTION 4: Allies, Organizations & Notes */}
      {showAlliesNotes && (
        <CollapsibleBox
          title={t('notes.allies', 'Allies, Factions & Campaign Quest Log')}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          storageKey="sheet5_allies_notes"
          headerExtra={
            onOpenGenerators ? (
              <button
                onClick={() => onOpenGenerators('session')}
                className="text-xs font-serif font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                title="Synthesize structured session chronicles and campaign recaps"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Session Chronicle</span>
              </button>
            ) : undefined
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Allies & Organizations */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> {t('notes.alliesFactions', 'Allies & Factions')}
                </span>
                {onOpenCampaignLoreVault && (
                  <button
                    type="button"
                    onClick={() => onOpenCampaignLoreVault('factions')}
                    className="px-2 py-0.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-600/60 text-purple-300 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Open Campaign Faction Matrix & Standings"
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                    <span>Faction Matrix</span>
                  </button>
                )}
              </div>
              <FormattedTextEditor
                label=""
                value={character.alliesAndOrganizations || ''}
                onChange={(val) => handleTextChange('alliesAndOrganizations', val)}
                rows={6}
                placeholder="Guilds, mercenary groups, allies, contacts..."
              />
            </div>

            {/* Campaign Notes */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <ScrollText className="w-3.5 h-3.5 text-amber-400" /> {t('notes.questLog', 'Quest Log & Campaign Notes')}
                </span>
                {onOpenCampaignLoreVault && (
                  <button
                    type="button"
                    onClick={() => onOpenCampaignLoreVault('quests')}
                    className="px-2 py-0.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Open Campaign Quest Tracker & Objectives"
                  >
                    <Flag className="w-3 h-3 text-emerald-400" />
                    <span>Quest Tracker</span>
                  </button>
                )}
              </div>
              <FormattedTextEditor
                label=""
                value={character.additionalNotes || ''}
                onChange={(val) => handleTextChange('additionalNotes', val)}
                rows={6}
                placeholder="Dungeon clues, active quests, party loot agreements..."
              />
            </div>
          </div>
        </CollapsibleBox>
      )}
    </div>
  );
};

