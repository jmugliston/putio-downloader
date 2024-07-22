import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    plugins: {},
    rules: {
      "no-unused-vars": "off",
    },
  },
  eslintConfigPrettier,
]
