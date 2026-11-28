import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppDialog, AppTextField } from '@kanbex/ui'

import type { ProjectInput } from '../../types/index.js'

export interface ProjectCreateDialogProps {
  onCreate: (input: ProjectInput) => void
  onCancel: () => void
}

/**
 * Диалог создания проекта. Валидирует название на клиенте; после подключения
 * API те же проверки повторит сервер и вернёт ошибки валидации.
 */
export function ProjectCreateDialog({ onCreate, onCancel }: ProjectCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = title.trim()

    if (trimmedTitle.length < 2) {
      setError('Название должно содержать минимум 2 символа.')

      return
    }

    setError(null)
    onCreate({ title: trimmedTitle, description: description.trim() })
  }

  return (
    <AppDialog
      open
      title="Новый проект"
      description="Проект — это отдельная Kanban-доска с колонками «К выполнению», «В работе» и «Готово» и демонстрационными карточками."
      confirmLabel="Создать проект"
      onConfirm={() => handleSubmit()}
      onCancel={onCancel}
    >
      <form className="kb-form" onSubmit={handleSubmit}>
        <AppTextField
          label="Название проекта"
          name="projectTitle"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            if (error) setError(null)
          }}
          error={Boolean(error)}
          errorText={error ?? undefined}
          supportingText="Например: «Учебный проект по Kanban»"
          maxLength={60}
          required
          inputProps={{ autoFocus: true }}
        />
        <AppTextField
          label="Описание"
          name="projectDescription"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          supportingText="Необязательно: одной строкой о цели проекта."
          multiline
          rows={3}
          maxLength={200}
        />
      </form>
    </AppDialog>
  )
}
