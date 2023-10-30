const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig && defineConfig({
  root: true,
  extends: [
    require.resolve("@zen-trust/code-style/eslint")
  ],
  rules: {},
  "ignorePatterns": [
    "node_modules",
    "dist"
  ]
});
