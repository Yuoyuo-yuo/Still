# Verification

## Size reduction — October 2, 2026

- JavaScript syntax checks and desktop regression tests passed before cleanup.
- The Windows packages rebuilt successfully with only `en-US.pak` included.
- Compared the packaged HTML, CSS, JavaScript, and desktop runtime code against their source files: all matched.
- Removed generated download caches, isolated test profiles, and `node_modules` after testing/build completion. The source and dependency lockfile are retained; use `npm ci` to restore development dependencies.
- The project shortcut and Start Diary.cmd now prefer `dist/win-unpacked/Still.exe` for faster startup.
- Total project file size after cleanup: about 427 MB. Fast app: 335,015,869 bytes. Portable app: 92,069,315 bytes.
- Real diary storage at `%APPDATA%/Still Journal` was not modified by cleanup.
- Added STRUCTURE.md to explain the files, entry lifecycle, storage, and development workflow.

## Desktop conversion — October 1, 2026

- `npm run check`: passed.
- `npm run test:desktop`: passed in a dedicated disposable profile, separate from browser and real desktop data.
- The tests launched the real Electron renderer and exercised creation, saving, editing, original creation-time preservation, archive opening, title/content/date search, and no-match results.
- Export produced a readable JSON file through Electron's download handling; import restored a supplied entry and preserved existing entries on duplicate IDs.
- Deletion confirmation and unsaved-navigation confirmation passed.
- Closing with unsaved changes invoked the native desktop dialog; choosing Keep writing left the window open.
- A second, separate Electron process reopened the saved diary content and persisted theme from the same test profile.
- Renderer security checks confirmed sandboxing, context isolation, and no Node.js access.
- The downloaded runtime's SHA-256 matched the checksum supplied by the Electron npm package.
- Electron Builder completed the Windows x64 portable build at `dist/Still.exe` (100,029,315 bytes).
- Launched that packaged executable and visually verified its independent Windows title bar, custom icon, and original diary UI. No browser or HTTP server is required.
- The executable is unsigned. A launch shortcut is available as `Still.lnk` in the project directory.

The original `app.js` and `styles.css` were not modified for this conversion. Browser entries remain in their original browser profile; transfer uses the existing Export/Import workflow described in README.md.

## Earlier browser verification

Checked on October 1, 2026 using the running app at http://localhost:4317.

- JavaScript syntax: `npm run check` passed.
- Created a temporary entry; creation date and time appeared automatically.
- Saved with Ctrl+S; entry appeared under October 2026.
- Reloaded the page; title, content, and timestamps persisted.
- Opened Edit, changed the content, and saved using the Save button.
- Searched by content keyword, title, and YYYY-MM-DD date; matching entry appeared.
- Searched for an absent keyword; the archive displayed its no-results state.
- Deleted the temporary entry through its confirmation dialog; after reload the archive was empty.
- Switched from dark to light mode; the choice persisted after reload.
- Entered unsaved writing and selected New Entry; the discard confirmation appeared.
- Inspected the narrow layout and a 1280 × 850 desktop layout.

Temporary test entries were removed. Export/import are implemented but were not exercised through the browser in this pass. Browser semantic mouse-click automation was unreliable in this preview; native coordinate click and focused keyboard activation were used for verification.
