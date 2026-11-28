/** @jest-environment jsdom */
import { act } from 'react'

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { createRoot } from 'react-dom/client'

import { accentPresets, ThemeSettingsProvider, useThemeSettings } from './themeSettings.js'

import type { Root } from 'react-dom/client'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function ThemeProbe() {
  const { mode, seed, activeId, setMode, selectTheme } = useThemeSettings()

  return (
    <>
      <output data-testid="mode">{mode}</output>
      <output data-testid="seed">{seed}</output>
      <output data-testid="activeId">{activeId}</output>
      <button type="button" onClick={() => setMode('dark')}>dark</button>
      <button type="button" onClick={() => selectTheme(accentPresets[1]!.seed, null)}>accent</button>
      <button type="button" onClick={() => selectTheme('#2E8B57', 'custom-1')}>custom</button>
    </>
  )
}

let container: HTMLDivElement
let root: Root

function renderProbe() {
  act(() => {
    root.render(
      <ThemeSettingsProvider>
        <ThemeProbe />
      </ThemeSettingsProvider>,
    )
  })
}

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.themeMode
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('accentPresets', () => {
  it('has unique seeds and keeps the default accent first', () => {
    const seeds = accentPresets.map((preset) => preset.seed)

    expect(new Set(seeds).size).toBe(seeds.length)
    expect(seeds[0]).toBe('#6252E8')
  })
})

describe('ThemeSettingsProvider', () => {
  it('starts with the light mode and the Kanbex accent', () => {
    renderProbe()

    expect(container.querySelector('[data-testid="mode"]')?.textContent).toBe('light')
    expect(container.querySelector('[data-testid="seed"]')?.textContent).toBe('#6252E8')
    expect(document.documentElement.dataset.themeMode).toBe('light')
  })

  it('switches the dark mode and marks the document', () => {
    renderProbe()

    const button = container.querySelector('button')

    if (!button) throw new Error('Button not found')

    act(() => button.click())

    expect(container.querySelector('[data-testid="mode"]')?.textContent).toBe('dark')
    expect(document.documentElement.dataset.themeMode).toBe('dark')
  })

  it('persists the chosen settings to localStorage', () => {
    renderProbe()

    const buttons = Array.from(container.querySelectorAll('button'))
    const darkButton = buttons[0]
    const accentButton = buttons[1]

    if (!darkButton || !accentButton) throw new Error('Buttons not found')

    act(() => {
      darkButton.click()
      accentButton.click()
    })

    const stored = JSON.parse(window.localStorage.getItem('kanbex.theme') ?? '{}') as {
      mode?: string
      seed?: string
    }

    expect(stored.mode).toBe('dark')
    expect(stored.seed).toBe(accentPresets[1]!.seed)
  })

  it('restores the stored settings on the next mount', () => {
    window.localStorage.setItem('kanbex.theme', JSON.stringify({ mode: 'dark', seed: '#2E8B57' }))

    renderProbe()

    expect(container.querySelector('[data-testid="mode"]')?.textContent).toBe('dark')
    expect(container.querySelector('[data-testid="seed"]')?.textContent).toBe('#2E8B57')
  })

  it('falls back to defaults for a corrupted storage entry', () => {
    window.localStorage.setItem('kanbex.theme', '{broken json')

    renderProbe()

    expect(container.querySelector('[data-testid="mode"]')?.textContent).toBe('light')
    expect(container.querySelector('[data-testid="seed"]')?.textContent).toBe('#6252E8')
  })

  it('drops an activeId that no longer matches a stored palette', () => {
    window.localStorage.setItem(
      'kanbex.theme',
      JSON.stringify({
        mode: 'light',
        seed: '#2E8B57',
        activeId: 'ghost',
        customPalettes: [
          { id: 'custom-1', name: 'Своя тема 1', seed: '#2E6FDB', colors: ['#2E6FDB', '#C4B5FD', '#F1F0F7'] },
        ],
      }),
    )

    renderProbe()

    expect(container.querySelector('[data-testid="activeId"]')?.textContent).toBe('')
    // Seed сохраняется: ссылка на свою тему мертва, но seed валиден.
    expect(container.querySelector('[data-testid="seed"]')?.textContent).toBe('#2E8B57')
  })

  it('stores the active custom theme id and its seed together', () => {
    renderProbe()

    const customButton = Array.from(container.querySelectorAll('button'))[2]

    if (!customButton) throw new Error('Custom button not found')

    act(() => customButton.click())

    const stored = JSON.parse(window.localStorage.getItem('kanbex.theme') ?? '{}') as {
      seed?: string
      activeId?: string | null
    }

    expect(stored.seed).toBe('#2E8B57')
    expect(stored.activeId).toBe('custom-1')
  })
})
