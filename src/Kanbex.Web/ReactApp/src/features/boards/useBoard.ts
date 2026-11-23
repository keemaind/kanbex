import { useCallback, useEffect, useRef, useState } from 'react'
import type { Board, BoardColumn, ProjectRole, Tag, TaskCard } from '../../types/index.js'
import { fetchBoard, resetBoard, saveBoard, setBoardVisibility } from '../../services/boardsApi.js'
import { ApiError } from '../../services/api.js'
import {
  addTaskToColumn,
  clearAllTasksFromBoard,
  deleteTaskFromBoard,
  moveTaskToColumn,
  replaceColumnsInBoard,
  updateTaskInBoard,
  type AddTaskResult,
  type MoveTaskResult,
  type NewTaskInput,
} from './boardLogic.js'

const AUTOSAVE_DELAY_MS = 900

/** Локальная правка метаданных карточки, не входящих в PUT доски. */
export interface TaskMetaPatch {
  tags?: Tag[]
  commentCount?: number
}

export interface UseBoardResult {
  board: Board | null
  /** Роль текущего пользователя на доске; `null`, пока доска не загружена. */
  role: ProjectRole | null
  loading: boolean
  error: string | null
  saveError: string | null
  saving: boolean
  dirty: boolean
  conflict: boolean
  lastMove: MoveTaskResult | null
  moveTask: (taskId: string, targetColumnId: string) => MoveTaskResult | null
  addTask: (columnId: string, input: NewTaskInput) => AddTaskResult | null
  updateTask: (
    taskId: string,
    patch: Partial<Pick<TaskCard, 'title' | 'description' | 'priority' | 'assigneeId' | 'dueDate' | 'estimate'>>,
  ) => TaskCard | null
  deleteTask: (taskId: string) => boolean
  /** Удаляет все карточки со всех колонок, возвращает число удалённых. */
  clearTasks: () => number
  updateBoard: (patch: Partial<Pick<Board, 'title' | 'description'>>) => void
  replaceColumns: (columns: BoardColumn[]) => void
  /** Переключает публичный доступ (только Creator) и обновляет локальное состояние. */
  setVisibility: (isPublic: boolean) => Promise<void>
  /** Обновляет теги/счётчик комментариев карточки локально, без autosave. */
  updateTaskMeta: (taskId: string, meta: TaskMetaPatch) => void
  reset: () => Promise<void>
  save: () => Promise<void>
  reload: () => Promise<void>
  overwrite: () => Promise<void>
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback
}

export function useBoard(boardId: string): UseBoardResult {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [lastMove, setLastMove] = useState<MoveTaskResult | null>(null)
  const revisionRef = useRef(0)

  const markDirty = useCallback(() => {
    revisionRef.current += 1
    setDirty(true)
    setSaveError(null)
  }, [])

  useEffect(() => {
    let active = true

    revisionRef.current = 0
    setBoard(null)
    setLoading(true)
    setDirty(false)
    setConflict(false)
    setSaveError(null)
    setError(null)

    void fetchBoard(boardId).then((loaded) => {
      if (active) {
        setBoard(loaded)
        setError(null)
      }
    }).catch((cause: unknown) => {
      if (active) {
        setBoard(null)
        setError(messageOf(cause, 'Не удалось загрузить доску.'))
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [boardId])

  const save = useCallback(async () => {
    if (!board || saving) return

    const boardAtStart = board
    const revisionAtStart = revisionRef.current
    setSaving(true)
    setSaveError(null)

    try {
      const result = await saveBoard(boardAtStart)
      setBoard((current) => {
        if (!current) return result.board
        if (current === boardAtStart) return result.board
        return { ...current, version: result.board.version }
      })
      setDirty(revisionRef.current !== revisionAtStart)
      setConflict(false)
      setError(null)
    } catch (cause) {
      const message = messageOf(cause, 'Не удалось сохранить доску.')
      setSaveError(message)
      setError(message)
      if (cause instanceof ApiError && cause.status === 409) setConflict(true)
      throw cause
    } finally {
      setSaving(false)
    }
  }, [board, saving])

  useEffect(() => {
    if (!board || !dirty || saving || saveError || conflict) return

    const timer = window.setTimeout(() => {
      void save().catch(() => undefined)
    }, AUTOSAVE_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [board, dirty, saving, saveError, conflict, save])

  const reload = useCallback(async () => {
    revisionRef.current = 0
    setLoading(true)
    setDirty(false)
    setConflict(false)
    setSaveError(null)
    setError(null)

    try {
      const loaded = await fetchBoard(boardId)
      setBoard(loaded)
      setLastMove(null)
    } catch (cause) {
      const message = messageOf(cause, 'Не удалось загрузить доску.')
      setError(message)
      throw cause
    } finally {
      setLoading(false)
    }
  }, [boardId])

  const overwrite = useCallback(async () => {
    if (!board || saving) return

    const boardAtStart = board
    const revisionAtStart = revisionRef.current
    setSaving(true)
    setSaveError(null)

    try {
      const latest = await fetchBoard(boardId)
      const result = await saveBoard({ ...boardAtStart, version: latest.version })
      setBoard((current) => {
        if (!current) return result.board
        if (current === boardAtStart) return result.board
        return { ...current, version: result.board.version }
      })
      setDirty(revisionRef.current !== revisionAtStart)
      setConflict(false)
      setError(null)
    } catch (cause) {
      const message = messageOf(cause, 'Не удалось сохранить доску.')
      setSaveError(message)
      setError(message)
      throw cause
    } finally {
      setSaving(false)
    }
  }, [board, boardId, saving])

  const reset = useCallback(async () => {
    setSaving(true)
    setSaveError(null)

    try {
      const result = await resetBoard(boardId)
      revisionRef.current = 0
      setBoard(result)
      setLastMove(null)
      setDirty(false)
      setConflict(false)
      setError(null)
    } catch (cause) {
      const message = messageOf(cause, 'Не удалось сбросить доску.')
      setSaveError(message)
      setError(message)
      throw cause
    } finally {
      setSaving(false)
    }
  }, [boardId])

  const moveTask = useCallback((taskId: string, targetColumnId: string): MoveTaskResult | null => {
    if (!board) return null
    const result = moveTaskToColumn(board, taskId, targetColumnId)
    if (result.moved) {
      setBoard(result.board)
      markDirty()
    }
    setLastMove(result)
    return result
  }, [board, markDirty])

  const addTask = useCallback<UseBoardResult['addTask']>((columnId, input) => {
    if (!board) return null
    const result = addTaskToColumn(board, columnId, input)
    if (result.task) {
      setBoard(result.board)
      markDirty()
    }
    return result
  }, [board, markDirty])

  const updateTask = useCallback<UseBoardResult['updateTask']>((taskId, patch) => {
    if (!board) return null
    const updated = updateTaskInBoard(board, taskId, patch)
    if (!updated) return null

    setBoard(updated)
    markDirty()
    return updated.columns.flatMap((column) => column.tasks).find((task) => task.id === taskId) ?? null
  }, [board, markDirty])

  const deleteTask = useCallback((taskId: string) => {
    if (!board) return false
    const result = deleteTaskFromBoard(board, taskId)
    if (!result.deleted) return false

    setBoard(result.board)
    markDirty()
    return true
  }, [board, markDirty])

  const clearTasks = useCallback(() => {
    if (!board) return 0
    const result = clearAllTasksFromBoard(board)
    if (result.cleared === 0) return 0

    setBoard(result.board)
    markDirty()
    return result.cleared
  }, [board, markDirty])

  const updateBoard = useCallback((patch: Partial<Pick<Board, 'title' | 'description'>>) => {
    if (!board) return
    if (patch.title === board.title && patch.description === board.description) return

    setBoard({ ...board, ...patch })
    markDirty()
  }, [board, markDirty])

  const replaceColumns = useCallback((columns: BoardColumn[]) => {
    if (!board) return
    setBoard(replaceColumnsInBoard(board, columns))
    markDirty()
  }, [board, markDirty])

  const setVisibility = useCallback(async (isPublic: boolean) => {
    await setBoardVisibility(boardId, isPublic)
    setBoard((current) => (current ? { ...current, isPublic } : current))
  }, [boardId])

  const updateTaskMeta = useCallback<UseBoardResult['updateTaskMeta']>((taskId, meta) => {
    // Теги и счётчик комментариев приходят из отдельных endpoint-ов и не
    // участвуют в PUT доски, поэтому dirty не выставляется.
    setBoard((current) => {
      if (!current) return null
      if (!current.columns.some((column) => column.tasks.some((task) => task.id === taskId))) {
        return current
      }

      const columns = current.columns.map((column) => {
        if (!column.tasks.some((task) => task.id === taskId)) return column
        return {
          ...column,
          tasks: column.tasks.map((task) => {
            if (task.id !== taskId) return task
            const next: TaskCard = { ...task }
            if (meta.tags !== undefined) next.tags = meta.tags
            if (meta.commentCount !== undefined) next.commentCount = meta.commentCount
            return next
          }),
        }
      })
      return { ...current, columns }
    })
  }, [])

  return {
    board,
    role: board?.role ?? null,
    loading,
    error,
    saveError,
    saving,
    dirty,
    conflict,
    lastMove,
    moveTask,
    addTask,
    updateTask,
    deleteTask,
    clearTasks,
    updateBoard,
    replaceColumns,
    setVisibility,
    updateTaskMeta,
    reset,
    save,
    reload,
    overwrite,
  }
}
