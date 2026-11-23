import { useEffect, useState } from 'react'
import { LoadingState } from '@kanbex/ui'
import { fetchTaskHistory } from '../../services/boardsApi.js'
import { describeApiError } from '../../services/api.js'
import type { BoardColumn as BoardColumnModel, TaskHistoryEntry } from '../../types/index.js'

export interface TaskHistoryProps {
  boardId: string
  taskId: string
  columns: BoardColumnModel[]
  /** Участники доски — чтобы показать имя исполнителя вместо идентификатора. */
  members?: Array<{ userId: string; displayName: string }>
}

const eventLabels: Record<TaskHistoryEntry['eventType'], string> = {
  created: 'Создана',
  updated: 'Изменена',
  moved: 'Перемещена',
  assigned: 'Назначение',
}

const fieldLabels: Record<string, string> = {
  title: 'название',
  description: 'описание',
  priority: 'приоритет',
  dueDate: 'дедлайн',
  estimate: 'оценка',
}

function columnName(columns: BoardColumnModel[], columnId: string | null): string {
  if (!columnId) return '—'
  return columns.find((column) => column.id === columnId)?.title ?? 'колонка'
}

function describeDetails(entry: TaskHistoryEntry, members: TaskHistoryProps['members']): string | null {
  if (entry.eventType === 'assigned') {
    const name = members?.find((member) => member.userId === entry.details)?.displayName
    return name ? `Исполнитель: ${name}` : null
  }

  if (entry.eventType === 'created' && entry.details) {
    return `«${entry.details}»`
  }

  if (entry.eventType === 'updated' && entry.details) {
    const fields = entry.details
      .split(',')
      .map((field) => fieldLabels[field.trim()] ?? field.trim())
    return fields.length > 0 ? `Изменены поля: ${fields.join(', ')}` : null
  }

  return null
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Таймлайн истории карточки: создание, изменения, перемещения и назначения. */
export function TaskHistory({ boardId, taskId, columns, members }: TaskHistoryProps) {
  const [entries, setEntries] = useState<TaskHistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchTaskHistory(boardId, taskId)
      .then((list) => {
        if (active) {
          setEntries(list)
          setError(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(describeApiError(cause))
      })

    return () => {
      active = false
    }
  }, [boardId, taskId])

  if (error) {
    return <p className="kb-history__state kb-history__state--error">{error}</p>
  }

  if (entries === null) {
    return <LoadingState compact label="Загружаем историю…" />
  }

  if (entries.length === 0) {
    return (
      <p className="kb-history__state">Истории пока нет — события появятся после сохранения доски.</p>
    )
  }

  const ordered = [...entries].reverse()

  return (
    <ol className="kb-history__list">
      {ordered.map((entry) => {
        const details = describeDetails(entry, members)
        const moved = entry.eventType === 'moved'

        return (
          <li key={entry.id} className="kb-history__item">
            <span className="kb-history__label">{eventLabels[entry.eventType]}</span>
            <span className="kb-history__meta">
              {entry.changedByName} · {formatDateTime(entry.changedAt)}
            </span>
            {moved ? (
              <span className="kb-history__move">
                {columnName(columns, entry.oldColumnId)} → {columnName(columns, entry.newColumnId)}
              </span>
            ) : null}
            {details ? <span className="kb-history__details">{details}</span> : null}
          </li>
        )
      })}
    </ol>
  )
}
