const {defineConfig} = require("eslint-define-config");

module.exports = defineConfig && defineConfig({
    root: true,
    env: {
        node: true,
        es2023: true,
        es6: true
    },
    extends: [
        require.resolve("@zen-trust/code-style/eslint/node"),
        "plugin:@darraghor/nestjs-typed/recommended"
    ],
    plugins: ["@darraghor/nestjs-typed"],
    rules: {
        "no-console": "off",
        "import/no-extraneous-dependencies": "off",
        "@typescript-eslint/no-unnecessary-condition": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-extraneous-class": "off"
    },
    ignorePatterns: [
        "node_modules",
        "dist",
        "src/zapatos",
        "tsup.config.ts",
    ]
});
