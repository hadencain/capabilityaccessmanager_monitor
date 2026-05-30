const fs = require('fs');
const { execSync } = require('child_process');

const WAL_PATH = process.env.CAMMONITOR_WAL_PATH ||
  'C:\\ProgramData\\Microsoft\\Windows\\CapabilityAccessManager\\CapabilityAccessManager.db-wal';

const STOP_TIMEOUT_MS = 15000;
const DELETE_TIMEOUT_MS = 30000;
const START_TIMEOUT_MS = 10000;
const POLL_MS = 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function queryServiceState() {
  try {
    return execSync('sc query camsvc', { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return e.stdout || '';
  }
}

async function waitForState(targetState, timeoutMs) {
  const marker = targetState === 'STOPPED'
    ? 'STATE              : 1  STOPPED'
    : 'STATE              : 4  RUNNING';
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (queryServiceState().includes(marker)) return true;
    await sleep(POLL_MS);
  }
  return false;
}

async function runRemediation(onProgress) {
  let walSizeBefore = 0;
  try {
    walSizeBefore = fs.existsSync(WAL_PATH) ? fs.statSync(WAL_PATH).size : 0;
  } catch (_) {}

  onProgress({ status: 'stopping_service' });
  try { execSync('sc stop camsvc', { stdio: 'pipe' }); } catch (_) {}

  const stopped = await waitForState('STOPPED', STOP_TIMEOUT_MS);
  if (!stopped) {
    const msg = 'camsvc did not stop within 15s';
    onProgress({ status: 'error', message: msg });
    return { success: false, walGone: false, serviceRunning: true, walSizeBefore, message: msg };
  }

  onProgress({ status: 'deleting_wal' });
  const deadline = Date.now() + DELETE_TIMEOUT_MS;
  let walGone = false;
  while (Date.now() < deadline) {
    if (!fs.existsSync(WAL_PATH)) { walGone = true; break; }
    try {
      fs.unlinkSync(WAL_PATH);
      walGone = true;
      break;
    } catch (e) {
      if (e.code === 'ENOENT') { walGone = true; break; }
      onProgress({ status: 'waiting_for_handle' });
      await sleep(2000);
    }
  }

  if (!walGone) {
    const msg = 'WAL still locked after 30s — camsvc may need manual intervention';
    onProgress({ status: 'error', message: msg });
    try { execSync('sc start camsvc', { stdio: 'pipe' }); } catch (_) {}
    return { success: false, walGone: false, serviceRunning: false, walSizeBefore, message: msg };
  }

  onProgress({ status: 'restarting_service' });
  try { execSync('sc start camsvc', { stdio: 'pipe' }); } catch (_) {}

  onProgress({ status: 'verifying' });
  const serviceRunning = await waitForState('RUNNING', START_TIMEOUT_MS);

  const done = {
    status: 'done',
    walGone: true,
    serviceRunning,
    walSizeBefore,
    walSizeAfter: fs.existsSync(WAL_PATH) ? fs.statSync(WAL_PATH).size : 0,
    message: serviceRunning ? undefined : 'WAL deleted but camsvc failed to restart — manual intervention required',
  };

  onProgress(done);
  return { success: true, ...done };
}

module.exports = { runRemediation, WAL_PATH };
