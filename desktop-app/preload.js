const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend control
  backend: {
    start: () => ipcRenderer.invoke('backend:start'),
    stop: () => ipcRenderer.invoke('backend:stop'),
    status: () => ipcRenderer.invoke('backend:status')
  },
  
  // Simulation control
  simulation: {
    start: () => ipcRenderer.invoke('simulation:start'),
    stop: () => ipcRenderer.invoke('simulation:stop')
  },
  
  // Save management
  saves: {
    list: () => ipcRenderer.invoke('saves:list'),
    createNew: (saveName) => ipcRenderer.invoke('saves:createNew', saveName),
    load: (saveId) => ipcRenderer.invoke('saves:load', saveId),
    delete: (saveId) => ipcRenderer.invoke('saves:delete', saveId),
    getActive: () => ipcRenderer.invoke('saves:getActive')
  },
  
  // Configuration
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll')
  },
  
  // App control
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    returnToMenu: () => ipcRenderer.invoke('app:returnToMenu'),
    navigate: (page) => ipcRenderer.invoke('app:navigate', page)
  },
  
  // App info
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
