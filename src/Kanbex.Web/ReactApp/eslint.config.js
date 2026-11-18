import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['coverage/**', 'dist/**', 'node_modules/**', '../wwwroot/ReactApp/**'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'comma-dangle': ['error', 'always-multiline'],
      'eol-last': ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'no-trailing-spaces': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
    },
  },
  {
    files: ['**/*.config.{ts,js}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
)
