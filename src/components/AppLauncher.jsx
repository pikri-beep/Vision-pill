import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Globe, Folder, Play, ExternalLink, Settings as SettingsIcon, Search, X } from "lucide-react";

export const DEFAULT_LAUNCHER_SHORTCUTS = [
  {
    id: "chrome",
    type: "app",
    name: "Chrome",
    target: "chrome.exe",
    icon: "https://www.google.com/chrome/static/images/chrome-logo.svg"
  },
  {
    id: "github",
    type: "url",
    name: "GitHub",
    target: "https://github.com",
    icon: "https://github.githubassets.com/favicons/favicon.png"
  },
  {
    id: "youtube",
    type: "url",
    name: "YouTube",
    target: "https://youtube.com",
    icon: "https://www.youtube.com/s/desktop/f681da00/img/favicon.ico"
  },
  {
    id: "gemini",
    type: "url",
    name: "Gemini",
    target: "https://gemini.google.com",
    icon: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
  }
];

export default function AppLauncher({
  onClose,
  accentColor = "#38bdf8",
  textColor = "#ffffff"
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const stored = localStorage.getItem("qp_curated_shortcuts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_LAUNCHER_SHORTCUTS;
  });

  // Auto-focus search input when module is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const loadShortcuts = useCallback(() => {
    try {
      const stored = localStorage.getItem("qp_curated_shortcuts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setShortcuts(parsed);
          return;
        }
      }
    } catch (_) {}
    setShortcuts(DEFAULT_LAUNCHER_SHORTCUTS);
  }, []);

  useEffect(() => {
    window.addEventListener("storage", loadShortcuts);
    window.addEventListener("qp_shortcuts_updated", loadShortcuts);
    return () => {
      window.removeEventListener("storage", loadShortcuts);
      window.removeEventListener("qp_shortcuts_updated", loadShortcuts);
    };
  }, [loadShortcuts]);

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (trimmed.includes(".")) {
      const hasProtocol = /^https?:\/\//i.test(trimmed);
      const urlToOpen = hasProtocol ? trimmed : `https://${trimmed}`;
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(urlToOpen);
      } else {
        window.open(urlToOpen, "_blank");
      }
    } else {
      const encodedQuery = encodeURIComponent(trimmed);
      const googleUrl = `https://www.google.com/search?q=${encodedQuery}`;
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(googleUrl);
      } else {
        window.open(googleUrl, "_blank");
      }
    }
    if (onClose) onClose();
  };

  const handleLaunch = async (item) => {
    try {
      if (item.type === "url") {
        if (window.electronAPI?.launcher?.openUrl) {
          await window.electronAPI.launcher.openUrl(item.target);
        } else if (window.electronAPI?.openExternal) {
          await window.electronAPI.openExternal(item.target);
        } else {
          window.open(item.target, "_blank");
        }
      } else {
        if (window.electronAPI?.launcher?.openApp) {
          await window.electronAPI.launcher.openApp(item.target);
        } else if (window.electronAPI?.launchApp) {
          await window.electronAPI.launchApp(item.target);
        }
      }
    } catch (err) {
      console.error("Failed to launch shortcut:", err);
    }
    if (onClose) onClose();
  };

  const openSettings = () => {
    if (window.electronAPI?.openSettingsWindow) {
      window.electronAPI.openSettingsWindow();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 20px 14px 20px",
        boxSizing: "border-box",
        userSelect: "none"
      }}
    >
      {/* Top Search Bar: Search Google or type URL */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          height: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: 10,
          padding: "0 10px",
          boxSizing: "border-box",
          flexShrink: 0
        }}
      >
        <Search size={14} color="rgba(255, 255, 255, 0.5)" style={{ flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          id="spotlight-launcher-searchbar"
          placeholder="Search Google or type a URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchSubmit();
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: textColor || "#ffffff",
            fontSize: 12,
            fontWeight: 500,
            textAlign: "left",
            padding: 0,
            caretColor: textColor || "#ffffff",
            fontFamily: "OpenRunde, system-ui, sans-serif"
          }}
          autoFocus
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "rgba(255, 255, 255, 0.45)"
            }}
          >
            <X size={12} />
          </button>
        ) : (
          <kbd style={{ background: "rgba(255,255,255,0.12)", padding: "1px 4px", borderRadius: 4, fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
            ↵
          </kbd>
        )}
      </div>

      {/* Customizable Shortcut Icons: Chrome, GitHub, YouTube, Gemini */}
      {shortcuts.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: "rgba(255, 255, 255, 0.45)",
            flex: 1
          }}
        >
          <span style={{ fontSize: 11 }}>No shortcuts configured yet</span>
          <button
            onClick={openSettings}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: 10.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              cursor: "pointer"
            }}
          >
            <SettingsIcon size={11} />
            Configure in Settings
          </button>
        </div>
      ) : (
        <div
          className="launcher-scrollable"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: shortcuts.length <= 5 ? "center" : "flex-start",
            gap: 12,
            width: "100%",
            overflowX: "auto",
            scrollbarWidth: "none",
            padding: "2px 4px 0 4px",
            flexShrink: 0
          }}
        >
          {shortcuts.map((item, idx) => (
            <motion.div
              key={item.id || item.name + idx}
              onClick={() => handleLaunch(item)}
              title={`${item.name} (${item.target})`}
              whileHover={{ scale: 1.08, y: -4, rotate: (idx % 2 === 0 ? 1.5 : -1.5) }}
              whileTap={{ scale: 0.92, y: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
              style={{
                width: 66,
                height: 64,
                background: "#121212",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                padding: "6px 4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                flexShrink: 0,
                boxSizing: "border-box"
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0
                }}
              >
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={item.name}
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                      borderRadius: 5
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: item.icon ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%"
                  }}
                >
                  {item.type === "url" ? (
                    <Globe size={18} color={accentColor} />
                  ) : item.name.toLowerCase().includes("explorer") ? (
                    <Folder size={18} color="#f59e0b" />
                  ) : (
                    <Play size={16} color="#ffffff" />
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                  textAlign: "center",
                  letterSpacing: "0.01em",
                  lineHeight: 1.1
                }}
              >
                {item.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
