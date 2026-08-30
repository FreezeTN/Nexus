import React, { useState } from 'react';
import {
  Sparkles,
  Swords,
  Shield,
  Zap,
  Radio,
  BookOpen,
  Eye,
  MessageSquare,
  Compass,
  AlertCircle,
  HelpCircle,
  Volume2,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader2,
  Dices,
  Flame,
  Check,
  Award
} from 'lucide-react';
import { CharacterData, RuleEdition } from '../../types';
import { SoundscapePanel } from '../audio/SoundscapePanel';
import { proceduralAudio } from '../../utils/proceduralAudioSynthesizer';
import { askAssistant } from '../../services/geminiService';

interface LiveSessionCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: CharacterData | null;
  ruleEdition: RuleEdition;
  onRoll?: (label: string, diceType: number, diceCount: number, modifier: number, mode: 'normal' | 'advantage' | 'disadvantage') => void;
}

export type CopilotTab = 'narration' | 'rules' | 'soundscapes' | 'concentration';

export const LiveSessionCopilotDrawer: React.FC<LiveSessionCopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  ruleEdition,
  onRoll
}) => {
  const [activeTab, setActiveTab] = useState<CopilotTab>('narration');
  const [promptInput, setPromptInput] = useState<string>('');
  const [outputResult, setOutputResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Concentration damage calculator state
  const [damageTaken, setDamageTaken] = useState<number>(14);

  if (!isOpen) return null;

  const concentrationDc = Math.max(10, Math.floor(damageTaken / 2));
  const conMod = activeCharacter ? Math.floor(((activeCharacter.abilities?.CON?.score || 10) - 10) / 2) : 0;
  const isConProf = activeCharacter?.savingThrowProficiencies?.includes('CON') || false;
  const profBonus = activeCharacter ? Math.floor(((activeCharacter.level || 1) - 1) / 4) + 2 : 2;
  const totalConSaveBonus = conMod + (isConProf ? profBonus : 0);

  const handleQuickNarration = async (type: 'room_sensory' | 'npc_dialogue' | 'cliffhanger' | 'tavern_rumor') => {
    setIsLoading(true);
    setOutputResult(null);

    let prompt = '';
    if (type === 'room_sensory') {
      prompt = `Provide a rich, 2-3 sentence sensory scene description (sight, eerie sounds, atmospheric smells, lighting) for a mysterious chamber or wilderness location: "${promptInput || 'ancient forgotten crypt with glowing glyphs'}" in ${ruleEdition} tone. No meta commentary.`;
    } else if (type === 'npc_dialogue') {
      prompt = `Improvise a dramatic, in-character spoken dialogue line (with vocal tone cue and bodily gesture) for an NPC in response to: "${promptInput || 'strangers entering seeking forbidden knowledge'}".`;
    } else if (type === 'cliffhanger') {
      prompt = `Generate a suspenseful, nail-biting session cliffhanger or sudden tactical complication for: "${promptInput || 'the party unlocks the vault door'}". 2 sentences.`;
    } else {
      prompt = `Generate 2 intriguing tavern rumors (one true with a catch, one completely bogus) regarding: "${promptInput || 'the local lord or nearby ruins'}".`;
    }

    try {
      const reply = await askAssistant(prompt, [], `You are an elite Tabletop RPG DM Assistant providing instant scene flavor in ${ruleEdition}.`);
      setOutputResult(reply);
    } catch {
      setOutputResult('The shadows lengthen as an ominous chill sweeps through the hall, whispering of ancient powers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRuleAdjudication = async () => {
    if (!promptInput.trim()) return;
    setIsLoading(true);
    setOutputResult(null);

    const prompt = `Adjudicate this tabletop RPG rule query for ${ruleEdition}: "${promptInput}".
Format concisely:
1. RAW (Rules As Written)
2. RAI (Rules As Intended)
3. Tabletop Recommendation for the DM`;

    try {
      const reply = await askAssistant(prompt, [], `You are an official TRPG rules adjudicator for ${ruleEdition}. Give concise, accurate rulings.`);
      setOutputResult(reply);
    } catch {
      setOutputResult('Standard ruling: The DM determines the DC (usually 10 to 15) using relevant ability checks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollConcentration = () => {
    proceduralAudio.playSfx('dice_roll');
    if (onRoll) {
      onRoll(`Concentration Save (DC ${concentrationDc})`, 20, 1, totalConSaveBonus, 'normal');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-stone-950/98 border-l border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-amber-200">
              Live Session Co-Pilot
            </h2>
            <p className="text-xs text-stone-400">
              Live tactical assistant, soundscapes & ambient narration
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-800 bg-stone-950 px-3 pt-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('narration')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded-t-xl transition cursor-pointer border-t border-x ${
            activeTab === 'narration'
              ? 'bg-stone-900 text-amber-300 border-amber-500/50 -mb-px'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Cinematic Scene</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded-t-xl transition cursor-pointer border-t border-x ${
            activeTab === 'rules'
              ? 'bg-stone-900 text-amber-300 border-amber-500/50 -mb-px'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rules & Stunts</span>
        </button>

        <button
          onClick={() => setActiveTab('soundscapes')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded-t-xl transition cursor-pointer border-t border-x ${
            activeTab === 'soundscapes'
              ? 'bg-stone-900 text-amber-300 border-amber-500/50 -mb-px'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Soundscapes</span>
        </button>

        <button
          onClick={() => setActiveTab('concentration')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-bold rounded-t-xl transition cursor-pointer border-t border-x ${
            activeTab === 'concentration'
              ? 'bg-stone-900 text-amber-300 border-amber-500/50 -mb-px'
              : 'text-stone-400 hover:text-stone-200 border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Concentration</span>
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: NARRATION */}
        {activeTab === 'narration' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-serif font-bold text-stone-300 mb-1.5">
                Scene Keyword / Situation Prompt
              </label>
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="e.g. subterranean fungal forest, shadowy assassin in tavern, dragon waking"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickNarration('room_sensory')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer disabled:opacity-50"
              >
                <div className="text-xs font-serif font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sensory Room Intro</span>
                </div>
                <div className="text-[10px] text-stone-400">Sight, sounds, smells, lighting</div>
              </button>

              <button
                onClick={() => handleQuickNarration('npc_dialogue')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer disabled:opacity-50"
              >
                <div className="text-xs font-serif font-bold text-cyan-300 mb-0.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Improvise NPC Line</span>
                </div>
                <div className="text-[10px] text-stone-400">Voice tone, quote & body cue</div>
              </button>

              <button
                onClick={() => handleQuickNarration('cliffhanger')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer disabled:opacity-50"
              >
                <div className="text-xs font-serif font-bold text-rose-300 mb-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dramatic Cliffhanger</span>
                </div>
                <div className="text-[10px] text-stone-400">Sudden twist or escalation</div>
              </button>

              <button
                onClick={() => handleQuickNarration('tavern_rumor')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-left transition cursor-pointer disabled:opacity-50"
              >
                <div className="text-xs font-serif font-bold text-emerald-300 mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tavern Rumors</span>
                </div>
                <div className="text-[10px] text-stone-400">1 true catch + 1 bogus rumor</div>
              </button>
            </div>

            {isLoading && (
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-center gap-2 text-xs text-amber-300">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Weaving scene narration...</span>
              </div>
            )}

            {outputResult && !isLoading && (
              <div className="p-3.5 rounded-xl bg-stone-900/90 border border-amber-600/40 text-stone-200 font-serif leading-relaxed text-xs space-y-2 relative shadow-lg">
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 font-bold border-b border-stone-800 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Generated Narrative Flavor
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(outputResult)}
                    className="text-[10px] hover:text-amber-200 text-stone-400 underline cursor-pointer"
                  >
                    Copy Text
                  </button>
                </div>
                <div className="whitespace-pre-wrap">{outputResult}</div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RULES & STUNTS */}
        {activeTab === 'rules' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-serif font-bold text-stone-300 mb-1.5">
                Rule Question or Improvised Action Query
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Can a character jump and grapple in the same turn?"
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickRuleAdjudication()}
                />
                <button
                  onClick={handleQuickRuleAdjudication}
                  disabled={isLoading || !promptInput.trim()}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Adjudicate
                </button>
              </div>
            </div>

            {/* Quick Reference Cheatsheet */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2 text-xs">
              <div className="font-serif font-bold text-amber-300 text-xs">Quick Tabletop References ({ruleEdition})</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-stone-950/70 border border-stone-800/80">
                  <strong className="text-amber-200">Half Cover:</strong> +2 AC & DEX saves
                </div>
                <div className="p-2 rounded bg-stone-950/70 border border-stone-800/80">
                  <strong className="text-amber-200">Three-Quarters:</strong> +5 AC & DEX saves
                </div>
                <div className="p-2 rounded bg-stone-950/70 border border-stone-800/80">
                  <strong className="text-amber-200">Long Jump:</strong> Distance = STR score (with 10ft run)
                </div>
                <div className="p-2 rounded bg-stone-950/70 border border-stone-800/80">
                  <strong className="text-amber-200">High Jump:</strong> Height = 3 + STR mod (with 10ft run)
                </div>
              </div>
            </div>

            {outputResult && !isLoading && (
              <div className="p-3.5 rounded-xl bg-stone-900/90 border border-amber-600/40 text-stone-200 leading-relaxed text-xs space-y-2 shadow-lg">
                <div className="whitespace-pre-wrap font-sans text-xs">{outputResult}</div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SOUNDSCAPES */}
        {activeTab === 'soundscapes' && (
          <div className="space-y-3">
            <SoundscapePanel />
          </div>
        )}

        {/* TAB 4: CONCENTRATION */}
        {activeTab === 'concentration' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-stone-900 border border-amber-600/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-serif font-bold text-xs text-amber-200">
                    Concentration DC Calculator
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60">
                  DC = {concentrationDc}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">
                  Damage Taken by Spellcaster: <strong>{damageTaken} HP</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={damageTaken}
                  onChange={(e) => setDamageTaken(parseInt(e.target.value) || 1)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono mt-0.5">
                  <span>1 dmg (DC 10)</span>
                  <span>40 dmg (DC 20)</span>
                  <span>80 dmg (DC 40)</span>
                </div>
              </div>

              {activeCharacter && (
                <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-serif font-bold text-stone-200">
                      {activeCharacter.name}&apos;s CON Save
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      Modifier: {totalConSaveBonus >= 0 ? `+${totalConSaveBonus}` : totalConSaveBonus} ({isConProf ? 'Proficient' : 'Standard'})
                    </div>
                  </div>

                  <button
                    onClick={handleRollConcentration}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Roll Save (DC {concentrationDc})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
