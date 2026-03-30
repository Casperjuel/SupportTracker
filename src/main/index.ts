import { app, globalShortcut, ipcMain, nativeTheme, BrowserWindow } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { loadReactDevtools } from 'lib/electron-app/utils'
import { ENVIRONMENT } from 'shared/constants'
import { MainWindow } from './windows/main'
import { createTray } from './tray'
import { waitFor } from 'shared/utils'

import Store from 'electron-store'
import { initAutoUpdater } from './updater'

const store = new Store({ name: 'supporttracker_data' })

// IPC handlers for persistent storage
ipcMain.handle('store-get', (_, key: string) => {
  return store.get(key, key.includes('theme') ? 'auto' : [])
})

ipcMain.handle('store-set', (_, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('get-native-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

// Listen for system theme changes
nativeTheme.on('updated', () => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(
      'native-theme-changed',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    )
  }
})

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  const window = await makeAppSetup(MainWindow)

  createTray(window)
  initAutoUpdater()

  // Global shortcut: Cmd+Shift+G to toggle window
  globalShortcut.register('CommandOrControl+Shift+G', () => {
    if (window.isVisible()) {
      window.hide()
    } else {
      window.show()
      window.focus()
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  if (ENVIRONMENT.IS_DEV) {
    await loadReactDevtools()
    window.webContents.once('devtools-opened', async () => {
      await waitFor(1000)
      window.webContents.reload()
    })
  }
})
