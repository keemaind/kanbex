export type PluralForms = readonly [one: string, few: string, many: string]

/**
 * Выбирает русскую форму слова по числу: 1 проект, 2 проекта, 5 проектов.
 * Используется только для подписей интерфейса.
 */
export function pluralize(count: number, forms: PluralForms): string {
  const absolute = Math.abs(count)
  const mod10 = absolute % 10
  const mod100 = absolute % 100

  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}
