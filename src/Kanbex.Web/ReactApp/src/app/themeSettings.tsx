import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

/** Пресеты акцентного цвета: seed для Dynamic Color из m3-expressive-react.
 *  Палитры пресетов считаются из схемы, поэтому хранится только seed. */
export interface AccentPreset {
  name: string
  seed: string
}

export const accentPresets: readonly AccentPreset[] = [
  { name: 'Фиолетовый', seed: '#6252E8' },
  { name: 'Розовый', seed: '#B34FA3' },
  { name: 'Коралловый', seed: '#D9584F' },
  { name: 'Оранжевый', seed: '#E8710A' },
  { name: 'Янтарный', seed: '#D99000' },
  { name: 'Зелёный', seed: '#2E8B57' },
  { name: 'Бирюзовый', seed: '#00897B' },
  { name: 'Голубой', seed: '#039BE5' },
  { name: 'Синий', seed: '#2E6FDB' },
  { name: 'Серый', seed: '#5F6368' },
]

/** Собственная тема пользователя: три выбранных цвета для превью,
 *  акцент (первый цвет) становится seed схемы. */
export interface CustomPalette {
  id: string
  name: string
  seed: string
  colors: [string, string, string]
}

const STORAGE_KEY = 'kanbex.theme'
const DEFAULT_SEED = '#6252E8'

interface ThemeSettings {
  mode: ThemeMode
  seed: string
  /** id активной своей темы; null — активен пресет (выбор по id, не по seed). */
  activeId: string | null
  setMode: (mode: ThemeMode) => void
  /** Выбор темы: seed схемы и id своей темы (null — выбран пресет). */
  selectTheme: (seed: string, activeId: string | null) => void
  customPalettes: readonly CustomPalette[]
  addCustomPalette: (palette: CustomPalette) => void
  removeCustomPalette: (id: string) => void
}

const ThemeSettingsContext = createContext<ThemeSettings | null>(null)

interface StoredTheme {
  mode?: unknown
  seed?: unknown
  activeId?: unknown
  customPalettes?: unknown
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function isSeedColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function isCustomPaletteList(value: unknown): value is CustomPalette[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      const palette = item as CustomPalette
      return (
        typeof palette?.id === 'string' &&
        palette.id.length > 0 &&
        typeof palette?.name === 'string' &&
        isSeedColor(palette?.seed) &&
        Array.isArray(palette?.colors) &&
        palette.colors.length === 3 &&
        palette.colors.every((color) => isSeedColor(color))
      )
    })
  )
}

interface StoredSettings {
  mode: ThemeMode
  seed: string
  activeId: string | null
  customPalettes: CustomPalette[]
}

function readStoredSettings(): StoredSettings {
  const fallback = {
    mode: 'light' as ThemeMode,
    seed: DEFAULT_SEED,
    activeId: null,
    customPalettes: [] as CustomPalette[],
  }
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as StoredTheme
    const customPalettes = isCustomPaletteList(parsed.customPalettes) ? parsed.customPalettes : fallback.customPalettes
    // Ссылка на свою тему валидна, только если такая тема ещё существует.
    const activePalette = customPalettes.find((palette) => palette.id === parsed.activeId)
    return {
      mode: isThemeMode(parsed.mode) ? parsed.mode : fallback.mode,
      seed: activePalette ? activePalette.seed : isSeedColor(parsed.seed) ? parsed.seed : fallback.seed,
      activeId: activePalette ? activePalette.id : null,
      customPalettes,
    }
  } catch {
    return fallback
  }
}

/**
 * Пользовательские настройки темы: режим (светлая/тёмная), акцентный цвет
 * и собственные палитры. Настройки живут в localStorage, а на <html>
 * выставляется data-theme-mode, чтобы CSS поверхностей приложения
 * переключался вместе с темой.
 */
export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => readStoredSettings())
  const { mode, seed, activeId, customPalettes } = settings

  useEffect(() => {
    document.documentElement.dataset.themeMode = mode
  }, [mode])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, seed, activeId, customPalettes }))
  }, [mode, seed, activeId, customPalettes])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setSettings((current) => ({ ...current, mode: nextMode }))
  }, [])

  const selectTheme = useCallback((nextSeed: string, nextActiveId: string | null) => {
    setSettings((current) => ({ ...current, seed: nextSeed, activeId: nextActiveId }))
  }, [])

  const addCustomPalette = useCallback((palette: CustomPalette) => {
    setSettings((current) => ({ ...current, customPalettes: [...current.customPalettes, palette] }))
  }, [])

  const removeCustomPalette = useCallback((id: string) => {
    setSettings((current) => ({
      ...current,
      customPalettes: current.customPalettes.filter((palette) => palette.id !== id),
    }))
  }, [])

  const value = useMemo(
    () => ({ mode, seed, activeId, setMode, selectTheme, customPalettes, addCustomPalette, removeCustomPalette }),
    [mode, seed, activeId, setMode, selectTheme, customPalettes, addCustomPalette, removeCustomPalette],
  )

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
}

export function useThemeSettings(): ThemeSettings {
  const settings = useContext(ThemeSettingsContext)
  if (!settings) {
    throw new Error('useThemeSettings должен использоваться внутри ThemeSettingsProvider.')
  }
  return settings
}
