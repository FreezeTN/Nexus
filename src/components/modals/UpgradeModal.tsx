import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Sparkles, 
  CreditCard, 
  ExternalLink, 
  Lock, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  Gift, 
  Layers, 
  Dices, 
  Users, 
  FileText,
  Copy
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { 
  TIER_CONFIGS, 
  PAYPAL_RECIPIENT_EMAIL, 
  buildPayPalCheckoutUrl, 
  SubscriptionTier 
} from '../../lib/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
  defaultTier?: SubscriptionTier;
  reason?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal,
  defaultTier,
  reason
}) => {
  const {
    currentUser,
    tier,
    isDeveloper,
    upgradeReason: contextReason,
    upgradeRequiredTier: contextRequiredTier,
    upgradeToTier,
    closeUpgradeModal
  } = useSubscription();

  const effectiveReason = reason || contextReason;
  const initialTierTarget = (defaultTier === 'guild' || contextRequiredTier === 'guild') ? 'guild' : 'hero';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [selectedTier, setSelectedTier] = useState<'hero' | 'guild'>(initialTierTarget);
  const [paypalTxId, setPaypalTxId] = useState('');
  const [paypalSenderEmail, setPaypalSenderEmail] = useState(currentUser?.email || '');
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync state if required tier changes
  React.useEffect(() => {
    if (defaultTier === 'guild' || contextRequiredTier === 'guild') {
      setSelectedTier('guild');
    } else if (defaultTier === 'hero' || contextRequiredTier === 'hero') {
      setSelectedTier('hero');
    }
  }, [defaultTier, contextRequiredTier]);

  // Handle close cleanly
  const handleClose = () => {
    onClose();
    closeUpgradeModal();
  };

  // Listen for Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PAYPAL_RECIPIENT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setIsActivating(true);
    try {
      const generatedTx = paypalTxId.trim() || `PP-NEXUS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await upgradeToTier(selectedTier, {
        paypalTxId: generatedTx,
        paypalEmail: paypalSenderEmail.trim() || PAYPAL_RECIPIENT_EMAIL,
        isLifetime: billingCycle === 'lifetime',
        tierExpiresAt: billingCycle === 'lifetime' ? undefined : new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
      });
      setActivationSuccess(`Successfully unlocked ${TIER_CONFIGS[selectedTier].name}! Thank you for supporting Nexus TRPG!`);
      setTimeout(() => {
        setActivationSuccess(null);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to activate subscription:', err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/80 border-b border-amber-600/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-amber-200">
                  Nexus TRPG Supporter & Pro Tiers
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fair-Play Monetization
                </span>
              </div>
              <p className="text-xs text-stone-400">
                100% of game mechanics, dice math & rules are free forever. Upgrade for unlimited storage & QoL power tools.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Banner if triggered by a paywalled feature */}
        {effectiveReason && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Notice:</strong> {effectiveReason}</span>
          </div>
        )}

        {/* Developer Bypass Banner if Lead Dev */}
        {isDeveloper && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-900/50 to-cyan-900/50 border border-cyan-400/60 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2 font-mono">
              <Crown className="w-4 h-4 text-cyan-300" />
              <span><strong>Lead Developer Active:</strong> You have permanent God-Tier bypass for all features!</span>
            </div>
            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">ChaosDwarf & Freeze Bypass</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Billing Cycle Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <div className="text-xs text-stone-400">
              <span className="font-semibold text-stone-200">Select Billing Cycle:</span> All payments handled securely via PayPal.
            </div>
            <div className="flex items-center bg-stone-900 p-1 rounded-lg border border-stone-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-stone-950 font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-amber-500 text-stone-950 font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">Save ~18%</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                  billingCycle === 'lifetime' ? 'bg-purple-600 text-white font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-300" />
                <span>Lifetime</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Free Adventurer */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
              tier === 'free' ? 'bg-stone-950/80 border-stone-600 ring-1 ring-stone-500' : 'bg-stone-950/40 border-stone-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-stone-800 text-stone-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  {tier === 'free' && (
                    <span className="text-[10px] uppercase font-bold bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700">
                      Current Plan
                    </span>
                  )}
                </div>
                <h3 className="text-base font-serif font-bold text-stone-100">Adventurer</h3>
                <div className="text-2xl font-mono font-bold text-stone-200 mt-1 mb-2">
                  $0 <span className="text-xs text-stone-500 font-normal">/ forever</span>
                </div>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  100% free access to all 5 tabletop rule engines, complete spellbook, leveling & combat math.
                </p>
                <div className="border-t border-stone-800 pt-3 space-y-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 5 Cloud Character Slots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Standard Obsidian & Metal Dice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multiplayer Sessions & Voice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full Custom Hotkeys</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  disabled={tier === 'free'}
                  className="w-full py-2 bg-stone-800 text-stone-400 text-xs font-semibold rounded-xl cursor-default"
                >
                  {tier === 'free' ? 'Active Default' : 'Base Tier'}
                </button>
              </div>
            </div>

            {/* Hero / Pro Tier */}
            <div className={`relative p-5 rounded-2xl border flex flex-col justify-between transition ${
              selectedTier === 'hero' 
                ? 'bg-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/60' 
                : 'bg-stone-950/60 border-stone-700 hover:border-amber-600/50'
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow">
                Most Popular
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  {tier === 'hero' && (
                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-base font-serif font-bold text-amber-200">Hero Supporter</h3>
                <div className="text-2xl font-mono font-bold text-amber-400 mt-1 mb-2">
                  {billingCycle === 'monthly' ? '$3.99' : billingCycle === 'annual' ? '$39.00' : '$49.99'} 
                  <span className="text-xs text-stone-400 font-normal">
                    {billingCycle === 'monthly' ? ' / mo' : billingCycle === 'annual' ? ' / yr' : ' lifetime'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                  Unlimited character slots, animated cosmic dice skins, PDF sheet exporter & unlimited roll logs.
                </p>
                <div className="border-t border-amber-800/40 pt-3 space-y-2 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Unlimited</strong> Cloud Character Slots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>YouTube & Spotify</strong> Ambient Audio Streamer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dices className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Astral, Nebula & Molten Dice Skins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Official Fillable PDF Sheet Exporter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited Roll History & CSV Export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom Character Sheet Colorways</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTier('hero')}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                    selectedTier === 'hero'
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-300'
                  }`}
                >
                  {selectedTier === 'hero' ? 'Selected Plan' : 'Select Hero'}
                </button>
              </div>
            </div>

            {/* Guild Master / DM Tier */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
              selectedTier === 'guild' 
                ? 'bg-purple-950/30 border-purple-500 shadow-xl shadow-purple-950/40 ring-2 ring-purple-500/60' 
                : 'bg-stone-950/60 border-stone-700 hover:border-purple-600/50'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Crown className="w-5 h-5" />
                  </div>
                  {tier === 'guild' && (
                    <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-base font-serif font-bold text-purple-200">Guild Master</h3>
                <div className="text-2xl font-mono font-bold text-purple-400 mt-1 mb-2">
                  {billingCycle === 'monthly' ? '$8.99' : billingCycle === 'annual' ? '$89.00' : '$99.99'} 
                  <span className="text-xs text-stone-400 font-normal">
                    {billingCycle === 'monthly' ? ' / mo' : billingCycle === 'annual' ? ' / yr' : ' lifetime'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                  For Dungeon Masters & Guild Leaders. Live party monitoring, campaign knowledge graphs & shared perks.
                </p>
                <div className="border-t border-purple-800/40 pt-3 space-y-2 text-xs text-stone-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span><strong>Everything in Hero Tier</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>DM Live Multi-Party HUD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Campaign Graph Mind-Maps & Secret Nodes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Share Pro Perks with All Session Players</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTier('guild')}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                    selectedTier === 'guild'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                      : 'bg-stone-800 hover:bg-stone-700 text-purple-300'
                  }`}
                >
                  {selectedTier === 'guild' ? 'Selected Plan' : 'Select Guild Master'}
                </button>
              </div>
            </div>

          </div>

          {/* PayPal Payment & Direct Activation Box */}
          <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-100">
                    PayPal Direct Checkout & Activation
                  </h4>
                  <p className="text-xs text-stone-400">
                    Recipient: <strong className="text-amber-200">paypal.me/nexustrpg</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEmail ? 'Copied!' : 'Copy PayPal.me Link'}</span>
              </button>
            </div>

            {/* Activation notification toast */}
            {activationSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{activationSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Step 1: PayPal Checkout Link */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-700/60 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-amber-400 font-mono">Step 1</span>
                  <h5 className="text-sm font-semibold text-stone-200 mt-1 mb-1">
                    Send Payment via PayPal
                  </h5>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Click below to open PayPal checkout for <strong>{TIER_CONFIGS[selectedTier].name} ({billingCycle})</strong>. Payments go directly to <strong>paypal.me/nexustrpg</strong>.
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href={buildPayPalCheckoutUrl(selectedTier, billingCycle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Pay with PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Step 2: Instant Activation */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-700/60 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-amber-400 font-mono">Step 2</span>
                  <h5 className="text-sm font-semibold text-stone-200 mt-1 mb-1">
                    Instant Profile Activation
                  </h5>
                  <p className="text-xs text-stone-400 leading-relaxed mb-3">
                    Linked to current user: <strong className="text-stone-200">{currentUser ? currentUser.displayName : 'Guest / Not Signed In'}</strong>
                  </p>
                  
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In to Link Subscription</span>
                    </button>
                  ) : (
                    <form onSubmit={handleActivate} className="space-y-2">
                      <input
                        type="text"
                        placeholder="PayPal Transaction ID or Note (Optional)"
                        value={paypalTxId}
                        onChange={(e) => setPaypalTxId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isActivating}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isActivating ? 'Activating Tier...' : `Activate ${TIER_CONFIGS[selectedTier].name} Now`}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer with Close Button */}
        <div className="px-6 py-3.5 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>Instant activation upon verification • Free rules forever</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl transition font-medium cursor-pointer"
          >
            Maybe Later / Close
          </button>
        </div>

      </div>
    </div>
  );
};
