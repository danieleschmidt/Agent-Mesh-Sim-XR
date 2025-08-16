module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  overrides: [
    {
      files: ['src/utils/Logger.ts'],
      rules: {
        'no-console': 'off' // Console usage is intentional in Logger
      }
    },
    {
      files: ['src/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests for mocking
        '@typescript-eslint/no-unused-vars': 'off' // Allow unused vars in test setup
      }
    },
    {
      files: ['src/types/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off' // Types may need any for flexibility
      }
    }
  ]
}