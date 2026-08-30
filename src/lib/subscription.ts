import { UserProfile } from '../lib/firebase';

export type SubscriptionTier = 'free' | 'hero' | 'guild' | 'developer' | 'tester';

export interface TierPerks {
  name: string;
  badge: string;
  badgeColor: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  characterLimit: number; // -1 for unlimited
  rollLogLimit: number; // -1 for unlimited
  hasCosmeticDice: boolean;
  hasCustomThemes: boolean;
  hasPdfExport: boolean;
  hasCampaignGraphPro: boolean;
  hasDmLivePartyHud: boolean;
  hasPriorityAi: boolean;
  hasAmbienceStreaming: boolean;
  perks: string[];
}

export const PAYPAL_ME_HANDLE = 'nexustrpg';
export const PAYPAL_ME_URL = 'https://paypal.me/nexustrpg';
export const PAYPAL_RECIPIENT_EMAIL = 'paypal.me/nexustrpg';

export const DEVELOPER_USERNAMES = ['chaosdwarf', 'freeze'];
export const DEVELOPER_EMAILS = ['nik04@hotmail.de', 'tomnik2007@gmail.com'];

export const TESTER_USERNAMES = ['karl'];
export const TESTER_EMAILS = ['karlbrettmann94@gmail.com'];

export const TIER_CONFIGS: Record<SubscriptionTier, TierPerks> = {
  free: {
    name: 'Adventurer',
    badge: '🛡️ Adventurer',
    badgeColor: 'bg-stone-800 text-stone-300 border-stone-700',
    monthlyPrice: '$0',
    annualPrice: '$0',
    description: '100% Free fair-play access to all 5 TRPG rule engines, dice rolling, spellbooks & leveling.',
    characterLimit: 5,
    rollLogLimit: 50,
    hasCosmeticDice: false,
    hasCustomThemes: false,
    hasPdfExport: false,
    hasCampaignGraphPro: false,
    hasDmLivePartyHud: false,
    hasPriorityAi: false,
    hasAmbienceStreaming: false,
    perks: [
      'Full access to 5 TRPG rule engines (5e, 3.5e, SR, PF, CoC)',
      'Up to 5 active character sheets with cloud sync',
      'Standard Obsidian & Metal dice rollers',
      'Complete spellbook, gear & leveling calculators',
      'Local & multiplayer session participation',
      'Custom hotkeys & 60-second guided onboarding'
    ]
  },
  hero: {
    name: 'Hero / Pro',
    badge: '⚡ Hero Supporter',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/80 ring-1 ring-amber-500/40',
    monthlyPrice: '$3.99',
    annualPrice: '$39.00',
    description: 'Unlimited character storage, premium animated dice skins, PDF sheet export, and external YouTube/Spotify party streaming.',
    characterLimit: -1, // Unlimited
    rollLogLimit: -1, // Unlimited
    hasCosmeticDice: true,
    hasCustomThemes: true,
    hasPdfExport: true,
    hasCampaignGraphPro: false,
    hasDmLivePartyHud: false,
    hasPriorityAi: true,
    hasAmbienceStreaming: true,
    perks: [
      'Everything in Adventurer, plus:',
      '✨ Unlimited cloud character slots & archive folders',
      '🎵 External Ambient Audio Streamer (YouTube & Spotify playlists broadcast to party)',
      '🎲 Premium Animated Dice Skins (Astral Nebula, Molten Core, Cyber Glow)',
      '📜 Official Fillable PDF Sheet Exporter & Print Binder formats',
      '📊 Unlimited session roll history & CSV export logs',
      '🎨 Custom sheet themes & exclusive cosmetic colorways',
      '⚡ Priority AI Oracle & Character Generation quota'
    ]
  },
  guild: {
    name: 'Dungeon Master / Guild',
    badge: '👑 Guild Master',
    badgeColor: 'bg-purple-950/90 text-purple-200 border-purple-500/80 ring-1 ring-purple-500/50',
    monthlyPrice: '$8.99',
    annualPrice: '$89.00',
    description: 'Ultimate power-tools for Game Masters: Live Party HUD, Campaign Knowledge Graph Mind-Maps, and shared party perks.',
    characterLimit: -1,
    rollLogLimit: -1,
    hasCosmeticDice: true,
    hasCustomThemes: true,
    hasPdfExport: true,
    hasCampaignGraphPro: true,
    hasDmLivePartyHud: true,
    hasPriorityAi: true,
    hasAmbienceStreaming: true,
    perks: [
      'Everything in Hero / Pro Tier, plus:',
      '🎵 Full DM YouTube & Spotify Campaign Live Broadcast Streamer',
      '🗺️ Campaign Knowledge Graph Mind-Mapping with DM Secret Reveal Nodes',
      '👁️ DM Live Multi-Party HUD (monitor health, spell slots & passives live)',
      '📦 High-res map & custom NPC handout hosting',
      '👥 Share Pro Perks with all players inside your hosted game session',
      '⚔️ Batch monster statblock parser & homebrew compendium importer',
      '🌟 Exclusive Guild Master community badge & direct roadmap voting'
    ]
  },
  tester: {
    name: 'Official QA / Tester',
    badge: '🧪 QA Tester Bypass',
    badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/80 ring-1 ring-emerald-500/50',
    monthlyPrice: 'BYPASS',
    annualPrice: 'BYPASS',
    description: 'Official TRPG Tester Access: Full lifetime bypass of all subscription limits, paywalls, and quotas.',
    characterLimit: -1,
    rollLogLimit: -1,
    hasCosmeticDice: true,
    hasCustomThemes: true,
    hasPdfExport: true,
    hasCampaignGraphPro: true,
    hasDmLivePartyHud: true,
    hasPriorityAi: true,
    hasAmbienceStreaming: true,
    perks: [
      'Full QA Tester bypass for Karl and designated testers',
      'Unlimited characters, storage, AI queries & tools',
      'Full access to all DM & Player features without paywalls',
      'Permanent bypass for all current and future subscriptions',
      'Access to all premium themes and animated dice'
    ]
  },
  developer: {
    name: 'Lead Developer / Founder',
    badge: '⚡👑 Developer God-Tier',
    badgeColor: 'bg-gradient-to-r from-amber-600/30 to-cyan-600/30 text-amber-200 border-cyan-400/80 ring-2 ring-amber-400/60 animate-pulse',
    monthlyPrice: 'FREE FOREVER',
    annualPrice: 'FREE FOREVER',
    description: 'Lifetime bypass of all platform restrictions, unlimited cloud capacity, and developer debugging tools.',
    characterLimit: -1,
    rollLogLimit: -1,
    hasCosmeticDice: true,
    hasCustomThemes: true,
    hasPdfExport: true,
    hasCampaignGraphPro: true,
    hasDmLivePartyHud: true,
    hasPriorityAi: true,
    hasAmbienceStreaming: true,
    perks: [
      'Permanent developer bypass for ChaosDwarf and Freeze',
      'All present and future Pro / Guild features permanently unlocked',
      'Unlimited characters, storage, AI queries & tools',
      'Developer Architecture & Debugging Console access',
      'Direct PayPal revenue management'
    ]
  }
};

/**
 * Checks if a user is one of the designated Lead Developers (ChaosDwarf or Freeze)
 * or has developer email credentials.
 */
export function isDeveloperUser(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  
  const displayName = (user.displayName || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();

  if (DEVELOPER_USERNAMES.includes(displayName)) {
    return true;
  }

  if (DEVELOPER_EMAILS.includes(email)) {
    return true;
  }

  if (user.tier === 'developer') {
    return true;
  }

  return false;
}

/**
 * Checks if a user is a QA Tester (such as Karl) or has the Tester role/tier.
 * Testers bypass all subscription limits, paywalls, and quotas.
 */
export function isTesterUser(user: UserProfile | null | undefined): boolean {
  if (!user) return false;

  const displayName = (user.displayName || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();

  if (user.role === 'Tester') {
    return true;
  }

  if (user.tier === 'tester') {
    return true;
  }

  if (TESTER_USERNAMES.includes(displayName)) {
    return true;
  }

  if (TESTER_EMAILS.includes(email)) {
    return true;
  }

  return false;
}

/**
 * Checks if a user has a subscription bypass (Lead Developers and QA Testers).
 */
export function isSubscriptionBypassed(user: UserProfile | null | undefined): boolean {
  return isDeveloperUser(user) || isTesterUser(user);
}

/**
 * Determines the effective active subscription tier for a user.
 * Developers resolve to 'developer', Testers resolve to 'tester' (both bypass all restrictions).
 */
export function getEffectiveUserTier(user: UserProfile | null | undefined): SubscriptionTier {
  if (!user) return 'free';
  if (isDeveloperUser(user)) return 'developer';
  if (isTesterUser(user)) return 'tester';
  return user.tier || 'free';
}

/**
 * Generates a direct PayPal.me checkout link targeting paypal.me/nexustrpg
 */
export function buildPayPalCheckoutUrl(tier: 'hero' | 'guild', interval: 'monthly' | 'annual' | 'lifetime' = 'monthly'): string {
  const prices = {
    hero: { monthly: '3.99', annual: '39.00', lifetime: '49.99' },
    guild: { monthly: '8.99', annual: '89.00', lifetime: '99.99' }
  };
  const amount = prices[tier][interval];
  
  // Direct PayPal.Me link with preset amount (e.g. https://paypal.me/nexustrpg/3.99USD)
  return `https://paypal.me/nexustrpg/${amount}USD`;
}
