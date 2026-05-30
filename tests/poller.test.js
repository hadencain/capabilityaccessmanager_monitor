const fs = require('fs');
const path = require('path');
const os = require('os');

jest.useFakeTimers();

const poller = require('../src/main/poller');

const FAKE_WAL = path.join(os.tmpdir(), 'fake-wal-' + process.pid);

afterEach(() => {
  if (fs.existsSync(FAKE_WAL)) fs.unlinkSync(FAKE_WAL);
});

test('calls onSize with 0 when WAL file does not exist', () => {
  const onSize = jest.fn();
  const p = poller.createPoller(FAKE_WAL, 60000, onSize);
  p.start();
  jest.runOnlyPendingTimers();
  expect(onSize).toHaveBeenCalledWith(0);
  p.stop();
});

test('calls onSize with actual file size when WAL exists', () => {
  fs.writeFileSync(FAKE_WAL, 'x'.repeat(1000));
  const onSize = jest.fn();
  const p = poller.createPoller(FAKE_WAL, 60000, onSize);
  p.start();
  jest.runOnlyPendingTimers();
  expect(onSize).toHaveBeenCalledWith(1000);
  p.stop();
});

test('polls on interval', () => {
  const onSize = jest.fn();
  const p = poller.createPoller(FAKE_WAL, 60000, onSize);
  p.start();
  jest.advanceTimersByTime(60000 * 3);
  expect(onSize).toHaveBeenCalledTimes(3);
  p.stop();
});

test('stop halts polling', () => {
  const onSize = jest.fn();
  const p = poller.createPoller(FAKE_WAL, 60000, onSize);
  p.start();
  jest.advanceTimersByTime(60000);
  p.stop();
  jest.advanceTimersByTime(60000 * 5);
  expect(onSize).toHaveBeenCalledTimes(1);
});
