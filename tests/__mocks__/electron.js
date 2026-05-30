const os = require('os');

module.exports = {
  app: {
    getPath: (name) => {
      if (name === 'appData') return os.tmpdir();
      return os.tmpdir();
    },
    quit: jest.fn(),
    setLoginItemSettings: jest.fn(),
    getLoginItemSettings: jest.fn(() => ({ openAtLogin: false })),
    whenReady: jest.fn(() => Promise.resolve()),
  },
  Notification: Object.assign(
    jest.fn().mockImplementation(() => ({ show: jest.fn() })),
    { isSupported: jest.fn(() => true) }
  ),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    webContents: { send: jest.fn() },
    on: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    isVisible: jest.fn(() => false),
    isDestroyed: jest.fn(() => false),
  })),
  Tray: jest.fn().mockImplementation(() => ({
    setImage: jest.fn(),
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  })),
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
  },
  nativeImage: {
    createFromPath: jest.fn(() => ({ isEmpty: jest.fn(() => false) })),
  },
  shell: {
    openPath: jest.fn(),
  },
};
