/**
 * Quick Pill — Notification sound engine
 *
 * Synthesizes an iPhone-like notification chime with the Web Audio API.
 * The default preset ("iOS Bloom") is a soft, bell-like two note chime that
 * mirrors the iOS notification tone.
 *
 * Settings are persisted in localStorage so the Settings window and the
 * Island window stay in sync.
 */

export const SOUND_STORAGE_KEYS = {
  enabled: "qp-notification-sound-enabled",
  preset: "qp-notification-sound",
  volume: "qp-notification-sound-volume",
};

export const DEFAULT_SOUND_PRESET = "ios";
export const DEFAULT_SOUND_VOLUME = 0.6;

const SPARKLE_CHIME_URL = new URL("../../assets/sounds/sparkle-chime.mp3", import.meta.url).href;

export const SOUND_PRESETS = [
  {
    id: "ios",
    name: "iOS Bloom",
    description: "Soft two-note bell — closest to the iPhone notification tone",
  },
  {
    id: "bubble",
    name: "Bubble Pop",
    description: "Rounded upward bloop, friendly and minimal",
  },
  {
    id: "marimba",
    name: "Marimba",
    description: "Warm wooden mallet with a short natural decay",
  },
  {
    id: "radar",
    name: "Radar Ping",
    description: "Crisp digital ping for a distraction free workflow",
  },
  {
    id: "sparkle",
    name: "Sparkle Chime",
    description: "Bright ascending chime with a soft dreamy tail",
    audioUrl: SPARKLE_CHIME_URL,
  },
  {
    id: "silent",
    name: "Silent",
    description: "Keep the visual notification but skip the audio",
  },
];

const PRESET_IDS = SOUND_PRESETS.map((preset) => preset.id);
const PRESETS_BY_ID = new Map(SOUND_PRESETS.map((preset) => [preset.id, preset]));

let sharedContext = null;
let activeAudio = null;

function getStorage(explicit) {
  if (explicit) return explicit;
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch (_) {
    return null;
  }
}

/** Clamp any value into the 0..1 range (NaN safe). */
export function normalizeVolume(value) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num)) return DEFAULT_SOUND_VOLUME;
  return Math.min(1, Math.max(0, num));
}

/**
 * Read the persisted notification sound settings.
 * @param {Storage|null} [storage]
 * @returns {{enabled:boolean, preset:string, volume:number}}
 */
export function getNotificationSoundSettings(storage) {
  const store = getStorage(storage);
  let enabled = true;
  let preset = DEFAULT_SOUND_PRESET;
  let volume = DEFAULT_SOUND_VOLUME;

  if (store) {
    try {
      const rawEnabled = store.getItem(SOUND_STORAGE_KEYS.enabled);
      if (rawEnabled !== null) enabled = rawEnabled !== "false";

      const rawPreset = store.getItem(SOUND_STORAGE_KEYS.preset);
      if (rawPreset && PRESET_IDS.includes(rawPreset)) preset = rawPreset;

      const rawVolume = store.getItem(SOUND_STORAGE_KEYS.volume);
      if (rawVolume !== null) volume = normalizeVolume(rawVolume);
    } catch (_) {
      /* storage unavailable — fall back to defaults */
    }
  }

  return { enabled, preset, volume };
}

/**
 * Persist (a part of) the notification sound settings.
 * @param {{enabled?:boolean, preset?:string, volume?:number}} patch
 * @param {Storage|null} [storage]
 * @returns {{enabled:boolean, preset:string, volume:number}} the resulting settings
 */
export function setNotificationSoundSettings(patch = {}, storage) {
  const store = getStorage(storage);
  const current = getNotificationSoundSettings(store);
  const next = { ...current };

  if (typeof patch.enabled === "boolean") next.enabled = patch.enabled;
  if (patch.preset && PRESET_IDS.includes(patch.preset)) next.preset = patch.preset;
  if (patch.volume !== undefined) next.volume = normalizeVolume(patch.volume);

  if (store) {
    try {
      store.setItem(SOUND_STORAGE_KEYS.enabled, String(next.enabled));
      store.setItem(SOUND_STORAGE_KEYS.preset, next.preset);
      store.setItem(SOUND_STORAGE_KEYS.volume, String(next.volume));
    } catch (_) {
      /* ignore persistence failures */
    }
  }

  return next;
}

/** Lazily create (and resume) the shared AudioContext. */
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  try {
    if (!sharedContext || sharedContext.state === "closed") {
      sharedContext = new Ctx();
    }
    if (sharedContext.state === "suspended" && typeof sharedContext.resume === "function") {
      sharedContext.resume().catch(() => {});
    }
    return sharedContext;
  } catch (_) {
    return null;
  }
}

/**
 * A single FM bell voice — the carrier is modulated by an inharmonic
 * partial which gives the soft metallic "iOS bell" timbre.
 */
function playBell(ctx, dest, options = {}) {
  const {
    freq = 880,
    start = 0,
    duration = 0.55,
    gain = 0.4,
    ratio = 1.41,
    index = 3.4,
    type = "sine",
  } = options;

  const t0 = ctx.currentTime + start;

  const carrier = ctx.createOscillator();
  carrier.type = type;
  carrier.frequency.setValueAtTime(freq, t0);

  const modulator = ctx.createOscillator();
  modulator.type = "sine";
  modulator.frequency.setValueAtTime(freq * ratio, t0);

  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(freq * index, t0);
  modGain.gain.exponentialRampToValueAtTime(Math.max(freq * 0.02, 1), t0 + duration * 0.7);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.014);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(env);
  env.connect(dest);

  modulator.start(t0);
  carrier.start(t0);
  modulator.stop(t0 + duration + 0.05);
  carrier.stop(t0 + duration + 0.05);
}

/** Short filtered sine sweep — used by the "bubble" preset. */
function playBubble(ctx, dest, options = {}) {
  const { start = 0, duration = 0.18, gain = 0.35, from = 420, to = 980 } = options;
  const t0 = ctx.currentTime + start;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + duration * 0.7);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env);
  env.connect(dest);

  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

const PRESET_PLAYERS = {
  // Soft ascending bell — the iPhone notification "bloom"
  ios: (ctx, dest) => {
    playBell(ctx, dest, { freq: 880, duration: 0.5, gain: 0.34, index: 3.2 });
    playBell(ctx, dest, { freq: 1318.51, start: 0.085, duration: 0.42, gain: 0.26, index: 2.6 });
    playBell(ctx, dest, { freq: 440, start: 0, duration: 0.45, gain: 0.1, index: 1.8, ratio: 2.01 });
  },
  bubble: (ctx, dest) => {
    playBubble(ctx, dest, { duration: 0.2, gain: 0.34 });
    playBubble(ctx, dest, { start: 0.09, duration: 0.16, gain: 0.24, from: 520, to: 1180 });
  },
  marimba: (ctx, dest) => {
    playBell(ctx, dest, { freq: 659.25, duration: 0.28, gain: 0.3, index: 1.4, ratio: 3.01, type: "triangle" });
    playBell(ctx, dest, { freq: 987.77, start: 0.07, duration: 0.24, gain: 0.22, index: 1.2, ratio: 3.01, type: "triangle" });
  },
  radar: (ctx, dest) => {
    playBell(ctx, dest, { freq: 1244.51, duration: 0.16, gain: 0.26, index: 1.1, ratio: 2.4, type: "sine" });
  },
  silent: () => {},
};

function stopActiveAudio() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  } catch (_) {
    /* ignore audio cleanup errors */
  }
  activeAudio = null;
}

function getAudioConstructor() {
  if (typeof window !== "undefined" && typeof window.Audio === "function") {
    return window.Audio;
  }
  if (typeof Audio === "function") {
    return Audio;
  }
  return null;
}

function playAudioFile(url, volume) {
  const AudioCtor = getAudioConstructor();
  if (!AudioCtor || !url) return false;

  stopActiveAudio();

  try {
    const audio = new AudioCtor(url);
    audio.volume = volume;
    activeAudio = audio;

    const cleanup = () => {
      if (activeAudio === audio) activeAudio = null;
    };
    if (typeof audio.addEventListener === "function") {
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
    }

    const playResult = audio.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch((err) => {
        cleanup();
        console.error("[Quick Pill] Failed to play audio file preset:", err);
      });
    }
    return true;
  } catch (err) {
    stopActiveAudio();
    console.error("[Quick Pill] Failed to play audio file preset:", err);
    return false;
  }
}

/**
 * Play a notification sound.
 * @param {object} [options]
 * @param {string} [options.preset] preset id override
 * @param {number} [options.volume] volume override (0..1)
 * @param {boolean} [options.enabled] enabled override
 * @param {boolean} [options.ignoreSettings] play even when disabled in settings
 * @returns {boolean} true when a sound was actually scheduled
 */
export function playNotificationSound(options = {}) {
  const settings = getNotificationSoundSettings();
  const enabled = options.enabled ?? settings.enabled;
  if (!enabled) return false;

  const presetId = PRESET_IDS.includes(options.preset) ? options.preset : settings.preset;
  const volume = normalizeVolume(options.volume ?? settings.volume);
  if (volume <= 0) return false;

  const preset = PRESETS_BY_ID.get(presetId);
  if (preset && preset.audioUrl) {
    return playAudioFile(preset.audioUrl, volume);
  }

  stopActiveAudio();

  const player = PRESET_PLAYERS[presetId];
  if (!player) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const master = ctx.createGain();
    master.gain.setValueAtTime(volume * 0.9, ctx.currentTime);

    // Warm up the top end so the chime never sounds harsh
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(9000, ctx.currentTime);
    filter.Q.setValueAtTime(0.6, ctx.currentTime);

    master.connect(filter);
    filter.connect(ctx.destination);

    player(ctx, master);
    return true;
  } catch (err) {
    console.error("[Quick Pill] Failed to play notification sound:", err);
    return false;
  }
}

/**
 * Play the incoming call variant — a double bloom so calls stand out.
 */
export function playCallSound(options = {}) {
  const settings = getNotificationSoundSettings();
  const enabled = options.enabled ?? settings.enabled;
  if (!enabled) return false;

  const presetId = PRESET_IDS.includes(options.preset) ? options.preset : settings.preset;
  const volume = normalizeVolume(options.volume ?? settings.volume);
  if (volume <= 0) return false;

  const preset = PRESETS_BY_ID.get(presetId);
  if (preset && preset.audioUrl) {
    return playAudioFile(preset.audioUrl, volume);
  }

  stopActiveAudio();

  const player = PRESET_PLAYERS[presetId] || PRESET_PLAYERS.ios;
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const master = ctx.createGain();
    master.gain.setValueAtTime(volume * 0.9, ctx.currentTime);
    master.connect(ctx.destination);

    player(ctx, master);
    window.setTimeout(() => player(ctx, master), 320);
    return true;
  } catch (err) {
    console.error("[Quick Pill] Failed to play call sound:", err);
    return false;
  }
}

/**
 * Preview a preset from the Settings window (ignores the master toggle).
 */
export function previewNotificationSound(presetId, options = {}) {
  return playNotificationSound({
    ...options,
    preset: presetId,
    enabled: true,
    volume: options.volume ?? 0.75,
  });
}

export default {
  SOUND_PRESETS,
  SOUND_STORAGE_KEYS,
  getNotificationSoundSettings,
  setNotificationSoundSettings,
  playNotificationSound,
  playCallSound,
  previewNotificationSound,
  normalizeVolume,
};
