<div align="center">

# ✦ Vision

**A living notch for Windows.**

Music, notifications, system stats, timers, and everything you need — tucked into the top of your screen.

[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE) [![Version](https://img.shields.io/badge/Version-5.6.0-blue?style=flat-square)](../../releases) ![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%26%2011-0078D4?style=flat-square) ![Vibe coded](https://img.shields.io/badge/Vibe%20Coded-100%25-ff69b4?style=flat-square)

https://github.com/user-attachments/assets/bd057d18-f65e-4cf4-bf66-a5d107f18658

*Hover the notch to expand it — click to pin it open.*

</div>

---

## 💫 What is Vision?

Vision is a **Dynamic Island companion for Windows** — a sleek, always-on-top notch that floats at the top of your screen. It expands on hover to reveal a full control center with 16+ feature modules, then gracefully collapses back into a minimal pill when you're done.

Think of it as Apple's Dynamic Island, but for everyone on Windows.

> **Note — this project is 100% vibe coded.** ✨
>
> Built entirely with the help of AI coding assistants (Claude, Gemini, ChatGPT, etc.) through natural language prompts and iterative conversations. There was no traditional line-by-line coding — just vibes, ideas, and AI pair programming. The entire codebase, from the Electron main process to every React component and CSS animation, was generated through vibe coding sessions.

---

## 🌿 Origins & Inspiration

Vision didn't come from nowhere. It stands on the shoulders of amazing projects:

| Project | Influence |
| :--- | :--- |
| **[Nusa](https://rama2555.github.io/nusa/)** by Rama | The primary visual inspiration. Nusa's beautiful "living notch" concept — the mascot eyes, minimal notch design, synced lyrics, file shelf, and the idea of a notch that *breathes* — deeply shaped Vision's direction and design philosophy. |
| **Ripple** | The evolution branch this project was developed under. Many of Vision's architectural decisions, the compact notch geometry, and the expanded card system were designed during the Ripple phase. |
| **[Quick Pill](https://github.com/AbraarAriqworknabil/Quick-Pill)** by Abrar Nabil | The original foundation. Vision is a **fork** of Quick Pill — Nabil's open-source Dynamic Island for Windows built on Electron + React. Quick Pill provided the core architecture: the Electron window management, IPC bridge, system integration APIs, and the original tab-based island system that Vision continues to build upon. |

Huge respect to all three. 🙏

---

## ✨ Features

### 🎯 Core Experience

- **Dynamic Notch** — A pitch-black notch that blends into your screen bezel, expanding and collapsing with smooth spring physics
- **Three Display Modes** — Still (minimal idle pill), Quick (hover preview), and Large (full interactive dashboard)
- **Always-On-Top** — Screen-saver level priority that stays visible above all apps, even fullscreen
- **Click-Through** — Hold `Ctrl` while hovering to make it transparent and click through to apps underneath
- **Multi-Monitor** — Place it on any connected display

### 🎵 Music & Media

- **Now Playing** — Album art, track info, and playback controls for Spotify, Apple Music, YouTube, and more
- **Synced Lyrics** — Real-time lyrics that highlight as the song plays *(inspired by Nusa)*
- **Waveform Scrubber** — Visual timeline for seeking through tracks
- **Per-App Audio Mixer** — Native WASAPI mixer to control volume for individual apps

### 🔔 Notifications & Alerts

- **Smart Notifications** — Real Win32 app icons, grouped stacks, snooze presets, and inline replies
- **WhatsApp Calls** — Incoming call cards with answer/dismiss actions
- **Privacy Dots** — Camera (green) and microphone (orange) indicators
- **System Toasts** — USB, Bluetooth, battery, and keyboard lock alerts

### ⚡ Productivity

- **Pomodoro Timer** — Focus sessions with preset chips (15m, 30m, 60m) and depleting glow border
- **Quick Notes** — Instant capture with autosave and crash recovery
- **Tasks** — Apple Reminders-style task list with local persistence
- **Clipboard History** — Access your last 50 copied text snippets
- **App Launcher** — Search, launch, and switch Windows apps with real icons
- **File Shelf** — Drag files onto the notch to stash them temporarily *(inspired by Nusa)*
- **Browser Search** — Instant web search or direct URL launch

### 📊 System & Info

- **Battery Hub** — 60 FPS liquid wave animation with drain analytics and time estimates
- **CPU & RAM** — Real-time hardware utilization gauges
- **Weather** — 3D animated weather icons with 3-day forecast
- **Calendar** — Compact monthly view with today highlighting
- **Overview Clock** — iOS StandBy-style clock with daily quotes

### 🎨 Customization

- **Themes** — Dark Glass, Sleek Black, Windows 95 retro, or custom RGB
- **Positioning** — Top-left, center, right, bottom, or free dragging
- **Stealth Mode** — Fully transparent when idle
- **Standby Mode** — Always-visible status metrics
- **Tab Manager** — Reorder, hide, or set default tabs

---

## 🚀 Quick Start

### Download

Grab the latest installer from the [Releases page](../../releases/latest) — `QuickPill-Windows-vX.Y.Z-Setup.exe`. Windows 10 or 11, 64-bit.

The app updates itself after that: it checks for a new release on launch and can download and install it in the background.

### Build from Source

```bash
# Clone the repo
git clone https://github.com/pikri-beep/Vision-pill.git
cd Vision-pill

# Install dependencies
npm install

# Start the development app (Electron + Vite HMR)
npm start

# Build the Windows installer
npm run build
```

**Prerequisites:** Node.js 16+, npm, and Visual Studio Build Tools (Windows).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + [0-9]` | Jump to a specific tab |
| `←` / `→` | Navigate between tabs |
| `Mouse Wheel` | Scroll through tabs |
| `Ctrl + Hover` | Click-through mode (85% transparent) |
| `Alt + Shift + D` | Dismiss the latest notification |
| `Click Island` | Toggle Large / Still mode |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop Runtime** | Electron 38 |
| **Frontend** | React 19 |
| **Animations** | Framer Motion 12 |
| **Build Tools** | Electron Forge 7, Vite 5, Electron Builder |
| **Canvas Engine** | HTML5 2D Canvas (60 FPS liquid waves) |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (glassmorphism, HSL tokens) |
| **OS Integration** | PowerShell, Win32, WinRT, WASAPI |
| **Installer** | NSIS |

---

## 💫 About Vibe Coding

This entire project was built through **vibe coding** — a development approach where you describe what you want in natural language, and AI writes the code. Every feature, animation, bug fix, and design decision in Vision was prompted, iterated, and refined through conversations with AI assistants.

**What this means:**

- 🧠 The ideas, design direction, and product vision are human
- 🤖 The code implementation is AI-generated
- 🔄 Development happens through rapid prompt → generate → test → refine cycles
- 📝 The codebase reflects conversational development rather than traditional engineering

Vibe coding isn't about replacing developers — it's about making software creation accessible to anyone with ideas.

---

## 📄 License

Vision is open source under the [MIT License](LICENSE).

---

## 🙏 Credits & Acknowledgments

- **[Nusa](https://rama2555.github.io/nusa/)** by Rama — The beautiful living notch that inspired Vision's design direction
- **[Quick Pill](https://github.com/AbraarAriqworknabil/Quick-Pill)** by Abrar Nabil — The original open-source Dynamic Island for Windows that this project is forked from
- **Ripple** — The intermediate evolution of the project
- Built with ❤️ and AI through vibe coding

---

<div align="center">

**Vision** — *A living notch for Windows.*

</div>
