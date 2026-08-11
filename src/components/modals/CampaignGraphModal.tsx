import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Network,
  X,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  Users,
  Shield,
  Scroll,
  Skull,
  Package,
  Calendar,
  Sparkles,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Swords,
  ChevronRight,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { CampaignEntity, SAMPLE_CAMPAIGN_ENTITIES } from '../../utils/searchIndexer';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface CampaignGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string, payload?: any) => void;
  initialEntityId?: string;
  initialEntityName?: string;
}

const TYPE_COLORS: Record<string, { bg: string; stroke: string; text: string; badge: string }> = {
  monster: { bg: '#450a0a', stroke: '#ef4444', text: '#fca5a5', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  npc: { bg: '#083344', stroke: '#06b6d4', text: '#67e8f9', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  location: { bg: '#064e3b', stroke: '#10b981', text: '#6ee7b7', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  faction: { bg: '#1e1b4b', stroke: '#6366f1', text: '#a5b4fc', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  quest: { bg: '#3b0764', stroke: '#a855f7', text: '#e9d5ff', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  item: { bg: '#451a03', stroke: '#f59e0b', text: '#fde68a', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  session: { bg: '#172554', stroke: '#3b82f6', text: '#93c5fd', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  pc: { bg: '#713f12', stroke: '#eab308', text: '#fef08a', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  note: { bg: '#292524', stroke: '#a8a29e', text: '#e7e5e4', badge: 'bg-stone-500/20 text-stone-300 border-stone-500/40' },
  timeline: { bg: '#4c1d95', stroke: '#8b5cf6', text: '#ddd6fe', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40' }
};

export function CampaignGraphModal({
  isOpen,
  onClose,
  onNavigateTab,
  initialEntityId,
  initialEntityName
}: CampaignGraphModalProps) {
  const [entities, setEntities] = useState<CampaignEntity[]>(() => {
    try {
      const saved = localStorage.getItem('penpaper_campaign_graph_nodes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load campaign graph nodes from localStorage', e);
    }
    return SAMPLE_CAMPAIGN_ENTITIES;
  });

  // Save to localStorage whenever entities change
  useEffect(() => {
    try {
      localStorage.setItem('penpaper_campaign_graph_nodes', JSON.stringify(entities));
    } catch (e) {
      console.warn('Failed to save campaign graph nodes to localStorage', e);
    }
  }, [entities]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('tree');
  const [selectedEntity, setSelectedEntity] = useState<CampaignEntity | null>(entities[0] || null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Edit Node Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CampaignEntity['type']>('npc');
  const [editSummary, setEditSummary] = useState('');
  const [editRegion, setEditRegion] = useState('');

  // Auto-select entity if initialEntityId or initialEntityName is passed
  useEffect(() => {
    if (!isOpen) return;
    if (initialEntityId) {
      const match = entities.find((e) => e.id === initialEntityId);
      if (match) {
        setSelectedEntity(match);
        return;
      }
    }
    if (initialEntityName) {
      const match = entities.find((e) => e.name.toLowerCase() === initialEntityName.toLowerCase());
      if (match) {
        setSelectedEntity(match);
      }
    }
  }, [isOpen, initialEntityId, initialEntityName, entities]);

  // Graph Canvas & Simulation States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // New Node Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CampaignEntity['type']>('npc');
  const [newSummary, setNewSummary] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newConnectTarget, setNewConnectTarget] = useState('');
  const [newRelationship, setNewRelationship] = useState('Associated With');

  // Node position map
  const positionsRef = useRef<Map<string, NodePosition>>(new Map());

  // Initialize node positions in a nice circle or random layout
  useEffect(() => {
    const map = positionsRef.current;
    const width = 800;
    const height = 600;
    const radius = 220;

    entities.forEach((entity, index) => {
      if (!map.has(entity.id)) {
        const angle = (index / entities.length) * 2 * Math.PI;
        map.set(entity.id, {
          id: entity.id,
          x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
          y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          radius: 22
        });
      }
    });
  }, [entities]);

  // Canvas Force Physics Simulation Loop
  useEffect(() => {
    if (!isOpen) return;
    let animationFrameId: number;

    const runPhysicsStep = () => {
      const positions = positionsRef.current;
      const nodes = Array.from(positions.values());

      // Repulsion force between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);

          if (dist < 280) {
            const force = (280 - dist) / (dist * 12);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1.id !== draggedNodeId) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2.id !== draggedNodeId) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // Attraction force along connected edges
      entities.forEach((entity) => {
        const sourcePos = positions.get(entity.id);
        if (!sourcePos || !entity.connections) return;

        entity.connections.forEach((conn) => {
          const targetPos = positions.get(conn.targetId);
          if (!targetPos) return;

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 140;
          const force = (dist - targetDist) * 0.008;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (sourcePos.id !== draggedNodeId) {
            sourcePos.vx += fx;
            sourcePos.vy += fy;
          }
          if (targetPos.id !== draggedNodeId) {
            targetPos.vx -= fx;
            targetPos.vy -= fy;
          }
        });
      });

      // Gravity towards canvas center & position update
      nodes.forEach((n) => {
        if (n.id === draggedNodeId) return;

        const dxCenter = 400 - n.x;
        const dyCenter = 300 - n.y;
        n.vx += dxCenter * 0.0005;
        n.vy += dyCenter * 0.0005;

        // Friction damping
        n.vx *= 0.88;
        n.vy *= 0.88;

        n.x += n.vx;
        n.y += n.vy;
      });

      renderCanvas();
      animationFrameId = requestAnimationFrame(runPhysicsStep);
    };

    animationFrameId = requestAnimationFrame(runPhysicsStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, entities, zoom, pan, hoveredNodeId, selectedEntity, searchQuery, selectedCategory, draggedNodeId]);

  // Render Canvas
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-400, -300);

    const positions = positionsRef.current;

    // Filter active matching nodes
    const matchingEntityIds = new Set(
      filteredEntities.map((e) => e.id)
    );

    // 1. Draw Edge Connections
    entities.forEach((entity) => {
      const source = positions.get(entity.id);
      if (!source || !entity.connections) return;

      entity.connections.forEach((conn) => {
        const target = positions.get(conn.targetId);
        if (!target) return;

        const isSourceHovered = hoveredNodeId === source.id || selectedEntity?.id === source.id;
        const isTargetHovered = hoveredNodeId === target.id || selectedEntity?.id === target.id;
        const isConnectedHover = isSourceHovered || isTargetHovered;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (isConnectedHover) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(120, 113, 108, 0.25)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Edge Relationship Label
        if (isConnectedHover) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.fillStyle = '#fef08a';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(conn.relationship, midX, midY - 4);
        }
      });
    });

    // 2. Draw Nodes
    entities.forEach((entity) => {
      const node = positions.get(entity.id);
      if (!node) return;

      const isMatching = matchingEntityIds.has(entity.id);
      const isSelected = selectedEntity?.id === entity.id;
      const isHovered = hoveredNodeId === entity.id;
      const typeStyle = TYPE_COLORS[entity.type] || TYPE_COLORS.note;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected || isHovered ? node.radius + 4 : node.radius, 0, Math.PI * 2);

      ctx.fillStyle = typeStyle.bg;
      ctx.fill();

      ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? '#fbbf24' : isHovered ? '#60a5fa' : isMatching ? typeStyle.stroke : 'rgba(100, 100, 100, 0.4)';
      ctx.stroke();

      // Inner Icon / Initials
      ctx.fillStyle = isMatching ? typeStyle.text : '#a8a29e';
      ctx.font = 'bold 11px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entity.name.substring(0, 2).toUpperCase(), node.x, node.y);

      // Node Label Below
      ctx.fillStyle = isSelected ? '#fef08a' : isHovered ? '#ffffff' : isMatching ? '#e7e5e4' : '#78716c';
      ctx.font = isSelected || isHovered ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillText(entity.name, node.x, node.y + node.radius + 14);
    });

    ctx.restore();
  };

  // Canvas Mouse Events (Pan & Node Dragging)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse to graph coords
    const graphX = (mouseX - (canvas.width / 2 + pan.x)) / zoom + 400;
    const graphY = (mouseY - (canvas.height / 2 + pan.y)) / zoom + 300;

    // Check if clicked on a node
    const positions = positionsRef.current;
    let clickedEntity: CampaignEntity | null = null;

    entities.forEach((entity) => {
      const pos = positions.get(entity.id);
      if (pos) {
        const dx = pos.x - graphX;
        const dy = pos.y - graphY;
        if (Math.sqrt(dx * dx + dy * dy) <= pos.radius + 4) {
          clickedEntity = entity;
        }
      }
    });

    if (clickedEntity) {
      setSelectedEntity(clickedEntity);
      setDraggedNodeId((clickedEntity as CampaignEntity).id);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggedNodeId) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const graphX = (mouseX - (canvas.width / 2 + pan.x)) / zoom + 400;
      const graphY = (mouseY - (canvas.height / 2 + pan.y)) / zoom + 300;

      const pos = positionsRef.current.get(draggedNodeId);
      if (pos) {
        pos.x = graphX;
        pos.y = graphY;
        pos.vx = 0;
        pos.vy = 0;
      }
    } else if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      // Hover detection
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const graphX = (mouseX - (canvas.width / 2 + pan.x)) / zoom + 400;
      const graphY = (mouseY - (canvas.height / 2 + pan.y)) / zoom + 300;

      let hovered: string | null = null;
      positionsRef.current.forEach((pos) => {
        const dx = pos.x - graphX;
        const dy = pos.y - graphY;
        if (Math.sqrt(dx * dx + dy * dy) <= pos.radius + 4) {
          hovered = pos.id;
        }
      });
      setHoveredNodeId(hovered);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };

  // Filtered entities list
  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (selectedCategory === 'Monsters' && e.type === 'monster') ||
        (selectedCategory === 'NPCs' && e.type === 'npc') ||
        (selectedCategory === 'Locations' && e.type === 'location') ||
        (selectedCategory === 'Factions' && e.type === 'faction') ||
        (selectedCategory === 'Quests' && e.type === 'quest') ||
        (selectedCategory === 'Items' && e.type === 'item') ||
        (selectedCategory === 'Sessions' && e.type === 'session') ||
        (selectedCategory === 'Timelines' && e.type === 'timeline');

      const matchesSearch =
        !searchQuery.trim() ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [entities, selectedCategory, searchQuery]);

  // Start Editing Selected Entity
  const handleStartEditEntity = (entity: CampaignEntity) => {
    setEditName(entity.name);
    setEditType(entity.type);
    setEditSummary(entity.summary);
    setEditRegion(entity.region || '');
    setShowEditModal(true);
  };

  // Save Edits to Entity
  const handleSaveEditEntity = () => {
    if (!selectedEntity || !editName.trim()) return;

    const updatedEntity: CampaignEntity = {
      ...selectedEntity,
      name: editName.trim(),
      type: editType,
      summary: editSummary.trim(),
      region: editRegion.trim() || undefined
    };

    setEntities((prev) =>
      prev.map((e) => (e.id === selectedEntity.id ? updatedEntity : e))
    );
    setSelectedEntity(updatedEntity);
    setShowEditModal(false);
  };

  // Delete Selected Entity Node
  const handleDeleteEntity = (entityId: string) => {
    if (!window.confirm('Are you sure you want to delete this graph node?')) return;

    setEntities((prev) => {
      // Remove node itself
      const filtered = prev.filter((e) => e.id !== entityId);
      // Clean up target connections pointing to this node
      return filtered.map((e) => ({
        ...e,
        connections: e.connections?.filter((c) => c.targetId !== entityId)
      }));
    });

    if (selectedEntity?.id === entityId) {
      const remaining = entities.filter((e) => e.id !== entityId);
      setSelectedEntity(remaining[0] || null);
    }
  };

  // Reset to Default Sample Dataset
  const handleResetDefaultGraph = () => {
    if (window.confirm('Reset all graph nodes back to default sample campaign dataset? Custom additions will be overwritten.')) {
      setEntities(SAMPLE_CAMPAIGN_ENTITIES);
      setSelectedEntity(SAMPLE_CAMPAIGN_ENTITIES[0] || null);
      localStorage.removeItem('penpaper_campaign_graph_nodes');
    }
  };

  // Add Custom Entity
  const handleAddEntity = () => {
    if (!newName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newEntity: CampaignEntity = {
      id: newId,
      name: newName.trim(),
      type: newType,
      summary: newSummary.trim() || 'Custom campaign entity.',
      region: newRegion.trim() || 'Faerûn',
      connections: newConnectTarget
        ? [
            {
              targetId: newConnectTarget,
              targetName: entities.find((e) => e.id === newConnectTarget)?.name || 'Target',
              relationship: newRelationship,
              targetType: entities.find((e) => e.id === newConnectTarget)?.type || 'note'
            }
          ]
        : []
    };

    setEntities((prev) => [...prev, newEntity]);
    setSelectedEntity(newEntity);
    setShowAddModal(false);
    setNewName('');
    setNewSummary('');
    setNewRegion('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
      <div className="bg-stone-900 border border-amber-600/50 rounded-2xl w-full max-w-5xl max-h-[86vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-amber-500/20">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
                <span>Obsidian-Style RPG Campaign Graph</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full uppercase">
                  Interactive Knowledge Network
                </span>
              </h2>
              <p className="text-xs text-stone-400 hidden sm:block">
                Visual relationship network connecting monsters, NPCs, locations, factions, items, and session notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'tree' ? 'bg-amber-600 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Tree Diagram</span>
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'graph' ? 'bg-amber-600 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Force Graph</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-serif font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Node</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Header */}
        <div className="p-3 bg-stone-950/90 border-b border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph entities (e.g. dragon, phandalin)..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent pb-1 pr-4">
            {['All', 'Monsters', 'NPCs', 'Locations', 'Factions', 'Quests', 'Items', 'Sessions', 'Timelines'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-stone-950 shadow ring-1 ring-amber-400'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="w-6 shrink-0 h-1" />
          </div>
        </div>

        {/* Main Graph Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Main Viewport: Canvas vs Tree Diagram */}
          <div className="flex-1 bg-stone-950 relative overflow-hidden min-h-[360px] flex flex-col">
            {viewMode === 'tree' ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center">
                {selectedEntity ? (
                  <>
                    {/* Centered Root Entity Node */}
                    <div className="bg-stone-900 border-2 border-amber-500/80 rounded-2xl p-4 text-center max-w-md w-full shadow-2xl ring-2 ring-amber-500/20 relative animate-fadeIn">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[selectedEntity.type]?.badge || 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                          ROOT: {selectedEntity.type.toUpperCase()}
                        </span>
                        {selectedEntity.region && (
                          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {selectedEntity.region}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-serif font-bold text-amber-100">{selectedEntity.name}</h3>
                      <p className="text-stone-300 text-xs mt-1.5 leading-relaxed">{selectedEntity.summary}</p>
                    </div>

                    {/* Connecting Vertical Stem Line */}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-stone-700 shrink-0"></div>

                    {/* 7 Branching Pillar Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-5xl">
                      {[
                        { type: 'quest', title: 'Quests', icon: <Scroll className="w-4 h-4 text-purple-400" />, bg: 'border-purple-500/30' },
                        { type: 'session', title: 'Sessions', icon: <Calendar className="w-4 h-4 text-blue-400" />, bg: 'border-blue-500/30' },
                        { type: 'item', title: 'Items & Loot', icon: <Package className="w-4 h-4 text-amber-400" />, bg: 'border-amber-500/30' },
                        { type: 'faction', title: 'Factions & Guilds', icon: <Shield className="w-4 h-4 text-indigo-400" />, bg: 'border-indigo-500/30' },
                        { type: 'pc', title: 'Characters & Allies', icon: <Users className="w-4 h-4 text-yellow-400" />, bg: 'border-yellow-500/30' },
                        { type: 'location', title: 'Locations', icon: <MapPin className="w-4 h-4 text-emerald-400" />, bg: 'border-emerald-500/30' },
                        { type: 'timeline', title: 'Timelines & History', icon: <Sparkles className="w-4 h-4 text-violet-400" />, bg: 'border-violet-500/30' }
                      ].map((cat) => {
                        const items = (selectedEntity.connections || []).filter((c) => {
                          if (cat.type === 'pc') return ['pc', 'npc', 'monster', 'character'].includes(c.targetType);
                          return c.targetType === cat.type;
                        });

                        return (
                          <div key={cat.type} className={`bg-stone-900/90 border ${cat.bg} rounded-2xl p-3 flex flex-col justify-between shadow`}>
                            <div>
                              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                                <h4 className="text-xs font-serif font-bold text-amber-200 flex items-center gap-1.5">
                                  {cat.icon}
                                  <span>{cat.title}</span>
                                </h4>
                                <span className="text-[10px] font-mono text-stone-500 bg-stone-950 px-2 py-0.5 rounded-full border border-stone-800">
                                  {items.length}
                                </span>
                              </div>

                              {items.length > 0 ? (
                                <div className="space-y-1.5">
                                  {items.map((conn, idx) => {
                                    const targetEntity = entities.find((e) => e.id === conn.targetId);
                                    return (
                                      <div
                                        key={idx}
                                        onClick={() => targetEntity && setSelectedEntity(targetEntity)}
                                        className="bg-stone-950 hover:bg-stone-800 border border-stone-800/80 rounded-xl p-2 transition cursor-pointer flex items-center justify-between group"
                                      >
                                        <div>
                                          <div className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">{conn.relationship}</div>
                                          <div className="text-xs font-serif font-bold text-stone-200 group-hover:text-amber-200">
                                            {conn.targetName}
                                          </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-amber-400 transition" />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[11px] text-stone-600 italic py-2">No direct {cat.title.toLowerCase()} linked.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-stone-500 text-xs font-serif py-12">Select an entity to render its visual relationship tree.</p>
                )}
              </div>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="w-full h-full cursor-grab active:cursor-grabbing block"
                />

                {/* Canvas Zoom Floating Controls */}
                <div className="absolute bottom-4 left-4 bg-stone-900/90 border border-stone-800 rounded-2xl p-1.5 flex items-center gap-1 shadow-lg backdrop-blur">
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                    className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-300 rounded-xl transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                    className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-300 rounded-xl transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-amber-300 rounded-xl transition"
                    title="Reset View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Graph Node Legend */}
                <div className="absolute top-4 left-4 hidden lg:flex items-center gap-2 bg-stone-900/80 border border-stone-800/80 rounded-2xl p-2 text-[10px] text-stone-400 backdrop-blur">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Monster</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> NPC</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Location</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Faction</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Quest</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Item</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Timeline</span>
                </div>
              </>
            )}
          </div>

          {/* Side Entity Inspector Card Panel */}
          <div className="w-full md:w-80 bg-stone-900/95 border-t md:border-t-0 md:border-l border-stone-800 p-4 overflow-y-auto flex flex-col justify-between shrink-0">
            {selectedEntity ? (
              <div className="space-y-4">
                <div className="space-y-2 border-b border-stone-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[selectedEntity.type]?.badge || 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                      {selectedEntity.type.toUpperCase()}
                    </span>
                    {selectedEntity.region && (
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {selectedEntity.region}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-amber-200">{selectedEntity.name}</h3>
                  <p className="text-stone-300 text-xs leading-relaxed">{selectedEntity.summary}</p>
                </div>

                {/* Connections List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <Link2 className="w-3.5 h-3.5 text-amber-400" /> Connected Knowledge ({selectedEntity.connections?.length || 0})
                  </h4>

                  {selectedEntity.connections && selectedEntity.connections.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedEntity.connections.map((conn, idx) => {
                        const targetEntity = entities.find((e) => e.id === conn.targetId);
                        return (
                          <div
                            key={idx}
                            onClick={() => targetEntity && setSelectedEntity(targetEntity)}
                            className="bg-stone-950 hover:bg-stone-800/80 border border-stone-800/80 rounded-xl p-2.5 transition cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-[10px] font-mono text-amber-400">{conn.relationship}</div>
                              <div className="text-xs font-serif font-bold text-stone-200 group-hover:text-amber-200">
                                {conn.targetName}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-amber-400 transition" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-xs italic">No direct connections established yet.</p>
                  )}
                </div>

                {/* Quick Actions & Edit / Delete Controls */}
                <div className="pt-3 border-t border-stone-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStartEditEntity(selectedEntity)}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 rounded-xl text-xs font-serif font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Node</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEntity(selectedEntity.id)}
                      className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded-xl text-xs font-serif font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {selectedEntity.type === 'monster' && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('dm', selectedEntity);
                      }}
                      className="w-full px-3 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 rounded-xl text-xs font-serif font-bold transition flex items-center justify-center gap-2"
                    >
                      <Skull className="w-4 h-4 text-red-400" />
                      <span>Inspect Monster in DM Encounter</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) onNavigateTab('notes', selectedEntity);
                    }}
                    className="w-full px-3 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-serif transition flex items-center justify-center gap-2"
                  >
                    <Scroll className="w-4 h-4 text-stone-400" />
                    <span>View Campaign Notes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-500 space-y-2">
                <Network className="w-10 h-10 text-stone-600 mx-auto" />
                <p className="text-xs font-serif">Click any node on the graph to inspect entity relations.</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between font-mono">
              <span>{entities.length} Campaign Nodes</span>
              <button
                onClick={handleResetDefaultGraph}
                className="text-stone-500 hover:text-amber-400 transition flex items-center gap-1"
                title="Reset graph nodes to default dataset"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Entity Modal */}
      {showEditModal && selectedEntity && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-serif font-bold text-amber-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Campaign Graph Node</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-stone-400 hover:text-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1 font-serif">Entity Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1 font-serif">Entity Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="npc">NPC</option>
                    <option value="monster">Monster</option>
                    <option value="location">Location</option>
                    <option value="faction">Faction</option>
                    <option value="quest">Quest</option>
                    <option value="item">Item</option>
                    <option value="session">Session</option>
                    <option value="timeline">Timeline</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1 font-serif">Region / Status</label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    placeholder="e.g. Sword Coast"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-serif">Summary Description</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-serif"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditEntity}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold rounded-xl text-xs shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-600/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-serif font-bold text-amber-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Custom Graph Node</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1 font-serif">Entity Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dragon Slayer Keep, Guildmaster Vane..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1 font-serif">Entity Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="npc">NPC</option>
                    <option value="monster">Monster</option>
                    <option value="location">Location</option>
                    <option value="faction">Faction</option>
                    <option value="quest">Quest</option>
                    <option value="item">Item</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1 font-serif">Region / Status</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="e.g. Sword Coast"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-serif">Summary Description</label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief details about this entity..."
                  rows={2}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1 font-serif">Connect To Existing Node</label>
                <select
                  value={newConnectTarget}
                  onChange={(e) => setNewConnectTarget(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">None (Standalone Node)</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              {newConnectTarget && (
                <div>
                  <label className="text-stone-400 block mb-1 font-serif">Relationship Label</label>
                  <input
                    type="text"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    placeholder="e.g. Allied with, Guarded by, Located at"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-serif"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntity}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold rounded-xl text-xs shadow"
              >
                Create Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
