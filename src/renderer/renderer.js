const GB = 1073741824;
const MB = 1048576;

const readings = [];
let remediating = false;

const sizeEl    = document.getElementById('size-display');
const checkedEl = document.getElementById('last-checked');
const canvas    = document.getElementById('sparkline');
const progressEl = document.getElementById('progress');
const btnReset  = document.getElementById('btn-reset');

function formatBytes(bytes) {
  if (bytes === 0) return 'not present';
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

function colorClass(bytes) {
  if (bytes > GB) return 'red';
  if (bytes > 104857600) return 'yellow';
  return 'green';
}

function drawSparkline() {
  if (readings.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const max = Math.max(...readings, 1);
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  readings.forEach((val, i) => {
    const x = (i / (readings.length - 1)) * w;
    const y = h - (val / max) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

window.cam.onSizeUpdate(({ bytes, timestamp }) => {
  readings.push(bytes);
  if (readings.length > 60) readings.shift();
  sizeEl.textContent = formatBytes(bytes);
  sizeEl.className = `size-display ${colorClass(bytes)}`;
  checkedEl.textContent = `Last checked: ${new Date(timestamp).toLocaleTimeString()}`;
  drawSparkline();
});

window.cam.onRemediationProgress((event) => {
  const labels = {
    stopping_service:  'Stopping camsvc...',
    waiting_for_handle: 'Waiting for file handle release...',
    deleting_wal:      'Deleting WAL file...',
    restarting_service: 'Restarting camsvc...',
    verifying:         'Verifying...',
    done:              'Done.',
    error:             `Error: ${event.message}`,
  };
  progressEl.textContent = labels[event.status] || event.status;
  progressEl.className = `progress ${event.status === 'error' ? 'error' : event.status === 'done' ? 'done' : ''}`;
  if (event.status === 'done' || event.status === 'error') {
    remediating = false;
    btnReset.disabled = false;
  }
});

btnReset.addEventListener('click', () => {
  if (remediating) return;
  remediating = true;
  btnReset.disabled = true;
  progressEl.textContent = 'Connecting to service...';
  progressEl.className = 'progress';
  window.cam.requestRemediation();
});

window.cam.getSettings().then((s) => {
  document.getElementById('warn-threshold').value  = Math.round(s.warningThresholdBytes / MB);
  document.getElementById('auto-threshold').value  = Math.round(s.autoRemediateThresholdBytes / GB);
  document.getElementById('auto-remediate').checked = s.autoRemediateEnabled;
  document.getElementById('schedule-hour').value   = s.autoRemediateSchedule.hour;
  document.getElementById('schedule-enabled').checked = s.autoRemediateSchedule.enabled;
  document.getElementById('launch-startup').checked = s.launchAtStartup;
});

document.getElementById('btn-save').addEventListener('click', () => {
  const s = {
    warningThresholdBytes:      parseInt(document.getElementById('warn-threshold').value) * MB,
    autoRemediateThresholdBytes: parseInt(document.getElementById('auto-threshold').value) * GB,
    autoRemediateEnabled:       document.getElementById('auto-remediate').checked,
    autoRemediateSchedule: {
      enabled: document.getElementById('schedule-enabled').checked,
      hour:    parseInt(document.getElementById('schedule-hour').value),
    },
    launchAtStartup: document.getElementById('launch-startup').checked,
  };
  window.cam.saveSettings(s);
  const btn = document.getElementById('btn-save');
  btn.textContent = 'Saved ✓';
  setTimeout(() => { btn.textContent = 'Save Settings'; }, 1500);
});

document.getElementById('btn-log').addEventListener('click', () => {
  window.cam.openLog();
});
