import type { CSSProperties } from 'react'

export interface TagColorPreset {
  name: string
  color: string
}

/** Готовые цвета тегов — те же пресеты, что и в палитрах оформления тем. */
export const tagColorPresets: readonly TagColorPreset[] = [
  { name: 'Фиолетовый', color: '#6252E8' },
  { name: 'Розовый', color: '#B34FA3' },
  { name: 'Коралловый', color: '#D9584F' },
  { name: 'Оранжевый', color: '#E8710A' },
  { name: 'Янтарный', color: '#D99000' },
  { name: 'Зелёный', color: '#2E8B57' },
  { name: 'Бирюзовый', color: '#00897B' },
  { name: 'Голубой', color: '#039BE5' },
  { name: 'Синий', color: '#2E6FDB' },
  { name: 'Серый', color: '#5F6368' },
]

export interface TagColorPickerProps {
  value: string
  onChange: (color: string) => void
}

/** Выбор цвета тега: ряд заранее подготовленных кружков. */
export function TagColorPicker({ value, onChange }: TagColorPickerProps) {
  return (
    <div className="kb-color-picker" role="radiogroup" aria-label="Цвет тега">
      {tagColorPresets.map((preset) => {
        const selected = value.toLowerCase() === preset.color.toLowerCase()
        return (
          <button
            key={preset.color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={preset.name}
            title={preset.name}
            className={
              selected ? 'kb-color-picker__dot kb-color-picker__dot--selected' : 'kb-color-picker__dot'
            }
            style={{ '--kb-tag-color': preset.color } as CSSProperties}
            onClick={() => onChange(preset.color)}
          />
        )
      })}
    </div>
  )
}
