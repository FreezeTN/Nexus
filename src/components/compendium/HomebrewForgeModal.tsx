import React, { useState, useEffect, useRef } from 'react';
import { CompendiumItem, saveCustomCompendiumEntry } from '../../data/compendiumData';
import { RuleEdition, CharacterData } from '../../types';
import { SupportedEdition, SYSTEM_DISPLAY_NAMES } from './forge/ForgeTypes';
import { SpellStudio } from './forge/SpellStudio';
import { MonsterStudio } from './forge/MonsterStudio';
import { FeatStudio } from './forge/FeatStudio';
import { ItemStudio } from './forge/ItemStudio';
import { ClassStudio } from './forge/ClassStudio';
import { RaceStudio } from './forge/RaceStudio';
import {
  Sparkles,
  Download,
  Upload,
  X,
  Check,
  FileJson,
  Swords,
  Users
} from 'lucide-react';

interface HomebrewForgeModalProps {
  initialSystem?: RuleEdition;
  onClose: () => void;
  onSaved: (item: CompendiumItem) => void;
  allCustomItems?: CompendiumItem[];
  onImportCustomItems?: (imported: CompendiumItem[]) => void;
  activeCharacter?: CharacterData | null;
  onUpdateCharacter?: (updated: CharacterData) => void;
  onAddItemToInventory?: (item: any, targetId?: string) => void;
}

export const HomebrewForgeModal: React.FC<HomebrewForgeModalProps> = ({
  initialSystem = '5e',
  onClose,
  onSaved,
  allCustomItems = [],
  onImportCustomItems,
  activeCharacter,
  onUpdateCharacter,
  onAddItemToInventory
}) => {
  const [systemEdition, setSystemEdition] = useState<SupportedEdition>(() => {
    if (['5e', '3.5e', 'pathfinder', 'shadowrun', 'cthulhu'].includes(initialSystem)) {
      return initialSystem as SupportedEdition;
    }
    return '5e';
  });

  const [activeTab, setActiveTab] = useState<'classes' | 'races' | 'spells' | 'monsters' | 'feats' | 'items' | 'packs'>('classes');
  const [sourceAuthor, setSourceAuthor] = useState('Custom DM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavedItem = (newItem: CompendiumItem) => {
    saveCustomCompendiumEntry(newItem);
    onSaved(newItem);
    showToast(`✨ Successfully forged and indexed "${newItem.name}"!`);
  };

  // Export Custom Compendium Pack
  const handleExportCustomPack = () => {
    try {
      const exportData = {
        version: '2.5',
        exportedAt: new Date().toISOString(),
        author: sourceAuthor,
        system: systemEdition,
        items: allCustomItems
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Homebrew_Vault_${systemEdition}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`📦 Exported ${allCustomItems.length} custom homebrew entries!`);
    } catch (e) {
      console.error(e);
      showToast('❌ Export failed');
    }
  };

  // Import Pack
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let itemsToImport: CompendiumItem[] = [];
        if (Array.isArray(parsed)) {
          itemsToImport = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          itemsToImport = parsed.items;
        }
        if (itemsToImport.length > 0) {
          itemsToImport.forEach(item => {
            saveCustomCompendiumEntry(item);
          });
          if (onImportCustomItems) {
            onImportCustomItems(itemsToImport);
          }
          setImportStatus(`Successfully imported ${itemsToImport.length} homebrew entries!`);
          showToast(`✨ Imported ${itemsToImport.length} items to Compendium!`);
        } else {
          setImportStatus('No valid compendium items found in file.');
        }
      } catch (err) {
        console.error(err);
        setImportStatus('Error parsing JSON file. Please check format.');
      }
    };
    reader.readAsText(file);
  };

  // Dynamic system labels and styling
  const isShadowrun = systemEdition === 'shadowrun';
  const isCthulhu = systemEdition === 'cthulhu';

  const tabLabels = {
    classes: isShadowrun ? '💼 Roles & Archetypes' : isCthulhu ? '🕵️ Occupations' : '🛡️ Classes & Paths',
    races: isShadowrun ? '🧬 Metatypes' : isCthulhu ? '🩸 Lineages' : '🧝 Races & Lineages',
    spells: isShadowrun ? '⚡ Spells & Matrix' : isCthulhu ? '🔮 Spells & Rituals' : '🪄 Spell Studio',
    monsters: isShadowrun ? '👥 Grunts & NPCs' : isCthulhu ? '🐙 Monsters & Entities' : '👹 Monsters & NPCs',
    feats: isShadowrun ? '🧬 Qualities & Augments' : isCthulhu ? '📜 Talents & Occupations' : '📜 Feats & Features',
    items: isShadowrun ? '🔫 Weapons & Cyber' : isCthulhu ? '🗡️ Weapons & Relics' : '⚔️ Items & Relics',
    packs: '📦 Import & Export'
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
      id="homebrew-forge-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-stone-950 border-2 border-amber-500/50 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-5 bg-linear-to-r from-stone-950 via-amber-950/40 to-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-300 shadow-lg shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Homebrew & Custom Rules Forge
                </h2>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 shadow">
                  TRPG Multi-System
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                Design custom entities tailored to <span className="text-amber-300 font-bold">{SYSTEM_DISPLAY_NAMES[systemEdition]}</span> with 1-click compendium indexing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Edition Selector */}
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] font-mono text-stone-400">Ruleset:</span>
              <select
                id="forge-ruleset-selector"
                value={systemEdition}
                onChange={(e) => setSystemEdition(e.target.value as SupportedEdition)}
                className="bg-stone-950 border border-stone-700 text-amber-300 text-xs font-mono font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="5e">D&D 5e (SRD)</option>
                <option value="3.5e">D&D 3.5e Classic</option>
                <option value="pathfinder">Pathfinder 2e</option>
                <option value="shadowrun">Shadowrun 5e</option>
                <option value="cthulhu">Call of Cthulhu 7e</option>
              </select>
            </div>

            {/* Prominent Close Button */}
            <button
              type="button"
              id="close-homebrew-forge-modal"
              onClick={onClose}
              className="px-3 py-1.5 bg-stone-900 hover:bg-rose-950/80 border border-stone-700 hover:border-rose-500/50 rounded-xl text-stone-300 hover:text-rose-200 transition flex items-center gap-1.5 text-xs font-bold font-mono cursor-pointer shadow-lg shrink-0"
              title="Close Forge Window (Esc)"
              aria-label="Close Forge Window"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close (Esc)</span>
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 bg-stone-900/90 border-b border-stone-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'classes'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.classes}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('races')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'races'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.races}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spells')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'spells'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.spells}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monsters')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'monsters'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.monsters}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feats')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'feats'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.feats}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.items}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packs')}
            className={`flex items-center px-3.5 py-2.5 rounded-t-xl text-xs font-bold font-mono transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'packs'
                ? 'bg-stone-950 text-amber-300 border-amber-500'
                : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <span>{tabLabels.packs}</span>
          </button>
        </div>

        {/* Source Author Banner */}
        <div className="px-6 py-2 bg-stone-900/40 border-b border-stone-800/60 flex items-center justify-between text-xs font-mono text-stone-400">
          <div className="flex items-center gap-2">
            <span>Author Attribution:</span>
            <input
              type="text"
              value={sourceAuthor}
              onChange={(e) => setSourceAuthor(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded px-2 py-0.5 text-stone-200 text-xs w-36 sm:w-48"
              placeholder="e.g. Campaign Master"
            />
          </div>
          <div className="text-[11px] text-amber-400/80 hidden sm:block">
            Target System: <strong className="text-amber-300">{SYSTEM_DISPLAY_NAMES[systemEdition]}</strong>
          </div>
        </div>

        {/* Modal Body / Active Studio */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {toastMessage && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-lg">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: CLASS STUDIO */}
          {activeTab === 'classes' && (
            <ClassStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
            />
          )}

          {/* TAB 2: RACE STUDIO */}
          {activeTab === 'races' && (
            <RaceStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
            />
          )}

          {/* TAB 3: SPELL STUDIO */}
          {activeTab === 'spells' && (
            <SpellStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
              activeCharacter={activeCharacter}
              onUpdateCharacter={onUpdateCharacter}
            />
          )}

          {/* TAB 4: MONSTER STUDIO */}
          {activeTab === 'monsters' && (
            <MonsterStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
            />
          )}

          {/* TAB 5: FEAT STUDIO */}
          {activeTab === 'feats' && (
            <FeatStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
            />
          )}

          {/* TAB 6: ITEM STUDIO */}
          {activeTab === 'items' && (
            <ItemStudio
              edition={systemEdition}
              sourceAuthor={sourceAuthor}
              onSave={handleSavedItem}
              onClose={onClose}
              activeCharacter={activeCharacter}
              onUpdateCharacter={onUpdateCharacter}
              onAddItemToInventory={onAddItemToInventory}
            />
          )}

          {/* TAB 7: IMPORT / EXPORT */}
          {activeTab === 'packs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-stone-100">
                      Export Homebrew Compendium Vault
                    </h3>
                    <p className="text-xs text-stone-400">
                      Export all your custom created classes, races, spells, monsters, feats, and items as a JSON pack to share or back up.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-stone-300">
                      Total Custom Items in Compendium:{' '}
                      <strong className="text-amber-400">{allCustomItems.length}</strong>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Format: Nexus Compendium v2.5 JSON
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCustomPack}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Pack</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-stone-900/60 border border-stone-800 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-stone-100">
                      Import Homebrew Compendium Pack
                    </h3>
                    <p className="text-xs text-stone-400">
                      Load a community or pre-built JSON compendium file into your current campaign.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-700 hover:border-cyan-400/60 bg-stone-900/40 hover:bg-stone-900/80 transition p-6 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <FileJson className="w-8 h-8 text-cyan-400" />
                    <span className="text-xs font-bold text-stone-200">
                      Click to Browse or Drag & Drop JSON Pack
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Supports Nexus Compendium exports (.json)
                    </span>
                  </div>

                  {importStatus && (
                    <div className="p-3 bg-stone-900 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{importStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
