# How Still works

Still has two layers: the diary interface and the desktop wrapper. The interface is ordinary HTML, CSS, and JavaScript. Electron supplies the independent Windows window and the engine that displays that interface.

## Read the code in this order

| File | Responsibility | Try changing |
| --- | --- | --- |
| `index.html` | Defines the sidebar, search box, editor, buttons, and confirmation dialog. | A button label or placeholder. |
| `styles.css` | Sets colors, typography, spacing, light/dark themes, and responsive layout. | The `--accent` color at the top. |
| `app.js` | Creates, saves, opens, edits, searches, imports, and exports entries. | An empty-state message in `renderArchive()`. |
| `desktop/main.cjs` | Starts the desktop app, sets its data location, and handles a second launch. | The app lifecycle; keep the storage path unchanged to retain access to existing entries. |
| `desktop/window.cjs` | Creates the native window, loads the interface, and handles desktop downloads and unsaved-close prompts. | The initial window width and height. |
| `package.json` | Lists dependencies, development commands, and Windows packaging settings. | Build options, such as bundled languages. |

## What happens when you launch it

```text
Still.exe
  → desktop/main.cjs starts Electron
  → desktop/window.cjs creates a Windows window
  → still://journal/ loads index.html
  → styles.css applies the design
  → app.js reads saved entries and connects the buttons
```

`still://journal/` is an internal address that reads the packaged files. It needs no web server or internet connection. Its stable address lets the same stored diary remain available when the executable moves.

## Follow one entry through the code

1. **New Entry** calls `newEntry()`, creating an ID and an ISO creation timestamp.
2. Writing changes the title/content fields and marks the page as `dirty` (unsaved).
3. **Save** calls `save()`. It reads the fields, updates `updatedAt`, then calls `persist()`.
4. `persist()` writes the entries array to localStorage under `still.diary.v1`.
5. `openEntry()` and `display()` show the saved entry. `renderArchive()` sorts entries newest first and groups them by month.
6. Searching calls `renderArchive()` again with a filter; it does not change saved entries.

An entry looks like this:

```json
{
  "id": "a-generated-unique-id",
  "title": "A quiet afternoon",
  "content": "Today I went for a walk.",
  "createdAt": "2026-10-02T07:30:00.000Z",
  "updatedAt": "2026-10-02T07:42:00.000Z"
}
```

The ISO timestamp stores an exact moment; the UI displays it in your local timezone. `createdAt` stays fixed, while `updatedAt` changes when you save.

## Where things live

- **Your actual diary:** `%APPDATA%\Still Journal`, outside the project. Electron manages a localStorage database there. Use Export to make a readable JSON backup.
- **Source:** the files described above, plus the desktop icon and tests.
- **Fast desktop app:** `dist\win-unpacked\Still.exe` and all the other files in that folder. Keep this entire folder together.
- **Portable desktop app:** `dist\Still.exe`. Its smaller compressed size comes with extraction on each launch.
- **Optional development tools:** `node_modules`. These can be recreated with `npm ci`; they are not needed by either packaged app.
- **Download caches and test profiles:** temporary generated folders. These are removed by this size-reduction pass.
- **`server.cjs`:** the old browser version, retained for transferring old browser entries. The desktop version does not use it.

## Make your first change

1. Install the development dependencies with `npm ci` in `D:\Diaries` (Node.js is required for development).
2. Run `npm start` to open the source version in its own desktop window.
3. Change the `--accent` value in `styles.css` to a different color.
4. Close and reopen the source version to see your change. Save any writing before closing.
5. Run `npm run check` and `npm run test:desktop` to check changes.
6. Run `npm run dist` to update the packaged executables. Close the fast packaged app before rebuilding its files.

Editing source does not automatically change the already packaged app; packaging copies source into `resources\app.asar`. This archive is Electron's container for your code, not your diary database.

## Why it is still much larger than the source

After optimization on October 2, 2026, the whole project is about **427 MB** (previously about **1.21 GB**), measured as file sizes. The fast app folder is **335 MB**; the portable executable is **92 MB**. The remaining source, icons, documentation, and previews occupy less than **1 MB**. Keeping both runnable versions explains most of the remaining project size.

Electron bundles Chromium and Node.js so the app runs without an installed browser. Most of the executable and DLLs belong to that runtime. Keeping only English translations reduces the package without changing the diary features. Removing caches and development tools reduces project size further.

A much smaller application would require changing to a wrapper that uses Windows' shared WebView2 engine, such as Tauri or a native WebView2 host. That is a larger runtime migration and needs separate testing, especially for storage migration, backups, and close handling. The current optimization keeps Electron and the existing diary logic.
