import { useCallback, useEffect, useState } from 'react'
import type { Board, TaskCard } from '../../types/index.js'
import { fetchBoard, resetBoard, saveBoard } from '../../services/boardsApi.js'
import { addTaskToColumn, moveTaskToColumn, type AddTaskResult, type MoveTaskResult, type NewTaskInput } from './boardLogic.js'

export interface UseBoardResult {
  board: Board | null
  loading: boolean
  error: string | null
  saving: boolean
  lastMove: MoveTaskResult | null
  moveTask: (taskId: string, targetColumnId: string) => MoveTaskResult | null
  addTask: (columnId: string, input: NewTaskInput) => AddTaskResult | null
  reset: () => Promise<void>
  save: () => Promise<void>
  /** Обновлённая карточка или `null`, если карточка не найдена. */
  updateTask: (taskId: string, patch: Partial<Pick<TaskCard, 'title' | 'description'>>) => TaskCard | null
}

export function useBoard(boardId: string): UseBoardResult {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<MoveTaskResult | null>(null)

  useEffect(() => {
    let active = true

    setBoard(null)
    setLoading(true)
    setError(null)
    void fetchBoard(boardId).then((loaded) => {
      if (active) {
        setBoard(loaded)
        setError(null)
      }
    }).catch((cause: unknown) => {
      if (active) {
        setBoard(null)
        setError(cause instanceof Error ? cause.message : 'Не удалось загрузить доску.')
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [boardId])

  const moveTask = useCallback((taskId: string, targetColumnId: string): MoveTaskResult | null => {
    if (!board) return null
    const result = moveTaskToColumn(board, taskId, targetColumnId)
    if (result.moved) setBoard(result.board)
    setLastMove(result)
    return result
  }, [board])

  const reset = useCallback(async () => {
    setSaving(true)
    try {
      const result = await resetBoard(boardId)
      setBoard(result)
      setLastMove(null)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сбросить доску.')
      throw cause
    } finally {
      setSaving(false)
    }
  }, [boardId])

  const addTask = useCallback<UseBoardResult['addTask']>((columnId, input) => {
    if (!board) return null
    const result = addTaskToColumn(board, columnId, input)
    if (result.task) setBoard(result.board)
    return result
  }, [board])

  const save = useCallback(async () => {
    if (!board) return
    setSaving(true)
    try {
      const result = await saveBoard(board)
      setBoard(result.board)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить доску.')
      throw cause
    } finally {
      setSaving(false)
    }
  }, [board])

  const updateTask = useCallback<UseBoardResult['updateTask']>((taskId, patch) => {
    if (!board) return null
    const column = board.columns.find((candidate) => candidate.tasks.some((task) => task.id === taskId))
    const task = column?.tasks.find((candidate) => candidate.id === taskId)
    if (!column || !task) return null

    const updated: TaskCard = { ...task, ...patch }
    setBoard({
      ...board,
      columns: board.columns.map((candidate) => ({
        ...candidate,
        tasks: candidate.tasks.map((item) => (item.id === taskId ? updated : item)),
      })),
    })
    return updated
  }, [board])

  return { board, loading, error, saving, lastMove, moveTask, addTask, reset, save, updateTask }
}
