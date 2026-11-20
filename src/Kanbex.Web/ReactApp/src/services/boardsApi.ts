import type { Board, BoardSummary } from '../types/index.js'
import { toApiError } from './api.js'

export type { ApiProblem } from './api.js'

export interface BoardSaveResult {
  board: Board
  accepted: boolean
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
  })

  if (!response.ok) {
    throw await toApiError(response, `Не удалось выполнить запрос (${response.status}).`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

let antiforgeryToken: string | null = null

async function getAntiforgeryToken(): Promise<string> {
  if (antiforgeryToken) return antiforgeryToken
  const response = await fetch('/api/auth/antiforgery-token', { credentials: 'same-origin' })
  if (!response.ok) throw await toApiError(response, 'Не удалось получить antiforgery-токен.')
  const body = (await response.json()) as { requestToken: string }
  antiforgeryToken = body.requestToken
  return antiforgeryToken
}

async function mutate<T>(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const token = await getAntiforgeryToken()
  try {
    return await request<T>(url, {
      method,
      headers: {
        'X-CSRF-TOKEN': token,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 400) antiforgeryToken = null
    throw error
  }
}

export async function fetchBoards(): Promise<BoardSummary[]> {
  return request('/api/boards')
}

export async function fetchBoard(boardId: string): Promise<Board> {
  return request(`/api/boards/${encodeURIComponent(boardId)}`)
}

export async function createBoard(title: string, description = ''): Promise<Board> {
  return mutate('/api/boards', 'POST', { title, description })
}

export async function saveBoard(board: Board): Promise<BoardSaveResult> {
  const saved = await mutate<Board>(`/api/boards/${encodeURIComponent(board.id)}`, 'PUT', {
    title: board.title,
    description: board.description,
    version: board.version,
    columns: board.columns.map((column) => ({
      id: column.id,
      title: column.title,
      wipLimit: column.wipLimit,
      order: column.order,
      tasks: column.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        order: task.order,
      })),
    })),
  })
  return { board: saved, accepted: true }
}

export async function deleteBoard(boardId: string): Promise<void> {
  await mutate<void>(`/api/boards/${encodeURIComponent(boardId)}`, 'DELETE')
}

export async function resetBoard(boardId: string): Promise<Board> {
  return mutate<Board>(`/api/boards/${encodeURIComponent(boardId)}/reset`, 'POST')
}
