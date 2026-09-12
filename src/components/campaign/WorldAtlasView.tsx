import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Compass,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Navigation,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Castle,
  Tent,
  Skull,
  Flame,
  Globe,
  Radio,
  Share2,
  CheckCircle2,
  X,
  Upload,
  Image as ImageIcon,
  BookOpen,
  User,
  AlertTriangle,
  Gem,
  Crosshair,
  Home,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';
import {
  WorldLocation,
  LocationType,
  MapPresetSkin,
  DungeonDetails
} from '../../types/campaign';
import {
  loadCampaignLocations,
  saveCampaignLocations,
  generateAiLocation
} from '../../services/campaignService';

interface WorldAtlasViewProps {
  initialSelectedName?: string;
  onSelectLocationForTravel?: (location: WorldLocation) => void;
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
  onNavigateToFaction?: (factionName: string) => void;
}

const LOCATION_ICONS: Record<LocationType, { icon: any; color: string; bg: string; label: string }> = {
  city: { icon: Castle, color: 'text-amber-300', bg: 'bg-amber-950/90 border-amber-500/60', label: 'City / Metropolis' },
  castle: { icon: Shield, color: 'text-blue-300', bg: 'bg-blue-950/90 border-blue-500/60', label: 'Castle / Citadel' },
  dungeon: { icon: Skull, color: 'text-red-400', bg: 'bg-red-950/90 border-red-500/60', label: 'Dungeon / Delve' },
  boss_lair: { icon: Flame, color: 'text-rose-400', bg: 'bg-rose-950/90 border-rose-500/60', label: 'Boss Lair' },
  tavern: { icon: Tent, color: 'text-emerald-300', bg: 'bg-emerald-950/90 border-emerald-500/60', label: 'Tavern / Taproom' },
  wilderness: { icon: Compass, color: 'text-green-400', bg: 'bg-green-950/90 border-green-500/60', label: 'Wilderness / Grove' },
  shrine: { icon: Sparkles, color: 'text-purple-300', bg: 'bg-purple-950/90 border-purple-500/60', label: 'Shrine / Temple' },
  ruins: { icon: Layers, color: 'text-stone-300', bg: 'bg-stone-900/90 border-stone-600/60', label: 'Ancient Ruins' },
  anomaly: { icon: Radio, color: 'text-cyan-300', bg: 'bg-cyan-950/90 border-cyan-500/60', label: 'Mystic Anomaly' },
  port: { icon: Navigation, color: 'text-sky-300', bg: 'bg-sky-950/90 border-sky-500/60', label: 'Port / Anchorage' },
  safehouse: { icon: Home, color: 'text-indigo-300', bg: 'bg-indigo-950/90 border-indigo-500/60', label: 'Faction Safehouse' },
  monument: { icon: Gem, color: 'text-yellow-300', bg: 'bg-yellow-950/90 border-yellow-500/60', label: 'Lore Monument' }
};

const MAP_PRESETS: Record<MapPresetSkin, { name: string; bgClass: string; gridColor: string }> = {
  faerun: {
    name: 'Faerûn High Fantasy Realm',
    bgClass: 'bg-gradient-to-br from-emerald-950/70 via-stone-900 to-amber-950/40',
    gridColor: 'rgba(217, 119, 6, 0.15)'
  },
  sword_coast: {
    name: 'Sword Coast Parchment Cartography',
    bgClass: 'bg-gradient-to-br from-[#2a2216] via-[#1f1910] to-[#120f0a]',
    gridColor: 'rgba(180, 140, 80, 0.2)'
  },
  underdark: {
    name: 'Underdark Bioluminescent Depths',
    bgClass: 'bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950',
    gridColor: 'rgba(168, 85, 247, 0.2)'
  },
  cyberpunk: {
    name: 'Neo-City Holographic Matrix',
    bgClass: 'bg-gradient-to-br from-cyan-950/90 via-slate-950 to-pink-950/50',
    gridColor: 'rgba(6, 182, 212, 0.25)'
  },
  ravenloft: {
    name: 'Gothic Ravenloft Mists',
    bgClass: 'bg-gradient-to-br from-red-950/60 via-stone-950 to-purple-950/80',
    gridColor: 'rgba(239, 68, 68, 0.15)'
  },
  arkham: {
    name: 'Arkham Eldritch Coast',
    bgClass: 'bg-gradient-to-br from-teal-950 via-gray-950 to-emerald-950',
    gridColor: 'rgba(20, 184, 166, 0.2)'
  },
  archipelago: {
    name: 'Corsair Sunken Archipelago',
    bgClass: 'bg-gradient-to-br from-blue-950 via-cyan-950/80 to-slate-950',
    gridColor: 'rgba(56, 189, 248, 0.2)'
  },
  custom: {
    name: 'Custom Map Image / Upload',
    bgClass: 'bg-stone-950',
    gridColor: 'rgba(255, 255, 255, 0.1)'
  }
};

const COLOR_PALETTES = [
  { label: 'Amber Gold', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-300' },
  { label: 'Crimson Red', value: 'red', bg: 'bg-red-500', text: 'text-red-400' },
  { label: 'Arcane Purple', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-300' },
  { label: 'Emerald Green', value: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-300' },
  { label: 'Cyan Matrix', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-300' },
  { label: 'Rose Lair', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-300' },
  { label: 'Sky Haven', value: 'sky', bg: 'bg-sky-500', text: 'text-sky-300' }
];

const DUNGEON_HAZARDS = [
  'Poison Dart Wall Traps',
  'Deep Pitfall with Spikes',
  'Arcane Silence Ward',
  'Suffocating Toxic Mists',
  'Collapsing Ceiling Trigger',
  'Mimic Chest Decoy',
  'Flooding Water Sluice',
  'Necrotic Desecration Aura'
];

export const WorldAtlasView: React.FC<WorldAtlasViewProps> = ({
  initialSelectedName,
  onSelectLocationForTravel,
  onOpenKnowledgeGraph,
  onOpenGenerators,
  onNavigateToFaction
}) => {
  const [locations, setLocations] = useState<WorldLocation[]>(() => loadCampaignLocations());
  const [selectedLocation, setSelectedLocation] = useState<WorldLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dangerFilter, setDangerFilter] = useState<string>('all');
  const [currentSkin, setCurrentSkin] = useState<MapPresetSkin>('sword_coast');
  const [customMapUrl, setCustomMapUrl] = useState<string>(() => localStorage.getItem('nexus_custom_campaign_map_url') || '');
  const [showCustomUploadModal, setShowCustomUploadModal] = useState(false);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [selectedPinType, setSelectedPinType] = useState<LocationType>('dungeon');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fogOfWarActive, setFogOfWarActive] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNpcName, setNewNpcName] = useState('');
  const [newTag, setNewTag] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial selection if passed from another tab
  useEffect(() => {
    if (initialSelectedName) {
      const match = locations.find(l => l.name.toLowerCase().includes(initialSelectedName.toLowerCase()));
      if (match) {
        setSelectedLocation(match);
      }
    }
  }, [initialSelectedName, locations]);

  const handleSaveLocations = (newLocs: WorldLocation[]) => {
    setLocations(newLocs);
    saveCampaignLocations(newLocs);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPin || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const isDungeonType = selectedPinType === 'dungeon' || selectedPinType === 'boss_lair' || selectedPinType === 'ruins';

    const newLoc: WorldLocation = {
      id: `loc-custom-${Date.now()}`,
      name: selectedPinType === 'dungeon' ? 'Sunken Crypts of the Forgotten' : selectedPinType === 'boss_lair' ? 'Dragon Wyrm Lair' : 'Uncharted Regional Landmark',
      type: selectedPinType,
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(4, Math.min(96, y)),
      dangerLevel: isDungeonType ? 'Tier 2 (CR 5-10)' : 'Tier 1 (CR 1-4)',
      climate: isDungeonType ? 'Subterranean Stone Halls' : 'Temperate Frontier',
      description: 'A newly charted point of interest marked upon the party atlas awaiting expedition.',
      linkedNpcNames: [],
      shopsAndServices: [],
      isDiscovered: true,
      tags: [selectedPinType, 'Exploration'],
      dungeonDetails: isDungeonType ? {
        floors: 3,
        bossName: 'Ancient Crypt Warden',
        hazards: ['Poison Dart Wall Traps', 'Collapsing Ceiling Trigger'],
        roomCount: 8,
        treasureNotes: 'Sealed reliquary containing enchanted silver weapons and ancient coin hoard.'
      } : undefined
    };

    const updated = [...locations, newLoc];
    handleSaveLocations(updated);
    setSelectedLocation(newLoc);
    setIsPlacingPin(false);
  };

  const handleUpdateSelectedLocation = (field: keyof WorldLocation, value: any) => {
    if (!selectedLocation) return;
    const updated = locations.map(l => l.id === selectedLocation.id ? { ...l, [field]: value } : l);
    handleSaveLocations(updated);
    setSelectedLocation({ ...selectedLocation, [field]: value });
  };

  const handleUpdateDungeonDetails = (field: keyof DungeonDetails, value: any) => {
    if (!selectedLocation) return;
    const currentDetails = selectedLocation.dungeonDetails || {};
    const updatedDetails: DungeonDetails = {
      ...currentDetails,
      [field]: value
    };
    handleUpdateSelectedLocation('dungeonDetails', updatedDetails);
  };

  const handleToggleHazard = (hazard: string) => {
    if (!selectedLocation) return;
    const currentHazards = selectedLocation.dungeonDetails?.hazards || [];
    const updated = currentHazards.includes(hazard)
      ? currentHazards.filter(h => h !== hazard)
      : [...currentHazards, hazard];
    handleUpdateDungeonDetails('hazards', updated);
  };

  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter(l => l.id !== id);
    handleSaveLocations(updated);
    if (selectedLocation?.id === id) setSelectedLocation(null);
  };

  const handleAddLinkedNpc = () => {
    if (!selectedLocation || !newNpcName.trim()) return;
    const currentNpcs = selectedLocation.linkedNpcNames || [];
    if (!currentNpcs.includes(newNpcName.trim())) {
      handleUpdateSelectedLocation('linkedNpcNames', [...currentNpcs, newNpcName.trim()]);
    }
    setNewNpcName('');
  };

  const handleRemoveLinkedNpc = (npcName: string) => {
    if (!selectedLocation) return;
    const updated = (selectedLocation.linkedNpcNames || []).filter(n => n !== npcName);
    handleUpdateSelectedLocation('linkedNpcNames', updated);
  };

  const handleAddTag = () => {
    if (!selectedLocation || !newTag.trim()) return;
    const currentTags = selectedLocation.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      handleUpdateSelectedLocation('tags', [...currentTags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedLocation) return;
    const updated = (selectedLocation.tags || []).filter(t => t !== tag);
    handleUpdateSelectedLocation('tags', updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomMapUrl(dataUrl);
        setCurrentSkin('custom');
        localStorage.setItem('nexus_custom_campaign_map_url', dataUrl);
        setShowCustomUploadModal(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiLocation = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateAiLocation({
        theme: currentSkin,
        type: selectedPinType,
        dangerLevel: 'Tier 2 (CR 5-10)'
      });
      const updated = [...locations, generated];
      handleSaveLocations(updated);
      setSelectedLocation(generated);
    } catch (e) {
      console.warn('Location generation error', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredLocations = locations.filter(loc => {
    const matchSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loc.linkedNpcNames || []).some(n => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loc.controllingFactionName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || loc.type === typeFilter;
    const matchDanger = dangerFilter === 'all' || loc.dangerLevel === dangerFilter;
    return matchSearch && matchType && matchDanger;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search atlas locations, NPCs, dungeons, factions..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Marker Types</option>
            {Object.entries(LOCATION_ICONS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <select
            value={dangerFilter}
            onChange={(e) => setDangerFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none hidden sm:block"
          >
            <option value="all">All Danger Levels</option>
            <option value="Safe">Safe Haunt</option>
            <option value="Tier 1 (CR 1-4)">Tier 1 (CR 1-4)</option>
            <option value="Tier 2 (CR 5-10)">Tier 2 (CR 5-10)</option>
            <option value="Tier 3 (CR 11-16)">Tier 3 (CR 11-16)</option>
            <option value="Tier 4 (CR 17-20+)">Tier 4 (CR 17-20+)</option>
            <option value="Deadly">Deadly Peril</option>
          </select>
        </div>

        {/* Map Skin Selector & Pin Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Preset Skin */}
          <select
            value={currentSkin}
            onChange={(e) => setCurrentSkin(e.target.value as MapPresetSkin)}
            className="bg-stone-950 border border-stone-800 text-amber-300 font-mono text-xs px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
          >
            {Object.entries(MAP_PRESETS).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>

          {/* Custom Map Upload Button */}
          <button
            onClick={() => setShowCustomUploadModal(true)}
            className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Upload or generate custom campaign map background"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Map Art</span>
          </button>

          {/* Pin Type Selector to Drop */}
          <select
            value={selectedPinType}
            onChange={(e) => setSelectedPinType(e.target.value as LocationType)}
            className="bg-stone-950 border border-stone-800 text-stone-200 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            title="Choose which marker type will be dropped on next map click"
          >
            {Object.entries(LOCATION_ICONS).map(([key, cfg]) => (
              <option key={key} value={key}>Drop: {cfg.label}</option>
            ))}
          </select>

          {/* Drop Pin Mode Toggle */}
          <button
            onClick={() => setIsPlacingPin(!isPlacingPin)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isPlacingPin
                ? 'bg-amber-500 text-stone-950 animate-pulse ring-2 ring-amber-300'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title="Click anywhere on the map to place a new location pin"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isPlacingPin ? 'Click Map...' : 'Drop Pin'}</span>
          </button>

          {/* AI Landmark Generator */}
          <button
            onClick={handleGenerateAiLocation}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="AI synthesize a mysterious landmark with lore, traps, and secret DM notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>{isGenerating ? 'Synthesizing...' : 'AI Landmark'}</span>
          </button>

          {/* Fog of War */}
          <button
            onClick={() => setFogOfWarActive(!fogOfWarActive)}
            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
              fogOfWarActive
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle Fog of War (dim undiscovered pins)"
          >
            {fogOfWarActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.0, +(prev + 0.2).toFixed(1)))}
              className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, +(prev - 0.2).toFixed(1)))}
              className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas and Detail Dossier Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Interactive Map Canvas Container */}
        <div className="xl:col-span-2 relative bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl min-h-[580px] flex flex-col">
          {/* Map Surface Viewport */}
          <div
            ref={mapContainerRef}
            onClick={handleMapClick}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
            className={`relative w-full h-[580px] overflow-hidden select-none cursor-${isPlacingPin ? 'crosshair' : 'default'} ${
              MAP_PRESETS[currentSkin].bgClass
            }`}
          >
            {/* Custom Background Image if custom skin or uploaded image */}
            {customMapUrl && (currentSkin === 'custom' || currentSkin === 'sword_coast') && (
              <img
                src={customMapUrl}
                alt="Campaign World Map"
                className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
              />
            )}

            {/* Cartographic Coordinate Grid Lines */}
            {showGrid && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <defs>
                  <pattern id="carto-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke={MAP_PRESETS[currentSkin].gridColor}
                      strokeWidth="1"
                    />
                    <circle cx="60" cy="60" r="1.5" fill={MAP_PRESETS[currentSkin].gridColor} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#carto-grid)" />
              </svg>
            )}

            {/* Atmospheric Compass Rose Watermark */}
            <div className="absolute bottom-6 right-6 opacity-15 pointer-events-none text-stone-400">
              <Compass className="w-36 h-36" />
            </div>

            {/* Compass Scale & Coordinate Banner */}
            <div className="absolute top-3 left-3 bg-stone-950/85 backdrop-blur border border-stone-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-stone-300 flex items-center gap-2 pointer-events-none shadow-lg">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>1 hex = 6 miles (1/2 day forced march)</span>
              {isPlacingPin && (
                <span className="text-amber-400 font-bold ml-2 animate-pulse">
                  [Drop {LOCATION_ICONS[selectedPinType]?.label || 'Marker'}]
                </span>
              )}
            </div>

            {/* Location Pins Overlay */}
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const isUnexplored = fogOfWarActive && !loc.isDiscovered;
              const iconConfig = LOCATION_ICONS[loc.type] || LOCATION_ICONS.wilderness;
              const IconComp = iconConfig.icon;

              return (
                <div
                  key={loc.id}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocation(loc);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 group z-10 ${
                    isUnexplored ? 'opacity-30 blur-[1px]' : 'opacity-100'
                  }`}
                >
                  {/* Pin Pulse Glow when selected */}
                  {isSelected && (
                    <div className="absolute -inset-2.5 rounded-full bg-amber-500/40 animate-ping" />
                  )}

                  {/* Pin Icon Node */}
                  <div
                    className={`relative p-2 rounded-xl border shadow-xl flex items-center justify-center transition-transform transform group-hover:scale-125 ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-amber-500/50 ring-2 ring-amber-400'
                        : `${iconConfig.bg} ${iconConfig.color}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  {/* Pin Floating Title Card */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-serif whitespace-nowrap pointer-events-none shadow-xl transition-all border ${
                      isSelected
                        ? 'bg-amber-950 text-amber-200 border-amber-500/80 scale-105 opacity-100 z-20'
                        : 'bg-stone-950/90 text-stone-200 border-stone-800 opacity-85 group-hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{loc.name}</span>
                      {loc.dungeonDetails?.floors && (
                        <span className="text-[9px] font-mono text-red-400">({loc.dungeonDetails.floors}F)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canvas Bottom Status Bar */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>{filteredLocations.length}</strong> Locations Charted ({locations.filter(l => l.isDiscovered).length} Discovered)
              </span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="hover:text-stone-200 cursor-pointer"
              >
                Grid: {showGrid ? 'On' : 'Off'}
              </button>
              <span>Map: {MAP_PRESETS[currentSkin].name}</span>
            </div>
          </div>
        </div>

        {/* Location Dossier & Dungeon Details Inspector */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-4 max-h-[700px] overflow-y-auto">
          {selectedLocation ? (
            <div className="space-y-4">
              {/* Header with Title and Type Selector */}
              <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={selectedLocation.name}
                    onChange={(e) => handleUpdateSelectedLocation('name', e.target.value)}
                    className="font-serif font-bold text-base text-amber-200 bg-transparent border-b border-transparent hover:border-stone-700 focus:border-amber-500 focus:outline-none w-full"
                    placeholder="Location Name"
                  />
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <select
                      value={selectedLocation.type}
                      onChange={(e) => handleUpdateSelectedLocation('type', e.target.value as LocationType)}
                      className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-0.5 text-[11px] text-stone-300 font-mono"
                    >
                      {Object.entries(LOCATION_ICONS).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                      Coordinates: {selectedLocation.x}%, {selectedLocation.y}%
                    </span>

                    <button
                      onClick={() => handleUpdateSelectedLocation('isDiscovered', !selectedLocation.isDiscovered)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                        selectedLocation.isDiscovered
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                          : 'bg-purple-950/80 text-purple-300 border-purple-600/40'
                      }`}
                    >
                      {selectedLocation.isDiscovered ? 'Discovered' : 'Fogged / Hidden'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Danger Rating & Biome */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Danger Rating</label>
                  <select
                    value={selectedLocation.dangerLevel}
                    onChange={(e) => handleUpdateSelectedLocation('dangerLevel', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-amber-300 font-bold"
                  >
                    <option value="Safe">Safe (Civilized Haven)</option>
                    <option value="Tier 1 (CR 1-4)">Tier 1 (CR 1-4)</option>
                    <option value="Tier 2 (CR 5-10)">Tier 2 (CR 5-10)</option>
                    <option value="Tier 3 (CR 11-16)">Tier 3 (CR 11-16)</option>
                    <option value="Tier 4 (CR 17-20+)">Tier 4 (CR 17-20+)</option>
                    <option value="Deadly">Deadly / Boss Peril</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Climate & Biome</label>
                  <input
                    type="text"
                    value={selectedLocation.climate}
                    onChange={(e) => handleUpdateSelectedLocation('climate', e.target.value)}
                    placeholder="e.g. Subterranean Caverns"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                  />
                </div>
              </div>

              {/* Controlling Faction Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-stone-400">Controlling Faction / Guild</label>
                  {selectedLocation.controllingFactionName && onNavigateToFaction && (
                    <button
                      onClick={() => onNavigateToFaction(selectedLocation.controllingFactionName || '')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View in Factions</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={selectedLocation.controllingFactionName || ''}
                  onChange={(e) => handleUpdateSelectedLocation('controllingFactionName', e.target.value)}
                  placeholder="e.g. The Harpers or City Watch"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                />
              </div>

              {/* Lore Dossier & Description */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Location Dossier & Lore</label>
                <textarea
                  value={selectedLocation.description}
                  onChange={(e) => handleUpdateSelectedLocation('description', e.target.value)}
                  rows={3}
                  placeholder="Atmosphere, architecture, sights, smells, history..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Dedicated Dungeon & Megadungeon Details (Shown for Dungeons/Boss Lairs/Ruins) */}
              {(selectedLocation.type === 'dungeon' || selectedLocation.type === 'boss_lair' || selectedLocation.type === 'ruins') && (
                <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-red-300">
                    <span className="flex items-center gap-1.5">
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                      <span>Dungeon & Encounter Details</span>
                    </span>
                    <span className="text-[10px] font-mono text-red-400 uppercase">Subterranean</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Floor Count / Depth</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={selectedLocation.dungeonDetails?.floors || 1}
                        onChange={(e) => handleUpdateDungeonDetails('floors', parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-stone-950 border border-red-500/30 rounded-lg p-1 text-xs text-red-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Total Rooms</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedLocation.dungeonDetails?.roomCount || 6}
                        onChange={(e) => handleUpdateDungeonDetails('roomCount', parseInt(e.target.value, 10) || 6)}
                        className="w-full bg-stone-950 border border-red-500/30 rounded-lg p-1 text-xs text-red-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Boss / Guardian Encounter</label>
                    <input
                      type="text"
                      value={selectedLocation.dungeonDetails?.bossName || ''}
                      onChange={(e) => handleUpdateDungeonDetails('bossName', e.target.value)}
                      placeholder="e.g. Halaster the Mad Mage or Elder Shadow Dragon"
                      className="w-full bg-stone-950 border border-red-500/30 rounded-lg p-1.5 text-xs text-red-200"
                    />
                  </div>

                  {/* Dungeon Hazards & Traps Checklist */}
                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 mb-1">Active Dungeon Hazards & Traps</label>
                    <div className="grid grid-cols-1 gap-1">
                      {DUNGEON_HAZARDS.map((hazard) => {
                        const isChecked = (selectedLocation.dungeonDetails?.hazards || []).includes(hazard);
                        return (
                          <button
                            key={hazard}
                            type="button"
                            onClick={() => handleToggleHazard(hazard)}
                            className={`flex items-center gap-1.5 text-[11px] p-1 rounded text-left transition cursor-pointer ${
                              isChecked ? 'bg-red-900/60 text-red-200 font-bold' : 'text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                            )}
                            <span>{hazard}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Treasure Stash Notes */}
                  <div>
                    <label className="block text-[10px] font-mono text-stone-400 mb-0.5">Treasure Stash & Loot Rewards</label>
                    <textarea
                      value={selectedLocation.dungeonDetails?.treasureNotes || ''}
                      onChange={(e) => handleUpdateDungeonDetails('treasureNotes', e.target.value)}
                      rows={2}
                      placeholder="Ancient spellbooks, magic items, artifact components..."
                      className="w-full bg-stone-950 border border-red-500/30 rounded-lg p-1.5 text-xs text-stone-200"
                    />
                  </div>
                </div>
              )}

              {/* Linked NPCs & Key Figures */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Linked NPCs & Inhabitants</span>
                  </span>
                  {onOpenGenerators && (
                    <button
                      onClick={() => onOpenGenerators('npc')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Generate NPC</span>
                    </button>
                  )}
                </div>

                {/* NPC Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {(selectedLocation.linkedNpcNames || []).map((npc) => (
                    <span
                      key={npc}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px]"
                    >
                      <span
                        onClick={() => onOpenKnowledgeGraph?.(npc)}
                        className="cursor-pointer hover:underline"
                        title="Click to view in Campaign Knowledge Graph"
                      >
                        {npc}
                      </span>
                      <button
                        onClick={() => handleRemoveLinkedNpc(npc)}
                        className="text-stone-400 hover:text-red-400 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add NPC Input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newNpcName}
                    onChange={(e) => setNewNpcName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLinkedNpc(); } }}
                    placeholder="Add NPC name (e.g. Durnan)"
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200"
                  />
                  <button
                    onClick={handleAddLinkedNpc}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Location Tags */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Tags & Keywords</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {(selectedLocation.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] font-mono"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-stone-500 hover:text-stone-200 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag (e.g. Port, Underdark)"
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Tag
                  </button>
                </div>
              </div>

              {/* Secret DM Notes */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Secret DM Notes & Plot Twists</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber-400/80">DM Eyes Only</span>
                </div>
                <textarea
                  value={selectedLocation.secretDmNotes || ''}
                  onChange={(e) => handleUpdateSelectedLocation('secretDmNotes', e.target.value)}
                  rows={3}
                  placeholder="Hidden rooms, secret passwords, betrayal hooks, lore reveals..."
                  className="w-full bg-stone-950/80 border border-amber-500/30 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-800 flex flex-wrap gap-2">
                {onSelectLocationForTravel && (
                  <button
                    onClick={() => onSelectLocationForTravel(selectedLocation)}
                    className="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Travel Calculator</span>
                  </button>
                )}

                {onOpenKnowledgeGraph && (
                  <button
                    onClick={() => onOpenKnowledgeGraph(selectedLocation.name)}
                    className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="View connected entities in campaign knowledge graph"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Graph</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteLocation(selectedLocation.id)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs transition cursor-pointer"
                  title="Delete Location Pin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3 text-stone-400">
              <Compass className="w-12 h-12 mx-auto text-amber-500/40" />
              <div className="text-sm font-serif text-stone-300 font-bold">Select a Location or Drop a Pin</div>
              <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                Click any marker on the map to inspect its lore dossier, dungeon floors, traps, and NPC connections, or use &quot;Drop Pin&quot; to chart a new landmark.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Map Art Upload & URL Modal */}
      {showCustomUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Custom Campaign Map Art & Background</span>
              </div>
              <button
                onClick={() => setShowCustomUploadModal(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* File Upload Option */}
              <div className="bg-stone-950 border border-dashed border-stone-700 rounded-xl p-4 text-center space-y-2 hover:border-amber-500/60 transition">
                <Upload className="w-8 h-8 mx-auto text-amber-400/80" />
                <div className="font-bold text-stone-200">Upload Map File from Device</div>
                <p className="text-[11px] text-stone-500">
                  Select a PNG, JPG, or WEBP high-resolution regional or world map.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs cursor-pointer shadow"
                >
                  Choose Image File
                </button>
              </div>

              {/* Direct URL Input Option */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-stone-400 font-mono text-[10px] uppercase">Or Paste Direct Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customMapUrl}
                    onChange={(e) => setCustomMapUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (customMapUrl.trim()) {
                        setCurrentSkin('custom');
                        localStorage.setItem('nexus_custom_campaign_map_url', customMapUrl.trim());
                        setShowCustomUploadModal(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold cursor-pointer"
                  >
                    Apply URL
                  </button>
                </div>
              </div>

              {/* Clear Custom Map */}
              {customMapUrl && (
                <div className="pt-2 border-t border-stone-800 flex justify-end">
                  <button
                    onClick={() => {
                      setCustomMapUrl('');
                      setCurrentSkin('sword_coast');
                      localStorage.removeItem('nexus_custom_campaign_map_url');
                      setShowCustomUploadModal(false);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-mono cursor-pointer"
                  >
                    Clear Custom Map & Restore Preset Skins
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
