import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

export interface FieldConfig {
  label: string
  type: 'select' | 'text' | 'textarea' | 'toggle' | 'combobox'
  required: boolean
  options?: string[]
  placeholder?: string
  full?: boolean
}

export interface FieldsConfig {
  [key: string]: FieldConfig
}

export interface SupportEntry {
  id: number
  dato: string
  [key: string]: string | number
}

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface BrandingConfig {
  orgName: string
  subtitle: string
}

export interface SharedDbConfig {
  enabled: boolean
  url: string
  key: string
}
