import { Navigate, Route, Routes } from 'react-router'
import {
  AboutPage,
  AccountPage,
  BoardPage,
  BoardsPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  RegisterPage,
} from '../pages/index.js'
import { MainMenuLayout } from '../app/MainMenuLayout.js'
import { RequireAuth } from '../app/RequireAuth.js'

/**
 * Дерево клиентских маршрутов: главная с боковым меню, проекты, доска
 * и служебные страницы.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <RequireAuth>
            <MainMenuLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/board" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        {/* Серверный путь /board из architecture.md — тот же SPA-хост. */}
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
