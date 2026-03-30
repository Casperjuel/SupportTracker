import { Tray, Menu, nativeImage, app, type BrowserWindow } from 'electron'
import { join } from 'node:path'
import { ENVIRONMENT } from 'shared/constants'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow) {
  // Use the logo.png from resources for the tray icon
  const iconPath = ENVIRONMENT.IS_DEV
    ? join(__dirname, '../../src/resources/build/icons/icon.png')
    : join(__dirname, '../../resources/build/icons/icon.png')

  let trayIcon: Electron.NativeImage
  try {
    trayIcon = nativeImage.createFromPath(iconPath)
  } catch {
    // Fallback: try the logo.png in project root during dev
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../logo.png'))
  }

  tray = new Tray(trayIcon.resize({ width: 18, height: 18 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Vis/skjul vindue',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    {
      label: 'Ny henvendelse',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', 'registrer')
      },
    },
    { type: 'separator' },
    {
      label: 'Afslut',
      click: () => {
        ;(app as any).isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('Grant Compass – Supporttracker')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
