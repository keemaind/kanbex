/** Преобразования дедлайна между полем DatePicker и API (`YYYY-MM-DD`). */

/** Дата в формат API: `YYYY-MM-DD` в локальной зоне; `null` остаётся `null`. */
export function toApiDate(date: Date | null): string | null {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** ISO-строка с сервера в `Date` для поля; некорректные значения дают `null`. */
export function fromApiDate(iso: string | null | undefined): Date | null {
  if (!iso) return null

  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}
