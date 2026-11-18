import type { Board, BoardColumn, TaskCard, TaskPriority, WipState } from '../../types/index.js'

/** Поля новой задачи, которые заполняет пользователь в диалоге. */
export interface NewTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
}

export interface AddTaskResult {
  board: Board
  /** Созданная карточка или `null`, если добавление отклонено. */
  task: TaskCard | null
  rejection?: 'invalid-title' | 'not-found' | 'wip-limit'
}

/** Рассчитывает состояние WIP-лимита колонки. */
export function getWipState(column: BoardColumn): WipState {
  const used = column.tasks.length
  return {
    limit: column.wipLimit,
    used,
    isAtLimit: column.wipLimit !== null && used >= column.wipLimit,
    isOverLimit: column.wipLimit !== null && used > column.wipLimit,
  }
}

/** Можно ли добавить ещё одну карточку в колонку без нарушения WIP. */
export function canAcceptTask(column: BoardColumn): boolean {
  return column.wipLimit === null || column.tasks.length < column.wipLimit
}

function createTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Добавляет задачу в конец колонки. Правила те же, что будут на сервере:
 * непустое название и свободный слот WIP-лимита. Исходная доска не меняется.
 */
export function addTaskToColumn(board: Board, columnId: string, input: NewTaskInput): AddTaskResult {
  const title = input.title.trim()
  if (title.length < 2) {
    return { board, task: null, rejection: 'invalid-title' }
  }

  const column = board.columns.find((candidate) => candidate.id === columnId)
  if (!column) {
    return { board, task: null, rejection: 'not-found' }
  }

  if (!canAcceptTask(column)) {
    return { board, task: null, rejection: 'wip-limit' }
  }

  const task: TaskCard = {
    id: createTaskId(),
    title,
    description: input.description?.trim() ?? '',
    priority: input.priority ?? 'medium',
    order: column.tasks.length,
  }

  return {
    board: {
      ...board,
      columns: board.columns.map((candidate) =>
        candidate.id === columnId ? { ...candidate, tasks: [...candidate.tasks, task] } : candidate,
      ),
    },
    task,
  }
}

export interface MoveTaskResult {
  board: Board
  /** `true`, если состояние доски изменилось. */
  moved: boolean
  /** Причина отказа, если перемещение отклонено. */
  rejection?: 'wip-limit' | 'same-position' | 'not-found'
  /** Колонка, в которую планировалось перемещение. */
  targetColumnId?: string
}

/**
 * Переносит карточку в другую колонку с проверкой WIP-лимита.
 * Серверная реализация повторит это правило на API; здесь — клиентская
 * имитация для каркаса и мгновенной обратной связи.
 */
export function moveTaskToColumn(board: Board, taskId: string, targetColumnId: string): MoveTaskResult {
  const sourceColumn = board.columns.find((column) => column.tasks.some((task) => task.id === taskId))
  const targetColumn = board.columns.find((column) => column.id === targetColumnId)

  if (!sourceColumn || !targetColumn) {
    return { board, moved: false, rejection: 'not-found', targetColumnId }
  }

  if (sourceColumn.id === targetColumn.id) {
    return { board, moved: false, rejection: 'same-position', targetColumnId }
  }

  if (!canAcceptTask(targetColumn)) {
    return { board, moved: false, rejection: 'wip-limit', targetColumnId }
  }

  const task = sourceColumn.tasks.find((item) => item.id === taskId)
  if (!task) {
    return { board, moved: false, rejection: 'not-found', targetColumnId }
  }

  const columns = board.columns.map((column) => {
    if (column.id === sourceColumn.id) {
      return {
        ...column,
        tasks: column.tasks
          .filter((item) => item.id !== taskId)
          .map((item, index) => ({ ...item, order: index })),
      }
    }

    if (column.id === targetColumn.id) {
      const nextTasks: TaskCard[] = [...column.tasks, { ...task, order: column.tasks.length }]
      return { ...column, tasks: nextTasks.map((item, index) => ({ ...item, order: index })) }
    }

    return column
  })

  return { board: { ...board, columns }, moved: true, targetColumnId }
}

/** Следующая колонка в потоке — для доступного перемещения кнопкой. */
export function getNextColumn(board: Board, columnId: string): BoardColumn | undefined {
  const ordered = [...board.columns].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((column) => column.id === columnId)
  return index >= 0 ? ordered[index + 1] : undefined
}

/** Предыдущая колонка в потоке. */
export function getPreviousColumn(board: Board, columnId: string): BoardColumn | undefined {
  const ordered = [...board.columns].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((column) => column.id === columnId)
  return index > 0 ? ordered[index - 1] : undefined
}
