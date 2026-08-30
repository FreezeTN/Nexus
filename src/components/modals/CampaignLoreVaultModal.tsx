import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Scroll,
  Shield,
  Navigation,
  Network,
  Sparkles,
  X,
  Share2,
  Download,
  FileText,
  Copy,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { WorldAtlasView } from '../campaign/WorldAtlasView';
import { QuestTrackerView } from '../campaign/QuestTrackerView';
import { FactionMatrixView } from '../campaign/FactionMatrixView';
import { CampaignTravelCalculator } from '../campaign/CampaignTravelCalculator';
import { WorldLocation } from '../../types/campaign';
import {
  loadCampaignLocations,
  loadCampaignQuests,
  loadCampaignFactions
} from '../../services/campaignService';

export type CampaignTabId = 'atlas' | 'quests' | 'factions' | 'travel' | 'export';

interface CampaignLoreVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CampaignTabId;
  onOpenKnowledgeGraph?: (entityName: string) => void;
  onOpenGenerators?: (tab?: 'npc' | 'encounter' | 'treasure' | 'session' | 'rules' | 'dungeon') => void;
}

export const CampaignLoreVaultModal: React.FC<CampaignLoreVaultModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'atlas',
  onOpenKnowledgeGraph,
  onOpenGenerators
}) => {
  const [activeTab, setActiveTab] = useState<CampaignTabId>(initialTab);
  const [selectedLocationForTravel, setSelectedLocationForTravel] = useState<WorldLocation | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  if (!isOpen) return null;

  const handleSelectLocationForTravel = (loc: WorldLocation) => {
    setSelectedLocationForTravel(loc);
    setActiveTab('travel');
  };

  const handleGenerateExportMarkdown = (): string => {
    const locs = loadCampaignLocations();
    const quests = loadCampaignQuests();
    const factions = loadCampaignFactions();

    let md = `# 🗺️ Campaign Lore Dossier & World Atlas\n\n`;
    md += `*Exported on ${new Date().toLocaleDateString()} from Nexus TRPG Engine*\n\n`;

    md += `## 🏛️ Major World Factions (${factions.length})\n\n`;
    factions.forEach(f => {
      md += `### ${f.name} (${f.category.toUpperCase()})\n`;
      md += `- **Standing**: ${f.standing > 0 ? '+' : ''}${f.standing}\n`;
      md += `- **Headquarters**: ${f.headquartersLocationName || 'Unknown'}\n`;
      md += `- **Leader**: ${f.leaderName || 'Unknown'}\n`;
      md += `- **Description**: ${f.description}\n\n`;
    });

    md += `## 🗺️ Charted Locations (${locs.length})\n\n`;
    locs.forEach(l => {
      md += `### ${l.name} [${l.type.toUpperCase()}]\n`;
      md += `- **Danger Level**: ${l.dangerLevel}\n`;
      md += `- **Climate**: ${l.climate}\n`;
      md += `- **Controlling Faction**: ${l.controllingFactionName || 'None'}\n`;
      md += `- **Lore**: ${l.description}\n\n`;
    });

    md += `## 📜 Active & Completed Quests (${quests.length})\n\n`;
    quests.forEach(q => {
      md += `### ${q.title} (${q.category.toUpperCase()} - ${q.status.toUpperCase()})\n`;
      md += `- **Summary**: ${q.summary}\n`;
      md += `- **Giver**: ${q.giverName || 'Unknown'} (${q.giverLocationName || 'Unknown Location'})\n`;
      md += `- **Stages**:\n`;
      q.stages.forEach(s => {
        md += `  - [${s.completed ? 'x' : ' '}] ${s.text}\n`;
      });
      md += `- **Rewards**: ${q.rewards.xp || 0} XP, ${q.rewards.gold || 0} GP\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = handleGenerateExportMarkdown();
    navigator.clipboard.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = handleGenerateExportMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign_lore_dossier_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-amber-200">
                  Campaign World Atlas & Questline Hub
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Phase D Architecture
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Interactive regional cartography, multi-tier quest tracking, faction diplomacy matrix & expedition logistics.
              </p>
            </div>
          </div>

          {/* Tab Switcher Buttons */}
          <div className="hidden md:flex items-center gap-1.5 bg-stone-950 p-1 rounded-2xl border border-stone-800">
            <button
              onClick={() => setActiveTab('atlas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'atlas'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>World Atlas</span>
            </button>

            <button
              onClick={() => setActiveTab('quests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quests'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Quest Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('factions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'factions'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Faction Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('travel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'travel'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Travel Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Vault Export</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
            title="Close Campaign Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex items-center justify-around bg-stone-900 border-b border-stone-800 p-2 text-xs">
          <button
            onClick={() => setActiveTab('atlas')}
            className={`px-2 py-1 rounded-lg font-bold ${activeTab === 'atlas' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            Atlas
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-2 py-1 rounded-lg font-bold ${activeTab === 'quests' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            Quests
          </button>
          <button
            onClick={() => setActiveTab('factions')}
            className={`px-2 py-1 rounded-lg font-bold ${activeTab === 'factions' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            Factions
          </button>
          <button
            onClick={() => setActiveTab('travel')}
            className={`px-2 py-1 rounded-lg font-bold ${activeTab === 'travel' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            Travel
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-2 py-1 rounded-lg font-bold ${activeTab === 'export' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            Export
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'atlas' && (
            <WorldAtlasView
              onSelectLocationForTravel={handleSelectLocationForTravel}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
              onOpenGenerators={onOpenGenerators}
            />
          )}

          {activeTab === 'quests' && (
            <QuestTrackerView
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
              onOpenGenerators={onOpenGenerators}
            />
          )}

          {activeTab === 'factions' && (
            <FactionMatrixView
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
            />
          )}

          {activeTab === 'travel' && (
            <CampaignTravelCalculator
              initialDestination={selectedLocationForTravel}
            />
          )}

          {activeTab === 'export' && (
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-amber-200">
                      Campaign Lore Vault & Markdown Dossier
                    </h3>
                    <p className="text-xs text-stone-400">
                      Export full campaign notes, location lore, faction alignments, and quest chronicles for offline table play.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedExport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedExport ? 'Copied!' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .MD</span>
                  </button>
                </div>
              </div>

              {/* Live Preview of Export */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {handleGenerateExportMarkdown()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
