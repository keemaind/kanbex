import type { Board, BoardColumn, TaskCard, WipState } from '../../types/index.js'

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
