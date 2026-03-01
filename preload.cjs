const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("comptaApi", {
  loadTransactions: () => ipcRenderer.invoke("transactions:load"),
  saveTransactions: (transactions) =>
    ipcRenderer.invoke("transactions:save", transactions),
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  getDataPath: () => ipcRenderer.invoke("data-path:get"),
  selectDataPath: () => ipcRenderer.invoke("data-path:select"),
  resetDataPath: () => ipcRenderer.invoke("data-path:reset"),
});
