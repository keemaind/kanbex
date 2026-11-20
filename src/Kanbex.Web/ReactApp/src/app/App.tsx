import { BrowserRouter } from 'react-router'
import { AppThemeProvider } from '@kanbex/ui'
import { AuthProvider } from '../features/auth/index.js'
import { AppRouter } from '../routes/index.js'

/**
 * Корень React-приложения: тема Material 3, роутер и демонстрационная сессия.
 * `BrowserRouter` работает на корне сайта; Razor-хост отдаёт SPA для
 * клиентских маршрутов.
 */
export function App() {
  return (
    <AppThemeProvider seedColor="#7979FF" mode="light">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </AppThemeProvider>
  )
}

export default App
