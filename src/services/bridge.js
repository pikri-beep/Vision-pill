/**
 * Universal Frontend Bridge Adapter for Quick Pill (Electron Runtime)
 * Ensures window.electronAPI is available and provides safe fallbacks
 * for browser preview and test environments.
 */

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
        return Promise.resolve(null);
      };
    }
  });
}

export function initBridge() {
  if (typeof window === 'undefined') return;

  if (window.electronAPI) {
    // Already running inside Electron with real preload
    return;
  }

  // Fallback for browser testing / non-Electron preview
  console.warn('[Bridge] window.electronAPI is not detected; initializing safe mock proxy.');
  window.electronAPI = createSafeProxy({
    platform: 'win32',
    getFilePath: (file) => file?.path || '',
    getFileUrl: (filePath) => `file:///${String(filePath || '').replace(/\\/g, '/')}`,
  });
}

initBridge();

export default (typeof window !== 'undefined' ? window.electronAPI : null);
