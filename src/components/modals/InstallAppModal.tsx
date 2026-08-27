import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Laptop,
  Smartphone,
  Sparkles,
  X,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Compass,
  Monitor,
  Share
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  isStandalone: boolean;
  onTriggerInstallPrompt: () => Promise<void>;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  isStandalone,
  onTriggerInstallPrompt
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOpenDirect = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="install-app-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-200">Install Nexus App</h2>
              <p className="text-xs text-stone-400">Progressive Web App (PWA) for Desktop & Mobile</p>
            </div>
          </div>
          <button
            id="close-install-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Status Banner */}
          {isStandalone ? (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-200">Already Running as Installed App</h4>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  You are currently using the dedicated standalone desktop or mobile app window with offline support!
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-200">1-Click Direct Installation Ready</h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Your browser supports instant 1-click app installation. Click below to add the app directly to your system.
                  </p>
                </div>
              </div>
              <button
                id="direct-install-prompt-btn"
                onClick={async () => {
                  await onTriggerInstallPrompt();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Application Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* If preview iframe is detected */}
              {isIframe && (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-600/40 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Monitor className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-200">Embedded Sandbox Preview Detected</h4>
                      <p className="text-xs text-blue-300/90 mt-0.5">
                        Browsers require PWAs to be opened in a dedicated browser tab to trigger the native 1-click install button.
                      </p>
                    </div>
                  </div>
                  <button
                    id="open-tab-for-install-btn"
                    onClick={handleOpenDirect}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab to Install</span>
                  </button>
                </div>
              )}

              {/* Instructions per platform */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  How to Install on Your Device
                </h4>

                <div className="space-y-3 text-xs text-stone-300">
                  {/* Chrome / Edge / Brave Desktop */}
                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80 flex items-start gap-3">
                    <Laptop className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-200">Chrome, Edge & Brave (Desktop)</div>
                      <div className="text-stone-400 mt-0.5">
                        Click the <strong>Install</strong> icon on the right side of the address bar, or click browser menu (<strong>⋮</strong>) &rarr; <strong>Install Nexus</strong>.
                      </div>
                    </div>
                  </div>

                  {/* iOS Safari */}
                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80 flex items-start gap-3">
                    <Share className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-200">iPhone & iPad (Safari)</div>
                      <div className="text-stone-400 mt-0.5">
                        Tap the <strong>Share</strong> button (box with upward arrow) at the bottom, then scroll down and tap <strong>Add to Home Screen</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Android Chrome */}
                  <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80 flex items-start gap-3">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-stone-200">Android (Chrome / Samsung Internet)</div>
                      <div className="text-stone-400 mt-0.5">
                        Tap the menu (<strong>⋮</strong>) in the top right and tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Direct Link Share */}
          <div className="p-3 bg-stone-950/40 border border-stone-800/60 rounded-xl flex items-center justify-between gap-2">
            <div className="text-xs text-stone-400 truncate font-mono select-all">
              {currentUrl}
            </div>
            <button
              id="copy-app-url-btn"
              onClick={handleCopyUrl}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Copy App URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-stone-800 bg-stone-950/80">
          <button
            id="close-install-modal-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
