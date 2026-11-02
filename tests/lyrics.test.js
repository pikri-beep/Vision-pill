const test = require("node:test");
const assert = require("node:assert");

let normalizer = null;
let lyricsEngine = null;

test("lyrics - load normalizer and lyricsEngine modules", async () => {
  normalizer = await import("../src/services/lyrics/normalizer.js");
  lyricsEngine = await import("../src/services/lyrics/lyricsEngine.js");
  assert.ok(normalizer.cleanTrackTitle);
  assert.ok(normalizer.cleanArtistName);
  assert.ok(normalizer.containsCJK);
  assert.ok(normalizer.extractTrackCandidates);
  assert.ok(lyricsEngine.parseLrc);
  assert.ok(lyricsEngine.resolveLyrics);
  assert.ok(lyricsEngine.isLyricsLanguageCompatible);
});

test("cleanTrackTitle - cleans messy real-world track titles correctly", () => {
  const { cleanTrackTitle } = normalizer;

  // Featuring variants
  assert.strictEqual(cleanTrackTitle("Blinding Lights (feat. Rosalía)"), "Blinding Lights");
  assert.strictEqual(cleanTrackTitle("STAY [feat. Justin Bieber]"), "STAY");
  assert.strictEqual(cleanTrackTitle("Industry Baby ft. Jack Harlow"), "Industry Baby");
  assert.strictEqual(cleanTrackTitle("Cold Heart (with Dua Lipa)"), "Cold Heart");

  // Video and audio tags
  assert.strictEqual(cleanTrackTitle("Never Gonna Give You Up (Official Music Video)"), "Never Gonna Give You Up");
  assert.strictEqual(cleanTrackTitle("Bad Guy [Official Audio]"), "Bad Guy");
  assert.strictEqual(cleanTrackTitle("Enemy [from the series Arcane League of Legends]"), "Enemy");
  assert.strictEqual(cleanTrackTitle("Levitating (Lyric Video)"), "Levitating");
  assert.strictEqual(cleanTrackTitle("Starboy (Visualizer)"), "Starboy");
  assert.strictEqual(cleanTrackTitle("Gurenge [MV]"), "Gurenge");

  // Remaster and deluxe suffixes
  assert.strictEqual(cleanTrackTitle("Bohemian Rhapsody - 2011 Remaster"), "Bohemian Rhapsody");
  assert.strictEqual(cleanTrackTitle("Hotel California - Remastered"), "Hotel California");
  assert.strictEqual(cleanTrackTitle("In The End - Deluxe Edition"), "In The End");
  assert.strictEqual(cleanTrackTitle("Comfortably Numb (Live at Pompeii)"), "Comfortably Numb");

  // Leading track numbers
  assert.strictEqual(cleanTrackTitle("01. Come Together"), "Come Together");
  assert.strictEqual(cleanTrackTitle("04 - Something in the Way"), "Something in the Way");

  // YouTube channel handle suffix
  assert.strictEqual(cleanTrackTitle("Princess - Jangan Pergi MV (Official Music Video) | @Princess_Ind"), "Princess - Jangan Pergi");

  // Edge cases
  assert.strictEqual(cleanTrackTitle(""), "");
  assert.strictEqual(cleanTrackTitle(null), "");
  assert.strictEqual(cleanTrackTitle(undefined), "");
});

test("cleanArtistName - extracts primary artist name correctly", () => {
  const { cleanArtistName } = normalizer;

  assert.strictEqual(cleanArtistName("The Weeknd • Pop"), "The Weeknd");
  assert.strictEqual(cleanArtistName("Post Malone, Swae Lee"), "Post Malone");
  assert.strictEqual(cleanArtistName("Billie Eilish & Khalid"), "Billie Eilish");
  assert.strictEqual(cleanArtistName("Ed Sheeran feat. Justin Bieber"), "Ed Sheeran");
  assert.strictEqual(cleanArtistName("Marshmello x Juice WRLD"), "Marshmello");
  assert.strictEqual(cleanArtistName("Coldplay / BTS"), "Coldplay");
  assert.strictEqual(cleanArtistName("@Princess_Ind"), "");
  assert.strictEqual(cleanArtistName(""), "");
  assert.strictEqual(cleanArtistName(null), "");
});

test("containsCJK - correctly identifies Chinese, Japanese, Korean characters", () => {
  const { containsCJK } = normalizer;

  assert.strictEqual(containsCJK("Princess - Jangan Pergi"), false);
  assert.strictEqual(containsCJK("Aprilio Kingdom"), false);
  assert.strictEqual(containsCJK("SP: Warner Chappell Music"), false);
  assert.strictEqual(containsCJK("作词 : 周杰伦"), true);
  assert.strictEqual(containsCJK("春よ、来い"), true);
  assert.strictEqual(containsCJK("강남스타일"), true);
  assert.strictEqual(containsCJK("English and 中文 mixed"), true);
});

test("extractTrackCandidates - handles YouTube Artist - Title formats", () => {
  const { extractTrackCandidates } = normalizer;

  const rawTitle = "Princess - Jangan Pergi MV (Official Music Video) | @Princess_Ind";
  const rawArtist = "Aprilio Kingdom";

  const candidates = extractTrackCandidates(rawTitle, rawArtist);
  assert.ok(Array.isArray(candidates));
  assert.ok(candidates.length >= 2);

  // Priority 1 should be the extracted artist and song title from the YouTube video title
  assert.strictEqual(candidates[0].artist, "Princess");
  assert.strictEqual(candidates[0].title, "Jangan Pergi");

  // Priority 2 should be the fallback with raw channel as artist
  assert.strictEqual(candidates[1].title, "Princess - Jangan Pergi");
  assert.strictEqual(candidates[1].artist, "Aprilio Kingdom");
});

test("parseLrc - parses standard and fractional timestamped lines", () => {
  const { parseLrc } = lyricsEngine;

  const sampleLrc = `
    [ti:Test Song]
    [ar:Test Artist]
    [00:12.50]First line of the song
    [00:18.250]Second line with 3-digit ms
    [01:05.00]Chorus starts here
  `;

  const parsed = parseLrc(sampleLrc);
  assert.ok(Array.isArray(parsed));
  assert.strictEqual(parsed.length, 3);
  assert.strictEqual(parsed[0].time, 12.5);
  assert.strictEqual(parsed[0].text, "First line of the song");
  assert.strictEqual(parsed[1].time, 18.25);
  assert.strictEqual(parsed[1].text, "Second line with 3-digit ms");
  assert.strictEqual(parsed[2].time, 65);
  assert.strictEqual(parsed[2].text, "Chorus starts here");
});

test("parseLrc - filters out metadata credit and publisher lines", () => {
  const { parseLrc } = lyricsEngine;

  const sampleLrcWithCredits = `
    [00:01.00]作词 : Kevin Aprilio
    [00:02.00]作曲 : Kevin Aprilio
    [00:03.00]SP: Warner Chappell Music Publishing
    [00:04.00]Produced by: Aprilio Kingdom
    [00:10.50]Kau buat aku menangis lagi
    [00:15.20]Tolong jangan pergi dari hidupku
  `;

  const parsed = parseLrc(sampleLrcWithCredits);
  assert.ok(Array.isArray(parsed));
  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].time, 10.5);
  assert.strictEqual(parsed[0].text, "Kau buat aku menangis lagi");
  assert.strictEqual(parsed[1].time, 15.2);
  assert.strictEqual(parsed[1].text, "Tolong jangan pergi dari hidupku");
});

test("parseLrc - handles multiple timestamps on a single line and unsorted order", () => {
  const { parseLrc } = lyricsEngine;

  const sample = `
    [00:30.00]Third line
    [00:10.00][00:20.00]Repeated line with two timestamps
  `;

  const parsed = parseLrc(sample);
  assert.ok(Array.isArray(parsed));
  assert.strictEqual(parsed.length, 3);
  // Must be sorted ascending
  assert.strictEqual(parsed[0].time, 10);
  assert.strictEqual(parsed[0].text, "Repeated line with two timestamps");
  assert.strictEqual(parsed[1].time, 20);
  assert.strictEqual(parsed[1].text, "Repeated line with two timestamps");
  assert.strictEqual(parsed[2].time, 30);
  assert.strictEqual(parsed[2].text, "Third line");
});

test("parseLrc - returns null on empty or non-timestamped content", () => {
  const { parseLrc } = lyricsEngine;
  assert.strictEqual(parseLrc(""), null);
  assert.strictEqual(parseLrc(null), null);
  assert.strictEqual(parseLrc("Just plain lyrics without timestamps\nLine 2"), null);
});

test("isLyricsLanguageCompatible - rejects CJK lyrics when query is in Latin script", () => {
  const { isLyricsLanguageCompatible } = lyricsEngine;

  // Non-CJK query with CJK lyrics -> reject
  assert.strictEqual(isLyricsLanguageCompatible("Jangan Pergi", "Princess", "作词: 周杰伦\n你听得到"), false);
  // Non-CJK query with Latin lyrics -> accept
  assert.strictEqual(isLyricsLanguageCompatible("Jangan Pergi", "Princess", "Kau buat aku menangis"), true);
  // CJK query with CJK lyrics -> accept
  assert.strictEqual(isLyricsLanguageCompatible("晴天", "周杰伦", "故事的小黄花 从出生那年就飘着"), true);
});

test("applyLyricOffset - shifts timestamps by offset in seconds", () => {
  const { applyLyricOffset } = lyricsEngine;

  const lines = [
    { time: 10, text: "Line 1" },
    { time: 25.5, text: "Line 2" }
  ];

  const delayed = applyLyricOffset(lines, 0.5);
  assert.strictEqual(delayed[0].time, 10.5);
  assert.strictEqual(delayed[1].time, 26);

  const advanced = applyLyricOffset(lines, -1.0);
  assert.strictEqual(advanced[0].time, 9);
  assert.strictEqual(advanced[1].time, 24.5);

  // Does not go negative
  const zeroFloor = applyLyricOffset([{ time: 0.2, text: "Intro" }], -0.5);
  assert.strictEqual(zeroFloor[0].time, 0);
});

test("findActiveLyricIndex - accurately identifies active line from playback position", () => {
  const { findActiveLyricIndex } = lyricsEngine;

  const lines = [
    { time: 5, text: "Intro" },
    { time: 15, text: "Verse 1" },
    { time: 30, text: "Chorus" },
    { time: 50, text: "Outro" }
  ];

  assert.strictEqual(findActiveLyricIndex(lines, 0), 0);
  assert.strictEqual(findActiveLyricIndex(lines, 5), 0);
  assert.strictEqual(findActiveLyricIndex(lines, 14.9), 0);
  assert.strictEqual(findActiveLyricIndex(lines, 15), 1);
  assert.strictEqual(findActiveLyricIndex(lines, 29), 1);
  assert.strictEqual(findActiveLyricIndex(lines, 30), 2);
  assert.strictEqual(findActiveLyricIndex(lines, 45), 2);
  assert.strictEqual(findActiveLyricIndex(lines, 55), 3);
});

test("resolveLyrics - handles mock fetch fallback and rejects CJK mismatch", async () => {
  const { resolveLyrics, clearLyricsCache } = lyricsEngine;
  clearLyricsCache();

  // Mock fetch where LRCLIB returns nothing, and NetEase tries to return Chinese song for Indonesian query
  const mockFetch = async (url) => {
    if (url.includes("lrclib.net")) {
      return { ok: false, status: 404 };
    }
    if (url.includes("neteaseapiv2/search")) {
      return {
        ok: true,
        json: async () => ({
          result: {
            songs: [{ id: 9999 }]
          }
        })
      };
    }
    if (url.includes("neteaseapiv2/lyric")) {
      return {
        ok: true,
        json: async () => ({
          lrc: {
            lyric: "[00:05.00]作词 : 方文山\n[00:10.00]最美的不是下雨天 是曾与你躲过雨的屋檐"
          }
        })
      };
    }
    return { ok: false };
  };

  // Searching Indonesian track should reject the Chinese NetEase response
  const result = await resolveLyrics("Princess - Jangan Pergi MV | @Princess_Ind", "Aprilio Kingdom", 210, null, mockFetch);
  assert.strictEqual(result.source, "not-found");
  assert.strictEqual(result.synced, null);
});
