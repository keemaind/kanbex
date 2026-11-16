import type { Board, BoardSummary } from '../types/index.js'

/**
 * Типизированный клиент `/api/boards`.
 *
 * Каркас работает на демонстрационных данных, поэтому методы возвращают
 * отклонённые промисы с явным описанием будущего контракта: вызывающий код
 * уже сейчас обрабатывает состояния загрузки и ошибок.
 */

export interface BoardSaveResult {
  board: Board
  /** `true`, если сервер принял изменения; `false` — конфликт WIP. */
  accepted: boolean
}

const notImplemented = (operation: string) =>
  Promise.reject(new Error(`API-клиент ещё не подключён: ${operation}`))

/** Список досок текущего пользователя. */
export async function fetchBoards(): Promise<BoardSummary[]> {
  // TODO: GET /api/boards.
  return notImplemented('GET /api/boards')
}

/** Доска с колонками и карточками. */
export async function fetchBoard(boardId: string): Promise<Board> {
  // TODO: GET /api/boards/{boardId}.
  return notImplemented(`GET /api/boards/${boardId}`)
}

/** Создание личной доски с начальными колонками. */
export async function createBoard(title: string): Promise<Board> {
  // TODO: POST /api/boards.
  return notImplemented(`POST /api/boards (${title})`)
}

/**
 * Сохранение доски. Сервер повторно проверяет WIP-лимиты и владельца,
 * поэтому клиентская проверка не является авторитетной.
 */
export async function saveBoard(board: Board): Promise<BoardSaveResult> {
  // TODO: PUT /api/boards/{board.id}.
  return notImplemented(`PUT /api/boards/${board.id}`)
}

/** Удаление доски. */
export async function deleteBoard(boardId: string): Promise<void> {
  // TODO: DELETE /api/boards/{boardId}.
  return notImplemented(`DELETE /api/boards/${boardId}`)
}
