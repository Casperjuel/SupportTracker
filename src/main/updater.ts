import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { BrowserWindow } from 'electron'
import { ENVIRONMENT } from 'shared/constants'

export function initAutoUpdater() {
  if (ENVIRONMENT.IS_DEV) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('update-status', { status: 'available', version: info.version })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('update-status', { status: 'downloaded', version: info.version })
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err)
  })

  autoUpdater.checkForUpdatesAndNotify()
}
