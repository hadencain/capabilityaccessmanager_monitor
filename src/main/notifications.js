const { Notification } = require('electron');

const GB = 1073741824;

function formatBytes(bytes) {
  if (bytes === 0) return 'not present';
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

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
