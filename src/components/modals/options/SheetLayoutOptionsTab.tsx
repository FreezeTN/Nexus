import React, { useState, useMemo, useEffect } from 'react';
import {
  LAYOUT_PRESETS,
  SheetCategory,
  useLayoutCustomization,
  getFeaturesForEdition,
  getSheetsForEdition,
  LayoutFeatureDef
} from '../../../utils/layoutCustomization';
import { CharacterData, RuleEdition } from '../../../types';
import { systemRegistry } from '../../../systems';
import {
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Sparkles,
  Swords,
  Coins,
  BookOpen,
  ScrollText,
  Cpu,
  Globe,
  Check,
  X,
  Layers,
  Flame,
  Shield,
  Ghost,
  Terminal,
  Compass
} from 'lucide-react';

const SHEET_METADATA: Record<SheetCategory, { title: string; subtitle: string; icon: React.ReactNode; badgeColor: string }> = {
  sheet1: {
    title: 'Stats & Features',
    subtitle: 'Attributes, skills, class features, feats & pinned workspace',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-600/40'
  },
  sheet2: {
    title: 'Combat',
    subtitle: 'HP orb, armor class, death saves, initiative encounter tracker, weapons & quick spells',
    icon: <Swords className="w-4 h-4 text-rose-400" />,
    badgeColor: 'bg-rose-950/70 text-rose-300 border-rose-600/40'
  },
  sheet3: {
    title: 'Gear & Wealth',
    subtitle: 'Coinage vault, attunement slots, encumbrance capacity & inventory list',
    icon: <Coins className="w-4 h-4 text-emerald-400" />,
    badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
  },
  sheet4: {
    title: 'Spells',
    subtitle: 'Spellcasting stats, interactive spell slot trackers & full grimoire spellbook',
    icon: <BookOpen className="w-4 h-4 text-purple-400" />,
    badgeColor: 'bg-purple-950/70 text-purple-300 border-purple-600/40'
  },
  sheet5: {
    title: 'Description & Notes',
    subtitle: 'Physical appearance, personality traits, backstory & campaign quest notes',
    icon: <ScrollText className="w-4 h-4 text-cyan-400" />,
    badgeColor: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/40'
  },
  shadowrun: {
    title: 'Shadowrun Panels',
    subtitle: 'Cyberware, matrix devices, vehicles, combat monitors & adept spells',
    icon: <Cpu className="w-4 h-4 text-teal-400" />,
    badgeColor: 'bg-teal-950/70 text-teal-300 border-teal-600/40'
  },
  global: {
    title: 'Global App UI',
    subtitle: 'Persistent quick stats bar and overlay tools',
    icon: <Globe className="w-4 h-4 text-indigo-400" />,
    badgeColor: 'bg-indigo-950/70 text-indigo-300 border-indigo-600/40'
  }
};

export interface SheetLayoutOptionsTabProps {
  activeCharacter?: CharacterData | null;
  onSystemChange?: (edition: RuleEdition) => void;
  forcedEdition?: RuleEdition;
}

export const SheetLayoutOptionsTab: React.FC<SheetLayoutOptionsTabProps> = ({
  activeCharacter,
  onSystemChange,
  forcedEdition
}) => {
  const {
    settings,
    isVisible,
    toggleFeature,
    enableAllInSheet,
    disableAllInSheet,
    applyPreset,
    resetToDefaults,
    enableAllForEdition,
    disableAllForEdition,
    countEnabledInSheet,
    countEnabledForEdition
  } = useLayoutCustomization();

  // Determine active character's edition
  const activeCharEdition: RuleEdition = activeCharacter?.edition || '5e';

  // Dynamic state for currently inspected TRPG edition in the layout customizer
  const [selectedEdition, setSelectedEdition] = useState<RuleEdition>(() => {
    return forcedEdition || activeCharEdition;
  });

  // When active character or forced edition changes, sync selectedEdition
  useEffect(() => {
    if (forcedEdition) {
      setSelectedEdition(forcedEdition);
    } else if (activeCharEdition) {
      setSelectedEdition(activeCharEdition);
    }
  }, [forcedEdition, activeCharEdition]);

  // Dynamically query all installed systems from registry (auto-updates when plugins are added)
  const allSystems = useMemo(() => {
    try {
      return systemRegistry.getAllSystems();
    } catch {
      return [];
    }
  }, []);

  const currentSystemPlugin = useMemo(() => {
    return systemRegistry.getSystem(selectedEdition) || null;
  }, [selectedEdition]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<'all' | SheetCategory>('all');
  const [activePresetNotification, setActivePresetNotification] = useState<string | null>(null);

  // Features relevant ONLY to the selected TRPG
  const editionFeatures = useMemo(() => {
    return getFeaturesForEdition(selectedEdition);
  }, [selectedEdition]);

  // Valid sheet categories for this TRPG
  const availableSheets = useMemo(() => {
    return getSheetsForEdition(selectedEdition);
  }, [selectedEdition]);

  // Reset selectedSheetFilter if current filter is not available in new edition
  useEffect(() => {
    if (selectedSheetFilter !== 'all' && !availableSheets.includes(selectedSheetFilter)) {
      setSelectedSheetFilter('all');
    }
  }, [selectedEdition, availableSheets, selectedSheetFilter]);

  // Enabled counts for this TRPG
  const totalEditionFeatures = editionFeatures.length;
  const { enabled: enabledEditionFeatures } = useMemo(() => {
    return countEnabledForEdition(selectedEdition);
  }, [countEnabledForEdition, selectedEdition, settings]);

  const enabledPercentage = totalEditionFeatures > 0
    ? Math.round((enabledEditionFeatures / totalEditionFeatures) * 100)
    : 0;

  // Filter features based on search and sheet category
  const filteredFeatures = useMemo(() => {
    return editionFeatures.filter((f: LayoutFeatureDef) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.sheetLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSheet =
        selectedSheetFilter === 'all' || f.sheet === selectedSheetFilter;

      return matchesSearch && matchesSheet;
    });
  }, [editionFeatures, searchQuery, selectedSheetFilter]);

  // Group filtered features by sheet
  const groupedFeatures = useMemo(() => {
    const groups: { sheet: SheetCategory; features: LayoutFeatureDef[] }[] = [];
    const sheetOrder: SheetCategory[] = ['sheet1', 'sheet2', 'sheet3', 'sheet4', 'sheet5', 'shadowrun', 'global'];

    sheetOrder.forEach((sheetKey) => {
      if (!availableSheets.includes(sheetKey)) return;
      const sheetFeatures = filteredFeatures.filter((f: LayoutFeatureDef) => f.sheet === sheetKey);
      if (sheetFeatures.length > 0) {
        groups.push({ sheet: sheetKey, features: sheetFeatures });
      }
    });

    return groups;
  }, [filteredFeatures, availableSheets]);

  const handleApplyPreset = (presetId: string, presetName: string) => {
    applyPreset(presetId, selectedEdition);
    setActivePresetNotification(`Applied preset for ${currentSystemPlugin?.shortName || selectedEdition}: ${presetName}`);
    setTimeout(() => setActivePresetNotification(null), 2500);
  };

  const getSystemIcon = (systemId: RuleEdition) => {
    switch (systemId) {
      case '5e':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case '3.5e':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'pathfinder':
        return <Compass className="w-3.5 h-3.5 text-rose-400" />;
      case 'cthulhu':
        return <Ghost className="w-3.5 h-3.5 text-emerald-400" />;
      case 'shadowrun':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn text-stone-200">
      {/* TRPG System Switcher Bar */}
      <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-bold text-amber-200">
                  Select TRPG System Options
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-stone-900 border border-stone-700 text-stone-400">
                  {allSystems.length} Systems Registered
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Only layout options applicable to the selected ruleset are shown below.
              </p>
            </div>
          </div>

          {activeCharacter && (
            <div className="text-[11px] font-mono flex items-center gap-1.5 self-start sm:self-auto bg-stone-900/90 px-2.5 py-1 rounded-lg border border-amber-600/30">
              <span className="text-stone-400">Active Character:</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                {getSystemIcon(activeCharEdition)}
                {systemRegistry.getSystem(activeCharEdition)?.shortName || activeCharEdition}
              </span>
            </div>
          )}
        </div>

        {/* TRPG System Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          {allSystems.map((sys) => {
            const isSelected = selectedEdition === sys.id;
            const isCurrentCharacterRuleset = activeCharEdition === sys.id;

            return (
              <button
                key={sys.id}
                onClick={() => setSelectedEdition(sys.id)}
                className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold shrink-0 transition border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                    : 'bg-stone-900/70 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {getSystemIcon(sys.id)}
                <span>{sys.name}</span>
                {isCurrentCharacterRuleset && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Info Banner for Active System */}
      <div className="bg-gradient-to-r from-amber-950/80 via-stone-950 to-stone-900 p-4 rounded-xl border border-amber-600/40 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-amber-100 flex items-center gap-2">
                <span>{currentSystemPlugin?.name || selectedEdition} Layout & Panels</span>
              </h3>
              <p className="text-[11px] text-stone-400">
                {currentSystemPlugin?.description || 'Customizable interface panels tailored to this TRPG.'}
              </p>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-900 border border-amber-600/40 text-amber-300">
              {enabledEditionFeatures} / {totalEditionFeatures} Active ({enabledPercentage}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-900 rounded-full h-1.5 overflow-hidden border border-stone-800">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
            style={{ width: `${enabledPercentage}%` }}
          />
        </div>
      </div>

      {/* Presets Bar */}
      <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-serif font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Layout Presets for {currentSystemPlugin?.shortName || selectedEdition}</span>
          </span>
          {activePresetNotification && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 animate-fadeIn">
              {activePresetNotification}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id, preset.name)}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800/90 border border-stone-700/70 hover:border-amber-500/50 text-left transition flex flex-col justify-between group cursor-pointer"
              title={preset.description}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{preset.icon}</span>
                <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300 truncate">
                  {preset.name}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 truncate mt-1">
                {preset.id === 'all'
                  ? `All ${totalEditionFeatures} panels`
                  : preset.id === 'combat_focus'
                  ? 'Tactical combat'
                  : preset.id === 'minimalist'
                  ? 'Core vitals only'
                  : 'Story & traits'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Bulk Actions Bar */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentSystemPlugin?.shortName || selectedEdition} options (e.g. 'HP Orb', 'Spells', 'Skills')...`}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Bulk Actions for this TRPG */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              onClick={() => enableAllForEdition(selectedEdition)}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-emerald-950 border border-stone-700 hover:border-emerald-600/60 text-stone-300 hover:text-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              title={`Enable all features for ${currentSystemPlugin?.name || selectedEdition}`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enable All</span>
            </button>

            <button
              onClick={() => disableAllForEdition(selectedEdition)}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-rose-950 border border-stone-700 hover:border-rose-600/60 text-stone-300 hover:text-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              title={`Disable all features for ${currentSystemPlugin?.name || selectedEdition}`}
            >
              <Square className="w-3.5 h-3.5 text-rose-400" />
              <span>Disable All</span>
            </button>

            <button
              onClick={() => resetToDefaults(selectedEdition)}
              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/50 text-stone-400 hover:text-amber-300 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              title={`Reset settings for ${currentSystemPlugin?.name || selectedEdition} to defaults`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Sheet Category Filter Tabs (Relevant ONLY to this TRPG) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            onClick={() => setSelectedSheetFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shrink-0 transition border cursor-pointer ${
              selectedSheetFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            All Sheets ({totalEditionFeatures})
          </button>

          {availableSheets.map((sheetKey) => {
            const meta = SHEET_METADATA[sheetKey];
            if (!meta) return null;
            const isSelected = selectedSheetFilter === sheetKey;
            const sheetCounts = countEnabledInSheet(sheetKey, selectedEdition);

            return (
              <button
                key={sheetKey}
                onClick={() => setSelectedSheetFilter(sheetKey)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shrink-0 transition border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <span>{meta.title}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({sheetCounts.enabled}/{sheetCounts.total})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature List Groups */}
      <div className="space-y-4">
        {groupedFeatures.length === 0 ? (
          <div className="bg-stone-950 p-8 rounded-xl border border-stone-800 text-center space-y-2">
            <p className="text-sm text-stone-400">
              No layout features for {currentSystemPlugin?.name || selectedEdition} match &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSheetFilter('all'); }}
              className="text-xs text-amber-400 hover:underline font-mono cursor-pointer"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          groupedFeatures.map(({ sheet, features }) => {
            const meta = SHEET_METADATA[sheet];
            if (!meta) return null;
            const sheetCounts = countEnabledInSheet(sheet, selectedEdition);
            const allSheetEnabled = sheetCounts.enabled === sheetCounts.total;
            const noneSheetEnabled = sheetCounts.enabled === 0;

            return (
              <div key={sheet} className="bg-stone-950 rounded-xl border border-stone-800/80 overflow-hidden shadow-md">
                {/* Sheet Group Header */}
                <div className="p-3 bg-stone-900/80 border-b border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-stone-950 border border-stone-800">
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-xs text-amber-200">
                          {meta.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${meta.badgeColor}`}>
                          {sheetCounts.enabled} / {sheetCounts.total} Active
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400">{meta.subtitle}</p>
                    </div>
                  </div>

                  {/* Sheet Quick Actions */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      disabled={allSheetEnabled}
                      onClick={() => enableAllInSheet(sheet, selectedEdition)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                        allSheetEnabled
                          ? 'opacity-40 cursor-not-allowed bg-stone-950 text-stone-600 border-stone-800'
                          : 'bg-stone-950 hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 border-stone-800 hover:border-emerald-700/60 cursor-pointer'
                      }`}
                    >
                      Check All
                    </button>
                    <button
                      disabled={noneSheetEnabled}
                      onClick={() => disableAllInSheet(sheet, selectedEdition)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition border ${
                        noneSheetEnabled
                          ? 'opacity-40 cursor-not-allowed bg-stone-950 text-stone-600 border-stone-800'
                          : 'bg-stone-950 hover:bg-rose-950 text-stone-300 hover:text-rose-300 border-stone-800 hover:border-rose-700/60 cursor-pointer'
                      }`}
                    >
                      Uncheck All
                    </button>
                  </div>
                </div>

                {/* Features in this Sheet */}
                <div className="divide-y divide-stone-900">
                  {features.map((feature: LayoutFeatureDef) => {
                    const enabled = isVisible(feature.id);

                    return (
                      <label
                        key={feature.id}
                        className={`p-3 flex items-start gap-3 transition cursor-pointer select-none ${
                          enabled
                            ? 'bg-stone-950/70 hover:bg-stone-900/60'
                            : 'bg-stone-950/30 opacity-70 hover:opacity-90 hover:bg-stone-900/40'
                        }`}
                      >
                        {/* Custom Styled Checkbox */}
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleFeature(feature.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              enabled
                                ? 'bg-amber-500 border-amber-400 text-stone-950 shadow'
                                : 'bg-stone-900 border-stone-700 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        {/* Feature Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-serif font-bold text-xs transition ${
                              enabled ? 'text-amber-100' : 'text-stone-400 line-through'
                            }`}>
                              {feature.name}
                            </span>
                            <span className="text-[9px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                              {feature.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                            {feature.description}
                          </p>
                        </div>

                        {/* Status Indicator Icon */}
                        <div className="shrink-0 pt-0.5">
                          {enabled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Visible</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-stone-500 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                              <EyeOff className="w-3 h-3" />
                              <span className="hidden sm:inline">Hidden</span>
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
