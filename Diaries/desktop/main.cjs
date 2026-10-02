const { app } = require('electron');
const path = require('node:path');
const { registerScheme, registerProtocol, createWindow } = require('./window.cjs');

app.setName('Still');
app.commandLine.appendSwitch('lang', 'en-US');
app.setPath('userData', path.join(app.getPath('appData'), 'Still Journal'));
app.setAppUserModelId('com.still.journal');
registerScheme();

let window;
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!window || window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  });
  app.whenReady().then(() => {
    registerProtocol();
    window = createWindow();
    app.on('activate', () => {
      if (!window || window.isDestroyed()) window = createWindow();
    });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => {
    // Chromium owns the diary's persistent localStorage database.
    require('electron').session.defaultSession.flushStorageData();
  });
}
