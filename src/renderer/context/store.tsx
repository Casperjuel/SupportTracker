import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { SupportEntry, FieldsConfig, ThemeMode } from 'shared/types'
import { DEFAULT_FIELDS, STORE_KEYS } from 'shared/constants'

const { App } = window

interface StoreContextValue {
  data: SupportEntry[]
  fields: FieldsConfig
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  addEntry: (entry: Omit<SupportEntry, 'id'>) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  updateFields: (fields: FieldsConfig) => Promise<void>
  resetFields: () => Promise<void>
  setTheme: (mode: ThemeMode) => Promise<void>
  clearAllData: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SupportEntry[]>([])
  const [fields, setFields] = useState<FieldsConfig>(DEFAULT_FIELDS)
  const [theme, setThemeState] = useState<ThemeMode>('auto')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    async function load() {
      const storedData = await App.getData(STORE_KEYS.DATA)
      if (Array.isArray(storedData)) setData(storedData)

      const storedFields = await App.getData(STORE_KEYS.SETTINGS)
      if (storedFields && typeof storedFields === 'object' && !Array.isArray(storedFields) && Object.keys(storedFields).length > 0) {
        setFields(storedFields as FieldsConfig)
      }

      const storedTheme = await App.getData(STORE_KEYS.THEME) as ThemeMode
      if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
        setThemeState(storedTheme)
        applyTheme(storedTheme)
      } else {
        applyTheme('auto')
      }
    }
    load()

    App.onNativeThemeChanged((nativeTheme: string) => {
      // Only update if in auto mode
      const currentTheme = document.documentElement.dataset.themeMode
      if (currentTheme === 'auto') {
        const resolved = nativeTheme === 'dark' ? 'dark' : 'light'
        setResolvedTheme(resolved)
        document.documentElement.classList.toggle('dark', resolved === 'dark')
      }
    })
  }, [])

  async function applyTheme(mode: ThemeMode) {
    document.documentElement.dataset.themeMode = mode
    if (mode === 'auto') {
      const native = await App.getNativeTheme() as string
      const resolved = native === 'dark' ? 'dark' : 'light'
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    } else {
      setResolvedTheme(mode)
      document.documentElement.classList.toggle('dark', mode === 'dark')
    }
  }

  const addEntry = useCallback(async (entry: Omit<SupportEntry, 'id'>) => {
    const newEntry = { ...entry, id: Date.now() } as SupportEntry
    setData((prev) => {
      const next = [newEntry, ...prev]
      App.setData(STORE_KEYS.DATA, next)
      return next
    })
  }, [])

  const deleteEntry = useCallback(async (id: number) => {
    setData((prev) => {
      const next = prev.filter((d) => d.id !== id)
      App.setData(STORE_KEYS.DATA, next)
      return next
    })
  }, [])

  const updateFields = useCallback(async (newFields: FieldsConfig) => {
    setFields(newFields)
    await App.setData(STORE_KEYS.SETTINGS, newFields)
  }, [])

  const resetFields = useCallback(async () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_FIELDS))
    setFields(fresh)
    await App.setData(STORE_KEYS.SETTINGS, fresh)
  }, [])

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeState(mode)
    await App.setData(STORE_KEYS.THEME, mode)
    applyTheme(mode)
  }, [])

  const clearAllData = useCallback(async () => {
    setData([])
    await App.setData(STORE_KEYS.DATA, [])
  }, [])

  return (
    <StoreContext.Provider
      value={{
        data,
        fields,
        theme,
        resolvedTheme,
        addEntry,
        deleteEntry,
        updateFields,
        resetFields,
        setTheme,
        clearAllData,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
