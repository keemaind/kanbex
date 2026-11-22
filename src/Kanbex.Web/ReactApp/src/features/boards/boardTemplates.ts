/** Готовые сценарии использования главной страницы: ключи совпадают
 *  с шаблонами seed data на C# API (`POST /api/boards/template/{key}`). */
export interface BoardTemplateInfo {
  /** Ключ шаблона на сервере. */
  key: 'student' | 'developer' | 'manager' | 'personal'
  /** Название карточки — для какой аудитории шаблон. */
  title: string
  /** Короткое описание сценария. */
  description: string
}

export const boardTemplates: readonly BoardTemplateInfo[] = [
  {
    key: 'student',
    title: 'Студент',
    description:
      'Дисциплины, дедлайны и подготовка к экзаменам: план на семестр, лабораторные и конспекты по колонкам.',
  },
  {
    key: 'developer',
    title: 'Разработчик',
    description:
      'Пет-проект от идеи до релиза: бэклог, работа, код-ревью и готовое — с типовыми задачами разработки.',
  },
  {
    key: 'manager',
    title: 'Менеджер',
    description:
      'Задачи команды: планирование спринта, синхронизация зависимостей, статус-отчёты и ретроспектива.',
  },
  {
    key: 'personal',
    title: 'Личное',
    description:
      'Дела на неделю без перегруза: список задач, WIP-лимит и панель «Готово» для личных планов.',
  },
]
