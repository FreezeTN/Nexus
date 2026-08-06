import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CharacterData } from '../../types';
import { getAbilityModifier, formatModifier, getProficiencyBonus, getPassivePerception } from '../../utils/dndCalculations';
import { Download, Upload, Printer, Copy, Check, Shield, Zap, Heart, Sparkles, BookOpen } from 'lucide-react';

interface StatblockExportModalProps {
  character: CharacterData;
  characters: CharacterData[];
  isOpen: boolean;
  onClose: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StatblockExportModal: React.FC<StatblockExportModalProps> = ({
  character,
  characters,
  isOpen,
  onClose,
  onExportJson,
  onImportJson
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const profBonus = getProficiencyBonus(character.level);
  const passivePerception = getPassivePerception(character);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const str = `
# ${character.name}
**${character.race} ${character.characterClass} (Level ${character.level})**
- **Alignment:** ${character.alignment || 'Unspecified'} | **Background:** ${character.background || 'Custom'}
- **Experience:** ${(character.experiencePoints ?? 0).toLocaleString()} XP
- **Armor Class:** ${character.armorClass}
- **Hit Points:** ${character.hpCurrent} / ${character.hpMax} (Temp: ${character.hpTemp})
- **Speed:** ${character.speed} ft
- **Proficiency Bonus:** +${profBonus} | **Passive Perception:** ${passivePerception}
- **Coinage:** CP: ${character.wealth?.cp ?? 0}, SP: ${character.wealth?.sp ?? 0}, EP: ${character.wealth?.ep ?? 0}, GP: ${character.wealth?.gp ?? 0}, PP: ${character.wealth?.pp ?? 0}

### Ability Scores
- **STR:** ${character.abilities.STR.score} (${formatModifier(getAbilityModifier(character.abilities.STR.score))})
- **DEX:** ${character.abilities.DEX.score} (${formatModifier(getAbilityModifier(character.abilities.DEX.score))})
- **CON:** ${character.abilities.CON.score} (${formatModifier(getAbilityModifier(character.abilities.CON.score))})
- **INT:** ${character.abilities.INT.score} (${formatModifier(getAbilityModifier(character.abilities.INT.score))})
- **WIS:** ${character.abilities.WIS.score} (${formatModifier(getAbilityModifier(character.abilities.WIS.score))})
- **CHA:** ${character.abilities.CHA.score} (${formatModifier(getAbilityModifier(character.abilities.CHA.score))})

### Attacks & Weaponry
${character.attacks.map(a => `- **${a.name}:** +${a.attackBonus} to hit, ${a.damage} ${a.damageType} (${a.range})`).join('\n')}

### Class Features & Feats
${character.classFeatures.map(f => `- **${f.name}:** ${f.source} - ${f.description}`).join('\n')}
`.trim();

    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif font-bold text-lg text-amber-200">
              Character Statblock & JSON Backup
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              title="Print Statblock to PDF or Printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              title="Copy Statblock as Markdown Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 font-bold rounded-lg hover:bg-stone-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Parchment Statblock Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-amber-950/20 space-y-6 print:p-0 print:bg-white print:text-black">
          {/* Classic Parchment Statblock Box */}
          <div className="bg-amber-50/95 border-2 border-amber-900/60 rounded-2xl p-6 text-stone-900 shadow-2xl print:border-none print:shadow-none print:bg-white print:p-0 space-y-4">
            {/* Header Title */}
            <div className="border-b-2 border-amber-900/60 pb-3 flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="font-serif font-black text-3xl text-amber-950 tracking-wide uppercase">
                  {character.name}
                </h1>
                <p className="font-serif italic text-sm text-amber-900">
                  Level {character.level} {character.race} {character.characterClass} ({character.alignment || 'Neutral'})
                </p>
              </div>

              <div className="text-right font-mono text-xs text-amber-900">
                <div>Experience: <strong>{(character.experiencePoints ?? 0).toLocaleString()} XP</strong></div>
                <div>Background: <strong>{character.background || 'Custom'}</strong></div>
              </div>
            </div>

            {/* Quick Defensive Vitals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-100/80 p-3 rounded-xl border border-amber-800/30 text-center font-serif text-amber-950">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Armor Class</span>
                <strong className="text-xl font-black">{character.armorClass}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Hit Points</span>
                <strong className="text-xl font-black">{character.hpCurrent} / {character.hpMax}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Speed</span>
                <strong className="text-xl font-black">{character.speed} ft</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Prof. Bonus</span>
                <strong className="text-xl font-black">+{profBonus}</strong>
              </div>
            </div>

            {/* Ability Scores Table */}
            <div className="grid grid-cols-6 gap-2 text-center font-serif py-2 border-y border-amber-900/40">
              {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map(abil => {
                const score = character.abilities?.[abil]?.score ?? 10;
                const mod = getAbilityModifier(score);
                return (
                  <div key={abil} className="bg-amber-100/60 p-2 rounded-lg border border-amber-900/20">
                    <span className="font-bold text-xs text-amber-900 block">{abil}</span>
                    <div className="font-black text-lg text-amber-950">{score}</div>
                    <span className="text-xs font-mono font-bold text-amber-800">{formatModifier(mod)}</span>
                  </div>
                );
              })}
            </div>

            {/* Attacks & Actions */}
            <div className="space-y-2">
              <h3 className="font-serif font-extrabold text-lg text-amber-950 uppercase border-b border-amber-900/40 pb-1">
                Actions & Weapon Attacks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-serif">
                {(character.attacks || []).map(atk => (
                  <div key={atk.id} className="bg-amber-100/70 p-2.5 rounded-lg border border-amber-900/20">
                    <strong className="text-amber-950 text-sm">{atk.name}</strong>
                    <div className="font-mono text-[11px] text-amber-900 mt-0.5">
                      Hit: +{atk.attackBonus} • Damage: {atk.damage} {atk.damageType} ({atk.range})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Features */}
            <div className="space-y-2">
              <h3 className="font-serif font-extrabold text-lg text-amber-950 uppercase border-b border-amber-900/40 pb-1">
                Class Features & Special Abilities
              </h3>
              <div className="space-y-1.5 text-xs font-serif">
                {(character.classFeatures || []).map(feat => (
                  <div key={feat.id} className="bg-amber-100/50 p-2 rounded-lg border border-amber-900/20">
                    <strong className="text-amber-950 font-bold">{feat.name}</strong> ({feat.source}):
                    <span className="text-amber-900 ml-1">{feat.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment & Wealth */}
            <div className="space-y-2">
              <h3 className="font-serif font-extrabold text-lg text-amber-950 uppercase border-b border-amber-900/40 pb-1">
                Inventory & Coinage
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono font-bold text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-900/20">
                <span>CP: {character.wealth?.cp ?? 0}</span>
                <span>SP: {character.wealth?.sp ?? 0}</span>
                <span>EP: {character.wealth?.ep ?? 0}</span>
                <span>GP: {character.wealth?.gp ?? 0}</span>
                <span>PP: {character.wealth?.pp ?? 0}</span>
              </div>
              <p className="text-xs font-serif text-amber-900">
                {(character.inventory || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs rounded-xl transition"
          >
            Close Statblock View
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
