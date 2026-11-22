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
| `KanbexMark` | Компактный знак Kanbex (три карточки и буквенный знак) для узких мест вроде навигационной панели. |
| `LoadingState` | Индикация ожидания. |
| `StatusBadge` | Метка приоритета или статуса. |
| `AppTextField`, `AppSelect`, `AppOption`, `AppIconButton`, `AppLinearProgress`, `AppMenu`, `AppMenuItem`, `AppNavigationDrawer`, `AppNavigationDrawerItem`, `AppThemeProvider` | Алиасы Material-компонентов из `m3-expressive-react`, чтобы приложение не импортировало стороннюю библиотеку напрямую. |

## Подключение

Пакет является npm workspace и подключается в `Kanbex.Web/ReactApp` по имени
`@kanbex/ui`. Публичный API — `src/index.ts`, стили — `@kanbex/ui/styles.css`.

```tsx
import { AppButton, AppHeader, StatusBadge } from '@kanbex/ui'
import '@kanbex/ui/styles.css'
```

Стили используют токены `--md-sys-color-*`, которые выставляет `ThemeProvider`
из `m3-expressive-react`, поэтому библиотека автоматически следует теме
основного приложения. `@kanbex/ui/styles.css` импортирует стили
`m3-expressive-react/styles.css`, так что приложению достаточно одного импорта.
Фирменная палитра Kanbex доступна как `--kb-color-lilac`,
`--kb-color-lilac-soft`, `--kb-color-purple`, `--kb-color-coral`,
`--kb-color-coral-soft`, `--kb-color-green`, `--kb-color-green-soft`,
`--kb-color-workspace`, `--kb-color-ink`, `--kb-color-ink-secondary`.

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
