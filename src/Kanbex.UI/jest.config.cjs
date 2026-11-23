const path = require('node:path')

/** Конфигурация Jest для библиотеки общих компонентов. */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.tsx'],
  restoreMocks: true,
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: path.join(__dirname, 'babel.config.cjs') }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/components/**/*.tsx', '!src/**/*.test.tsx'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
}
