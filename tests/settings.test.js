const fs = require('fs');
const path = require('path');
const os = require('os');

const TEST_DIR = path.join(os.tmpdir(), 'cammonitor-settings-test-' + process.pid);
process.env.CAMMONITOR_DATA = TEST_DIR;

const settings = require('../src/main/settings');

beforeEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  settings._reset();
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.CAMMONITOR_DATA;
});

test('load returns defaults when no settings file exists', () => {
  const s = settings.load();
  expect(s.warningThresholdBytes).toBe(1073741824);
  expect(s.autoRemediateThresholdBytes).toBe(10737418240);
  expect(s.autoRemediateEnabled).toBe(false);
  expect(s.autoRemediateSchedule).toEqual({ enabled: false, hour: 3 });
  expect(s.launchAtStartup).toBe(false);
});

test('save and load round-trips settings', () => {
  const custom = {
    warningThresholdBytes: 500000000,
    autoRemediateThresholdBytes: 5000000000,
    autoRemediateEnabled: true,
    autoRemediateSchedule: { enabled: true, hour: 2 },
    launchAtStartup: false,
  };
  settings.save(custom);
  const loaded = settings.load();
  expect(loaded).toEqual(custom);
});

test('load merges missing keys with defaults', () => {
  fs.writeFileSync(
    path.join(TEST_DIR, 'settings.json'),
    JSON.stringify({ warningThresholdBytes: 200000000 })
  );
  settings._reset();
  const s = settings.load();
  expect(s.warningThresholdBytes).toBe(200000000);
  expect(s.autoRemediateEnabled).toBe(false);
});
