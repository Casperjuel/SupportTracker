import { contextBridge, ipcRenderer } from 'electron'

declare global {
  interface Window {
    App: typeof API
  }
}

const API = {
  getData: (key: string) => ipcRenderer.invoke('store-get', key),
  setData: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
  onNativeThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('native-theme-changed', (_, theme) => callback(theme))
  },
  onNavigate: (callback: (view: string) => void) => {
    ipcRenderer.on('navigate', (_, view) => callback(view))
  },
}

contextBridge.exposeInMainWorld('App', API)
