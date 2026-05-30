const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const settings = require('./settings');
const logger = require('./logger');
const { createPoller } = require('./poller');
const { check: checkThresholds, reset: resetThresholds } = require('./thresholds');
const { createTray } = require('./tray');
const { notifyWarning, notifyError } = require('./notifications');
const pipeClient = require('./pipe-client');

const WAL_PATH = 'C:\\ProgramData\\Microsoft\\Windows\\CapabilityAccessManager\\CapabilityAccessManager.db-wal';
const WAL_POLL_INTERVAL = 60000;

let win = null;
let tray = null;
let lastBytes = 0;
let scheduledRemediationDate = null;

function createWindow() {
  win = new BrowserWindow({
    width: 320,
    height: 540,
    show: false,
    frame: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  win.on('blur', () => win.hide());
}

function showWindow() {
  if (!win) return;
  win.isVisible() ? win.hide() : win.show();
}

function sendToRenderer(channel, data) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

function checkSchedule(s) {
  if (!s.autoRemediateSchedule?.enabled) return false;
  const now = new Date();
  const today = now.toDateString();
  if (now.getHours() === s.autoRemediateSchedule.hour && scheduledRemediationDate !== today) {
    scheduledRemediationDate = today;
    return true;
  }
  return false;
}

function triggerRemediation() {
  if (pipeClient.isActive()) return;
  logger.log(lastBytes, 'remediation_start');
  pipeClient.remediate(
    lastBytes,
    (progress) => sendToRenderer('remediation-progress', progress),
    (result) => {
      const walAfter = result.walSizeAfter || 0;
      logger.log(walAfter, result.success ? 'remediation_done' : 'remediation_error');
      if (!result.success || !result.serviceRunning) {
        notifyError(result.message || 'Remediation failed — check %APPDATA%\\CAMmonitor\\log.csv');
      }
    }
  );
}

app.whenReady().then(() => {
  const s = settings.load();
  app.setLoginItemSettings({ openAtLogin: s.launchAtStartup });
  resetThresholds();

  createWindow();

  tray = createTray(showWindow, triggerRemediation, () => app.quit());

  const poller = createPoller(WAL_PATH, WAL_POLL_INTERVAL, (bytes) => {
    lastBytes = bytes;
    logger.log(bytes, 'poll');
    tray.updateState(bytes);
    sendToRenderer('size-update', { bytes, timestamp: Date.now() });

    const current = settings.load();
    const actions = checkThresholds(bytes, current);

    if (actions.warn) {
      logger.log(bytes, 'warning_threshold_crossed');
      notifyWarning(bytes);
    }

    const scheduleTriggered = checkSchedule(current);
    if (actions.autoRemediate || scheduleTriggered) {
      triggerRemediation();
    }
  });

  poller.start();

  ipcMain.on('remediate-request', () => triggerRemediation());

  ipcMain.handle('get-settings', () => settings.load());

  ipcMain.handle('save-settings', (_, s) => {
    settings.save(s);
    app.setLoginItemSettings({ openAtLogin: s.launchAtStartup });
  });

  ipcMain.on('open-log', () => {
    shell.openPath(logger.getLogPath());
  });

  app.on('window-all-closed', (e) => e.preventDefault());
});
