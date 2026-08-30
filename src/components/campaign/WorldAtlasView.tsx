import React, { useState, useRef } from 'react';
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
  X
} from 'lucide-react';
import {
  WorldLocation,
  LocationType,
  MapPresetSkin
} from '../../types/campaign';
import {
  loadCampaignLocations,
  saveCampaignLocations,
  generateAiLocation
} from '../../services/campaignService';

interface WorldAtlasViewProps {
  onSelectLocationForTravel?: (location: WorldLocation) => void;
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

const LOCATION_ICONS: Record<LocationType, { icon: any; color: string; bg: string }> = {
  city: { icon: Castle, color: 'text-amber-300', bg: 'bg-amber-950/80 border-amber-500/50' },
  castle: { icon: Shield, color: 'text-blue-300', bg: 'bg-blue-950/80 border-blue-500/50' },
  dungeon: { icon: Skull, color: 'text-red-400', bg: 'bg-red-950/80 border-red-500/50' },
  tavern: { icon: Tent, color: 'text-emerald-300', bg: 'bg-emerald-950/80 border-emerald-500/50' },
  wilderness: { icon: Compass, color: 'text-green-400', bg: 'bg-green-950/80 border-green-500/50' },
  shrine: { icon: Sparkles, color: 'text-purple-300', bg: 'bg-purple-950/80 border-purple-500/50' },
  ruins: { icon: Layers, color: 'text-stone-300', bg: 'bg-stone-900/90 border-stone-600/50' },
  anomaly: { icon: Radio, color: 'text-cyan-300', bg: 'bg-cyan-950/80 border-cyan-500/50' },
  port: { icon: Navigation, color: 'text-sky-300', bg: 'bg-sky-950/80 border-sky-500/50' }
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
    name: 'Custom Map Image / URL',
    bgClass: 'bg-stone-950',
    gridColor: 'rgba(255, 255, 255, 0.1)'
  }
};

export const WorldAtlasView: React.FC<WorldAtlasViewProps> = ({
  onSelectLocationForTravel,
  onOpenKnowledgeGraph,
  onOpenGenerators
}) => {
  const [locations, setLocations] = useState<WorldLocation[]>(() => loadCampaignLocations());
  const [selectedLocation, setSelectedLocation] = useState<WorldLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentSkin, setCurrentSkin] = useState<MapPresetSkin>('sword_coast');
  const [customMapUrl, setCustomMapUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fogOfWarActive, setFogOfWarActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveLocations = (newLocs: WorldLocation[]) => {
    setLocations(newLocs);
    saveCampaignLocations(newLocs);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingPin || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newLoc: WorldLocation = {
      id: `loc-custom-${Date.now()}`,
      name: 'Uncharted Landmark',
      type: 'wilderness',
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      dangerLevel: 'Tier 1 (CR 1-4)',
      climate: 'Temperate Frontier',
      description: 'A newly charted region in the campaign atlas awaiting exploration.',
      linkedNpcNames: [],
      shopsAndServices: [],
      isDiscovered: true,
      tags: ['Exploration', 'Uncharted']
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

  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter(l => l.id !== id);
    handleSaveLocations(updated);
    if (selectedLocation?.id === id) setSelectedLocation(null);
  };

  const handleGenerateAiLocation = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateAiLocation({
        theme: currentSkin,
        type: 'ruins',
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
      loc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = typeFilter === 'all' || loc.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filter */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search atlas locations, tags, factions..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Pin Types</option>
            <option value="city">Cities & Metropolises</option>
            <option value="castle">Castles & Citadels</option>
            <option value="dungeon">Dungeons & Lairs</option>
            <option value="tavern">Taverns & Hubs</option>
            <option value="wilderness">Wilderness & Groves</option>
            <option value="shrine">Shrines & Temples</option>
            <option value="ruins">Ruins & Catacombs</option>
            <option value="anomaly">Mystic Anomalies</option>
            <option value="port">Ports & Harbors</option>
          </select>
        </div>

        {/* Map Skin Selector & Add Pin Actions */}
        <div className="flex items-center gap-2">
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

          {/* Place Pin Toggle */}
          <button
            onClick={() => setIsPlacingPin(!isPlacingPin)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isPlacingPin
                ? 'bg-amber-500 text-stone-950 animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
            title="Click anywhere on the map to place a new location pin"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isPlacingPin ? 'Click Map to Place' : 'Drop Pin'}</span>
          </button>

          {/* Generate AI Location */}
          <button
            onClick={handleGenerateAiLocation}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="AI synthesize a mysterious landmark with lore and secret DM notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>{isGenerating ? 'Generating...' : 'AI Landmark'}</span>
          </button>

          {/* Fog of War Toggle */}
          <button
            onClick={() => setFogOfWarActive(!fogOfWarActive)}
            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
              fogOfWarActive
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title="Toggle Fog of War (dim uncharted locations)"
          >
            {fogOfWarActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.8, +(prev + 0.2).toFixed(1)))}
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
              onClick={() => setZoomLevel(prev => Math.max(0.8, +(prev - 0.2).toFixed(1)))}
              className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas and Detail Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Interactive Map Canvas */}
        <div className="xl:col-span-2 relative bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl min-h-[560px] flex flex-col">
          {/* Map Surface */}
          <div
            ref={mapContainerRef}
            onClick={handleMapClick}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
            className={`relative w-full h-[560px] overflow-hidden select-none cursor-${isPlacingPin ? 'crosshair' : 'default'} ${
              MAP_PRESETS[currentSkin].bgClass
            }`}
          >
            {/* Custom Background Image if active */}
            {currentSkin === 'custom' && customMapUrl && (
              <img
                src={customMapUrl}
                alt="Campaign World Map"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            )}

            {/* Cartographic Coordinate Grid Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
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

            {/* Atmospheric Compass Rose Watermark */}
            <div className="absolute bottom-6 right-6 opacity-20 pointer-events-none text-stone-400">
              <Compass className="w-32 h-32 animate-spin-slow" />
            </div>

            {/* Compass Scale Banner */}
            <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur border border-stone-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-stone-400 flex items-center gap-2 pointer-events-none shadow-md">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Scale: 1 hex = 6 miles (1/2 day normal march)</span>
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
                    <div className="absolute -inset-2 rounded-full bg-amber-500/30 animate-ping" />
                  )}

                  {/* Pin Node */}
                  <div
                    className={`relative p-2 rounded-xl border shadow-lg flex items-center justify-center transition-transform transform group-hover:scale-125 ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-amber-500/40'
                        : `${iconConfig.bg} ${iconConfig.color}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  {/* Pin Floating Label */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-serif whitespace-nowrap pointer-events-none shadow-md transition-opacity border ${
                      isSelected
                        ? 'bg-amber-950 text-amber-200 border-amber-500/60 opacity-100'
                        : 'bg-stone-950/90 text-stone-200 border-stone-800 opacity-90 group-hover:opacity-100'
                    }`}
                  >
                    {loc.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canvas Bottom Status Bar */}
          <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{filteredLocations.length} Charted Locations ({locations.filter(l => l.isDiscovered).length} Discovered)</span>
            </span>
            <span className="font-mono text-[10px] text-stone-500">
              Skin: {MAP_PRESETS[currentSkin].name}
            </span>
          </div>
        </div>

        {/* Selected Location Dossier / Editor Drawer */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-4">
          {selectedLocation ? (
            <div className="space-y-4">
              {/* Header with Title and Type */}
              <div className="flex items-start justify-between pb-3 border-b border-stone-800">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={selectedLocation.name}
                    onChange={(e) => handleUpdateSelectedLocation('name', e.target.value)}
                    className="font-serif font-bold text-base text-amber-200 bg-transparent border-b border-transparent hover:border-stone-700 focus:border-amber-500 focus:outline-none w-full"
                    placeholder="Location Name"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={selectedLocation.type}
                      onChange={(e) => handleUpdateSelectedLocation('type', e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-0.5 text-[11px] text-stone-300 font-mono"
                    >
                      <option value="city">City / Metropolis</option>
                      <option value="castle">Castle / Citadel</option>
                      <option value="dungeon">Dungeon / Megadungeon</option>
                      <option value="tavern">Tavern / Taproom</option>
                      <option value="wilderness">Wilderness / Forest</option>
                      <option value="shrine">Shrine / Temple</option>
                      <option value="ruins">Ancient Ruins</option>
                      <option value="anomaly">Mystic Anomaly</option>
                      <option value="port">Port / Anchorage</option>
                    </select>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                      {selectedLocation.x}%, {selectedLocation.y}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Danger Rating & Climate */}
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
                    <option value="Deadly">Deadly / Extreme Peril</option>
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

              {/* Controlling Faction */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Controlling Faction / Lord</label>
                <input
                  type="text"
                  value={selectedLocation.controllingFactionName || ''}
                  onChange={(e) => handleUpdateSelectedLocation('controllingFactionName', e.target.value)}
                  placeholder="e.g. The Harpers or City Watch"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                />
              </div>

              {/* Description Lore Dossier */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 mb-1">Location Dossier & Lore</label>
                <textarea
                  value={selectedLocation.description}
                  onChange={(e) => handleUpdateSelectedLocation('description', e.target.value)}
                  rows={4}
                  placeholder="Atmosphere, architecture, sights, smells, history..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Secret DM Notes */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Secret DM Notes & Encounters</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase text-amber-400/70">DM Only</span>
                </div>
                <textarea
                  value={selectedLocation.secretDmNotes || ''}
                  onChange={(e) => handleUpdateSelectedLocation('secretDmNotes', e.target.value)}
                  rows={3}
                  placeholder="Hidden traps, secret doors, boss tactics, plot twists..."
                  className="w-full bg-stone-950/80 border border-amber-500/30 rounded-lg p-2 text-xs text-amber-100 focus:outline-none"
                />
              </div>

              {/* Fast Action Buttons */}
              <div className="pt-2 border-t border-stone-800 flex flex-wrap gap-2">
                {/* Fast Travel Calculator trigger */}
                {onSelectLocationForTravel && (
                  <button
                    onClick={() => onSelectLocationForTravel(selectedLocation)}
                    className="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Travel Calculator</span>
                  </button>
                )}

                {/* Knowledge Graph sync */}
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

                {/* Delete Location */}
                <button
                  onClick={() => handleDeleteLocation(selectedLocation.id)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs transition cursor-pointer"
                  title="Delete Location"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 text-stone-400">
              <Compass className="w-10 h-10 mx-auto text-amber-500/40" />
              <div className="text-xs font-serif text-stone-300 font-bold">Select a Location or Drop a Pin</div>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                Click any marker on the map to inspect its lore dossier, secret DM traps, and travel pacing, or click &quot;Drop Pin&quot; to chart a new landmark.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
