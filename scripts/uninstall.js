const path = require('path');
const fs = require('fs');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'CAMmonitor',
  script: path.resolve(__dirname, '../service/service.js'),
});

svc.on('uninstall', () => {
  console.log('CAMmonitor service removed.');

  const dataDir = path.join(process.env.APPDATA, 'CAMmonitor');
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
    console.log(`Removed ${dataDir} (settings and logs deleted).`);
  }

  console.log('Done. Remove the app via Add/Remove Programs to finish.');
  process.exit(0);
});

svc.on('alreadyUninstalled', () => {
  console.log('CAMmonitor service was not installed — nothing to remove.');
  process.exit(0);
});

svc.on('error', (e) => {
  console.error('Uninstall failed:', e);
  process.exit(1);
});

svc.uninstall();
