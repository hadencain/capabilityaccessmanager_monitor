const path = require('path');
const { Tray, Menu, nativeImage } = require('electron');
const { formatBytes } = require('./utils');

const ICONS = {
  green:  path.join(__dirname, '../../assets/icon-green.png'),
  yellow: path.join(__dirname, '../../assets/icon-yellow.png'),
  red:    path.join(__dirname, '../../assets/icon-red.png'),
};

const GB = 1073741824;
const MB100 = 104857600;

function iconForSize(bytes) {
  if (bytes > GB) return ICONS.red;
  if (bytes > MB100) return ICONS.yellow;
  return ICONS.green; // includes 0 (not present) — green is correct per spec
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
    const img = nativeImage.createFromPath(iconForSize(bytes));
    if (img.isEmpty()) {
      process.stderr.write(`[tray] icon asset missing: ${iconForSize(bytes)}\n`);
    } else {
      tray.setImage(img);
    }
    tray.setToolTip(`CAMmonitor — WAL: ${label}`);
    updateContextMenu(label);
  }

  function destroy() { tray.destroy(); }

  return { updateState, destroy };
}

module.exports = { createTray, formatBytes };
