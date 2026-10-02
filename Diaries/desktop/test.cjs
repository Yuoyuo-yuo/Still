// Runs the existing UI in an isolated Electron profile, never the user's journal.
const { app, session, dialog } = require('electron');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { registerScheme, registerProtocol, createWindow } = require('./window.cjs');
const profile = process.argv[2];
const phase = process.argv[3];
if (!profile || !['write', 'read'].includes(phase)) throw new Error('Test profile and phase required');
app.setPath('userData', path.resolve(profile));
registerScheme();
let window;
const errors = [];
const execute = code => window.webContents.executeJavaScript(code);

app.whenReady().then(async () => {
  registerProtocol();
  window = createWindow({ show: false });
  window.webContents.on('console-message', (_event, details) => {
    if (details.level === 'error') errors.push(details.message);
  });
  await new Promise((resolve, reject) => {
    window.webContents.once('did-finish-load', resolve);
    window.webContents.once('did-fail-load', (_e, code, message) => reject(new Error(`${code}: ${message}`)));
  });
  // Native dialog close events are animation-frame driven; exercise a real visible window.
  window.show();
  const preferences = window.webContents.getLastWebPreferences();
  assert.equal(preferences.nodeIntegration, false);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.sandbox, true);
  assert.equal(await execute('typeof require'), 'undefined');

  if (phase === 'write') {
    assert.equal(await execute('entries.length'), 0);
    await execute("newEntry().then(() => { $('title').value = 'Desktop test'; $('content').value = 'A quiet afternoon with lighthouse thoughts.'; save(); })");
    const saved = await execute('JSON.parse(localStorage.getItem(KEY))[0]');
    assert.equal(saved.title, 'Desktop test');
    assert.ok(Number.isFinite(Date.parse(saved.createdAt)));
    assert.equal(await execute("$('archive').querySelectorAll('.entry').length"), 1);
    await execute("$('edit').click(); $('content').value = 'Edited lighthouse thoughts.'; save();");
    assert.equal(await execute('entries[0].createdAt'), saved.createdAt);
    assert.equal(await execute('entries[0].content'), 'Edited lighthouse thoughts.');
    assert.ok(Date.parse(await execute('entries[0].updatedAt')) >= Date.parse(saved.updatedAt));
    for (const query of ['Desktop test', 'lighthouse', saved.createdAt.slice(0, 7)]) {
      await execute(`$('search').value = ${JSON.stringify(query)}; renderArchive();`);
      assert.equal(await execute("$('archive').querySelectorAll('.entry').length"), 1);
    }
    await execute("$('search').value = 'missing-keyword'; renderArchive();");
    assert.equal(await execute("$('archive').querySelectorAll('.entry').length"), 0);
    await execute("$('search').value = ''; renderArchive(); $('archive').querySelector('.entry').click();");
    assert.equal(await execute("$('content').value"), 'Edited lighthouse thoughts.');

    // Verify actual Electron download handling with the existing Export button.
    const exportPath = path.join(profile, 'backup.json');
    const downloaded = new Promise((resolve, reject) => {
      session.defaultSession.once('will-download', (_event, item) => {
        item.setSavePath(exportPath);
        item.once('done', (_e, state) => state === 'completed' ? resolve() : reject(new Error(state)));
      });
    });
    await execute("$('export').click()");
    await downloaded;
    const backup = JSON.parse(await fs.readFile(exportPath, 'utf8'));
    assert.equal(backup.entries[0].content, 'Edited lighthouse thoughts.');
    // Feed the existing file-input handler a File, including duplicate-ID protection.
    const importEntry = { id: 'test-import', title: 'Imported entry', content: 'Backup restored', createdAt: saved.createdAt, updatedAt: saved.updatedAt };
    await execute(`(async () => { const transfer = new DataTransfer(); transfer.items.add(new File([JSON.stringify({version:1,entries:[${JSON.stringify(importEntry)},${JSON.stringify(saved)}]})], 'backup.json', {type:'application/json'})); $('import-file').files = transfer.files; await $('import-file').onchange({target:$('import-file')}); })()`);
    assert.equal(await execute('entries.length'), 2);
    assert.equal(await execute("entries.find(e=>e.title==='Desktop test').content"), 'Edited lighthouse thoughts.');
    await execute("openEntry(entries.find(e=>e.id==='test-import')); $('delete').click();");
    assert.equal(await execute("$('confirm-dialog').open"), true);
    await execute("$('confirm-dialog').close('accept')");
    // A separate renderer task lets the dialog close event finish.
    await execute('new Promise(resolve => setTimeout(resolve, 50))');
    assert.equal(await execute('entries.length'), 1);
    await execute("$('edit').click(); $('content').value = 'Unsaved test'; $('content').dispatchEvent(new Event('input')); $('new').click();");
    assert.equal(await execute("$('confirm-dialog').open"), true);
    await execute("$('confirm-dialog').close('cancel')");
    await execute('new Promise(resolve => setTimeout(resolve, 50))');
    assert.equal(await execute("$('content').value"), 'Unsaved test');

    // Exercise the desktop close guard, choosing Keep writing, then Discard.
    const originalDialog = dialog.showMessageBoxSync;
    let closeGuardSeen = false;
    dialog.showMessageBoxSync = () => { closeGuardSeen = true; return 0; };
    window.close();
    await new Promise(resolve => setTimeout(resolve, 200));
    assert.equal(closeGuardSeen, true);
    assert.equal(window.isDestroyed(), false);
    dialog.showMessageBoxSync = originalDialog;
    await execute("dirty=false; openEntry(entries[0]); setTheme(true); localStorage.setItem('still.theme','dark');");
    await session.defaultSession.flushStorageData();
    console.log('PASS: create, save, edit, archive, search, export, import, delete, unsaved guard, sandbox');
  } else {
    assert.equal(await execute('entries.length'), 1);
    assert.equal(await execute("$('content').value"), 'Edited lighthouse thoughts.');
    assert.equal(await execute("document.body.classList.contains('dark')"), true);
    assert.equal(await execute("$('archive').querySelectorAll('.entry').length"), 1);
    console.log('PASS: journal and theme persisted across complete desktop process restart');
  }
  assert.deepEqual(errors, []);
  window.destroy();
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
