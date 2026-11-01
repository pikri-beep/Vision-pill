#!/usr/bin/env node
/**
 * scripts/generate-manifest.js
 * 
 * Automatically generates or updates `version.json` with accurate file sizes and SHA-256 hashes
 * for built release binaries (Windows .exe).
 *
 * Usage:
 *   node scripts/generate-manifest.js [options]
 *   npm run update:manifest
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pkg = require('../package.json');

const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_MAKE_DIR = path.resolve(__dirname, '../out/make');
const WEB_APP_PUBLIC_DIR = path.resolve(__dirname, '../web app/public');

// The published installer lives in the GitHub release of the same tag — the
// updater downloads it from there.
const RELEASE_REPO = process.env.QP_RELEASE_REPO || 'pikri-beep/Vision-pill';
const RELEASE_URL = (version, fileName) =>
  `https://github.com/${RELEASE_REPO}/releases/download/v${version}/${fileName}`;

function calculateFileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.statSync(filePath).size;
}

function findArtifact(searchDirs, pattern, preferredPattern = null) {
  const matches = [];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir, { recursive: true });
    for (const file of files) {
      const fullPath = path.isAbsolute(file) ? file : path.join(dir, file);
      if (typeof file === 'string' && pattern.test(file) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        matches.push(fullPath);
      }
    }
  }

  if (!matches.length) return null;

  // Always prefer the artifact that belongs to the current version — otherwise
  // an installer from a previous release could end up in the manifest.
  if (preferredPattern) {
    const preferred = matches.find((file) => preferredPattern.test(path.basename(file)));
    if (preferred) return preferred;
  }

  // Fall back to the newest artifact
  return matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function generateManifest() {
  const version = pkg.version;
  console.log(`Generating update manifest for Quick Pill v${version}...`);

  const searchDirs = [DIST_DIR, OUT_MAKE_DIR];

  // Look for Windows installer (prefer the one of the current version)
  const currentArtifactPattern = new RegExp(`v${version}.*\\.exe$`, 'i');
  const winArtifact = findArtifact(searchDirs, /Quick.*Pill.*Setup.*\.exe$/i, currentArtifactPattern) ||
                      findArtifact(searchDirs, /QuickPill-Windows.*\.exe$/i, currentArtifactPattern) ||
                      findArtifact(searchDirs, /quick-pill-.*-setup\.exe$/i, currentArtifactPattern);

  const artifactName = winArtifact ? path.basename(winArtifact) : `QuickPill-Windows-v${version}-Setup.exe`;

  const manifest = {
    version: version,
    name: `Quick Pill ${version}`,
    releaseDate: new Date().toISOString().split('T')[0],
    mandatory: false,
    minSupportedVersion: '4.0.0',
    changelog: [
      `Quick Pill v${version} release.`,
      'Performance enhancements and stability updates.'
    ],
    platforms: {
      'win32-x64': {
        url: RELEASE_URL(version, artifactName),
        sha256: winArtifact ? calculateFileSha256(winArtifact) : '',
        size: winArtifact ? getFileSize(winArtifact) : 89452012,
        installerType: 'nsis'
      }
    }
  };

  // Preserve the hand written changelog of the previous release
  const publicManifestPath = path.join(WEB_APP_PUBLIC_DIR, 'version.json');
  if (fs.existsSync(publicManifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(publicManifestPath, 'utf8'));
      if (Array.isArray(existing.changelog) && existing.changelog.length > 0) {
        manifest.changelog = existing.changelog;
      }
    } catch (_) {}
  }

  // Write to web app/public/version.json
  if (!fs.existsSync(WEB_APP_PUBLIC_DIR)) {
    fs.mkdirSync(WEB_APP_PUBLIC_DIR, { recursive: true });
  }
  fs.writeFileSync(publicManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Manifest written to: ${publicManifestPath}`);

  // Also write to dist/version.json if dist directory exists
  if (fs.existsSync(DIST_DIR)) {
    const distManifestPath = path.join(DIST_DIR, 'version.json');
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`Manifest written to: ${distManifestPath}`);
  }

  console.log('Update manifest generation complete.');
}

if (require.main === module) {
  generateManifest();
}

module.exports = { generateManifest };
