import { useState } from 'react'
import { AppButton, AppDialog, AppTextField, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import { PlusIcon } from '../app/icons.js'
import { ProjectCreateDialog, ProjectRow, pluralize, useProjects } from '../features/boards/index.js'
import { describeApiError } from '../services/api.js'
import type { BoardSummary, ProjectInput } from '../types/index.js'

/**
 * Окно проектов в оболочке главного меню: поиск, создание и удаление
 * личных Kanban-досок через `/api/boards`.
 */
export function BoardsPage() {
  const { projects, loading, error, reload, addProject, removeProject } = useProjects()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<BoardSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const handleCreate = (input: ProjectInput) => {
    setActionError(null)
    void addProject(input)
      .then(() => {
        setCreateOpen(false)
        setQuery('')
      })
      .catch((cause: unknown) => {
        setCreateOpen(false)
        setActionError(describeApiError(cause))
      })
  }

  const handleDelete = () => {
    if (!projectToDelete) return

    const project = projectToDelete
    setProjectToDelete(null)
    void removeProject(project.id).catch((cause: unknown) => {
      setActionError(describeApiError(cause))
    })
  }

  return (
    <div className="kb-home">
      <header className="kb-home__head">
        <h1 className="kb-home__title">Проекты</h1>
        <p className="kb-home__lead">
          Каждый проект — это отдельная Kanban-доска с колонками и WIP-лимитами.
          Выберите проект, чтобы открыть его доску.
        </p>
        <AppButton
          variant="filled"
          size="md"
          startIcon={<PlusIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Новый проект
        </AppButton>
      </header>

      {loading ? <LoadingState label="Загружаем проекты…" /> : null}

      {error ? (
        <div className="kb-home__error" role="alert">
          <StatusBadge tone="danger" withDot>{error}</StatusBadge>
          <AppButton variant="text" size="sm" onClick={() => void reload()}>
            Повторить
          </AppButton>
        </div>
      ) : null}

      {actionError ? (
        <div role="alert">
          <StatusBadge tone="danger" withDot>{actionError}</StatusBadge>
        </div>
      ) : null}

      {!loading && !error && projects.length === 0 ? (
        <EmptyState
          title="Проектов пока нет"
          description="Создайте первый проект — Kanbex добавит три колонки и демонстрационные карточки."
          actionLabel="Создать проект"
          onAction={() => setCreateOpen(true)}
        />
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <>
          <div className="kb-projects-toolbar">
            <AppTextField
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
            <ul className="kb-home__projects">
              {visibleProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onDelete={setProjectToDelete}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}

      {createOpen ? (
        <ProjectCreateDialog
          onCreate={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      ) : null}

      <AppDialog
        open={projectToDelete !== null}
        title="Удалить проект?"
        description={projectToDelete ? `Проект «${projectToDelete.title}» и его доска будут удалены без возможности восстановления.` : undefined}
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  )
}
