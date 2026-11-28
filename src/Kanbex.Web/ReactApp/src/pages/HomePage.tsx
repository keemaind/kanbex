import { useState, type ReactNode } from 'react'

import { Link, useNavigate } from 'react-router'

import { AppButton, AppDialog, EmptyState, LoadingState, StatusBadge } from '@kanbex/ui'

import { ExpressiveShape, type ExpressiveShapeName } from '../app/expressiveShapes.js'
import { ArrowForwardIcon, CodeIcon, GroupsIcon, PersonIcon, PlusIcon, SchoolIcon } from '../app/icons.js'
import { useAuth } from '../features/auth/index.js'
import { ProjectCreateDialog, ProjectRow, boardTemplates, useProjects } from '../features/boards/index.js'
import { describeApiError } from '../services/api.js'
import { createBoardFromTemplate } from '../services/boardsApi.js'

import type { BoardSummary, ProjectInput } from '../types/index.js'

const templateIcons: Record<string, ReactNode> = {
  student: <SchoolIcon />,
  developer: <CodeIcon />,
  manager: <GroupsIcon />,
  personal: <PersonIcon />,
}

/** Каждой карточке шаблона — своя форма из Shape Sequence. */
const templateShapes: readonly ExpressiveShapeName[] = ['softBurst', 'cookie9', 'sunny', 'cookie4']

/**
 * Главная страница: готовые сценарии (создание доски по шаблону через API),
 * персонализация темы и последние проекты с прогрессом по колонке «Готово».
 */
export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { projects, loading, error, reload, addProject, removeProject } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<BoardSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

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

  const handleUseTemplate = (templateKey: string) => {
    setCreatingTemplate(templateKey)
    setTemplateError(null)
    createBoardFromTemplate(templateKey)
      .then((board) => navigate(`/boards/${board.id}`))
      .catch((cause: unknown) => {
        setCreatingTemplate(null)
        setTemplateError(describeApiError(cause))
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

      <section className="kb-home__section" aria-labelledby="kb-home-use-cases">
        <h2 className="kb-home__section-title" id="kb-home-use-cases">
          Шаблоны под ваш стиль работы
        </h2>
        <div className="kb-home__templates">
          {boardTemplates.map((template, index) => (
            <article key={template.key} className="kb-template-card">
              <span className="kb-template-card__shape" aria-hidden="true">
                <ExpressiveShape
                  name={templateShapes[index % templateShapes.length]!}
                  className="kb-template-card__shape-svg"
                />
                <span className="kb-template-card__shape-icon">{templateIcons[template.key]}</span>
              </span>
              <h3 className="kb-template-card__title">{template.title}</h3>
              <p className="kb-template-card__text">{template.description}</p>
              <AppButton
                variant="filled"
                size="sm"
                disabled={creatingTemplate !== null}
                onClick={() => handleUseTemplate(template.key)}
              >
                {creatingTemplate === template.key ? 'Создаём…' : 'Попробовать этот шаблон'}
              </AppButton>
            </article>
          ))}
        </div>
        {templateError ? (
          <div role="alert">
            <StatusBadge tone="danger" withDot>{templateError}</StatusBadge>
          </div>
        ) : null}
      </section>

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
