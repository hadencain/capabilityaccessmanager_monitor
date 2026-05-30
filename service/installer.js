const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'CAMmonitor',
  description: 'CAMmonitor — monitors and remediates CapabilityAccessManager.db-wal runaway growth',
  script: path.resolve(__dirname, 'service.js'),
});

const action = process.argv[2];

if (action === 'install') {
  svc.on('install', () => {
    console.log('CAMmonitor service installed. Starting...');
    svc.start();
  });
  svc.on('start', () => console.log('CAMmonitor service started.'));
  svc.on('error', (e) => console.error('Install error:', e));
  svc.install();
} else if (action === 'uninstall') {
  svc.on('uninstall', () => console.log('CAMmonitor service uninstalled.'));
  svc.on('error', (e) => console.error('Uninstall error:', e));
  svc.uninstall();
} else {
  console.log('Usage: node installer.js [install|uninstall]');
  console.log('Must be run as Administrator.');
  process.exit(1);
}
