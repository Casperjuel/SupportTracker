import { Tray, Menu, nativeImage, app, type BrowserWindow } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

let tray: Tray | null = null

function findIcon(): string {
  // In production, public assets are in the app's resources
  const candidates = [
    join(app.getAppPath(), 'renderer', 'tray-icon.png'),
    join(app.getAppPath(), '..', 'renderer', 'tray-icon.png'),
    join(__dirname, '../renderer/tray-icon.png'),
    join(__dirname, '../../src/resources/public/tray-icon.png'),
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }

  return ''
}

export function createTray(mainWindow: BrowserWindow) {
  const iconPath = findIcon()
  let trayIcon: Electron.NativeImage

  if (iconPath) {
    trayIcon = nativeImage.createFromPath(iconPath)
  } else {
    // Fallback: 16x16 green circle
    trayIcon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAA' +
      'QCAYAAAAf8/9hAAAAgklEQVQ4T2NkoBAwUqifgWoGMP7//5+BkZHx' +
      'PzYXMDIy/mdgYPjPwMDA+P//f0ZGRkZGBgYGRlxqGBkZ/zMyMjL+' +
      'BxnAyMjIyIAtDEAGMDIyMoJcQMgF2NQgfI3VAEYQ58+fP4z///9n' +
      '/PPnDyMjI+P/P3/+MIJiCRRLIF/jShfkpwsANbsy3IR3eSoAAAAA' +
      'SUVORK5CYII='
    )
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

  tray.setToolTip('SupportTracker')
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
