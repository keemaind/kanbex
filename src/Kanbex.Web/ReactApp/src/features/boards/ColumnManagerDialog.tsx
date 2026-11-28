import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppButton, AppDialog, AppTextField } from '@kanbex/ui'

import { createId } from './boardLogic.js'
import { pluralize } from './pluralize.js'

import type { BoardColumn } from '../../types/index.js'

export interface ColumnManagerDialogProps {
  columns: BoardColumn[]
  onApply: (columns: BoardColumn[]) => void
  onCancel: () => void
}

interface ColumnRow {
  id: string
  title: string
  wipLimit: string
  tasksCount: number
}

function toRows(columns: BoardColumn[]): ColumnRow[] {
  return columns.map((column) => ({
    id: column.id,
    title: column.title,
    wipLimit: column.wipLimit === null ? '' : String(column.wipLimit),
    tasksCount: column.tasks.length,
  }))
}

function parseWipLimit(value: string): number | null | 'invalid' {
  const trimmed = value.trim()

  if (trimmed === '') return null

  const parsed = Number(trimmed)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 'invalid'
}

/**
 * Управление колонками: каждый этап — отдельная карточка с номером, названием,
 * WIP-лимитом и действиями. Порядок строк = порядок этапов на доске слева
 * направо. Колонку с карточками удалить нельзя, чтобы не потерять данные.
 */
export function ColumnManagerDialog({ columns, onApply, onCancel }: ColumnManagerDialogProps) {
  const [rows, setRows] = useState<ColumnRow[]>(() => toRows(columns))
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const updateRow = (id: string, patch: Partial<ColumnRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const moveRow = (index: number, delta: -1 | 1) => {
    const target = index + delta

    if (target < 0 || target >= rows.length) return

    setRows((current) => {
      const next = [...current]
      const [moved] = next.splice(index, 1)

      next.splice(target, 0, moved)

      return next
    })
  }

  const removeRow = (id: string) => {
    const row = rows.find((candidate) => candidate.id === id)

    if (!row) return

    if (rows.length === 1) {
      setError('На доске должна остаться хотя бы одна колонка.')

      return
    }

    if (row.tasksCount > 0) {
      setError(`В колонке «${row.title}» есть карточки. Сначала перенесите или удалите их.`)

      return
    }

    setError(null)
    setRows((current) => current.filter((candidate) => candidate.id !== id))
  }

  const handleAdd = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const title = newTitle.trim()

    if (!title) {
      setError('Введите название новой колонки.')

      return
    }

    if (title.length > 100) {
      setError('Название колонки не должно превышать 100 символов.')

      return
    }

    setError(null)
    setRows((current) => [...current, { id: createId(), title, wipLimit: '', tasksCount: 0 }])
    setNewTitle('')
  }

  const handleApply = () => {
    if (rows.length === 0) {
      setError('На доске должна остаться хотя бы одна колонка.')

      return
    }

    const next: BoardColumn[] = []

    for (const [order, row] of rows.entries()) {
      const title = row.title.trim()

      if (!title || title.length > 100) {
        setError('Название каждой колонки должно содержать от 1 до 100 символов.')

        return
      }

      const wipLimit = parseWipLimit(row.wipLimit)

      if (wipLimit === 'invalid') {
        setError(`WIP-лимит колонки «${title}» должен быть целым положительным числом.`)

        return
      }

      if (wipLimit !== null && row.tasksCount > wipLimit) {
        setError(`В колонке «${title}» ${row.tasksCount} карточек — WIP-лимит не может быть меньше.`)

        return
      }

      const original = columns.find((column) => column.id === row.id)

      next.push(original
        ? { ...original, title, wipLimit, order }
        : { id: row.id, title, wipLimit, order, tasks: [] })
    }

    setError(null)
    onApply(next)
  }

  return (
    <AppDialog
      open
      className="kb-dialog--wide"
      title="Колонки доски"
      description="Этапы идут сверху вниз — на доске расположатся слева направо. WIP-лимит ограничивает число карточек в работе: пустое поле — без ограничения."
      confirmLabel="Сохранить колонки"
      onConfirm={handleApply}
      onCancel={onCancel}
    >
      <div className="kb-column-editor">
        {rows.map((row, index) => (
          <div className="kb-column-editor__row" key={row.id} data-stage={index % 3}>
            <span className="kb-column-editor__order" aria-hidden="true">
              {index + 1}
            </span>
            <div className="kb-column-editor__fields">
              <AppTextField
                label="Название"
                name={`columnTitle-${row.id}`}
                value={row.title}
                onChange={(event) => updateRow(row.id, { title: event.target.value })}
                maxLength={100}
                required
              />
              <AppTextField
                className="kb-column-editor__wip"
                label="WIP-лимит"
                name={`columnWip-${row.id}`}
                value={row.wipLimit}
                onChange={(event) => updateRow(row.id, { wipLimit: event.target.value })}
                supportingText="Пусто — без ограничения"
                inputProps={{ inputMode: 'numeric' }}
              />
            </div>
            <div className="kb-column-editor__side">
              <span className="kb-column-editor__cards">
                {row.tasksCount > 0
                  ? `${row.tasksCount} ${pluralize(row.tasksCount, ['карточка', 'карточки', 'карточек'])}`
                  : 'Пусто'}
              </span>
              <div className="kb-column-editor__actions">
                <AppButton
                  variant="text"
                  size="xs"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                  aria-label={`Переместить колонку «${row.title}» раньше`}
                >
                    ↑
                </AppButton>
                <AppButton
                  variant="text"
                  size="xs"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Переместить колонку «${row.title}» позже`}
                >
                    ↓
                </AppButton>
                <AppButton
                  variant="text"
                  size="xs"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1 || row.tasksCount > 0}
                  title={row.tasksCount > 0 ? 'Сначала перенесите или удалите карточки' : 'Удалить колонку'}
                >
                    Удалить
                </AppButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form className="kb-form kb-column-editor__add" onSubmit={handleAdd}>
        <AppTextField
          className="kb-column-editor__add-field"
          label="Новая колонка"
          name="newColumnTitle"
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value)
            if (error) setError(null)
          }}
          maxLength={100}
          supportingText="Например: «Ревью» или «Заблокировано»."
        />
        <AppButton type="button" variant="tonal" onClick={() => handleAdd()}>
          Добавить колонку
        </AppButton>
      </form>

      {error ? <p className="kb-form__error">{error}</p> : null}
      <p className="kb-column-editor__hint">
        Колонку с карточками нельзя удалить — сначала перенесите их в другой этап.
      </p>
    </AppDialog>
  )
}
