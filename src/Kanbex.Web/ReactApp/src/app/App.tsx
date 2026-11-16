import { BrowserRouter } from 'react-router'
import { ThemeProvider } from 'm3-expressive-react'
import { AuthProvider } from '../features/auth/index.js'
import { AppRouter } from '../routes/index.js'

/**
 * Корень React-приложения: тема Material 3, роутер и демонстрационная сессия.
 * `BrowserRouter` работает на корне сайта; Razor-хост отдаёт SPA для
 * клиентских маршрутов.
 */
export function App() {
  return (
    <ThemeProvider seedColor="#2f6b4f" mode="light">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
