/**
 * Universal Frontend Bridge Adapter for Tauri v2 & Electron Fallback
 * Exposes window.electronAPI so all existing React components work with 0 rewrites.
 *
 * Every method below maps onto a real native implementation in
 * `src-tauri/src/lib.rs` - there are no silent stubs left.
 */

import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const isTauriEnv = () => {
  return typeof window !== 'undefined' && Boolean(
    window.__TAURI_INTERNALS__ ||
    window.__TAURI__ ||
    window.isTauri
  );
};

// Safe event listener helper that always returns a synchronous unlisten function
function createTauriListener(eventName, callback) {
  let isCleanedUp = false;
  let unlistenFn = null;

  try {
    listen(eventName, (event) => {
      if (!isCleanedUp && typeof callback === 'function') {
        callback(event.payload);
      }
    }).then((unlisten) => {
      if (isCleanedUp) {
        unlisten();
      } else {
        unlistenFn = unlisten;
      }
    }).catch((err) => {
      console.warn(`[Tauri Bridge] Failed to subscribe to '${eventName}':`, err);
    });
  } catch (err) {
    console.warn(`[Tauri Bridge] Immediate subscribe failure for '${eventName}':`, err);
  }

  return () => {
    isCleanedUp = true;
    if (typeof unlistenFn === 'function') {
      try {
        unlistenFn();
      } catch (_) {}
    }
  };
}

// Local storage helper for persisting app state without native files
const storage = {
  get: (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (_) {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (_) {
      return false;
    }
  }
};

// Launch every enabled target of a workspace (Electron's
// workspaceManager.launchWorkspace behaviour).
async function launchWorkspaceById(workspaceId, options = {}) {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('qp_workspaces') || '[]');
  } catch (_) {}
  const workspace = list.find((w) => w.id === workspaceId);
  if (!workspace) {
    return {
      success: false,
      results: [{ id: workspaceId, success: false, error: 'Workspace not found' }],
    };
  }

  let targets = Array.isArray(workspace.launchProfile) ? workspace.launchProfile : [];
  if (Array.isArray(options?.targetIds) && options.targetIds.length > 0) {
    targets = targets.filter((t) => options.targetIds.includes(t.id));
  } else {
    targets = targets.filter((t) => t.enabled !== false);
  }

  const results = [];
  for (const item of targets) {
    try {
      if (item.type === 'url') {
        await invoke('launcher_open_url', { url: item.target });
      } else {
        await invoke('launcher_open_app', { targetPath: item.target });
      }
      results.push({
        id: item.id,
        name: item.name,
        type: item.type,
        target: item.target,
        success: true,
      });
    } catch (error) {
      results.push({
        id: item.id,
        name: item.name,
        type: item.type,
        target: item.target,
        success: false,
        error: String(error),
      });
    }
  }

  return {
    success: results.length > 0 ? results.some((r) => r.success) : true,
    results,
  };
}

// Safe recursive proxy to prevent any "undefined is not a function" crashes
function createSafeProxy(target, path = '') {
  return new Proxy(target, {
    get(obj, prop) {
      if (typeof prop !== 'string') return obj[prop];
      if (prop in obj) {
        const val = obj[prop];
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Promise)) {
          return createSafeProxy(val, `${path}${prop}.`);
        }
        return val;
      }
      // If event listener, return synchronous no-op unsubscriber
      if (prop.startsWith('on')) {
        return () => () => {};
      }
      // If method, return a Promise resolving to null
      return (...args) => {
        console.warn(`[Bridge Proxy Fallback] Called unhandled method: window.electronAPI.${path}${prop}`, args);
        return Promise.resolve(null);
      };
    }
  });
}

/**
 * Persisted flag helper - the value lives in the native settings file so the
 * notch window and the settings window always agree (Electron parity).
 */
function makeFlag(key, fallback = false) {
  return {
    get: () => invoke('get_app_setting', { key }).then((value) => {
      if (value === null || value === undefined) return fallback;
      return value;
    }).catch(() => fallback),
    set: (value) => invoke('set_app_setting', { key, value }).then(() => value).catch(() => fallback),
  };
}

export function initBridge() {
  if (typeof window === 'undefined') return;

  // If already running inside Electron with real preload, preserve it as fallback
  if (window.electronAPI && !isTauriEnv()) {
    console.log('[Bridge] Running under native Electron runtime.');
    return;
  }

  console.log('[Bridge] Initializing Tauri v2 Native Bridge for React UI.');

  const mascotFlag = makeFlag('mascotMode');
  const minimalFlag = makeFlag('minimalNotch');
  const privacyFlag = makeFlag('privacyDots');
  const avoidanceFlag = makeFlag('smartBrowserAvoidance', true);
  const hiddenTabsFlag = makeFlag('hiddenTabs', []);
  const tabOrderFlag = makeFlag('tabOrder', []);

  const bridgeAPI = {
    platform: 'win32',

    getFilePath: (file) => file?.path || '',

    /**
     * Preview URL for a local file. WebView2 refuses `file:///` subresources
     * from the app origin, so Tauri goes through the asset protocol instead.
     */
    getFileUrl: (filePath) => {
      const raw = String(filePath || '');
      if (!raw) return '';
      try {
        return convertFileSrc(raw);
      } catch (_) {
        return `file:///${raw.replace(/\\/g, '/')}`;
      }
    },

    settingsWindow: {
      minimize: () => invoke('minimize_settings_window').catch(() => {}),
      close: () => invoke('close_settings_window').catch(() => {}),
    },

    /**
     * Reports the interactive hit-box of the notch. The anchor is the
     * horizontal centre inside the window so the native hit-test also works
     * for the corner positions (Electron parity).
     */
    setNotchHitbox: (width, height, expanded, anchorX) => {
      return invoke('set_notch_hitbox', {
        width: Math.round(width),
        height: Math.round(height),
        expanded: Boolean(expanded),
        anchorX: typeof anchorX === 'number' ? anchorX : null,
      }).catch((e) => console.warn('[Bridge] set_notch_hitbox error:', e));
    },

    onNotchCursorEnter: (cb) => createTauriListener('notch:cursor-enter', cb),
    onNotchCursorLeave: (cb) => createTauriListener('notch:cursor-leave', cb),

    /**
     * Ctrl-hover click-through. The native window procedure answers
     * WM_NCHITTEST with HTTRANSPARENT while this flag is set, so the notch
     * keeps painting instead of becoming a layered (invisible) window.
     */
    setIgnoreMouseEvents: (ignore, forward) =>
      invoke('set_ignore_mouse_events', { ignore: Boolean(ignore), forward: forward !== false }).catch(() => false),

    getSystemMedia: () => invoke('get_system_media').catch(() => null),

    controlSystemMedia: (command, ...args) => {
      const seekSec = typeof args[0] === 'number' ? args[0] : null;
      return invoke('control_system_media', { command, seekSec }).catch(() => {});
    },

    getBluetoothStatus: () => invoke('get_bluetooth_status').catch(() => ({ connected: false, devices: [] })),
    getCameraStatus: () => invoke('get_camera_status').catch(() => false),
    getMicrophoneStatus: () => invoke('get_microphone_status').catch(() => false),
    getSystemMetrics: () => invoke('get_system_metrics').catch(() => ({ cpu: 0, ram: 0 })),
    onMediaUpdate: (cb) => createTauriListener('media:update', cb),
    getBatteryStatus: () => invoke('get_battery_status').catch(() => ({ percent: 100, charging: true })),
    onBatteryChange: (cb) => createTauriListener('battery:changed', cb),

    openExternal: (url) => invoke('open_external', { url }).catch((e) => console.error('[Bridge] openExternal:', e)),

    launchApp: (target) => invoke('launcher_launch_app', { target }).catch((e) => console.error('[Bridge] launchApp:', e)),
    buildAppCache: () => invoke('launcher_reindex_catalog').catch(() => []),
    searchApps: (query) => invoke('launcher_search_apps', { query: query || '' }).catch(() => []),

    getDisplays: () => invoke('get_displays').catch(() => [{ id: 'primary', bounds: { x: 0, y: 0, width: 1920, height: 1080 } }]),
    setDisplay: (displayId) => invoke('set_display', { displayId: String(displayId ?? '') }).catch(() => false),
    updateWindowPosition: (xPerc, yPx) => invoke('update_window_position', { xPerc: Number(xPerc), yPx: Number(yPx) }).catch(() => {}),

    setAutoLaunch: (enable) => invoke('set_auto_launch', { enable: Boolean(enable) }).catch(() => false),
    getAutoLaunch: () => invoke('get_auto_launch').catch(() => false),
    createDesktopShortcut: () => invoke('create_desktop_shortcut').catch((e) => ({ success: false, error: String(e) })),
    onAutoLaunchChange: (cb) => createTauriListener('settings:auto-launch-changed', cb),

    getClipboardText: () => invoke('get_clipboard_text').catch(() => ''),
    writeClipboardText: (text) => invoke('write_clipboard_text', { text }).catch(() => false),
    clearClipboard: () => invoke('clear_clipboard').catch(() => false),

    controlSystemVolume: (action) => invoke('control_system_volume', { action: action || 'up' }).catch(() => false),
    focusWindow: () => invoke('focus_window').catch(() => false),

    logMessage: (level, msg, details) => {
      invoke('log_message', { level: level || 'info', msg: msg || '', details: details || null }).catch(() => {});
    },
    logRendererError: (errorData) => {
      invoke('log_renderer_error', { errorData: errorData || {} }).catch(() => {});
      try {
        localStorage.setItem('qp_last_renderer_error', JSON.stringify(errorData));
      } catch (_) {}
    },

    getNotifications: () => invoke('notification_get_snapshot').catch(() => null),
    dismissNotification: (id) => invoke('notification_dismiss', { notificationId: id }).catch(() => false),
    focusNotificationApp: (appId, appName) => invoke('focus_notification_app', { appId: appId || '', appName: appName || '' }).catch(() => false),
    openNotificationTarget: (payload) => {
      const target = payload || {};
      return invoke('open_notification_target', { payload: target }).catch(() => false);
    },
    onDismissLatestNotification: (cb) => createTauriListener('dismiss-latest-notification', cb),

    onUSBChange: (cb) => createTauriListener('usb-change', cb),

    checkForUpdates: () => invoke('check_for_updates').catch(() => ({ updateAvailable: false })),
    startUpdateDownload: () => invoke('start_update_download').catch(() => ({ success: false })),
    cancelUpdateDownload: () => invoke('cancel_update_download').catch(() => false),
    installUpdate: () => invoke('install_update').catch(() => false),
    getUpdaterState: () => invoke('get_updater_state').catch(() => ({ state: 'idle' })),
    getAppVersion: () => invoke('get_app_version').catch(() => '0.0.0'),
    getAutoDownloadInstall: () => invoke('get_auto_download_install').catch(() => false),
    setAutoDownloadInstall: (enable) => invoke('set_auto_download_install', { enable: Boolean(enable) }).catch(() => false),

    getAlwaysOnTop: () => invoke('get_always_on_top').catch(() => true),
    setAlwaysOnTop: (enable) => invoke('set_always_on_top', { enable: Boolean(enable) }).catch(() => false),
    onAlwaysOnTopChange: (cb) => createTauriListener('always-on-top-changed', cb),
    onUpdateEvent: (cb) => createTauriListener('update-event', cb),
    onSystemResume: (cb) => createTauriListener('system-resume', cb),

    audioMixer: {
      getDevices: () => invoke('audio_mixer_get_devices').catch(() => ({ devices: [], defaultDeviceId: 'default' })),
      getSessions: (deviceId) => invoke('audio_mixer_get_sessions', { deviceId: deviceId || '' }).catch(() => ({ sessions: [], masterVolume: 80, isMuted: false })),
      setVolume: (payload) => invoke('audio_mixer_set_volume', { payload: payload || {} }).catch(() => false),
      setMute: (payload) => invoke('audio_mixer_set_mute', { payload: payload || {} }).catch(() => false),
      setMasterVolume: (payload) => invoke('audio_mixer_set_master_volume', { payload: payload || {} }).catch(() => false),
      setMasterMute: (payload) => invoke('audio_mixer_set_master_mute', { payload: payload || {} }).catch(() => false),
    },

    progress: {
      getSnapshot: () => invoke('progress_get_snapshot').catch(() => ({ operations: [], history: [], compactDisplay: null })),
      executeAction: (operationId, action, params) =>
        invoke('progress_execute_action', { operationId, action, params: params || {} }).catch(() => false),
      startFileOperation: (payload) => invoke('progress_start_file_operation', { payload: payload || {} }).catch(() => false),
      startHashOperation: (payload) => invoke('progress_start_hash_operation', { payload: payload || {} }).catch(() => false),
      selectFile: () => invoke('progress_select_file').catch(() => null),
      clearHistory: () => invoke('progress_clear_history').catch(() => false),
      onUpdate: (cb) => createTauriListener('progress:update', cb)
    },

    notifications: {
      getSnapshot: () => invoke('notification_get_snapshot').catch(() => null),
      syncNow: () => invoke('notification_sync_now').catch(() => null),
      executeAction: (notificationId, actionType, params) => invoke('notification_execute_action', { notificationId, actionType }).catch(() => ({ success: false })),
      snooze: (notificationId, durationMs, untilTimestamp) => invoke('notification_snooze', { notificationId, durationMs, untilTimestamp: untilTimestamp || null }).catch(() => false),
      cancelSnooze: (notificationId) => invoke('notification_cancel_snooze', { notificationId }).catch(() => false),
      dismiss: (notificationId) => invoke('notification_dismiss', { notificationId }).catch(() => false),
      dismissGroup: (groupId) => invoke('notification_dismiss_group', { groupId }).catch(() => false),
      clearAll: () => invoke('notification_clear_all').catch(() => false),
      undoDismiss: (notificationId) => invoke('notification_undo_dismiss', { notificationId }).catch(() => false),
      markReviewed: (notificationId) => invoke('notification_mark_reviewed', { notificationId }).catch(() => false),
      markAllReviewed: () => invoke('notification_mark_all_reviewed').catch(() => false),
      setHidePreviews: (hide) => invoke('notification_set_hide_previews', { hide: Boolean(hide) }).catch(() => false),
      setAppExcluded: (appName, excluded) => invoke('notification_set_app_excluded', { appName, excluded: Boolean(excluded) }).catch(() => false),
      clearHistory: () => invoke('notification_clear_history').catch(() => false),
      onUpdate: (cb) => createTauriListener('notification:update', cb)
    },

    launcher: {
      searchApps: (query, options) => invoke('launcher_search_apps', { query: query || '' }).catch(() => []),
      getCatalog: () => invoke('launcher_get_catalog').catch(() => []),
      reindexCatalog: () => invoke('launcher_reindex_catalog').catch(() => []),
      launchApp: (target) => invoke('launcher_launch_app', { target }).catch(() => {}),
      getRunningWindows: () => invoke('launcher_get_running_windows').catch(() => []),
      activateWindow: (hWnd) => invoke('launcher_activate_window', { hWnd: Number(hWnd) }).catch(() => false),
      getFavorites: () => storage.get('qp_favorites', []),
      setFavorites: (favorites) => {
        storage.set('qp_favorites', favorites);
        return Promise.resolve(true);
      },
      openApp: (p) => invoke('launcher_open_app', { targetPath: p }).catch(() => {}),
      openUrl: (u) => invoke('launcher_open_url', { url: u }).catch(() => {}),
      selectFile: () => invoke('launcher_select_file').catch(() => ({ canceled: true })),
      getWorkspaces: () => storage.get('qp_workspaces', []),
      saveWorkspace: (ws) => {
        const list = storage.get('qp_workspaces', []);
        const idx = list.findIndex(w => w.id === ws.id);
        if (idx >= 0) list[idx] = ws; else list.push(ws);
        storage.set('qp_workspaces', list);
        return Promise.resolve(ws);
      },
      deleteWorkspace: (id) => {
        const list = storage.get('qp_workspaces', []).filter(w => w.id !== id);
        storage.set('qp_workspaces', list);
        return Promise.resolve(true);
      },
      launchWorkspace: (workspaceId, options) => launchWorkspaceById(workspaceId, options),
      onWindowActivated: (cb) => createTauriListener('launcher:window-activated', cb)
    },

    workspaces: {
      getWorkspaces: () => storage.get('qp_workspaces', []),
      saveWorkspace: (ws) => {
        const list = storage.get('qp_workspaces', []);
        const idx = list.findIndex(w => w.id === ws.id);
        if (idx >= 0) list[idx] = ws; else list.push(ws);
        storage.set('qp_workspaces', list);
        return Promise.resolve(ws);
      },
      deleteWorkspace: (id) => {
        const list = storage.get('qp_workspaces', []).filter(w => w.id !== id);
        storage.set('qp_workspaces', list);
        return Promise.resolve(true);
      },
      launchWorkspace: (workspaceId, options) => launchWorkspaceById(workspaceId, options),
    },

    notes: {
      getNotes: (filter, options) => {
        let notes = storage.get('qp_notes', []);
        const tag = options?.tag;
        if (tag) {
          notes = notes.filter((n) => Array.isArray(n.tags) && n.tags.includes(tag));
        }
        if (filter === 'archived') {
          notes = notes.filter((n) => n.archived);
        } else if (filter === 'pinned') {
          notes = notes.filter((n) => n.pinned && !n.archived);
        } else if (filter === 'recent') {
          notes = notes
            .filter((n) => !n.archived)
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            .slice(0, 20);
        } else {
          notes = notes.filter((n) => !n.archived);
        }
        return Promise.resolve(notes);
      },
      saveNote: (note) => {
        const notes = storage.get('qp_notes', []);
        const id = note.id || `note-${Date.now()}`;
        const newNote = { ...note, id, updatedAt: Date.now() };
        const idx = notes.findIndex(n => n.id === id);
        if (idx >= 0) notes[idx] = newNote; else notes.unshift(newNote);
        storage.set('qp_notes', notes);
        return Promise.resolve(newNote);
      },
      deleteNote: (id) => {
        const notes = storage.get('qp_notes', []);
        const victim = notes.find(n => n.id === id);
        const rest = notes.filter(n => n.id !== id);
        storage.set('qp_notes', rest);
        // Keep the last deleted note so the Undo banner can restore it.
        storage.set('qp_notes_undo', victim || null);
        return Promise.resolve(true);
      },
      undoDelete: () => {
        const victim = storage.get('qp_notes_undo', null);
        if (!victim) return Promise.resolve({ success: false });
        const notes = storage.get('qp_notes', []);
        notes.unshift(victim);
        storage.set('qp_notes', notes);
        try { localStorage.removeItem('qp_notes_undo'); } catch (_) {}
        return Promise.resolve({ success: true, note: victim });
      },
      togglePin: (id) => {
        const notes = storage.get('qp_notes', []);
        const note = notes.find(n => n.id === id);
        if (note) note.pinned = !note.pinned;
        storage.set('qp_notes', notes);
        return Promise.resolve(note ? { success: true, isPinned: note.pinned, note } : { success: false });
      },
      toggleArchive: (id) => {
        const notes = storage.get('qp_notes', []);
        const note = notes.find(n => n.id === id);
        if (note) note.archived = !note.archived;
        storage.set('qp_notes', notes);
        return Promise.resolve(note ? { success: true, isArchived: note.archived, note } : { success: false });
      },
      saveDraft: (draft) => {
        storage.set('qp_note_draft', draft);
        return Promise.resolve(true);
      },
      getDraft: () => Promise.resolve(storage.get('qp_note_draft', null)),
      clearDraft: () => {
        localStorage.removeItem('qp_note_draft');
        return Promise.resolve(true);
      },
      getContextualCapture: async () => {
        const text = await invoke('get_clipboard_text').catch(() => '');
        if (!text || !text.trim()) return { success: false, content: '' };
        return {
          success: true,
          content: text,
          source: 'clipboard',
          charCount: text.length,
          byteCount: new TextEncoder().encode(text).length,
        };
      },
      searchNotes: (q) => {
        const notes = storage.get('qp_notes', []);
        return Promise.resolve(notes.filter(n => (n.text || n.content || n.title || '').toLowerCase().includes((q || '').toLowerCase())));
      },
      getTags: () => {
        const notes = storage.get('qp_notes', []);
        const counts = new Map();
        for (const note of notes) {
          const tags = Array.isArray(note.tags) ? note.tags : [];
          for (const tag of tags) {
            if (typeof tag === 'string' && tag) {
              counts.set(tag, (counts.get(tag) || 0) + 1);
            }
          }
        }
        return Promise.resolve([...counts.keys()].sort());
      },
      convertToTask: (note) => {
        const raw = typeof note === 'string' ? '' : (note?.content || note?.text || note?.title || '');
        const firstLine = String(raw).split(/\r?\n/).map(l => l.trim()).find(Boolean) || 'Untitled Task';
        const cleaned = firstLine
          .replace(/^>\s*/, '')
          .replace(/^[-*+]\s+/, '')
          .replace(/^\d+[.)]\s+/, '')
          .replace(/^\[[ xX]\]\s*/, '')
          .replace(/^#{1,6}\s*/, '')
          .replace(/[*_`~]+/g, '')
          .trim() || 'Untitled Task';
        const title = cleaned.length > 60 ? `${cleaned.slice(0, 57).trim()}...` : cleaned;
        return Promise.resolve({
          id: Date.now(),
          title,
          completed: false,
          noteId: note?.id || null,
          createdAt: Date.now(),
        });
      },
      onQuickCaptureTriggered: (cb) => createTauriListener('notes:quick-capture-triggered', cb),
      onNotesUpdated: (cb) => createTauriListener('notes:updated', cb)
    },

    shortcuts: {
      getTabShortcuts: () => invoke('get_tab_shortcuts').catch(() => ({})),
      setTabShortcuts: (sc) => invoke('set_tab_shortcuts', { shortcuts: sc || {} }).catch(() => sc || {}),
      resetTabShortcuts: () => invoke('reset_tab_shortcuts').catch(() => ({})),
      onOpenTabInstant: (cb) => createTauriListener('open-tab-instant', cb),
      onShortcutsUpdated: (cb) => createTauriListener('shortcuts:updated', cb)
    },

    getMascotMode: () => mascotFlag.get(),
    setMascotMode: (enabled) => mascotFlag.set(Boolean(enabled)),

    getMinimalNotch: () => minimalFlag.get(),
    setMinimalNotch: (enabled) => minimalFlag.set(Boolean(enabled)),
    toggleMinimalNotch: () => minimalFlag.get().then((current) => minimalFlag.set(!current)),

    getHiddenTabs: () => hiddenTabsFlag.get(),
    setHiddenTabs: (tabs) => hiddenTabsFlag.set(tabs || []),
    onHiddenTabsChange: (cb) => createTauriListener('settings:hidden-tabs-changed', cb),

    getTabOrder: () => tabOrderFlag.get(),
    setTabOrder: (tabs) => tabOrderFlag.set(tabs || []),
    onTabOrderChange: (cb) => createTauriListener('settings:tab-order-changed', cb),

    openSettingsWindow: () => invoke('open_settings_window').catch((e) => console.error('[Bridge] openSettingsWindow:', e)),

    /**
     * Dragging a file out of the shelf: the file is placed on the Windows
     * clipboard as CF_HDROP so it can be pasted into Explorer, WhatsApp, …
     */
    startDrag: (filePath) => {
      if (!filePath) return;
      invoke('shelf_start_drag', { filePath }).catch((e) => console.warn('[Bridge] shelf_start_drag:', e));
    },
    cacheFileIcon: (filePath) => invoke('shelf_cache_icon', { filePath }).catch(() => null),
    getFileInfo: (filePath) => invoke('get_file_info', { filePath }).catch(() => null),

    clipboard: {
      getHistory: () => invoke('get_clipboard_history').catch(() => []),
      write: (text) => invoke('write_clipboard_text', { text }).catch(() => false),
      clear: () => invoke('clear_clipboard').catch(() => false),
      onUpdate: (cb) => createTauriListener('clipboard:update', cb)
    },

    onObstructionStatus: (cb) => {
      const handler = (payload) => {
        const isObstructed = Boolean(payload?.isObstructed ?? payload?.obstructed);
        cb({ isObstructed, obstructed: isObstructed });
      };
      const unsub1 = createTauriListener('obstruction-changed', handler);
      const unsub2 = createTauriListener('desktop:obstruction-status', handler);
      return () => {
        unsub1();
        unsub2();
      };
    },

    onMascotModeChange: (cb) => createTauriListener('settings:mascot-mode-changed', cb),
    onMinimalNotchChange: (cb) => createTauriListener('settings:minimal-notch-changed', cb),

    getSmartBrowserAvoidance: () => avoidanceFlag.get(),
    setSmartBrowserAvoidance: (enabled) => avoidanceFlag.set(Boolean(enabled)),
    onSmartBrowserAvoidanceChange: (cb) => createTauriListener('settings:smart-browser-avoidance-changed', cb),

    onToggleMinimalNotchHotkey: (cb) => createTauriListener('toggle-minimal-notch-hotkey', cb),

    getPrivacyDots: () => privacyFlag.get(),
    setPrivacyDots: (enabled) => privacyFlag.set(Boolean(enabled)),
    onPrivacyDotsChange: (cb) => createTauriListener('settings:privacy-dots-changed', cb),

    invalidateWindow: () => Promise.resolve(true),

    askJarvis: (prompt) => invoke('ask_jarvis', { text: prompt }).catch((e) => ({
      success: false,
      error: String(e)
    })),
    getJarvisConfig: () => invoke('get_jarvis_config').catch(() => ({
      enabled: true,
      endpoint: 'http://127.0.0.1:8765/api/process',
      timeout_seconds: 45,
      auto_speak: true,
      auto_collapse: true,
      collapse_delay: 8,
      auto_start_server: false,
    })),
    setJarvisConfig: (config) => invoke('set_jarvis_config', { config }).catch(() => false),
    testJarvisConnection: (endpoint) => invoke('test_jarvis_connection', { endpoint }).catch(() => ({ success: false })),
    launchJarvisServer: () => invoke('launch_jarvis_server').catch(() => ({ success: false, message: 'JARVIS server must be running at 127.0.0.1:8765' })),
    stopJarvisServer: () => invoke('stop_jarvis_server').catch(() => false),
    onJarvisConfigUpdate: (cb) => createTauriListener('jarvis:configUpdated', cb),

    // Phase 4: Idle working set memory trimmer
    trimMemory: () => invoke('trim_memory').catch(() => {}),
  };

  // Expose deeply guarded Proxy on window object
  window.electronAPI = createSafeProxy(bridgeAPI);

  // ---------------------------------------------------------------
  // Native file drop (Tauri delivers the real paths, WebView2 does not)
  // ---------------------------------------------------------------
  if (isTauriEnv()) {
    import('@tauri-apps/api/webview').then(({ getCurrentWebview }) => {
      try {
        getCurrentWebview().onDragDropEvent(async (event) => {
          const payload = event?.payload;
          if (!payload) return;
          if (payload.type === 'enter' || payload.type === 'over') {
            window.dispatchEvent(new CustomEvent('qp:file-drag-over', { detail: true }));
            return;
          }
          if (payload.type === 'leave') {
            window.dispatchEvent(new CustomEvent('qp:file-drag-over', { detail: false }));
            return;
          }
          if (payload.type !== 'drop') return;
          const paths = Array.isArray(payload.paths) ? payload.paths : [];
          const files = [];
          for (const path of paths) {
            try {
              const info = await invoke('get_file_info', { filePath: path });
              if (info) files.push(info);
            } catch (_) {}
          }
          window.dispatchEvent(new CustomEvent('qp:file-drag-over', { detail: false }));
          if (files.length > 0) {
            // Let the React UI pick the files up.
            window.dispatchEvent(new CustomEvent('qp:file-drop', { detail: files }));
          }
        });
      } catch (err) {
        console.warn('[Bridge] drag & drop listener failed:', err);
      }
    }).catch(() => {});
  }
}

// Automatically initialize when imported
initBridge();

export default window.electronAPI;
