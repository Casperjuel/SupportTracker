import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

import { createWindow } from 'lib/electron-app/factories/windows/create'
import { ENVIRONMENT } from 'shared/constants'
import { displayName } from '~/package.json'

export async function MainWindow() {
  const window = createWindow({
    id: 'main',
    title: displayName,
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    center: true,
    movable: true,
    resizable: true,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 18 },

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  // Retry loading if dev server isn't ready yet
  window.webContents.on('did-fail-load', (_event, errorCode) => {
    if (ENVIRONMENT.IS_DEV) {
      // Dev server not ready yet — retry after a short delay
      // -102 = ERR_CONNECTION_REFUSED, -6 = ERR_FILE_NOT_FOUND, -3 = ERR_ABORTED
      setTimeout(() => {
        window.webContents.reload()
      }, 1500)
    }
  })

  window.webContents.on('did-finish-load', () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    window.show()
  })

  window.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      window.hide()
    }
  })

  return window
}
