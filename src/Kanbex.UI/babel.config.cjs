/**
 * Babel используется только тестовым раннером Jest: production-сборку
 * выполняет TypeScript/Vite. Пресеты переводят TS/JSX в CommonJS,
 * который ожидает Jest.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
}
