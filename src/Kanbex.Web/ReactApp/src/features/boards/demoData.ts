import type { Board, BoardSummary, LearningTip } from '../../types/index.js'

/**
 * Демонстрационные данные для каркаса. Заменяются ответами API
 * (`/api/boards`) на этапе интеграции с сервером.
 */
export const demoBoard: Board = {
  id: '6f6b0e8f-0f6a-4f3e-9a1e-4b2f5c7d8e90',
  title: 'Учебная доска Kanban',
  description: 'Демонстрационный поток из трёх этапов: от идеи до готового результата.',
  columns: [
    {
      id: 'column-todo',
      title: 'К выполнению',
      wipLimit: null,
      order: 0,
      tasks: [
        {
          id: 'task-1',
          title: 'Разобраться, зачем визуализировать поток',
          description: 'Прочитайте вводную подсказку и сформулируйте, где в вашей работе теряется время.',
          priority: 'medium',
          order: 0,
        },
        {
          id: 'task-2',
          title: 'Собрать требования к доске',
          description: 'Короткий список того, что должна показывать доска: этапы, карточки, WIP-лимит.',
          priority: 'low',
          order: 1,
        },
        {
          id: 'task-3',
          title: 'Определить критерии готовности',
          description: 'Договоритесь, что считается завершённой работой, прежде чем двигать карточку в «Готово».',
          priority: 'low',
          order: 2,
        },
      ],
    },
    {
      id: 'column-in-progress',
      title: 'В работе',
      wipLimit: 2,
      order: 1,
      tasks: [
        {
          id: 'task-4',
          title: 'Настроить WIP-лимит колонки',
          description: 'Ограничьте число одновременных задач и проверьте, как интерфейс объясняет отказ.',
          priority: 'high',
          order: 0,
        },
        {
          id: 'task-5',
          title: 'Провести первый обзор доски',
          description: 'Пройдитесь по колонкам слева направо и отметьте «застрявшие» карточки.',
          priority: 'medium',
          order: 1,
        },
      ],
    },
    {
      id: 'column-done',
      title: 'Готово',
      wipLimit: null,
      order: 2,
      tasks: [
        {
          id: 'task-6',
          title: 'Создать учебную доску',
          description: 'Базовая доска с тремя этапами создана и сохранена.',
          priority: 'low',
          order: 0,
        },
      ],
    },
  ],
}

export const demoBoardSummaries: BoardSummary[] = [
  {
    id: demoBoard.id,
    title: demoBoard.title,
    description: demoBoard.description,
    taskCount: demoBoard.columns.reduce((total, column) => total + column.tasks.length, 0),
    columnCount: demoBoard.columns.length,
  },
]

export const demoUser = {
  id: 'demo-user',
  displayName: 'Учащийся',
  email: 'student@kanbex.local',
}

export const demoLearningTips: LearningTip[] = [
  {
    id: 'tip-wip',
    title: 'Зачем ограничивать WIP',
    body: 'Колонка «В работе» вмещает не больше двух задач. Ограничение заставляет завершать начатое, а не набирать новое.',
  },
  {
    id: 'tip-flow',
    title: 'Работа движется вправо',
    body: 'Карточка проходит этапы слева направо. Если задача задерживается, это видно без отчётов.',
  },
  {
    id: 'tip-pull',
    title: 'Сначала освободите место',
    body: 'Нельзя превысить лимит: сначала освободите слот в колонке, затем переносите следующую задачу.',
  },
]
