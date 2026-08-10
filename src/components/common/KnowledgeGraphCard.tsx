import React, { useState } from 'react';
import { 
  Network, 
  MapPin, 
  Users, 
  Swords, 
  Scroll, 
  FileText, 
  Calendar, 
  ExternalLink, 
  Sparkles,
  Shield,
  Tag,
  Link2
} from 'lucide-react';

export interface KnowledgeEntity {
  id: string;
  name: string;
  type: 'npc' | 'location' | 'quest' | 'faction' | 'item' | 'session' | 'note';
  summary?: string;
  appearsInSessions?: Array<{ id: string; title: string }>;
  memberOfFactions?: Array<{ id: string; name: string }>;
  locatedAt?: Array<{ id: string; name: string }>;
  allies?: Array<{ id: string; name: string }>;
  enemies?: Array<{ id: string; name: string }>;
  connectedQuests?: Array<{ id: string; title: string }>;
  mentionedInNotes?: Array<{ id: string; title: string }>;
}

interface KnowledgeGraphCardProps {
  entity: KnowledgeEntity;
  onNavigateEntity?: (entity: KnowledgeEntity) => void;
  compact?: boolean;
}

export function KnowledgeGraphCard({ entity, onNavigateEntity, compact = false }: KnowledgeGraphCardProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const totalConnections = (entity.appearsInSessions?.length || 0) +
    (entity.memberOfFactions?.length || 0) +
    (entity.locatedAt?.length || 0) +
    (entity.allies?.length || 0) +
    (entity.enemies?.length || 0) +
    (entity.connectedQuests?.length || 0) +
    (entity.mentionedInNotes?.length || 0);

  return (
    <div className={`bg-stone-950 border border-stone-800 rounded-2xl ${compact ? 'p-3' : 'p-4'} shadow-xl space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-stone-200 flex items-center gap-2">
              <span>{entity.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 text-stone-400 border border-stone-800 uppercase">
                {entity.type}
              </span>
            </h4>
            <p className="text-[10px] text-stone-400">Interconnected Knowledge Graph ({totalConnections} Links)</p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-800/40">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Linked Entity
        </span>
      </div>

      {/* Visual Connection Nodes Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Appears In Sessions */}
        {entity.appearsInSessions && entity.appearsInSessions.length > 0 && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1 uppercase">
              <Calendar className="w-3 h-3 text-amber-400" /> Appears In
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.appearsInSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigateEntity && onNavigateEntity({ id: s.id, name: s.title, type: 'session' })}
                  className="px-2 py-0.5 rounded-md bg-amber-950/50 hover:bg-amber-900 text-amber-300 border border-amber-800/40 text-[11px] transition flex items-center gap-1"
                >
                  <Link2 className="w-2.5 h-2.5" />
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member Of Factions */}
        {entity.memberOfFactions && entity.memberOfFactions.length > 0 && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-indigo-400 flex items-center gap-1 uppercase">
              <Shield className="w-3 h-3 text-indigo-400" /> Member Of
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.memberOfFactions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onNavigateEntity && onNavigateEntity({ id: f.id, name: f.name, type: 'faction' })}
                  className="px-2 py-0.5 rounded-md bg-indigo-950/50 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 text-[11px] transition flex items-center gap-1"
                >
                  <Users className="w-2.5 h-2.5" />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Located At */}
        {entity.locatedAt && entity.locatedAt.length > 0 && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 uppercase">
              <MapPin className="w-3 h-3 text-emerald-400" /> Located At
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.locatedAt.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onNavigateEntity && onNavigateEntity({ id: l.id, name: l.name, type: 'location' })}
                  className="px-2 py-0.5 rounded-md bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 text-[11px] transition flex items-center gap-1"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connected Quests */}
        {entity.connectedQuests && entity.connectedQuests.length > 0 && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1 uppercase">
              <Scroll className="w-3 h-3 text-purple-400" /> Connected Quests
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.connectedQuests.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onNavigateEntity && onNavigateEntity({ id: q.id, name: q.title, type: 'quest' })}
                  className="px-2 py-0.5 rounded-md bg-purple-950/50 hover:bg-purple-900 text-purple-300 border border-purple-800/40 text-[11px] transition flex items-center gap-1"
                >
                  <Scroll className="w-2.5 h-2.5" />
                  {q.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enemies / Allies */}
        {((entity.allies && entity.allies.length > 0) || (entity.enemies && entity.enemies.length > 0)) && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1 uppercase">
              <Swords className="w-3 h-3 text-rose-400" /> Relationships
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.allies?.map((a) => (
                <span key={a.id} className="px-2 py-0.5 rounded-md bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 text-[11px]">
                  Ally: {a.name}
                </span>
              ))}
              {entity.enemies?.map((e) => (
                <span key={e.id} className="px-2 py-0.5 rounded-md bg-rose-950/50 text-rose-300 border border-rose-800/40 text-[11px]">
                  Enemy: {e.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mentioned In Notes */}
        {entity.mentionedInNotes && entity.mentionedInNotes.length > 0 && (
          <div className="p-2.5 bg-stone-900/80 border border-stone-800 rounded-xl space-y-1">
            <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1 uppercase">
              <FileText className="w-3 h-3 text-cyan-400" /> Mentioned In Notes
            </div>
            <div className="flex flex-wrap gap-1">
              {entity.mentionedInNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onNavigateEntity && onNavigateEntity({ id: n.id, name: n.title, type: 'note' })}
                  className="px-2 py-0.5 rounded-md bg-cyan-950/50 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 text-[11px] transition flex items-center gap-1"
                >
                  <FileText className="w-2.5 h-2.5" />
                  {n.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
