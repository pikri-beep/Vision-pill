/**
 * Track title and artist normalizer for Quick Pill Lyrics Engine.
 * Strips noise, bracketed descriptions, video annotations, remaster notes,
 * and featuring credits to maximize search hit rates on LRCLIB and NetEase.
 */

/**
 * Checks if a string contains Chinese, Japanese, or Korean (CJK) characters.
 * @param {string} text
 * @returns {boolean}
 */
export function containsCJK(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af]/.test(text);
}

/**
 * Normalizes a raw track title into a clean query token.
 * @param {string} title - Raw track title from media session.
 * @returns {string} - Cleaned track title.
 */
export function cleanTrackTitle(title) {
  if (!title || typeof title !== 'string') return '';

  return title
    // Strip trailing channel handles: " | @Princess_Ind", " - @Channel"
    .replace(/\s*\|\s*@[A-Za-z0-9_.-]+.*$/gi, '')
    // Strip leading track numbers like "01. ", "1 - ", "04 "
    .replace(/^\d+[\.\-\s]+/, '')
    // Strip featuring annotations in parens or brackets
    .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|with|featuring)\s+[^()\[\]]+[\)\]]/gi, '')
    // Strip trailing featuring text without brackets
    .replace(/\s+(?:feat\.?|ft\.?|with|featuring)\s+.*$/gi, '')
    // Strip official video / audio / visualizer annotations
    .replace(/\s*[\(\[]\s*(?:official\s+(?:music\s+)?(?:video|audio|lyric\s+video|visualizer)|mv|4k|hd|visualizer|lyric\s+video|audio|lyrics)[\)\]]/gi, '')
    // Strip standalone MV at end
    .replace(/\s+(?:MV|PV)\b/gi, '')
    // Strip live recordings, acoustic, instrumental, karaoke tags
    .replace(/\s*[\(\[]\s*(?:live(?:\s+at[^()\[\]]*)?|acoustic(?:\s+version)?|instrumental|karaoke|orchestral)[\)\]]/gi, '')
    // Strip remaster / bonus track suffixes: " - 2024 Remaster", " - Remastered", " - Deluxe"
    .replace(/\s*-\s*(?:remastered|remaster|\d{4}\s+remaster|deluxe(?:\s+edition)?|bonus\s+track|radio\s+edit|single\s+version|anniversary\s+edition).*$/gi, '')
    // Strip bracketed remaster years like "(2011 Remaster)"
    .replace(/\s*[\(\[]\s*\d{4}\s+remaster(?:ed)?[\)\]]/gi, '')
    // Strip common soundtrack / OST annotations: ' - From "Movie"', '[from the series Arcane]'
    .replace(/\s*-\s*from\s+.*$/gi, '')
    .replace(/\s*[\(\[]\s*from\s+[^()\[\]]+[\)\]]/gi, '')
    // Strip extraneous quotes
    .replace(/^["']|["']$/g, '')
    .trim();
}

/**
 * Extracts the primary artist name for search queries.
 * @param {string} artist - Raw artist string from media session.
 * @returns {string} - Primary artist name.
 */
export function cleanArtistName(artist) {
  if (!artist || typeof artist !== 'string') return '';

  return artist
    // Strip channel handles like "@Princess_Ind"
    .replace(/^@[A-Za-z0-9_.-]+/, '')
    // Remove bracketed info like "(feat. X)"
    .replace(/\s*[\(\[][^()\[\]]*[\)\]]/g, '')
    // Split on multi-artist delimiters and take primary
    .split('•')[0]
    .split(',')[0]
    .split('&')[0]
    .split(' / ')[0]
    .split(/\s+(?:feat\.?|ft\.?|with|featuring|x)\s+/i)[0]
    .trim();
}

/**
 * Generates prioritized candidate pairs of { title, artist } for search engines.
 * Resolves browser/YouTube titles formatted as "Artist - Title" where GSMTC reports the channel name as artist.
 *
 * @param {string} rawTitle
 * @param {string} rawArtist
 * @returns {Array<{ title: string, artist: string }>}
 */
export function extractTrackCandidates(rawTitle, rawArtist) {
  const candidates = [];
  const baseTitle = (rawTitle || '').replace(/\s*\|\s*@[A-Za-z0-9_.-]+.*$/gi, '').trim();
  const cTitle = cleanTrackTitle(baseTitle);
  const cArtist = cleanArtistName(rawArtist);

  // If title has "Artist - Song Title" pattern (very common on YouTube / Soundcloud)
  if (baseTitle.includes(' - ')) {
    const parts = baseTitle.split(/\s+-\s+/);
    if (parts.length >= 2) {
      const parsedArtist = cleanArtistName(parts[0]);
      const parsedTitle = cleanTrackTitle(parts.slice(1).join(' - '));

      if (parsedArtist && parsedTitle) {
        // Priority 1: YouTube split (Artist = parts[0], Title = parts[1])
        candidates.push({ title: parsedTitle, artist: parsedArtist });
      }
    }
  }

  // Priority 2: Standard cleaned title & cleaned artist
  if (cTitle && cArtist) {
    if (!candidates.some(c => c.title.toLowerCase() === cTitle.toLowerCase() && c.artist.toLowerCase() === cArtist.toLowerCase())) {
      candidates.push({ title: cTitle, artist: cArtist });
    }
  }

  // Priority 3: Title only (fallback when channel/uploader is not the artist)
  if (cTitle) {
    if (!candidates.some(c => c.title.toLowerCase() === cTitle.toLowerCase() && c.artist === '')) {
      candidates.push({ title: cTitle, artist: '' });
    }
  }

  return candidates.length > 0 ? candidates : [{ title: cTitle || rawTitle || '', artist: cArtist || rawArtist || '' }];
}

/**
 * Builds an optimal fuzzy search query string combining cleaned title and artist.
 * @param {string} title
 * @param {string} artist
 * @returns {string}
 */
export function buildSearchQuery(title, artist) {
  const cTitle = cleanTrackTitle(title);
  const cArtist = cleanArtistName(artist);
  if (cTitle && cArtist) return `${cTitle} ${cArtist}`.trim();
  return (cTitle || cArtist || '').trim();
}
