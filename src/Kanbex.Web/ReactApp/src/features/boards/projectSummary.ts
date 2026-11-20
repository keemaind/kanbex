import type { BoardSummary } from '../../types/index.js'

/** Доля завершённых карточек проекта в диапазоне 0..1. */
export function getProjectProgress(
  project: Pick<BoardSummary, 'taskCount' | 'completedTaskCount'>,
): number {
  if (project.taskCount <= 0) return 0

  return Math.min(1, Math.max(0, project.completedTaskCount / project.taskCount))
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Человекочитаемая дата обновления проекта. */
export function describeUpdatedAt(value: string, now: Date = new Date()): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Дата обновления неизвестна'

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days <= 0) return 'Обновлён сегодня'
  if (days === 1) return 'Обновлён вчера'

  return `Обновлён ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
}
