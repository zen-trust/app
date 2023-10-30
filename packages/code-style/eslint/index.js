require('@rushstack/eslint-patch/modern-module-resolution')
const path = require('node:path')
const { defineConfig } = require('eslint-define-config')

const project = path.resolve(process.cwd(), 'tsconfig.app.json')

module.exports =
  defineConfig &&
  defineConfig({
    extends: [require.resolve('@vercel/style-guide/eslint/typescript')],
    parserOptions: {
      project,
      emitDecoratorMetadata: true,
      ecmaVersion: 'latest',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
    },
    ignorePatterns: ['node_modules/', 'dist/'],
    rules: {
      'no-nested-ternary': 'off',
    },
  })
