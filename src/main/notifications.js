const { Notification } = require('electron');
const { formatBytes } = require('./utils');

function notifyWarning(bytes) {
  if (!Notification.isSupported()) return;
  new Notification({
    title: 'CAMmonitor — Warning',
    body: `WAL file has grown to ${formatBytes(bytes)}. Consider running Reset Now.`,
  }).show();
}

function notifyError(message) {
  if (!Notification.isSupported()) return;
  new Notification({
    title: 'CAMmonitor — Remediation Error',
    body: message,
  }).show();
}

module.exports = { notifyWarning, notifyError };
