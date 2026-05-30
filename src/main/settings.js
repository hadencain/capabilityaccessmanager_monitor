const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  warningThresholdBytes: 1073741824,
  autoRemediateThresholdBytes: 10737418240,
  autoRemediateEnabled: false,
  autoRemediateSchedule: { enabled: false, hour: 3 },
  launchAtStartup: false,
};

function getSettingsPath() {
  const base = process.env.CAMMONITOR_DATA || path.join(process.env.APPDATA, 'CAMmonitor');
  return path.join(base, 'settings.json');
}

let _cache = null;

function load() {
  if (_cache) return _cache;
  const p = getSettingsPath();
  let stored = {};
  if (fs.existsSync(p)) {
    try { stored = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) {}
  }
  _cache = Object.assign({}, DEFAULTS, stored);
  return _cache;
}

function save(s) {
  const p = getSettingsPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(s, null, 2));
  _cache = s;
}

function _reset() {
  _cache = null;
}

module.exports = { load, save, _reset, DEFAULTS };
