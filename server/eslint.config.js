module.exports = [
  {
    ignores: [
      'node_modules/',
      'logs/',
      '/tmp/',
      '*.log',
      'package-lock.json',
      'public/'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script'
    },
    rules: {
      'no-console': 'off'
    }
  }
]
