const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cam', {
  onSizeUpdate: (cb) => ipcRenderer.on('size-update', (_, data) => cb(data)),
  onRemediationProgress: (cb) => ipcRenderer.on('remediation-progress', (_, data) => cb(data)),
  requestRemediation: () => ipcRenderer.send('remediate-request'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  openLog: () => ipcRenderer.send('open-log'),
});
