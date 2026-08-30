// Audio and Ambience types for external YouTube / Spotify playlists & streams

export type AmbienceSourceType = 'youtube' | 'spotify' | 'audio_url';

export interface ExternalAmbienceStream {
  id: string;
  title: string;
  url: string;
  sourceType: AmbienceSourceType;
  embedUrl: string;
  category?: 'combat' | 'tavern' | 'exploration' | 'dungeon' | 'mystic' | 'boss' | 'custom';
  description?: string;
  addedBy?: string;
  addedAt?: string;
}

export interface ActiveSessionAmbience {
  streamId?: string;
  title: string;
  url: string;
  sourceType: AmbienceSourceType;
  embedUrl: string;
  isPlaying: boolean;
  category?: string;
  changedBy?: string;
  updatedAt?: string;
}

/**
 * Parses user input URL (YouTube video/playlist, Spotify playlist/track/album, or direct MP3/Audio stream)
 * and returns the normalized source type and safe embed URL.
 */
export function parseExternalMediaUrl(rawUrl: string): {
  isValid: boolean;
  sourceType: AmbienceSourceType;
  embedUrl: string;
  titleSuggestion: string;
  error?: string;
} {
  // Strip enclosing brackets, quotes, or whitespace
  let trimmed = (rawUrl || '').trim().replace(/^[<"']+|[>"']+$/g, '');
  if (!trimmed) {
    return {
      isValid: false,
      sourceType: 'youtube',
      embedUrl: '',
      titleSuggestion: '',
      error: 'Please provide a valid YouTube or Spotify link.'
    };
  }

  // 1. YouTube Video, Playlist, Shorts, Live, or YouTube Music
  // Examples:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // https://youtu.be/dQw4w9WgXcQ
  // https://www.youtube.com/playlist?list=PL1234567890
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  // https://www.youtube.com/live/dQw4w9WgXcQ
  // https://www.youtube.com/shorts/dQw4w9WgXcQ
  // https://music.youtube.com/watch?v=dQw4w9WgXcQ
  const ytPlaylistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  const ytVideoMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i
  );

  if (ytVideoMatch && ytPlaylistMatch) {
    const videoId = ytVideoMatch[1];
    const listId = ytPlaylistMatch[1];
    return {
      isValid: true,
      sourceType: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?list=${listId}&autoplay=1&enablejsapi=1`,
      titleSuggestion: 'YouTube Soundtrack'
    };
  }

  if (ytPlaylistMatch && !ytVideoMatch) {
    const listId = ytPlaylistMatch[1];
    return {
      isValid: true,
      sourceType: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&autoplay=1&enablejsapi=1`,
      titleSuggestion: 'YouTube Soundtrack Playlist'
    };
  }

  if (ytVideoMatch) {
    const videoId = ytVideoMatch[1];
    return {
      isValid: true,
      sourceType: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
      titleSuggestion: 'YouTube Ambience Stream'
    };
  }

  // 2. Spotify Playlist, Track, Album, Artist, Episode, or Show
  // Supports:
  // - https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl
  // - https://open.spotify.com/intl-de/track/11dFghVXANMlKmJXsNCbNl?si=...
  // - https://open.spotify.com/intl-en/playlist/37i9dQZF1DXcBWIGoYBM5M
  // - https://open.spotify.com/intl-es/album/42eZ2aXz3Z7nJt9n6n9h2S
  // - https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl
  // - https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M
  // - spotify:track:11dFghVXANMlKmJXsNCbNl
  // - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const spotifyWebMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-zA-Z]{2,5}\/)?(?:embed\/)?(track|playlist|album|artist|episode|show)\/([a-zA-Z0-9]+)/i
  );
  const spotifyUriMatch = trimmed.match(
    /^spotify:(track|playlist|album|artist|episode|show):([a-zA-Z0-9]+)/i
  );

  if (spotifyWebMatch || spotifyUriMatch) {
    const match = spotifyWebMatch || spotifyUriMatch!;
    const rawType = match[1].toLowerCase();
    const id = match[2];
    const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1);
    return {
      isValid: true,
      sourceType: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${rawType}/${id}?utm_source=generator&theme=0`,
      titleSuggestion: `Spotify ${typeLabel}`
    };
  }

  // 3. Direct Audio Stream / MP3 URL
  if (
    trimmed.match(/\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i) ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return {
      isValid: true,
      sourceType: 'audio_url',
      embedUrl: trimmed,
      titleSuggestion: 'Direct Audio Stream'
    };
  }

  return {
    isValid: false,
    sourceType: 'youtube',
    embedUrl: '',
    titleSuggestion: '',
    error: 'Unrecognized URL format. Please paste a YouTube link (video/playlist/shorts/live) or a Spotify link (track/playlist/album).'
  };
}

const STORAGE_SAVED_LINKS_KEY = 'nexus_saved_external_ambience_links';

/**
 * Loads custom DM saved media playlists from local storage
 */
export function getSavedExternalStreams(): ExternalAmbienceStream[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new custom external media stream link
 */
export function saveExternalStream(stream: Omit<ExternalAmbienceStream, 'id' | 'addedAt'>): ExternalAmbienceStream {
  const all = getSavedExternalStreams();
  const newStream: ExternalAmbienceStream = {
    ...stream,
    id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    addedAt: new Date().toISOString()
  };
  const updated = [newStream, ...all.filter(s => s.url !== stream.url)];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SAVED_LINKS_KEY, JSON.stringify(updated.slice(0, 50)));
  }
  return newStream;
}

/**
 * Deletes a saved stream link
 */
export function deleteExternalStream(id: string): void {
  const all = getSavedExternalStreams();
  const updated = all.filter(s => s.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SAVED_LINKS_KEY, JSON.stringify(updated));
  }
}
