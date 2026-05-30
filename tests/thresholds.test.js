const thresholds = require('../src/main/thresholds');

const baseSettings = {
  warningThresholdBytes: 1073741824,
  autoRemediateThresholdBytes: 10737418240,
  autoRemediateEnabled: false,
};

beforeEach(() => thresholds.reset());

test('returns no actions below warning threshold', () => {
  const result = thresholds.check(500000000, baseSettings);
  expect(result.warn).toBe(false);
  expect(result.autoRemediate).toBe(false);
});

test('fires warn on first crossing of warning threshold', () => {
  const result = thresholds.check(2000000000, baseSettings);
  expect(result.warn).toBe(true);
});

test('does not re-fire warn while still above threshold', () => {
  thresholds.check(2000000000, baseSettings);
  const result = thresholds.check(3000000000, baseSettings);
  expect(result.warn).toBe(false);
});

test('resets warn flag when size drops below threshold', () => {
  thresholds.check(2000000000, baseSettings);
  thresholds.check(100000000, baseSettings);
  const result = thresholds.check(2000000000, baseSettings);
  expect(result.warn).toBe(true);
});

test('autoRemediate is false when disabled even above threshold', () => {
  const result = thresholds.check(20000000000, baseSettings);
  expect(result.autoRemediate).toBe(false);
});

test('autoRemediate fires when enabled and above threshold', () => {
  const s = { ...baseSettings, autoRemediateEnabled: true };
  const result = thresholds.check(20000000000, s);
  expect(result.autoRemediate).toBe(true);
});

test('autoRemediate does not fire below threshold even when enabled', () => {
  const s = { ...baseSettings, autoRemediateEnabled: true };
  const result = thresholds.check(1000000000, s);
  expect(result.autoRemediate).toBe(false);
});
