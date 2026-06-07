const fs = require('fs');
const path = require('path');
const os = require('os');

const FAKE_WAL = path.join(os.tmpdir(), 'fake-remediate-wal-' + process.pid);

jest.mock('child_process', () => ({ execSync: jest.fn() }));

const { execSync } = require('child_process');
const { runRemediation } = require('../service/remediate');

beforeEach(() => {
  jest.clearAllMocks();
  if (fs.existsSync(FAKE_WAL)) fs.unlinkSync(FAKE_WAL);

  let queryCount = 0;
  execSync.mockImplementation((cmd) => {
    if (cmd === 'sc query camsvc') {
      queryCount++;
      return queryCount <= 3
        ? 'STATE              : 1  STOPPED'
        : 'STATE              : 4  RUNNING';
    }
    return '';
  });
});

afterAll(() => {
  if (fs.existsSync(FAKE_WAL)) fs.unlinkSync(FAKE_WAL);
});

test('returns success with walGone=true when WAL does not exist', async () => {
  const events = [];
  const result = await runRemediation((e) => events.push(e), FAKE_WAL);
  expect(result.success).toBe(true);
  expect(result.walGone).toBe(true);
  const statuses = events.map((e) => e.status);
  expect(statuses).toContain('stopping_service');
  expect(statuses).toContain('deleting_wal');
  expect(statuses).toContain('restarting_service');
  expect(statuses).toContain('done');
});

test('deletes WAL file when it exists', async () => {
  fs.writeFileSync(FAKE_WAL, 'x'.repeat(100));
  const result = await runRemediation(() => {}, FAKE_WAL);
  expect(result.success).toBe(true);
  expect(result.walGone).toBe(true);
  expect(fs.existsSync(FAKE_WAL)).toBe(false);
});

test('emits error status when camsvc does not stop in time', async () => {
  execSync.mockImplementation((cmd) => {
    if (cmd === 'sc query camsvc') return 'STATE              : 4  RUNNING';
    return '';
  });
  const events = [];
  const result = await runRemediation((e) => events.push(e), FAKE_WAL);
  expect(result.success).toBe(false);
  expect(events.some((e) => e.status === 'error')).toBe(true);
}, 20000);

test('reports correct walSizeBefore', async () => {
  fs.writeFileSync(FAKE_WAL, 'x'.repeat(500));
  const result = await runRemediation(() => {}, FAKE_WAL);
  expect(result.walSizeBefore).toBe(500);
});
