# Still — Personal Journal

A minimal English-language desktop diary with a chronological archive, search, editing, light/dark mode, and JSON backup. The existing HTML, CSS, and diary logic are hosted in an independent Electron window. No browser, server, network connection, or separate Node.js installation is needed to run the packaged app.

## Run

Double-click **dist/win-unpacked/Still.exe**, the **Still** shortcut in this folder, or **Start Diary.cmd** for the faster startup version. Keep the entire `win-unpacked` folder together. **dist/Still.exe** remains available as a portable single-file version; it extracts its bundled runtime on every launch. Both versions open independent desktop windows and use the same diary data.

Entries are stored locally in the desktop app's dedicated profile at **%APPDATA%/Still Journal**, using the existing localStorage data format. They persist after closing and reopening the app. They are not stored next to the executable or sent to a server. Keep this profile folder when upgrading. **Export** saves JSON backups using a native Save dialog, including current unsaved writing. **Import** merges entries by ID and keeps existing entries if IDs overlap. Closing with unsaved changes asks whether to keep writing or discard them. A second launch focuses the existing window.

## Move existing browser entries

Browser and desktop storage are separate. Existing browser data is left untouched; it is not automatically copied or deleted.

1. If needed, run `npm run web` and open **http://localhost:4317** in the same browser/profile used before. If that server is already running, simply open the address.
2. Click **Export** in the browser app to save a JSON backup.
3. Open **Still.exe**, click **Import**, and choose the backup.

The original IDs, creation times, and last-modified times are preserved. If you previously used the Codex preview, export from that preview's browser profile.

## Writing

- **New Entry** records its creation date/time automatically.
- Write a title and content, then **Save** (or Ctrl+S / Cmd+S).
- Select an archive entry to read it; choose **Edit** to make changes.
- The archive groups entries by month, newest first, using their original creation time.
- Search matches title, content, English date text, and local dates such as `2026-10-01`.
- **Delete** asks for confirmation. Switching away from unsaved writing also asks first.
- The moon/sun button changes theme. The choice persists locally.

Timestamps are stored in ISO format and displayed in your current local timezone. Last saved time changes on every save; creation time stays fixed. Entries are plain text, not HTML. Local storage is not encrypted.

## Files

See **STRUCTURE.md** for a beginner-friendly guide, code-reading order, and the path an entry follows from New Entry to local storage.

`index.html` is the interface, `styles.css` the theme/layout, and `app.js` the unchanged diary logic. `desktop/main.cjs` owns the desktop lifecycle; `desktop/window.cjs` hosts the same assets at a stable internal origin. `server.cjs` remains available only for accessing the older browser version.

## Development and packaging

Node.js and npm are needed only for development:

```text
npm ci
npm start
npm run check
npm run test:desktop
npm run dist
```

`npm run dist` creates **dist/Still.exe** using Electron Builder's portable Windows x64 target. The executable bundles its runtime. The integration tests use separate profiles under `.desktop-test-data`; they never access the real desktop diary. Build dependencies are pinned in `package-lock.json`.

Only the English Electron locale is bundled. Download caches, generated test profiles, and installed `node_modules` have been removed to save space. Run `npm ci` before using development commands; the packaged apps need no development dependencies.

The local build is unsigned; no code-signing certificate was supplied. It is a portable application, not an installer, and does not register itself in the Start menu or change system settings.
