const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'CAMmonitor',
  description: 'CAMmonitor — monitors and remediates CapabilityAccessManager.db-wal runaway growth',
  script: path.resolve(__dirname, '../service/service.js'),
});

svc.on('install', () => {
  console.log('CAMmonitor service installed. Starting...');
  svc.start();
});

svc.on('start', () => {
  console.log('CAMmonitor service started and running.');
  console.log('You can now launch CAMmonitor normally.');
  process.exit(0);
});

svc.on('alreadyInstalled', () => {
  console.log('CAMmonitor service is already installed.');
  process.exit(0);
});

svc.on('error', (e) => {
  console.error('Install failed:', e);
  process.exit(1);
});

svc.install();
