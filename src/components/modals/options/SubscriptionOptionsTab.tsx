import React from 'react';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Shield, 
  Check, 
  CreditCard, 
  ExternalLink, 
  Lock, 
  User, 
  Copy, 
  CheckCircle2,
  Gift,
  Flame,
  Info
} from 'lucide-react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { 
  TIER_CONFIGS, 
  PAYPAL_RECIPIENT_EMAIL, 
  buildPayPalCheckoutUrl 
} from '../../../lib/subscription';

interface SubscriptionOptionsTabProps {
  onOpenUpgradeModal: () => void;
  onOpenAuthModal?: () => void;
}

export const SubscriptionOptionsTab: React.FC<SubscriptionOptionsTabProps> = ({
  onOpenUpgradeModal,
  onOpenAuthModal
}) => {
  const {
    currentUser,
    tier,
    tierConfig,
    isDeveloper,
    isHero,
    isGuild,
    isLifetime
  } = useSubscription();

  return (
    <div className="space-y-6 text-stone-200">
      {/* Current Active Plan Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/40 border border-amber-600/40 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border shadow-lg ${
              isDeveloper
                ? 'bg-gradient-to-br from-amber-600 to-cyan-700 text-amber-200 border-cyan-400'
                : isGuild
                ? 'bg-purple-950 text-purple-300 border-purple-500'
                : isHero
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}>
              {isDeveloper ? (
                <Crown className="w-6 h-6 animate-pulse" />
              ) : isGuild ? (
                <Crown className="w-6 h-6" />
              ) : isHero ? (
                <Zap className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  {tierConfig.name}
                </h3>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${tierConfig.badgeColor}`}>
                  {tierConfig.badge}
                </span>
                {isLifetime && (
                  <span className="text-[10px] bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-500/40">
                    Lifetime Active
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {currentUser 
                  ? `Linked Account: ${currentUser.displayName} (${currentUser.email || 'Guest User'})`
                  : 'Playing as Guest. Sign in to sync subscription across all devices.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            ) : !isDeveloper && tier !== 'guild' ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade Plan</span>
              </button>
            ) : isDeveloper ? (
              <span className="px-3 py-1.5 bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-mono font-bold">
                Developer God-Tier Active
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-purple-950 text-purple-300 border border-purple-500/50 rounded-xl text-xs font-mono font-bold">
                Max Tier Active
              </span>
            )}
          </div>
        </div>

        {/* Developer Notice */}
        {isDeveloper && (
          <div className="mt-4 p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Developer Bypass Enabled:</strong> You are identified as Lead Developer (<strong>ChaosDwarf / Freeze</strong>). All feature gates, character slot quotas, and tools are unlocked indefinitely.
            </span>
          </div>
        )}
      </div>

      {/* Perks List */}
      <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
        <h4 className="text-sm font-serif font-bold text-amber-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Active Plan Features & Perks</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {tierConfig.perks.map((perk, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-stone-300 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800/80">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fair-Play Promise Box */}
      <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-700/60 text-xs text-stone-400 space-y-2">
        <div className="flex items-center gap-2 text-stone-200 font-semibold">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Our Fair-Play Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Nexus TRPG is committed to fair-play gaming: no core rulebook mechanics, dice math, leveling, spells, or combat features will ever be hidden behind a paywall. Premium subscriptions support server hosting costs, real-time multiplayer WebRTC infrastructure, and provide high-capacity storage & vanity cosmetics.
        </p>
        <p className="text-stone-400 font-mono text-[11px]">
          Direct PayPal payments processed via: <strong className="text-amber-200">paypal.me/nexustrpg</strong>
        </p>
      </div>
    </div>
  );
};
