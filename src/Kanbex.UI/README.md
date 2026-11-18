# @kanbex/ui

Общая библиотека React-компонентов Kanbex. Содержит только переиспользуемое
представление и доступность: без доменной логики, HTTP-запросов, Identity и
зависимости от роутера.

## Компоненты

| Компонент | Назначение |
|---|---|
| `AppButton` | Единая кнопка на базе `Button` из `m3-expressive-react`. |
| `AppDialog` | Модальный диалог подтверждения или информирования. |
| `AppHeader` | Верхняя панель с навигацией и слотами действий. |
| `EmptyState` | Пустое состояние с пояснением и действием. |
| `KanbexLogo` | Встроенный SVG-логотип с палитрой бренда. |
| `LoadingState` | Индикация ожидания. |
| `StatusBadge` | Метка приоритета или статуса. |

## Подключение

Пакет является npm workspace и подключается в `Kanbex.Web/ReactApp` по имени
`@kanbex/ui`. Публичный API — `src/index.ts`, стили — `@kanbex/ui/styles.css`.

```tsx
import { AppButton, AppHeader, StatusBadge } from '@kanbex/ui'
import '@kanbex/ui/styles.css'
```

Стили используют токены `--md-sys-color-*`, которые выставляет `ThemeProvider`
из `m3-expressive-react`, поэтому библиотека автоматически следует теме
основного приложения. Фирменные цвета логотипа доступны как `--kb-color-violet`,
`--kb-color-violet-soft`, `--kb-color-red`, `--kb-color-red-soft`,
`--kb-color-green`, `--kb-color-green-soft`.

## Тесты

Компоненты покрыты unit-тестами на Jest (`jsdom`, Testing Library). Порог
покрытия — 70% по statements, branches, functions и lines:

```bash
npm test --workspace @kanbex/ui
npm run test:coverage --workspace @kanbex/ui
```

## Границы ответственности

Бизнес-логика доски (`BoardColumn`, `TaskCard`, WIP-правила), маршрутизация и
HTTP-запросы остаются в основном приложении.
