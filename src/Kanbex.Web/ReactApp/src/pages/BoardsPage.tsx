import { useState } from 'react'
import { TextField } from 'm3-expressive-react'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import type { BoardSummary } from '../types/index.js'
import {
  ProjectCard,
  ProjectCreateDialog,
  pluralize,
  useProjects,
} from '../features/boards/index.js'

/**
 * Окно проектов: список личных Kanban-досок, поиск, создание и удаление через `/api/boards`.
 */
export function BoardsPage() {
  const { projects, loading, error, reload, addProject, removeProject } = useProjects()
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

      {loading ? <LoadingState label="Загружаем проекты…" /> : null}
      {error ? (
        <div role="alert">
          <StatusBadge tone="danger" withDot>{error}</StatusBadge>
          <AppButton variant="text" size="sm" onClick={() => void reload()}>Повторить</AppButton>
        </div>
      ) : null}
      {!loading && projects.length === 0 ? (
        <EmptyState
          title="Проектов пока нет"
          description="Создайте первый проект: в его доске появятся колонки «К выполнению», «В работе» и «Готово»."
          actionLabel="Создать проект"
          onAction={() => setCreateOpen(true)}
        />
      ) : !loading && projects.length > 0 ? (
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
      ) : null}

      {createOpen ? (
        <ProjectCreateDialog
          onCreate={(input) => {
            void addProject(input).then(() => {
              setCreateOpen(false)
              setQuery('')
            }).catch((cause: unknown) => {
              window.alert(cause instanceof Error ? cause.message : 'Не удалось создать проект.')
            })
          }}
          onCancel={() => setCreateOpen(false)}
        />
      ) : null}

      <AppDialog
        open={projectToDelete !== null}
        title="Удалить проект?"
        description={projectToDelete ? `Проект «${projectToDelete.title}» и его доска будут удалены без возможности восстановления.` : undefined}
        confirmLabel="Удалить"
        onConfirm={() => {
          if (projectToDelete) {
            void removeProject(projectToDelete.id).then(() => setProjectToDelete(null)).catch((cause: unknown) => {
              window.alert(cause instanceof Error ? cause.message : 'Не удалось удалить проект.')
            })
          }
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  )
}
