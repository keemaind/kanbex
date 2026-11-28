import { useState } from 'react'

import { AppOption, AppSelect } from '@kanbex/ui'

import { PersonalizationCard } from '../app/PersonalizationCard.js'
import { accentPresets, useThemeSettings } from '../app/themeSettings.js'

/** Страница настроек: персонализация оформления и язык интерфейса. */
export function SettingsPage() {
  const { seed } = useThemeSettings()
  const [language, setLanguage] = useState('ru')
  const activePreset = accentPresets.find((preset) => preset.seed === seed)

  return (
    <div className="kb-page kb-settings">
      <header className="kb-page__head">
        <div>
          <h1 className="kb-page__title">Настройки</h1>
          <p className="kb-page__lead">
            Оформление приложения: тёмная тема и акцентный цвет Material 3.
            {activePreset ? ` Текущий акцент — «${activePreset.name}».` : ''}
          </p>
        </div>
      </header>

      <PersonalizationCard />

      <div className="kb-theme-card kb-language-card">
        <div className="kb-theme-card__row">
          <span className="kb-theme-card__label">
            Язык интерфейса
            <span className="kb-theme-card__hint">Перевод появится позже</span>
          </span>
          <AppSelect
            name="language"
            aria-label="Язык интерфейса"
            value={language}
            onChange={(_, value) => setLanguage(value)}
          >
            <AppOption value="ru">Русский</AppOption>
            <AppOption value="en" disabled>
              English
            </AppOption>
          </AppSelect>
        </div>
      </div>
    </div>
  )
}
