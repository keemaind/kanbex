import type { CurrentUser, LoginRequest, RegisterRequest } from '../types/index.js'
import { toApiError } from './api.js'

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

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

/** Обновляет отображаемое имя (`POST /api/auth/display-name`). */
export async function updateDisplayName(displayName: string): Promise<CurrentUser> {
  const user = await postJson<CurrentUser>('/api/auth/display-name', { displayName })
  if (!user) {
    throw new Error('API вернул пустой ответ.')
  }

  currentUserRequest = Promise.resolve(user)
  return user
}

/** Меняет пароль (`POST /api/auth/change-password`). */
export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await postJson('/api/auth/change-password', request)
}

/**
 * Загружает аватар (multipart, поле `file`) и возвращает обновлённый DTO.
 * `Content-Type` с boundary браузер ставит сам — задавать вручную нельзя.
 */
export async function uploadAvatar(file: File): Promise<CurrentUser> {
  const token = requestToken ?? (await fetchRequestToken())
  const form = new FormData()
  form.append('file', file)

  const response = await fetch('/api/auth/avatar', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-CSRF-TOKEN': token,
    },
    body: form,
  })

  if (!response.ok) {
    // 400 может означать устаревший antiforgery-токен: сбрасываем кеш.
    if (response.status === 400) {
      requestToken = null
    }
    throw await toApiError(response, 'Не удалось загрузить аватар.')
  }

  const user = (await response.json()) as CurrentUser
  currentUserRequest = Promise.resolve(user)
  return user
}

/** Удаляет аватар и возвращает обновлённый DTO пользователя. */
export async function deleteAvatar(): Promise<CurrentUser> {
  const token = requestToken ?? (await fetchRequestToken())
  const response = await fetch('/api/auth/avatar', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-CSRF-TOKEN': token,
    },
  })

  if (!response.ok) {
    if (response.status === 400) {
      requestToken = null
    }
    throw await toApiError(response, 'Не удалось удалить аватар.')
  }

  const user = (await response.json()) as CurrentUser
  currentUserRequest = Promise.resolve(user)
  return user
}
