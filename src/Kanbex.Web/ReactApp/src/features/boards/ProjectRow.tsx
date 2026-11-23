import { Link, useNavigate } from 'react-router'
import { AppIconButton, AppLinearProgress, AppMenu, AppMenuItem, StatusBadge } from '@kanbex/ui'
import type { BoardSummary, ProjectRole } from '../../types/index.js'
import { ClockIcon, FolderIcon, MoreIcon } from '../../app/icons.js'
import { describeUpdatedAt, getProjectProgress } from './projectSummary.js'

export interface ProjectRowProps {
  project: BoardSummary
  onDelete: (project: BoardSummary) => void
}

const roleLabels: Record<ProjectRole, string> = {
  creator: 'Владелец',
  member: 'Участник',
}

/** Строка проекта с прогрессом и меню действий. */
export function ProjectRow({ project, onDelete }: ProjectRowProps) {
  const navigate = useNavigate()
  const progress = getProjectProgress(project)
  const percent = Math.round(progress * 100)

  return (
    <li className="kb-project-row">
      <Link className="kb-project-row__link" to={`/boards/${project.id}`}>
        <span className="kb-project-row__icon" aria-hidden="true">
          <FolderIcon />
        </span>
        <span className="kb-project-row__body">
          <span className="kb-project-row__heading">
            <span className="kb-project-row__title">{project.title}</span>
            <StatusBadge tone={project.role === 'creator' ? 'info' : 'neutral'}>
              {roleLabels[project.role]}
            </StatusBadge>
          </span>
          <span className="kb-project-row__meta">
            <ClockIcon />
            {describeUpdatedAt(project.updatedAt)}
          </span>
        </span>
        <span className="kb-project-row__progress" aria-label={`Готово ${percent}%`}>
          <AppLinearProgress
            className="kb-project-row__bar"
            value={progress}
            thickness={8}
          />
          <span className="kb-project-row__percent">{percent}%</span>
        </span>
      </Link>

      <AppMenu
        align="end"
        trigger={
          <AppIconButton
            variant="standard"
            size="sm"
            icon={<MoreIcon />}
            aria-label={`Действия с проектом «${project.title}»`}
          />
        }
      >
        <AppMenuItem onClick={() => navigate(`/boards/${project.id}`)}>Открыть</AppMenuItem>
        {project.role === 'creator' ? (
          <AppMenuItem onClick={() => onDelete(project)}>Удалить</AppMenuItem>
        ) : null}
      </AppMenu>
    </li>
  )
}
