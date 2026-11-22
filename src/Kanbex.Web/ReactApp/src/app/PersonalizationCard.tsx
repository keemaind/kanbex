import { useMemo, useState } from 'react'
import {
  AppCarousel,
  AppCarouselItem,
  AppDialog,
  AppIconButton,
  AppSwitch,
  generateColorScheme,
} from '@kanbex/ui'
import { accentPresets, useThemeSettings } from './themeSettings.js'
import { CheckIcon, EditIcon, PlusIcon } from '../app/icons.js'

/** Роли, которые наглядно показывают, как перекрасится интерфейс:
 *  акцент (кнопки и ссылки), чипы и подложки контейнеров. */
const paletteRoles = ['primary', 'primary-container', 'surface-container'] as const

/** Палитра для собственной темы: 30 цветов — тёмные, средние, светлые
 *  и нейтральные, с разным контрастом. */
const presetColors: readonly string[] = [
  '#B3261E', '#C2410C', '#B45309', '#15803D', '#0F766E', '#1D4ED8', '#6D28D9', '#BE185D',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#5EEAD4', '#93C5FD', '#C4B5FD', '#F9A8D4',
  '#17172B', '#44445A', '#777793', '#A6A6C8', '#D9D9E3', '#F1F0F7',
]

const draftRoles = [
  {
    key: 'accent' as const,
    label: 'Акцент',
    hint: 'Кнопки, ссылки, активный пункт меню, индикатор сохранения',
  },
  {
    key: 'chips' as const,
    label: 'Чипы',
    hint: 'Аватар, счётчики колонок, плашки иконок',
  },
  {
    key: 'surface' as const,
    label: 'Подложки',
    hint: 'Карточки, панели и фоны контейнеров',
  },
]

interface PaletteDraft {
  accent: string
  chips: string
  surface: string
}

const defaultDraft: PaletteDraft = {
  accent: '#6252E8',
  chips: '#C4B5FD',
  surface: '#F1F0F7',
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Карточка персонализации: переключатель тёмной темы и карусель палитр.
 * Внутри карточки палитры — только кружки цветов (наполовину выходят за
 * верхнюю грань), название — под карточкой. Кнопка-карандаш — явный
 * переключатель режима редактирования: во включённом состоянии она залита
 * вторичным цветом и меняет форму, под заголовком появляется подсказка,
 * а на своих палитрах в центре карточки виден крестик удаления. В конце
 * карусели — добавление собственной темы из трёх выбранных цветов.
 */
export function PersonalizationCard() {
  const { mode, seed, activeId, setMode, selectTheme, customPalettes, addCustomPalette, removeCustomPalette } =
    useThemeSettings()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PaletteDraft>(defaultDraft)

  // Пресет активен, только если явно выбран он: своя тема с тем же seed
  // не должна подсвечивать пресет — активность определяется по id.
  const presets = useMemo(
    () =>
      accentPresets.map((preset) => {
        const scheme = generateColorScheme({ seedColor: preset.seed, mode })
        return {
          name: preset.name,
          seed: preset.seed,
          colors: paletteRoles.map((role) => scheme[role]),
          active: activeId === null && seed === preset.seed,
        }
      }),
    [mode, seed, activeId],
  )

  const handleAddCustom = () => {
    const palette = {
      id: createId(),
      name: `Своя тема ${customPalettes.length + 1}`,
      seed: draft.accent,
      colors: [draft.accent, draft.chips, draft.surface] as [string, string, string],
    }

    addCustomPalette(palette)
    selectTheme(palette.seed, palette.id)
    setDraft(defaultDraft)
    setAddOpen(false)
  }

  const handleRemoveCustom = (id: string) => {
    removeCustomPalette(id)
    if (activeId === id) {
      selectTheme(accentPresets[0]!.seed, null)
    }
  }

  return (
    <div className="kb-theme-card">
      <label className="kb-theme-card__row">
        <span className="kb-theme-card__label">
          Тёмная тема
          <span className="kb-theme-card__hint">Светлая и тёмная схемы Material 3</span>
        </span>
        <AppSwitch
          selected={mode === 'dark'}
          aria-label="Тёмная тема"
          onChange={(_, selected) => setMode(selected ? 'dark' : 'light')}
        />
      </label>
      <div className="kb-theme-card__row kb-theme-card__row--column">
        <span className="kb-theme-card__label-row">
          <span className="kb-theme-card__label">
            Акцентный цвет
            <span
              className={
                editing ? 'kb-theme-card__hint kb-theme-card__hint--editing' : 'kb-theme-card__hint'
              }
            >
              {editing
                ? 'Режим удаления тем включён — нажмите крестик на карточке своей темы'
                : 'Карандаш включает режим удаления тем'}
            </span>
          </span>
          <AppIconButton
            variant={editing ? 'tonal' : 'standard'}
            size="xs"
            type="button"
            icon={<EditIcon />}
            selectedIcon={<CheckIcon />}
            toggle
            selected={editing}
            aria-label={editing ? 'Выйти из режима редактирования' : 'Редактировать свои палитры'}
            onChange={(_, next) => setEditing(next)}
          />
        </span>
        <AppCarousel
          className={editing ? 'kb-theme-swatches kb-theme-swatches--editing' : 'kb-theme-swatches'}
          variant="uncontained"
          itemWidth={120}
          itemHeight={78}
          spacing={8}
          aria-label="Акцентная палитра интерфейса"
        >
          {presets.map((palette) => (
            <AppCarouselItem
              key={palette.seed}
              className={palette.active ? 'kb-palette kb-palette--active' : 'kb-palette'}
              aria-pressed={palette.active}
              aria-label={`Акцентная палитра: ${palette.name}`}
              onClick={() => selectTheme(palette.seed, null)}
            >
              <span className="kb-palette__inner">
                <span className="kb-palette__circles" aria-hidden="true">
                  {palette.colors.map((color, index) => (
                    <span
                      key={`${palette.seed}-${index}`}
                      className="kb-palette__color"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="kb-palette__card" aria-hidden="true" />
                <span className="kb-palette__name">{palette.name}</span>
              </span>
            </AppCarouselItem>
          ))}
          {customPalettes.map((palette) => (
            <AppCarouselItem key={palette.id} className="kb-palette kb-palette--custom">
              <span className="kb-palette__inner">
                <span className="kb-palette__circles" aria-hidden="true">
                  {palette.colors.map((color, index) => (
                    <span
                      key={`${palette.id}-${index}`}
                      className="kb-palette__color"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="kb-palette__cardwrap">
                  <button
                    type="button"
                    className={
                      activeId === palette.id ? 'kb-palette__card kb-palette__card--active' : 'kb-palette__card'
                    }
                    aria-pressed={activeId === palette.id}
                    aria-label={`Выбрать палитру: ${palette.name}`}
                    onClick={() => selectTheme(palette.seed, palette.id)}
                  />
                  {editing ? (
                    <button
                      type="button"
                      className="kb-palette__delete"
                      aria-label={`Удалить палитру: ${palette.name}`}
                      onClick={() => handleRemoveCustom(palette.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </span>
                <span className="kb-palette__name">{palette.name}</span>
              </span>
            </AppCarouselItem>
          ))}
          <AppCarouselItem className="kb-palette kb-palette--add">
            <span className="kb-palette__inner">
              <button
                type="button"
                className="kb-palette-add"
                onClick={() => setAddOpen(true)}
                aria-label="Добавить собственную тему"
              >
                <PlusIcon />
              </button>
              <span className="kb-palette__name">Своя тема</span>
            </span>
          </AppCarouselItem>
        </AppCarousel>
      </div>

      <AppDialog
        open={addOpen}
        title="Своя тема"
        description="Выберите по цвету для каждой роли — акцент станет основой темы."
        confirmLabel="Добавить"
        onConfirm={handleAddCustom}
        onCancel={() => setAddOpen(false)}
      >
        <div className="kb-color-preview" aria-hidden="true">
          {draftRoles.map((role) => (
            <span key={role.key} className="kb-palette__color" style={{ background: draft[role.key] }} />
          ))}
        </div>
        <div className="kb-color-scroll">
          {draftRoles.map((role) => (
            <div key={role.key} className="kb-color-group">
              <span className="kb-color-group__label">{role.label}</span>
              <div className="kb-color-group__colors" role="radiogroup" aria-label={`Цвет: ${role.label}`}>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={draft[role.key] === color}
                    aria-label={color}
                    title={color}
                    className={draft[role.key] === color ? 'kb-color-dot kb-color-dot--active' : 'kb-color-dot'}
                    style={{ background: color }}
                    onClick={() => setDraft({ ...draft, [role.key]: color })}
                  />
                ))}
              </div>
              <span className="kb-color-group__hint">{role.hint}</span>
            </div>
          ))}
        </div>
      </AppDialog>
    </div>
  )
}
