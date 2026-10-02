const { BrowserWindow, dialog, protocol, session } = require('electron');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const APP_URL = 'still://journal/';
const root = path.join(__dirname, '..');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
]);

// A stable origin keeps diary storage independent of the executable's location.
function registerScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'still', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

function registerProtocol() {
  protocol.handle('still', async request => {
    const url = new URL(request.url);
    const asset = url.host === 'journal' && assets.get(url.pathname);
    if (!asset || request.method !== 'GET') return new Response('Not found', { status: 404 });
    try {
      return new Response(await readFile(path.join(root, asset[0])), {
        headers: { 'Content-Type': asset[1], 'Cache-Control': 'no-cache' },
      });
    } catch {
      return new Response('Could not load the application.', { status: 500 });
    }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({
      title: 'Export journal',
      filters: [{ name: 'JSON backup', extensions: ['json'] }],
    });
  });
}

function createWindow({ show = true } = {}) {
  const window = new BrowserWindow({
    title: 'Still — Personal Journal',
    width: 1160,
    height: 820,
    minWidth: 580,
    minHeight: 520,
    show: false,
    backgroundColor: '#fffefa',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== APP_URL) event.preventDefault();
  });
  window.webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(window, {
      type: 'question',
      title: 'Unsaved changes',
      message: 'Discard unsaved changes?',
      detail: 'Choose Keep writing to save your entry before closing.',
      buttons: ['Keep writing', 'Discard changes'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (choice === 1) event.preventDefault();
  });
  window.once('ready-to-show', () => { if (show) window.show(); });
  window.loadURL(APP_URL);
  return window;
}

module.exports = { APP_URL, registerScheme, registerProtocol, createWindow };
