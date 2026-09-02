import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CharacterData, RuleEdition } from '../../types';
import {
  UniversalImporter,
  UniversalExporter,
  ImportFormat,
  ExportFormat,
  DetectionResult,
  ImportResult,
  SAMPLE_IMPORT_PRESETS,
  SamplePreset
} from '../../services/universalImporter';
import {
  UploadCloud,
  Download,
  FileCode2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Printer,
  Shield,
  Layers,
  Zap,
  BookOpen,
  Eye,
  RefreshCw,
  Trash2,
  Plus
} from 'lucide-react';
import { getAbilityModifier, formatModifier } from '../../utils/dndCalculations';

interface UniversalImporterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter?: CharacterData | null;
  characters: CharacterData[];
  onImportCharacter: (character: CharacterData, mode: 'new' | 'overwrite') => void;
  onImportMultipleCharacters?: (characters: CharacterData[]) => void;
  edition?: RuleEdition;
}

export const UniversalImporterStudioModal: React.FC<UniversalImporterStudioModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  characters,
  onImportCharacter,
  onImportMultipleCharacters,
  edition = '5e'
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'sandbox' | 'batch'>('import');
  
  // Import State
  const [inputText, setInputText] = useState('');
  const [formatHint, setFormatHint] = useState<ImportFormat>('auto');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [parsedResult, setParsedResult] = useState<ImportResult | null>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Export State
  const [exportTargetCharId, setExportTargetCharId] = useState<string>(activeCharacter?.id || characters[0]?.id || '');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('nexus_json');
  const [exportedOutput, setExportedOutput] = useState<{ content: string; filename: string; mimeType: string }>({
    content: '',
    filename: '',
    mimeType: 'application/json'
  });
  const [copied, setCopied] = useState(false);

  // Auto-detect whenever input changes
  useEffect(() => {
    if (!inputText.trim()) {
      setDetection(null);
      setParsedResult(null);
      return;
    }

    const detected = UniversalImporter.detect(inputText);
    setDetection(detected);

    const result = UniversalImporter.parse(inputText, formatHint, edition);
    setParsedResult(result);
    setSelectedPreviewIndex(0);
  }, [inputText, formatHint, edition]);

  // Update export output when target or format changes
  useEffect(() => {
    const targetChar = characters.find(c => c.id === exportTargetCharId) || activeCharacter || characters[0];
    if (targetChar) {
      const res = UniversalExporter.export(targetChar, exportFormat);
      setExportedOutput(res);
    }
  }, [exportTargetCharId, exportFormat, characters, activeCharacter]);

  if (!isOpen) return null;

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFinalizeImport = (mode: 'new' | 'overwrite') => {
    if (!parsedResult || parsedResult.characters.length === 0) return;
    const charToImport = parsedResult.characters[selectedPreviewIndex];
    if (!charToImport) return;

    onImportCharacter(charToImport, mode);
    onClose();
  };

  const handleBatchImportAll = () => {
    if (!parsedResult || parsedResult.characters.length === 0) return;
    if (onImportMultipleCharacters) {
      onImportMultipleCharacters(parsedResult.characters);
    } else {
      parsedResult.characters.forEach(c => onImportCharacter(c, 'new'));
    }
    onClose();
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportedOutput.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExport = () => {
    const dataStr = `data:${exportedOutput.mimeType};charset=utf-8,` + encodeURIComponent(exportedOutput.content);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = exportedOutput.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrintExport = () => {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${exportedOutput.content}</pre>`);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
    }
  };

  const loadPreset = (preset: SamplePreset) => {
    setInputText(preset.rawContent);
    setActiveTab('import');
  };

  const currentPreviewChar = parsedResult?.characters?.[selectedPreviewIndex] || null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-xl text-amber-200 tracking-wide flex items-center gap-2">
                Universal Importer & Pipeline Studio
              </h2>
              <p className="text-xs text-stone-400">
                5eTools, Foundry VTT, D&D Beyond JSON, Markdown Statblocks & Party Migration
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'import' ? 'bg-amber-600 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Smart Importer</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'export' ? 'bg-amber-600 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sandbox' ? 'bg-amber-600 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Sandbox</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'import' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Column: Input Source & Controls */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {/* Drag and drop file zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    dragActive
                      ? 'border-amber-400 bg-amber-950/20'
                      : 'border-stone-800 hover:border-amber-600/50 bg-stone-950/50'
                  }`}
                  onClick={() => document.getElementById('importer-file-input')?.click()}
                >
                  <input
                    id="importer-file-input"
                    type="file"
                    accept=".json,.md,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <UploadCloud className="w-8 h-8 text-amber-500 animate-pulse" />
                  <div className="text-xs font-bold text-stone-200">
                    Drag & drop files or <span className="text-amber-400 underline">browse</span>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Accepts .json (5eTools, Foundry VTT, D&D Beyond), .md, .txt
                  </div>
                </div>

                {/* Format Override Dropdown */}
                <div className="flex items-center justify-between gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-xs font-bold text-stone-400">Format Target:</span>
                  <select
                    value={formatHint}
                    onChange={(e) => setFormatHint(e.target.value as ImportFormat)}
                    className="bg-stone-900 border border-stone-700 text-amber-200 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="auto">✨ Auto-Detect Format</option>
                    <option value="5etools_creature">5eTools Bestiary / Creature (.json)</option>
                    <option value="foundry_vtt_actor">Foundry VTT Actor Document (.json)</option>
                    <option value="dndbeyond_character">D&D Beyond Character (.json)</option>
                    <option value="markdown_statblock">Markdown Statblock (.md)</option>
                    <option value="plaintext_statblock">Plain Text Statblock (.txt)</option>
                    <option value="nexus_character">Nexus Native Character (.json)</option>
                  </select>
                </div>

                {/* Real-time Format Detection Badge */}
                {detection && (
                  <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-stone-200">
                          {detection.label}
                        </div>
                        {detection.confidence > 0 && (
                          <div className="text-[10px] text-stone-400">
                            Confidence: {Math.round(detection.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                    {detection.summary?.name && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                        {detection.summary.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Raw Text Input Area */}
                <div className="flex-1 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between pb-1 text-xs text-stone-400 font-bold">
                    <span>Or Paste Raw JSON / Markdown / Statblock Text:</span>
                    {inputText && (
                      <button
                        onClick={() => setInputText('')}
                        className="text-stone-500 hover:text-red-400 text-[10px] flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder='Paste 5eTools JSON, Foundry VTT Actor JSON, D&D Beyond export, or Markdown Statblock here...'
                    className="flex-1 w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Live Schema Inspection & Preview */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {currentPreviewChar ? (
                  <div className="bg-stone-950 border border-amber-600/30 rounded-2xl p-5 flex flex-col space-y-4 shadow-xl">
                    {/* Multi-entity selector if batch array */}
                    {parsedResult && parsedResult.characters.length > 1 && (
                      <div className="flex items-center justify-between bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <Layers className="w-4 h-4" />
                          <span>Detected {parsedResult.characters.length} Entities in File:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {parsedResult.characters.map((c, i) => (
                            <button
                              key={c.id || i}
                              onClick={() => setSelectedPreviewIndex(i)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                selectedPreviewIndex === i
                                  ? 'bg-amber-600 text-stone-950'
                                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                              }`}
                            >
                              {c.name || `Entity ${i + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Card Header */}
                    <div className="flex items-start justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-black text-2xl text-amber-100">
                            {currentPreviewChar.name}
                          </h3>
                          {currentPreviewChar.isMonster && (
                            <span className="px-2 py-0.5 bg-red-900/40 text-red-300 border border-red-700/40 rounded-full text-[10px] font-bold uppercase">
                              Monster / NPC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 font-serif italic">
                          Level {currentPreviewChar.level} • {currentPreviewChar.race} {currentPreviewChar.characterClass} ({currentPreviewChar.alignment || 'Neutral'})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs rounded-lg">
                          Schema: {parsedResult?.metadata.formatLabel}
                        </span>
                      </div>
                    </div>

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Armor Class</span>
                        <strong className="text-xl font-mono text-amber-400">{currentPreviewChar.armorClass}</strong>
                      </div>
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Hit Points</span>
                        <strong className="text-xl font-mono text-emerald-400">{currentPreviewChar.hpMax}</strong>
                      </div>
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Speed</span>
                        <strong className="text-xl font-mono text-blue-400">{currentPreviewChar.speed} ft</strong>
                      </div>
                      <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-500 block">Hit Dice</span>
                        <strong className="text-lg font-mono text-stone-200">{currentPreviewChar.hitDiceTotal || '1d8'}</strong>
                      </div>
                    </div>

                    {/* Ability Scores Grid */}
                    <div className="grid grid-cols-6 gap-2 text-center">
                      {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map(ab => {
                        const score = currentPreviewChar.abilities[ab]?.score ?? 10;
                        const mod = getAbilityModifier(score);
                        return (
                          <div key={ab} className="bg-stone-900/80 p-2 rounded-xl border border-stone-800/80">
                            <span className="text-[10px] font-bold text-stone-400 block">{ab}</span>
                            <div className="text-sm font-black text-amber-200">{score}</div>
                            <span className="text-[10px] font-mono text-stone-400 font-bold">{formatModifier(mod)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Attacks & Actions Preview */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-stone-300 flex items-center justify-between">
                        <span>Extracted Attacks & Actions ({currentPreviewChar.attacks?.length || 0}):</span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                        {(currentPreviewChar.attacks || []).map(atk => (
                          <div key={atk.id} className="bg-stone-900 p-2 rounded-lg border border-stone-800 text-xs flex items-center justify-between">
                            <strong className="text-amber-200">{atk.name}</strong>
                            <span className="font-mono text-stone-400 text-[11px]">
                              +{atk.attackBonus} • {atk.damage} {atk.damageType} ({atk.range})
                            </span>
                          </div>
                        ))}
                        {(!currentPreviewChar.attacks || currentPreviewChar.attacks.length === 0) && (
                          <div className="text-xs text-stone-500 italic">No direct attack formulas mapped.</div>
                        )}
                      </div>
                    </div>

                    {/* Spells & Gear Count summary */}
                    <div className="flex items-center gap-4 text-xs font-mono text-stone-400 border-t border-stone-800 pt-3">
                      <span>Spells Extracted: <strong className="text-amber-300">{currentPreviewChar.spells?.length || 0}</strong></span>
                      <span>Features Mapped: <strong className="text-amber-300">{currentPreviewChar.classFeatures?.length || 0}</strong></span>
                      <span>Inventory Items: <strong className="text-amber-300">{currentPreviewChar.inventory?.length || 0}</strong></span>
                    </div>

                    {/* Import Execution Buttons */}
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3 flex-wrap">
                      {parsedResult.characters.length > 1 && (
                        <button
                          onClick={handleBatchImportAll}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <Layers className="w-4 h-4" />
                          <span>Import All ({parsedResult.characters.length})</span>
                        </button>
                      )}

                      {activeCharacter && (
                        <button
                          onClick={() => handleFinalizeImport('overwrite')}
                          className="px-4 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 font-bold text-xs rounded-xl transition"
                        >
                          Overwrite "{activeCharacter.name}"
                        </button>
                      )}

                      <button
                        onClick={() => handleFinalizeImport('new')}
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Import as New Character</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-stone-800 bg-stone-950/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-stone-500 space-y-3">
                    <Eye className="w-12 h-12 text-stone-700 animate-pulse" />
                    <div className="font-serif text-lg font-bold text-stone-400">
                      Live Schema Inspector Ready
                    </div>
                    <p className="text-xs text-stone-500 max-w-md">
                      Upload a 5eTools, Foundry VTT Actor JSON, D&D Beyond character dump, or paste any standard Markdown Statblock on the left to see instant parsed entity cards.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Left Column: Export Controls */}
              <div className="lg:col-span-4 flex flex-col space-y-4">
                {/* Character Picker */}
                <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                  <label className="text-xs font-bold text-stone-400 block">Select Character to Export:</label>
                  <select
                    value={exportTargetCharId}
                    onChange={(e) => setExportTargetCharId(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 text-amber-200 text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Level {c.level} {c.characterClass})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Export Format */}
                <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                  <label className="text-xs font-bold text-stone-400 block">Target Export Standard:</label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'nexus_json', label: 'Nexus Native JSON (Full Fidelity)', ext: '.json' },
                      { id: 'foundry_vtt', label: 'Foundry VTT Actor Document', ext: '.json' },
                      { id: '5etools', label: '5eTools Monster / Character Schema', ext: '.json' },
                      { id: 'markdown', label: 'Markdown Statblock (.md)', ext: '.md' },
                      { id: 'plaintext', label: 'Print-Friendly Plaintext (.txt)', ext: '.txt' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setExportFormat(f.id as ExportFormat)}
                        className={`w-full p-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between border ${
                          exportFormat === f.id
                            ? 'bg-amber-600/15 text-amber-300 border-amber-500/50'
                            : 'bg-stone-900/70 text-stone-400 border-stone-800 hover:text-stone-200'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="font-mono text-[10px] text-stone-500">{f.ext}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDownloadExport}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({exportedOutput.filename})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyExport}
                      className="py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>

                    <button
                      onClick={handlePrintExport}
                      className="py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Code & Syntax Preview */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                    <span className="text-xs font-mono text-amber-300 font-bold">
                      {exportedOutput.filename}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {exportedOutput.mimeType}
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={exportedOutput.content}
                    className="flex-1 w-full bg-stone-900/60 border border-stone-800/80 rounded-xl p-3 text-xs font-mono text-stone-200 resize-none focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sandbox' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif font-black text-lg text-amber-200">
                  Pre-Loaded Sample Presets & Sandbox
                </h3>
                <p className="text-xs text-stone-400">
                  Click any template below to test auto-detection and import preview pipeline in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_IMPORT_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    className="bg-stone-950 border border-stone-800 hover:border-amber-600/40 rounded-2xl p-4 flex flex-col justify-between transition group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md">
                          {preset.format.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-stone-500">{preset.category}</span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-100 group-hover:text-amber-300 transition">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-stone-400">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-900 mt-3 flex items-center justify-end">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-stone-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Load into Importer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="text-[11px] text-stone-500 font-mono">
            Pipeline Engine: 5eTools • Foundry VTT v10-12 • D&D Beyond • Markdown Statblock • Nexus v1.0
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
