import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { SupportEntry, FieldsConfig, ThemeMode, BrandingConfig, SharedDbConfig } from 'shared/types'
import { DEFAULT_FIELDS, DEFAULT_BRANDING, DEFAULT_SHARED_DB, STORE_KEYS } from 'shared/constants'
import { fetchRemoteEntries, pushEntry, deleteRemoteEntry, resetClient, fetchRemoteFields, pushFields, subscribeToEntries, subscribeToConfig } from 'renderer/lib/supabase'

const { App } = window

interface StoreContextValue {
  data: SupportEntry[]
  fields: FieldsConfig
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  branding: BrandingConfig
  sharedDb: SharedDbConfig
  addEntry: (entry: Omit<SupportEntry, 'id'>) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  updateFields: (fields: FieldsConfig) => Promise<void>
  resetFields: () => Promise<void>
  setTheme: (mode: ThemeMode) => Promise<void>
  setBranding: (branding: BrandingConfig) => Promise<void>
  setSharedDb: (config: SharedDbConfig) => Promise<void>
  refreshFromRemote: () => Promise<void>
  clearAllData: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SupportEntry[]>([])
  const [fields, setFields] = useState<FieldsConfig>(DEFAULT_FIELDS)
  const [theme, setThemeState] = useState<ThemeMode>('auto')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [branding, setBrandingState] = useState<BrandingConfig>(DEFAULT_BRANDING)
  const [sharedDb, setSharedDbState] = useState<SharedDbConfig>(DEFAULT_SHARED_DB)

  useEffect(() => {
    async function load() {
      // Load local data
      let localData: SupportEntry[] = []
      const storedData = await App.getData(STORE_KEYS.DATA)
      if (Array.isArray(storedData)) localData = storedData

      // Migration from old keys
      if (localData.length === 0) {
        const oldData = await App.getData('gc_support_v1')
        if (Array.isArray(oldData) && oldData.length > 0) {
          localData = oldData
          await App.setData(STORE_KEYS.DATA, oldData)
        }
      }

      setData(localData)

      // Fields
      const storedFields = await App.getData(STORE_KEYS.SETTINGS)
      if (storedFields && typeof storedFields === 'object' && !Array.isArray(storedFields) && Object.keys(storedFields).length > 0) {
        setFields(storedFields as FieldsConfig)
      } else {
        const oldFields = await App.getData('gc_settings_v1')
        if (oldFields && typeof oldFields === 'object' && !Array.isArray(oldFields) && Object.keys(oldFields).length > 0) {
          setFields(oldFields as FieldsConfig)
          await App.setData(STORE_KEYS.SETTINGS, oldFields)
        }
      }

      // Theme
      const storedTheme = await App.getData(STORE_KEYS.THEME) as ThemeMode
      if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
        setThemeState(storedTheme)
        applyTheme(storedTheme)
      } else {
        applyTheme('auto')
      }

      // Branding
      const storedBranding = await App.getData(STORE_KEYS.BRANDING) as BrandingConfig
      if (storedBranding && storedBranding.orgName) {
        setBrandingState(storedBranding)
      }

      // Shared DB
      const storedSharedDb = await App.getData(STORE_KEYS.SHARED_DB) as SharedDbConfig
      if (storedSharedDb && typeof storedSharedDb === 'object') {
        setSharedDbState(storedSharedDb)

        // If shared DB is enabled, fetch remote data
        if (storedSharedDb.enabled && storedSharedDb.url && storedSharedDb.key) {
          try {
            const remoteData = await fetchRemoteEntries(storedSharedDb)
            // Remote is source of truth when shared DB is enabled
            const sorted = [...remoteData].sort(
              (a, b) => (b.dato as string).localeCompare(a.dato as string)
            )
            setData(sorted)
            await App.setData(STORE_KEYS.DATA, sorted)

            // Sync fields from remote (remote wins)
            const remoteFields = await fetchRemoteFields(storedSharedDb)
            if (remoteFields && Object.keys(remoteFields).length > 0) {
              setFields(remoteFields as FieldsConfig)
              await App.setData(STORE_KEYS.SETTINGS, remoteFields)
            }
          } catch (e) {
            console.error('Failed to sync from remote:', e)
          }

          // Subscribe to realtime changes
          subscribeToEntries(
            storedSharedDb,
            (newEntry) => {
              setData((prev) => {
                if (prev.some((d) => d.id === newEntry.id)) return prev
                const next = [newEntry, ...prev].sort(
                  (a, b) => (b.dato as string).localeCompare(a.dato as string)
                )
                App.setData(STORE_KEYS.DATA, next)
                return next
              })
            },
            (deletedId) => {
              setData((prev) => {
                const next = prev.filter((d) => d.id !== deletedId)
                App.setData(STORE_KEYS.DATA, next)
                return next
              })
            },
            (updatedEntry) => {
              setData((prev) => {
                const next = prev.map((d) => d.id === updatedEntry.id ? updatedEntry : d)
                App.setData(STORE_KEYS.DATA, next)
                return next
              })
            },
          )

          subscribeToConfig(storedSharedDb, (remoteFields) => {
            setFields(remoteFields as FieldsConfig)
            App.setData(STORE_KEYS.SETTINGS, remoteFields)
          })
        }
      }
    }
    load()

    App.onNativeThemeChanged((nativeTheme: string) => {
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

    // Push to remote if enabled
    if (sharedDb.enabled) {
      pushEntry(sharedDb, newEntry).catch(console.error)
    }
  }, [sharedDb])

  const deleteEntry = useCallback(async (id: number) => {
    setData((prev) => {
      const next = prev.filter((d) => d.id !== id)
      App.setData(STORE_KEYS.DATA, next)
      return next
    })

    if (sharedDb.enabled) {
      deleteRemoteEntry(sharedDb, id).catch(console.error)
    }
  }, [sharedDb])

  const updateFields = useCallback(async (newFields: FieldsConfig) => {
    setFields(newFields)
    await App.setData(STORE_KEYS.SETTINGS, newFields)
    if (sharedDb.enabled) {
      pushFields(sharedDb, newFields).catch(console.error)
    }
  }, [sharedDb])

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

  const setBranding = useCallback(async (b: BrandingConfig) => {
    setBrandingState(b)
    await App.setData(STORE_KEYS.BRANDING, b)
  }, [])

  const setSharedDb = useCallback(async (config: SharedDbConfig) => {
    setSharedDbState(config)
    await App.setData(STORE_KEYS.SHARED_DB, config)
    if (!config.enabled) resetClient()
  }, [])

  const refreshFromRemote = useCallback(async () => {
    if (!sharedDb.enabled) return
    const remoteData = await fetchRemoteEntries(sharedDb)
    const sorted = [...remoteData].sort(
      (a, b) => (b.dato as string).localeCompare(a.dato as string)
    )
    setData(sorted)
    await App.setData(STORE_KEYS.DATA, sorted)
  }, [sharedDb])

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
        branding,
        sharedDb,
        addEntry,
        deleteEntry,
        updateFields,
        resetFields,
        setTheme,
        setBranding,
        setSharedDb,
        refreshFromRemote,
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
