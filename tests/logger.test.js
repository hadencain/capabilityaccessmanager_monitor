const fs = require('fs');
const path = require('path');
const os = require('os');

const TEST_DIR = path.join(os.tmpdir(), 'cammonitor-logger-test-' + process.pid);
process.env.CAMMONITOR_DATA = TEST_DIR;

const logger = require('../src/main/logger');

beforeEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.CAMMONITOR_DATA;
});

test('creates log file with header on first write', () => {
  logger.log(1234567, 'poll');
  const logPath = path.join(TEST_DIR, 'log.csv');
  expect(fs.existsSync(logPath)).toBe(true);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  expect(lines[0]).toBe('timestamp,bytes,event');
  expect(lines.length).toBe(2);
});

test('appends rows with correct fields', () => {
  logger.log(1000, 'poll');
  logger.log(2000, 'remediation_start');
  const logPath = path.join(TEST_DIR, 'log.csv');
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  expect(lines.length).toBe(3);
  const [ts, bytes, event] = lines[1].split(',');
  expect(new Date(ts).toString()).not.toBe('Invalid Date');
  expect(bytes).toBe('1000');
  expect(event).toBe('poll');
});

test('does not throw when data directory is missing', () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  expect(() => logger.log(0, 'poll')).not.toThrow();
});
