import { useCallback, useEffect, useState } from 'react'
import type { Board, TaskCard } from '../../types/index.js'
import { addTaskToColumn, moveTaskToColumn, type AddTaskResult, type MoveTaskResult, type NewTaskInput } from './boardLogic.js'

export interface UseBoardResult {
  board: Board
  lastMove: MoveTaskResult | null
  moveTask: (taskId: string, targetColumnId: string) => MoveTaskResult
  addTask: (columnId: string, input: NewTaskInput) => AddTaskResult
  resetBoard: (initial: Board) => void
  /** Обновлённая карточка или `null`, если карточка не найдена. */
  updateTask: (taskId: string, patch: Partial<Pick<TaskCard, 'title' | 'description'>>) => TaskCard | null
}

/**
 * Локальное состояние доски каркаса. Позже заменится загрузкой и сохранением
 * через Web API, сохранив текущий интерфейс хука.
 *
 * Результат перемещения вычисляется из текущего состояния доски до вызова
 * `setState`: так обратная связь интерфейса (отказ по WIP) не зависит от
 * того, когда React выполнит updater.
 */
export function useBoard(initialBoard: Board): UseBoardResult {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [lastMove, setLastMove] = useState<MoveTaskResult | null>(null)

  // Переход на другую доску (другой boardId) должен заменить состояние,
  // а не сохранять карточки предыдущей доски.
  useEffect(() => {
    setBoard(initialBoard)
    setLastMove(null)
  }, [initialBoard])

  const moveTask = useCallback(
    (taskId: string, targetColumnId: string): MoveTaskResult => {
      const result = moveTaskToColumn(board, taskId, targetColumnId)
      if (result.moved) setBoard(result.board)
      setLastMove(result)
      return result
    },
    [board],
  )

  const resetBoard = useCallback((initial: Board) => {
    setBoard(initial)
    setLastMove(null)
  }, [])

  const addTask = useCallback<UseBoardResult['addTask']>(
    (columnId, input) => {
      const result = addTaskToColumn(board, columnId, input)
      if (result.task) setBoard(result.board)
      return result
    },
    [board],
  )

  const updateTask = useCallback<UseBoardResult['updateTask']>(
    (taskId, patch) => {
      const column = board.columns.find((candidate) =>
        candidate.tasks.some((task) => task.id === taskId),
      )
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
    },
    [board],
  )

  return { board, lastMove, moveTask, addTask, resetBoard, updateTask }
}
