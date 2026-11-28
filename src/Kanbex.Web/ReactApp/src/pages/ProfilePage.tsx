import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router'

import { AppButton, AppTextField, StatusBadge } from '@kanbex/ui'

import { fileToAvatarFile, getInitials, validateAvatarFile } from '../app/avatar.js'
import { useAuth } from '../features/auth/index.js'
import { describeApiError } from '../services/api.js'
import { changePassword, deleteAvatar, updateDisplayName, uploadAvatar } from '../services/authApi.js'

/** Страница профиля: аватар на сервере, имя, смена пароля и выход из аккаунта. */
export function ProfilePage() {
  const { user, updateUser, logout, pending } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarUrl = user?.avatarUrl ?? null

  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarNotice, setAvatarNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  const [name, setName] = useState(user?.displayName ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameNotice, setNameNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.displayName)
    }
  }, [user])

  if (!user) return null

  const nameChanged = name.trim() !== user.displayName && name.trim().length >= 2

  const handleSaveName = () => {
    setNameSaving(true)
    setNameNotice(null)
    updateDisplayName(name.trim())
      .then((updated) => {
        updateUser(updated)
        setNameNotice({ tone: 'success', text: 'Имя обновлено.' })
      })
      .catch((cause: unknown) => {
        setNameNotice({ tone: 'danger', text: describeApiError(cause) })
      })
      .finally(() => setNameSaving(false))
  }

  const passwordValid =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === repeatPassword

  const handleLogout = () => {
    void logout().then(() => navigate('/login', { replace: true }))
  }

  const handleChangePassword = () => {
    setPasswordSaving(true)
    setPasswordNotice(null)
    changePassword({ currentPassword, newPassword })
      .then(() => {
        setCurrentPassword('')
        setNewPassword('')
        setRepeatPassword('')
        setPasswordNotice({ tone: 'success', text: 'Пароль изменён.' })
      })
      .catch((cause: unknown) => {
        setPasswordNotice({ tone: 'danger', text: describeApiError(cause) })
      })
      .finally(() => setPasswordSaving(false))
  }

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return

    const validationError = validateAvatarFile(file)

    if (validationError) {
      setAvatarNotice({ tone: 'danger', text: validationError })

      return
    }

    setAvatarSaving(true)
    setAvatarNotice(null)
    fileToAvatarFile(file)
      .then((prepared) => uploadAvatar(prepared))
      .then((updated) => {
        updateUser(updated)
        setAvatarNotice({ tone: 'success', text: 'Аватар обновлён.' })
      })
      .catch((cause: unknown) => {
        setAvatarNotice({ tone: 'danger', text: describeApiError(cause) })
      })
      .finally(() => setAvatarSaving(false))
  }

  const handleAvatarDelete = () => {
    setAvatarSaving(true)
    setAvatarNotice(null)
    deleteAvatar()
      .then((updated) => {
        updateUser(updated)
        setAvatarNotice({ tone: 'success', text: 'Аватар удалён.' })
      })
      .catch((cause: unknown) => {
        setAvatarNotice({ tone: 'danger', text: describeApiError(cause) })
      })
      .finally(() => setAvatarSaving(false))
  }

  return (
    <div className="kb-page kb-profile-page">
      <header className="kb-page__head">
        <div>
          <h1 className="kb-page__title">Профиль</h1>
          <p className="kb-page__lead">{user.email}</p>
        </div>
      </header>

      <section className="kb-account-card" aria-labelledby="kb-profile-avatar-title">
        <h2 className="kb-account-card__title" id="kb-profile-avatar-title">
          Аватар
        </h2>
        <div className="kb-profile-avatar-row">
          {avatarUrl ? (
            <img className="kb-profile-avatar" src={avatarUrl} alt="Аватар пользователя" />
          ) : (
            <span className="kb-profile-avatar kb-profile-avatar--fallback" aria-hidden="true">
              {getInitials(user.displayName)}
            </span>
          )}
          <div className="kb-profile-actions">
            <AppButton
              variant="filled"
              size="sm"
              disabled={avatarSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSaving ? 'Сохраняем…' : 'Загрузить фото'}
            </AppButton>
            {avatarUrl ? (
              <AppButton variant="text" size="sm" disabled={avatarSaving} onClick={handleAvatarDelete}>
                Удалить
              </AppButton>
            ) : null}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="kb-profile-file-input"
          onChange={(event) => {
            handleAvatarChange(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {avatarNotice ? (
          <StatusBadge tone={avatarNotice.tone} withDot>
            {avatarNotice.text}
          </StatusBadge>
        ) : null}
      </section>

      <section className="kb-account-card" aria-labelledby="kb-profile-name-title">
        <h2 className="kb-account-card__title" id="kb-profile-name-title">
          Имя
        </h2>
        <AppTextField
          label="Отображаемое имя"
          value={name}
          onChange={(event) => setName(event.target.value)}
          inputProps={{ maxLength: 120 }}
        />
        <div className="kb-profile-actions">
          <AppButton
            variant="filled"
            size="sm"
            disabled={!nameChanged || nameSaving}
            onClick={handleSaveName}
          >
            {nameSaving ? 'Сохраняем…' : 'Сохранить'}
          </AppButton>
        </div>
        {nameNotice ? (
          <StatusBadge tone={nameNotice.tone} withDot>
            {nameNotice.text}
          </StatusBadge>
        ) : null}
      </section>

      <section className="kb-account-card" aria-labelledby="kb-profile-security-title">
        <h2 className="kb-account-card__title" id="kb-profile-security-title">
          Безопасность и доступ
        </h2>
        <div className="kb-security-fields">
          <AppTextField
            label="Текущий пароль"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            inputProps={{ autoComplete: 'current-password' }}
          />
          <AppTextField
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            inputProps={{ autoComplete: 'new-password', minLength: 8 }}
          />
          <AppTextField
            label="Повторите новый пароль"
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            inputProps={{ autoComplete: 'new-password' }}
          />
        </div>
        <div className="kb-profile-actions">
          <AppButton
            variant="filled"
            size="sm"
            disabled={!passwordValid || passwordSaving}
            onClick={handleChangePassword}
          >
            {passwordSaving ? 'Меняем…' : 'Сменить пароль'}
          </AppButton>
        </div>
        {passwordNotice ? (
          <StatusBadge tone={passwordNotice.tone} withDot>
            {passwordNotice.text}
          </StatusBadge>
        ) : null}
      </section>

      <section className="kb-account-card" aria-labelledby="kb-profile-signout-title">
        <h2 className="kb-account-card__title" id="kb-profile-signout-title">
          Учётная запись
        </h2>
        <div className="kb-profile-signout">
          <span className="kb-profile-signout__hint">Завершить сеанс на этом устройстве</span>
          <AppButton variant="outlined" size="sm" disabled={pending} onClick={handleLogout}>
            Выйти
          </AppButton>
        </div>
      </section>
    </div>
  )
}
