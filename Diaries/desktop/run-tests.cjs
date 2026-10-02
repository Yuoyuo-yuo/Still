const { spawnSync } = require('node:child_process');
const { mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');
const electron = require('electron');
const testRoot = path.resolve(__dirname, '..', '.desktop-test-data');
const profile = path.join(testRoot, String(Date.now()));
mkdirSync(profile, { recursive: true });
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
for (const phase of ['write', 'read']) {
  const result = spawnSync(electron, [path.join(__dirname, 'test.cjs'), profile, phase], {
    stdio: 'inherit', env, timeout: 60000, windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
if (path.dirname(profile) !== testRoot) throw new Error('Unexpected test profile location');
rmSync(profile, { recursive: true, force: true });
console.log('Desktop checks passed. Temporary test profile removed.');
