/**
 * Resilient Multi-Tier Lyrics Engine for Quick Pill.
 * Integrates Normalizer, LRCLIB API, NetEase Cloud Music Fallback,
 * and Persistent Caching with Manual Offset Timing Support.
 */

import {
  cleanTrackTitle,
  cleanArtistName,
  buildSearchQuery,
  extractTrackCandidates,
  containsCJK
} from './normalizer.js';

// In-memory cache across track switches
const memoryCache = new Map();

/**
 * Filter out credit/publisher metadata headers from raw lyrics.
 */
const METADATA_LINE_REGEX = /^(?:作词|作曲|编曲|制作|监制|发行|SP|OP|Written\s+by|Produced\s+by|Publisher|Composer|Arranger|Lyricist)\s*[:：]/i;

/**
 * Parses raw LRC strings into a sorted array of { time: number, text: string } objects.
 * Handles multiple timestamp tags on a single line, 2-digit and 3-digit fractional seconds,
 * skips metadata tags like [ar: ...], [ti: ...], [offset: ...], and filters out publisher/credit lines.
 *
 * @param {string} lrcText - Raw .lrc string
 * @returns {Array<{ time: number, text: string }> | null}
 */
export function parseLrc(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return null;

  const lines = lrcText.split(/\r?\n/);
  const result = [];
  const timestampRegex = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if line contains at least one valid timestamp tag
    const matches = [...line.matchAll(timestampRegex)];
    if (matches.length === 0) continue;

    // Extract text after removing all timestamp tags
    const text = line.replace(timestampRegex, '').trim();
    if (!text) continue;

    // Skip publisher/metadata credit lines
    if (METADATA_LINE_REGEX.test(text)) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const totalSeconds = Math.max(0, minutes * 60 + seconds);
      result.push({ time: Math.round(totalSeconds * 100) / 100, text });
    }
  }

  if (result.length === 0) return null;

  // Sort ascending by time
  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Checks whether the fetched lyrics text is language-compatible with the search query.
 * Rejects Chinese/Japanese/Korean lyrics for non-CJK queries to prevent mismatched covers/fallbacks.
 *
 * @param {string} queryTitle
 * @param {string} queryArtist
 * @param {string} lyricsText
 * @returns {boolean}
 */
export function isLyricsLanguageCompatible(queryTitle, queryArtist, lyricsText) {
  if (!lyricsText || typeof lyricsText !== 'string') return false;
  const queryHasCJK = containsCJK(queryTitle) || containsCJK(queryArtist);
  // If the query does not contain CJK, but lyrics text contains CJK, reject
  if (!queryHasCJK && containsCJK(lyricsText)) {
    return false;
  }
  return true;
}

/**
 * Applies a timing offset in seconds to all lines in a synced lyrics array.
 * @param {Array<{ time: number, text: string }>} synced - Synced lyrics lines
 * @param {number} offsetSeconds - Offset in seconds (positive to delay, negative to advance)
 * @returns {Array<{ time: number, text: string }>}
 */
export function applyLyricOffset(synced, offsetSeconds = 0) {
  if (!Array.isArray(synced)) return [];
  if (!offsetSeconds || isNaN(offsetSeconds)) return synced;
  return synced.map(line => ({
    ...line,
    time: Math.max(0, Math.round((line.time + offsetSeconds) * 100) / 100)
  }));
}

/**
 * Formats seconds into MM:SS string for display.
 * @param {number} seconds
 * @returns {string}
 */
export function formatLyricTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Finds the index of the currently active lyric line given playback position.
 * @param {Array<{ time: number, text: string }>} synced
 * @param {number} positionSeconds
 * @returns {number}
 */
export function findActiveLyricIndex(synced, positionSeconds) {
  if (!Array.isArray(synced) || synced.length === 0) return 0;
  const pos = typeof positionSeconds === 'number' && !isNaN(positionSeconds) ? positionSeconds : 0;
  return synced.reduce((bestIdx, item, idx) => (pos >= item.time ? idx : bestIdx), 0);
}

/**
 * Multi-tier lyrics resolver.
 * 1. Checks memory & localStorage cache.
 * 2. Iterates candidates (YouTube "Artist - Title" split, Cleaned Title/Artist).
 * 3. Tier 1: LRCLIB exact match.
 * 4. Tier 2: LRCLIB fuzzy search with duration scoring.
 * 5. Tier 3: NetEase Cloud Music API fallback (with CJK guard).
 *
 * @param {string} title - Track title
 * @param {string} artist - Artist name
 * @param {number} [duration=0] - Track duration in seconds
 * @param {object} [customQuery=null] - Optional manual override { title, artist }
 * @param {object} [fetchFn=fetch] - Custom fetch implementation for testing
 * @returns {Promise<{ synced: Array<{ time: number, text: string }> | null, plain: string[] | null, source: string, cleanTitle: string, cleanArtist: string }>}
 */
export async function resolveLyrics(title, artist, duration = 0, customQuery = null, fetchFn = (typeof fetch !== 'undefined' ? fetch : null)) {
  const cleanTitle = (customQuery?.title || cleanTrackTitle(title)).trim();
  const cleanArtist = (customQuery?.artist || cleanArtistName(artist)).trim();

  if (!cleanTitle || cleanTitle.toLowerCase() === 'unknown title') {
    return { synced: null, plain: null, source: 'none', cleanTitle, cleanArtist };
  }

  const cacheKey = `qp_lyrics_${cleanTitle}_${cleanArtist}`.toLowerCase();

  // Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return { ...memoryCache.get(cacheKey), cached: true };
  }

  // Check persistent storage cache
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache.set(cacheKey, parsed);
        return { ...parsed, cached: true };
      }
    }
  } catch (_) {}

  const headers = {
    'User-Agent': 'QuickPill-Dynamic-Island/5.7.2 (https://github.com/pikri-beep/Vision-pill)'
  };

  const saveAndReturn = (result) => {
    const payload = {
      synced: result.synced || null,
      plain: result.plain || null,
      source: result.source || 'none',
      cleanTitle,
      cleanArtist
    };
    memoryCache.set(cacheKey, payload);
    try {
      if (typeof localStorage !== 'undefined' && (payload.synced || payload.plain)) {
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      }
    } catch (_) {}
    return payload;
  };

  if (!fetchFn) {
    return { synced: null, plain: null, source: 'no-fetch', cleanTitle, cleanArtist };
  }

  // Generate candidates to test
  const candidates = customQuery
    ? [{ title: customQuery.title.trim(), artist: (customQuery.artist || '').trim() }]
    : extractTrackCandidates(title, artist);

  for (const candidate of candidates) {
    const candTitle = candidate.title;
    const candArtist = candidate.artist;
    if (!candTitle) continue;

    // --- Tier 1: LRCLIB Exact Lookup ---
    try {
      let exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(candTitle)}`;
      if (candArtist) {
        exactUrl += `&artist_name=${encodeURIComponent(candArtist)}`;
      }
      const res = await fetchFn(exactUrl, { headers });
      if (res && res.ok) {
        const data = await res.json();
        const rawContent = data?.syncedLyrics || data?.plainLyrics || '';
        if (rawContent && isLyricsLanguageCompatible(candTitle, candArtist, rawContent)) {
          return saveAndReturn({
            synced: parseLrc(data.syncedLyrics),
            plain: data.plainLyrics ? data.plainLyrics.split(/\r?\n/).filter(line => line.trim().length > 0 && !METADATA_LINE_REGEX.test(line.trim())) : null,
            source: 'lrclib-exact'
          });
        }
      }
    } catch (_) {}

    // --- Tier 2: LRCLIB Search with Duration Scoring ---
    try {
      const query = candArtist ? `${candTitle} ${candArtist}` : candTitle;
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetchFn(searchUrl, { headers });
      if (res && res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          // Filter out language mismatches
          const compatible = list.filter(item => {
            const content = item.syncedLyrics || item.plainLyrics || '';
            return isLyricsLanguageCompatible(candTitle, candArtist, content);
          });

          if (compatible.length > 0) {
            let bestCandidate = null;
            if (duration > 0) {
              bestCandidate = compatible.find(item => item.syncedLyrics && Math.abs((item.duration || 0) - duration) <= 4);
            }
            if (!bestCandidate) {
              bestCandidate = compatible.find(item => item.syncedLyrics);
            }
            if (!bestCandidate) {
              bestCandidate = compatible.find(item => item.plainLyrics);
            }

            if (bestCandidate) {
              return saveAndReturn({
                synced: parseLrc(bestCandidate.syncedLyrics),
                plain: bestCandidate.plainLyrics ? bestCandidate.plainLyrics.split(/\r?\n/).filter(line => line.trim().length > 0 && !METADATA_LINE_REGEX.test(line.trim())) : null,
                source: 'lrclib-search'
              });
            }
          }
        }
      }
    } catch (_) {}

    // --- Tier 3: NetEase Cloud Music Fallback (Strict CJK Guard) ---
    try {
      const query = candArtist ? `${candTitle} ${candArtist}` : candTitle;
      const neteaseSearchUrl = `https://music.xianqiao.wang/neteaseapiv2/search?keywords=${encodeURIComponent(query)}&limit=3`;
      const res = await fetchFn(neteaseSearchUrl);
      if (res && res.ok) {
        const searchData = await res.json();
        const songs = searchData?.result?.songs || [];
        for (const song of songs) {
          if (!song.id) continue;
          const lyricRes = await fetchFn(`https://music.xianqiao.wang/neteaseapiv2/lyric?id=${song.id}`);
          if (lyricRes && lyricRes.ok) {
            const lyricData = await lyricRes.json();
            const rawLrc = lyricData?.lrc?.lyric;
            if (rawLrc && isLyricsLanguageCompatible(candTitle, candArtist, rawLrc)) {
              const parsed = parseLrc(rawLrc);
              if (parsed && parsed.length > 0) {
                return saveAndReturn({
                  synced: parsed,
                  plain: null,
                  source: 'netease'
                });
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  return saveAndReturn({ synced: null, plain: null, source: 'not-found' });
}

/**
 * Clears the memory cache for a specific track or entirely.
 * @param {string} [title]
 * @param {string} [artist]
 */
export function clearLyricsCache(title = null, artist = null) {
  if (title && artist) {
    const key = `qp_lyrics_${cleanTrackTitle(title)}_${cleanArtistName(artist)}`.toLowerCase();
    memoryCache.delete(key);
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch (_) {}
  } else {
    memoryCache.clear();
  }
}
