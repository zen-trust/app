const vercel = require("@vercel/style-guide/prettier");

module.exports = {
  ...vercel,
  semi: false,
  tabWidth: 2,
  singleQuote: true,
  printWidth: 100,
  trailingComma: "all"
};
