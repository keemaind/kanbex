import type {
  Board,
  BoardMember,
  BoardSummary,
  Comment,
  PublicBoard,
  Tag,
  TaskHistoryEntry,
} from '../types/index.js'
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

/** Создаёт доску по готовому шаблону: предустановленные колонки и задачи. */
export async function createBoardFromTemplate(templateKey: string): Promise<Board> {
  return mutate<Board>(`/api/boards/template/${encodeURIComponent(templateKey)}`, 'POST')
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
        assigneeId: task.assigneeId ?? null,
        dueDate: task.dueDate ?? null,
        estimate: task.estimate ?? null,
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

/** Переключает публичный доступ к доске (только Creator). */
export async function setBoardVisibility(boardId: string, isPublic: boolean): Promise<void> {
  await mutate<void>(`/api/boards/${encodeURIComponent(boardId)}/visibility`, 'PUT', { isPublic })
}

/** Список участников доски — Creator и Member. */
export async function fetchBoardMembers(boardId: string): Promise<BoardMember[]> {
  return request(`/api/boards/${encodeURIComponent(boardId)}/members`)
}

/** Добавляет участника по e-mail (только Creator). */
export async function addBoardMember(boardId: string, email: string): Promise<BoardMember> {
  return mutate<BoardMember>(`/api/boards/${encodeURIComponent(boardId)}/members`, 'POST', { email })
}

/** Удаляет участника доски (только Creator). */
export async function removeBoardMember(boardId: string, memberUserId: string): Promise<void> {
  await mutate<void>(
    `/api/boards/${encodeURIComponent(boardId)}/members/${encodeURIComponent(memberUserId)}`,
    'DELETE',
  )
}

/** История изменений карточки — Creator и Member. */
export async function fetchTaskHistory(boardId: string, taskId: string): Promise<TaskHistoryEntry[]> {
  return request(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(taskId)}/history`,
  )
}

/** Комментарии карточки — Creator и Member. */
export async function fetchComments(boardId: string, taskId: string): Promise<Comment[]> {
  return request(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(taskId)}/comments`,
  )
}

/** Добавляет комментарий (1–4000 символов после trim). */
export async function createComment(boardId: string, taskId: string, content: string): Promise<Comment> {
  return mutate<Comment>(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(taskId)}/comments`,
    'POST',
    { content },
  )
}

/** Удаляет комментарий: автор — свой, Creator — любой. */
export async function deleteComment(
  boardId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  await mutate<void>(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
    'DELETE',
  )
}

/** Каталог тегов доски — Creator и Member. */
export async function fetchTags(boardId: string): Promise<Tag[]> {
  return request(`/api/boards/${encodeURIComponent(boardId)}/tags`)
}

/** Создаёт тег в каталоге доски (только Creator). */
export async function createTag(boardId: string, name: string, color: string): Promise<Tag> {
  return mutate<Tag>(`/api/boards/${encodeURIComponent(boardId)}/tags`, 'POST', { name, color })
}

/** Обновляет имя/цвет тега (только Creator). */
export async function updateTag(
  boardId: string,
  tagId: string,
  name: string,
  color: string,
): Promise<Tag> {
  return mutate<Tag>(`/api/boards/${encodeURIComponent(boardId)}/tags/${encodeURIComponent(tagId)}`, 'PUT', {
    name,
    color,
  })
}

/** Удаляет тег из каталога доски (только Creator). */
export async function deleteTag(boardId: string, tagId: string): Promise<void> {
  await mutate<void>(`/api/boards/${encodeURIComponent(boardId)}/tags/${encodeURIComponent(tagId)}`, 'DELETE')
}

/** Заменяет набор тегов карточки (Creator и Member). */
export async function setTaskTags(
  boardId: string,
  taskId: string,
  tagIds: string[],
): Promise<Tag[]> {
  return mutate<Tag[]>(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(taskId)}/tags`,
    'PUT',
    { tagIds },
  )
}

/**
 * Публичная read-only доска для `/share/{id}`. Запрос анонимный: без cookie и
 * antiforgery. Приватная и несуществующая доска неразличимы — обе дают 404.
 */
export async function fetchPublicBoard(boardId: string): Promise<PublicBoard | null> {
  const response = await fetch(`/api/public/boards/${encodeURIComponent(boardId)}`, {
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw await toApiError(response, 'Не удалось загрузить публичную доску.')
  }

  return (await response.json()) as PublicBoard
}
