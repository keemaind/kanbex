import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { AppButton, AppTextField, LoadingState, StatusBadge } from '@kanbex/ui'

import { describeApiError } from '../../services/api.js'
import { addBoardMember, fetchBoardMembers, removeBoardMember } from '../../services/boardsApi.js'

import type { BoardMember, ProjectRole } from '../../types/index.js'

export interface BoardMembersSectionProps {
  boardId: string
}

const roleLabels: Record<ProjectRole, string> = {
  creator: 'Владелец',
  member: 'Участник',
}

function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || 'K'
}

/** Секция участников: список, добавление по e-mail и удаление (только Creator). */
export function BoardMembersSection({ boardId }: BoardMembersSectionProps) {
  const [members, setMembers] = useState<BoardMember[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchBoardMembers(boardId)
      .then((list) => {
        if (active) {
          setMembers(list)
          setLoadError(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(describeApiError(cause))
      })

    return () => {
      active = false
    }
  }, [boardId])

  const handleAdd = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const trimmed = email.trim()

    if (!trimmed) {
      setEmailError('Укажите e-mail участника.')

      return
    }

    setEmailError(null)
    setActionError(null)
    setAdding(true)

    try {
      const added = await addBoardMember(boardId, trimmed)

      setMembers((current) => (current ? [...current, added] : [added]))
      setEmail('')
    } catch (cause) {
      setActionError(describeApiError(cause))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (member: BoardMember) => {
    setActionError(null)
    setRemovingUserId(member.userId)

    try {
      await removeBoardMember(boardId, member.userId)
      setMembers((current) =>
        current ? current.filter((item) => item.userId !== member.userId) : current,
      )
    } catch (cause) {
      setActionError(describeApiError(cause))
    } finally {
      setRemovingUserId(null)
    }
  }

  return (
    <div className="kb-members">
      <form className="kb-form" onSubmit={(event) => void handleAdd(event)}>
        <div className="kb-members__add">
          <AppTextField
            className="kb-members__field"
            label="E-mail участника"
            name="memberEmail"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (emailError) setEmailError(null)
            }}
            error={Boolean(emailError)}
            errorText={emailError ?? undefined}
            placeholder="user@example.com"
            autoComplete="off"
          />
          <AppButton type="submit" variant="filled" size="sm" disabled={adding}>
            Добавить
          </AppButton>
        </div>
      </form>

      {actionError ? (
        <StatusBadge tone="danger" withDot>
          {actionError}
        </StatusBadge>
      ) : null}

      {members === null && !loadError ? (
        <LoadingState compact label="Загружаем участников…" />
      ) : null}
      {loadError ? <p className="kb-members__state kb-members__state--error">{loadError}</p> : null}
      {members !== null && members.length === 0 ? (
        <p className="kb-members__state">Пока на доске только вы. Добавьте участника по e-mail.</p>
      ) : null}

      {members !== null && members.length > 0 ? (
        <ul className="kb-members__list">
          {members.map((member) => (
            <li key={member.userId} className="kb-members__item">
              <span className="kb-members__avatar" aria-hidden="true">
                {initialsOf(member.displayName)}
              </span>
              <span className="kb-members__info">
                <span className="kb-members__name">{member.displayName}</span>
                <StatusBadge tone={member.role === 'creator' ? 'info' : 'neutral'}>
                  {roleLabels[member.role]}
                </StatusBadge>
              </span>
              {member.role === 'member' ? (
                <AppButton
                  variant="text"
                  size="sm"
                  disabled={removingUserId !== null}
                  onClick={() => void handleRemove(member)}
                >
                  Удалить
                </AppButton>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
