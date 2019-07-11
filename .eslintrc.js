module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  'extends': 'airbnb',
  'globals': {
    'CONFIG': true,
  },
  'parser': 'babel-eslint',
  'settings': {
    'import/resolver': 'webpack',
  },
  'rules': {
    'import/no-cycle': [3],
    'import/no-extraneous-dependencies': ['error', { 'devDependencies': true }],
    'jsx-a11y/click-events-have-key-events': 0,
    'no-console': [0, { allow: ['warn', 'error'] }],
    'no-nested-ternary' : 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'react/destructuring-assignment': 'never',
    'react/forbid-prop-types': 0,
    'react/prefer-stateless-function': 0,
  },
};
