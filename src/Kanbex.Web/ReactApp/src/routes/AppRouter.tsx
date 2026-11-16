import { Navigate, Route, Routes } from 'react-router'
import { AccountPage, BoardPage, BoardsPage, LoginPage, NotFoundPage, RegisterPage } from '../pages/index.js'
import { AppLayout } from '../app/AppLayout.js'
import { RequireAuth } from '../app/RequireAuth.js'

/**
 * Дерево клиентских маршрутов из architecture.md, раздел 8.3:
 * `/login`, `/register`, `/boards`, `/boards/:boardId`, `/account`.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boards" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        {/* Серверный путь /board из architecture.md — тот же SPA-хост. */}
        <Route path="/board" element={<BoardsPage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
