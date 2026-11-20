import { useState } from 'react'
import { Link } from 'react-router'
import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'
import { ProjectCreateDialog, ProjectRow, useProjects } from '../features/boards/index.js'
import { useAuth } from '../features/auth/index.js'
import { ArrowForwardIcon, PlusIcon } from '../app/icons.js'
import { describeApiError } from '../services/api.js'
import type { BoardSummary, ProjectInput } from '../types/index.js'

/**
 * Главный экран: приветствие, создание проекта и последние проекты
 * с прогрессом по колонке «Готово».
 */
export function HomePage() {
  const { user } = useAuth()
  const { projects, loading, error, reload, addProject, removeProject } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<BoardSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const firstName = user?.displayName.trim().split(/\s+/)[0] ?? 'друг'
  const visibleProjects = projects.slice(0, 3)

  const handleCreate = (input: ProjectInput) => {
    setActionError(null)
    void addProject(input)
      .then(() => setCreateOpen(false))
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
        <h1 className="kb-home__title">Привет, {firstName}!</h1>
        <p className="kb-home__lead">Готов начать новый проект?</p>
        <AppButton
          variant="filled"
          size="md"
          startIcon={<PlusIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Создать проект
        </AppButton>
      </header>

      <div className="kb-home__section-head">
        <h2 className="kb-home__section-title">Мои проекты</h2>
        <Link className="kb-home__all" to="/boards">
          Все проекты
          <ArrowForwardIcon />
        </Link>
      </div>

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
        <ul className="kb-home__projects">
          {visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onDelete={setProjectToDelete}
            />
          ))}
        </ul>
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
