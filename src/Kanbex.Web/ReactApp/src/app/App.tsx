import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { BrowserRouter } from 'react-router'
import { AppThemeProvider } from '@kanbex/ui'
import { AuthProvider } from '../features/auth/index.js'
import { AppRouter } from '../routes/index.js'
import { ThemeSettingsProvider, useThemeSettings } from './themeSettings.js'

function hexToHsl(hex: string): [number, number, number] {
  const red = parseInt(hex.slice(1, 3), 16) / 255
  const green = parseInt(hex.slice(3, 5), 16) / 255
  const blue = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  if (max === min) return [0, 0, lightness]

  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue: number
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0)
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4
  return [hue / 6, saturation, lightness]
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q
  const channel = (tone: number) => {
    const shifted = tone < 0 ? tone + 1 : tone > 1 ? tone - 1 : tone
    const value =
      shifted < 1 / 6
        ? p + (q - p) * 6 * shifted
        : shifted < 1 / 2
          ? q
          : shifted < 2 / 3
            ? p + (q - p) * (2 / 3 - shifted) * 6
            : p
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(hue + 1 / 3)}${channel(hue)}${channel(hue - 1 / 3)}`
}

/** Свой цвет для тёмной темы: тон и насыщенность сохраняются, светлота
 *  инвертируется и зажимается в тёмный диапазон роли — белая подложка
 *  становится тёмной, а не остаётся светлым пятном в тёмном оформлении. */
function invertToDark(hex: string, minLightness: number, maxLightness: number): string {
  const [hue, saturation, lightness] = hexToHsl(hex)
  const dark = Math.min(maxLightness, Math.max(minLightness, 1 - lightness))
  return hslToHex(hue, saturation, dark)
}

function ThemedApp() {
  const { mode, seed, activeId, customPalettes } = useThemeSettings()

  // Собственная тема: seed задаёт primary, а выбранные цвета «Чипов» и
  // «Подложек» перекрывают scheme-роли. Активная своя тема определяется
  // по id — пресет с тем же seed не должен подхватывать её перекрытия.
  // В светлой теме цвет применяется как есть; в тёмной его светлота
  // инвертируется в тёмный диапазон роли.
  const activeCustom = activeId ? customPalettes.find((palette) => palette.id === activeId) : undefined
  const overrideVars = useMemo<CSSProperties | undefined>(() => {
    if (!activeCustom) return undefined

    const [chips, surface] = [activeCustom.colors[1], activeCustom.colors[2]]

    if (mode === 'light') {
      return {
        '--md-sys-color-primary-container': chips,
        '--md-sys-color-surface-container': surface,
        '--md-sys-color-surface-container-low': surface,
        '--md-sys-color-surface-container-high': surface,
      } as CSSProperties
    }

    return {
      '--md-sys-color-primary-container': invertToDark(chips, 0.16, 0.32),
      '--md-sys-color-surface-container-low': invertToDark(surface, 0.08, 0.12),
      '--md-sys-color-surface-container': invertToDark(surface, 0.1, 0.14),
      '--md-sys-color-surface-container-high': invertToDark(surface, 0.12, 0.16),
    } as CSSProperties
  }, [activeCustom, mode])

  return (
    <AppThemeProvider seedColor={seed} mode={mode}>
      <div className="kb-app" style={overrideVars}>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </div>
    </AppThemeProvider>
  )
}

/**
 * Корень React-приложения: пользовательские настройки темы (режим,
 * акцентный цвет и собственные палитры), тема Material 3, роутер и сессия.
 * `BrowserRouter` работает на корне сайта; Razor-хост отдаёт SPA для
 * клиентских маршрутов.
 */
export function App() {
  return (
    <ThemeSettingsProvider>
      <ThemedApp />
    </ThemeSettingsProvider>
  )
}

export default App
