import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Map,
  Save,
  Download,
  Upload,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  Search,
  Grid,
  Shield,
  Eye,
  AlertTriangle,
  Info,
  Flame,
  FileDown,
  RefreshCw,
  Castle,
  Trees,
  Skull
} from 'lucide-react';
import {
  BattlemapLayout,
  BattlemapConfig,
  BattlemapCategory,
  TerrainType,
  DoorState,
  AoETemplate,
  BATTLEMAP_THEMES
} from './battlemapTypes';
import { PRESET_BATTLEMAP_LAYOUTS } from './battlemapPresets';
import {
  fetchAllCustomLayouts,
  saveBattlemapLayout,
  deleteBattlemapLayout,
  exportLayoutToJson,
  exportAllLayoutsToJson,
  parseLayoutFromJson
} from '../../lib/battlemapStorage';
import { Combatant } from '../combat/encounter/encounterTypes';

export interface BattlemapLayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: BattlemapConfig;
  currentTerrain: Record<string, TerrainType>;
  currentDoors: Record<string, DoorState>;
  currentFogOfWar?: Record<string, boolean>;
  currentUseFogOfWar?: boolean;
  currentAoE?: AoETemplate | null;
  currentCombatants?: Combatant[];
  userId?: string;
  userName?: string;
  onApplyLayout: (layout: BattlemapLayout, options: {
    includeTokens: boolean;
    includeFog: boolean;
    replaceTerrain: boolean;
  }) => void;
}

export const BattlemapLayoutsModal: React.FC<BattlemapLayoutsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  currentTerrain,
  currentDoors,
  currentFogOfWar = {},
  currentUseFogOfWar = false,
  currentAoE = null,
  currentCombatants = [],
  userId,
  userName = 'DM',
  onApplyLayout
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'save' | 'new'>('library');
  const [customLayouts, setCustomLayouts] = useState<BattlemapLayout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save Layout Form State
  const [saveName, setSaveName] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState<string>('');
  const [saveCategory, setSaveCategory] = useState<BattlemapCategory>('dungeon');
  const [saveIncludeTokens, setSaveIncludeTokens] = useState<boolean>(true);
  const [saveIncludeFog, setSaveIncludeFog] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Confirmation Modal State
  const [layoutToLoad, setLayoutToLoad] = useState<BattlemapLayout | null>(null);
  const [loadIncludeTokens, setLoadIncludeTokens] = useState<boolean>(true);
  const [loadIncludeFog, setLoadIncludeFog] = useState<boolean>(true);
  const [loadReplaceTerrain, setLoadReplaceTerrain] = useState<boolean>(true);

  // Blank Canvas Presets State
  const [blankDimensions, setBlankDimensions] = useState<{ cols: number; rows: number; name: string }>({
    cols: 24,
    rows: 16,
    name: 'Medium Encounter (24x16)'
  });
  const [blankTheme, setBlankTheme] = useState(currentConfig.theme || 'dungeon');
  const [blankIncludePerimeterWalls, setBlankIncludePerimeterWalls] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load layouts on mount or tab change
  const refreshLayouts = async () => {
    setIsLoading(true);
    try {
      const layouts = await fetchAllCustomLayouts(userId);
      setCustomLayouts(layouts);
    } catch (err) {
      console.warn('Failed to load custom layouts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLayouts();
      // Pre-fill save form name
      if (!saveName) {
        const themeTitle = BATTLEMAP_THEMES[currentConfig.theme]?.name || 'Battlemap';
        setSaveName(`${themeTitle} Map - ${new Date().toLocaleDateString()}`);
      }
    }
  }, [isOpen, userId]);

  // Combined layouts list
  const allLayouts = useMemo(() => {
    return [...customLayouts, ...PRESET_BATTLEMAP_LAYOUTS];
  }, [customLayouts]);

  // Filtered layouts
  const filteredLayouts = useMemo(() => {
    return allLayouts.filter((layout) => {
      if (selectedCategory === 'presets' && !layout.isBuiltin) return false;
      if (selectedCategory === 'custom' && layout.isBuiltin) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'presets' && selectedCategory !== 'custom') {
        if (layout.category !== selectedCategory) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = layout.name.toLowerCase().includes(query);
        const matchesDesc = (layout.description || '').toLowerCase().includes(query);
        const matchesTheme = layout.config.theme.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesTheme;
      }
      return true;
    });
  }, [allLayouts, selectedCategory, searchQuery]);

  // Handle Save Current Layout
  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a name for your battlemap layout.' });
      return;
    }

    setIsSaving(true);
    try {
      // Build tokens array if requested
      const tokensToSave = saveIncludeTokens
        ? currentCombatants.filter((c) => typeof c.mapX === 'number' && typeof c.mapY === 'number').map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            x: c.mapX || 0,
            y: c.mapY || 0,
            tokenSize: c.tokenSize || 1,
            reachFeet: c.reachFeet || 5,
            elevationFeet: c.elevationFeet || 0,
            speed: c.speed || 30,
            hpCurrent: c.hpCurrent,
            hpMax: c.hpMax,
            armorClass: c.armorClass,
            portraitUrl: c.portraitUrl,
            isSpawnPoint: false
          }))
        : [];

      const newLayout: BattlemapLayout = {
        id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: saveName.trim(),
        description: saveDescription.trim(),
        category: saveCategory,
        authorId: userId,
        authorName: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBuiltin: false,
        config: { ...currentConfig },
        terrainMap: { ...currentTerrain },
        doors: { ...currentDoors },
        fogOfWar: saveIncludeFog ? { ...currentFogOfWar } : {},
        useFogOfWar: saveIncludeFog ? currentUseFogOfWar : false,
        activeAoE: currentAoE || null,
        tokens: tokensToSave
      };

      await saveBattlemapLayout(newLayout);
      await refreshLayouts();
      setFeedbackMessage({ type: 'success', text: `Saved "${newLayout.name}" successfully!` });
      setActiveTab('library');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to save layout.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteLayout = async (layoutId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the layout "${name}"?`)) return;
    try {
      await deleteBattlemapLayout(layoutId);
      await refreshLayouts();
      setFeedbackMessage({ type: 'success', text: `Deleted "${name}".` });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: 'Failed to delete layout.' });
    }
  };

  // Handle Duplicate
  const handleDuplicateLayout = async (layout: BattlemapLayout) => {
    try {
      const cloned: BattlemapLayout = {
        ...layout,
        id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: `${layout.name} (Copy)`,
        authorId: userId,
        authorName: userName,
        isBuiltin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveBattlemapLayout(cloned);
      await refreshLayouts();
      setFeedbackMessage({ type: 'success', text: `Duplicated "${cloned.name}".` });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to duplicate layout.' });
    }
  };

  // Handle Import from JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const importedList = parseLayoutFromJson(text);
        for (const imported of importedList) {
          await saveBattlemapLayout(imported);
        }
        await refreshLayouts();
        setFeedbackMessage({
          type: 'success',
          text: `Imported ${importedList.length} battlemap layout${importedList.length > 1 ? 's' : ''}!`
        });
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to parse JSON layout file.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Applying / Loading Layout to Canvas
  const handleConfirmLoad = () => {
    if (!layoutToLoad) return;
    onApplyLayout(layoutToLoad, {
      includeTokens: loadIncludeTokens,
      includeFog: loadIncludeFog,
      replaceTerrain: loadReplaceTerrain
    });
    setLayoutToLoad(null);
    onClose();
  };

  // Handle Create Blank Canvas
  const handleCreateBlankCanvas = () => {
    const terrain: Record<string, TerrainType> = {};
    if (blankIncludePerimeterWalls) {
      for (let x = 0; x < blankDimensions.cols; x++) {
        terrain[`${x},0`] = 'wall';
        terrain[`${x},${blankDimensions.rows - 1}`] = 'wall';
      }
      for (let y = 0; y < blankDimensions.rows; y++) {
        terrain[`0,${y}`] = 'wall';
        terrain[`${blankDimensions.cols - 1},${y}`] = 'wall';
      }
    }

    const blankLayout: BattlemapLayout = {
      id: `blank_${Date.now()}`,
      name: blankDimensions.name,
      category: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        ...currentConfig,
        gridColumns: blankDimensions.cols,
        gridRows: blankDimensions.rows,
        theme: blankTheme
      },
      terrainMap: terrain,
      doors: {},
      useFogOfWar: false,
      fogOfWar: {},
      tokens: []
    };

    onApplyLayout(blankLayout, {
      includeTokens: false,
      includeFog: false,
      replaceTerrain: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                <span>Battlemap Layouts & Pre-Builds</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-sans font-bold">
                  DM Tools
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Pre-build tactical maps, save custom layouts, or load ready-to-play battle arenas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Global Actions */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stone-800 bg-stone-950/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'library'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Layouts Library ({allLayouts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('save')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'save'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Current Map</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'new'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Blank Canvas</span>
            </button>
          </div>

          {/* Import / Export Utility Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition"
              title="Import battlemap layout from a .json file"
            >
              <Upload className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            {customLayouts.length > 0 && (
              <button
                type="button"
                onClick={() => exportAllLayoutsToJson(customLayouts)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition"
                title="Backup all your custom battlemap layouts to a single .json bundle"
              >
                <FileDown className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden sm:inline">Backup All</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="p-1 hover:opacity-75"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: LAYOUTS LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search layouts by name, description, or theme..."
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-700/80 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'presets', label: 'Presets' },
                    { id: 'custom', label: 'Custom' },
                    { id: 'dungeon', label: 'Dungeon' },
                    { id: 'wilderness', label: 'Wilderness' },
                    { id: 'tavern', label: 'Tavern' },
                    { id: 'boss_arena', label: 'Boss Arena' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Cards Grid */}
              {isLoading ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                  <p className="text-xs">Loading battlemap layouts...</p>
                </div>
              ) : filteredLayouts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl p-6 text-stone-400 space-y-3">
                  <Map className="w-8 h-8 mx-auto text-stone-600 opacity-60" />
                  <div>
                    <div className="font-bold text-stone-300 text-sm">No battlemaps match your criteria</div>
                    <p className="text-xs text-stone-500 mt-1">
                      Try adjusting your search query, or save your current map as a new layout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('save')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Current Map as Layout</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredLayouts.map((layout) => {
                    const themeMeta = BATTLEMAP_THEMES[layout.config.theme] || BATTLEMAP_THEMES.dungeon;
                    const tileCount = Object.keys(layout.terrainMap || {}).length;
                    const doorCount = Object.keys(layout.doors || {}).length;
                    const tokenCount = (layout.tokens || []).length;
                    const hasFog = Boolean(layout.useFogOfWar);

                    return (
                      <div
                        key={layout.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                          layout.isBuiltin
                            ? 'bg-stone-950/60 border-stone-800 hover:border-amber-600/50'
                            : 'bg-stone-950 border-amber-800/40 hover:border-amber-500/80 shadow-md'
                        }`}
                      >
                        <div>
                          {/* Card Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                                style={{
                                  backgroundColor: themeMeta.wallColor,
                                  borderColor: themeMeta.difficultColor,
                                  color: '#e7e5e4'
                                }}
                              >
                                {themeMeta.icon} {themeMeta.name}
                              </span>

                              <span className="text-[10px] bg-stone-900 border border-stone-700/80 text-stone-300 px-2 py-0.5 rounded font-mono font-bold">
                                {layout.config.gridColumns} × {layout.config.gridRows} sq ({layout.config.gridColumns * 5}×{layout.config.gridRows * 5}ft)
                              </span>

                              {layout.isBuiltin ? (
                                <span className="text-[10px] bg-purple-950/90 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                                  Preset
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  Custom Save
                                </span>
                              )}
                            </div>

                            {/* Export JSON quick button */}
                            <button
                              type="button"
                              onClick={() => exportLayoutToJson(layout)}
                              className="p-1 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded transition"
                              title="Export layout as .json file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Layout Title */}
                          <h3 className="font-serif font-bold text-sm text-stone-100">
                            {layout.name}
                          </h3>

                          {/* Description */}
                          {layout.description && (
                            <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                              {layout.description}
                            </p>
                          )}

                          {/* Stats Tags */}
                          <div className="flex items-center gap-2 mt-3 text-[11px] text-stone-400 flex-wrap">
                            <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 font-mono">
                              🧱 {tileCount} tiles
                            </span>
                            {doorCount > 0 && (
                              <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 font-mono">
                                🚪 {doorCount} doors
                              </span>
                            )}
                            {tokenCount > 0 && (
                              <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 font-mono text-amber-300">
                                👥 {tokenCount} tokens
                              </span>
                            )}
                            {hasFog && (
                              <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 font-mono text-sky-300">
                                🌫️ Fog of War
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {!layout.isBuiltin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLayout(layout.id, layout.name)}
                                className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                title="Delete layout"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDuplicateLayout(layout)}
                              className="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition"
                              title="Duplicate layout"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setLayoutToLoad(layout);
                              setLoadIncludeTokens(Boolean(layout.tokens && layout.tokens.length > 0));
                              setLoadIncludeFog(Boolean(layout.useFogOfWar));
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition shadow cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Load Map</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVE CURRENT MAP */}
          {activeTab === 'save' && (
            <form onSubmit={handleSaveCurrent} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Current Map Snapshot Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                    <span className="text-stone-500 text-[10px] block">Dimensions</span>
                    <strong className="text-stone-100">{currentConfig.gridColumns} × {currentConfig.gridRows} sq</strong>
                  </div>
                  <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                    <span className="text-stone-500 text-[10px] block">Theme</span>
                    <strong className="text-stone-100">{BATTLEMAP_THEMES[currentConfig.theme]?.name || currentConfig.theme}</strong>
                  </div>
                  <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                    <span className="text-stone-500 text-[10px] block">Terrain Tiles</span>
                    <strong className="text-stone-100">{Object.keys(currentTerrain).length} tiles</strong>
                  </div>
                  <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
                    <span className="text-stone-500 text-[10px] block">Placed Tokens</span>
                    <strong className="text-stone-100">{currentCombatants.filter((c) => typeof c.mapX === 'number').length} tokens</strong>
                  </div>
                </div>
              </div>

              {/* Layout Name */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Layout Title *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Underdark Stronghold Level 1"
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description & DM Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Description & DM Tactical Notes (Optional)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                  placeholder="Notes about ambush triggers, secret door DC, lighting, or hazard damage..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as BattlemapCategory)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="dungeon">Dungeon & Crypts</option>
                  <option value="wilderness">Wilderness & Roads</option>
                  <option value="tavern">Tavern & Urban</option>
                  <option value="boss_arena">Boss Arena & Caldera</option>
                  <option value="cavern">Cavern & Underdark</option>
                  <option value="ruins">Ruins & Planar</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Checkbox Options */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveIncludeTokens}
                    onChange={(e) => setSaveIncludeTokens(e.target.checked)}
                    className="rounded bg-stone-950 border-stone-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Include placed creature tokens ({currentCombatants.filter((c) => typeof c.mapX === 'number').length} tokens placed on map)
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveIncludeFog}
                    onChange={(e) => setSaveIncludeFog(e.target.checked)}
                    className="rounded bg-stone-950 border-stone-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Include current Fog of War status ({currentUseFogOfWar ? 'Enabled' : 'Disabled'}, {Object.keys(currentFogOfWar).length} revealed cells)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !saveName.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 text-xs font-bold rounded-xl transition shadow cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Layout...' : 'Save Battlemap Layout'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: NEW BLANK CANVAS */}
          {activeTab === 'new' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Start from a Fresh Tactical Canvas</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Choose your grid dimensions and theme to prepare a blank map ready for terrain painting and monster placement.
                </p>
              </div>

              {/* Dimensions Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Grid Size Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { cols: 16, rows: 12, name: 'Skirmish (16×12 sq)', desc: '80×60 ft' },
                    { cols: 24, rows: 16, name: 'Standard (24×16 sq)', desc: '120×80 ft' },
                    { cols: 32, rows: 20, name: 'Large Hall (32×20 sq)', desc: '160×100 ft' },
                    { cols: 40, rows: 26, name: 'Epic Battlefield (40×26 sq)', desc: '200×130 ft' }
                  ].map((dim) => {
                    const isSelected = blankDimensions.cols === dim.cols && blankDimensions.rows === dim.rows;
                    return (
                      <button
                        key={dim.name}
                        type="button"
                        onClick={() => setBlankDimensions({ cols: dim.cols, rows: dim.rows, name: dim.name })}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-500 text-stone-100 ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{dim.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">{dim.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Atmospheric Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(BATTLEMAP_THEMES).map(([themeKey, meta]) => {
                    const isSelected = blankTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setBlankTheme(themeKey as any)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-500 text-stone-100 ring-1 ring-amber-500'
                            : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <div className="text-xs font-bold">{meta.name}</div>
                          <div className="text-[9px] text-stone-500 uppercase font-mono">{themeKey}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Perimeter Walls Checkbox */}
              <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={blankIncludePerimeterWalls}
                  onChange={(e) => setBlankIncludePerimeterWalls(e.target.checked)}
                  className="rounded bg-stone-950 border-stone-700 text-amber-600 focus:ring-amber-500"
                />
                <span>Automatically add outer boundary walls around the edge of the map</span>
              </label>

              {/* Action Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateBlankCanvas}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl transition shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Initialize Blank Canvas ({blankDimensions.cols}×{blankDimensions.rows})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-stone-800 bg-stone-950 text-xs text-stone-500 flex items-center justify-between">
          <span>Saved layouts are synced to your DM library and can be exported as standard JSON anytime.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* CONFIRM LOAD DIALOG */}
      {layoutToLoad && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div
            className="bg-stone-900 border border-amber-600/60 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-amber-400">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-100">
                  Load "{layoutToLoad.name}"?
                </h3>
                <p className="text-xs text-stone-400">
                  {layoutToLoad.config.gridColumns}×{layoutToLoad.config.gridRows} sq • {BATTLEMAP_THEMES[layoutToLoad.config.theme]?.name || layoutToLoad.config.theme}
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-stone-300">Loading Configuration:</div>

              <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loadReplaceTerrain}
                  onChange={(e) => setLoadReplaceTerrain(e.target.checked)}
                  className="rounded bg-stone-900 border-stone-700 text-amber-600 focus:ring-amber-500"
                />
                <span>Replace existing terrain, walls, and doors</span>
              </label>

              {layoutToLoad.tokens && layoutToLoad.tokens.length > 0 && (
                <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loadIncludeTokens}
                    onChange={(e) => setLoadIncludeTokens(e.target.checked)}
                    className="rounded bg-stone-900 border-stone-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Spawn pre-placed creature tokens ({layoutToLoad.tokens.length} creatures / spawns)
                  </span>
                </label>
              )}

              {layoutToLoad.useFogOfWar && (
                <label className="flex items-center gap-2 text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loadIncludeFog}
                    onChange={(e) => setLoadIncludeFog(e.target.checked)}
                    className="rounded bg-stone-900 border-stone-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Apply Fog of War shroud and revealed state</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLayoutToLoad(null)}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLoad}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition shadow cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Apply Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
