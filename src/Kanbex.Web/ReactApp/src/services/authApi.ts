import type { CurrentUser, LoginRequest, RegisterRequest } from '../types/index.js'

/**
 * Типизированный клиент `/api/auth/*`.
 *
 * В каркасе методы не выполняют запросов: сессию имитирует `AuthProvider`.
 * При подключении Identity эти функции станут единственной точкой обмена
 * с сервером, а компоненты продолжат работать без изменений.
 */

/** Заглушка: реальный ответ вернёт безопасный DTO текущего пользователя. */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  // TODO: GET /api/auth/me (credentials: 'include').
  return null
}

/** Заглушка входа. Сервер создаст cookie-сессию. */
export async function login(request: LoginRequest): Promise<CurrentUser> {
  // TODO: POST /api/auth/login + antiforgery-токен.
  return {
    id: 'demo-user',
    displayName: request.email.split('@')[0] || 'Учащийся',
    email: request.email,
  }
}

/** Заглушка регистрации. */
export async function register(request: RegisterRequest): Promise<CurrentUser> {
  // TODO: POST /api/auth/register.
  return {
    id: 'demo-user',
    displayName: request.displayName,
    email: request.email,
  }
}

/** Заглушка выхода. */
export async function logout(): Promise<void> {
  // TODO: POST /api/auth/logout.
}
