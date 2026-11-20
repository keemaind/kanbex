import type { CurrentUser, LoginRequest, RegisterRequest } from '../types/index.js'
import { toApiError } from './api.js'

interface AntiforgeryTokenResponse {
  requestToken: string
}

/**
 * Типизированный клиент `/api/auth/*`.
 *
 * Cookie-сессия `Kanbex.Auth` передаётся автоматически (`same-origin`), а
 * изменяющие запросы дополнительно отправляют `X-CSRF-TOKEN`. Request token
 * кешируется на время жизни страницы; при ошибке 400 кеш сбрасывается, чтобы
 * следующий запрос получил свежий токен и cookie.
 */
let requestToken: string | null = null
let currentUserRequest: Promise<CurrentUser | null> | null = null

async function fetchRequestToken(): Promise<string> {
  const response = await fetch('/api/auth/antiforgery-token', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw await toApiError(response, 'Не удалось получить antiforgery-токен.')
  }

  const body = (await response.json()) as AntiforgeryTokenResponse
  if (!body.requestToken) {
    throw new Error('API вернул пустой antiforgery-токен.')
  }

  requestToken = body.requestToken
  return requestToken
}

async function postJson<T>(url: string, body?: unknown): Promise<T | null> {
  const token = requestToken ?? (await fetchRequestToken())
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    // 400 может означать устаревший antiforgery-токен: сбрасываем кеш, чтобы
    // повторная попытка пользователя прошла с новой парой cookie + токен.
    if (response.status === 400) {
      requestToken = null
    }
    throw await toApiError(response, 'Не удалось выполнить запрос.')
  }

  if (response.status === 204) {
    return null
  }

  return (await response.json()) as T
}

/** Возвращает текущего пользователя или `null`, если cookie-сессии нет. */
export function fetchCurrentUser(): Promise<CurrentUser | null> {
  // StrictMode монтирует эффект дважды в Development. Кеш in-flight запроса
  // избавляет от двух одинаковых обращений к `/api/auth/me` при старте.
  currentUserRequest ??= requestCurrentUser().catch((error: unknown) => {
    currentUserRequest = null
    throw error
  })
  return currentUserRequest
}

async function requestCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw await toApiError(response, 'Не удалось загрузить текущую сессию.')
  }

  return (await response.json()) as CurrentUser
}

/** Выполняет вход и возвращает безопасный DTO пользователя. */
export async function login(request: LoginRequest): Promise<CurrentUser> {
  const user = await postJson<CurrentUser>('/api/auth/login', request)
  if (!user) {
    throw new Error('API вернул пустой ответ входа.')
  }

  // Antiforgery-токен привязан к пользователю: после смены identity старый
  // токен не подойдёт для выхода, поэтому следующий запрос получит новый.
  requestToken = null
  currentUserRequest = Promise.resolve(user)
  return user
}

/** Создаёт учётную запись и сразу открывает cookie-сессию. */
export async function register(request: RegisterRequest): Promise<CurrentUser> {
  const user = await postJson<CurrentUser>('/api/auth/register', request)
  if (!user) {
    throw new Error('API вернул пустой ответ регистрации.')
  }

  requestToken = null
  currentUserRequest = Promise.resolve(user)
  return user
}

/** Завершает серверную сессию и удаляет cookie. */
export async function logout(): Promise<void> {
  try {
    await postJson<null>('/api/auth/logout')
  } finally {
    requestToken = null
    currentUserRequest = Promise.resolve(null)
  }
}
