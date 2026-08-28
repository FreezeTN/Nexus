import React, { useState, useRef, useEffect } from 'react';
import { CharacterData, Party } from '../../types';
import { OFFICIAL_BULK_MONSTERS } from '../../data/srdRulesLibrary';
import {
  playDiceSound,
  playHitSound,
  playSpellCastSound,
  playFireSound,
  playInitiativeTurnSound
} from '../../utils/soundEffects';
import {
  MapPin,
  Move,
  Ruler,
  Flame,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Shield,
  Heart,
  Grid,
  Layers,
  Upload,
  UserPlus,
  Crosshair,
  Compass,
  Zap,
  Volume2
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface MapToken {
  id: string;
  name: string;
  x: number; // grid coordinates (in px)
  y: number;
  size: number; // grid cells: 1 (Med), 2 (Lg), 3 (Huge), 4 (Garg)
  hpCurrent: number;
  hpMax: number;
  ac: number;
  speed: number;
  elevation: number; // in feet (e.g. +20 ft Flying)
  color: string;
  imageUrl?: string;
  isMonster?: boolean;
  conditions?: string[];
}

interface AoETemplate {
  id: string;
  type: 'sphere' | 'cone' | 'line' | 'cube';
  x: number;
  y: number;
  radiusFeet: number;
  angleDeg: number;
  color: string;
  name: string;
}

interface BattlemapSandboxProps {
  activeCharacter: CharacterData;
  partyMembers?: CharacterData[];
  onRoll?: (label: string, diceSides: number, count?: number, modifier?: number, mode?: 'normal' | 'advantage' | 'disadvantage') => void;
}

const PRESET_MAPS = [
  {
    id: 'dungeon_crypt',
    name: 'Dungeon Crypt & Tombs',
    bgGradient: 'from-stone-950 via-zinc-900 to-stone-900',
    gridColor: 'rgba(120, 113, 108, 0.25)',
    ambientLight: 'rgba(234, 88, 12, 0.15)'
  },
  {
    id: 'tavern_brawl',
    name: 'Tavern Floor & Hearth',
    bgGradient: 'from-amber-950/80 via-stone-900 to-yellow-950/60',
    gridColor: 'rgba(217, 119, 6, 0.2)',
    ambientLight: 'rgba(245, 158, 11, 0.2)'
  },
  {
    id: 'forest_clearing',
    name: 'Forest Ambush Clearing',
    bgGradient: 'from-emerald-950/80 via-stone-900 to-teal-950/70',
    gridColor: 'rgba(16, 185, 129, 0.2)',
    ambientLight: 'rgba(52, 211, 153, 0.15)'
  },
  {
    id: 'cavern_depths',
    name: 'Cavern Lava Depths',
    bgGradient: 'from-red-950/90 via-stone-950 to-orange-950/80',
    gridColor: 'rgba(239, 68, 68, 0.25)',
    ambientLight: 'rgba(249, 115, 22, 0.25)'
  },
  {
    id: 'throne_room',
    name: 'Royal Throne Room',
    bgGradient: 'from-purple-950/90 via-stone-900 to-indigo-950/80',
    gridColor: 'rgba(168, 85, 247, 0.25)',
    ambientLight: 'rgba(192, 132, 252, 0.2)'
  }
];

export const BattlemapSandbox: React.FC<BattlemapSandboxProps> = ({
  activeCharacter,
  partyMembers = [],
  onRoll
}) => {
  const { t } = useLanguage();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Viewport & Grid settings
  const [cellSize, setCellSize] = useState<number>(50); // 50px = 5ft
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectedMapPreset, setSelectedMapPreset] = useState(PRESET_MAPS[0]);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Tool Selection: 'select' | 'pan' | 'measure' | 'aoe' | 'fog_reveal' | 'fog_hide'
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'measure' | 'aoe' | 'fog_reveal' | 'fog_hide'>('select');
  const [selectedAoESpell, setSelectedAoESpell] = useState<'fireball' | 'cone' | 'lightning' | 'thunderwave'>('fireball');

  // Tokens on map
  const [tokens, setTokens] = useState<MapToken[]>(() => {
    return [
      {
        id: `pc-${activeCharacter.id}`,
        name: activeCharacter.name,
        x: 250,
        y: 250,
        size: 1,
        hpCurrent: activeCharacter.hpCurrent,
        hpMax: activeCharacter.hpMax,
        ac: activeCharacter.armorClass,
        speed: activeCharacter.speed || 30,
        elevation: 0,
        color: '#f59e0b',
        imageUrl: activeCharacter.portraitUrl
      },
      {
        id: 'monster-goblin-1',
        name: 'Goblin Scout',
        x: 450,
        y: 200,
        size: 1,
        hpCurrent: 7,
        hpMax: 7,
        ac: 15,
        speed: 30,
        elevation: 0,
        color: '#ef4444',
        isMonster: true
      },
      {
        id: 'monster-orc-1',
        name: 'Orc Berserker',
        x: 500,
        y: 350,
        size: 1,
        hpCurrent: 15,
        hpMax: 15,
        ac: 13,
        speed: 30,
        elevation: 0,
        color: '#dc2626',
        isMonster: true
      }
    ];
  });

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(`pc-${activeCharacter.id}`);
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentDragPos, setCurrentDragPos] = useState<{ x: number; y: number } | null>(null);

  // Active AoE Templates on Map
  const [aoeTemplates, setAoeTemplates] = useState<AoETemplate[]>([]);
  const [previewAoePos, setPreviewAoePos] = useState<{ x: number; y: number } | null>(null);

  // Monster quick spawner filter
  const [monsterSearch, setMonsterSearch] = useState('');
  const [showSpawner, setShowSpawner] = useState(false);

  // Calculate distance traveled during drag
  const selectedToken = tokens.find(t => t.id === selectedTokenId);
  const moveDistanceFeet = dragStartPos && currentDragPos
    ? Math.round(Math.hypot(currentDragPos.x - dragStartPos.x, currentDragPos.y - dragStartPos.y) / cellSize) * 5
    : 0;

  // Handle Token Dragging
  const handleTokenMouseDown = (e: React.MouseEvent, token: MapToken) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedTokenId(token.id);
    setDraggingTokenId(token.id);
    setDragStartPos({ x: token.x, y: token.y });
    setCurrentDragPos({ x: token.x, y: token.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - panX) / zoom;
    const mouseY = (e.clientY - rect.top - panY) / zoom;

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (draggingTokenId) {
      const snappedX = snapToGrid ? Math.round(mouseX / cellSize) * cellSize : mouseX;
      const snappedY = snapToGrid ? Math.round(mouseY / cellSize) * cellSize : mouseY;
      setCurrentDragPos({ x: snappedX, y: snappedY });
    }

    if (activeTool === 'aoe') {
      setPreviewAoePos({ x: mouseX, y: mouseY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingTokenId && currentDragPos) {
      setTokens(prev => prev.map(t => {
        if (t.id === draggingTokenId) {
          return { ...t, x: currentDragPos.x, y: currentDragPos.y };
        }
        return t;
      }));
      playHitSound();
    }
    setDraggingTokenId(null);
    setDragStartPos(null);
    setCurrentDragPos(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    if (activeTool === 'aoe' && previewAoePos) {
      playFireSound();
      const newTemplate: AoETemplate = {
        id: `aoe-${Date.now()}`,
        type: selectedAoESpell === 'fireball' ? 'sphere' : (selectedAoESpell === 'cone' ? 'cone' : (selectedAoESpell === 'lightning' ? 'line' : 'cube')),
        x: previewAoePos.x,
        y: previewAoePos.y,
        radiusFeet: selectedAoESpell === 'fireball' ? 20 : (selectedAoESpell === 'cone' ? 15 : (selectedAoESpell === 'lightning' ? 100 : 15)),
        angleDeg: 0,
        color: selectedAoESpell === 'fireball' ? 'rgba(239, 68, 68, 0.4)' : (selectedAoESpell === 'cone' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(59, 130, 246, 0.4)'),
        name: selectedAoESpell === 'fireball' ? 'Fireball (20ft Sphere)' : (selectedAoESpell === 'cone' ? 'Burning Hands (15ft Cone)' : 'Lightning Bolt (100ft Line)')
      };
      setAoeTemplates(prev => [...prev, newTemplate]);
      setActiveTool('select');
    }
  };

  // Spawn SRD Monster
  const handleSpawnMonster = (monster: any) => {
    const hp = typeof monster.hp === 'number' ? monster.hp : parseInt(monster.hp || '10', 10);
    const ac = typeof monster.ac === 'number' ? monster.ac : parseInt(monster.ac || '10', 10);
    const size = (monster.size || '').toLowerCase().includes('large') ? 2 : ((monster.size || '').toLowerCase().includes('huge') ? 3 : 1);

    const newToken: MapToken = {
      id: `monster-${monster.id || monster.name}-${Date.now()}`,
      name: monster.name,
      x: 350 + Math.random() * 100,
      y: 250 + Math.random() * 100,
      size,
      hpCurrent: hp,
      hpMax: hp,
      ac,
      speed: 30,
      elevation: 0,
      color: '#ef4444',
      isMonster: true
    };

    setTokens(prev => [...prev, newToken]);
    setShowSpawner(false);
    playHitSound();
  };

  // Check if token is caught inside any AoE template
  const isTokenInAoE = (token: MapToken) => {
    return aoeTemplates.some(template => {
      const distPx = Math.hypot(token.x - template.x, token.y - template.y);
      const radiusPx = (template.radiusFeet / 5) * cellSize;
      return distPx <= radiusPx;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl relative select-none">
      {/* Top Toolbar */}
      <div className="bg-stone-900/90 border-b border-stone-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        {/* Left: Map Selector & Grid Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMapPreset.id}
            onChange={(e) => setSelectedMapPreset(PRESET_MAPS.find(m => m.id === e.target.value) || PRESET_MAPS[0])}
            className="bg-stone-950 border border-stone-700 text-amber-200 font-bold px-2.5 py-1 rounded-xl text-xs"
          >
            {PRESET_MAPS.map(m => (
              <option key={m.id} value={m.id}>🗺️ {m.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-xl border transition ${showGrid ? 'bg-amber-950/70 border-amber-500 text-amber-300' : 'bg-stone-950 border-stone-800 text-stone-500'}`}
            title="Toggle 5ft Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-1 rounded-xl border text-[11px] font-mono transition ${snapToGrid ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300' : 'bg-stone-950 border-stone-800 text-stone-500'}`}
            title="Snap Token Movement to Grid"
          >
            Snap: {snapToGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Center: Tactical Tools (Select, Pan, Measure, AoE Spell Templates) */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setActiveTool('select')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeTool === 'select' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}
            title="Select & Move Tokens"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          <button
            onClick={() => setActiveTool('pan')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeTool === 'pan' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'}`}
            title="Pan Viewport"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pan</span>
          </button>

          <button
            onClick={() => {
              setActiveTool('aoe');
              setSelectedAoESpell('fireball');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeTool === 'aoe' ? 'bg-rose-600 text-stone-100' : 'text-stone-400 hover:text-stone-200'}`}
            title="Spell AoE Template (Fireball 20ft, Cone 15ft, Line 100ft)"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>AoE Spell</span>
          </button>

          <button
            onClick={() => setShowSpawner(true)}
            className="px-2.5 py-1 rounded-lg font-bold bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-300 flex items-center gap-1 transition"
            title="Spawn SRD Monster Token"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Monster</span>
          </button>
        </div>

        {/* Right: Zoom & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(Math.max(0.4, zoom - 0.15))}
            className="p-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-stone-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
            className="p-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPanX(0);
              setPanY(0);
            }}
            className="p-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 hover:text-amber-300 ml-1"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className={`flex-1 relative overflow-hidden bg-gradient-to-br ${selectedMapPreset.bgGradient} ${activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
        style={{
          backgroundImage: customBgImage ? `url(${customBgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Transformable Scene Layer */}
        <div
          className="absolute inset-0 transition-transform duration-75 origin-top-left"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            width: '3000px',
            height: '2000px'
          }}
        >
          {/* 5ft Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, ${selectedMapPreset.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${selectedMapPreset.gridColor} 1px, transparent 1px)`,
                backgroundSize: `${cellSize}px ${cellSize}px`
              }}
            />
          )}

          {/* Active AoE Templates */}
          {aoeTemplates.map((template) => {
            const radiusPx = (template.radiusFeet / 5) * cellSize;
            return (
              <div
                key={template.id}
                className="absolute rounded-full border-2 border-dashed border-rose-400 pointer-events-none animate-pulse flex items-center justify-center"
                style={{
                  left: template.x - radiusPx,
                  top: template.y - radiusPx,
                  width: radiusPx * 2,
                  height: radiusPx * 2,
                  backgroundColor: template.color
                }}
              >
                <span className="text-[10px] font-mono font-bold text-rose-200 bg-black/70 px-2 py-0.5 rounded-full">
                  {template.name}
                </span>
              </div>
            );
          })}

          {/* AoE Preview while placing */}
          {activeTool === 'aoe' && previewAoePos && (
            <div
              className="absolute rounded-full border-2 border-rose-500 bg-rose-600/30 pointer-events-none"
              style={{
                left: previewAoePos.x - 4 * cellSize,
                top: previewAoePos.y - 4 * cellSize,
                width: 8 * cellSize,
                height: 8 * cellSize
              }}
            />
          )}

          {/* Tactical Drag Measurement Line (Ruler) */}
          {draggingTokenId && dragStartPos && currentDragPos && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-30">
              <line
                x1={dragStartPos.x + cellSize / 2}
                y1={dragStartPos.y + cellSize / 2}
                x2={currentDragPos.x + cellSize / 2}
                y2={currentDragPos.y + cellSize / 2}
                stroke={moveDistanceFeet <= (selectedToken?.speed || 30) ? '#10b981' : (moveDistanceFeet <= (selectedToken?.speed || 30) * 2 ? '#f59e0b' : '#ef4444')}
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <circle
                cx={currentDragPos.x + cellSize / 2}
                cy={currentDragPos.y + cellSize / 2}
                r="6"
                fill="#f59e0b"
              />
            </svg>
          )}

          {/* Map Tokens */}
          {tokens.map((token) => {
            const isSelected = selectedTokenId === token.id;
            const isDragging = draggingTokenId === token.id;
            const posX = isDragging && currentDragPos ? currentDragPos.x : token.x;
            const posY = isDragging && currentDragPos ? currentDragPos.y : token.y;
            const inAoE = isTokenInAoE(token);
            const tokenSizePx = token.size * cellSize;

            const hpPercent = Math.max(0, Math.min(100, Math.round((token.hpCurrent / token.hpMax) * 100)));
            const hpColor = hpPercent > 50 ? 'bg-emerald-500' : (hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600');

            return (
              <div
                key={token.id}
                onMouseDown={(e) => handleTokenMouseDown(e, token)}
                className={`absolute z-20 transition-shadow flex flex-col items-center justify-center cursor-pointer ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 scale-105' : ''
                } ${inAoE ? 'animate-bounce' : ''}`}
                style={{
                  left: posX,
                  top: posY,
                  width: tokenSizePx,
                  height: tokenSizePx
                }}
              >
                {/* Health Bar above token */}
                <div className="w-full h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden mb-0.5">
                  <div className={`h-full ${hpColor}`} style={{ width: `${hpPercent}%` }} />
                </div>

                {/* Token Circular Avatar */}
                <div
                  className="w-full h-full rounded-full border-2 flex items-center justify-center shadow-lg overflow-hidden relative"
                  style={{
                    backgroundColor: token.color,
                    borderColor: inAoE ? '#ef4444' : (token.isMonster ? '#dc2626' : '#f59e0b')
                  }}
                >
                  {token.imageUrl ? (
                    <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-extrabold text-stone-950 text-xs truncate px-1">
                      {token.name.substring(0, 3).toUpperCase()}
                    </span>
                  )}

                  {/* Armor Class Badge on bottom-right of token */}
                  <div className="absolute bottom-0 right-0 bg-stone-950 text-amber-300 font-mono text-[9px] font-bold px-1 rounded-tl border-t border-l border-stone-700">
                    {token.ac}
                  </div>
                </div>

                {/* Token Name Label below */}
                <span className="text-[10px] font-mono font-bold text-amber-200 bg-black/80 px-1.5 py-0.2 rounded mt-0.5 truncate max-w-[120px]">
                  {token.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tactical HUD Overlay (Selected Token Stats & Movement Ruler) */}
        {selectedToken && (
          <div className="absolute bottom-3 left-3 z-30 bg-stone-950/95 border border-amber-500/50 rounded-xl p-3 shadow-2xl flex items-center gap-4 text-xs font-mono text-stone-300">
            <div>
              <div className="font-bold text-amber-300 text-sm font-serif">{selectedToken.name}</div>
              <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                <span>HP: <strong className="text-emerald-400">{selectedToken.hpCurrent}/{selectedToken.hpMax}</strong></span>
                <span>AC: <strong className="text-amber-200">{selectedToken.ac}</strong></span>
                <span>Speed: <strong className="text-cyan-300">{selectedToken.speed} ft</strong></span>
              </div>
            </div>

            {draggingTokenId && (
              <div className="border-l border-stone-800 pl-3">
                <div className="text-[10px] text-stone-400">Movement Path:</div>
                <div className={`text-base font-bold ${moveDistanceFeet <= selectedToken.speed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {moveDistanceFeet} ft / {selectedToken.speed} ft
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setTokens(prev => prev.filter(t => t.id !== selectedToken.id));
                setSelectedTokenId(null);
              }}
              className="text-stone-500 hover:text-rose-400 p-1"
              title="Delete Token"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Monster Spawner Drawer Modal */}
      {showSpawner && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-purple-500 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="font-serif font-bold text-base text-purple-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                Spawn SRD Monster Token
              </span>
              <button onClick={() => setShowSpawner(false)} className="text-stone-400 hover:text-stone-200">
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search monsters (e.g. Goblin, Orc, Dragon, Skeleton)..."
              value={monsterSearch}
              onChange={(e) => setMonsterSearch(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-200 w-full"
            />

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {OFFICIAL_BULK_MONSTERS.filter(m => m.name.toLowerCase().includes(monsterSearch.toLowerCase())).slice(0, 20).map(m => (
                <div
                  key={m.id || m.name}
                  onClick={() => handleSpawnMonster(m)}
                  className="bg-stone-900/60 hover:bg-stone-800 border border-stone-800 rounded-xl p-2 flex items-center justify-between cursor-pointer transition text-xs"
                >
                  <div>
                    <span className="font-bold text-amber-200">{m.name}</span>
                    <span className="text-[10px] text-stone-400 ml-2 font-mono">
                      CR {(m as any).challengeRating || (m as any).cr || '1/2'} | HP {m.hpMax || (m as any).hp || 10} | AC {m.armorClass || (m as any).ac || 10}
                    </span>
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-500 text-stone-950 font-bold px-2 py-0.5 rounded text-[11px]">
                    Spawn
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
