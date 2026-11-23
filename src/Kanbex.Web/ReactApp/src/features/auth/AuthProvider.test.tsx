/** @jest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as authApi from '../../services/authApi.js'
import type { CurrentUser } from '../../types/index.js'
import { AuthProvider, useAuth } from './AuthProvider.js'

jest.mock('../../services/authApi.js', () => ({
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function AuthProbe() {
  const { user, isAuthenticated, initializing, pending, login, register, logout } = useAuth()

  return (
    <div>
      <output data-testid="user">{user ? JSON.stringify(user) : 'null'}</output>
      <output data-testid="authenticated">{String(isAuthenticated)}</output>
      <output data-testid="initializing">{String(initializing)}</output>
      <output data-testid="pending">{String(pending)}</output>
      <button onClick={() => void login({ email: 'login@example.com', password: 'secret1' }).catch(() => undefined)}>
        login
      </button>
      <button
        onClick={() =>
          void register({ displayName: 'New User', email: 'new@example.com', password: 'secret1' }).catch(
            () => undefined,
          )
        }
      >
        register
      </button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

let container: HTMLDivElement
let root: Root

async function renderProvider() {
  await act(async () => {
    root.render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )
  })
}

async function click(label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label)
  if (!button) throw new Error(`Button not found: ${label}`)
  await act(async () => button.click())
}

function output(testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`)?.textContent
}

function displayedUser() {
  const value = output('user')
  if (!value || value === 'null') return null
  return JSON.parse(value) as unknown
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

describe('AuthProvider', () => {
  it('keeps the app initializing until GET /api/auth/me resolves', async () => {
    const session = deferred<CurrentUser | null>()
    api.fetchCurrentUser.mockReturnValue(session.promise)

    await renderProvider()

    expect(output('initializing')).toBe('true')
    expect(displayedUser()).toBeNull()

    await act(async () => session.resolve(demoUser))

    expect(displayedUser()).toEqual(demoUser)
    expect(output('initializing')).toBe('false')
    expect(output('authenticated')).toBe('true')
  })

  it('treats an anonymous session as signed out', async () => {
    await renderProvider()

    expect(api.fetchCurrentUser).toHaveBeenCalledTimes(1)
    expect(displayedUser()).toBeNull()
    expect(output('authenticated')).toBe('false')
    expect(output('initializing')).toBe('false')
  })

  it('logs in through the API and stores the returned safe DTO', async () => {
    api.login.mockResolvedValue(demoUser)
    await renderProvider()

    await click('login')

    expect(api.login).toHaveBeenCalledWith({ email: 'login@example.com', password: 'secret1' })
    expect(displayedUser()).toEqual(demoUser)
    expect(output('authenticated')).toBe('true')
  })

  it('keeps the anonymous session when login fails', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'))
    await renderProvider()

    await click('login')

    expect(displayedUser()).toBeNull()
    expect(output('authenticated')).toBe('false')
  })

  it('registers through the API and stores the returned safe DTO', async () => {
    api.register.mockResolvedValue({
      id: 'user-2',
      displayName: 'New User',
      email: 'new@example.com',
      avatarUrl: null,
    })
    await renderProvider()

    await click('register')

    expect(api.register).toHaveBeenCalledWith({
      displayName: 'New User',
      email: 'new@example.com',
      password: 'secret1',
    })
    expect(displayedUser()).toEqual({
      id: 'user-2',
      displayName: 'New User',
      email: 'new@example.com',
      avatarUrl: null,
    })
  })

  it('clears the session after logout', async () => {
    api.fetchCurrentUser.mockResolvedValue(demoUser)
    await renderProvider()
    expect(output('authenticated')).toBe('true')

    await click('logout')

    expect(api.logout).toHaveBeenCalledTimes(1)
    expect(displayedUser()).toBeNull()
    expect(output('authenticated')).toBe('false')
  })
})
