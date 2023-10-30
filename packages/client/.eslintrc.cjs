const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig && defineConfig({
  root: true,
  env: {
    browser: true,
    es6: true,
    es2023: true
  },
  extends: [
    require.resolve("@zen-trust/code-style/eslint/browser"),
    "plugin:vue/vue3-essential",
    require.resolve("@vue/eslint-config-typescript"),
    require.resolve("@vue/eslint-config-prettier/skip-formatting")
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "import/no-extraneous-dependencies": "off",
    "no-nested-ternary": "off"
  },
  ignorePatterns: [
    "node_modules",
    "dist"
  ]
});
