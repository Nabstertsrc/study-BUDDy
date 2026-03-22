const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    getFile: (name) => ipcRenderer.invoke('get-file', name),
    deleteFile: (name) => ipcRenderer.invoke('delete-file', name),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    showNotification: (data) => ipcRenderer.send('show-notification', data),
    openAppWindow: () => ipcRenderer.send('open-app-window'),
    checkAIStatus: (keys) => ipcRenderer.invoke('check-ai-status', keys),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
    downloadUrl: (data) => ipcRenderer.invoke('download-url', data),
});
