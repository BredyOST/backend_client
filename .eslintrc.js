module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
      'react',
    '@typescript-eslint/eslint-plugin'
  ],
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/jsx-indent': [2, 4],    // правило для отступов, 4 отступа. (rules for whitespace).
    'react/jsx-indent-props': [2, 4],  // правило для отступов, 4 отступа. (rules for whitespace).
    'no-unused-vars': ["warn", { "args": "none" }], // проверяем используются ли переменные, если нет то предупреждаем, кроме аргументов
    'react/jsx-props-no-spreading': 'warn', // props не стоит разворачивать через spred
    "max-len": ['error', { ignoreComments: true,ignoreStrings:true, code: 350 }], // длинные строки допускаются в комментах и то что в литералах
    "no-console": ["error", { allow: ["warn", "error"] }],
    "prettier/prettier": ["error", {
      "semi": false,
      "ecmaFeatures": {
        "jsx": true,
      }
    }],
},
};
