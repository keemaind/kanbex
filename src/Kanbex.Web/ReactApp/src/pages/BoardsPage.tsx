import { useState } from 'react'
import { TextField } from 'm3-expressive-react'
import { AppButton, AppDialog, EmptyState } from '@kanbex/ui'
import type { BoardSummary } from '../types/index.js'
import {
  ProjectCard,
  ProjectCreateDialog,
  pluralize,
  useProjects,
} from '../features/boards/index.js'

/**
 * Окно проектов: список личных Kanban-досок, поиск, создание и удаление.
 * Пока данные хранятся на клиенте; источником истины станет `/api/boards`.
 */
export function BoardsPage() {
  const { projects, addProject, removeProject } = useProjects()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<BoardSummary | null>(null)

  const normalizedQuery = query.trim().toLocaleLowerCase('ru')
  const visibleProjects = normalizedQuery
    ? projects.filter((project) =>
      `${project.title} ${project.description}`.toLocaleLowerCase('ru').includes(normalizedQuery),
    )
    : projects

  const totalLabel = `${projects.length} ${pluralize(projects.length, ['проект', 'проекта', 'проектов'])}`
  const countLabel = normalizedQuery
    ? `Найдено: ${visibleProjects.length} из ${projects.length}`
    : totalLabel

  return (
    <div className="kb-page">
      <div className="kb-page__head">
        <div>
          <h1 className="kb-page__title">Проекты</h1>
          <p className="kb-page__lead">
            Каждый проект — это отдельная Kanban-доска с колонками и WIP-лимитами.
            Выберите проект, чтобы открыть его доску.
          </p>
        </div>
        <AppButton variant="filled" size="md" onClick={() => setCreateOpen(true)}>
          Новый проект
        </AppButton>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="Проектов пока нет"
          description="Создайте первый проект: в его доске появятся колонки «К выполнению», «В работе» и «Готово»."
          actionLabel="Создать проект"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="kb-projects-toolbar">
            <TextField
              className="kb-projects-search"
              variant="outlined"
              label="Поиск по проектам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="kb-projects-count" aria-live="polite">
              {countLabel}
            </span>
          </div>

          {visibleProjects.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description={`По запросу «${query.trim()}» нет проектов. Проверьте написание или сбросьте поиск.`}
              actionLabel="Сбросить поиск"
              onAction={() => setQuery('')}
            />
          ) : (
            <ul className="kb-project-list">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={setProjectToDelete} />
              ))}
            </ul>
          )}
        </>
      )}

      {createOpen ? (
        <ProjectCreateDialog
          onCreate={(input) => {
            addProject(input)
            setCreateOpen(false)
            setQuery('')
          }}
          onCancel={() => setCreateOpen(false)}
        />
      ) : null}

      <AppDialog
        open={projectToDelete !== null}
        title="Удалить проект?"
        description={
          projectToDelete
            ? `Проект «${projectToDelete.title}» и его доска исчезнут из списка. Пока это демонстрационное действие на клиенте.`
            : undefined
        }
        confirmLabel="Удалить"
        onConfirm={() => {
          if (projectToDelete) removeProject(projectToDelete.id)
          setProjectToDelete(null)
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  )
}
