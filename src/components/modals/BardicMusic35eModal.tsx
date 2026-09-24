import React, { useState } from 'react';
import { CharacterData } from '../../types';
import {
  calculate35eBardicMusicStats,
  BardicPerformanceOption
} from '../../utils/calculators/classFeatures35eCalculators';
import { Music, Sparkles, Volume2, X, Play, Square, Award } from 'lucide-react';
import { playDiceSound } from '../../utils/soundEffects';

interface BardicMusic35eModalProps {
  isOpen: boolean;
  character: CharacterData;
  onUpdateCharacter: (char: CharacterData) => void;
  onClose: () => void;
  onRoll?: (diceNotation: string, label: string) => void;
}

export const BardicMusic35eModal: React.FC<BardicMusic35eModalProps> = ({
  isOpen,
  character,
  onUpdateCharacter,
  onClose,
  onRoll
}) => {
  if (!isOpen) return null;

  const stats = calculate35eBardicMusicStats(character);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const handleStartPerformance = (song: BardicPerformanceOption) => {
    if (stats.dailyUsesRemaining <= 0) {
      setLogMessage('⚠️ No daily Bardic Music performances remaining!');
      return;
    }

    const nextRemaining = Math.max(0, stats.dailyUsesRemaining - 1);
    onUpdateCharacter({
      ...character,
      bardicMusicUsesRemaining: nextRemaining,
      activeBardicPerformance: song.name
    });

    playDiceSound();
    setLogMessage(`🎶 Playing ${song.name}! (${song.summary}). Allies receive benefits. (${nextRemaining}/${stats.dailyUsesMax} uses left).`);
  };

  const handleStopPerformance = () => {
    onUpdateCharacter({
      ...character,
      activeBardicPerformance: undefined
    });

    setLogMessage(`🎵 Performance ended. Effects linger for 5 rounds where applicable (e.g. Inspire Courage).`);
  };

  const handleRollPerform = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const performSkill = character.skills?.find(s => s.name.toLowerCase().startsWith('perform'));
    const chaMod = Math.floor(((character.abilities.CHA?.score || 10) - 10) / 2);
    const ranks = performSkill?.ranks !== undefined ? performSkill.ranks : stats.performRanks;
    const misc = performSkill?.miscMod || 0;
    const totalBonus = ranks + misc + chaMod;
    const total = d20 + totalBonus;

    playDiceSound();
    if (onRoll) {
      onRoll(`1d20+${totalBonus}`, 'Bard Perform Check');
    }
    setLogMessage(`🎼 Perform Check: [d20 (${d20}) + bonus (${totalBonus})] = ${total}! (Sets Fascinate DC or Countersong save replacement).`);
  };

  const handleRestoreDaily = () => {
    onUpdateCharacter({
      ...character,
      bardicMusicUsesRemaining: stats.dailyUsesMax
    });
    setLogMessage(`✨ Restored daily Bardic Music uses to ${stats.dailyUsesMax}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-600/50 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-200">
                D&D 3.5e Bardic Music Studio
              </h2>
              <p className="text-xs text-stone-400">
                PHB p. 29 • Level {stats.bardLevel} Bard • Perform Ranks: {stats.performRanks}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 py-4 overflow-y-auto">
          {logMessage && (
            <div className="p-2.5 bg-purple-950/80 border border-purple-500/50 rounded-xl text-xs text-purple-200">
              {logMessage}
            </div>
          )}

          {/* Active Performance Banner */}
          {stats.activePerformance ? (
            <div className="p-3 bg-purple-950/70 border border-purple-500/70 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
                <div>
                  <span className="font-bold text-purple-200 text-sm block">
                    ACTIVE: {stats.activePerformance}
                  </span>
                  <span className="text-xs text-purple-300/80">
                    Performance maintained each round via standard or move action.
                  </span>
                </div>
              </div>
              <button
                onClick={handleStopPerformance}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" /> Stop Song
              </button>
            </div>
          ) : (
            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl flex items-center justify-between">
              <div className="text-xs text-stone-300">
                Daily Performances:{' '}
                <span className="font-bold text-amber-300 font-mono text-base">
                  {stats.dailyUsesRemaining}
                </span>{' '}
                / {stats.dailyUsesMax} per day
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRollPerform}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Roll Perform
                </button>
                <button
                  onClick={handleRestoreDaily}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 rounded-lg text-xs transition"
                >
                  Restore
                </button>
              </div>
            </div>
          )}

          {/* Songs List */}
          <div className="space-y-2.5">
            <span className="text-xs font-serif font-bold text-amber-200 block">
              Available Bardic Performances:
            </span>

            {stats.unlockedSongs.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-950/40 rounded-xl">
                Requires at least 3 ranks in Perform and Bard Level 1.
              </p>
            ) : (
              stats.unlockedSongs.map((song) => {
                const isCurrent = stats.activePerformance === song.name;
                return (
                  <div
                    key={song.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-500/70'
                        : 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-amber-300 text-sm">
                          {song.name}
                        </span>
                        {song.id === 'inspire_courage' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 font-mono font-bold text-[10px]">
                            +{stats.inspireCourageBonus} Morale Bonus
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartPerformance(song)}
                        disabled={stats.dailyUsesRemaining <= 0 || isCurrent}
                        className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition shadow ${
                          isCurrent
                            ? 'bg-purple-800 text-purple-200 opacity-60 cursor-default'
                            : 'bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white'
                        }`}
                      >
                        <Play className="w-3 h-3" /> {isCurrent ? 'Singing' : 'Play Song'}
                      </button>
                    </div>

                    <p className="text-stone-300 leading-relaxed text-[11px]">
                      {song.effectDescription}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
