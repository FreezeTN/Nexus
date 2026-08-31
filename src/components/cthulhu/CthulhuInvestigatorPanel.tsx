import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  Skull,
  Brain,
  Sparkles,
  AlertTriangle,
  Dices,
  RotateCcw,
  Heart,
  Shield,
  HelpCircle,
  Plus,
  Minus,
  Check,
  Zap,
  BookOpen
} from 'lucide-react';

interface CthulhuInvestigatorPanelProps {
  character: CharacterData;
  onUpdateCharacter: (updated: CharacterData) => void;
  onRoll: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

const COC_DEFAULT_SKILLS = [
  { name: 'Accounting', base: 5 },
  { name: 'Anthropology', base: 1 },
  { name: 'Appraise', base: 5 },
  { name: 'Archaeology', base: 1 },
  { name: 'Art / Craft', base: 5 },
  { name: 'Charm', base: 15 },
  { name: 'Climb', base: 20 },
  { name: 'Cthulhu Mythos', base: 0 },
  { name: 'Disguise', base: 5 },
  { name: 'Dodge', base: 25 },
  { name: 'Drive Auto', base: 20 },
  { name: 'Fast Talk', base: 5 },
  { name: 'Fighting (Brawl)', base: 25 },
  { name: 'Firearms (Handgun)', base: 20 },
  { name: 'Firearms (Rifle/Shotgun)', base: 25 },
  { name: 'First Aid', base: 30 },
  { name: 'History', base: 5 },
  { name: 'Intimidation', base: 15 },
  { name: 'Jump', base: 20 },
  { name: 'Language (Own)', base: 60 },
  { name: 'Language (Other)', base: 1 },
  { name: 'Law', base: 5 },
  { name: 'Library Use', base: 20 },
  { name: 'Listen', base: 20 },
  { name: 'Locksmith', base: 1 },
  { name: 'Medicine', base: 1 },
  { name: 'Natural World', base: 10 },
  { name: 'Navigate', base: 10 },
  { name: 'Occult', base: 5 },
  { name: 'Persuade', base: 10 },
  { name: 'Psychology', base: 10 },
  { name: 'Psychoanalysis', base: 1 },
  { name: 'Ride', base: 5 },
  { name: 'Science', base: 1 },
  { name: 'Stealth', base: 20 },
  { name: 'Spot Hidden', base: 25 },
  { name: 'Survival', base: 10 },
  { name: 'Swim', base: 20 },
  { name: 'Throw', base: 20 },
  { name: 'Track', base: 10 }
];

const BOUTS_OF_MADNESS = [
  '1. Amnesia: The investigator has no memory of events that took place since they last awoke.',
  '2. Psychosomatic Blindness/Deafness: The investigator goes physically blind or deaf for 1d10 rounds.',
  '3. Violent Outburst: The investigator explodes in uncontrollable physical fury against friend or foe.',
  '4. Paranoia: Severe delusion that everyone is conspiring to sacrifice them to eldritch horrors.',
  '5. Significant Person: The investigator mistakes another person for their most trusted loved one or enemy.',
  '6. Faint: The investigator collapses unconscious for 1d10 rounds.',
  '7. Fleeting Panic: The investigator runs blindly in terror from the location by any means.',
  '8. Physical Hysteria / Tremors: Shaking so severely that all physical actions are at penalty die.',
  '9. Phobia / Mania: The investigator acquires a new acute phobia or obsessive compulsive mania.',
  '10. Hallucinations: Vivid visions of tentacled monstrosities warping reality around them.'
];

export const CthulhuInvestigatorPanel: React.FC<CthulhuInvestigatorPanelProps> = ({
  character,
  onUpdateCharacter,
  onRoll
}) => {
  const [sanityCurrent, setSanityCurrent] = useState<number>(character.sanity?.current ?? 50);
  const [sanityMax, setSanityMax] = useState<number>(character.sanity?.max ?? 99);
  const [luckCurrent, setLuckCurrent] = useState<number>(character.luck?.current ?? 50);
  const [luckSpendAmount, setLuckSpendAmount] = useState<number>(5);
  const [majorWound, setMajorWound] = useState<boolean>(false);
  const [activeMadnessText, setActiveMadnessText] = useState<string | null>(null);
  const [customSkillSearch, setCustomSkillSearch] = useState<string>('');

  // 8 Characteristics
  const str = character.abilities?.STR?.score || 50;
  const con = character.abilities?.CON?.score || 50;
  const siz = 50; // SIZ characteristic
  const dex = character.abilities?.DEX?.score || 50;
  const app = character.abilities?.CHA?.score || 50; // APP
  const intVal = character.abilities?.INT?.score || 60;
  const pow = character.abilities?.WIS?.score || 60; // POW
  const edu = 60; // EDU characteristic

  const hpMax = Math.max(6, Math.floor((con + siz) / 10));
  const mpMax = Math.floor(pow / 5);

  const handleRollPercentile = (label: string, targetScore: number) => {
    // Rolls d100 with comparison
    const hard = Math.floor(targetScore / 2);
    const extreme = Math.floor(targetScore / 5);
    const desc = `${label} (Target: ${targetScore} | Hard: ${hard} | Extreme: ${extreme})`;
    onRoll(desc, 100, 1, 0, 'normal');
  };

  const handleSanityLoss = (amount: number) => {
    const nextSan = Math.max(0, sanityCurrent - amount);
    setSanityCurrent(nextSan);
    onUpdateCharacter({
      ...character,
      sanity: {
        current: nextSan,
        max: sanityMax,
        isTempMad: amount >= 5,
        isIndefMad: false
      }
    });

    if (amount >= 5) {
      handleTriggerBoutOfMadness();
    }
  };

  const handleTriggerBoutOfMadness = () => {
    const randomIdx = Math.floor(Math.random() * BOUTS_OF_MADNESS.length);
    setActiveMadnessText(BOUTS_OF_MADNESS[randomIdx]);
  };

  const handleSpendLuck = () => {
    if (luckCurrent >= luckSpendAmount) {
      const nextLuck = luckCurrent - luckSpendAmount;
      setLuckCurrent(nextLuck);
      onUpdateCharacter({
        ...character,
        luck: { current: nextLuck, max: 99 }
      });
    }
  };

  const filteredSkills = COC_DEFAULT_SKILLS.filter(s =>
    s.name.toLowerCase().includes(customSkillSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="cthulhu-investigator-suite">
      
      {/* Sanity & Luck Eldritch Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sanity Tracker */}
        <div className="bg-stone-900 border border-purple-500/40 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-100 text-base">Sanity (SAN) Pool</h3>
                <p className="text-xs text-stone-400">Current SAN: {sanityCurrent} / Max {sanityMax}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRollPercentile('Sanity (SAN) Check', sanityCurrent)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow"
            >
              Roll SAN (d100)
            </button>
          </div>

          {/* Quick Sanity Loss Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-stone-800 flex-wrap">
            <span className="text-xs font-mono text-stone-400">Sanity Loss:</span>
            {[1, 2, 10].map(loss => (
              <button
                key={loss}
                type="button"
                onClick={() => handleSanityLoss(loss)}
                className="px-2.5 py-1 bg-stone-950 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-500 text-rose-300 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
              >
                -{loss} SAN
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSanityLoss(5)}
              className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 border border-rose-500/50 text-rose-200 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
            >
              -5 SAN (Temp Madness)
            </button>
          </div>

          {/* Bout of Madness Alert Banner */}
          {activeMadnessText && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/80 rounded-2xl text-rose-200 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-rose-300">
                <span className="flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>Bout of Madness Triggered!</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMadnessText(null)}
                  className="text-stone-400 hover:text-stone-100 text-[10px]"
                >
                  Dismiss
                </button>
              </div>
              <p className="font-sans leading-relaxed">{activeMadnessText}</p>
            </div>
          )}
        </div>

        {/* Luck Pool & Spend Engine */}
        <div className="bg-stone-900 border border-emerald-500/40 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-100 text-base">Luck Pool</h3>
                <p className="text-xs text-stone-400">Current Luck: {luckCurrent} / 99</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRollPercentile('Luck Check', luckCurrent)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer shadow"
            >
              Roll Luck (d100)
            </button>
          </div>

          {/* Luck Spending Controls */}
          <div className="flex items-center gap-3 pt-2 border-t border-stone-800">
            <span className="text-xs font-mono text-stone-400">Spend:</span>
            <input
              type="number"
              min={1}
              max={luckCurrent}
              value={luckSpendAmount}
              onChange={(e) => setLuckSpendAmount(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono font-bold text-emerald-300 text-center"
            />
            <button
              type="button"
              onClick={handleSpendLuck}
              disabled={luckCurrent < luckSpendAmount}
              className="flex items-center gap-1 px-3 py-1 bg-stone-950 hover:bg-emerald-950 border border-stone-800 hover:border-emerald-500 rounded-lg text-xs font-bold text-emerald-300 transition cursor-pointer"
            >
              <Minus className="w-3 h-3" />
              <span>Spend {luckSpendAmount} Luck to Boost Roll</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Characteristics Grid (Regular, Hard ½, Extreme ⅕) */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-bold text-stone-100">
            Investigator Characteristics (Regular / Hard ½ / Extreme ⅕)
          </h3>
          <span className="text-xs font-mono text-stone-400">Click characteristic to roll d100</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'STR (Strength)', score: str },
            { label: 'CON (Constitution)', score: con },
            { label: 'DEX (Dexterity)', score: dex },
            { label: 'APP (Appearance)', score: app },
            { label: 'INT (Intelligence)', score: intVal },
            { label: 'POW (Power)', score: pow },
            { label: 'SIZ (Size)', score: siz },
            { label: 'EDU (Education)', score: edu }
          ].map(charac => {
            const hard = Math.floor(charac.score / 2);
            const extreme = Math.floor(charac.score / 5);
            return (
              <button
                key={charac.label}
                type="button"
                onClick={() => handleRollPercentile(charac.label, charac.score)}
                className="p-3.5 bg-stone-950 hover:bg-purple-950/40 border border-stone-800 hover:border-purple-500 rounded-2xl text-left transition cursor-pointer group space-y-1.5 shadow"
              >
                <div className="text-xs font-mono font-bold text-stone-400 truncate">
                  {charac.label}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-mono font-black text-purple-300 group-hover:scale-105 transition-transform">
                    {charac.score}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
                    <span className="bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                      ½: {hard}
                    </span>
                    <span className="bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                      ⅕: {extreme}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CoC Investigator Skills Library */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-serif font-bold text-stone-100">
            Call of Cthulhu Skills Library ({filteredSkills.length})
          </h3>
          <input
            type="text"
            value={customSkillSearch}
            onChange={(e) => setCustomSkillSearch(e.target.value)}
            placeholder="Search skills (e.g. Spot Hidden, Firearms)..."
            className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 w-56 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredSkills.map(skill => {
            const hard = Math.floor(skill.base / 2);
            const extreme = Math.floor(skill.base / 5);
            return (
              <button
                key={skill.name}
                type="button"
                onClick={() => handleRollPercentile(`Skill: ${skill.name}`, skill.base)}
                className="p-2.5 bg-stone-950 hover:bg-stone-800 border border-stone-800/80 hover:border-purple-500 rounded-xl flex items-center justify-between text-left transition cursor-pointer text-xs group"
              >
                <span className="font-serif font-bold text-stone-200 group-hover:text-purple-300">
                  {skill.name}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-stone-100">{skill.base}%</span>
                  <span className="text-[10px] text-stone-500">({hard} / {extreme})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
