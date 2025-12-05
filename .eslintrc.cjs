// core/.eslintrc.cjs
module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es2021: true,
        'vitest/globals': true
    },
    extends: [
        'eslint:recommended',
        'plugin:import/recommended',
        'plugin:prettier/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: [
        'import',
        'vitest',
        'prettier'
    ],
    rules: {
        'prettier/prettier': 'error',
        'no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        'import/order': ['error', {
            'groups': [
                'builtin',
                'external',
                'internal',
                'parent',
                'sibling',
                'index'
            ],
            'newlines-between': 'always',
            'alphabetize': {
                'order': 'asc',
                'caseInsensitive': true
            }
        }],
        'vitest/expect-expect': 'error',
        'vitest/no-disabled-tests': 'warn',
        'vitest/no-focused-tests': 'error',
        'vitest/no-identical-title': 'error'
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js']
            }
        }
    },
    overrides: [
        {
            files: ['**/*.test.js', '**/*.spec.js'],
            rules: {
                'no-unused-vars': 'off'
            }
        }
    ]
}