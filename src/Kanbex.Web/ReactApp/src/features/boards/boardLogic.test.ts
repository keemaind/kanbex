import { describe, expect, it } from '@jest/globals'

import {
  addTaskToColumn,
  canAcceptTask,
  clearAllTasksFromBoard,
  deleteTaskFromBoard,
  getBoardProgress,
  getNextColumn,
  getPreviousColumn,
  getWipState,
  isTaskCompleted,
  moveTaskToColumn,
  normalizeColumns,
  replaceColumnsInBoard,
  updateTaskInBoard,
} from './boardLogic.js'

import type { Board, BoardColumn, TaskCard } from '../../types/index.js'

function task(id: string, order = 0): TaskCard {
  return {
    id,
    title: `Задача ${id}`,
    description: 'Описание',
    priority: 'medium',
    order,
  }
}

function column(id: string, order: number, tasks: TaskCard[], wipLimit: number | null = null): BoardColumn {
  return { id, title: id, wipLimit, order, tasks }
}

function board(): Board {
  return {
    id: 'board-1',
    title: 'Доска',
    description: 'Описание',
    version: 0,
    role: 'creator',
    isPublic: false,
    columns: [
      column('todo', 0, [task('a'), task('b', 1)]),
      column('progress', 1, [task('c')], 1),
      column('done', 2, []),
    ],
  }
}

describe('getWipState', () => {
  it('reports an unlimited column', () => {
    expect(getWipState(column('todo', 0, [task('a')]))).toEqual({
      limit: null,
      used: 1,
      isAtLimit: false,
      isOverLimit: false,
    })
  })

  it('detects the limit and an overflow', () => {
    expect(getWipState(column('progress', 1, [task('a'), task('b')], 2))).toMatchObject({
      isAtLimit: true,
      isOverLimit: false,
    })
    expect(getWipState(column('progress', 1, [task('a'), task('b'), task('c')], 2))).toMatchObject({
      isAtLimit: true,
      isOverLimit: true,
    })
  })
})

describe('canAcceptTask', () => {
  it('allows unlimited columns and columns with free space', () => {
    expect(canAcceptTask(column('todo', 0, []))).toBe(true)
    expect(canAcceptTask(column('progress', 1, [task('a')], 2))).toBe(true)
  })

  it('rejects a full column', () => {
    expect(canAcceptTask(column('progress', 1, [task('a')], 1))).toBe(false)
  })
})

describe('getBoardProgress', () => {
  it('counts only the last column as completed', () => {
    expect(getBoardProgress(board())).toEqual({ completed: 0, total: 3, percent: 0 })
  })

  it('rounds the percentage of completed tasks', () => {
    const source = board()

    source.columns[2].tasks = [task('x'), task('y'), task('z')]

    expect(getBoardProgress(source)).toEqual({ completed: 3, total: 6, percent: 50 })
  })

  it('returns zero for an empty board', () => {
    const empty: Board = { ...board(), columns: [] }

    expect(getBoardProgress(empty)).toEqual({ completed: 0, total: 0, percent: 0 })
  })
})

describe('isTaskCompleted', () => {
  it('marks a task of the last column as completed', () => {
    const columns = board().columns
    const completed = task('c')

    columns[2].tasks = [completed]

    expect(isTaskCompleted(completed, columns[2], columns)).toBe(true)
  })

  it('keeps tasks of earlier columns active', () => {
    const columns = board().columns
    const done = task('c')

    columns[2].tasks = [done]

    expect(isTaskCompleted(task('a'), columns[0], columns)).toBe(false)
    expect(isTaskCompleted(done, columns[1], columns)).toBe(false)
  })

  it('is false for a task that is not in the column', () => {
    const columns = board().columns

    expect(isTaskCompleted(task('a'), columns[2], columns)).toBe(false)
  })
})

describe('addTaskToColumn', () => {
  it('appends a task with the next order and default values', () => {
    const source = board()
    const result = addTaskToColumn(source, 'todo', { title: '  Новая задача  ' })

    expect(result.rejection).toBeUndefined()
    expect(result.task).toMatchObject({
      title: 'Новая задача',
      description: '',
      priority: 'medium',
      order: 2,
    })
    expect(result.task?.id).toEqual(expect.any(String))
    expect(result.board.columns[0].tasks.map((item) => item.title)).toEqual([
      'Задача a',
      'Задача b',
      'Новая задача',
    ])
    expect(result.board.columns[2].tasks).toHaveLength(0)
    expect(source.columns[0].tasks).toHaveLength(2)
  })

  it('keeps the provided description and priority', () => {
    const result = addTaskToColumn(board(), 'done', {
      title: 'Проверить доску',
      description: '  Пройти по колонкам  ',
      priority: 'high',
    })

    expect(result.task).toMatchObject({
      description: 'Пройти по колонкам',
      priority: 'high',
      order: 0,
    })
  })

  it('rejects an empty title', () => {
    expect(addTaskToColumn(board(), 'todo', { title: '   ' })).toMatchObject({
      task: null,
      rejection: 'invalid-title',
    })
  })

  it('rejects an unknown column', () => {
    expect(addTaskToColumn(board(), 'missing', { title: 'Задача' })).toMatchObject({
      task: null,
      rejection: 'not-found',
    })
  })

  it('rejects a column that reached its WIP limit', () => {
    expect(addTaskToColumn(board(), 'progress', { title: 'Задача' })).toMatchObject({
      task: null,
      rejection: 'wip-limit',
    })
  })
})

describe('moveTaskToColumn', () => {
  it('moves a task and recalculates order in both columns', () => {
    const result = moveTaskToColumn(board(), 'a', 'done')

    expect(result.moved).toBe(true)
    expect(result.rejection).toBeUndefined()
    expect(result.targetColumnId).toBe('done')
    expect(result.board.columns[0].tasks.map((item) => item.id)).toEqual(['b'])
    expect(result.board.columns[0].tasks[0].order).toBe(0)
    expect(result.board.columns[2].tasks.map((item) => item.id)).toEqual(['a'])
    expect(result.board.columns[2].tasks[0].order).toBe(0)
  })

  it('rejects an unknown task or target column', () => {
    expect(moveTaskToColumn(board(), 'missing', 'done')).toMatchObject({
      moved: false,
      rejection: 'not-found',
    })
    expect(moveTaskToColumn(board(), 'a', 'missing')).toMatchObject({
      moved: false,
      rejection: 'not-found',
    })
  })

  it('rejects a move to the same column', () => {
    expect(moveTaskToColumn(board(), 'a', 'todo')).toMatchObject({
      moved: false,
      rejection: 'same-position',
    })
  })

  it('rejects a move that exceeds the WIP limit', () => {
    expect(moveTaskToColumn(board(), 'a', 'progress')).toMatchObject({
      moved: false,
      rejection: 'wip-limit',
      targetColumnId: 'progress',
    })
  })
})

describe('column navigation', () => {
  it('returns the next and previous columns in order', () => {
    expect(getNextColumn(board(), 'todo')?.id).toBe('progress')
    expect(getPreviousColumn(board(), 'progress')?.id).toBe('todo')
    expect(getNextColumn(board(), 'done')).toBeUndefined()
    expect(getPreviousColumn(board(), 'todo')).toBeUndefined()
    expect(getNextColumn(board(), 'missing')).toBeUndefined()
    expect(getPreviousColumn(board(), 'missing')).toBeUndefined()
  })
})

describe('updateTaskInBoard', () => {
  it('updates the card without changing its column or order', () => {
    const updated = updateTaskInBoard(board(), 'b', { title: 'Новая', priority: 'critical' })

    expect(updated).not.toBeNull()
    expect(updated?.columns[0].tasks[1]).toMatchObject({
      id: 'b',
      title: 'Новая',
      priority: 'critical',
      order: 1,
    })
    expect(updated?.columns[0].tasks).toHaveLength(2)
  })

  it('returns null for an unknown card', () => {
    expect(updateTaskInBoard(board(), 'missing', { title: 'Новая' })).toBeNull()
  })
})

describe('deleteTaskFromBoard', () => {
  it('removes the card and reindexes the remaining ones', () => {
    const result = deleteTaskFromBoard(board(), 'a')

    expect(result.deleted).toBe(true)
    expect(result.board.columns[0].tasks.map((item) => item.id)).toEqual(['b'])
    expect(result.board.columns[0].tasks[0].order).toBe(0)
  })

  it('keeps the board unchanged for an unknown card', () => {
    const source = board()
    const result = deleteTaskFromBoard(source, 'missing')

    expect(result.deleted).toBe(false)
    expect(result.board).toBe(source)
  })
})

describe('clearAllTasksFromBoard', () => {
  it('removes every card from all columns and counts them', () => {
    const result = clearAllTasksFromBoard(board())

    expect(result.cleared).toBe(3)
    expect(result.board.columns.map((item) => item.tasks)).toEqual([[], [], []])
    // Колонки и WIP-лимиты остаются на месте.
    expect(result.board.columns.map((item) => [item.id, item.wipLimit])).toEqual([
      ['todo', null],
      ['progress', 1],
      ['done', null],
    ])
  })

  it('keeps the board unchanged when there is nothing to clear', () => {
    const source: Board = { ...board(), columns: [column('todo', 0, [])] }
    const result = clearAllTasksFromBoard(source)

    expect(result.cleared).toBe(0)
    expect(result.board).toBe(source)
  })
})

describe('column management', () => {
  it('normalizes column order to a contiguous sequence', () => {
    const columns = [column('done', 5, []), column('todo', 2, []), column('progress', 9, [])]
    const normalized = normalizeColumns(columns)

    expect(normalized.map((item) => [item.id, item.order])).toEqual([
      ['todo', 0],
      ['done', 1],
      ['progress', 2],
    ])
  })

  it('replaces columns while keeping their cards', () => {
    const replacement: BoardColumn = {
      id: 'new',
      title: 'Новая',
      wipLimit: 3,
      order: 10,
      tasks: [task('x')],
    }
    const updated = replaceColumnsInBoard(board(), [replacement, board().columns[0]])

    expect(updated.columns.map((item) => item.id)).toEqual(['todo', 'new'])
    expect(updated.columns[1].order).toBe(1)
    expect(updated.columns[1].tasks.map((item) => item.id)).toEqual(['x'])
  })
})

describe('task metadata fields', () => {
  it('creates a task with assignee, due date and estimate', () => {
    const result = addTaskToColumn(board(), 'todo', {
      title: 'С дедлайном',
      assigneeId: 'user-1',
      assigneeName: 'Анна',
      dueDate: '2026-12-01',
      estimate: 5,
    })

    expect(result.task).toMatchObject({
      assigneeId: 'user-1',
      assigneeName: 'Анна',
      dueDate: '2026-12-01',
      estimate: 5,
      tags: [],
      commentCount: 0,
    })
  })

  it('defaults new metadata fields to null', () => {
    const result = addTaskToColumn(board(), 'todo', { title: 'Просто задача' })

    expect(result.task).toMatchObject({
      assigneeId: null,
      assigneeName: null,
      dueDate: null,
      estimate: null,
    })
  })

  it('updates assignee, due date and estimate through the patch', () => {
    const updated = updateTaskInBoard(board(), 'a', {
      assigneeId: 'user-2',
      dueDate: '2026-11-30',
      estimate: 8,
    })

    const updatedTask = updated
      ?.columns.find((item) => item.id === 'todo')
      ?.tasks.find((item) => item.id === 'a')

    expect(updatedTask).toMatchObject({
      assigneeId: 'user-2',
      dueDate: '2026-11-30',
      estimate: 8,
    })
  })

  it('keeps metadata when moving a task between columns', () => {
    const prepared = updateTaskInBoard(board(), 'a', { assigneeId: 'user-1', dueDate: '2026-12-05', estimate: 3 })

    if (!prepared) throw new Error('updateTaskInBoard returned null')

    const moved = moveTaskToColumn(prepared, 'a', 'done')
    const movedTask = moved.board.columns.find((item) => item.id === 'done')?.tasks.find((item) => item.id === 'a')

    expect(movedTask).toMatchObject({
      assigneeId: 'user-1',
      dueDate: '2026-12-05',
      estimate: 3,
    })
  })
})
