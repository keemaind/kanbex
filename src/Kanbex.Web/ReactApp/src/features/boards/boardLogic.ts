import type { Board, BoardColumn, TaskCard, TaskPriority, WipState } from '../../types/index.js'

/** Поля новой задачи, которые заполняет пользователь в диалоге. */
export interface NewTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  /** Исполнитель — участник доски; `null` — не назначен. */
  assigneeId?: string | null
  /** Имя исполнителя для мгновенного показа на карточке; сервер пересчитает при сохранении. */
  assigneeName?: string | null
  /** Дедлайн в формате `YYYY-MM-DD`. */
  dueDate?: string | null
  /** Оценка 0–1000. */
  estimate?: number | null
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

/** Прогресс доски: доля карточек, дошедших до финального этапа. */
export interface BoardProgress {
  /** Карточек в последней колонке — этапе «Готово». */
  completed: number
  /** Всего карточек на доске. */
  total: number
  /** Процент завершённых, округлённый до целого. */
  percent: number
}

/**
 * Считает прогресс по данным доски: завершённые — карточки последней
 * колонки потока, процент — их доля от общего числа.
 */
export function getBoardProgress(board: Board): BoardProgress {
  const ordered = [...board.columns].sort((left, right) => left.order - right.order)
  const lastColumn = ordered.length > 0 ? ordered[ordered.length - 1] : undefined
  const total = ordered.reduce((sum, column) => sum + column.tasks.length, 0)
  const completed = lastColumn ? lastColumn.tasks.length : 0
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return { completed, total, percent }
}

/**
 * Завершена ли карточка: она лежит в последней колонке потока —
 * этапе «Готово».
 */
export function isTaskCompleted(task: TaskCard, column: BoardColumn, columns: BoardColumn[]): boolean {
  const lastOrder = columns.reduce((max, candidate) => Math.max(max, candidate.order), Number.NEGATIVE_INFINITY)

  return column.order === lastOrder && column.tasks.some((item) => item.id === task.id)
}

/** Генерирует идентификатор для новых карточек и колонок. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createTaskId(): string {
  return createId()
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
    assigneeId: input.assigneeId ?? null,
    assigneeName: input.assigneeName ?? null,
    dueDate: input.dueDate ?? null,
    estimate: input.estimate ?? null,
    tags: [],
    commentCount: 0,
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

/** Обновляет поля карточки, сохраняя её позицию и колонку. */
export function updateTaskInBoard(
  board: Board,
  taskId: string,
  patch: Partial<Pick<TaskCard, 'title' | 'description' | 'priority' | 'assigneeId' | 'dueDate' | 'estimate'>>,
): Board | null {
  const owner = board.columns.find((column) => column.tasks.some((task) => task.id === taskId))

  if (!owner) return null

  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === owner.id
        ? {
          ...column,
          tasks: column.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
        }
        : column,
    ),
  }
}

export interface DeleteTaskResult {
  board: Board
  deleted: boolean
}

/** Удаляет карточку и пересчитывает порядок оставшихся в колонке. */
export function deleteTaskFromBoard(board: Board, taskId: string): DeleteTaskResult {
  const owner = board.columns.find((column) => column.tasks.some((task) => task.id === taskId))

  if (!owner) return { board, deleted: false }

  return {
    board: {
      ...board,
      columns: board.columns.map((column) =>
        column.id === owner.id
          ? {
            ...column,
            tasks: column.tasks
              .filter((task) => task.id !== taskId)
              .map((task, order) => ({ ...task, order })),
          }
          : column,
      ),
    },
    deleted: true,
  }
}

export interface ClearTasksResult {
  board: Board
  /** Сколько карточек было удалено. */
  cleared: number
}

/** Удаляет все карточки со всех колонок, сохраняя сами колонки и WIP-лимиты. */
export function clearAllTasksFromBoard(board: Board): ClearTasksResult {
  const cleared = board.columns.reduce((sum, column) => sum + column.tasks.length, 0)

  if (cleared === 0) return { board, cleared: 0 }

  return {
    board: { ...board, columns: board.columns.map((column) => ({ ...column, tasks: [] })) },
    cleared,
  }
}

/** Приводит порядок колонок к непрерывной последовательности с нуля. */
export function normalizeColumns(columns: BoardColumn[]): BoardColumn[] {
  return [...columns]
    .sort((left, right) => left.order - right.order)
    .map((column, order) => ({ ...column, order }))
}

/** Заменяет набор колонок доски, сохраняя карточки переданных колонок. */
export function replaceColumnsInBoard(board: Board, columns: BoardColumn[]): Board {
  return { ...board, columns: normalizeColumns(columns) }
}
