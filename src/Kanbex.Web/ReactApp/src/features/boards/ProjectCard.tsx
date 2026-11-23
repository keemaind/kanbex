import { Link } from 'react-router'
import { AppButton, StatusBadge } from '@kanbex/ui'
import type { BoardSummary } from '../../types/index.js'
import { pluralize } from './pluralize.js'

export interface ProjectCardProps {
  project: BoardSummary
  onDelete: (project: BoardSummary) => void
}

/**
 * Карточка проекта в окне проектов. Ссылка открывает доску, а удаление
 * вынесено в отдельную кнопку, чтобы не вкладывать интерактивные элементы.
 */
export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <li className="kb-project-card">
      <Link className="kb-project-card__link" to={`/boards/${project.id}`}>
        <span className="kb-project-card__title">{project.title}</span>
        <span className="kb-project-card__description">
          {project.description || 'Описание пока не добавлено.'}
        </span>
        <span className="kb-project-card__meta">
          <StatusBadge tone="info">
            {project.columnCount} {pluralize(project.columnCount, ['колонка', 'колонки', 'колонок'])}
          </StatusBadge>
          <StatusBadge tone="neutral">
            {project.taskCount} {pluralize(project.taskCount, ['задача', 'задачи', 'задач'])}
          </StatusBadge>
        </span>
      </Link>

      <div className="kb-project-card__actions">
        <AppButton
          variant="text"
          size="xs"
          onClick={() => onDelete(project)}
          aria-label={`Удалить проект «${project.title}»`}
        >
          Удалить
        </AppButton>
      </div>
    </li>
  )
}
