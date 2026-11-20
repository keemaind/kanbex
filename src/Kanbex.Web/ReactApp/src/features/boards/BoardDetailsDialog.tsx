import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppDialog, AppTextField } from '@kanbex/ui'

export interface BoardDetailsValues {
  title: string
  description: string
}

export interface BoardDetailsDialogProps {
  title: string
  description: string
  onSave: (values: BoardDetailsValues) => void
  onCancel: () => void
}

/** Название и описание доски. */
export function BoardDetailsDialog({ title, description, onSave, onCancel }: BoardDetailsDialogProps) {
  const [nextTitle, setNextTitle] = useState(title)
  const [nextDescription, setNextDescription] = useState(description)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmedTitle = nextTitle.trim()
    if (trimmedTitle.length < 2) {
      setError('Название доски должно содержать минимум 2 символа.')
      return
    }

    setError(null)
    onSave({ title: trimmedTitle, description: nextDescription.trim() })
  }

  return (
    <AppDialog
      open
      title="Настройки доски"
      description="Название и описание видны в списке проектов и в шапке доски."
      confirmLabel="Сохранить"
      onConfirm={() => handleSubmit()}
      onCancel={onCancel}
    >
      <form className="kb-form" onSubmit={handleSubmit}>
        <AppTextField
          label="Название доски"
          name="boardTitle"
          value={nextTitle}
          onChange={(event) => {
            setNextTitle(event.target.value)
            if (error) setError(null)
          }}
          error={Boolean(error)}
          errorText={error ?? undefined}
          maxLength={120}
          required
          inputProps={{ autoFocus: true }}
        />
        <AppTextField
          label="Описание"
          name="boardDescription"
          value={nextDescription}
          onChange={(event) => setNextDescription(event.target.value)}
          supportingText="Необязательно: одной строкой о цели доски."
          multiline
          rows={3}
          maxLength={4000}
        />
      </form>
    </AppDialog>
  )
}
