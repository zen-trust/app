const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig && defineConfig({
  extends: [require.resolve('./index'), require.resolve('@vercel/style-guide/eslint/browser')],
})
