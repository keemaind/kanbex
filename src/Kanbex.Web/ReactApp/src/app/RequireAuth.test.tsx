/** @jest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import * as authApi from '../services/authApi.js'
import type { CurrentUser } from '../types/index.js'
import { AuthProvider, useAuth } from '../features/auth/AuthProvider.js'
import { RequireAuth } from './RequireAuth.js'

jest.mock('../services/authApi.js', () => ({
  fetchCurrentUser: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}))

const api = jest.mocked(authApi)

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const demoUser: CurrentUser = {
  id: 'user-1',
  displayName: 'Студент Kanbex',
  email: 'student@kanbex.local',
  avatarUrl: null,
}

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
      <output data-testid="location-state">{JSON.stringify(location.state)}</output>
    </>
  )
}

function ProtectedContent() {
  return <div data-testid="protected">Protected content</div>
}

function LogoutControl() {
  const { logout } = useAuth()
  return (
    <button onClick={() => void logout()} type="button">
      logout
    </button>
  )
}

let container: HTMLDivElement
let root: Root

async function renderAt(path: string) {
  await act(async () => {
    root.render(
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <LocationProbe />
          <LogoutControl />
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <ProtectedContent />
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  api.fetchCurrentUser.mockResolvedValue(null)
  api.logout.mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('RequireAuth', () => {
  it('shows a loading state while the session is being checked', async () => {
    let resolveSession!: (user: CurrentUser | null) => void
    api.fetchCurrentUser.mockReturnValue(
      new Promise<CurrentUser | null>((resolve) => {
        resolveSession = resolve
      }),
    )

    await renderAt('/boards')

    expect(container.textContent).toContain('Проверка сессии…')
    expect(container.querySelector('[data-testid="protected"]')).toBeNull()
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/boards')

    await act(async () => resolveSession(null))
  })

  it('redirects an unauthenticated user to login and preserves the pathname', async () => {
    await renderAt('/boards/project-42?filter=mine#tasks')

    expect(container.querySelector('[data-testid="protected"]')).toBeNull()
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/login')
    expect(container.querySelector('[data-testid="location-state"]')?.textContent).toBe(
      JSON.stringify({ from: '/boards/project-42' }),
    )
  })

  it('renders its child for an authenticated session', async () => {
    api.fetchCurrentUser.mockResolvedValue(demoUser)
    await renderAt('/boards')

    expect(container.querySelector('[data-testid="protected"]')?.textContent).toBe('Protected content')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/boards')
  })

  it('returns to login after logout clears the cookie session', async () => {
    api.fetchCurrentUser.mockResolvedValue(demoUser)
    await renderAt('/boards')
    const logout = container.querySelector('button')
    if (!logout) throw new Error('Logout button not found')

    await act(async () => logout.click())

    expect(api.logout).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/login')
  })
})
