import type { Board, BoardSummary } from '../../types/index.js'
import { demoBoard, demoBoardSummaries } from './demoData.js'

/**
 * Клиентское хранилище списка проектов для каркаса.
 *
 * Сервер пока не подключён, поэтому созданные и удалённые проекты живут в
 * `sessionStorage` текущей вкладки. После реализации `/api/boards` этот модуль
 * заменяется вызовами API, а компоненты окна проектов остаются прежними.
 */

const STORAGE_KEY = 'kanbex.demo.projects'

/** Стартовые колонки нового проекта: те же этапы, что у учебной доски. */
const starterColumns = [
  { title: 'К выполнению', wipLimit: null },
  { title: 'В работе', wipLimit: 2 },
  { title: 'Готово', wipLimit: null },
] as const

export interface ProjectInput {
  title: string
  description: string
}

function isProjectSummary(value: unknown): value is BoardSummary {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<BoardSummary>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.columnCount === 'number' &&
    typeof candidate.taskCount === 'number'
  )
}

/** Читает проекты из sessionStorage; при первом запуске отдаёт демо-список. */
export function readProjects(): BoardSummary[] {
  if (typeof window === 'undefined') return [...demoBoardSummaries]

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (raw === null) return [...demoBoardSummaries]

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...demoBoardSummaries]

    return parsed.filter(isProjectSummary)
  } catch {
    return [...demoBoardSummaries]
  }
}

/** Сохраняет проекты в sessionStorage; ошибки доступа игнорируются. */
export function saveProjects(projects: BoardSummary[]): void {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // Приватный режим или переполнение хранилища не должны ломать интерфейс.
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

/** Создаёт сводку нового проекта из данных формы. */
export function createProjectSummary({ title, description }: ProjectInput): BoardSummary {
  return {
    id: createId(),
    title,
    description,
    columnCount: starterColumns.length,
    taskCount: 0,
  }
}

/** Собирает пустую стартовую доску для проекта, созданного на клиенте. */
export function createStarterBoard(project: BoardSummary): Board {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    columns: starterColumns.map((column, index) => ({
      id: `${project.id}-column-${index}`,
      title: column.title,
      wipLimit: column.wipLimit,
      order: index,
      tasks: [],
    })),
  }
}

/**
 * Возвращает доску проекта по идентификатору или `null`, если такого проекта
 * нет в списке. Для демонстрационного проекта отдаётся подготовленная доска,
 * для созданных на клиенте — пустая стартовая.
 */
export function getBoardForProject(boardId: string): Board | null {
  const project = readProjects().find((candidate) => candidate.id === boardId)
  if (!project) return null

  return project.id === demoBoard.id ? demoBoard : createStarterBoard(project)
}
