import { useCallback, useEffect, useState } from 'react'
import type { BoardSummary, ProjectInput } from '../../types/index.js'
import { createBoard, deleteBoard, fetchBoards } from '../../services/boardsApi.js'

export interface UseProjectsResult {
  projects: BoardSummary[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  addProject: (input: ProjectInput) => Promise<BoardSummary>
  removeProject: (projectId: string) => Promise<void>
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<BoardSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const boards = await fetchBoards()
      setProjects(boards.map((board) => ({
        id: board.id,
        title: board.title,
        description: board.description,
        taskCount: board.taskCount,
        columnCount: board.columnCount,
        updatedAt: board.updatedAt,
        completedTaskCount: board.completedTaskCount,
      })))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить проекты.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const addProject = useCallback(async (input: ProjectInput) => {
    const board = await createBoard(input.title, input.description)
    const orderedColumns = [...board.columns].sort((left, right) => left.order - right.order)
    const lastColumn = orderedColumns[orderedColumns.length - 1]
    const project: BoardSummary = {
      id: board.id,
      title: board.title,
      description: board.description,
      columnCount: board.columns.length,
      taskCount: board.columns.reduce((sum, column) => sum + column.tasks.length, 0),
      completedTaskCount: lastColumn?.tasks.length ?? 0,
      updatedAt: new Date().toISOString(),
    }
    setProjects((current) => [project, ...current])
    setError(null)
    return project
  }, [])

  const removeProject = useCallback(async (projectId: string) => {
    await deleteBoard(projectId)
    setProjects((current) => current.filter((project) => project.id !== projectId))
  }, [])

  return { projects, loading, error, reload, addProject, removeProject }
}
