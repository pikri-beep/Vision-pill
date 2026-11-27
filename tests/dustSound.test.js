const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const { fileURLToPath } = require("node:url");

/* ------------------------------------------------------------------ *
 * Minimal DOM stub so the renderer side services can be exercised
 * inside plain node (no jsdom dependency in this repo).
 * ------------------------------------------------------------------ */
function createFakeElement(tag) {
  const classes = new Set();
  const el = {
    tagName: String(tag).toUpperCase(),
    get className() {
      return [...classes].join(" ");
    },
    set className(value) {
      classes.clear();
      String(value || "").split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
    },
    style: {
      _props: {},
      setProperty(name, value) { this._props[name] = value; },
      getPropertyValue(name) { return this._props[name]; }
    },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    },
    children: [],
    parent: null,
    isConnected: true,
    setAttribute() {},
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    remove() {
      if (this.parent) {
        this.parent.children = this.parent.children.filter((c) => c !== this);
        this.parent = null;
      }
      this.isConnected = false;
    },
    getBoundingClientRect() {
      return { left: 10, top: 20, width: 120, height: 30, right: 130, bottom: 50 };
    }
  };
  return el;
}

function createFakeDom() {
  const body = createFakeElement("body");
  return {
    body,
    createElement: (tag) => createFakeElement(tag)
  };
}

function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map
  };
}

const fakeDom = createFakeDom();

global.window = {
  setTimeout,
  clearTimeout,
  matchMedia: () => ({ matches: false }),
  localStorage: createFakeStorage()
};
global.document = fakeDom;

let modulesPromise = null;
function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import("../src/services/audio/notificationSound.js"),
      import("../src/services/dust/dustBurst.js")
    ]);
  }
  return modulesPromise.then(([sound, dust]) => ({ sound, dust }));
}

/* ---------------------------- Sound tests ---------------------------- */

test("notification sound - defaults to the iOS preset with sound enabled", async () => {
  const { sound } = await loadModules();
  const settings = sound.getNotificationSoundSettings(createFakeStorage());
  assert.strictEqual(settings.enabled, true);
  assert.strictEqual(settings.preset, "ios");
  assert.strictEqual(settings.volume, sound.DEFAULT_SOUND_VOLUME);
});

test("notification sound - persists enabled / preset / volume", async () => {
  const { sound } = await loadModules();
  const storage = createFakeStorage();
  const saved = sound.setNotificationSoundSettings({ enabled: false, preset: "marimba", volume: 0.25 }, storage);

  assert.strictEqual(saved.enabled, false);
  assert.strictEqual(saved.preset, "marimba");
  assert.strictEqual(saved.volume, 0.25);

  const reloaded = sound.getNotificationSoundSettings(storage);
  assert.deepStrictEqual(reloaded, { enabled: false, preset: "marimba", volume: 0.25 });
});

test("notification sound - ignores unknown presets and clamps volume", async () => {
  const { sound } = await loadModules();
  const storage = createFakeStorage();
  sound.setNotificationSoundSettings({ preset: "not-a-real-preset", volume: 4 }, storage);

  const settings = sound.getNotificationSoundSettings(storage);
  assert.strictEqual(settings.preset, "ios");
  assert.strictEqual(settings.volume, 1);

  assert.strictEqual(sound.normalizeVolume(-2), 0);
  assert.strictEqual(sound.normalizeVolume("0.5"), 0.5);
  assert.strictEqual(sound.normalizeVolume("nope"), sound.DEFAULT_SOUND_VOLUME);
});

test("notification sound - every preset has a unique id and a label", async () => {
  const { sound } = await loadModules();
  const ids = sound.SOUND_PRESETS.map((p) => p.id);
  assert.deepStrictEqual(ids, [...new Set(ids)]);
  assert.ok(ids.includes("ios"));
  assert.ok(ids.includes("silent"));
  sound.SOUND_PRESETS.forEach((preset) => {
    assert.ok(preset.name && preset.description, `preset ${preset.id} needs a name and description`);
  });
});

test("notification sound - degrades gracefully without Web Audio support", async () => {
  const { sound } = await loadModules();
  assert.strictEqual(sound.playNotificationSound({ enabled: true, preset: "ios" }), false);
  assert.strictEqual(sound.playNotificationSound({ enabled: false }), false);
  assert.strictEqual(sound.playNotificationSound({ enabled: true, preset: "ios", volume: 0 }), false);
});

test("notification sound - includes sparkle audio-file preset with bundled mp3 and keeps iOS default", async () => {
  const { sound } = await loadModules();
  assert.strictEqual(sound.DEFAULT_SOUND_PRESET, "ios");

  const sparkle = sound.SOUND_PRESETS.find((p) => p.id === "sparkle");
  assert.ok(sparkle, "sparkle preset should exist in SOUND_PRESETS");
  assert.ok(sparkle.name && sparkle.description, "sparkle preset needs name and description");
  assert.strictEqual(typeof sparkle.audioUrl, "string", "sparkle preset should expose an audioUrl");
  assert.ok(sparkle.audioUrl.endsWith(".mp3"), "sparkle audioUrl should point to an mp3 file");

  const filePath = fileURLToPath(sparkle.audioUrl);
  assert.strictEqual(fs.existsSync(filePath), true, `bundled audio asset must exist at ${filePath}`);
  assert.ok(fs.statSync(filePath).size > 0, "bundled audio asset must not be empty");
});

test("notification sound - persists and reloads sparkle preset", async () => {
  const { sound } = await loadModules();
  const storage = createFakeStorage();
  const saved = sound.setNotificationSoundSettings({ preset: "sparkle" }, storage);
  assert.strictEqual(saved.preset, "sparkle");

  const reloaded = sound.getNotificationSoundSettings(storage);
  assert.strictEqual(reloaded.preset, "sparkle");
});

test("notification sound - plays audio-file preset with volume and stops previous playback", async () => {
  const { sound } = await loadModules();
  const instances = [];

  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      this.currentTime = 0;
      this.playCalls = 0;
      this.pauseCalls = 0;
      instances.push(this);
    }
    play() {
      this.playCalls += 1;
      this.currentTime = 1.2;
      return Promise.resolve();
    }
    pause() {
      this.pauseCalls += 1;
    }
  }

  const prevAudio = global.window.Audio;
  global.window.Audio = FakeAudio;
  try {
    assert.strictEqual(sound.playNotificationSound({ enabled: false, preset: "sparkle" }), false);
    assert.strictEqual(sound.playNotificationSound({ enabled: true, preset: "sparkle", volume: 0 }), false);
    assert.strictEqual(instances.length, 0);

    const playedFirst = sound.playNotificationSound({ enabled: true, preset: "sparkle", volume: 0.45 });
    assert.strictEqual(playedFirst, true);
    assert.strictEqual(instances.length, 1);
    assert.ok(instances[0].src.endsWith(".mp3"));
    assert.strictEqual(instances[0].volume, 0.45);
    assert.strictEqual(instances[0].playCalls, 1);

    const playedSecond = sound.playNotificationSound({ enabled: true, preset: "sparkle", volume: 0.8 });
    assert.strictEqual(playedSecond, true);
    assert.strictEqual(instances[0].pauseCalls, 1);
    assert.strictEqual(instances[0].currentTime, 0);
    assert.strictEqual(instances.length, 2);
    assert.strictEqual(instances[1].volume, 0.8);
    assert.strictEqual(instances[1].playCalls, 1);

    // Switching to silent should also stop any active audio preview
    sound.playNotificationSound({ enabled: true, preset: "silent" });
    assert.strictEqual(instances[1].pauseCalls, 1);
    assert.strictEqual(instances[1].currentTime, 0);
  } finally {
    if (prevAudio === undefined) delete global.window.Audio;
    else global.window.Audio = prevAudio;
  }
});

test("notification sound - degrades gracefully without Audio API for audio-file preset", async () => {
  const { sound } = await loadModules();
  const prevAudio = global.window.Audio;
  delete global.window.Audio;
  try {
    assert.strictEqual(sound.playNotificationSound({ enabled: true, preset: "sparkle", volume: 0.6 }), false);
  } finally {
    if (prevAudio !== undefined) global.window.Audio = prevAudio;
  }
});

test("notification sound - playCallSound plays audio-file preset cleanly", async () => {
  const { sound } = await loadModules();
  const instances = [];

  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      this.currentTime = 0;
      this.playCalls = 0;
      this.pauseCalls = 0;
      instances.push(this);
    }
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    }
    pause() {
      this.pauseCalls += 1;
    }
  }

  const prevAudio = global.window.Audio;
  global.window.Audio = FakeAudio;
  try {
    const played = sound.playCallSound({ preset: "sparkle", volume: 0.7 });
    assert.strictEqual(played, true);
    assert.strictEqual(instances.length, 1);
    assert.strictEqual(instances[0].volume, 0.7);
    assert.strictEqual(instances[0].playCalls, 1);
  } finally {
    if (prevAudio === undefined) delete global.window.Audio;
    else global.window.Audio = prevAudio;
  }
});

/* ---------------------------- Dust tests ----------------------------- */

test("dust burst - spawns particles inside a dedicated overlay layer", async () => {
  const { dust } = await loadModules();
  const before = fakeDom.body.children.length;
  const count = dust.spawnDustBurst({ left: 0, top: 0, width: 100, height: 20 }, { particleCount: 12 });

  assert.strictEqual(count, 12);
  assert.ok(fakeDom.body.children.length > before, "a dust layer should be attached to the body");

  const layer = fakeDom.body.children[fakeDom.body.children.length - 1];
  assert.ok(layer.classList.contains("qp-dust-layer"));

  const particles = layer.children.filter((child) => child.classList.contains("qp-dust-particle"));
  assert.strictEqual(particles.length, 12);
  particles.forEach((p) => {
    assert.ok(p.style.getPropertyValue("--qp-dx"), "particle needs a horizontal drift");
    assert.ok(p.style.getPropertyValue("--qp-dy"), "particle needs a vertical drift");
    assert.ok(p.style.getPropertyValue("--qp-dur"), "particle needs a duration");
  });
});

test("dust burst - respects the particle count and skips empty bursts", async () => {
  const { dust } = await loadModules();
  assert.strictEqual(dust.spawnDustBurst({ left: 0, top: 0, width: 10, height: 10 }, { particleCount: 0 }), 0);
  assert.strictEqual(dust.spawnDustBurst(null), 0);
});

test("dissolve element - marks the element as dissolving and resolves", async () => {
  const { dust } = await loadModules();
  const element = createFakeElement("div");
  const resolved = await dust.dissolveElement(element, { particleCount: 4 });

  assert.strictEqual(resolved, true);
  assert.strictEqual(element.classList.contains("qp-dust-dissolve"), false, "class should be cleaned up afterwards");
});

test("dissolve element - tolerates missing elements", async () => {
  const { dust } = await loadModules();
  assert.strictEqual(await dust.dissolveElement(null), false);
  assert.strictEqual(await dust.dissolveElement({}), false);
});
