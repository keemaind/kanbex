import { useCallback, useEffect, useState } from 'react'
import type { BoardSummary } from '../../types/index.js'
import {
  createProjectSummary,
  readProjects,
  saveProjects,
  type ProjectInput,
} from './projectsStore.js'

export interface UseProjectsResult {
  projects: BoardSummary[]
  addProject: (input: ProjectInput) => BoardSummary
  removeProject: (projectId: string) => void
}

/**
 * Состояние окна проектов. Пока данные хранятся в `sessionStorage` (каркас),
 * после подключения API хук будет вызывать `fetchBoards`/`createBoard`.
 */
export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<BoardSummary[]>(readProjects)

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  const addProject = useCallback((input: ProjectInput) => {
    const project = createProjectSummary(input)
    setProjects((current) => [project, ...current])
    return project
  }, [])

  const removeProject = useCallback((projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId))
  }, [])

  return { projects, addProject, removeProject }
}
