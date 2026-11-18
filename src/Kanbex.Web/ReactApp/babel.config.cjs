/**
 * Babel используется только тестовым раннером Jest: приложение собирает
 * Vite, а типы проверяет `tsc`. Пресеты переводят TS/JSX в CommonJS
 * для среды Jest.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
}
