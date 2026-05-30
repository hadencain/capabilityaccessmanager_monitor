const path = require('path');
const { Tray, Menu, nativeImage } = require('electron');

const ICONS = {
  green:  path.join(__dirname, '../../assets/icon-green.png'),
  yellow: path.join(__dirname, '../../assets/icon-yellow.png'),
  red:    path.join(__dirname, '../../assets/icon-red.png'),
};

const GB = 1073741824;
const MB100 = 104857600;

function formatBytes(bytes) {
  if (bytes === 0) return 'not present';
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

function iconForSize(bytes) {
  if (bytes > GB) return ICONS.red;
  if (bytes > MB100) return ICONS.yellow;
  return ICONS.green;
}

function createTray(onShowWindow, onResetNow, onQuit) {
  const tray = new Tray(ICONS.green);
  tray.setToolTip('CAMmonitor — loading...');

  function updateContextMenu(sizeLabel) {
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: `WAL: ${sizeLabel}`, enabled: false },
      { type: 'separator' },
      { label: 'Open CAMmonitor', click: onShowWindow },
      { label: 'Reset Now', click: onResetNow },
      { type: 'separator' },
      { label: 'Quit', click: onQuit },
    ]));
  }

  updateContextMenu('loading...');
  tray.on('click', onShowWindow);

  function updateState(bytes) {
    const label = formatBytes(bytes);
    tray.setImage(nativeImage.createFromPath(iconForSize(bytes)));
    tray.setToolTip(`CAMmonitor — WAL: ${label}`);
    updateContextMenu(label);
  }

  function destroy() { tray.destroy(); }

  return { updateState, destroy };
}

module.exports = { createTray, formatBytes };
