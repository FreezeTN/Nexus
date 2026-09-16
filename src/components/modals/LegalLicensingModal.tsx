import React, { useState } from 'react';
import {
  ShieldCheck,
  Scale,
  FileText,
  ExternalLink,
  Copy,
  Check,
  X,
  BookOpen,
  Info,
  AlertTriangle
} from 'lucide-react';

interface LegalLicensingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'attribution' | 'cc-by' | 'ogl';
}

export const LegalLicensingModal: React.FC<LegalLicensingModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'attribution'
}) => {
  const [activeTab, setActiveTab] = useState<'attribution' | 'cc-by' | 'ogl'>(defaultTab);
  const [copiedAttribution, setCopiedAttribution] = useState(false);

  if (!isOpen) return null;

  const standardAttributionText = `This application includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

It also contains Open Game Content from the D&D 3.5 System Reference Document under the Open Game License v1.0a (OGL 1.0a).

Nexus TRPG is an independent virtual tabletop and companion platform and is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC, Paizo Inc., Chaosium Inc., or Catalyst Game Labs.`;

  const handleCopyAttribution = () => {
    navigator.clipboard.writeText(standardAttributionText);
    setCopiedAttribution(true);
    setTimeout(() => setCopiedAttribution(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-100 p-2 rounded-full hover:bg-stone-900 transition cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Legal & IP Documentation
            </span>
            <span className="text-xs font-mono text-stone-400">
              Nexus TRPG Compliance Suite
            </span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-100 flex items-center gap-2">
            Open Gaming Licenses & SRD Attribution
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
            Transparent licensing compliance regarding open tabletop roleplaying game rules (SRD 5.1 Creative Commons, OGL 1.0a) and official non-affiliation disclaimers.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'attribution' as const, label: 'Attribution & Disclaimers', icon: ShieldCheck },
            { id: 'cc-by' as const, label: 'SRD 5.1 (CC-BY-4.0)', icon: FileText },
            { id: 'ogl' as const, label: '3.5e OGL 1.0a Notice', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                    : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-4 text-stone-300 text-sm leading-relaxed overflow-y-auto pr-1">
          {/* TAB 1: ATTRIBUTION & DISCLAIMERS */}
          {activeTab === 'attribution' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase font-mono">
                  <Info className="w-4 h-4" /> Non-Affiliation & Trademark Notice
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  <strong>Nexus TRPG</strong> is an independent digital companion and virtual tabletop utility. It is <strong>not affiliated with, endorsed, sponsored, or specifically approved</strong> by Wizards of the Coast LLC, Hasbro Inc., Paizo Inc., Chaosium Inc., or Catalyst Game Labs.
                </p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  <em>Dungeons & Dragons</em>, <em>D&D</em>, <em>Player's Handbook</em>, <em>Dungeon Master's Guide</em>, <em>Monster Manual</em>, and their respective logos are registered trademarks of Wizards of the Coast LLC. <em>Pathfinder</em> and <em>Starfinder</em> are trademarks of Paizo Inc. <em>Call of Cthulhu</em> is a trademark of Chaosium Inc. <em>Shadowrun</em> is a trademark of The Topps Company, Inc. and Catalyst Game Labs.
                </p>
              </div>

              <div className="bg-stone-900/60 border border-stone-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-200 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Standard Attribution Clause
                  </span>
                  <button
                    onClick={handleCopyAttribution}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-mono font-medium transition cursor-pointer"
                  >
                    {copiedAttribution ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAttribution ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800/80 font-mono text-[11px] text-stone-400 whitespace-pre-wrap leading-relaxed">
                  {standardAttributionText}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-900/40 border border-stone-800/80 p-3.5 rounded-xl space-y-1.5">
                  <div className="text-xs font-mono font-bold text-blue-300">5th Edition SRD 5.1</div>
                  <div className="text-xs text-stone-400">
                    Released under <strong>Creative Commons CC-BY-4.0</strong> by Wizards of the Coast (Jan 2023). Unconditional, irrevocable global permission to adapt and build software using open rules.
                  </div>
                </div>
                <div className="bg-stone-900/40 border border-stone-800/80 p-3.5 rounded-xl space-y-1.5">
                  <div className="text-xs font-mono font-bold text-amber-300">3.5 Edition SRD 3.5</div>
                  <div className="text-xs text-stone-400">
                    Governed under the <strong>Open Game License v1.0a (OGL 1.0a)</strong>. Grants perpetual right to copy, modify, and distribute Open Game Content with the included 15-clause notice.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATIVE COMMONS CC-BY-4.0 */}
          {activeTab === 'cc-by' && (
            <div className="space-y-4">
              <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-mono font-bold text-blue-300 flex items-center justify-between">
                  <span>Creative Commons Attribution 4.0 International (CC-BY-4.0)</span>
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/legalcode"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-200 underline text-[11px]"
                  >
                    <span>Full Deed</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Wizards of the Coast released the entirety of the <strong>System Reference Document 5.1 (SRD 5.1)</strong> under CC-BY-4.0 in January 2023. This license is perpetual, worldwide, royalty-free, and irrevocable.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif font-bold text-stone-200 text-sm">Key Permissions under CC-BY-4.0:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-900/50 border border-stone-800 p-3 rounded-xl space-y-1">
                    <strong className="text-emerald-400 font-mono">✓ Sharing & Redistribution:</strong>
                    <p className="text-stone-400">Copy and redistribute the material in any medium or format.</p>
                  </div>
                  <div className="bg-stone-900/50 border border-stone-800 p-3 rounded-xl space-y-1">
                    <strong className="text-emerald-400 font-mono">✓ Adaptation & Remixing:</strong>
                    <p className="text-stone-400">Remix, transform, and build upon the material for any purpose, even commercially.</p>
                  </div>
                  <div className="bg-stone-900/50 border border-stone-800 p-3 rounded-xl space-y-1">
                    <strong className="text-amber-400 font-mono">! Attribution Required:</strong>
                    <p className="text-stone-400">Must give appropriate credit, provide a link to the license, and indicate if changes were made.</p>
                  </div>
                  <div className="bg-stone-900/50 border border-stone-800 p-3 rounded-xl space-y-1">
                    <strong className="text-cyan-400 font-mono">✓ No Additional Restrictions:</strong>
                    <p className="text-stone-400">You cannot apply legal terms or technological measures that legally restrict others from doing anything the license permits.</p>
                  </div>
                </div>
              </div>

              <div className="bg-stone-900/40 border border-stone-800 p-4 rounded-2xl space-y-2">
                <h4 className="font-serif font-bold text-stone-200 text-xs uppercase font-mono">SRD 5.1 Citation Statement:</h4>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 font-mono text-[11px] text-stone-400">
                  "This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode."
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OPEN GAME LICENSE 1.0a */}
          {activeTab === 'ogl' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-mono font-bold text-amber-300">
                  Open Game License Version 1.0a
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  The following license applies to all D&D 3.5e System Reference Document materials included within Nexus TRPG.
                </p>
              </div>

              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-[11px] text-stone-400 font-mono space-y-3 max-h-72 overflow-y-auto leading-relaxed">
                <p><strong>OPEN GAME LICENSE Version 1.0a</strong></p>
                <p>The following text is the property of Wizards of the Coast, Inc. and is Copyright 2000 Wizards of the Coast, Inc ("Wizards"). All Rights Reserved.</p>
                <p><strong>1. Definitions:</strong> (a)"Contributors" means the copyright and/or trademark owners who have contributed Open Game Content; (b)"Derivative Material" means copyrighted material including derivative works and translations; (d)"Open Game Content" means the game mechanic and includes the methods, procedures, processes and routines to the extent such content does not embody the Product Identity...</p>
                <p><strong>2. The License:</strong> This License applies to any Open Game Content that contains a notice indicating that the Open Game Content may only be Used under and in terms of this License...</p>
                <p><strong>3. Offer and Acceptance:</strong> By Using the Open Game Content You indicate Your acceptance of the terms of this License.</p>
                <p><strong>4. Grant and Consideration:</strong> In consideration for agreeing to use this License, the Contributors grant You a perpetual, worldwide, royalty-free, non-exclusive license with the exact terms of this License to Use, the Open Game Content.</p>
                <p><strong>5. Representation of Authority to Contribute:</strong> If You are contributing original material as Open Game Content, You represent that Your Contributions are Your original creation and/or You have sufficient rights to grant the rights conveyed by this License.</p>
                <p><strong>6. Notice of License Copyright:</strong> You must update the COPYRIGHT NOTICE portion of this License to include the exact text of the COPYRIGHT NOTICE of any Open Game Content You are copying, modifying or distributing...</p>
                <p><strong>7. Use of Product Identity:</strong> You agree not to Use any Product Identity, including as an indication as to compatibility, except as expressly licensed in another, independent Agreement with the owner of each element of that Product Identity...</p>
                <p><strong>15. COPYRIGHT NOTICE:</strong><br />
                Open Game License v 1.0a Copyright 2000, Wizards of the Coast, Inc.<br />
                System Reference Document Copyright 2000-2003, Wizards of the Coast, Inc.; Authors Jonathan Tweet, Monte Cook, Skip Williams, Rich Baker, Andy Collins, David Noonan, Rich Redman, Bruce R. Cordell, John D. Rateliff, Thomas Reid, James Wyatt, based on original material by E. Gary Gygax and Dave Arneson.<br />
                Nexus TRPG System Reference Companion Copyright 2024-2026, Nexus TRPG Platform.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-stone-500 font-mono">
            Nexus TRPG • Open Gaming Compliance & IP Shield
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalLicensingModal;
