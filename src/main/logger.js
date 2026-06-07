const fs = require('fs');
const path = require('path');

const HEADER = 'timestamp,bytes,event';

function getLogPath() {
  const base = process.env.CAMMONITOR_DATA || path.join(process.env.APPDATA, 'CAMmonitor');
  return path.join(base, 'log.csv');
}

function log(bytes, event) {
  try {
    const logPath = getLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const exists = fs.existsSync(logPath);
    const row = `${new Date().toISOString()},${bytes},"${event}"\n`;
    if (!exists) {
      fs.writeFileSync(logPath, HEADER + '\n' + row);
    } else {
      fs.appendFileSync(logPath, row);
    }
  } catch (e) {
    process.stderr.write(`[logger] write failed: ${e.message}\n`);
  }
}

module.exports = { log, getLogPath };
