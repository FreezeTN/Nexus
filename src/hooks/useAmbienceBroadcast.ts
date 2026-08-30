import { useState, useEffect } from 'react';
import {
  parseExternalMediaUrl,
  getSavedExternalStreams,
  saveExternalStream,
  deleteExternalStream,
  ExternalAmbienceStream
} from '../utils/externalAmbience';
import { UserProfile, GameSession, updateSessionAmbience } from '../lib/firebase';
import { getEffectiveUserTier, isDeveloperUser, isTesterUser, isSubscriptionBypassed } from '../lib/subscription';

export interface UseAmbienceBroadcastProps {
  activeSession: GameSession;
  currentUser: UserProfile | null;
  onOpenUpgradeModal?: (reason?: string, tier?: 'hero' | 'guild') => void;
}

export function useAmbienceBroadcast({
  activeSession,
  currentUser,
  onOpenUpgradeModal
}: UseAmbienceBroadcastProps) {
  const [customStreams, setCustomStreams] = useState<ExternalAmbienceStream[]>(() => getSavedExternalStreams());
  const [inputUrl, setInputUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'tavern' | 'combat' | 'exploration' | 'dungeon' | 'mystic' | 'custom'>('exploration');
  const [urlParseError, setUrlParseError] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [broadcastToParty, setBroadcastToParty] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const isDev = isDeveloperUser(currentUser);
  const isTester = isTesterUser(currentUser);
  const isBypassed = isSubscriptionBypassed(currentUser);
  const effectiveTier = currentUser ? (isDev ? 'developer' : isTester ? 'tester' : getEffectiveUserTier(currentUser)) : 'free';
  const hasSubscription = isBypassed || effectiveTier === 'hero' || effectiveTier === 'guild' || effectiveTier === 'developer' || effectiveTier === 'tester';

  const liveAmbience = activeSession?.activeAmbience;
  const isPlaying = Boolean(liveAmbience?.isPlaying && liveAmbience?.embedUrl);

  const requireSubscription = (reason: string): boolean => {
    if (!hasSubscription) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal(reason, 'hero');
      }
      return false;
    }
    return true;
  };

  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireSubscription('Adding custom external audio streams requires a Hero or Guild subscription.')) {
      return;
    }

    setUrlParseError(null);
    if (!inputUrl.trim()) return;

    const parsed = parseExternalMediaUrl(inputUrl);
    if (!parsed) {
      setUrlParseError('Unsupported link format. Please provide a valid YouTube video/playlist link or Spotify URL.');
      return;
    }

    const title = customTitle.trim() || parsed.titleSuggestion || 'Custom Ambience';
    const stream = saveExternalStream({
      title,
      url: inputUrl.trim(),
      sourceType: parsed.sourceType,
      embedUrl: parsed.embedUrl,
      category: selectedCategory,
      addedBy: currentUser?.displayName || 'DM'
    });

    setCustomStreams(getSavedExternalStreams());
    setInputUrl('');
    setCustomTitle('');

    // If auto-broadcasting
    if (broadcastToParty && activeSession?.code) {
      updateSessionAmbience(activeSession.code, {
        streamId: stream.id,
        title: stream.title,
        url: stream.url,
        sourceType: stream.sourceType,
        embedUrl: stream.embedUrl,
        isPlaying: true,
        category: stream.category,
        changedBy: currentUser?.displayName || 'DM',
        updatedAt: new Date().toISOString()
      }).catch(err => console.error('Failed to broadcast added stream:', err));

      setBroadcastStatus(`Broadcasting "${stream.title}" to campaign party!`);
      setTimeout(() => setBroadcastStatus(null), 4000);
    }
  };

  const handleDeleteStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteExternalStream(id);
    setCustomStreams(getSavedExternalStreams());
  };

  const handleBroadcastStream = async (stream: ExternalAmbienceStream) => {
    if (!requireSubscription('Broadcasting audio streams to the party requires a Hero or Guild subscription.')) {
      return;
    }

    if (!activeSession?.code) return;

    try {
      await updateSessionAmbience(activeSession.code, {
        streamId: stream.id,
        title: stream.title,
        url: stream.url,
        sourceType: stream.sourceType,
        embedUrl: stream.embedUrl,
        isPlaying: true,
        category: stream.category,
        changedBy: currentUser?.displayName || 'DM',
        updatedAt: new Date().toISOString()
      });
      setBroadcastStatus(`Broadcasting "${stream.title}" to room ${activeSession.code}`);
      setTimeout(() => setBroadcastStatus(null), 4000);
    } catch (err) {
      console.error('Failed to broadcast stream:', err);
    }
  };

  const handleTogglePlay = async () => {
    if (!requireSubscription('Controlling ambient broadcast requires a Hero or Guild subscription.')) {
      return;
    }
    if (!activeSession?.code || !liveAmbience) return;

    try {
      await updateSessionAmbience(activeSession.code, {
        ...liveAmbience,
        isPlaying: !isPlaying,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to toggle play:', err);
    }
  };

  const handleStop = async () => {
    if (!activeSession?.code || !liveAmbience) return;
    try {
      await updateSessionAmbience(activeSession.code, {
        ...liveAmbience,
        isPlaying: false,
        embedUrl: '',
        title: 'Silence',
        updatedAt: new Date().toISOString()
      });
      setBroadcastStatus('Ambience broadcast stopped.');
      setTimeout(() => setBroadcastStatus(null), 3000);
    } catch (err) {
      console.error('Failed to stop broadcast:', err);
    }
  };

  return {
    customStreams,
    inputUrl,
    setInputUrl,
    customTitle,
    setCustomTitle,
    selectedCategory,
    setSelectedCategory,
    urlParseError,
    setUrlParseError,
    broadcastStatus,
    broadcastToParty,
    setBroadcastToParty,
    isExpanded,
    setIsExpanded,
    isDev,
    isTester,
    hasSubscription,
    liveAmbience,
    isPlaying,
    handleAddStream,
    handleDeleteStream,
    handleBroadcastStream,
    handleTogglePlay,
    handleStop
  };
}
