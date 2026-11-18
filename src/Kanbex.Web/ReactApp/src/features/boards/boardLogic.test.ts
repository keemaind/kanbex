import { describe, expect, it } from '@jest/globals'
import type { Board, BoardColumn, TaskCard } from '../../types/index.js'
import {
  addTaskToColumn,
  canAcceptTask,
  getNextColumn,
  getPreviousColumn,
  getWipState,
  moveTaskToColumn,
} from './boardLogic.js'

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
